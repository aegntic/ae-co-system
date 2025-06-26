//! Utility functions for aegnt-27
//! 
//! This module provides common utility functions used across all aegnt-27 modules,
//! including mathematical helpers, timing utilities, random number generation,
//! and performance monitoring tools.

use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use std::collections::HashMap;
use rand::prelude::*;
use rand_distr::{Normal, Beta, Gamma};

use crate::error::{Aegnt27Error, Result};

/// Mathematical utility functions for curve generation and natural patterns
pub mod math {
    use super::*;
    
    /// Represents a 2D point with floating-point coordinates
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct Point2D {
        pub x: f64,
        pub y: f64,
    }
    
    impl Point2D {
        pub fn new(x: f64, y: f64) -> Self {
            Self { x, y }
        }
        
        pub fn distance_to(&self, other: &Point2D) -> f64 {
            ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
        }
        
        pub fn midpoint(&self, other: &Point2D) -> Point2D {
            Point2D::new((self.x + other.x) / 2.0, (self.y + other.y) / 2.0)
        }
        
        pub fn lerp(&self, other: &Point2D, t: f64) -> Point2D {
            Point2D::new(
                self.x + t * (other.x - self.x),
                self.y + t * (other.y - self.y),
            )
        }
    }
    
    /// Generates a Bezier curve between two points with natural control points
    pub fn generate_bezier_curve(start: Point2D, end: Point2D, num_points: usize) -> Vec<Point2D> {
        let mut rng = thread_rng();
        
        // Calculate natural control points with some randomness
        let distance = start.distance_to(&end);
        let control_offset = distance * 0.2 + rng.gen::<f64>() * distance * 0.1;
        
        let midpoint = start.midpoint(&end);
        let perpendicular_angle = ((end.y - start.y) / (end.x - start.x)).atan() + std::f64::consts::PI / 2.0;
        
        let control1 = Point2D::new(
            midpoint.x + control_offset * perpendicular_angle.cos() * (rng.gen::<f64>() - 0.5),
            midpoint.y + control_offset * perpendicular_angle.sin() * (rng.gen::<f64>() - 0.5),
        );
        
        let control2 = Point2D::new(
            midpoint.x - control_offset * perpendicular_angle.cos() * (rng.gen::<f64>() - 0.5),
            midpoint.y - control_offset * perpendicular_angle.sin() * (rng.gen::<f64>() - 0.5),
        );
        
        generate_cubic_bezier_points(start, control1, control2, end, num_points)
    }
    
    /// Generates points along a cubic Bezier curve
    pub fn generate_cubic_bezier_points(
        p0: Point2D,
        p1: Point2D,
        p2: Point2D,
        p3: Point2D,
        num_points: usize,
    ) -> Vec<Point2D> {
        let mut points = Vec::with_capacity(num_points);
        
        for i in 0..num_points {
            let t = i as f64 / (num_points - 1) as f64;
            let point = cubic_bezier_point(p0, p1, p2, p3, t);
            points.push(point);
        }
        
        points
    }
    
    /// Calculates a point on a cubic Bezier curve at parameter t
    fn cubic_bezier_point(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: f64) -> Point2D {
        let one_minus_t = 1.0 - t;
        let one_minus_t_squared = one_minus_t * one_minus_t;
        let one_minus_t_cubed = one_minus_t_squared * one_minus_t;
        let t_squared = t * t;
        let t_cubed = t_squared * t;
        
        Point2D::new(
            one_minus_t_cubed * p0.x
                + 3.0 * one_minus_t_squared * t * p1.x
                + 3.0 * one_minus_t * t_squared * p2.x
                + t_cubed * p3.x,
            one_minus_t_cubed * p0.y
                + 3.0 * one_minus_t_squared * t * p1.y
                + 3.0 * one_minus_t * t_squared * p2.y
                + t_cubed * p3.y,
        )
    }
    
    /// Applies smoothing to a series of values using a moving average
    pub fn smooth_values(values: &[f64], window_size: usize) -> Vec<f64> {
        if window_size == 0 || values.is_empty() {
            return values.to_vec();
        }
        
        let mut smoothed = Vec::with_capacity(values.len());
        let half_window = window_size / 2;
        
        for i in 0..values.len() {
            let start = i.saturating_sub(half_window);
            let end = (i + half_window + 1).min(values.len());
            let sum: f64 = values[start..end].iter().sum();
            let avg = sum / (end - start) as f64;
            smoothed.push(avg);
        }
        
        smoothed
    }
    
    /// Normalizes values to a range [0, 1]
    pub fn normalize_values(values: &[f64]) -> Vec<f64> {
        if values.is_empty() {
            return Vec::new();
        }
        
        let min_val = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_val = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        
        if (max_val - min_val).abs() < f64::EPSILON {
            return vec![0.5; values.len()];
        }
        
        values
            .iter()
            .map(|&val| (val - min_val) / (max_val - min_val))
            .collect()
    }
}

/// Timing and duration utilities for natural pattern generation
pub mod timing {
    use super::*;
    
    /// High-resolution timer for precise timing measurements
    #[derive(Debug)]
    pub struct PrecisionTimer {
        start: Instant,
        checkpoints: Vec<(String, Instant)>,
    }
    
    impl PrecisionTimer {
        pub fn new() -> Self {
            Self {
                start: Instant::now(),
                checkpoints: Vec::new(),
            }
        }
        
        pub fn checkpoint(&mut self, name: &str) {
            self.checkpoints.push((name.to_string(), Instant::now()));
        }
        
        pub fn elapsed(&self) -> Duration {
            self.start.elapsed()
        }
        
        pub fn elapsed_since_checkpoint(&self, name: &str) -> Option<Duration> {
            self.checkpoints
                .iter()
                .find(|(cp_name, _)| cp_name == name)
                .map(|(_, instant)| instant.elapsed())
        }
        
        pub fn get_checkpoint_durations(&self) -> Vec<(String, Duration)> {
            let mut durations = Vec::new();
            let mut last_time = self.start;
            
            for (name, instant) in &self.checkpoints {
                durations.push((name.clone(), instant.duration_since(last_time)));
                last_time = *instant;
            }
            
            durations
        }
    }
    
    impl Default for PrecisionTimer {
        fn default() -> Self {
            Self::new()
        }
    }
    
    /// Generates natural delays with human-like variation
    pub fn generate_natural_delay(base_duration: Duration, variation: f64) -> Duration {
        let mut rng = thread_rng();
        let base_ms = base_duration.as_millis() as f64;
        
        // Use gamma distribution for realistic timing variation
        let shape = 2.0;
        let scale = base_ms / shape;
        let gamma = Gamma::new(shape, scale).unwrap();
        
        let varied_ms = gamma.sample(&mut rng) * (1.0 + variation * (rng.gen::<f64>() - 0.5));
        let clamped_ms = varied_ms.max(1.0);
        
        Duration::from_millis(clamped_ms as u64)
    }
    
    /// Generates keystroke timing patterns that mimic human typing
    pub fn generate_keystroke_timings(text_length: usize, wpm: f64) -> Vec<Duration> {
        let mut rng = thread_rng();
        let mut timings = Vec::with_capacity(text_length);
        
        // Average time per character at given WPM (assuming 5 chars per word)
        let avg_char_time_ms = (60.0 * 1000.0) / (wpm * 5.0);
        
        for i in 0..text_length {
            // Add fatigue effect - typing gets slightly slower over time
            let fatigue_factor = 1.0 + (i as f64 / text_length as f64) * 0.1;
            
            // Add natural variation using beta distribution
            let beta = Beta::new(2.0, 2.0).unwrap();
            let variation = beta.sample(&mut rng);
            
            let char_time = avg_char_time_ms * fatigue_factor * (0.5 + variation);
            timings.push(Duration::from_millis(char_time as u64));
        }
        
        timings
    }
    
    /// Generates breathing pattern timings for audio enhancement
    pub fn generate_breathing_pattern(duration: Duration, breaths_per_minute: f64) -> Vec<Duration> {
        let mut rng = thread_rng();
        let total_ms = duration.as_millis() as f64;
        let avg_breath_interval_ms = (60.0 * 1000.0) / breaths_per_minute;
        
        let mut breath_times = Vec::new();
        let mut current_time = 0.0;
        
        while current_time < total_ms {
            // Add natural variation to breathing rhythm
            let variation: f64 = Normal::new(1.0, 0.15).unwrap().sample(&mut rng);
            let breath_interval = avg_breath_interval_ms * variation.abs();
            
            current_time += breath_interval;
            if current_time < total_ms {
                breath_times.push(Duration::from_millis(current_time as u64));
            }
        }
        
        breath_times
    }
}

/// Random number generation utilities with human-like distributions
pub mod random {
    use super::*;
    use rand::Rng;
    
    /// Thread-safe random number generator with human-like distributions
    pub struct HumanRng {
        pub rng: ThreadRng,
    }
    
    impl HumanRng {
        pub fn new() -> Self {
            Self {
                rng: thread_rng(),
            }
        }
        
        /// Generate a random value
        pub fn gen<T>(&mut self) -> T
        where
            rand::distributions::Standard: rand::distributions::Distribution<T>,
        {
            self.rng.gen()
        }
        
        /// Generate a random value in a range
        pub fn gen_range<T, R>(&mut self, range: R) -> T
        where
            T: rand::distributions::uniform::SampleUniform,
            R: rand::distributions::uniform::SampleRange<T>,
        {
            self.rng.gen_range(range)
        }
        
        /// Generates a value from a beta distribution (good for human-like preferences)
        pub fn beta_sample(&mut self, alpha: f64, beta: f64) -> f64 {
            let dist = Beta::new(alpha, beta).unwrap();
            dist.sample(&mut self.rng)
        }
        
        /// Generates a value from a normal distribution with human-like bounds
        pub fn bounded_normal(&mut self, mean: f64, std_dev: f64, min: f64, max: f64) -> f64 {
            let normal = Normal::new(mean, std_dev).unwrap();
            loop {
                let sample = normal.sample(&mut self.rng);
                if sample >= min && sample <= max {
                    return sample;
                }
            }
        }
        
        /// Generates a random duration with human-like variation
        pub fn human_duration(&mut self, base: Duration, variation: f64) -> Duration {
            let base_ms = base.as_millis() as f64;
            let varied = self.bounded_normal(base_ms, base_ms * variation, 1.0, base_ms * 3.0);
            Duration::from_millis(varied as u64)
        }
        
        /// Chooses a random element with weighted probabilities
        pub fn weighted_choice<'a, T>(&mut self, items: &'a [(T, f64)]) -> Option<&'a T>
        where
            T: Clone,
        {
            if items.is_empty() {
                return None;
            }
            
            let total_weight: f64 = items.iter().map(|(_, weight)| weight).sum();
            let mut random_weight = self.rng.gen::<f64>() * total_weight;
            
            for (item, weight) in items {
                random_weight -= weight;
                if random_weight <= 0.0 {
                    return Some(item);
                }
            }
            
            Some(&items[0].0)
        }
        
        /// Generates human-like coordinate jitter
        pub fn coordinate_jitter(&mut self, base_x: i32, base_y: i32, max_jitter: i32) -> (i32, i32) {
            let x_jitter = self.rng.gen_range(-max_jitter..=max_jitter);
            let y_jitter = self.rng.gen_range(-max_jitter..=max_jitter);
            (base_x + x_jitter, base_y + y_jitter)
        }
    }
    
    impl Default for HumanRng {
        fn default() -> Self {
            Self::new()
        }
    }
}

/// Performance monitoring and profiling utilities
pub mod performance {
    use super::*;
    
    /// Performance metrics collector
    #[derive(Debug, Default)]
    pub struct PerformanceMetrics {
        pub operation_times: HashMap<String, Vec<Duration>>,
        pub memory_usage: Vec<usize>,
        pub cpu_usage: Vec<f64>,
        pub start_time: Option<Instant>,
    }
    
    impl PerformanceMetrics {
        pub fn new() -> Self {
            Self {
                start_time: Some(Instant::now()),
                ..Default::default()
            }
        }
        
        pub fn record_operation(&mut self, operation: &str, duration: Duration) {
            self.operation_times
                .entry(operation.to_string())
                .or_insert_with(Vec::new)
                .push(duration);
        }
        
        pub fn record_memory_usage(&mut self, bytes: usize) {
            self.memory_usage.push(bytes);
        }
        
        pub fn record_cpu_usage(&mut self, percentage: f64) {
            self.cpu_usage.push(percentage);
        }
        
        pub fn get_average_operation_time(&self, operation: &str) -> Option<Duration> {
            self.operation_times.get(operation).map(|times| {
                let total: Duration = times.iter().sum();
                total / times.len() as u32
            })
        }
        
        pub fn get_total_runtime(&self) -> Option<Duration> {
            self.start_time.map(|start| start.elapsed())
        }
        
        pub fn generate_report(&self) -> String {
            let mut report = String::new();
            
            report.push_str("=== Performance Report ===\n");
            
            if let Some(runtime) = self.get_total_runtime() {
                report.push_str(&format!("Total Runtime: {:?}\n", runtime));
            }
            
            report.push_str("\nOperation Times:\n");
            for (operation, times) in &self.operation_times {
                let avg = times.iter().sum::<Duration>() / times.len() as u32;
                let min = times.iter().min().unwrap();
                let max = times.iter().max().unwrap();
                report.push_str(&format!(
                    "  {}: avg={:?}, min={:?}, max={:?}, count={}\n",
                    operation, avg, min, max, times.len()
                ));
            }
            
            if !self.memory_usage.is_empty() {
                let avg_memory = self.memory_usage.iter().sum::<usize>() / self.memory_usage.len();
                let max_memory = self.memory_usage.iter().max().unwrap();
                report.push_str(&format!(
                    "\nMemory Usage: avg={}MB, max={}MB\n",
                    avg_memory / 1024 / 1024,
                    max_memory / 1024 / 1024
                ));
            }
            
            if !self.cpu_usage.is_empty() {
                let avg_cpu = self.cpu_usage.iter().sum::<f64>() / self.cpu_usage.len() as f64;
                let max_cpu: f64 = self.cpu_usage.iter().fold(0.0, |a, &b| a.max(b));
                report.push_str(&format!("CPU Usage: avg={:.1}%, max={:.1}%\n", avg_cpu, max_cpu));
            }
            
            report
        }
    }
    
    /// RAII-style performance timer
    pub struct ScopedTimer<'a> {
        metrics: &'a mut PerformanceMetrics,
        operation: String,
        start: Instant,
    }
    
    impl<'a> ScopedTimer<'a> {
        pub fn new(metrics: &'a mut PerformanceMetrics, operation: &str) -> Self {
            Self {
                metrics,
                operation: operation.to_string(),
                start: Instant::now(),
            }
        }
    }
    
    impl<'a> Drop for ScopedTimer<'a> {
        fn drop(&mut self) {
            let duration = self.start.elapsed();
            self.metrics.record_operation(&self.operation, duration);
        }
    }
    
    /// Macro for easy performance timing
    #[macro_export]
    macro_rules! time_operation {
        ($metrics:expr, $operation:expr, $code:block) => {{
            let _timer = $crate::utils::performance::ScopedTimer::new($metrics, $operation);
            $code
        }};
    }
}

/// System information utilities
pub mod system {
    use super::*;
    
    /// Gets current system information
    pub fn get_system_info() -> Result<SystemInfo> {
        Ok(SystemInfo {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_err(|e| Aegnt27Error::Internal(format!("Time error: {}", e)))?
                .as_secs(),
            cpu_count: num_cpus::get(),
            available_memory: get_available_memory()?,
            platform: std::env::consts::OS.to_string(),
            architecture: std::env::consts::ARCH.to_string(),
        })
    }
    
    fn get_available_memory() -> Result<u64> {
        // Platform-specific memory detection would go here
        // For now, return a reasonable default
        Ok(8 * 1024 * 1024 * 1024) // 8GB default
    }
    
    #[derive(Debug, Clone)]
    pub struct SystemInfo {
        pub timestamp: u64,
        pub cpu_count: usize,
        pub available_memory: u64,
        pub platform: String,
        pub architecture: String,
    }
}

/// Validation utilities
pub mod validation {
    use super::*;
    
    /// Validates that a value is within a specified range
    pub fn validate_range<T>(value: T, min: T, max: T, field_name: &str) -> Result<T>
    where
        T: PartialOrd + Copy + std::fmt::Display,
    {
        if value < min || value > max {
            return Err(Aegnt27Error::Validation(
                crate::error::ValidationError::RangeValidationFailed {
                    field: field_name.to_string(),
                    min: min.to_string().parse().unwrap_or(0.0),
                    max: max.to_string().parse().unwrap_or(0.0),
                    actual: value.to_string().parse().unwrap_or(0.0),
                },
            ));
        }
        Ok(value)
    }
    
    /// Validates that a string is not empty
    pub fn validate_non_empty(value: &str, field_name: &str) -> Result<()> {
        if value.is_empty() {
            return Err(Aegnt27Error::Validation(
                crate::error::ValidationError::RequiredFieldMissing(field_name.to_string()),
            ));
        }
        Ok(())
    }
    
    /// Validates that coordinates are within screen bounds
    pub fn validate_coordinates(x: i32, y: i32, max_x: i32, max_y: i32) -> Result<()> {
        if x < 0 || y < 0 || x > max_x || y > max_y {
            return Err(Aegnt27Error::Validation(
                crate::error::ValidationError::ConstraintViolation(
                    format!("Coordinates ({}, {}) outside bounds (0, 0) - ({}, {})", x, y, max_x, max_y)
                ),
            ));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_point2d_operations() {
        let p1 = math::Point2D::new(0.0, 0.0);
        let p2 = math::Point2D::new(3.0, 4.0);
        
        assert_eq!(p1.distance_to(&p2), 5.0);
        assert_eq!(p1.midpoint(&p2), math::Point2D::new(1.5, 2.0));
        assert_eq!(p1.lerp(&p2, 0.5), math::Point2D::new(1.5, 2.0));
    }
    
    #[test]
    fn test_precision_timer() {
        let mut timer = timing::PrecisionTimer::new();
        std::thread::sleep(Duration::from_millis(10));
        timer.checkpoint("test");
        
        assert!(timer.elapsed() >= Duration::from_millis(10));
        assert!(timer.elapsed_since_checkpoint("test").is_some());
    }
    
    #[test]
    fn test_performance_metrics() {
        let mut metrics = performance::PerformanceMetrics::new();
        metrics.record_operation("test_op", Duration::from_millis(100));
        metrics.record_operation("test_op", Duration::from_millis(200));
        
        let avg = metrics.get_average_operation_time("test_op").unwrap();
        assert_eq!(avg, Duration::from_millis(150));
    }
    
    #[test]
    fn test_validation() {
        assert!(validation::validate_range(5, 0, 10, "test").is_ok());
        assert!(validation::validate_range(15, 0, 10, "test").is_err());
        
        assert!(validation::validate_non_empty("hello", "test").is_ok());
        assert!(validation::validate_non_empty("", "test").is_err());
        
        assert!(validation::validate_coordinates(5, 5, 10, 10).is_ok());
        assert!(validation::validate_coordinates(15, 5, 10, 10).is_err());
    }
    
    #[test]
    fn test_human_rng() {
        let mut rng = random::HumanRng::new();
        
        let beta_sample = rng.beta_sample(2.0, 2.0);
        assert!(beta_sample >= 0.0 && beta_sample <= 1.0);
        
        let bounded_normal = rng.bounded_normal(10.0, 2.0, 5.0, 15.0);
        assert!(bounded_normal >= 5.0 && bounded_normal <= 15.0);
        
        let duration = rng.human_duration(Duration::from_millis(100), 0.2);
        assert!(duration.as_millis() > 0);
    }
}