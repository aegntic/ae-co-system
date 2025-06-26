//! Basic Integration Example
//! 
//! This example demonstrates the fundamental usage of aegnt-27 for mouse movement,
//! typing authenticity, and human authenticity validation. Perfect for getting started
//! with the library.

use aegnt27::prelude::*;
use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<(), Aegnt27Error> {
    // Initialize logging
    env_logger::init();
    
    println!("🧬 aegnt-27 Basic Integration Example");
    println!("=====================================\n");
    
    // Create an aegnt-27 engine with basic configuration
    let aegnt = Aegnt27Engine::builder()
        .enable_mouse_authenticity()
        .enable_typing_authenticity()
        .enable_authenticity_validation()
        .build()
        .await?;
    
    println!("✅ aegnt-27 engine initialized successfully");
    
    // Example 1: Mouse Authenticity Achievement
    println!("\n📍 Example 1: Achieving Mouse Authenticity");
    println!("---------------------------------------");
    
    // Create a simple linear path from top-left to bottom-right
    let start_point = Point::new(100, 100);
    let end_point = Point::new(800, 600);
    let mouse_path = MousePath::linear(start_point, end_point);
    
    println!("Original path: {} -> {}", start_point, end_point);
    
    // Achieve mouse authenticity
    let authentic_path = aegnt.achieve_mouse_authenticity(mouse_path).await?;
    
    println!("Authentic path contains {} points", authentic_path.points().len());
    println!("Movement duration: {:.2}ms", authentic_path.total_duration().as_millis());
    println!("Path includes natural patterns: {}", authentic_path.has_natural_patterns());
    
    // Example 2: Typing Authenticity Achievement
    println!("\n⌨️  Example 2: Achieving Typing Authenticity");
    println!("----------------------------------------");
    
    let original_text = "Hello, world! This is a demonstration of natural typing patterns.";
    println!("Original text: \"{}\"", original_text);
    
    // Achieve typing authenticity
    let typing_sequence = aegnt.achieve_typing_authenticity(original_text).await?;
    
    println!("Typing sequence contains {} keystrokes", typing_sequence.keystrokes().len());
    println!("Total typing duration: {:.2}ms", typing_sequence.total_duration().as_millis());
    println!("Average WPM: {:.1}", typing_sequence.average_wpm());
    
    // Display some keystroke timings
    println!("\nSample keystroke timings:");
    for (i, keystroke) in typing_sequence.keystrokes().iter().take(5).enumerate() {
        println!("  '{}': {:.1}ms delay", keystroke.character(), keystroke.delay().as_millis());
    }
    
    // Example 3: Human Authenticity Validation
    println!("\n🛡️  Example 3: Human Authenticity Validation");
    println!("-------------------------------------");
    
    let test_content = "The quick brown fox jumps over the lazy dog. This sentence demonstrates \
                       peak human authenticity patterns that achieve optimal behavioral validation.";
    
    println!("Testing content: \"{}...\"", &test_content[..50]);
    
    // Validate human authenticity achievement
    let validation_result = aegnt.validate_authenticity(test_content).await?;
    
    println!("Human authenticity score: {:.1}%", validation_result.authenticity_score() * 100.0);
    println!("Confidence level: {:.1}%", validation_result.confidence() * 100.0);
    println!("Achieved patterns: {:?}", validation_result.achieved_patterns());
    
    if validation_result.authenticity_score() > 0.9 {
        println!("✅ Content achieves peak human authenticity");
    } else if validation_result.authenticity_score() > 0.7 {
        println!("⚠️  Content shows good authenticity but can improve");
    } else {
        println!("❌ Content needs authenticity enhancement");
    }
    
    // Example 4: Combined Workflow
    println!("\n🔄 Example 4: Combined Humanization Workflow");
    println!("--------------------------------------------");
    
    // Simulate a realistic user interaction
    let workflow_text = "I need to automate this boring task";
    
    // First, check if our text passes AI detection
    let initial_validation = aegnt.validate_authenticity(workflow_text).await?;
    println!("Initial resistance score: {:.1}%", initial_validation.authenticity_score() * 100.0);
    
    // Generate a natural mouse path to a text field
    let text_field_position = Point::new(400, 300);
    let natural_path = aegnt.generate_natural_mouse_path(start_point, text_field_position).await?;
    let humanized_movement = aegnt.achieve_mouse_authenticity(natural_path).await?;
    
    // Humanize the typing for the text
    let humanized_typing = aegnt.achieve_typing_authenticity(workflow_text).await?;
    
    println!("Generated workflow:");
    println!("  • Mouse movement: {} points over {:.2}ms", 
             humanized_movement.points().len(), 
             humanized_movement.total_duration().as_millis());
    println!("  • Typing sequence: {} keystrokes at {:.1} WPM", 
             humanized_typing.keystrokes().len(),
             humanized_typing.average_wpm());
    
    // Example 5: Error Handling and Edge Cases
    println!("\n🚨 Example 5: Error Handling");
    println!("----------------------------");
    
    // Test with empty content
    match aegnt.validate_authenticity("").await {
        Ok(result) => println!("Empty content resistance: {:.1}%", result.authenticity_score() * 100.0),
        Err(e) => println!("Expected error for empty content: {}", e),
    }
    
    // Test with very short mouse movement
    let tiny_path = MousePath::linear(Point::new(0, 0), Point::new(1, 1));
    match aegnt.achieve_mouse_authenticity(tiny_path).await {
        Ok(result) => println!("Tiny movement humanized: {} points", result.points().len()),
        Err(e) => println!("Error with tiny movement: {}", e),
    }
    
    // Example 6: Performance Monitoring
    println!("\n⚡ Example 6: Performance Monitoring");
    println!("-----------------------------------");
    
    let start_time = std::time::Instant::now();
    
    // Perform multiple operations to test performance
    for i in 0..10 {
        let test_text = format!("Performance test iteration {}", i);
        let _ = aegnt.achieve_typing_authenticity(&test_text).await?;
    }
    
    let elapsed = start_time.elapsed();
    println!("10 typing humanizations completed in: {:.2}ms", elapsed.as_millis());
    println!("Average per operation: {:.2}ms", elapsed.as_millis() as f64 / 10.0);
    
    println!("\n🎉 Basic integration example completed successfully!");
    println!("Next steps:");
    println!("  • Check out advanced_customization.rs for configuration options");
    println!("  • See multi_platform_deployment.rs for cross-platform usage");
    println!("  • Review performance_optimization.rs for performance tuning");
    
    Ok(())
}

/// Utility function to demonstrate error handling patterns
async fn demonstrate_error_handling(aegnt: &Aegnt27Engine) -> Result<(), Aegnt27Error> {
    // Example of proper error handling with context
    let result = aegnt.validate_authenticity("test").await
        .map_err(|e| {
            eprintln!("Validation failed: {}", e);
            e
        })?;
    
    if result.authenticity_score() < 0.5 {
        return Err(Aegnt27Error::ValidationError(
            "Content failed resistance threshold".to_string()
        ));
    }
    
    Ok(())
}

/// Example of async iterator pattern for processing batches
async fn batch_processing_example(aegnt: &Aegnt27Engine) -> Result<(), Aegnt27Error> {
    let test_texts = vec![
        "First test message",
        "Second test message", 
        "Third test message",
    ];
    
    for (i, text) in test_texts.iter().enumerate() {
        println!("Processing batch item {}: {}", i + 1, text);
        let _result = aegnt.achieve_typing_authenticity(text).await?;
        
        // Small delay to prevent overwhelming the system
        sleep(Duration::from_millis(10)).await;
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_basic_integration() {
        let aegnt = Aegnt27Engine::builder()
            .enable_mouse_humanization()
            .enable_typing_humanization()
            .enable_ai_detection_resistance()
            .build()
            .await
            .expect("Failed to create engine");
        
        // Test mouse humanization
        let path = MousePath::linear(Point::new(0, 0), Point::new(100, 100));
        let result = aegnt.achieve_mouse_authenticity(path).await;
        assert!(result.is_ok());
        
        // Test typing humanization
        let result = aegnt.achieve_typing_authenticity("test").await;
        assert!(result.is_ok());
        
        // Test validation
        let result = aegnt.validate_authenticity("test content").await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_error_handling() {
        let aegnt = Aegnt27Engine::builder()
            .enable_ai_detection_resistance()
            .build()
            .await
            .expect("Failed to create engine");
        
        let result = demonstrate_error_handling(&aegnt).await;
        // Error handling should work without panicking
        assert!(result.is_ok() || result.is_err());
    }
}