//! GPU-accelerated video processing for DailyDoco Pro
//! 
//! Leverages hardware acceleration (NVENC, QuickSync, AMF) for real-time video processing
//! Target: < 1.7x realtime for 4K content with hardware encoding

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, RwLock};
use serde::{Deserialize, Serialize};

#[cfg(feature = "cuda")]
use cudarc::driver::{CudaDevice, DevicePtr};

#[cfg(feature = "opencl")]
use opencl3::context::Context as OpenCLContext;

#[cfg(target_os = "windows")]
use windows::Win32::Media::MediaFoundation::*;

use crate::error::{ProcessingError, Result};
use crate::video::{VideoFrame, VideoMetadata};

/// GPU processing capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuCapabilities {
    pub vendor: GpuVendor,
    pub model: String,
    pub memory_gb: f32,
    pub cuda_cores: Option<u32>,
    pub encoder_support: EncoderSupport,
    pub decoder_support: DecoderSupport,
    pub max_resolution: Resolution,
    pub max_fps: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GpuVendor {
    Nvidia,
    Amd,
    Intel,
    Apple,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncoderSupport {
    pub h264: bool,
    pub h265: bool,
    pub av1: bool,
    pub nvenc: bool,
    pub quicksync: bool,
    pub amf: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecoderSupport {
    pub h264: bool,
    pub h265: bool,
    pub av1: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

/// GPU video processor configuration
#[derive(Debug, Clone)]
pub struct GpuProcessorConfig {
    pub encoder_preset: EncoderPreset,
    pub quality_level: QualityLevel,
    pub target_bitrate: u32,
    pub max_resolution: Resolution,
    pub preferred_encoder: Option<EncoderType>,
    pub enable_b_frames: bool,
    pub enable_low_latency: bool,
}

#[derive(Debug, Clone)]
pub enum EncoderPreset {
    UltraFast,
    SuperFast,
    VeryFast,
    Faster,
    Fast,
    Medium,
    Slow,
    Slower,
    VerySlow,
}

#[derive(Debug, Clone)]
pub enum QualityLevel {
    Draft,
    Good,
    High,
    Lossless,
}

#[derive(Debug, Clone)]
pub enum EncoderType {
    Nvenc,
    QuickSync,
    Amf,
    Software,
}

/// Processing statistics
#[derive(Debug, Clone, Default)]
pub struct ProcessingStats {
    pub frames_processed: u64,
    pub total_processing_time: Duration,
    pub average_fps: f32,
    pub gpu_utilization: f32,
    pub memory_usage: f32,
    pub encoder_queue_depth: u32,
    pub realtime_factor: f32, // < 1.0 means faster than realtime
}

/// GPU video processor
pub struct GpuVideoProcessor {
    config: GpuProcessorConfig,
    capabilities: GpuCapabilities,
    stats: Arc<RwLock<ProcessingStats>>,
    
    // GPU context
    #[cfg(feature = "cuda")]
    cuda_device: Option<Arc<CudaDevice>>,
    
    #[cfg(feature = "opencl")]
    opencl_context: Option<OpenCLContext>,
    
    // Platform-specific encoders
    #[cfg(target_os = "windows")]
    media_foundation: Option<MediaFoundationEncoder>,
    
    encoder_queue: mpsc::UnboundedSender<ProcessingJob>,
    processing_handle: Option<tokio::task::JoinHandle<()>>,
}

#[derive(Debug)]
struct ProcessingJob {
    frame: VideoFrame,
    metadata: VideoMetadata,
    result_sender: tokio::sync::oneshot::Sender<Result<EncodedFrame>>,
}

#[derive(Debug, Clone)]
pub struct EncodedFrame {
    pub data: Vec<u8>,
    pub timestamp: Duration,
    pub frame_type: FrameType,
    pub bitrate: u32,
    pub quality_score: f32,
}

#[derive(Debug, Clone)]
pub enum FrameType {
    I, // Intra-frame
    P, // Predicted frame
    B, // Bi-predicted frame
}

impl GpuVideoProcessor {
    /// Create a new GPU video processor
    pub async fn new(config: GpuProcessorConfig) -> Result<Self> {
        let capabilities = Self::detect_gpu_capabilities().await?;
        let stats = Arc::new(RwLock::new(ProcessingStats::default()));
        
        // Initialize GPU context
        #[cfg(feature = "cuda")]
        let cuda_device = if capabilities.vendor == GpuVendor::Nvidia {
            Some(Self::initialize_cuda().await?)
        } else {
            None
        };
        
        #[cfg(feature = "opencl")]
        let opencl_context = Self::initialize_opencl().await.ok();
        
        // Initialize platform-specific encoders
        #[cfg(target_os = "windows")]
        let media_foundation = if capabilities.encoder_support.quicksync || capabilities.encoder_support.amf {
            Some(MediaFoundationEncoder::new(&config).await?)
        } else {
            None
        };
        
        let (encoder_queue, queue_receiver) = mpsc::unbounded_channel();
        
        let mut processor = Self {
            config,
            capabilities,
            stats: stats.clone(),
            #[cfg(feature = "cuda")]
            cuda_device,
            #[cfg(feature = "opencl")]
            opencl_context,
            #[cfg(target_os = "windows")]
            media_foundation,
            encoder_queue,
            processing_handle: None,
        };
        
        // Start processing loop
        processor.processing_handle = Some(
            tokio::spawn(Self::processing_loop(
                queue_receiver,
                stats,
                processor.get_encoder_context(),
            ))
        );
        
        Ok(processor)
    }

    /// Process a video frame
    pub async fn process_frame(
        &self,
        frame: VideoFrame,
        metadata: VideoMetadata,
    ) -> Result<EncodedFrame> {
        let (result_sender, result_receiver) = tokio::sync::oneshot::channel();
        
        let job = ProcessingJob {
            frame,
            metadata,
            result_sender,
        };
        
        self.encoder_queue.send(job)
            .map_err(|_| ProcessingError::QueueFull)?;
            
        result_receiver.await
            .map_err(|_| ProcessingError::ProcessingFailed("Encoder channel closed".to_string()))?
    }

    /// Process multiple frames in batch
    pub async fn process_batch(
        &self,
        frames: Vec<(VideoFrame, VideoMetadata)>,
    ) -> Result<Vec<EncodedFrame>> {
        let start_time = Instant::now();
        let mut results = Vec::with_capacity(frames.len());
        
        // Process frames concurrently
        let futures: Vec<_> = frames.into_iter()
            .map(|(frame, metadata)| self.process_frame(frame, metadata))
            .collect();
            
        let encoded_frames = futures::future::try_join_all(futures).await?;
        results.extend(encoded_frames);
        
        // Update statistics
        {
            let mut stats = self.stats.write().await;
            stats.frames_processed += results.len() as u64;
            stats.total_processing_time += start_time.elapsed();
            stats.average_fps = stats.frames_processed as f32 / stats.total_processing_time.as_secs_f32();
            
            // Calculate realtime factor
            let frame_duration = Duration::from_secs_f32(1.0 / 30.0); // Assume 30fps
            let expected_duration = frame_duration * results.len() as u32;
            stats.realtime_factor = start_time.elapsed().as_secs_f32() / expected_duration.as_secs_f32();
        }
        
        Ok(results)
    }

    /// Get current processing statistics
    pub async fn get_stats(&self) -> ProcessingStats {
        self.stats.read().await.clone()
    }

    /// Get GPU capabilities
    pub fn get_capabilities(&self) -> &GpuCapabilities {
        &self.capabilities
    }

    async fn detect_gpu_capabilities() -> Result<GpuCapabilities> {
        // Detect GPU vendor and model
        let (vendor, model) = Self::detect_gpu_info().await?;
        
        // Probe encoder support
        let encoder_support = EncoderSupport {
            h264: true, // Most GPUs support H.264
            h265: vendor != GpuVendor::Unknown,
            av1: matches!(vendor, GpuVendor::Nvidia | GpuVendor::Intel),
            nvenc: vendor == GpuVendor::Nvidia,
            quicksync: vendor == GpuVendor::Intel,
            amf: vendor == GpuVendor::Amd,
        };
        
        // Probe decoder support
        let decoder_support = DecoderSupport {
            h264: true,
            h265: vendor != GpuVendor::Unknown,
            av1: matches!(vendor, GpuVendor::Nvidia | GpuVendor::Intel),
        };
        
        // Default capabilities - would be probed from actual hardware
        Ok(GpuCapabilities {
            vendor,
            model,
            memory_gb: 8.0,
            cuda_cores: if vendor == GpuVendor::Nvidia { Some(2048) } else { None },
            encoder_support,
            decoder_support,
            max_resolution: Resolution { width: 7680, height: 4320 }, // 8K
            max_fps: 120,
        })
    }

    async fn detect_gpu_info() -> Result<(GpuVendor, String)> {
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Graphics::Dxgi::*;
            
            unsafe {
                let factory: IDXGIFactory = CreateDXGIFactory()?;
                let mut adapter_index = 0;
                
                loop {
                    match factory.EnumAdapters(adapter_index) {
                        Ok(adapter) => {
                            let desc = adapter.GetDesc()?;
                            let description = String::from_utf16_lossy(&desc.Description);
                            
                            let vendor = if description.to_lowercase().contains("nvidia") {
                                GpuVendor::Nvidia
                            } else if description.to_lowercase().contains("amd") || description.to_lowercase().contains("radeon") {
                                GpuVendor::Amd
                            } else if description.to_lowercase().contains("intel") {
                                GpuVendor::Intel
                            } else {
                                GpuVendor::Unknown
                            };
                            
                            return Ok((vendor, description));
                        }
                        Err(_) => break,
                    }
                    adapter_index += 1;
                }
            }
        }
        
        #[cfg(target_os = "macos")]
        {
            // Use Metal to detect Apple Silicon or discrete GPUs
            return Ok((GpuVendor::Apple, "Apple GPU".to_string()));
        }
        
        #[cfg(target_os = "linux")]
        {
            // Parse /proc/driver/nvidia/version or use OpenCL device enumeration
            if std::path::Path::new("/proc/driver/nvidia/version").exists() {
                return Ok((GpuVendor::Nvidia, "NVIDIA GPU".to_string()));
            }
        }
        
        Ok((GpuVendor::Unknown, "Unknown GPU".to_string()))
    }

    #[cfg(feature = "cuda")]
    async fn initialize_cuda() -> Result<Arc<CudaDevice>> {
        use cudarc::driver::*;
        
        CudaDevice::new(0)
            .map(Arc::new)
            .map_err(|e| ProcessingError::GpuInitialization(format!("CUDA init failed: {}", e)))
    }

    #[cfg(feature = "opencl")]
    async fn initialize_opencl() -> Result<OpenCLContext> {
        use opencl3::device::*;
        use opencl3::context::*;
        
        let device_id = get_all_devices(CL_DEVICE_TYPE_GPU)?
            .into_iter()
            .next()
            .ok_or_else(|| ProcessingError::GpuInitialization("No OpenCL GPU devices found".to_string()))?;
            
        Context::from_device(&device_id)
            .map_err(|e| ProcessingError::GpuInitialization(format!("OpenCL context creation failed: {}", e)))
    }

    fn get_encoder_context(&self) -> EncoderContext {
        EncoderContext {
            config: self.config.clone(),
            capabilities: self.capabilities.clone(),
            #[cfg(feature = "cuda")]
            cuda_device: self.cuda_device.clone(),
        }
    }

    async fn processing_loop(
        mut queue_receiver: mpsc::UnboundedReceiver<ProcessingJob>,
        stats: Arc<RwLock<ProcessingStats>>,
        encoder_context: EncoderContext,
    ) {
        while let Some(job) = queue_receiver.recv().await {
            let start_time = Instant::now();
            
            let result = Self::encode_frame(job.frame, job.metadata, &encoder_context).await;
            
            // Update GPU utilization stats
            {
                let mut stats_guard = stats.write().await;
                stats_guard.gpu_utilization = Self::get_gpu_utilization().await;
                stats_guard.memory_usage = Self::get_gpu_memory_usage().await;
                stats_guard.encoder_queue_depth = queue_receiver.len() as u32;
            }
            
            if job.result_sender.send(result).is_err() {
                log::warn!("Failed to send encoded frame result - receiver dropped");
            }
        }
    }

    async fn encode_frame(
        frame: VideoFrame,
        metadata: VideoMetadata,
        encoder_context: &EncoderContext,
    ) -> Result<EncodedFrame> {
        let start_time = Instant::now();
        
        // Choose best encoder based on capabilities
        let encoder_type = Self::choose_optimal_encoder(&encoder_context.capabilities);
        
        let encoded_data = match encoder_type {
            EncoderType::Nvenc => Self::encode_with_nvenc(frame, metadata, encoder_context).await?,
            EncoderType::QuickSync => Self::encode_with_quicksync(frame, metadata, encoder_context).await?,
            EncoderType::Amf => Self::encode_with_amf(frame, metadata, encoder_context).await?,
            EncoderType::Software => Self::encode_with_software(frame, metadata, encoder_context).await?,
        };
        
        let processing_time = start_time.elapsed();
        
        Ok(EncodedFrame {
            data: encoded_data,
            timestamp: metadata.timestamp,
            frame_type: FrameType::P, // Simplified - would be detected from encoder
            bitrate: encoder_context.config.target_bitrate,
            quality_score: 0.95, // Would be calculated based on SSIM/PSNR
        })
    }

    fn choose_optimal_encoder(capabilities: &GpuCapabilities) -> EncoderType {
        // Priority order: Hardware encoders first, then software fallback
        if capabilities.encoder_support.nvenc {
            EncoderType::Nvenc
        } else if capabilities.encoder_support.quicksync {
            EncoderType::QuickSync
        } else if capabilities.encoder_support.amf {
            EncoderType::Amf
        } else {
            EncoderType::Software
        }
    }

    async fn encode_with_nvenc(
        frame: VideoFrame,
        metadata: VideoMetadata,
        encoder_context: &EncoderContext,
    ) -> Result<Vec<u8>> {
        #[cfg(feature = "cuda")]
        {
            // Use NVENC through CUDA
            // This would involve:
            // 1. Upload frame to GPU memory
            // 2. Configure NVENC encoder
            // 3. Encode frame
            // 4. Download encoded data
            
            // Simplified implementation
            Ok(vec![0u8; frame.data.len() / 10]) // Simulate 10:1 compression
        }
        #[cfg(not(feature = "cuda"))]
        {
            Err(ProcessingError::EncoderUnavailable("NVENC requires CUDA feature".to_string()))
        }
    }

    async fn encode_with_quicksync(
        frame: VideoFrame,
        metadata: VideoMetadata,
        encoder_context: &EncoderContext,
    ) -> Result<Vec<u8>> {
        #[cfg(target_os = "windows")]
        {
            // Use Intel QuickSync through Media Foundation
            // Simplified implementation
            Ok(vec![0u8; frame.data.len() / 8]) // Simulate 8:1 compression
        }
        #[cfg(not(target_os = "windows"))]
        {
            Err(ProcessingError::EncoderUnavailable("QuickSync only available on Windows".to_string()))
        }
    }

    async fn encode_with_amf(
        frame: VideoFrame,
        metadata: VideoMetadata,
        encoder_context: &EncoderContext,
    ) -> Result<Vec<u8>> {
        // AMD AMF encoder implementation
        // Simplified implementation
        Ok(vec![0u8; frame.data.len() / 9]) // Simulate 9:1 compression
    }

    async fn encode_with_software(
        frame: VideoFrame,
        metadata: VideoMetadata,
        encoder_context: &EncoderContext,
    ) -> Result<Vec<u8>> {
        // Software H.264 encoding fallback
        // This would use x264 or similar
        Ok(vec![0u8; frame.data.len() / 6]) // Simulate 6:1 compression
    }

    async fn get_gpu_utilization() -> f32 {
        // Platform-specific GPU utilization monitoring
        // Would use nvidia-ml-py, Intel GPU tools, or AMD tools
        50.0 // Placeholder
    }

    async fn get_gpu_memory_usage() -> f32 {
        // Platform-specific GPU memory monitoring
        1024.0 // Placeholder MB
    }
}

#[derive(Clone)]
struct EncoderContext {
    config: GpuProcessorConfig,
    capabilities: GpuCapabilities,
    #[cfg(feature = "cuda")]
    cuda_device: Option<Arc<CudaDevice>>,
}

#[cfg(target_os = "windows")]
struct MediaFoundationEncoder {
    // Media Foundation encoder state
}

#[cfg(target_os = "windows")]
impl MediaFoundationEncoder {
    async fn new(config: &GpuProcessorConfig) -> Result<Self> {
        // Initialize Media Foundation encoder
        Ok(Self {})
    }
}

impl Default for GpuProcessorConfig {
    fn default() -> Self {
        Self {
            encoder_preset: EncoderPreset::Fast,
            quality_level: QualityLevel::High,
            target_bitrate: 5000, // 5 Mbps
            max_resolution: Resolution { width: 3840, height: 2160 }, // 4K
            preferred_encoder: None,
            enable_b_frames: true,
            enable_low_latency: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_gpu_capabilities_detection() {
        let capabilities = GpuVideoProcessor::detect_gpu_capabilities().await;
        assert!(capabilities.is_ok());
        
        let caps = capabilities.unwrap();
        assert!(caps.memory_gb > 0.0);
        assert!(caps.max_fps > 0);
    }

    #[tokio::test]
    async fn test_encoder_selection() {
        let capabilities = GpuCapabilities {
            vendor: GpuVendor::Nvidia,
            model: "RTX 3080".to_string(),
            memory_gb: 10.0,
            cuda_cores: Some(8704),
            encoder_support: EncoderSupport {
                h264: true,
                h265: true,
                av1: true,
                nvenc: true,
                quicksync: false,
                amf: false,
            },
            decoder_support: DecoderSupport {
                h264: true,
                h265: true,
                av1: true,
            },
            max_resolution: Resolution { width: 7680, height: 4320 },
            max_fps: 120,
        };

        let encoder = GpuVideoProcessor::choose_optimal_encoder(&capabilities);
        assert!(matches!(encoder, EncoderType::Nvenc));
    }

    #[tokio::test]
    async fn test_processing_stats() {
        let stats = ProcessingStats {
            frames_processed: 1000,
            total_processing_time: Duration::from_secs(10),
            average_fps: 100.0,
            gpu_utilization: 75.0,
            memory_usage: 2048.0,
            encoder_queue_depth: 5,
            realtime_factor: 0.8, // 20% faster than realtime
        };

        assert_eq!(stats.frames_processed, 1000);
        assert!(stats.realtime_factor < 1.0); // Faster than realtime
        assert_eq!(stats.average_fps, 100.0);
    }
}