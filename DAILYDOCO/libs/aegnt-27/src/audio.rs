//! Audio processing module for aegnt-27
//! 
//! This module provides sophisticated audio humanization that adds natural
//! characteristics to synthesized or recorded audio, including breathing patterns,
//! vocal variations, background noise, and spectral humanization.

use std::time::Duration;
use serde::{Deserialize, Serialize};
// use rand::prelude::*;

use crate::error::{Aegnt27Error, AudioError, Result};
use crate::utils::{timing, random::HumanRng, validation};

/// Configuration for audio humanization behavior
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioConfig {
    /// Sample rate in Hz (8000-96000)
    pub sample_rate: u32,
    
    /// Audio channels (1 for mono, 2 for stereo)
    pub channels: u8,
    
    /// Bit depth (16, 24, or 32)
    pub bit_depth: u8,
    
    /// Enable breathing pattern injection
    pub enable_breathing_patterns: bool,
    
    /// Breathing rate in breaths per minute (8-25)
    pub breathing_rate: f64,
    
    /// Breathing intensity (0.0-1.0)
    pub breathing_intensity: f64,
    
    /// Enable vocal variations (pitch, formant changes)
    pub enable_vocal_variations: bool,
    
    /// Vocal variation intensity (0.0-1.0)
    pub vocal_variation_intensity: f64,
    
    /// Enable natural pauses and hesitations
    pub enable_natural_pauses: bool,
    
    /// Pause probability (0.0-1.0)
    pub pause_probability: f64,
    
    /// Enable background noise injection
    pub enable_background_noise: bool,
    
    /// Background noise level in dB (-60 to -20)
    pub background_noise_level: f64,
    
    /// Enable spectral humanization
    pub enable_spectral_humanization: bool,
    
    /// Spectral variation intensity (0.0-1.0)
    pub spectral_variation_intensity: f64,
    
    /// Enable room tone and ambience
    pub enable_room_tone: bool,
    
    /// Room size factor (0.0-1.0, affects reverb)
    pub room_size_factor: f64,
    
    /// Enable dynamic range processing
    pub enable_dynamic_processing: bool,
    
    /// Compression ratio (1.0-10.0)
    pub compression_ratio: f64,
}

impl Default for AudioConfig {
    fn default() -> Self {
        Self {
            sample_rate: 44100,
            channels: 1,
            bit_depth: 16,
            enable_breathing_patterns: true,
            breathing_rate: 16.0,
            breathing_intensity: 0.3,
            enable_vocal_variations: true,
            vocal_variation_intensity: 0.25,
            enable_natural_pauses: true,
            pause_probability: 0.08,
            enable_background_noise: true,
            background_noise_level: -45.0,
            enable_spectral_humanization: true,
            spectral_variation_intensity: 0.2,
            enable_room_tone: true,
            room_size_factor: 0.4,
            enable_dynamic_processing: true,
            compression_ratio: 3.0,
        }
    }
}

/// Raw audio data representation
#[derive(Debug, Clone)]
pub struct AudioData {
    /// Audio samples (normalized to -1.0 to 1.0)
    pub samples: Vec<f32>,
    
    /// Sample rate in Hz
    pub sample_rate: u32,
    
    /// Number of channels
    pub channels: u8,
    
    /// Duration of the audio
    pub duration: Duration,
    
    /// Metadata about the audio
    pub metadata: AudioMetadata,
}

impl AudioData {
    /// Creates new audio data from samples
    pub fn new(samples: Vec<f32>, sample_rate: u32, channels: u8) -> Self {
        let duration = Duration::from_secs_f64(
            samples.len() as f64 / (sample_rate as f64 * channels as f64)
        );
        
        Self {
            samples,
            sample_rate,
            channels,
            duration,
            metadata: AudioMetadata::default(),
        }
    }
    
    /// Gets the number of frames (samples per channel)
    pub fn frame_count(&self) -> usize {
        self.samples.len() / self.channels as usize
    }
    
    /// Validates audio data integrity
    pub fn validate(&self) -> Result<()> {
        if self.samples.is_empty() {
            return Err(Aegnt27Error::Audio(AudioError::InvalidFormat(
                "Audio data cannot be empty".to_string(),
            )));
        }
        
        if self.channels == 0 {
            return Err(Aegnt27Error::Audio(AudioError::InvalidFormat(
                "Channel count must be greater than 0".to_string(),
            )));
        }
        
        if self.sample_rate < 8000 || self.sample_rate > 192000 {
            return Err(Aegnt27Error::Audio(AudioError::InvalidFormat(
                format!("Invalid sample rate: {}", self.sample_rate),
            )));
        }
        
        // Check for clipping or invalid samples
        for &sample in &self.samples {
            if sample.is_nan() || sample.is_infinite() {
                return Err(Aegnt27Error::Audio(AudioError::ProcessingFailed(
                    "Audio contains invalid samples (NaN or Infinity)".to_string(),
                )));
            }
            if sample < -1.0 || sample > 1.0 {
                return Err(Aegnt27Error::Audio(AudioError::ProcessingFailed(
                    "Audio samples must be normalized to [-1.0, 1.0]".to_string(),
                )));
            }
        }
        
        Ok(())
    }
    
    /// Converts to mono by averaging channels
    pub fn to_mono(&self) -> Self {
        if self.channels == 1 {
            return self.clone();
        }
        
        let mut mono_samples = Vec::with_capacity(self.frame_count());
        
        for frame_start in (0..self.samples.len()).step_by(self.channels as usize) {
            let mut sum = 0.0;
            for ch in 0..self.channels as usize {
                if frame_start + ch < self.samples.len() {
                    sum += self.samples[frame_start + ch];
                }
            }
            mono_samples.push(sum / self.channels as f32);
        }
        
        AudioData::new(mono_samples, self.sample_rate, 1)
    }
}

/// Metadata about audio characteristics
#[derive(Debug, Clone, Default)]
pub struct AudioMetadata {
    /// Average amplitude
    pub average_amplitude: f32,
    
    /// Peak amplitude
    pub peak_amplitude: f32,
    
    /// RMS (Root Mean Square) level
    pub rms_level: f32,
    
    /// Estimated fundamental frequency
    pub fundamental_frequency: Option<f32>,
    
    /// Speech/voice probability (0.0-1.0)
    pub speech_probability: f32,
    
    /// Signal-to-noise ratio estimate
    pub snr_estimate: Option<f32>,
}

/// Humanized audio with enhanced characteristics
#[derive(Debug, Clone)]
pub struct HumanizedAudio {
    /// The processed audio data
    pub audio: AudioData,
    
    /// Authenticity score (0.0-1.0)
    pub authenticity_score: f32,
    
    /// Processing log for transparency
    pub processing_log: Vec<String>,
    
    /// Breathing pattern locations (in samples)
    pub breathing_locations: Vec<usize>,
    
    /// Natural pause locations (in samples)
    pub pause_locations: Vec<usize>,
}

impl HumanizedAudio {
    /// Gets the total processing time simulation
    pub fn total_processing_time(&self) -> Duration {
        self.audio.duration
    }
    
    /// Validates the humanized audio for authenticity
    pub fn validate_authenticity(&self) -> Result<f32> {
        let mut score = 1.0;
        
        // Check for natural variations in amplitude
        let amplitude_variance = self.calculate_amplitude_variance();
        if amplitude_variance < 0.01 {
            score -= 0.2; // Too uniform amplitude
        }
        
        // Check for presence of breathing patterns
        if self.breathing_locations.is_empty() && self.audio.duration > Duration::from_secs(10) {
            score -= 0.1; // Long audio should have breathing
        }
        
        // Check for natural pauses
        if self.pause_locations.is_empty() && self.audio.duration > Duration::from_secs(30) {
            score -= 0.1; // Long speech should have pauses
        }
        
        // Check spectral characteristics
        let spectral_naturalness = self.analyze_spectral_naturalness()?;
        score *= spectral_naturalness;
        
        Ok(score.max(0.0))
    }
    
    fn calculate_amplitude_variance(&self) -> f32 {
        let samples = &self.audio.samples;
        if samples.is_empty() {
            return 0.0;
        }
        
        let mean: f32 = samples.iter().map(|s| s.abs()).sum::<f32>() / samples.len() as f32;
        let variance = samples
            .iter()
            .map(|s| (s.abs() - mean).powi(2))
            .sum::<f32>() / samples.len() as f32;
        
        variance
    }
    
    fn analyze_spectral_naturalness(&self) -> Result<f32> {
        // Simplified spectral analysis - would use FFT in real implementation
        let mut naturalness: f32 = 1.0;
        
        // Check for overly perfect harmonic content (sign of synthesis)
        let mono_audio = self.audio.to_mono();
        let frames = mono_audio.frame_count();
        
        if frames > 1024 {
            // Analyze frequency content in chunks
            let chunk_size = 1024;
            let mut spectral_irregularity_sum = 0.0;
            let mut chunk_count = 0;
            
            for chunk_start in (0..frames).step_by(chunk_size) {
                let chunk_end = (chunk_start + chunk_size).min(frames);
                if chunk_end - chunk_start < chunk_size / 2 {
                    break;
                }
                
                // Simple spectral irregularity measure
                let chunk = &mono_audio.samples[chunk_start..chunk_end];
                let irregularity = self.calculate_spectral_irregularity(chunk);
                spectral_irregularity_sum += irregularity;
                chunk_count += 1;
            }
            
            if chunk_count > 0 {
                let avg_irregularity = spectral_irregularity_sum / chunk_count as f32;
                
                // Natural speech should have some spectral irregularity
                if avg_irregularity < 0.1 {
                    naturalness -= 0.2; // Too regular/synthetic
                }
            }
        }
        
        Ok(naturalness.max(0.0))
    }
    
    fn calculate_spectral_irregularity(&self, samples: &[f32]) -> f32 {
        // Simplified spectral irregularity calculation
        // In a real implementation, this would use FFT
        let mut irregularity = 0.0;
        
        for window in samples.windows(3) {
            let variation = (window[2] - 2.0 * window[1] + window[0]).abs();
            irregularity += variation;
        }
        
        if samples.len() > 2 {
            irregularity / (samples.len() - 2) as f32
        } else {
            0.0
        }
    }
}

/// Breathing pattern information
#[derive(Debug, Clone)]
pub struct BreathingPattern {
    /// Breath locations in samples
    pub breath_locations: Vec<usize>,
    
    /// Breath intensities (0.0-1.0)
    pub breath_intensities: Vec<f32>,
    
    /// Breath types (inhale/exhale)
    pub breath_types: Vec<BreathType>,
}

/// Types of breathing sounds
#[derive(Debug, Clone, PartialEq)]
pub enum BreathType {
    /// Inhale sound
    Inhale,
    /// Exhale sound
    Exhale,
    /// Mouth sound (lip smack, etc.)
    MouthSound,
}

/// The main audio processing engine
pub struct AudioProcessor {
    config: AudioConfig,
    rng: HumanRng,
}

impl AudioProcessor {
    /// Creates a new audio processor with the given configuration
    pub async fn new(config: AudioConfig) -> Result<Self> {
        // Validate configuration
        validation::validate_range(config.sample_rate, 8000, 192000, "sample_rate")?;
        validation::validate_range(config.channels, 1, 8, "channels")?;
        validation::validate_range(config.breathing_rate, 5.0, 30.0, "breathing_rate")?;
        validation::validate_range(config.breathing_intensity, 0.0, 1.0, "breathing_intensity")?;
        validation::validate_range(config.background_noise_level, -80.0, -10.0, "background_noise_level")?;
        
        Ok(Self {
            config,
            rng: HumanRng::new(),
        })
    }
    
    /// Humanizes audio with natural characteristics
    pub async fn humanize(&mut self, audio: AudioData) -> Result<HumanizedAudio> {
        audio.validate()?;
        
        let mut processing_log = Vec::new();
        let mut processed_audio = audio.clone();
        let mut breathing_locations = Vec::new();
        let mut pause_locations = Vec::new();
        
        // Apply breathing patterns
        if self.config.enable_breathing_patterns {
            let breathing_pattern = self.generate_breathing_pattern(&processed_audio).await?;
            processed_audio = self.inject_breathing_patterns(processed_audio, &breathing_pattern).await?;
            breathing_locations = breathing_pattern.breath_locations;
            processing_log.push("Applied breathing patterns".to_string());
        }
        
        // Apply vocal variations
        if self.config.enable_vocal_variations {
            processed_audio = self.apply_vocal_variations(processed_audio).await?;
            processing_log.push("Applied vocal variations".to_string());
        }
        
        // Add natural pauses
        if self.config.enable_natural_pauses {
            let (audio_with_pauses, pauses) = self.inject_natural_pauses(processed_audio).await?;
            processed_audio = audio_with_pauses;
            pause_locations = pauses;
            processing_log.push("Added natural pauses".to_string());
        }
        
        // Add background noise
        if self.config.enable_background_noise {
            processed_audio = self.add_background_noise(processed_audio).await?;
            processing_log.push("Added background noise".to_string());
        }
        
        // Apply spectral humanization
        if self.config.enable_spectral_humanization {
            processed_audio = self.apply_spectral_humanization(processed_audio).await?;
            processing_log.push("Applied spectral humanization".to_string());
        }
        
        // Add room tone
        if self.config.enable_room_tone {
            processed_audio = self.add_room_tone(processed_audio).await?;
            processing_log.push("Added room tone".to_string());
        }
        
        // Apply dynamic processing
        if self.config.enable_dynamic_processing {
            processed_audio = self.apply_dynamic_processing(processed_audio).await?;
            processing_log.push("Applied dynamic processing".to_string());
        }
        
        let humanized = HumanizedAudio {
            audio: processed_audio,
            authenticity_score: 0.0, // Will be calculated
            processing_log,
            breathing_locations,
            pause_locations,
        };
        
        // Calculate authenticity score
        let authenticity_score = humanized.validate_authenticity()?;
        
        Ok(HumanizedAudio {
            authenticity_score,
            ..humanized
        })
    }
    
    /// Injects breathing patterns into audio
    pub async fn inject_breathing(&mut self, audio: AudioData) -> Result<AudioData> {
        let breathing_pattern = self.generate_breathing_pattern(&audio).await?;
        self.inject_breathing_patterns(audio, &breathing_pattern).await
    }
    
    async fn generate_breathing_pattern(&mut self, audio: &AudioData) -> Result<BreathingPattern> {
        let duration = audio.duration;
        let sample_rate = audio.sample_rate as f64;
        
        // Generate breathing times based on breathing rate
        let breath_times = timing::generate_breathing_pattern(duration, self.config.breathing_rate);
        
        let mut breath_locations = Vec::new();
        let mut breath_intensities = Vec::new();
        let mut breath_types = Vec::new();
        
        for (i, breath_time) in breath_times.iter().enumerate() {
            let sample_location = (breath_time.as_secs_f64() * sample_rate) as usize;
            
            if sample_location < audio.samples.len() {
                breath_locations.push(sample_location);
                
                // Vary breathing intensity naturally
                let base_intensity = self.config.breathing_intensity;
                let intensity = self.rng.bounded_normal(base_intensity, base_intensity * 0.3, 0.0, 1.0) as f32;
                breath_intensities.push(intensity);
                
                // Alternate between inhale and exhale, with occasional mouth sounds
                let breath_type = if self.rng.gen::<f64>() < 0.05 {
                    BreathType::MouthSound
                } else if i % 2 == 0 {
                    BreathType::Inhale
                } else {
                    BreathType::Exhale
                };
                breath_types.push(breath_type);
            }
        }
        
        Ok(BreathingPattern {
            breath_locations,
            breath_intensities,
            breath_types,
        })
    }
    
    async fn inject_breathing_patterns(
        &mut self,
        mut audio: AudioData,
        pattern: &BreathingPattern,
    ) -> Result<AudioData> {
        for (i, &location) in pattern.breath_locations.iter().enumerate() {
            if location >= audio.samples.len() {
                continue;
            }
            
            let intensity = pattern.breath_intensities[i];
            let breath_type = &pattern.breath_types[i];
            
            // Generate breathing sound based on type
            let breath_samples = self.generate_breath_sound(breath_type, intensity, audio.sample_rate).await?;
            
            // Mix breathing sound with existing audio
            for (j, &breath_sample) in breath_samples.iter().enumerate() {
                if location + j < audio.samples.len() {
                    // Mix at reduced volume
                    audio.samples[location + j] += breath_sample * 0.3;
                    
                    // Ensure no clipping
                    audio.samples[location + j] = audio.samples[location + j].clamp(-1.0, 1.0);
                }
            }
        }
        
        Ok(audio)
    }
    
    async fn generate_breath_sound(
        &mut self,
        breath_type: &BreathType,
        intensity: f32,
        sample_rate: u32,
    ) -> Result<Vec<f32>> {
        let duration_ms = match breath_type {
            BreathType::Inhale => 200,
            BreathType::Exhale => 300,
            BreathType::MouthSound => 50,
        };
        
        let num_samples = (sample_rate as f64 * duration_ms as f64 / 1000.0) as usize;
        let mut samples = Vec::with_capacity(num_samples);
        
        for i in 0..num_samples {
            let t = i as f64 / sample_rate as f64;
            
            // Generate noise-based breath sound
            let noise = self.rng.gen::<f64>() - 0.5;
            
            // Apply envelope based on breath type
            let envelope = match breath_type {
                BreathType::Inhale => {
                    // Gradual increase
                    (t / (duration_ms as f64 / 1000.0)).min(1.0)
                }
                BreathType::Exhale => {
                    // Gradual decrease
                    (1.0 - t / (duration_ms as f64 / 1000.0)).max(0.0)
                }
                BreathType::MouthSound => {
                    // Quick spike
                    let normalized_t = t / (duration_ms as f64 / 1000.0);
                    if normalized_t < 0.5 {
                        normalized_t * 2.0
                    } else {
                        (1.0 - normalized_t) * 2.0
                    }
                }
            };
            
            // Apply low-pass filtering for breath-like sound
            let filtered_noise = noise * 0.1; // Simple filtering
            let sample = (filtered_noise * envelope * intensity as f64) as f32;
            samples.push(sample);
        }
        
        Ok(samples)
    }
    
    async fn apply_vocal_variations(&mut self, mut audio: AudioData) -> Result<AudioData> {
        let variation_intensity = self.config.vocal_variation_intensity;
        
        // Apply subtle pitch variations
        for i in 0..audio.samples.len() {
            let variation = self.rng.bounded_normal(0.0, variation_intensity * 0.02, -0.05, 0.05) as f32;
            audio.samples[i] *= 1.0 + variation;
        }
        
        // Apply formant variations (simplified)
        // In a real implementation, this would involve spectral processing
        let chunk_size = 1024;
        for chunk_start in (0..audio.samples.len()).step_by(chunk_size) {
            let chunk_end = (chunk_start + chunk_size).min(audio.samples.len());
            let formant_shift = self.rng.bounded_normal(0.0, variation_intensity * 0.1, -0.2, 0.2) as f32;
            
            for i in chunk_start..chunk_end {
                audio.samples[i] *= 1.0 + formant_shift;
            }
        }
        
        Ok(audio)
    }
    
    async fn inject_natural_pauses(&mut self, audio: AudioData) -> Result<(AudioData, Vec<usize>)> {
        let mut pause_locations = Vec::new();
        let sample_rate = audio.sample_rate as f64;
        let total_duration = audio.duration.as_secs_f64();
        
        // Determine pause locations
        let mut current_time = 0.0;
        while current_time < total_duration {
            if self.rng.gen::<f64>() < self.config.pause_probability {
                let pause_location = (current_time * sample_rate) as usize;
                if pause_location < audio.samples.len() {
                    pause_locations.push(pause_location);
                }
            }
            current_time += 1.0; // Check every second
        }
        
        // For now, just mark pause locations without modifying audio
        // In a full implementation, this would insert actual silence
        Ok((audio, pause_locations))
    }
    
    async fn add_background_noise(&mut self, mut audio: AudioData) -> Result<AudioData> {
        let noise_level = 10_f32.powf(self.config.background_noise_level as f32 / 20.0);
        
        for sample in &mut audio.samples {
            let noise = (self.rng.gen::<f64>() - 0.5) as f32 * noise_level;
            *sample += noise;
            *sample = sample.clamp(-1.0, 1.0);
        }
        
        Ok(audio)
    }
    
    async fn apply_spectral_humanization(&mut self, mut audio: AudioData) -> Result<AudioData> {
        let variation_intensity = self.config.spectral_variation_intensity;
        
        // Apply subtle spectral variations
        // This is a simplified implementation - real spectral processing would use FFT
        let window_size = 512;
        for window_start in (0..audio.samples.len()).step_by(window_size) {
            let window_end = (window_start + window_size).min(audio.samples.len());
            
            // Apply a subtle filter variation to each window
            let filter_variation = self.rng.bounded_normal(1.0, variation_intensity * 0.1, 0.8, 1.2) as f32;
            
            for i in window_start..window_end {
                audio.samples[i] *= filter_variation;
            }
        }
        
        Ok(audio)
    }
    
    async fn add_room_tone(&mut self, mut audio: AudioData) -> Result<AudioData> {
        let room_factor = self.config.room_size_factor;
        
        // Simple room tone simulation (would use convolution with impulse response in real implementation)
        for i in 1..audio.samples.len() {
            let room_effect = audio.samples[i - 1] * room_factor as f32 * 0.1;
            audio.samples[i] += room_effect;
            audio.samples[i] = audio.samples[i].clamp(-1.0, 1.0);
        }
        
        Ok(audio)
    }
    
    async fn apply_dynamic_processing(&mut self, mut audio: AudioData) -> Result<AudioData> {
        let compression_ratio = self.config.compression_ratio;
        let threshold = 0.7; // Compression threshold
        
        // Simple compression algorithm
        for sample in &mut audio.samples {
            let abs_sample = sample.abs();
            if abs_sample > threshold {
                let excess = abs_sample - threshold;
                let compressed_excess = excess / compression_ratio as f32;
                let new_abs = threshold + compressed_excess;
                *sample = sample.signum() * new_abs;
            }
        }
        
        Ok(audio)
    }
}

impl std::fmt::Debug for AudioProcessor {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AudioProcessor")
            .field("config", &self.config)
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_audio_processor_creation() {
        let config = AudioConfig::default();
        let result = AudioProcessor::new(config).await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_audio_data_creation() {
        let samples = vec![0.0, 0.1, -0.1, 0.2];
        let audio = AudioData::new(samples, 44100, 1);
        
        assert_eq!(audio.frame_count(), 4);
        assert!(audio.validate().is_ok());
    }
    
    #[tokio::test]
    async fn test_breathing_injection() {
        let config = AudioConfig::default();
        let mut processor = AudioProcessor::new(config).await.unwrap();
        
        let samples = vec![0.0; 44100]; // 1 second of silence
        let audio = AudioData::new(samples, 44100, 1);
        
        let result = processor.inject_breathing(audio).await;
        assert!(result.is_ok());
        
        let processed = result.unwrap();
        assert!(!processed.samples.iter().all(|&x| x == 0.0)); // Should have breathing sounds
    }
    
    #[tokio::test]
    async fn test_audio_humanization() {
        let config = AudioConfig::default();
        let mut processor = AudioProcessor::new(config).await.unwrap();
        
        let samples = vec![0.1; 22050]; // 0.5 seconds of tone
        let audio = AudioData::new(samples, 44100, 1);
        
        let result = processor.humanize(audio).await;
        assert!(result.is_ok());
        
        let humanized = result.unwrap();
        assert!(humanized.authenticity_score > 0.0);
        assert!(!humanized.processing_log.is_empty());
    }
    
    #[test]
    fn test_audio_validation() {
        let samples = vec![0.0, 1.5, -0.5]; // Contains clipping
        let audio = AudioData::new(samples, 44100, 1);
        assert!(audio.validate().is_err());
        
        let valid_samples = vec![0.0, 0.5, -0.5];
        let valid_audio = AudioData::new(valid_samples, 44100, 1);
        assert!(valid_audio.validate().is_ok());
    }
    
    #[test]
    fn test_mono_conversion() {
        let stereo_samples = vec![0.1, 0.2, 0.3, 0.4]; // 2 frames, 2 channels
        let stereo_audio = AudioData::new(stereo_samples, 44100, 2);
        
        let mono_audio = stereo_audio.to_mono();
        assert_eq!(mono_audio.channels, 1);
        assert_eq!(mono_audio.samples.len(), 2); // 2 frames
        assert_eq!(mono_audio.samples[0], 0.15); // Average of 0.1 and 0.2
        assert_eq!(mono_audio.samples[1], 0.35); // Average of 0.3 and 0.4
    }
    
    #[test]
    fn test_config_validation() {
        let mut config = AudioConfig::default();
        config.sample_rate = 1000; // Too low
        
        let result = futures::executor::block_on(AudioProcessor::new(config));
        assert!(result.is_err());
    }
}