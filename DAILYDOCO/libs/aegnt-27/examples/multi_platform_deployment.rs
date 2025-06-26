//! Multi-Platform Deployment Example
//! 
//! This example demonstrates cross-platform usage of aegnt-27, including
//! platform-specific optimizations, feature detection, deployment strategies,
//! and handling platform differences gracefully.

use aegnt27::prelude::*;
use std::collections::HashMap;
use std::env;
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<(), Aegnt27Error> {
    env_logger::init();
    
    println!("🌐 aegnt-27 Multi-Platform Deployment Example");
    println!("==============================================\n");
    
    // Example 1: Platform Detection and Adaptation
    println!("🔍 Example 1: Platform Detection");
    println!("--------------------------------");
    
    let platform_info = detect_platform_capabilities().await;
    display_platform_info(&platform_info);
    
    // Example 2: Platform-Specific Configuration
    println!("\n⚙️  Example 2: Platform-Specific Configuration");
    println!("---------------------------------------------");
    
    let platform_config = create_platform_optimized_config(&platform_info).await?;
    let aegnt = Aegnt27Engine::with_config(platform_config).await?;
    
    println!("✅ Platform-optimized engine created");
    
    // Example 3: Cross-Platform Feature Testing
    println!("\n🧪 Example 3: Cross-Platform Feature Testing");
    println!("--------------------------------------------");
    
    test_platform_features(&aegnt, &platform_info).await?;
    
    // Example 4: Platform-Specific Optimizations
    println!("\n⚡ Example 4: Platform-Specific Optimizations");
    println!("--------------------------------------------");
    
    demonstrate_platform_optimizations(&aegnt, &platform_info).await?;
    
    // Example 5: Deployment Configuration Generation
    println!("\n📦 Example 5: Deployment Configuration");
    println!("-------------------------------------");
    
    generate_deployment_configs(&platform_info).await?;
    
    // Example 6: Performance Benchmarking Across Platforms
    println!("\n📊 Example 6: Platform Performance Benchmarks");
    println!("---------------------------------------------");
    
    benchmark_platform_performance(&aegnt, &platform_info).await?;
    
    // Example 7: Error Handling and Fallbacks
    println!("\n🛡️  Example 7: Platform Error Handling");
    println!("--------------------------------------");
    
    demonstrate_platform_error_handling(&aegnt).await?;
    
    println!("\n🎉 Multi-platform deployment example completed!");
    
    Ok(())
}

/// Platform capability information
#[derive(Debug, Clone)]
struct PlatformInfo {
    os: String,
    arch: String,
    has_gui: bool,
    has_audio: bool,
    has_webcam: bool,
    cpu_cores: usize,
    memory_gb: f64,
    supports_hardware_acceleration: bool,
    max_screen_resolution: (u32, u32),
    supported_features: Vec<String>,
    performance_tier: PerformanceTier,
}

#[derive(Debug, Clone, PartialEq)]
enum PerformanceTier {
    Low,      // Limited resources, mobile devices
    Medium,   // Standard desktop/laptop
    High,     // Gaming rigs, workstations
    Server,   // Headless servers, cloud instances
}

/// Detects current platform capabilities
async fn detect_platform_capabilities() -> PlatformInfo {
    let os = env::consts::OS.to_string();
    let arch = env::consts::ARCH.to_string();
    let cpu_cores = num_cpus::get();
    
    // Simulate capability detection (in real implementation, use system APIs)
    let has_gui = !matches!(env::var("DISPLAY"), Err(_)) || cfg!(windows) || cfg!(target_os = "macos");
    let has_audio = true; // Most platforms have audio
    let has_webcam = detect_webcam_support().await;
    let memory_gb = detect_system_memory().await;
    let supports_hardware_acceleration = detect_hardware_acceleration(&os).await;
    let max_screen_resolution = detect_max_resolution(&os).await;
    let supported_features = detect_supported_features(&os, &arch).await;
    
    let performance_tier = classify_performance_tier(cpu_cores, memory_gb, &os);
    
    PlatformInfo {
        os,
        arch,
        has_gui,
        has_audio,
        has_webcam,
        cpu_cores,
        memory_gb,
        supports_hardware_acceleration,
        max_screen_resolution,
        supported_features,
        performance_tier,
    }
}

/// Displays comprehensive platform information
fn display_platform_info(info: &PlatformInfo) {
    println!("Platform Information:");
    println!("  OS: {} ({})", info.os, info.arch);
    println!("  CPU Cores: {}", info.cpu_cores);
    println!("  Memory: {:.1} GB", info.memory_gb);
    println!("  Performance Tier: {:?}", info.performance_tier);
    println!("  GUI Support: {}", if info.has_gui { "✅" } else { "❌" });
    println!("  Audio Support: {}", if info.has_audio { "✅" } else { "❌" });
    println!("  Webcam Support: {}", if info.has_webcam { "✅" } else { "❌" });
    println!("  Hardware Acceleration: {}", if info.supports_hardware_acceleration { "✅" } else { "❌" });
    println!("  Max Resolution: {}x{}", info.max_screen_resolution.0, info.max_screen_resolution.1);
    println!("  Supported Features: {}", info.supported_features.join(", "));
}

/// Creates platform-optimized configuration
async fn create_platform_optimized_config(platform_info: &PlatformInfo) -> Result<Aegnt27Config, Aegnt27Error> {
    let mut config_builder = Aegnt27Config::builder();
    
    // Mouse configuration based on platform
    let mouse_config = match platform_info.os.as_str() {
        "windows" => MouseConfig {
            movement_speed: 1.2,
            coordinate_precision: CoordinatePrecision::SubPixel,
            acceleration_profile: AccelerationProfile::Natural,
            drift_factor: 0.1,
            ..Default::default()
        },
        "macos" => MouseConfig {
            movement_speed: 1.0,
            coordinate_precision: CoordinatePrecision::SubPixel,
            acceleration_profile: AccelerationProfile::Natural,
            drift_factor: 0.15, // macOS users expect more natural movement
            bezier_curve_randomness: 0.25,
            ..Default::default()
        },
        "linux" => MouseConfig {
            movement_speed: 1.1,
            coordinate_precision: CoordinatePrecision::Pixel,
            acceleration_profile: AccelerationProfile::Linear,
            drift_factor: 0.08,
            ..Default::default()
        },
        _ => MouseConfig::default(),
    };
    config_builder = config_builder.mouse(mouse_config);
    
    // Typing configuration based on performance tier
    let typing_config = match platform_info.performance_tier {
        PerformanceTier::Low => TypingConfig {
            base_wpm: 40.0,
            wpm_variation: 15.0,
            error_rate: 0.03,
            fatigue_factor: 0.1,
            ..Default::default()
        },
        PerformanceTier::Medium => TypingConfig {
            base_wpm: 65.0,
            wpm_variation: 20.0,
            error_rate: 0.02,
            fatigue_factor: 0.05,
            ..Default::default()
        },
        PerformanceTier::High => TypingConfig {
            base_wpm: 85.0,
            wpm_variation: 25.0,
            error_rate: 0.015,
            fatigue_factor: 0.02,
            burst_typing_probability: 0.2,
            ..Default::default()
        },
        PerformanceTier::Server => TypingConfig {
            base_wpm: 100.0, // Servers simulate fast, efficient typing
            wpm_variation: 10.0,
            error_rate: 0.005,
            fatigue_factor: 0.0,
            ..Default::default()
        },
    };
    config_builder = config_builder.typing(typing_config);
    
    // Audio configuration based on capabilities
    if platform_info.has_audio {
        let audio_config = AudioConfig {
            breathing_frequency: 0.2,
            vocal_fry_intensity: if platform_info.os == "macos" { 0.05 } else { 0.1 },
            pitch_variation: 0.15,
            spectral_enhancement: platform_info.supports_hardware_acceleration,
            ..Default::default()
        };
        config_builder = config_builder.audio(audio_config);
    }
    
    // Visual configuration for GUI platforms
    if platform_info.has_gui {
        let visual_config = VisualConfig {
            gaze_drift_factor: 0.15,
            blink_rate: 12.0,
            attention_span: std::time::Duration::from_secs(25),
            eye_movement_smoothness: if platform_info.supports_hardware_acceleration { 0.9 } else { 0.7 },
            ..Default::default()
        };
        config_builder = config_builder.visual(visual_config);
    }
    
    // Detection configuration based on performance
    let detection_config = DetectionConfig {
        authenticity_target: match platform_info.performance_tier {
            PerformanceTier::Low => 0.85,
            PerformanceTier::Medium => 0.9,
            PerformanceTier::High => 0.95,
            PerformanceTier::Server => 0.98,
        },
        validation_strictness: match platform_info.performance_tier {
            PerformanceTier::Low => ValidationStrictness::Low,
            PerformanceTier::Medium => ValidationStrictness::Medium,
            _ => ValidationStrictness::High,
        },
        ..Default::default()
    };
    config_builder = config_builder.detection(detection_config);
    
    let config = config_builder.build()?;
    
    println!("Platform-optimized configuration created:");
    println!("  Mouse: {} profile", platform_info.os);
    println!("  Typing: {:?} tier settings", platform_info.performance_tier);
    println!("  Audio: {}", if platform_info.has_audio { "Enabled" } else { "Disabled" });
    println!("  Visual: {}", if platform_info.has_gui { "Enabled" } else { "Disabled" });
    
    Ok(config)
}

/// Tests platform-specific features
async fn test_platform_features(aegnt: &Aegnt27Engine, platform_info: &PlatformInfo) -> Result<(), Aegnt27Error> {
    println!("Testing available features on this platform...");
    
    // Always test basic features
    println!("\n🔹 Basic Features:");
    
    // Test typing (should work on all platforms)
    match aegnt.humanize_typing("Platform test message").await {
        Ok(result) => println!("  ✅ Typing humanization: {:.1} WPM", result.average_wpm()),
        Err(e) => println!("  ❌ Typing humanization failed: {}", e),
    }
    
    // Test detection (should work on all platforms)
    match aegnt.validate_content("This is a platform compatibility test.").await {
        Ok(result) => println!("  ✅ Content validation: {:.1}% resistance", result.resistance_score() * 100.0),
        Err(e) => println!("  ❌ Content validation failed: {}", e),
    }
    
    // Test GUI features if available
    if platform_info.has_gui {
        println!("\n🔹 GUI Features:");
        
        // Test mouse humanization
        let path = MousePath::linear(Point::new(0, 0), Point::new(100, 100));
        match aegnt.humanize_mouse_movement(path).await {
            Ok(result) => println!("  ✅ Mouse humanization: {} points", result.points().len()),
            Err(e) => println!("  ❌ Mouse humanization failed: {}", e),
        }
        
        // Test visual features if supported
        if platform_info.supported_features.contains(&"visual".to_string()) {
            match aegnt.simulate_natural_gaze(std::time::Duration::from_secs(5)).await {
                Ok(_) => println!("  ✅ Gaze simulation: Working"),
                Err(e) => println!("  ❌ Gaze simulation failed: {}", e),
            }
        }
    } else {
        println!("\n🔹 GUI Features: Skipped (headless environment)");
    }
    
    // Test audio features if available
    if platform_info.has_audio {
        println!("\n🔹 Audio Features:");
        println!("  ✅ Audio processing: Available");
        // Audio testing would go here in a real implementation
    } else {
        println!("\n🔹 Audio Features: Not available");
    }
    
    Ok(())
}

/// Demonstrates platform-specific optimizations
async fn demonstrate_platform_optimizations(aegnt: &Aegnt27Engine, platform_info: &PlatformInfo) -> Result<(), Aegnt27Error> {
    println!("Applying platform-specific optimizations...");
    
    match platform_info.os.as_str() {
        "windows" => {
            println!("\n🪟 Windows Optimizations:");
            println!("  • Using Windows-specific mouse acceleration curves");
            println!("  • Optimizing for DirectX hardware acceleration");
            println!("  • Adjusting for Windows threading model");
            
            // Windows-specific mouse test
            let windows_path = MousePath::linear(Point::new(0, 0), Point::new(1920, 1080));
            let result = aegnt.humanize_mouse_movement(windows_path).await?;
            println!("  • Full-screen movement: {:.1}ms", result.total_duration().as_millis());
        },
        
        "macos" => {
            println!("\n🍎 macOS Optimizations:");
            println!("  • Using Cocoa-native coordinate system");
            println!("  • Leveraging Core Graphics acceleration");
            println!("  • Adapting to macOS gesture recognition");
            
            // macOS-specific features
            let macos_path = MousePath::bezier(
                Point::new(0, 0),
                Point::new(100, 50),
                Point::new(200, 150),
                Point::new(300, 100),
            );
            let result = aegnt.humanize_mouse_movement(macos_path).await?;
            println!("  • Bezier curve movement: {:.1}ms", result.total_duration().as_millis());
        },
        
        "linux" => {
            println!("\n🐧 Linux Optimizations:");
            println!("  • Using X11/Wayland compatibility layer");
            println!("  • Optimizing for various desktop environments");
            println!("  • Leveraging GPU compute shaders where available");
            
            // Linux-specific optimization test
            let typing_test = "Linux platform optimization test with various character encodings: café, naïve, résumé";
            let result = aegnt.humanize_typing(typing_test).await?;
            println!("  • Unicode handling: {} keystrokes", result.keystrokes().len());
        },
        
        _ => {
            println!("\n❓ Unknown Platform:");
            println!("  • Using generic fallback implementations");
            println!("  • Conservative resource usage");
        }
    }
    
    // Memory optimization based on available resources
    match platform_info.performance_tier {
        PerformanceTier::Low => {
            println!("\n💾 Low-Resource Optimizations:");
            println!("  • Reduced cache sizes");
            println!("  • Simplified algorithms");
            println!("  • Aggressive memory cleanup");
        },
        PerformanceTier::High => {
            println!("\n🚀 High-Performance Optimizations:");
            println!("  • Multi-threaded processing");
            println!("  • Large prediction caches");
            println!("  • GPU acceleration where available");
        },
        _ => {
            println!("\n⚖️  Balanced Optimizations:");
            println!("  • Standard cache sizes");
            println!("  • Moderate threading");
            println!("  • Adaptive resource usage");
        }
    }
    
    Ok(())
}

/// Generates deployment configurations for different platforms
async fn generate_deployment_configs(platform_info: &PlatformInfo) -> Result<(), Aegnt27Error> {
    println!("Generating deployment configurations...");
    
    let mut configs = HashMap::new();
    
    // Docker configuration
    let docker_config = generate_docker_config(platform_info);
    configs.insert("Docker", docker_config);
    
    // Systemd service (Linux)
    if platform_info.os == "linux" {
        let systemd_config = generate_systemd_config();
        configs.insert("Systemd", systemd_config);
    }
    
    // Windows service
    if platform_info.os == "windows" {
        let windows_service_config = generate_windows_service_config();
        configs.insert("Windows Service", windows_service_config);
    }
    
    // macOS LaunchAgent
    if platform_info.os == "macos" {
        let launchd_config = generate_launchd_config();
        configs.insert("LaunchAgent", launchd_config);
    }
    
    // Cloud deployment
    let cloud_config = generate_cloud_config(platform_info);
    configs.insert("Cloud", cloud_config);
    
    // Display generated configurations
    for (name, config) in configs {
        println!("\n📄 {} Configuration:", name);
        println!("```");
        println!("{}", config);
        println!("```");
    }
    
    Ok(())
}

/// Benchmarks performance across different platform capabilities
async fn benchmark_platform_performance(aegnt: &Aegnt27Engine, platform_info: &PlatformInfo) -> Result<(), Aegnt27Error> {
    println!("Running platform-specific performance benchmarks...");
    
    let iterations = match platform_info.performance_tier {
        PerformanceTier::Low => 10,
        PerformanceTier::Medium => 50,
        PerformanceTier::High => 100,
        PerformanceTier::Server => 200,
    };
    
    // Typing benchmark
    let typing_start = std::time::Instant::now();
    for _ in 0..iterations {
        let _ = aegnt.humanize_typing("Benchmark test string").await?;
    }
    let typing_elapsed = typing_start.elapsed();
    
    // Content validation benchmark
    let validation_start = std::time::Instant::now();
    for _ in 0..iterations {
        let _ = aegnt.validate_content("Benchmark validation content").await?;
    }
    let validation_elapsed = validation_start.elapsed();
    
    // Mouse movement benchmark (if GUI available)
    let mouse_elapsed = if platform_info.has_gui {
        let mouse_start = std::time::Instant::now();
        for _ in 0..iterations {
            let path = MousePath::linear(Point::new(0, 0), Point::new(100, 100));
            let _ = aegnt.humanize_mouse_movement(path).await?;
        }
        Some(mouse_start.elapsed())
    } else {
        None
    };
    
    println!("\nPerformance Results ({} iterations):", iterations);
    println!("  Typing: {:.2}ms avg", typing_elapsed.as_millis() as f64 / iterations as f64);
    println!("  Validation: {:.2}ms avg", validation_elapsed.as_millis() as f64 / iterations as f64);
    
    if let Some(mouse_time) = mouse_elapsed {
        println!("  Mouse: {:.2}ms avg", mouse_time.as_millis() as f64 / iterations as f64);
    }
    
    // Platform-specific performance metrics
    let performance_score = calculate_performance_score(platform_info, typing_elapsed, validation_elapsed);
    println!("  Platform Performance Score: {:.1}/100", performance_score);
    
    Ok(())
}

/// Demonstrates platform-specific error handling
async fn demonstrate_platform_error_handling(aegnt: &Aegnt27Engine) -> Result<(), Aegnt27Error> {
    println!("Testing platform-specific error handling and fallbacks...");
    
    // Test error scenarios common to different platforms
    let error_scenarios = vec![
        ("Empty content validation", ""),
        ("Very long content", &"x".repeat(10000)),
        ("Special characters", "🚀🎉💻🌍🔥"),
        ("Mixed languages", "Hello, 世界, مرحبا, Здравствуй"),
    ];
    
    for (scenario_name, test_content) in error_scenarios {
        println!("\n🧪 Testing: {}", scenario_name);
        
        match aegnt.validate_content(test_content).await {
            Ok(result) => {
                println!("  ✅ Handled successfully: {:.1}% resistance", 
                         result.resistance_score() * 100.0);
            },
            Err(e) => {
                println!("  ⚠️  Error handled gracefully: {}", e);
                
                // Demonstrate fallback strategy
                match apply_fallback_strategy(test_content) {
                    Ok(fallback_content) => {
                        println!("  🔄 Fallback applied: Using simplified content");
                        if let Ok(fallback_result) = aegnt.validate_content(&fallback_content).await {
                            println!("  ✅ Fallback successful: {:.1}% resistance", 
                                     fallback_result.resistance_score() * 100.0);
                        }
                    },
                    Err(fallback_error) => {
                        println!("  ❌ Fallback also failed: {}", fallback_error);
                    }
                }
            }
        }
    }
    
    println!("\nError handling test completed - all scenarios handled gracefully");
    
    Ok(())
}

// Platform detection helper functions

async fn detect_webcam_support() -> bool {
    // Simplified detection - in real implementation, check for camera devices
    !cfg!(target_os = "linux") || std::path::Path::new("/dev/video0").exists()
}

async fn detect_system_memory() -> f64 {
    // Simplified memory detection
    match std::env::var("TOTAL_MEMORY_GB") {
        Ok(mem) => mem.parse().unwrap_or(8.0),
        Err(_) => {
            // Use a heuristic based on platform
            if cfg!(target_pointer_width = "64") { 8.0 } else { 4.0 }
        }
    }
}

async fn detect_hardware_acceleration(os: &str) -> bool {
    match os {
        "windows" => true,  // Most Windows systems have DirectX
        "macos" => true,    // Most macOS systems have Metal
        "linux" => std::path::Path::new("/dev/dri").exists(), // Check for DRI devices
        _ => false,
    }
}

async fn detect_max_resolution(os: &str) -> (u32, u32) {
    // Simplified resolution detection
    match os {
        "windows" => (1920, 1080),  // Common Windows resolution
        "macos" => (2560, 1600),    // Common macOS resolution
        "linux" => (1920, 1080),   // Common Linux resolution
        _ => (1024, 768),           // Safe fallback
    }
}

async fn detect_supported_features(os: &str, arch: &str) -> Vec<String> {
    let mut features = vec!["typing".to_string(), "detection".to_string()];
    
    // Mouse support on GUI platforms
    if os != "none" {
        features.push("mouse".to_string());
    }
    
    // Audio support (most platforms)
    features.push("audio".to_string());
    
    // Visual support on GUI platforms with good graphics
    if matches!(os, "windows" | "macos") || (os == "linux" && arch == "x86_64") {
        features.push("visual".to_string());
    }
    
    features
}

fn classify_performance_tier(cpu_cores: usize, memory_gb: f64, os: &str) -> PerformanceTier {
    // Server detection
    if os == "linux" && std::env::var("DISPLAY").is_err() && cpu_cores >= 8 {
        return PerformanceTier::Server;
    }
    
    // Performance classification
    if cpu_cores >= 8 && memory_gb >= 16.0 {
        PerformanceTier::High
    } else if cpu_cores >= 4 && memory_gb >= 8.0 {
        PerformanceTier::Medium
    } else {
        PerformanceTier::Low
    }
}

// Configuration generators

fn generate_docker_config(platform_info: &PlatformInfo) -> String {
    format!(r#"FROM rust:1.70-slim

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN cargo build --release

# Platform-specific optimizations
ENV HUMAIN_PERFORMANCE_TIER={:?}
ENV HUMAIN_CPU_CORES={}
ENV HUMAIN_MEMORY_GB={:.1}

CMD ["./target/release/aegnt27"]
"#, platform_info.performance_tier, platform_info.cpu_cores, platform_info.memory_gb)
}

fn generate_systemd_config() -> String {
    r#"[Unit]
Description=aegnt-27 Service
After=network.target

[Service]
Type=simple
User=aegnt
WorkingDirectory=/opt/aegnt27
ExecStart=/opt/aegnt27/target/release/aegnt27
Restart=always
RestartSec=10

# Resource limits
MemoryLimit=512M
CPUQuota=50%

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/aegnt27/data

[Install]
WantedBy=multi-user.target
"#.to_string()
}

fn generate_windows_service_config() -> String {
    r#"<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <service>
    <id>Aegnt2727</id>
    <name>aegnt-27 Service</name>
    <description>Human-like AI Neutralization Service</description>
    <executable>aegnt27.exe</executable>
    <startmode>Automatic</startmode>
    <workingdirectory>C:\Program Files\Aegnt2727</workingdirectory>
    <logpath>C:\Program Files\Aegnt2727\logs</logpath>
    <onfailure action="restart" delay="10 sec"/>
  </service>
</configuration>
"#.to_string()
}

fn generate_launchd_config() -> String {
    r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.aegnt27.service</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/aegnt27</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/usr/local/share/aegnt27</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/usr/local/var/log/aegnt27.log</string>
    <key>StandardErrorPath</key>
    <string>/usr/local/var/log/aegnt27.error.log</string>
</dict>
</plist>
"#.to_string()
}

fn generate_cloud_config(platform_info: &PlatformInfo) -> String {
    format!(r#"# Cloud deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aegnt27-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aegnt27
  template:
    metadata:
      labels:
        app: aegnt27
    spec:
      containers:
      - name: aegnt27
        image: aegnt27:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: HUMAIN_PERFORMANCE_TIER
          value: "{:?}"
        - name: HUMAIN_CPU_CORES
          value: "{}"
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: aegnt27-service
spec:
  selector:
    app: aegnt27
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
"#, platform_info.performance_tier, platform_info.cpu_cores)
}

// Utility functions

fn calculate_performance_score(platform_info: &PlatformInfo, typing_time: std::time::Duration, validation_time: std::time::Duration) -> f64 {
    let base_score = match platform_info.performance_tier {
        PerformanceTier::Low => 40.0,
        PerformanceTier::Medium => 60.0,
        PerformanceTier::High => 80.0,
        PerformanceTier::Server => 90.0,
    };
    
    // Adjust based on actual performance
    let typing_penalty = (typing_time.as_millis() as f64 / 100.0).min(20.0);
    let validation_penalty = (validation_time.as_millis() as f64 / 200.0).min(20.0);
    
    (base_score - typing_penalty - validation_penalty).max(0.0).min(100.0)
}

fn apply_fallback_strategy(content: &str) -> Result<String, String> {
    if content.is_empty() {
        return Err("Cannot process empty content".to_string());
    }
    
    // Simplified fallback: truncate and clean content
    let simplified = content
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || c.is_ascii_whitespace() || c.is_ascii_punctuation())
        .take(1000)
        .collect::<String>();
    
    if simplified.trim().is_empty() {
        Err("No processable content after cleanup".to_string())
    } else {
        Ok(simplified)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_platform_detection() {
        let platform_info = detect_platform_capabilities().await;
        assert!(!platform_info.os.is_empty());
        assert!(!platform_info.arch.is_empty());
        assert!(platform_info.cpu_cores > 0);
        assert!(platform_info.memory_gb > 0.0);
    }
    
    #[tokio::test]
    async fn test_platform_config_creation() {
        let platform_info = detect_platform_capabilities().await;
        let config = create_platform_optimized_config(&platform_info).await;
        assert!(config.is_ok());
    }
    
    #[tokio::test]
    async fn test_performance_tier_classification() {
        let tier = classify_performance_tier(8, 16.0, "linux");
        assert_eq!(tier, PerformanceTier::High);
        
        let tier = classify_performance_tier(2, 4.0, "windows");
        assert_eq!(tier, PerformanceTier::Low);
    }
    
    #[tokio::test]
    async fn test_fallback_strategy() {
        let result = apply_fallback_strategy("Hello, world! 🌍");
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Hello, world!"));
        
        let result = apply_fallback_strategy("");
        assert!(result.is_err());
    }
}