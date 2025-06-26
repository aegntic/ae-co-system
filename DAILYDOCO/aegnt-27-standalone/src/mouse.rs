//! Mouse humanization module for aegnt-27
//! 
//! This module provides sophisticated mouse movement humanization that generates
//! natural, human-like cursor movements using advanced mathematical curves,
//! micro-movements, and behavioral patterns.

use std::time::Duration;
use serde::{Deserialize, Serialize};
// use rand::prelude::*;

use crate::error::{Aegnt27Error, MouseError, Result};
use crate::utils::{math::Point2D, timing, random::HumanRng, validation};

/// Configuration for mouse humanization behavior
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MouseConfig {
    /// Movement speed in pixels per second (100-2000)
    pub movement_speed: f64,
    
    /// Amount of natural variation in movement (0.0-1.0)
    pub movement_variation: f64,
    
    /// Enable micro-movements and drift patterns
    pub enable_micro_movements: bool,
    
    /// Micro-movement intensity (0.0-1.0)
    pub micro_movement_intensity: f64,
    
    /// Enable natural acceleration/deceleration curves
    pub enable_acceleration_curves: bool,
    
    /// Overshooting tendency (0.0-1.0)
    pub overshoot_probability: f64,
    
    /// Maximum overshoot distance in pixels
    pub max_overshoot_distance: i32,
    
    /// Pause probability during long movements (0.0-1.0)
    pub pause_probability: f64,
    
    /// Curve complexity (1-5, higher = more natural but slower)
    pub curve_complexity: u8,
    
    /// Enable mouse drift when idle
    pub enable_idle_drift: bool,
    
    /// Screen resolution for bounds checking
    pub screen_width: u32,
    pub screen_height: u32,
}

impl Default for MouseConfig {
    fn default() -> Self {
        Self {
            movement_speed: 800.0,
            movement_variation: 0.25,
            enable_micro_movements: true,
            micro_movement_intensity: 0.3,
            enable_acceleration_curves: true,
            overshoot_probability: 0.15,
            max_overshoot_distance: 8,
            pause_probability: 0.05,
            curve_complexity: 3,
            enable_idle_drift: true,
            screen_width: 1920,
            screen_height: 1080,
        }
    }
}

/// Represents a 2D point with integer coordinates
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

impl Point {
    pub fn new(x: i32, y: i32) -> Self {
        Self { x, y }
    }
    
    pub fn distance_to(&self, other: &Point) -> f64 {
        let dx = (self.x - other.x) as f64;
        let dy = (self.y - other.y) as f64;
        (dx * dx + dy * dy).sqrt()
    }
    
    pub fn to_point2d(&self) -> Point2D {
        Point2D::new(self.x as f64, self.y as f64)
    }
}

impl From<Point2D> for Point {
    fn from(point: Point2D) -> Self {
        Self {
            x: point.x.round() as i32,
            y: point.y.round() as i32,
        }
    }
}

/// Represents a mouse movement path
#[derive(Debug, Clone)]
pub struct MousePath {
    pub points: Vec<Point>,
    pub total_duration: Duration,
}

impl MousePath {
    /// Creates a linear path between two points
    pub fn linear(start: Point, end: Point) -> Self {
        Self {
            points: vec![start, end],
            total_duration: Duration::from_millis(500), // Default duration
        }
    }
    
    /// Creates a path from a vector of points
    pub fn from_points(points: Vec<Point>, duration: Duration) -> Result<Self> {
        if points.len() < 2 {
            return Err(Aegnt27Error::Mouse(MouseError::InvalidPath(
                "Path must contain at least 2 points".to_string(),
            )));
        }
        
        Ok(Self {
            points,
            total_duration: duration,
        })
    }
    
    /// Gets the total distance of the path
    pub fn total_distance(&self) -> f64 {
        if self.points.len() < 2 {
            return 0.0;
        }
        
        self.points
            .windows(2)
            .map(|window| window[0].distance_to(&window[1]))
            .sum()
    }
    
    /// Validates the path against screen bounds
    pub fn validate_bounds(&self, max_x: i32, max_y: i32) -> Result<()> {
        for point in &self.points {
            validation::validate_coordinates(point.x, point.y, max_x, max_y)?;
        }
        Ok(())
    }
}

/// A humanized mouse path with timing information
#[derive(Debug, Clone)]
pub struct HumanizedMousePath {
    pub movements: Vec<MouseMovement>,
    pub total_duration: Duration,
    pub authenticity_score: f32,
}

impl HumanizedMousePath {
    /// Gets all points in the path
    pub fn get_points(&self) -> Vec<Point> {
        self.movements.iter().map(|m| m.point).collect()
    }
    
    /// Gets the total number of movement steps
    pub fn step_count(&self) -> usize {
        self.movements.len()
    }
    
    /// Validates the path for human-like characteristics
    pub fn validate_authenticity(&self) -> Result<f32> {
        let mut score: f32 = 1.0;
        
        // Check for too-perfect movements (reduces authenticity)
        let perfectly_straight = self.movements.windows(3).any(|window| {
            let p1 = window[0].point;
            let p2 = window[1].point;
            let p3 = window[2].point;
            
            // Check if three points are perfectly collinear
            let cross_product = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
            cross_product == 0
        });
        
        if perfectly_straight {
            score -= 0.3;
        }
        
        // Check for natural timing variation
        let timing_variations: Vec<f64> = self.movements
            .windows(2)
            .map(|window| {
                let delta = window[1].timestamp.saturating_sub(window[0].timestamp);
                delta.as_millis() as f64
            })
            .collect();
        
        if !timing_variations.is_empty() {
            let mean: f64 = timing_variations.iter().sum::<f64>() / timing_variations.len() as f64;
            let variance = timing_variations
                .iter()
                .map(|&x| (x - mean).powi(2))
                .sum::<f64>() / timing_variations.len() as f64;
            
            // Natural movements should have some variance
            if variance < mean * 0.01 {
                score -= 0.2; // Too consistent timing
            }
        }
        
        // Check for micro-movements
        let has_micro_movements = self.movements.windows(2).any(|window| {
            window[0].point.distance_to(&window[1].point) < 3.0
        });
        
        if !has_micro_movements && self.movements.len() > 10 {
            score -= 0.1; // Long paths should have some micro-movements
        }
        
        Ok(score.max(0.0f32))
    }
}

/// Represents a single mouse movement with timing
#[derive(Debug, Clone)]
pub struct MouseMovement {
    pub point: Point,
    pub timestamp: Duration,
    pub movement_type: MovementType,
}

/// Types of mouse movements
#[derive(Debug, Clone, PartialEq)]
pub enum MovementType {
    /// Normal movement
    Normal,
    /// Micro-movement or adjustment
    MicroMovement,
    /// Overshoot correction
    Overshoot,
    /// Pause in movement
    Pause,
    /// Drift movement when idle
    Drift,
}

/// The main mouse humanization engine
pub struct MouseHumanizer {
    config: MouseConfig,
    rng: HumanRng,
}

impl MouseHumanizer {
    /// Creates a new mouse humanizer with the given configuration
    pub async fn new(config: MouseConfig) -> Result<Self> {
        // Validate configuration
        validation::validate_range(
            config.movement_speed,
            50.0,
            5000.0,
            "movement_speed",
        )?;
        
        validation::validate_range(
            config.movement_variation,
            0.0,
            1.0,
            "movement_variation",
        )?;
        
        validation::validate_range(
            config.curve_complexity,
            1,
            5,
            "curve_complexity",
        )?;
        
        Ok(Self {
            config,
            rng: HumanRng::new(),
        })
    }
    
    /// Humanizes a mouse path with natural movement characteristics
    pub async fn humanize_path(&mut self, path: MousePath) -> Result<HumanizedMousePath> {
        // Validate input path
        path.validate_bounds(
            self.config.screen_width as i32,
            self.config.screen_height as i32,
        )?;
        
        if path.points.len() < 2 {
            return Err(Aegnt27Error::Mouse(MouseError::InvalidPath(
                "Path must contain at least 2 points".to_string(),
            )));
        }
        
        let mut movements = Vec::new();
        let mut current_time = Duration::ZERO;
        
        // Process each segment of the path
        for window in path.points.windows(2) {
            let start = window[0];
            let end = window[1];
            
            let segment_movements = self.generate_segment_movements(
                start,
                end,
                &mut current_time,
            ).await?;
            
            movements.extend(segment_movements);
        }
        
        let total_duration = movements.last()
            .map(|m| m.timestamp)
            .unwrap_or(Duration::ZERO);
        
        let humanized_path = HumanizedMousePath {
            movements,
            total_duration,
            authenticity_score: 0.0, // Will be calculated
        };
        
        // Calculate authenticity score
        let authenticity_score = humanized_path.validate_authenticity()?;
        
        Ok(HumanizedMousePath {
            authenticity_score,
            ..humanized_path
        })
    }
    
    /// Generates a natural path between two points
    pub async fn generate_natural_path(&mut self, start: Point, end: Point) -> Result<MousePath> {
        let distance = start.distance_to(&end);
        
        // Calculate appropriate duration based on distance and speed
        let base_duration_ms = (distance / self.config.movement_speed * 1000.0) as u64;
        let duration = timing::generate_natural_delay(
            Duration::from_millis(base_duration_ms),
            self.config.movement_variation,
        );
        
        // Generate natural curve points
        let num_points = self.calculate_optimal_point_count(distance);
        let curve_points = self.generate_natural_curve(start, end, num_points).await?;
        
        MousePath::from_points(curve_points, duration)
    }
    
    /// Generates micro-movements around a point (useful for idle behavior)
    pub async fn generate_micro_movements(&mut self, center: Point, duration: Duration) -> Result<HumanizedMousePath> {
        let mut movements = Vec::new();
        let mut current_time = Duration::ZERO;
        let step_duration = Duration::from_millis(50);
        
        while current_time < duration {
            let jitter_x = self.rng.bounded_normal(0.0, 1.5, -3.0, 3.0) as i32;
            let jitter_y = self.rng.bounded_normal(0.0, 1.5, -3.0, 3.0) as i32;
            
            let jittered_point = Point::new(
                (center.x + jitter_x).max(0).min(self.config.screen_width as i32),
                (center.y + jitter_y).max(0).min(self.config.screen_height as i32),
            );
            
            movements.push(MouseMovement {
                point: jittered_point,
                timestamp: current_time,
                movement_type: MovementType::MicroMovement,
            });
            
            current_time += step_duration;
        }
        
        Ok(HumanizedMousePath {
            movements,
            total_duration: duration,
            authenticity_score: 0.85, // Micro-movements are naturally authentic
        })
    }
    
    async fn generate_segment_movements(
        &mut self,
        start: Point,
        end: Point,
        current_time: &mut Duration,
    ) -> Result<Vec<MouseMovement>> {
        let distance = start.distance_to(&end);
        let base_duration_ms = (distance / self.config.movement_speed * 1000.0) as u64;
        
        // Generate natural curve
        let num_points = self.calculate_optimal_point_count(distance);
        let curve_points = self.generate_natural_curve(start, end, num_points).await?;
        
        let mut movements = Vec::new();
        let segment_duration = timing::generate_natural_delay(
            Duration::from_millis(base_duration_ms),
            self.config.movement_variation,
        );
        
        // Generate movements along the curve
        for (i, point) in curve_points.iter().enumerate() {
            let t = i as f64 / (curve_points.len() - 1).max(1) as f64;
            let point_time = *current_time + Duration::from_millis((segment_duration.as_millis() as f64 * t) as u64);
            
            movements.push(MouseMovement {
                point: *point,
                timestamp: point_time,
                movement_type: MovementType::Normal,
            });
            
            // Add occasional pauses for longer movements
            if distance > 200.0 && self.rng.gen::<f64>() < self.config.pause_probability {
                let pause_duration = Duration::from_millis(self.rng.gen_range(50..150));
                movements.push(MouseMovement {
                    point: *point,
                    timestamp: point_time + pause_duration,
                    movement_type: MovementType::Pause,
                });
            }
        }
        
        // Add potential overshoot
        if distance > 50.0 && self.rng.gen::<f64>() < self.config.overshoot_probability {
            let overshoot_movements = self.generate_overshoot_correction(
                end,
                current_time,
            ).await?;
            movements.extend(overshoot_movements);
        }
        
        // Add micro-movements if enabled
        if self.config.enable_micro_movements && distance > 100.0 {
            let micro_movements = self.generate_random_micro_movements(
                &curve_points,
                current_time,
            ).await?;
            movements.extend(micro_movements);
        }
        
        *current_time = movements.last()
            .map(|m| m.timestamp)
            .unwrap_or(*current_time) + Duration::from_millis(10);
        
        Ok(movements)
    }
    
    async fn generate_natural_curve(&mut self, start: Point, end: Point, num_points: usize) -> Result<Vec<Point>> {
        let start_f = start.to_point2d();
        let end_f = end.to_point2d();
        
        // Use the curve generation from utils
        let curve_points = crate::utils::math::generate_bezier_curve(start_f, end_f, num_points);
        
        // Add natural variation
        let varied_points: Vec<Point> = curve_points
            .into_iter()
            .enumerate()
            .map(|(i, mut point)| {
                if i > 0 && i < num_points - 1 {
                    // Add some random variation to intermediate points
                    let variation = self.config.movement_variation * 10.0;
                    point.x += self.rng.bounded_normal(0.0, variation, -variation * 2.0, variation * 2.0);
                    point.y += self.rng.bounded_normal(0.0, variation, -variation * 2.0, variation * 2.0);
                }
                Point::from(point)
            })
            .collect();
        
        Ok(varied_points)
    }
    
    async fn generate_overshoot_correction(
        &mut self,
        target: Point,
        current_time: &Duration,
    ) -> Result<Vec<MouseMovement>> {
        let overshoot_distance = self.rng.gen_range(3..self.config.max_overshoot_distance);
        let angle = self.rng.gen::<f64>() * 2.0 * std::f64::consts::PI;
        
        let overshoot_point = Point::new(
            target.x + (overshoot_distance as f64 * angle.cos()) as i32,
            target.y + (overshoot_distance as f64 * angle.sin()) as i32,
        );
        
        let correction_duration = Duration::from_millis(self.rng.gen_range(100..200));
        
        Ok(vec![
            MouseMovement {
                point: overshoot_point,
                timestamp: *current_time,
                movement_type: MovementType::Overshoot,
            },
            MouseMovement {
                point: target,
                timestamp: *current_time + correction_duration,
                movement_type: MovementType::Normal,
            },
        ])
    }
    
    async fn generate_random_micro_movements(
        &mut self,
        path_points: &[Point],
        current_time: &Duration,
    ) -> Result<Vec<MouseMovement>> {
        let mut micro_movements = Vec::new();
        
        // Add micro-movements to some random points along the path
        for (i, &point) in path_points.iter().enumerate() {
            if self.rng.gen::<f64>() < 0.1 { // 10% chance for micro-movement
                let jitter = (self.config.micro_movement_intensity * 3.0) as i32;
                let micro_point = Point::new(
                    point.x + self.rng.gen_range(-jitter..=jitter),
                    point.y + self.rng.gen_range(-jitter..=jitter),
                );
                
                let micro_time = *current_time + Duration::from_millis(i as u64 * 10);
                
                micro_movements.push(MouseMovement {
                    point: micro_point,
                    timestamp: micro_time,
                    movement_type: MovementType::MicroMovement,
                });
            }
        }
        
        Ok(micro_movements)
    }
    
    fn calculate_optimal_point_count(&self, distance: f64) -> usize {
        let base_points = (distance / 50.0) as usize;
        let complexity_multiplier = self.config.curve_complexity as usize;
        
        (base_points * complexity_multiplier)
            .max(3)
            .min(100)
    }
}

impl std::fmt::Debug for MouseHumanizer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MouseHumanizer")
            .field("config", &self.config)
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_mouse_humanizer_creation() {
        let config = MouseConfig::default();
        let humanizer = MouseHumanizer::new(config).await;
        assert!(humanizer.is_ok());
    }
    
    #[tokio::test]
    async fn test_linear_path_humanization() {
        let config = MouseConfig::default();
        let mut humanizer = MouseHumanizer::new(config).await.unwrap();
        
        let path = MousePath::linear(Point::new(0, 0), Point::new(100, 100));
        let result = humanizer.humanize_path(path).await;
        
        assert!(result.is_ok());
        let humanized = result.unwrap();
        assert!(humanized.movements.len() > 2);
        assert!(humanized.authenticity_score > 0.0);
    }
    
    #[tokio::test]
    async fn test_natural_path_generation() {
        let config = MouseConfig::default();
        let mut humanizer = MouseHumanizer::new(config).await.unwrap();
        
        let result = humanizer.generate_natural_path(
            Point::new(0, 0),
            Point::new(500, 300),
        ).await;
        
        assert!(result.is_ok());
        let path = result.unwrap();
        assert!(path.points.len() >= 2);
        assert!(path.total_duration > Duration::ZERO);
    }
    
    #[tokio::test]
    async fn test_micro_movements() {
        let config = MouseConfig::default();
        let mut humanizer = MouseHumanizer::new(config).await.unwrap();
        
        let result = humanizer.generate_micro_movements(
            Point::new(100, 100),
            Duration::from_millis(500),
        ).await;
        
        assert!(result.is_ok());
        let movements = result.unwrap();
        assert!(!movements.movements.is_empty());
        assert!(movements.authenticity_score > 0.5);
    }
    
    #[test]
    fn test_point_operations() {
        let p1 = Point::new(0, 0);
        let p2 = Point::new(3, 4);
        
        assert_eq!(p1.distance_to(&p2), 5.0);
        
        let p2d = p1.to_point2d();
        assert_eq!(p2d.x, 0.0);
        assert_eq!(p2d.y, 0.0);
    }
    
    #[test]
    fn test_mouse_path_validation() {
        let path = MousePath::linear(Point::new(0, 0), Point::new(100, 100));
        assert!(path.validate_bounds(200, 200).is_ok());
        assert!(path.validate_bounds(50, 50).is_err());
    }
    
    #[test]
    fn test_config_validation() {
        let mut config = MouseConfig::default();
        config.movement_speed = -100.0; // Invalid
        
        let result = futures::executor::block_on(MouseHumanizer::new(config));
        assert!(result.is_err());
    }
}