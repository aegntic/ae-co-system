//! Visual enhancement module for aegnt-27
//! 
//! This module provides sophisticated visual authenticity enhancement for video content,
//! including natural gaze patterns, micro-expressions, lighting variations, and
//! visual artifacts that make AI-generated or processed video appear more human-like.

use std::time::Duration;
use serde::{Deserialize, Serialize};
// use rand::prelude::*;

use crate::error::{Aegnt27Error, VisualError, Result};
use crate::utils::{math::Point2D, random::HumanRng, validation};

/// Configuration for visual enhancement behavior
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualConfig {
    /// Video resolution width
    pub frame_width: u32,
    
    /// Video resolution height
    pub frame_height: u32,
    
    /// Target frame rate (15-120 fps)
    pub frame_rate: f64,
    
    /// Color space ("rgb", "yuv420p", "yuv444p")
    pub color_space: String,
    
    /// Enable natural gaze pattern simulation
    pub enable_gaze_patterns: bool,
    
    /// Gaze pattern intensity (0.0-1.0)
    pub gaze_pattern_intensity: f64,
    
    /// Enable micro-expression injection
    pub enable_micro_expressions: bool,
    
    /// Micro-expression frequency (0.0-1.0)
    pub micro_expression_frequency: f64,
    
    /// Enable lighting variation simulation
    pub enable_lighting_variations: bool,
    
    /// Lighting variation intensity (0.0-1.0)
    pub lighting_variation_intensity: f64,
    
    /// Enable natural camera shake
    pub enable_camera_shake: bool,
    
    /// Camera shake intensity (0.0-1.0)
    pub camera_shake_intensity: f64,
    
    /// Enable compression artifacts
    pub enable_compression_artifacts: bool,
    
    /// Compression quality (1-100, lower = more artifacts)
    pub compression_quality: u8,
    
    /// Enable color grading variations
    pub enable_color_grading: bool,
    
    /// Color grading intensity (0.0-1.0)
    pub color_grading_intensity: f64,
    
    /// Enable natural focus variations
    pub enable_focus_variations: bool,
    
    /// Focus variation intensity (0.0-1.0)
    pub focus_variation_intensity: f64,
}

impl Default for VisualConfig {
    fn default() -> Self {
        Self {
            frame_width: 1920,
            frame_height: 1080,
            frame_rate: 30.0,
            color_space: "rgb".to_string(),
            enable_gaze_patterns: true,
            gaze_pattern_intensity: 0.3,
            enable_micro_expressions: true,
            micro_expression_frequency: 0.1,
            enable_lighting_variations: true,
            lighting_variation_intensity: 0.15,
            enable_camera_shake: true,
            camera_shake_intensity: 0.05,
            enable_compression_artifacts: true,
            compression_quality: 85,
            enable_color_grading: true,
            color_grading_intensity: 0.1,
            enable_focus_variations: true,
            focus_variation_intensity: 0.08,
        }
    }
}

/// Represents a single video frame with metadata
#[derive(Debug, Clone)]
pub struct VideoFrame {
    /// Frame data (RGB or YUV format)
    pub data: Vec<u8>,
    
    /// Frame width in pixels
    pub width: u32,
    
    /// Frame height in pixels
    pub height: u32,
    
    /// Color space format
    pub color_space: ColorSpace,
    
    /// Frame timestamp
    pub timestamp: Duration,
    
    /// Frame metadata
    pub metadata: FrameMetadata,
}

impl VideoFrame {
    /// Creates a new video frame
    pub fn new(
        data: Vec<u8>,
        width: u32,
        height: u32,
        color_space: ColorSpace,
        timestamp: Duration,
    ) -> Self {
        Self {
            data,
            width,
            height,
            color_space,
            timestamp,
            metadata: FrameMetadata::default(),
        }
    }
    
    /// Validates frame data integrity
    pub fn validate(&self) -> Result<()> {
        let expected_size = match self.color_space {
            ColorSpace::RGB => (self.width * self.height * 3) as usize,
            ColorSpace::YUV420P => (self.width * self.height * 3 / 2) as usize,
            ColorSpace::YUV444P => (self.width * self.height * 3) as usize,
        };
        
        if self.data.len() != expected_size {
            return Err(Aegnt27Error::Visual(VisualError::InvalidFormat(
                format!(
                    "Frame data size mismatch: expected {}, got {}",
                    expected_size,
                    self.data.len()
                ),
            )));
        }
        
        if self.width == 0 || self.height == 0 {
            return Err(Aegnt27Error::Visual(VisualError::UnsupportedResolution {
                width: self.width,
                height: self.height,
            }));
        }
        
        Ok(())
    }
    
    /// Gets the frame's aspect ratio
    pub fn aspect_ratio(&self) -> f64 {
        self.width as f64 / self.height as f64
    }
    
    /// Converts frame to RGB format if not already
    pub fn to_rgb(&self) -> Result<VideoFrame> {
        match self.color_space {
            ColorSpace::RGB => Ok(self.clone()),
            ColorSpace::YUV420P => self.yuv420p_to_rgb(),
            ColorSpace::YUV444P => self.yuv444p_to_rgb(),
        }
    }
    
    fn yuv420p_to_rgb(&self) -> Result<VideoFrame> {
        // Simplified YUV to RGB conversion
        let width = self.width as usize;
        let height = self.height as usize;
        let mut rgb_data = Vec::with_capacity(width * height * 3);
        
        let y_plane_size = width * height;
        let u_plane_size = width * height / 4;
        let v_plane_size = width * height / 4;
        
        if self.data.len() < y_plane_size + u_plane_size + v_plane_size {
            return Err(Aegnt27Error::Visual(VisualError::InvalidFormat(
                "Insufficient YUV420P data".to_string(),
            )));
        }
        
        for y in 0..height {
            for x in 0..width {
                let y_index = y * width + x;
                let uv_index = (y / 2) * (width / 2) + (x / 2);
                
                let y_val = self.data[y_index] as f32;
                let u_val = self.data[y_plane_size + uv_index] as f32 - 128.0;
                let v_val = self.data[y_plane_size + u_plane_size + uv_index] as f32 - 128.0;
                
                // YUV to RGB conversion
                let r = (y_val + 1.402 * v_val).clamp(0.0, 255.0) as u8;
                let g = (y_val - 0.344 * u_val - 0.714 * v_val).clamp(0.0, 255.0) as u8;
                let b = (y_val + 1.772 * u_val).clamp(0.0, 255.0) as u8;
                
                rgb_data.push(r);
                rgb_data.push(g);
                rgb_data.push(b);
            }
        }
        
        Ok(VideoFrame::new(
            rgb_data,
            self.width,
            self.height,
            ColorSpace::RGB,
            self.timestamp,
        ))
    }
    
    fn yuv444p_to_rgb(&self) -> Result<VideoFrame> {
        // Simplified YUV444P to RGB conversion
        let pixel_count = (self.width * self.height) as usize;
        let mut rgb_data = Vec::with_capacity(pixel_count * 3);
        
        if self.data.len() < pixel_count * 3 {
            return Err(Aegnt27Error::Visual(VisualError::InvalidFormat(
                "Insufficient YUV444P data".to_string(),
            )));
        }
        
        for i in 0..pixel_count {
            let y_val = self.data[i] as f32;
            let u_val = self.data[pixel_count + i] as f32 - 128.0;
            let v_val = self.data[pixel_count * 2 + i] as f32 - 128.0;
            
            // YUV to RGB conversion
            let r = (y_val + 1.402 * v_val).clamp(0.0, 255.0) as u8;
            let g = (y_val - 0.344 * u_val - 0.714 * v_val).clamp(0.0, 255.0) as u8;
            let b = (y_val + 1.772 * u_val).clamp(0.0, 255.0) as u8;
            
            rgb_data.push(r);
            rgb_data.push(g);
            rgb_data.push(b);
        }
        
        Ok(VideoFrame::new(
            rgb_data,
            self.width,
            self.height,
            ColorSpace::RGB,
            self.timestamp,
        ))
    }
}

/// Supported color spaces
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ColorSpace {
    /// Red, Green, Blue
    RGB,
    /// YUV 4:2:0 planar
    YUV420P,
    /// YUV 4:4:4 planar
    YUV444P,
}

impl ColorSpace {
    pub fn from_string(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "rgb" => Ok(ColorSpace::RGB),
            "yuv420p" => Ok(ColorSpace::YUV420P),
            "yuv444p" => Ok(ColorSpace::YUV444P),
            _ => Err(Aegnt27Error::Visual(VisualError::InvalidFormat(
                format!("Unsupported color space: {}", s),
            ))),
        }
    }
}

/// Frame metadata for analysis and processing
#[derive(Debug, Clone, Default)]
pub struct FrameMetadata {
    /// Average brightness (0.0-1.0)
    pub average_brightness: f32,
    
    /// Contrast level (0.0-1.0)
    pub contrast_level: f32,
    
    /// Motion vector magnitude
    pub motion_magnitude: f32,
    
    /// Focus quality estimate (0.0-1.0)
    pub focus_quality: f32,
    
    /// Noise level estimate (0.0-1.0)
    pub noise_level: f32,
    
    /// Face detection results
    pub faces: Vec<FaceRegion>,
}

/// Detected face region information
#[derive(Debug, Clone)]
pub struct FaceRegion {
    /// Bounding box of the face
    pub bounds: Rectangle,
    
    /// Confidence of face detection (0.0-1.0)
    pub confidence: f32,
    
    /// Eye positions if detected
    pub eyes: Option<(Point2D, Point2D)>,
    
    /// Mouth position if detected
    pub mouth: Option<Point2D>,
}

/// Rectangle for bounding boxes
#[derive(Debug, Clone)]
pub struct Rectangle {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

/// Natural gaze pattern for human-like eye movement
#[derive(Debug, Clone)]
pub struct GazePattern {
    /// Gaze points over time
    pub gaze_points: Vec<GazePoint>,
    
    /// Total duration of the pattern
    pub duration: Duration,
    
    /// Pattern type
    pub pattern_type: GazePatternType,
}

impl GazePattern {
    /// Gets the gaze point at a specific time
    pub fn get_gaze_at_time(&self, time: Duration) -> Option<Point2D> {
        if self.gaze_points.is_empty() {
            return None;
        }
        
        // Find the appropriate gaze point
        for window in self.gaze_points.windows(2) {
            if time >= window[0].timestamp && time <= window[1].timestamp {
                // Interpolate between the two points
                let t = (time.as_secs_f64() - window[0].timestamp.as_secs_f64())
                    / (window[1].timestamp.as_secs_f64() - window[0].timestamp.as_secs_f64());
                
                return Some(window[0].position.lerp(&window[1].position, t));
            }
        }
        
        // Return the last point if time exceeds duration
        self.gaze_points.last().map(|p| p.position)
    }
}

/// Individual gaze point with timing
#[derive(Debug, Clone)]
pub struct GazePoint {
    /// Position on screen (normalized 0.0-1.0)
    pub position: Point2D,
    
    /// Timestamp of this gaze point
    pub timestamp: Duration,
    
    /// Fixation duration at this point
    pub fixation_duration: Duration,
    
    /// Gaze confidence/intensity
    pub intensity: f32,
}

/// Types of gaze patterns
#[derive(Debug, Clone, PartialEq)]
pub enum GazePatternType {
    /// Reading pattern (left to right, top to bottom)
    Reading,
    /// Scanning pattern (systematic exploration)
    Scanning,
    /// Focused attention (small area)
    Focused,
    /// Random exploration
    Exploration,
    /// Following movement
    Tracking,
}

/// The main visual enhancement engine
pub struct VisualEnhancer {
    config: VisualConfig,
    rng: HumanRng,
}

impl VisualEnhancer {
    /// Creates a new visual enhancer with the given configuration
    pub async fn new(config: VisualConfig) -> Result<Self> {
        // Validate configuration
        validation::validate_range(config.frame_width, 128, 7680, "frame_width")?;
        validation::validate_range(config.frame_height, 128, 4320, "frame_height")?;
        validation::validate_range(config.frame_rate, 10.0, 120.0, "frame_rate")?;
        validation::validate_range(config.gaze_pattern_intensity, 0.0, 1.0, "gaze_pattern_intensity")?;
        validation::validate_range(config.compression_quality, 1, 100, "compression_quality")?;
        
        ColorSpace::from_string(&config.color_space)?;
        
        Ok(Self {
            config,
            rng: HumanRng::new(),
        })
    }
    
    /// Enhances visual authenticity of video frames
    pub async fn enhance_frames(&mut self, frames: &[VideoFrame]) -> Result<Vec<VideoFrame>> {
        let mut enhanced_frames = Vec::with_capacity(frames.len());
        
        for (i, frame) in frames.iter().enumerate() {
            frame.validate()?;
            
            let mut enhanced_frame = frame.clone();
            
            // Apply lighting variations
            if self.config.enable_lighting_variations {
                enhanced_frame = self.apply_lighting_variations(enhanced_frame, i).await?;
            }
            
            // Apply camera shake
            if self.config.enable_camera_shake {
                enhanced_frame = self.apply_camera_shake(enhanced_frame, i).await?;
            }
            
            // Apply color grading
            if self.config.enable_color_grading {
                enhanced_frame = self.apply_color_grading(enhanced_frame).await?;
            }
            
            // Apply focus variations
            if self.config.enable_focus_variations {
                enhanced_frame = self.apply_focus_variations(enhanced_frame).await?;
            }
            
            // Apply compression artifacts
            if self.config.enable_compression_artifacts {
                enhanced_frame = self.apply_compression_artifacts(enhanced_frame).await?;
            }
            
            enhanced_frames.push(enhanced_frame);
        }
        
        Ok(enhanced_frames)
    }
    
    /// Generates natural gaze patterns for human-like eye movement
    pub async fn generate_gaze_pattern(&mut self, duration: Duration) -> Result<GazePattern> {
        let pattern_type = self.select_gaze_pattern_type().await;
        let mut gaze_points = Vec::new();
        
        let num_points = (duration.as_secs_f64() * 2.0) as usize; // 2 gaze points per second
        let mut current_time = Duration::ZERO;
        let time_step = duration / num_points as u32;
        
        for i in 0..num_points {
            let position = self.generate_gaze_position(&pattern_type, i, num_points).await?;
            let fixation_duration = self.generate_fixation_duration(&pattern_type).await;
            let intensity = self.generate_gaze_intensity(&pattern_type).await;
            
            gaze_points.push(GazePoint {
                position,
                timestamp: current_time,
                fixation_duration,
                intensity,
            });
            
            current_time += time_step;
        }
        
        Ok(GazePattern {
            gaze_points,
            duration,
            pattern_type,
        })
    }
    
    async fn apply_lighting_variations(&mut self, mut frame: VideoFrame, frame_index: usize) -> Result<VideoFrame> {
        let rgb_frame = frame.to_rgb()?;
        let mut data = rgb_frame.data;
        
        // Generate time-based lighting variation
        let time_factor = frame_index as f64 * 0.01; // Slow variation
        let lighting_variation = (time_factor.sin() * self.config.lighting_variation_intensity) as f32;
        
        // Apply lighting change to each pixel
        for i in (0..data.len()).step_by(3) {
            let r = data[i] as f32;
            let g = data[i + 1] as f32;
            let b = data[i + 2] as f32;
            
            // Apply variation with slight randomness
            let pixel_variation = lighting_variation + (self.rng.gen::<f32>() - 0.5) * 0.02;
            let brightness_factor = 1.0 + pixel_variation;
            
            data[i] = (r * brightness_factor).clamp(0.0, 255.0) as u8;
            data[i + 1] = (g * brightness_factor).clamp(0.0, 255.0) as u8;
            data[i + 2] = (b * brightness_factor).clamp(0.0, 255.0) as u8;
        }
        
        frame.data = data;
        Ok(frame)
    }
    
    async fn apply_camera_shake(&mut self, mut frame: VideoFrame, frame_index: usize) -> Result<VideoFrame> {
        let shake_intensity = self.config.camera_shake_intensity;
        
        // Generate shake offset
        let shake_x = self.rng.bounded_normal(0.0, shake_intensity * 2.0, -5.0, 5.0) as i32;
        let shake_y = self.rng.bounded_normal(0.0, shake_intensity * 2.0, -5.0, 5.0) as i32;
        
        // Apply shake by shifting the frame (simplified implementation)
        // In a real implementation, this would involve proper image translation
        if shake_x != 0 || shake_y != 0 {
            // For now, just add a small amount of noise to simulate shake
            let rgb_frame = frame.to_rgb()?;
            let mut data = rgb_frame.data;
            
            for i in 0..data.len() {
                let noise = (self.rng.gen::<f32>() - 0.5) * shake_intensity as f32 * 5.0;
                data[i] = (data[i] as f32 + noise).clamp(0.0, 255.0) as u8;
            }
            
            frame.data = data;
        }
        
        Ok(frame)
    }
    
    async fn apply_color_grading(&mut self, mut frame: VideoFrame) -> Result<VideoFrame> {
        let rgb_frame = frame.to_rgb()?;
        let mut data = rgb_frame.data;
        
        let intensity = self.config.color_grading_intensity;
        
        // Generate color adjustments
        let red_adjust = self.rng.bounded_normal(1.0, intensity * 0.1, 0.8, 1.2) as f32;
        let green_adjust = self.rng.bounded_normal(1.0, intensity * 0.1, 0.8, 1.2) as f32;
        let blue_adjust = self.rng.bounded_normal(1.0, intensity * 0.1, 0.8, 1.2) as f32;
        
        // Apply color grading
        for i in (0..data.len()).step_by(3) {
            data[i] = (data[i] as f32 * red_adjust).clamp(0.0, 255.0) as u8;
            data[i + 1] = (data[i + 1] as f32 * green_adjust).clamp(0.0, 255.0) as u8;
            data[i + 2] = (data[i + 2] as f32 * blue_adjust).clamp(0.0, 255.0) as u8;
        }
        
        frame.data = data;
        Ok(frame)
    }
    
    async fn apply_focus_variations(&mut self, mut frame: VideoFrame) -> Result<VideoFrame> {
        // Simulate focus variations by applying slight blur to random regions
        let intensity = self.config.focus_variation_intensity;
        
        if self.rng.gen::<f32>() < intensity as f32 {
            let rgb_frame = frame.to_rgb()?;
            let mut data = rgb_frame.data;
            
            // Apply subtle blur effect (simplified)
            let width = frame.width as usize;
            let height = frame.height as usize;
            
            for y in 1..height - 1 {
                for x in 1..width - 1 {
                    if self.rng.gen::<f32>() < 0.1 { // Apply to 10% of pixels
                        for c in 0..3 {
                            let idx = (y * width + x) * 3 + c;
                            let neighbors = [
                                data[((y - 1) * width + x) * 3 + c] as u32,
                                data[(y * width + x - 1) * 3 + c] as u32,
                                data[(y * width + x + 1) * 3 + c] as u32,
                                data[((y + 1) * width + x) * 3 + c] as u32,
                            ];
                            
                            let avg = (neighbors.iter().sum::<u32>() / 4) as u8;
                            data[idx] = ((data[idx] as u32 + avg as u32) / 2) as u8;
                        }
                    }
                }
            }
            
            frame.data = data;
        }
        
        Ok(frame)
    }
    
    async fn apply_compression_artifacts(&mut self, mut frame: VideoFrame) -> Result<VideoFrame> {
        let quality = self.config.compression_quality as f32 / 100.0;
        
        // Simulate compression artifacts by quantizing colors
        let rgb_frame = frame.to_rgb()?;
        let mut data = rgb_frame.data;
        
        let quantization_factor = (1.0 - quality) * 16.0 + 1.0;
        
        for pixel in data.iter_mut() {
            let quantized = (*pixel as f32 / quantization_factor).round() * quantization_factor;
            *pixel = quantized.clamp(0.0, 255.0) as u8;
        }
        
        frame.data = data;
        Ok(frame)
    }
    
    async fn select_gaze_pattern_type(&mut self) -> GazePatternType {
        let patterns = [
            (GazePatternType::Reading, 0.25),
            (GazePatternType::Scanning, 0.2),
            (GazePatternType::Focused, 0.2),
            (GazePatternType::Exploration, 0.25),
            (GazePatternType::Tracking, 0.1),
        ];
        
        self.rng.weighted_choice(&patterns)
            .unwrap_or(&GazePatternType::Exploration)
            .clone()
    }
    
    async fn generate_gaze_position(
        &mut self,
        pattern_type: &GazePatternType,
        index: usize,
        total_points: usize,
    ) -> Result<Point2D> {
        let intensity = self.config.gaze_pattern_intensity;
        
        match pattern_type {
            GazePatternType::Reading => {
                // Left to right, top to bottom pattern
                let progress = index as f64 / total_points as f64;
                let lines = 5.0; // Assume 5 lines of text
                let line = (progress * lines).floor();
                let line_progress = (progress * lines) - line;
                
                let x = line_progress;
                let y = (line + 0.5) / lines;
                
                // Add some natural variation
                let x_var = self.rng.bounded_normal(0.0, intensity * 0.1, -0.1, 0.1);
                let y_var = self.rng.bounded_normal(0.0, intensity * 0.05, -0.05, 0.05);
                
                Ok(Point2D::new(
                    (x + x_var).clamp(0.0, 1.0),
                    (y + y_var).clamp(0.0, 1.0),
                ))
            }
            
            GazePatternType::Scanning => {
                // Systematic grid pattern
                let grid_size = (total_points as f64).sqrt().ceil() as usize;
                let grid_x = index % grid_size;
                let grid_y = index / grid_size;
                
                let x = (grid_x as f64 + 0.5) / grid_size as f64;
                let y = (grid_y as f64 + 0.5) / grid_size as f64;
                
                let x_var = self.rng.bounded_normal(0.0, intensity * 0.15, -0.2, 0.2);
                let y_var = self.rng.bounded_normal(0.0, intensity * 0.15, -0.2, 0.2);
                
                Ok(Point2D::new(
                    (x + x_var).clamp(0.0, 1.0),
                    (y + y_var).clamp(0.0, 1.0),
                ))
            }
            
            GazePatternType::Focused => {
                // Stay around center with small movements
                let center_x = 0.5;
                let center_y = 0.5;
                let focus_radius = 0.2 * intensity;
                
                let angle = self.rng.gen::<f64>() * 2.0 * std::f64::consts::PI;
                let radius = self.rng.bounded_normal(0.0, focus_radius, 0.0, focus_radius * 2.0);
                
                let x = center_x + radius * angle.cos();
                let y = center_y + radius * angle.sin();
                
                Ok(Point2D::new(x.clamp(0.0, 1.0), y.clamp(0.0, 1.0)))
            }
            
            GazePatternType::Exploration => {
                // Random movements with some smoothing
                let x = self.rng.gen::<f64>();
                let y = self.rng.gen::<f64>();
                
                Ok(Point2D::new(x, y))
            }
            
            GazePatternType::Tracking => {
                // Follow a moving object (simplified as circular motion)
                let progress = index as f64 / total_points as f64;
                let angle = progress * 2.0 * std::f64::consts::PI;
                
                let center_x = 0.5;
                let center_y = 0.5;
                let radius = 0.3;
                
                let x = center_x + radius * angle.cos();
                let y = center_y + radius * angle.sin();
                
                Ok(Point2D::new(x.clamp(0.0, 1.0), y.clamp(0.0, 1.0)))
            }
        }
    }
    
    async fn generate_fixation_duration(&mut self, pattern_type: &GazePatternType) -> Duration {
        let base_duration_ms = match pattern_type {
            GazePatternType::Reading => 250.0,
            GazePatternType::Scanning => 300.0,
            GazePatternType::Focused => 500.0,
            GazePatternType::Exploration => 200.0,
            GazePatternType::Tracking => 100.0,
        };
        
        let duration_ms = self.rng.bounded_normal(base_duration_ms, base_duration_ms * 0.3, 50.0, 1000.0);
        Duration::from_millis(duration_ms as u64)
    }
    
    async fn generate_gaze_intensity(&mut self, pattern_type: &GazePatternType) -> f32 {
        let base_intensity = match pattern_type {
            GazePatternType::Reading => 0.8,
            GazePatternType::Scanning => 0.6,
            GazePatternType::Focused => 0.9,
            GazePatternType::Exploration => 0.5,
            GazePatternType::Tracking => 0.7,
        };
        
        self.rng.bounded_normal(base_intensity, 0.1, 0.0, 1.0) as f32
    }
}

impl std::fmt::Debug for VisualEnhancer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("VisualEnhancer")
            .field("config", &self.config)
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_visual_enhancer_creation() {
        let config = VisualConfig::default();
        let result = VisualEnhancer::new(config).await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_video_frame_creation() {
        let data = vec![0u8; 1920 * 1080 * 3]; // RGB frame
        let frame = VideoFrame::new(
            data,
            1920,
            1080,
            ColorSpace::RGB,
            Duration::from_millis(0),
        );
        
        assert!(frame.validate().is_ok());
        assert_eq!(frame.aspect_ratio(), 16.0 / 9.0);
    }
    
    #[tokio::test]
    async fn test_gaze_pattern_generation() {
        let config = VisualConfig::default();
        let mut enhancer = VisualEnhancer::new(config).await.unwrap();
        
        let duration = Duration::from_secs(5);
        let result = enhancer.generate_gaze_pattern(duration).await;
        
        assert!(result.is_ok());
        let pattern = result.unwrap();
        assert!(!pattern.gaze_points.is_empty());
        assert_eq!(pattern.duration, duration);
        
        // Test gaze lookup
        let mid_time = Duration::from_millis(2500);
        let gaze_point = pattern.get_gaze_at_time(mid_time);
        assert!(gaze_point.is_some());
    }
    
    #[tokio::test]
    async fn test_frame_enhancement() {
        let config = VisualConfig::default();
        let mut enhancer = VisualEnhancer::new(config).await.unwrap();
        
        let data = vec![128u8; 100 * 100 * 3]; // Small RGB frame
        let frame = VideoFrame::new(
            data,
            100,
            100,
            ColorSpace::RGB,
            Duration::from_millis(0),
        );
        
        let frames = vec![frame];
        let result = enhancer.enhance_frames(&frames).await;
        
        assert!(result.is_ok());
        let enhanced = result.unwrap();
        assert_eq!(enhanced.len(), 1);
    }
    
    #[test]
    fn test_color_space_conversion() {
        let color_space = ColorSpace::from_string("rgb");
        assert!(color_space.is_ok());
        assert_eq!(color_space.unwrap(), ColorSpace::RGB);
        
        let invalid = ColorSpace::from_string("invalid");
        assert!(invalid.is_err());
    }
    
    #[test]
    fn test_frame_validation() {
        // Valid frame
        let data = vec![0u8; 10 * 10 * 3];
        let frame = VideoFrame::new(data, 10, 10, ColorSpace::RGB, Duration::ZERO);
        assert!(frame.validate().is_ok());
        
        // Invalid frame (wrong data size)
        let data = vec![0u8; 100]; // Too small for 10x10 RGB
        let frame = VideoFrame::new(data, 10, 10, ColorSpace::RGB, Duration::ZERO);
        assert!(frame.validate().is_err());
        
        // Invalid resolution
        let data = vec![0u8; 0];
        let frame = VideoFrame::new(data, 0, 0, ColorSpace::RGB, Duration::ZERO);
        assert!(frame.validate().is_err());
    }
    
    #[test]
    fn test_config_validation() {
        let mut config = VisualConfig::default();
        config.frame_width = 50; // Too small
        
        let result = futures::executor::block_on(VisualEnhancer::new(config));
        assert!(result.is_err());
    }
}