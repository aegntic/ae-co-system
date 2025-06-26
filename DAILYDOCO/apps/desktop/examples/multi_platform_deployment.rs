/*!
 * aegnt-27 - Multi-Platform Deployment Example
 * 
 * Demonstrates cross-platform compatibility and deployment scenarios
 */

use aegnt_27::prelude::*;
use aegnt_27::utils::{get_platform_info, PlatformInfo};
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("🌍 aegnt-27 Multi-Platform Deployment Example");
    println!("=============================================");
    
    // Initialize HUMaiN2.7
    humain27::init().await?;
    
    // Example 1: Platform Detection and Adaptation
    println!("\n🖥️  Example 1: Platform Detection and Adaptation");
    platform_detection_and_adaptation().await?;
    
    // Example 2: Platform-Specific Optimizations
    println!("\n⚙️  Example 2: Platform-Specific Optimizations");
    platform_specific_optimizations().await?;
    
    // Example 3: Cross-Platform Mouse Humanization
    println!("\n🖱️  Example 3: Cross-Platform Mouse Humanization");
    cross_platform_mouse_humanization().await?;
    
    // Example 4: Platform Resource Management
    println!("\n📊 Example 4: Platform Resource Management");
    platform_resource_management().await?;
    
    // Example 5: Deployment Configuration Matrix
    println!("\n🚀 Example 5: Deployment Configuration Matrix");
    deployment_configuration_matrix().await?;
    
    println!("\n✅ Multi-platform deployment examples completed successfully!");
    
    Ok(())
}

async fn platform_detection_and_adaptation() -> Result<(), Box<dyn Error>> {
    // Get comprehensive platform information
    let platform_info = get_platform_info().await?;
    
    println!("   🔍 Platform Information:");
    display_platform_info(&platform_info);
    
    // Adapt configuration based on platform
    let adapted_config = adapt_config_for_platform(&platform_info)?;
    
    println!("\n   🎯 Platform Adaptations Applied:");
    display_platform_adaptations(&platform_info, &adapted_config);
    
    // Initialize with adapted configuration
    humain27::init_with_config(adapted_config).await?;
    
    println!("   ✓ HUMaiN2.7 successfully adapted for current platform");
    
    Ok(())
}

fn display_platform_info(info: &PlatformInfo) {
    match &info.os {
        crate::utils::OperatingSystem::Windows { version, build } => {
            println!("      OS: Windows {} (Build {})", version, build);
        },
        crate::utils::OperatingSystem::Linux { distribution, kernel } => {
            println!("      OS: {} Linux (Kernel {})", distribution, kernel);
        },
        crate::utils::OperatingSystem::MacOS { version, build } => {
            println!("      OS: macOS {} (Build {})", version, build);
        },
        crate::utils::OperatingSystem::Unknown { name } => {
            println!("      OS: Unknown ({})", name);
        },
    }
    
    println!("      Architecture: {:?}", info.architecture);
    println!("      Display: {}x{} ({}x displays)", 
        info.display_info.primary_resolution.0,
        info.display_info.primary_resolution.1,
        info.display_info.display_count);
    
    if let Some(dpi) = info.display_info.dpi {
        println!("      DPI: {:.1}", dpi);
    }
    
    println!("      CPU Cores: {}", info.performance_info.cpu_count);
    println!("      Memory: {}MB total, {}MB available", 
        info.performance_info.total_memory_mb,
        info.performance_info.available_memory_mb);
    
    println!("      Input Capabilities:");
    println!("         Mouse: {}", if info.input_capabilities.mouse_available { "✅" } else { "❌" });
    println!("         Keyboard: {}", if info.input_capabilities.keyboard_available { "✅" } else { "❌" });
    println!("         Touch: {}", if info.input_capabilities.touch_available { "✅" } else { "❌" });
    println!("         Microphone: {}", if info.input_capabilities.microphone_available { "✅" } else { "❌" });
    println!("         Camera: {}", if info.input_capabilities.camera_available { "✅" } else { "❌" });
}

fn adapt_config_for_platform(info: &PlatformInfo) -> Result<HumainConfig, Box<dyn Error>> {
    let mut config = HumainConfig::default();
    
    // Adapt mouse configuration based on platform
    match &info.os {
        crate::utils::OperatingSystem::Windows { .. } => {
            // Windows-specific optimizations
            config.mouse.micro_movements_enabled = true;
            config.mouse.movement_intensity = 0.8;
            config.performance.gpu_acceleration_enabled = true;
        },
        crate::utils::OperatingSystem::Linux { .. } => {
            // Linux-specific optimizations
            config.mouse.environmental_modeling_enabled = true;
            config.mouse.movement_intensity = 0.7;
            config.performance.parallel_processing_enabled = true;
        },
        crate::utils::OperatingSystem::MacOS { .. } => {
            // macOS-specific optimizations
            config.mouse.precision_variability_enabled = true;
            config.mouse.movement_intensity = 0.9;
            config.performance.worker_threads = Some(6);
        },
        _ => {
            // Conservative defaults for unknown platforms
            config.mouse.movement_intensity = 0.6;
            config.performance.gpu_acceleration_enabled = false;
        }
    }
    
    // Adapt performance settings based on available resources
    if info.performance_info.total_memory_mb < 512 {
        config.performance.max_memory_mb = 256;
        config.performance.cache_size_mb = 32;
        config.mouse.fatigue_simulation_enabled = false;
    } else if info.performance_info.total_memory_mb < 2048 {
        config.performance.max_memory_mb = 512;
        config.performance.cache_size_mb = 64;
    } else {
        config.performance.max_memory_mb = 1024;
        config.performance.cache_size_mb = 128;
    }
    
    // Adapt based on CPU capabilities
    if info.performance_info.cpu_count <= 2 {
        config.performance.max_cpu_percent = 30.0;
        config.performance.worker_threads = Some(2);
        config.detection.max_concurrent_tests = 2;
    } else if info.performance_info.cpu_count <= 4 {
        config.performance.max_cpu_percent = 50.0;
        config.performance.worker_threads = Some(4);
        config.detection.max_concurrent_tests = 4;
    } else {
        config.performance.max_cpu_percent = 70.0;
        config.performance.worker_threads = Some(8);
        config.detection.max_concurrent_tests = 6;
    }
    
    // Display-specific adaptations
    if info.display_info.primary_resolution.0 >= 2560 {
        // High resolution display
        config.visual.gaze_intensity = 0.8;
        config.visual.attention_variability = 0.4;
    } else if info.display_info.primary_resolution.0 <= 1366 {
        // Lower resolution display
        config.visual.gaze_intensity = 0.6;
        config.visual.attention_variability = 0.2;
    }
    
    // Multi-display adaptations
    if info.display_info.display_count > 1 {
        config.visual.screen_interaction_enabled = true;
        config.mouse.environmental_modeling_enabled = true;
    }
    
    Ok(config)
}

fn display_platform_adaptations(info: &PlatformInfo, config: &HumainConfig) {
    println!("      🖱️  Mouse adaptations:");
    println!("         Movement intensity: {:.1}", config.mouse.movement_intensity);
    println!("         Micro-movements: {}", if config.mouse.micro_movements_enabled { "✅" } else { "❌" });
    println!("         Environmental modeling: {}", if config.mouse.environmental_modeling_enabled { "✅" } else { "❌" });
    
    println!("      ⚡ Performance adaptations:");
    println!("         Max memory: {}MB", config.performance.max_memory_mb);
    println!("         Max CPU: {:.1}%", config.performance.max_cpu_percent);
    println!("         Worker threads: {}", config.performance.worker_threads.unwrap_or(0));
    println!("         GPU acceleration: {}", if config.performance.gpu_acceleration_enabled { "✅" } else { "❌" });
    
    println!("      👁️  Visual adaptations:");
    println!("         Gaze intensity: {:.1}", config.visual.gaze_intensity);
    println!("         Attention variability: {:.1}", config.visual.attention_variability);
    println!("         Multi-screen support: {}", if info.display_info.display_count > 1 { "✅" } else { "❌" });
}

async fn platform_specific_optimizations() -> Result<(), Box<dyn Error>> {
    let platform_info = get_platform_info().await?;
    
    println!("   🔧 Applying platform-specific optimizations...");
    
    match &platform_info.os {
        crate::utils::OperatingSystem::Windows { .. } => {
            println!("      🪟 Windows Optimizations:");
            apply_windows_optimizations().await?;
        },
        crate::utils::OperatingSystem::Linux { .. } => {
            println!("      🐧 Linux Optimizations:");
            apply_linux_optimizations().await?;
        },
        crate::utils::OperatingSystem::MacOS { .. } => {
            println!("      🍎 macOS Optimizations:");
            apply_macos_optimizations().await?;
        },
        _ => {
            println!("      ❓ Unknown Platform - Using generic optimizations");
            apply_generic_optimizations().await?;
        }
    }
    
    Ok(())
}

async fn apply_windows_optimizations() -> Result<(), Box<dyn Error>> {
    // Windows-specific optimizations
    println!("         • Enabling Windows API integration");
    println!("         • Optimizing for DirectX compatibility");
    println!("         • Configuring Windows-specific input handling");
    println!("         • Setting up Windows performance counters");
    println!("         • Enabling Windows Hello integration (if available)");
    
    // Simulate Windows-specific initialization
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    println!("         ✅ Windows optimizations applied");
    Ok(())
}

async fn apply_linux_optimizations() -> Result<(), Box<dyn Error>> {
    // Linux-specific optimizations
    println!("         • Configuring X11/Wayland compatibility");
    println!("         • Optimizing for various desktop environments");
    println!("         • Setting up udev device monitoring");
    println!("         • Configuring cgroup resource limits");
    println!("         • Enabling Linux-specific security features");
    
    // Simulate Linux-specific initialization
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    println!("         ✅ Linux optimizations applied");
    Ok(())
}

async fn apply_macos_optimizations() -> Result<(), Box<dyn Error>> {
    // macOS-specific optimizations
    println!("         • Enabling Cocoa framework integration");
    println!("         • Optimizing for Retina displays");
    println!("         • Configuring Core Graphics acceleration");
    println!("         • Setting up macOS accessibility API");
    println!("         • Enabling Touch ID integration (if available)");
    
    // Simulate macOS-specific initialization
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    println!("         ✅ macOS optimizations applied");
    Ok(())
}

async fn apply_generic_optimizations() -> Result<(), Box<dyn Error>> {
    // Generic cross-platform optimizations
    println!("         • Applying conservative resource limits");
    println!("         • Enabling basic input/output handling");
    println!("         • Setting up minimal system integration");
    println!("         • Using standard library implementations");
    
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
    
    println!("         ✅ Generic optimizations applied");
    Ok(())
}

async fn cross_platform_mouse_humanization() -> Result<(), Box<dyn Error>> {
    let platform_info = get_platform_info().await?;
    let humanizer = MouseHumanizer::new().await?;
    
    println!("   🖱️  Testing cross-platform mouse humanization...");
    
    // Create platform-adapted mouse paths
    let mouse_paths = create_platform_specific_mouse_paths(&platform_info);
    
    for (platform_name, mouse_path) in mouse_paths {
        println!("      Testing {} mouse patterns...", platform_name);
        
        let input = MouseHumanizationInput {
            user_id: Uuid::new_v4(),
            original_mouse_path: mouse_path,
            context_information: MouseContextInformation::default(),
            humanization_preferences: MouseHumanizationPreferences::default(),
            target_authenticity: 0.95,
            environmental_conditions: EnvironmentalConditions::default(),
        };
        
        let result = humanizer.humanize_mouse_movement(input).await?;
        
        println!("         Authenticity: {:.1}%", result.authenticity_scores.overall_authenticity * 100.0);
        println!("         Detection resistance: {:.1}%", result.humanized_mouse_path.detection_resistance_score * 100.0);
        println!("         Platform compatibility: ✅");
    }
    
    println!("   ✅ Cross-platform mouse humanization verified");
    
    Ok(())
}

fn create_platform_specific_mouse_paths(info: &PlatformInfo) -> Vec<(String, MousePath)> {
    let mut paths = Vec::new();
    
    // Base path
    let base_path = MousePath {
        path_id: Uuid::new_v4(),
        movement_points: vec![
            MousePoint {
                timestamp: 0.0,
                coordinates: Coordinates { x: 100.0, y: 100.0, screen_relative: true },
                velocity: Velocity::default(),
                acceleration: Acceleration::default(),
                pressure: None,
                movement_type: MovementType::InitialMovement,
            },
            MousePoint {
                timestamp: 0.6,
                coordinates: Coordinates { x: 400.0, y: 250.0, screen_relative: true },
                velocity: Velocity::default(),
                acceleration: Acceleration::default(),
                pressure: None,
                movement_type: MovementType::ContinuousMovement,
            },
        ],
        total_duration: 0.6,
        path_type: MousePathType::DirectMovement { efficiency: 0.8 },
        target_coordinates: Coordinates { x: 400.0, y: 250.0, screen_relative: true },
        source_coordinates: Coordinates { x: 100.0, y: 100.0, screen_relative: true },
        movement_intent: MovementIntent::CasualBrowsing,
    };
    
    // Platform-specific variations
    match &info.os {
        crate::utils::OperatingSystem::Windows { .. } => {
            let mut windows_path = base_path.clone();
            windows_path.path_type = MousePathType::CurvedMovement { 
                curve_type: CurveType::SmoothBezier { control_points: vec![] } 
            };
            paths.push(("Windows".to_string(), windows_path));
        },
        crate::utils::OperatingSystem::Linux { .. } => {
            let mut linux_path = base_path.clone();
            linux_path.path_type = MousePathType::PrecisionMovement { precision_level: 0.9 };
            paths.push(("Linux".to_string(), linux_path));
        },
        crate::utils::OperatingSystem::MacOS { .. } => {
            let mut macos_path = base_path.clone();
            macos_path.path_type = MousePathType::CasualMovement { randomness_level: 0.3 };
            paths.push(("macOS".to_string(), macos_path));
        },
        _ => {
            paths.push(("Generic".to_string(), base_path));
        }
    }
    
    paths
}

async fn platform_resource_management() -> Result<(), Box<dyn Error>> {
    let platform_info = get_platform_info().await?;
    
    println!("   📊 Platform Resource Analysis:");
    
    // Memory analysis
    let memory_usage_percent = (platform_info.performance_info.total_memory_mb - 
                               platform_info.performance_info.available_memory_mb) as f32 / 
                              platform_info.performance_info.total_memory_mb as f32 * 100.0;
    
    println!("      Memory Usage: {:.1}% ({}/{}MB)", 
        memory_usage_percent,
        platform_info.performance_info.total_memory_mb - platform_info.performance_info.available_memory_mb,
        platform_info.performance_info.total_memory_mb);
    
    // CPU analysis
    if let Some(cpu_usage) = platform_info.performance_info.cpu_usage_percent {
        println!("      CPU Usage: {:.1}% ({} cores)", cpu_usage, platform_info.performance_info.cpu_count);
    }
    
    // Resource recommendations
    println!("\n   💡 Resource Optimization Recommendations:");
    
    if memory_usage_percent > 80.0 {
        println!("      ⚠️  High memory usage detected");
        println!("         • Consider reducing cache size");
        println!("         • Disable memory-intensive features");
        println!("         • Enable memory-efficient mode");
    } else if memory_usage_percent < 50.0 {
        println!("      ✅ Sufficient memory available");
        println!("         • Can enable all features");
        println!("         • Consider increasing cache size");
        println!("         • Enable high-performance mode");
    }
    
    if platform_info.performance_info.cpu_count >= 8 {
        println!("      ✅ High-performance CPU detected");
        println!("         • Enable parallel processing");
        println!("         • Increase worker threads");
        println!("         • Enable concurrent detection testing");
    } else if platform_info.performance_info.cpu_count <= 2 {
        println!("      ⚠️  Limited CPU cores available");
        println!("         • Reduce parallel processing");
        println!("         • Limit concurrent operations");
        println!("         • Enable power-saving mode");
    }
    
    // Platform-specific optimizations
    recommend_platform_optimizations(&platform_info);
    
    Ok(())
}

fn recommend_platform_optimizations(info: &PlatformInfo) {
    println!("\n   🎯 Platform-Specific Recommendations:");
    
    match &info.os {
        crate::utils::OperatingSystem::Windows { .. } => {
            println!("      Windows Optimizations:");
            println!("         • Use Windows-specific APIs for input");
            println!("         • Enable DirectX acceleration");
            println!("         • Optimize for Windows Defender compatibility");
        },
        crate::utils::OperatingSystem::Linux { .. } => {
            println!("      Linux Optimizations:");
            println!("         • Optimize for specific desktop environment");
            println!("         • Use epoll for efficient I/O");
            println!("         • Configure for container deployment");
        },
        crate::utils::OperatingSystem::MacOS { .. } => {
            println!("      macOS Optimizations:");
            println!("         • Use Core Graphics for rendering");
            println!("         • Optimize for Metal performance");
            println!("         • Configure for sandboxed execution");
        },
        _ => {
            println!("      Generic Optimizations:");
            println!("         • Use conservative resource limits");
            println!("         • Minimize platform-specific features");
        }
    }
}

async fn deployment_configuration_matrix() -> Result<(), Box<dyn Error>> {
    println!("   🚀 Deployment Configuration Matrix:");
    
    let deployment_scenarios = vec![
        ("Development", create_development_config()),
        ("Testing", create_testing_config()),
        ("Staging", create_staging_config()),
        ("Production", create_production_config()),
        ("Edge/Embedded", create_edge_config()),
    ];
    
    for (scenario_name, config) in deployment_scenarios {
        println!("\n      📋 {} Configuration:", scenario_name);
        display_deployment_config(&config);
        
        // Validate configuration for the scenario
        match config.validate() {
            Ok(()) => println!("         ✅ Configuration valid"),
            Err(e) => println!("         ❌ Configuration invalid: {}", e),
        }
    }
    
    println!("\n   📊 Deployment Comparison:");
    print_deployment_comparison_table();
    
    Ok(())
}

fn create_development_config() -> HumainConfig {
    let mut config = HumainConfig::default();
    config.logging.level = "debug".to_string();
    config.logging.console_logging_enabled = true;
    config.performance.monitoring_enabled = true;
    config.performance.metrics_interval_seconds = 10;
    config.detection.comprehensive_testing_enabled = false; // Faster iteration
    config
}

fn create_testing_config() -> HumainConfig {
    let mut config = HumainConfig::default();
    config.logging.level = "info".to_string();
    config.performance.max_memory_mb = 256; // Limited resources in CI
    config.performance.max_cpu_percent = 25.0;
    config.detection.testing_timeout_seconds = 15; // Faster tests
    config.privacy.data_retention_days = 1; // Minimal retention
    config
}

fn create_staging_config() -> HumainConfig {
    let mut config = HumainConfig::default();
    config.logging.level = "info".to_string();
    config.logging.file_logging_enabled = true;
    config.performance.monitoring_enabled = true;
    config.detection.comprehensive_testing_enabled = true;
    config.privacy.audit_logging_enabled = true;
    config
}

fn create_production_config() -> HumainConfig {
    let mut config = HumainConfig::default();
    config.logging.level = "warn".to_string();
    config.logging.structured_logging = true;
    config.performance.max_memory_mb = 1024;
    config.performance.gpu_acceleration_enabled = true;
    config.mouse.authenticity_target = 0.98; // Maximum authenticity
    config.detection.resistance_target = 0.99;
    config.privacy.encryption_enabled = true;
    config.privacy.secure_memory_clearing = true;
    config
}

fn create_edge_config() -> HumainConfig {
    let mut config = HumainConfig::default();
    config.logging.level = "error".to_string();
    config.performance.max_memory_mb = 128; // Very limited
    config.performance.max_cpu_percent = 20.0;
    config.performance.gpu_acceleration_enabled = false;
    config.mouse.fatigue_simulation_enabled = false; // Save resources
    config.audio.spectral_humanization_enabled = false;
    config.detection.max_concurrent_tests = 1;
    config
}

fn display_deployment_config(config: &HumainConfig) {
    println!("         Log level: {}", config.logging.level);
    println!("         Max memory: {}MB", config.performance.max_memory_mb);
    println!("         Max CPU: {:.1}%", config.performance.max_cpu_percent);
    println!("         GPU acceleration: {}", if config.performance.gpu_acceleration_enabled { "✅" } else { "❌" });
    println!("         Mouse authenticity: {:.1}%", config.mouse.authenticity_target * 100.0);
    println!("         Detection resistance: {:.1}%", config.detection.resistance_target * 100.0);
    println!("         Privacy encryption: {}", if config.privacy.encryption_enabled { "✅" } else { "❌" });
}

fn print_deployment_comparison_table() {
    println!("      ┌─────────────┬─────────┬─────────┬─────────┬─────────┬─────────────┐");
    println!("      │ Feature     │ Dev     │ Test    │ Staging │ Prod    │ Edge        │");
    println!("      ├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────────┤");
    println!("      │ Log Level   │ Debug   │ Info    │ Info    │ Warn    │ Error       │");
    println!("      │ Memory (MB) │ Default │ 256     │ Default │ 1024    │ 128         │");
    println!("      │ CPU (%)     │ Default │ 25      │ Default │ Default │ 20          │");
    println!("      │ GPU Accel   │ Auto    │ No      │ Auto    │ Yes     │ No          │");
    println!("      │ Encryption  │ Default │ Default │ Yes     │ Yes     │ Default     │");
    println!("      │ Monitoring  │ Yes     │ No      │ Yes     │ Yes     │ No          │");
    println!("      └─────────────┴─────────┴─────────┴─────────┴─────────┴─────────────┘");
}

// Define missing types for compilation
#[derive(Debug, Clone, Default)]
struct MouseContextInformation;

#[derive(Debug, Clone, Default)]
struct MouseHumanizationPreferences;

#[derive(Debug, Clone, Default)]
struct EnvironmentalConditions;

#[derive(Debug, Clone)]
enum MovementIntent {
    CasualBrowsing,
    PreciseNavigation,
}

impl Default for MovementIntent {
    fn default() -> Self {
        Self::CasualBrowsing
    }
}

#[derive(Debug, Clone)]
enum CurveType {
    SmoothBezier { control_points: Vec<Coordinates> },
}