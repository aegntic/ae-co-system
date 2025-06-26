/*!
 * aegnt-27 - Basic Integration Example
 * 
 * Demonstrates basic usage of aegnt-27 for mouse and typing humanization
 */

use aegnt_27::prelude::*;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Initialize aegnt-27 with default configuration
    aegnt_27::init().await?;
    
    println!("🧠 aegnt-27 Basic Integration Example");
    println!("=====================================");
    
    // Example 1: Basic Mouse Movement Humanization
    println!("\n📱 Example 1: Mouse Movement Humanization");
    basic_mouse_humanization().await?;
    
    // Example 2: Basic Typing Humanization
    println!("\n⌨️  Example 2: Typing Humanization");
    basic_typing_humanization().await?;
    
    // Example 3: AI Detection Validation
    println!("\n🛡️  Example 3: AI Detection Validation");
    basic_detection_validation().await?;
    
    println!("\n✅ All examples completed successfully!");
    
    Ok(())
}

async fn basic_mouse_humanization() -> Result<(), Box<dyn Error>> {
    // Create a mouse humanizer with default settings
    let humanizer = MouseHumanizer::new().await?;
    
    // Create a simple mouse path from point A to point B
    let start_point = MousePoint {
        timestamp: 0.0,
        coordinates: Coordinates { x: 100.0, y: 100.0, screen_relative: true },
        velocity: Velocity { x_velocity: 0.0, y_velocity: 0.0, magnitude: 0.0, direction: 0.0 },
        acceleration: Acceleration { x_acceleration: 0.0, y_acceleration: 0.0, magnitude: 0.0, jerk: 0.0 },
        pressure: None,
        movement_type: MovementType::InitialMovement,
    };
    
    let end_point = MousePoint {
        timestamp: 0.8,
        coordinates: Coordinates { x: 500.0, y: 300.0, screen_relative: true },
        velocity: Velocity { x_velocity: 0.0, y_velocity: 0.0, magnitude: 0.0, direction: 0.0 },
        acceleration: Acceleration { x_acceleration: 0.0, y_acceleration: 0.0, magnitude: 0.0, jerk: 0.0 },
        pressure: None,
        movement_type: MovementType::ContinuousMovement,
    };
    
    let original_path = MousePath {
        path_id: Uuid::new_v4(),
        movement_points: vec![start_point, end_point],
        total_duration: 0.8,
        path_type: MousePathType::DirectMovement { efficiency: 0.9 },
        target_coordinates: Coordinates { x: 500.0, y: 300.0, screen_relative: true },
        source_coordinates: Coordinates { x: 100.0, y: 100.0, screen_relative: true },
        movement_intent: MovementIntent::PreciseNavigation,
    };
    
    // Create humanization input
    let input = MouseHumanizationInput {
        user_id: Uuid::new_v4(),
        original_mouse_path: original_path,
        context_information: MouseContextInformation::default(),
        humanization_preferences: MouseHumanizationPreferences::default(),
        target_authenticity: 0.96,
        environmental_conditions: EnvironmentalConditions::default(),
    };
    
    // Humanize the mouse movement
    println!("   Humanizing mouse movement...");
    let result = humanizer.humanize_mouse_movement(input).await?;
    
    // Display results
    println!("   ✓ Original path had {} points", 2);
    println!("   ✓ Humanized path has {} points", result.humanized_mouse_path.humanized_points.len());
    println!("   ✓ Authenticity score: {:.1}%", result.authenticity_scores.overall_authenticity * 100.0);
    println!("   ✓ Naturalness score: {:.1}%", result.humanized_mouse_path.naturalness_score * 100.0);
    println!("   ✓ Detection resistance: {:.1}%", result.humanized_mouse_path.detection_resistance_score * 100.0);
    
    Ok(())
}

async fn basic_typing_humanization() -> Result<(), Box<dyn Error>> {
    // Create a typing humanizer with default settings
    let humanizer = TypingHumanizer::new().await?;
    
    // Create a simple typing sequence
    let text_to_type = "Hello, world! This is a test of HUMaiN2.7 typing humanization.";
    
    let input = TypingHumanizationInput {
        user_id: Uuid::new_v4(),
        text_content: text_to_type.to_string(),
        typing_context: TypingContext::default(),
        humanization_preferences: TypingHumanizationPreferences::default(),
        target_authenticity: 0.94,
        environmental_conditions: TypingEnvironmentalConditions::default(),
    };
    
    // Humanize the typing sequence
    println!("   Humanizing typing sequence...");
    let result = humanizer.humanize_typing_sequence(input).await?;
    
    // Display results
    println!("   ✓ Original text: \"{}\"", text_to_type);
    println!("   ✓ Humanized sequence has {} keystrokes", result.humanized_sequence.keystrokes.len());
    println!("   ✓ Authenticity score: {:.1}%", result.authenticity_scores.overall_authenticity * 100.0);
    println!("   ✓ Natural rhythm score: {:.1}%", result.authenticity_scores.rhythm_authenticity * 100.0);
    println!("   ✓ Estimated typing time: {:.2}s", result.humanized_sequence.total_duration);
    
    // Show some keystroke timing examples
    println!("   ✓ Sample keystroke timings:");
    for (i, keystroke) in result.humanized_sequence.keystrokes.iter().take(5).enumerate() {
        println!("      {} -> {} at {:.3}s ({}ms interval)", 
            keystroke.character, 
            keystroke.key_code,
            keystroke.timestamp,
            (keystroke.inter_key_interval * 1000.0) as u32);
    }
    
    Ok(())
}

async fn basic_detection_validation() -> Result<(), Box<dyn Error>> {
    // Create an AI detection validator
    let validator = AIDetectionValidator::new().await?;
    
    // Prepare some content for testing
    let test_content = "This is a sample text that we want to validate against AI detection systems. \
                       The text should appear natural and human-written to avoid detection by \
                       various AI detection algorithms like GPTZero and Originality.ai.";
    
    let content_data = ContentData {
        raw_content: test_content.as_bytes().to_vec(),
        processed_content: None,
        content_features: ContentFeatures::default(),
        authenticity_markers: vec![],
        humanization_applied: vec![],
    };
    
    let validation_input = ValidationInput {
        content_id: Uuid::new_v4(),
        content_type: ContentType::TextContent {
            text_data: test_content.to_string(),
            formatting_info: FormattingInfo::default(),
            metadata: TextMetadata::default(),
        },
        content_data,
        validation_scope: ValidationScope::default(),
        resistance_requirements: ResistanceRequirements::default(),
        testing_parameters: TestingParameters::default(),
    };
    
    // Validate against AI detectors
    println!("   Validating content against AI detectors...");
    let result = validator.validate_against_detectors(validation_input).await?;
    
    // Display results
    println!("   ✓ Overall resistance score: {:.1}%", result.overall_resistance_score * 100.0);
    println!("   ✓ Detection evasion success: {}", if result.detection_evasion_success { "✅ YES" } else { "❌ NO" });
    println!("   ✓ Detectors tested: {}", result.detector_test_results.len());
    
    // Show individual detector results
    for detector_result in &result.detector_test_results {
        let detector_name = match &detector_result.detector_type {
            DetectorType::GPTZero { .. } => "GPTZero",
            DetectorType::OriginalityAI { .. } => "Originality.ai",
            DetectorType::YouTube { .. } => "YouTube",
            DetectorType::Turnitin { .. } => "Turnitin",
            _ => "Other",
        };
        
        let verdict_text = match &detector_result.detection_verdict {
            DetectionVerdict::Human { confidence, .. } => format!("Human ({:.1}%)", confidence * 100.0),
            DetectionVerdict::AI { confidence, .. } => format!("AI ({:.1}%)", confidence * 100.0),
            DetectionVerdict::Uncertain { confidence, .. } => format!("Uncertain ({:.1}%)", confidence * 100.0),
            DetectionVerdict::Mixed { .. } => "Mixed".to_string(),
        };
        
        println!("      {} -> {} (Resistance: {:.1}%)", 
            detector_name, 
            verdict_text,
            detector_result.resistance_effectiveness * 100.0);
    }
    
    // Show vulnerability assessment
    if !result.vulnerability_assessment.critical_vulnerabilities.is_empty() {
        println!("   ⚠️  Critical vulnerabilities found: {}", result.vulnerability_assessment.critical_vulnerabilities.len());
    } else {
        println!("   ✅ No critical vulnerabilities detected");
    }
    
    Ok(())
}

// Default implementations for demonstration
#[derive(Debug, Clone, Default)]
struct MouseContextInformation;

#[derive(Debug, Clone, Default)]
struct MouseHumanizationPreferences;

#[derive(Debug, Clone, Default)]
struct EnvironmentalConditions;

#[derive(Debug, Clone, Default)]
struct TypingContext;

#[derive(Debug, Clone, Default)]
struct TypingHumanizationPreferences;

#[derive(Debug, Clone, Default)]
struct TypingEnvironmentalConditions;

#[derive(Debug, Clone, Default)]
struct ContentFeatures;

#[derive(Debug, Clone, Default)]
struct FormattingInfo;

#[derive(Debug, Clone, Default)]
struct TextMetadata;

#[derive(Debug, Clone, Default)]
struct ValidationScope;

#[derive(Debug, Clone, Default)]
struct ResistanceRequirements;

#[derive(Debug, Clone, Default)]
struct TestingParameters;

#[derive(Debug, Clone)]
enum MovementIntent {
    PreciseNavigation,
    CasualBrowsing,
    Gaming,
    Work,
}

impl Default for MovementIntent {
    fn default() -> Self {
        Self::CasualBrowsing
    }
}

#[derive(Debug, Clone)]
enum DetectorType {
    GPTZero { version: String, sensitivity: f32 },
    OriginalityAI { detection_model: String, threshold: f32 },
    YouTube { algorithm_version: String, content_type: String },
    Turnitin { similarity_threshold: f32, ai_detection_enabled: bool },
}

#[derive(Debug, Clone)]
enum ContentType {
    TextContent {
        text_data: String,
        formatting_info: FormattingInfo,
        metadata: TextMetadata,
    },
}

#[derive(Debug, Clone)]
struct ContentData {
    raw_content: Vec<u8>,
    processed_content: Option<Vec<u8>>,
    content_features: ContentFeatures,
    authenticity_markers: Vec<String>,
    humanization_applied: Vec<String>,
}

#[derive(Debug, Clone)]
enum DetectionVerdict {
    Human { confidence: f32, reasoning: Vec<String> },
    AI { confidence: f32, detected_patterns: Vec<String> },
    Uncertain { confidence: f32, conflicting_signals: Vec<String> },
    Mixed { human_aspects: Vec<String>, ai_aspects: Vec<String> },
}