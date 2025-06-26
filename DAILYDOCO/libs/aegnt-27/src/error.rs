//! Error handling types for aegnt-27: The Human Peak Protocol
//! 
//! This module provides a comprehensive error handling system for all aegnt-27 operations,
//! including detailed error context, recovery suggestions, and integration with the logging system.

use std::fmt;
use std::error::Error as StdError;

/// The main error type for aegnt-27 operations
/// 
/// This enum covers all possible error conditions that can occur during
/// authenticity achievement, human authenticity validation, and system operations.
#[derive(Debug, Clone)]
pub enum Aegnt27Error {
    /// Configuration-related errors
    Config(String),
    
    /// Input/output errors (file operations, network, etc.)
    Io(String),
    
    /// Mouse authenticity errors
    #[cfg(feature = "mouse")]
    Mouse(MouseError),
    
    /// Typing authenticity errors
    #[cfg(feature = "typing")]
    Typing(TypingError),
    
    /// Audio processing errors
    #[cfg(feature = "audio")]
    Audio(AudioError),
    
    /// Visual enhancement errors
    #[cfg(feature = "visual")]
    Visual(VisualError),
    
    /// AI detection resistance errors
    #[cfg(feature = "detection")]
    Detection(DetectionError),
    
    /// Performance monitoring errors
    Performance(PerformanceError),
    
    /// Privacy/security errors
    Privacy(PrivacyError),
    
    /// System resource errors
    Resource(ResourceError),
    
    /// Serialization/deserialization errors
    Serialization(String),
    
    /// Network-related errors
    Network(NetworkError),
    
    /// Timeout errors
    Timeout(String),
    
    /// Internal logic errors (should not occur in normal operation)
    Internal(String),
    
    /// Feature not available/enabled
    FeatureNotAvailable(String),
    
    /// Validation errors
    Validation(ValidationError),
}

/// Mouse authenticity achievement specific errors
#[cfg(feature = "mouse")]
#[derive(Debug, Clone)]
pub enum MouseError {
    /// Invalid mouse coordinates
    InvalidCoordinates { x: i32, y: i32, reason: String },
    
    /// Invalid movement path
    InvalidPath(String),
    
    /// Screen bounds exceeded
    ScreenBoundsExceeded { x: i32, y: i32, max_x: i32, max_y: i32 },
    
    /// Movement generation failed
    GenerationFailed(String),
    
    /// Hardware interaction failed
    HardwareFailed(String),
    
    /// Curve generation error
    CurveError(String),
}

/// Typing authenticity achievement specific errors
#[cfg(feature = "typing")]
#[derive(Debug, Clone)]
pub enum TypingError {
    /// Invalid text input
    InvalidText(String),
    
    /// Keyboard layout not supported
    UnsupportedLayout(String),
    
    /// Timing calculation failed
    TimingCalculationFailed(String),
    
    /// Error injection failed
    ErrorInjectionFailed(String),
    
    /// Hardware simulation failed
    SimulationFailed(String),
    
    /// Pattern analysis failed
    PatternAnalysisFailed(String),
}

/// Audio processing specific errors
#[cfg(feature = "audio")]
#[derive(Debug, Clone)]
pub enum AudioError {
    /// Invalid audio format
    InvalidFormat(String),
    
    /// Audio codec not supported
    UnsupportedCodec(String),
    
    /// Audio processing failed
    ProcessingFailed(String),
    
    /// Breathing pattern generation failed
    BreathingPatternFailed(String),
    
    /// Voice synthesis failed
    VoiceSynthesisFailed(String),
    
    /// Audio device error
    DeviceError(String),
    
    /// Spectral analysis failed
    SpectralAnalysisFailed(String),
}

/// Visual enhancement specific errors
#[cfg(feature = "visual")]
#[derive(Debug, Clone)]
pub enum VisualError {
    /// Invalid video format
    InvalidFormat(String),
    
    /// Frame processing failed
    FrameProcessingFailed(String),
    
    /// Gaze pattern generation failed
    GazePatternFailed(String),
    
    /// Visual effects application failed
    EffectsApplicationFailed(String),
    
    /// Color space conversion failed
    ColorSpaceConversionFailed(String),
    
    /// Resolution not supported
    UnsupportedResolution { width: u32, height: u32 },
}

/// AI detection resistance specific errors
#[cfg(feature = "detection")]
#[derive(Debug, Clone)]
pub enum DetectionError {
    /// Content validation failed
    ValidationFailed(String),
    
    /// AI detector not available
    DetectorUnavailable(String),
    
    /// Strategy generation failed
    StrategyGenerationFailed(String),
    
    /// Authenticity analysis failed
    AuthenticityAnalysisFailed(String),
    
    /// Model inference failed
    ModelInferenceFailed(String),
    
    /// Content preprocessing failed
    PreprocessingFailed(String),
}

/// Performance monitoring errors
#[derive(Debug, Clone)]
pub enum PerformanceError {
    /// Metric collection failed
    MetricCollectionFailed(String),
    
    /// Performance threshold exceeded
    ThresholdExceeded { metric: String, value: f64, threshold: f64 },
    
    /// Benchmark execution failed
    BenchmarkFailed(String),
    
    /// Resource monitoring failed
    MonitoringFailed(String),
}

/// Privacy and security errors
#[derive(Debug, Clone)]
pub enum PrivacyError {
    /// Encryption failed
    EncryptionFailed(String),
    
    /// Decryption failed
    DecryptionFailed(String),
    
    /// Key derivation failed
    KeyDerivationFailed(String),
    
    /// Data sanitization failed
    SanitizationFailed(String),
    
    /// Privacy policy violation
    PolicyViolation(String),
    
    /// Sensitive content detected
    SensitiveContentDetected(String),
}

/// System resource errors
#[derive(Debug, Clone)]
pub enum ResourceError {
    /// Insufficient memory
    InsufficientMemory { required: usize, available: usize },
    
    /// Insufficient disk space
    InsufficientDiskSpace { required: u64, available: u64 },
    
    /// CPU resources exhausted
    CpuResourcesExhausted,
    
    /// GPU not available
    GpuNotAvailable,
    
    /// System overloaded
    SystemOverloaded(String),
    
    /// Resource allocation failed
    AllocationFailed(String),
}

/// Network-related errors
#[derive(Debug, Clone)]
pub enum NetworkError {
    /// Connection failed
    ConnectionFailed(String),
    
    /// Request timeout
    RequestTimeout,
    
    /// Invalid response
    InvalidResponse(String),
    
    /// Rate limit exceeded
    RateLimitExceeded,
    
    /// Service unavailable
    ServiceUnavailable(String),
    
    /// Authentication failed
    AuthenticationFailed,
}

/// Validation errors
#[derive(Debug, Clone)]
pub enum ValidationError {
    /// Required field missing
    RequiredFieldMissing(String),
    
    /// Invalid field value
    InvalidFieldValue { field: String, value: String, reason: String },
    
    /// Range validation failed
    RangeValidationFailed { field: String, min: f64, max: f64, actual: f64 },
    
    /// Format validation failed
    FormatValidationFailed { field: String, expected: String, actual: String },
    
    /// Constraint violation
    ConstraintViolation(String),
}

/// Convenience type alias for Results
pub type Result<T> = std::result::Result<T, Aegnt27Error>;

impl fmt::Display for Aegnt27Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Aegnt27Error::Config(msg) => write!(f, "Configuration error: {}", msg),
            Aegnt27Error::Io(msg) => write!(f, "I/O error: {}", msg),
            
            #[cfg(feature = "mouse")]
            Aegnt27Error::Mouse(err) => write!(f, "Mouse error: {}", err),
            
            #[cfg(feature = "typing")]
            Aegnt27Error::Typing(err) => write!(f, "Typing error: {}", err),
            
            #[cfg(feature = "audio")]
            Aegnt27Error::Audio(err) => write!(f, "Audio error: {}", err),
            
            #[cfg(feature = "visual")]
            Aegnt27Error::Visual(err) => write!(f, "Visual error: {}", err),
            
            #[cfg(feature = "detection")]
            Aegnt27Error::Detection(err) => write!(f, "Detection error: {}", err),
            
            Aegnt27Error::Performance(err) => write!(f, "Performance error: {}", err),
            Aegnt27Error::Privacy(err) => write!(f, "Privacy error: {}", err),
            Aegnt27Error::Resource(err) => write!(f, "Resource error: {}", err),
            Aegnt27Error::Serialization(msg) => write!(f, "Serialization error: {}", msg),
            Aegnt27Error::Network(err) => write!(f, "Network error: {}", err),
            Aegnt27Error::Timeout(msg) => write!(f, "Timeout error: {}", msg),
            Aegnt27Error::Internal(msg) => write!(f, "Internal error: {}", msg),
            Aegnt27Error::FeatureNotAvailable(feature) => write!(f, "Feature not available: {}", feature),
            Aegnt27Error::Validation(err) => write!(f, "Validation error: {}", err),
        }
    }
}

#[cfg(feature = "mouse")]
impl fmt::Display for MouseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MouseError::InvalidCoordinates { x, y, reason } => {
                write!(f, "Invalid coordinates ({}, {}): {}", x, y, reason)
            }
            MouseError::InvalidPath(msg) => write!(f, "Invalid path: {}", msg),
            MouseError::ScreenBoundsExceeded { x, y, max_x, max_y } => {
                write!(f, "Screen bounds exceeded: ({}, {}) outside (0, 0) - ({}, {})", x, y, max_x, max_y)
            }
            MouseError::GenerationFailed(msg) => write!(f, "Movement generation failed: {}", msg),
            MouseError::HardwareFailed(msg) => write!(f, "Hardware interaction failed: {}", msg),
            MouseError::CurveError(msg) => write!(f, "Curve generation error: {}", msg),
        }
    }
}

#[cfg(feature = "typing")]
impl fmt::Display for TypingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TypingError::InvalidText(msg) => write!(f, "Invalid text: {}", msg),
            TypingError::UnsupportedLayout(layout) => write!(f, "Unsupported keyboard layout: {}", layout),
            TypingError::TimingCalculationFailed(msg) => write!(f, "Timing calculation failed: {}", msg),
            TypingError::ErrorInjectionFailed(msg) => write!(f, "Error injection failed: {}", msg),
            TypingError::SimulationFailed(msg) => write!(f, "Hardware simulation failed: {}", msg),
            TypingError::PatternAnalysisFailed(msg) => write!(f, "Pattern analysis failed: {}", msg),
        }
    }
}

#[cfg(feature = "audio")]
impl fmt::Display for AudioError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AudioError::InvalidFormat(msg) => write!(f, "Invalid audio format: {}", msg),
            AudioError::UnsupportedCodec(codec) => write!(f, "Unsupported codec: {}", codec),
            AudioError::ProcessingFailed(msg) => write!(f, "Audio processing failed: {}", msg),
            AudioError::BreathingPatternFailed(msg) => write!(f, "Breathing pattern generation failed: {}", msg),
            AudioError::VoiceSynthesisFailed(msg) => write!(f, "Voice synthesis failed: {}", msg),
            AudioError::DeviceError(msg) => write!(f, "Audio device error: {}", msg),
            AudioError::SpectralAnalysisFailed(msg) => write!(f, "Spectral analysis failed: {}", msg),
        }
    }
}

#[cfg(feature = "visual")]
impl fmt::Display for VisualError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            VisualError::InvalidFormat(msg) => write!(f, "Invalid video format: {}", msg),
            VisualError::FrameProcessingFailed(msg) => write!(f, "Frame processing failed: {}", msg),
            VisualError::GazePatternFailed(msg) => write!(f, "Gaze pattern generation failed: {}", msg),
            VisualError::EffectsApplicationFailed(msg) => write!(f, "Effects application failed: {}", msg),
            VisualError::ColorSpaceConversionFailed(msg) => write!(f, "Color space conversion failed: {}", msg),
            VisualError::UnsupportedResolution { width, height } => {
                write!(f, "Unsupported resolution: {}x{}", width, height)
            }
        }
    }
}

#[cfg(feature = "detection")]
impl fmt::Display for DetectionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DetectionError::ValidationFailed(msg) => write!(f, "Content validation failed: {}", msg),
            DetectionError::DetectorUnavailable(detector) => write!(f, "AI detector unavailable: {}", detector),
            DetectionError::StrategyGenerationFailed(msg) => write!(f, "Strategy generation failed: {}", msg),
            DetectionError::AuthenticityAnalysisFailed(msg) => write!(f, "Authenticity analysis failed: {}", msg),
            DetectionError::ModelInferenceFailed(msg) => write!(f, "Model inference failed: {}", msg),
            DetectionError::PreprocessingFailed(msg) => write!(f, "Content preprocessing failed: {}", msg),
        }
    }
}

impl fmt::Display for PerformanceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PerformanceError::MetricCollectionFailed(msg) => write!(f, "Metric collection failed: {}", msg),
            PerformanceError::ThresholdExceeded { metric, value, threshold } => {
                write!(f, "Performance threshold exceeded for {}: {} > {}", metric, value, threshold)
            }
            PerformanceError::BenchmarkFailed(msg) => write!(f, "Benchmark execution failed: {}", msg),
            PerformanceError::MonitoringFailed(msg) => write!(f, "Resource monitoring failed: {}", msg),
        }
    }
}

impl fmt::Display for PrivacyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PrivacyError::EncryptionFailed(msg) => write!(f, "Encryption failed: {}", msg),
            PrivacyError::DecryptionFailed(msg) => write!(f, "Decryption failed: {}", msg),
            PrivacyError::KeyDerivationFailed(msg) => write!(f, "Key derivation failed: {}", msg),
            PrivacyError::SanitizationFailed(msg) => write!(f, "Data sanitization failed: {}", msg),
            PrivacyError::PolicyViolation(msg) => write!(f, "Privacy policy violation: {}", msg),
            PrivacyError::SensitiveContentDetected(msg) => write!(f, "Sensitive content detected: {}", msg),
        }
    }
}

impl fmt::Display for ResourceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ResourceError::InsufficientMemory { required, available } => {
                write!(f, "Insufficient memory: required {} bytes, available {} bytes", required, available)
            }
            ResourceError::InsufficientDiskSpace { required, available } => {
                write!(f, "Insufficient disk space: required {} bytes, available {} bytes", required, available)
            }
            ResourceError::CpuResourcesExhausted => write!(f, "CPU resources exhausted"),
            ResourceError::GpuNotAvailable => write!(f, "GPU not available"),
            ResourceError::SystemOverloaded(msg) => write!(f, "System overloaded: {}", msg),
            ResourceError::AllocationFailed(msg) => write!(f, "Resource allocation failed: {}", msg),
        }
    }
}

impl fmt::Display for NetworkError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NetworkError::ConnectionFailed(msg) => write!(f, "Connection failed: {}", msg),
            NetworkError::RequestTimeout => write!(f, "Request timeout"),
            NetworkError::InvalidResponse(msg) => write!(f, "Invalid response: {}", msg),
            NetworkError::RateLimitExceeded => write!(f, "Rate limit exceeded"),
            NetworkError::ServiceUnavailable(service) => write!(f, "Service unavailable: {}", service),
            NetworkError::AuthenticationFailed => write!(f, "Authentication failed"),
        }
    }
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ValidationError::RequiredFieldMissing(field) => write!(f, "Required field missing: {}", field),
            ValidationError::InvalidFieldValue { field, value, reason } => {
                write!(f, "Invalid field value for {}: '{}' - {}", field, value, reason)
            }
            ValidationError::RangeValidationFailed { field, min, max, actual } => {
                write!(f, "Range validation failed for {}: {} not in range [{}, {}]", field, actual, min, max)
            }
            ValidationError::FormatValidationFailed { field, expected, actual } => {
                write!(f, "Format validation failed for {}: expected '{}', got '{}'", field, expected, actual)
            }
            ValidationError::ConstraintViolation(msg) => write!(f, "Constraint violation: {}", msg),
        }
    }
}

impl StdError for Aegnt27Error {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        None
    }
}

// Error conversion implementations
impl From<std::io::Error> for Aegnt27Error {
    fn from(err: std::io::Error) -> Self {
        Aegnt27Error::Io(err.to_string())
    }
}

impl From<serde_json::Error> for Aegnt27Error {
    fn from(err: serde_json::Error) -> Self {
        Aegnt27Error::Serialization(format!("JSON error: {}", err))
    }
}

impl From<toml::de::Error> for Aegnt27Error {
    fn from(err: toml::de::Error) -> Self {
        Aegnt27Error::Serialization(format!("TOML deserialization error: {}", err))
    }
}

impl From<toml::ser::Error> for Aegnt27Error {
    fn from(err: toml::ser::Error) -> Self {
        Aegnt27Error::Serialization(format!("TOML serialization error: {}", err))
    }
}

/// Helper trait for adding context to errors
pub trait ErrorContext<T> {
    /// Adds context to an error
    fn with_context<F>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> String;
    
    /// Adds context to an error with a static string
    fn context(self, msg: &'static str) -> Result<T>;
}

impl<T, E> ErrorContext<T> for std::result::Result<T, E>
where
    E: Into<Aegnt27Error>,
{
    fn with_context<F>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> String,
    {
        self.map_err(|e| {
            let original = e.into();
            let context = f();
            Aegnt27Error::Internal(format!("{}: {}", context, original))
        })
    }
    
    fn context(self, msg: &'static str) -> Result<T> {
        self.with_context(|| msg.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_display() {
        let config_error = Aegnt27Error::Config("Invalid setting".to_string());
        assert_eq!(config_error.to_string(), "Configuration error: Invalid setting");
        
        let io_error = Aegnt27Error::Io("File not found".to_string());
        assert_eq!(io_error.to_string(), "I/O error: File not found");
    }
    
    #[test]
    fn test_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
        let aegnt_err: Aegnt27Error = io_err.into();
        
        match aegnt_err {
            Aegnt27Error::Io(msg) => assert!(msg.contains("File not found")),
            _ => panic!("Expected Aegnt27Error::Io"),
        }
    }
    
    #[test]
    fn test_error_context() {
        let result: std::result::Result<(), std::io::Error> = Err(
            std::io::Error::new(std::io::ErrorKind::NotFound, "File not found")
        );
        
        let with_context = result.context("Failed to read config file");
        assert!(with_context.is_err());
        
        match with_context.unwrap_err() {
            Aegnt27Error::Internal(msg) => assert!(msg.contains("Failed to read config file")),
            _ => panic!("Expected Aegnt27Error::Internal"),
        }
    }
    
    #[cfg(feature = "mouse")]
    #[test]
    fn test_mouse_error_display() {
        let error = MouseError::InvalidCoordinates {
            x: -10,
            y: -20,
            reason: "Negative coordinates".to_string(),
        };
        
        let display = format!("{}", error);
        assert!(display.contains("Invalid coordinates"));
        assert!(display.contains("-10"));
        assert!(display.contains("-20"));
        assert!(display.contains("Negative coordinates"));
    }
}