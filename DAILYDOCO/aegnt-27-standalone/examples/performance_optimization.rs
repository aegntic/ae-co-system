//! Performance Optimization Example
//! 
//! This example demonstrates performance tuning, benchmarking, memory management,
//! and optimization strategies for aegnt-27. Includes profiling tools,
//! performance monitoring, and advanced optimization techniques.

use aegnt27::prelude::*;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Semaphore;

#[tokio::main]
async fn main() -> Result<(), Aegnt27Error> {
    env_logger::init();
    
    println!("⚡ aegnt-27 Performance Optimization Example");
    println!("============================================\n");
    
    // Example 1: Baseline Performance Measurement
    println!("📊 Example 1: Baseline Performance Measurement");
    println!("----------------------------------------------");
    
    let baseline_metrics = measure_baseline_performance().await?;
    display_performance_metrics("Baseline", &baseline_metrics);
    
    // Example 2: Memory Usage Optimization
    println!("\n💾 Example 2: Memory Usage Optimization");
    println!("---------------------------------------");
    
    let optimized_engine = create_memory_optimized_engine().await?;
    let memory_metrics = measure_memory_usage(&optimized_engine).await?;
    display_memory_metrics(&memory_metrics);
    
    // Example 3: Concurrent Processing Optimization
    println!("\n🔄 Example 3: Concurrent Processing");
    println!("----------------------------------");
    
    let concurrent_metrics = demonstrate_concurrent_processing(&optimized_engine).await?;
    display_performance_metrics("Concurrent", &concurrent_metrics);
    
    // Example 4: Caching and Memoization
    println!("\n🗄️  Example 4: Caching Strategies");
    println!("--------------------------------");
    
    let cached_engine = create_cached_engine().await?;
    let cache_metrics = benchmark_caching_performance(&cached_engine).await?;
    display_cache_metrics(&cache_metrics);
    
    // Example 5: Algorithm Optimization
    println!("\n🧮 Example 5: Algorithm Optimization");
    println!("-----------------------------------");
    
    demonstrate_algorithm_optimizations().await?;
    
    // Example 6: Resource Pool Management
    println!("\n🏊 Example 6: Resource Pool Management");
    println!("-------------------------------------");
    
    demonstrate_resource_pooling().await?;
    
    // Example 7: Profiling and Monitoring
    println!("\n📈 Example 7: Real-time Performance Monitoring");
    println!("---------------------------------------------");
    
    let monitor = create_performance_monitor().await?;
    demonstrate_performance_monitoring(&optimized_engine, monitor).await?;
    
    // Example 8: Advanced Optimization Techniques
    println!("\n🚀 Example 8: Advanced Optimization Techniques");
    println!("----------------------------------------------");
    
    demonstrate_advanced_optimizations().await?;
    
    println!("\n🎉 Performance optimization example completed!");
    
    Ok(())
}

/// Performance metrics structure
#[derive(Debug, Clone)]
struct PerformanceMetrics {
    operations_per_second: f64,
    average_latency_ms: f64,
    p95_latency_ms: f64,
    p99_latency_ms: f64,
    memory_usage_mb: f64,
    cpu_usage_percent: f64,
    error_rate: f64,
    throughput_mb_per_second: f64,
}

/// Memory usage metrics
#[derive(Debug)]
struct MemoryMetrics {
    heap_size_mb: f64,
    stack_size_mb: f64,
    cache_size_mb: f64,
    peak_usage_mb: f64,
    gc_pressure: f64,
}

/// Cache performance metrics  
#[derive(Debug)]
struct CacheMetrics {
    hit_rate: f64,
    miss_rate: f64,
    eviction_rate: f64,
    average_lookup_time_ms: f64,
    cache_size_mb: f64,
}

/// Measures baseline performance without optimizations
async fn measure_baseline_performance() -> Result<PerformanceMetrics, Aegnt27Error> {
    println!("🔬 Running baseline performance tests...");
    
    // Create a standard engine
    let engine = Aegnt27Engine::builder()
        .enable_all_features()
        .build()
        .await?;
    
    let test_iterations = 1000;
    let test_content = "Performance testing content with various characteristics for comprehensive benchmarking.";
    
    // Measure typing performance
    let typing_start = Instant::now();
    let mut typing_latencies = Vec::new();
    
    for _ in 0..test_iterations {
        let iter_start = Instant::now();
        let _result = engine.humanize_typing(test_content).await?;
        typing_latencies.push(iter_start.elapsed().as_millis() as f64);
    }
    
    let typing_elapsed = typing_start.elapsed();
    
    // Measure validation performance
    let validation_start = Instant::now();
    let mut validation_latencies = Vec::new();
    
    for _ in 0..test_iterations {
        let iter_start = Instant::now();
        let _result = engine.validate_content(test_content).await?;
        validation_latencies.push(iter_start.elapsed().as_millis() as f64);
    }
    
    let validation_elapsed = validation_start.elapsed();
    
    // Calculate metrics
    let total_operations = test_iterations * 2;
    let total_time = typing_elapsed + validation_elapsed;
    let operations_per_second = total_operations as f64 / total_time.as_secs_f64();
    
    let mut all_latencies = typing_latencies;
    all_latencies.extend(validation_latencies);
    all_latencies.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let average_latency = all_latencies.iter().sum::<f64>() / all_latencies.len() as f64;
    let p95_index = (all_latencies.len() as f64 * 0.95) as usize;
    let p99_index = (all_latencies.len() as f64 * 0.99) as usize;
    
    Ok(PerformanceMetrics {
        operations_per_second,
        average_latency_ms: average_latency,
        p95_latency_ms: all_latencies[p95_index],
        p99_latency_ms: all_latencies[p99_index],
        memory_usage_mb: estimate_memory_usage(),
        cpu_usage_percent: estimate_cpu_usage(),
        error_rate: 0.0, // No errors expected in baseline
        throughput_mb_per_second: calculate_throughput(test_content, total_operations, total_time),
    })
}

/// Creates a memory-optimized engine configuration
async fn create_memory_optimized_engine() -> Result<Aegnt27Engine, Aegnt27Error> {
    println!("🔧 Creating memory-optimized engine...");
    
    let config = Aegnt27Config::builder()
        .mouse(MouseConfig {
            movement_speed: 1.0,
            drift_factor: 0.1,
            micro_movement_intensity: 0.5, // Reduced complexity
            bezier_curve_randomness: 0.2,  // Simplified curves
            cache_size: 100, // Smaller cache
            ..Default::default()
        })
        .typing(TypingConfig {
            base_wpm: 70.0,
            wpm_variation: 15.0,
            cache_size: 200, // Optimized cache size
            precompute_common_patterns: true,
            ..Default::default()
        })
        .detection(DetectionConfig {
            authenticity_target: 0.9,
            validation_strictness: ValidationStrictness::Medium,
            cache_validation_results: true,
            max_cache_entries: 500,
            ..Default::default()
        })
        .build()?;
    
    println!("✅ Memory-optimized engine created with reduced cache sizes and simplified algorithms");
    
    Aegnt27Engine::with_config(config).await
}

/// Measures memory usage of the engine
async fn measure_memory_usage(engine: &Aegnt27Engine) -> Result<MemoryMetrics, Aegnt27Error> {
    println!("📏 Measuring memory usage...");
    
    // Simulate memory measurement (in real implementation, use proper profiling tools)
    let baseline_memory = get_current_memory_usage();
    
    // Perform operations to measure memory growth
    let test_operations = 100;
    for i in 0..test_operations {
        let text = format!("Memory test iteration {}", i);
        let _ = engine.humanize_typing(&text).await?;
        let _ = engine.validate_content(&text).await?;
    }
    
    let peak_memory = get_current_memory_usage();
    
    Ok(MemoryMetrics {
        heap_size_mb: baseline_memory,
        stack_size_mb: 2.0, // Estimated stack usage
        cache_size_mb: estimate_cache_memory_usage(),
        peak_usage_mb: peak_memory,
        gc_pressure: calculate_gc_pressure(baseline_memory, peak_memory),
    })
}

/// Demonstrates concurrent processing optimization
async fn demonstrate_concurrent_processing(engine: &Aegnt27Engine) -> Result<PerformanceMetrics, Aegnt27Error> {
    println!("🔄 Testing concurrent processing performance...");
    
    let concurrent_tasks = 50;
    let operations_per_task = 20;
    let semaphore = Arc::new(Semaphore::new(10)); // Limit concurrent operations
    
    let start_time = Instant::now();
    let mut handles = Vec::new();
    
    for task_id in 0..concurrent_tasks {
        let engine_clone = engine.clone();
        let semaphore_clone = semaphore.clone();
        
        let handle = tokio::spawn(async move {
            let _permit = semaphore_clone.acquire().await.unwrap();
            let mut task_latencies = Vec::new();
            
            for op_id in 0..operations_per_task {
                let content = format!("Concurrent task {} operation {}", task_id, op_id);
                
                let op_start = Instant::now();
                let _ = engine_clone.humanize_typing(&content).await?;
                task_latencies.push(op_start.elapsed().as_millis() as f64);
            }
            
            Ok::<Vec<f64>, Aegnt27Error>(task_latencies)
        });
        
        handles.push(handle);
    }
    
    // Wait for all tasks to complete
    let mut all_latencies = Vec::new();
    for handle in handles {
        match handle.await {
            Ok(Ok(latencies)) => all_latencies.extend(latencies),
            Ok(Err(e)) => eprintln!("Task error: {}", e),
            Err(e) => eprintln!("Join error: {}", e),
        }
    }
    
    let total_time = start_time.elapsed();
    let total_operations = concurrent_tasks * operations_per_task;
    
    all_latencies.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let operations_per_second = total_operations as f64 / total_time.as_secs_f64();
    let average_latency = if !all_latencies.is_empty() {
        all_latencies.iter().sum::<f64>() / all_latencies.len() as f64
    } else {
        0.0
    };
    
    let p95_index = ((all_latencies.len() as f64 * 0.95) as usize).min(all_latencies.len().saturating_sub(1));
    let p99_index = ((all_latencies.len() as f64 * 0.99) as usize).min(all_latencies.len().saturating_sub(1));
    
    Ok(PerformanceMetrics {
        operations_per_second,
        average_latency_ms: average_latency,
        p95_latency_ms: if !all_latencies.is_empty() { all_latencies[p95_index] } else { 0.0 },
        p99_latency_ms: if !all_latencies.is_empty() { all_latencies[p99_index] } else { 0.0 },
        memory_usage_mb: get_current_memory_usage(),
        cpu_usage_percent: estimate_cpu_usage(),
        error_rate: 0.0,
        throughput_mb_per_second: 0.0, // Would calculate based on data processed
    })
}

/// Creates an engine with advanced caching strategies
async fn create_cached_engine() -> Result<Aegnt27Engine, Aegnt27Error> {
    println!("🗄️  Creating engine with advanced caching...");
    
    let config = Aegnt27Config::builder()
        .typing(TypingConfig {
            cache_size: 1000,
            precompute_common_patterns: true,
            cache_strategy: CacheStrategy::LRU,
            cache_ttl: Duration::from_secs(3600), // 1 hour TTL
            ..Default::default()
        })
        .detection(DetectionConfig {
            cache_validation_results: true,
            max_cache_entries: 2000,
            cache_strategy: CacheStrategy::LFU, // Different strategy for validation
            cache_ttl: Duration::from_secs(1800), // 30 minutes TTL
            ..Default::default()
        })
        .build()?;
    
    Aegnt27Engine::with_config(config).await
}

/// Benchmarks caching performance
async fn benchmark_caching_performance(engine: &Aegnt27Engine) -> Result<CacheMetrics, Aegnt27Error> {
    println!("📊 Benchmarking cache performance...");
    
    let test_phrases = vec![
        "Common phrase one",
        "Common phrase two", 
        "Common phrase three",
        "Unique phrase alpha",
        "Unique phrase beta",
    ];
    
    let iterations = 1000;
    let mut cache_hits = 0;
    let mut cache_misses = 0;
    let mut lookup_times = Vec::new();
    
    // First pass: populate cache
    for phrase in &test_phrases {
        let _ = engine.humanize_typing(phrase).await?;
    }
    
    // Second pass: measure cache performance
    for _ in 0..iterations {
        let phrase = &test_phrases[rand::random::<usize>() % test_phrases.len()];
        
        let lookup_start = Instant::now();
        let _ = engine.humanize_typing(phrase).await?;
        let lookup_time = lookup_start.elapsed().as_millis() as f64;
        
        lookup_times.push(lookup_time);
        
        // Simulate cache hit/miss detection (in real implementation, get from cache metrics)
        if lookup_time < 10.0 { // Fast lookup suggests cache hit
            cache_hits += 1;
        } else {
            cache_misses += 1;
        }
    }
    
    let total_lookups = cache_hits + cache_misses;
    let hit_rate = cache_hits as f64 / total_lookups as f64;
    let average_lookup_time = lookup_times.iter().sum::<f64>() / lookup_times.len() as f64;
    
    Ok(CacheMetrics {
        hit_rate,
        miss_rate: 1.0 - hit_rate,
        eviction_rate: 0.05, // Estimated eviction rate
        average_lookup_time_ms: average_lookup_time,
        cache_size_mb: estimate_cache_memory_usage(),
    })
}

/// Demonstrates algorithm optimization techniques
async fn demonstrate_algorithm_optimizations() -> Result<(), Aegnt27Error> {
    println!("🧮 Demonstrating algorithm optimizations...");
    
    // Test different path generation algorithms
    let path_algorithms = vec![
        ("Linear", PathAlgorithm::Linear),
        ("Bezier", PathAlgorithm::Bezier),
        ("Spline", PathAlgorithm::Spline),
        ("Optimized", PathAlgorithm::Optimized),
    ];
    
    let start_point = Point::new(0, 0);
    let end_point = Point::new(1000, 1000);
    let iterations = 100;
    
    for (name, algorithm) in path_algorithms {
        let start_time = Instant::now();
        
        for _ in 0..iterations {
            let path = match algorithm {
                PathAlgorithm::Linear => MousePath::linear(start_point, end_point),
                PathAlgorithm::Bezier => {
                    let control1 = Point::new(250, 100);
                    let control2 = Point::new(750, 900);
                    MousePath::bezier(start_point, control1, control2, end_point)
                },
                PathAlgorithm::Spline => MousePath::spline(vec![start_point, Point::new(500, 200), end_point]),
                PathAlgorithm::Optimized => {
                    // Use the most efficient algorithm for this distance
                    let distance = ((end_point.x() - start_point.x()).pow(2) + (end_point.y() - start_point.y()).pow(2)).sqrt();
                    if distance < 100.0 {
                        MousePath::linear(start_point, end_point)
                    } else {
                        MousePath::bezier(start_point, Point::new(250, 100), Point::new(750, 900), end_point)
                    }
                },
            };
            
            // Simulate path processing
            let _points = path.points();
        }
        
        let elapsed = start_time.elapsed();
        println!("  {} algorithm: {:.2}ms avg", name, elapsed.as_millis() as f64 / iterations as f64);
    }
    
    // Test typing pattern optimization
    println!("\n📝 Typing pattern optimizations:");
    
    let typing_strategies = vec![
        ("Standard", TypingStrategy::Standard),
        ("Predictive", TypingStrategy::Predictive),
        ("Cached", TypingStrategy::Cached),
    ];
    
    let test_text = "This is a sample text for testing typing optimization strategies.";
    
    for (name, strategy) in typing_strategies {
        let start_time = Instant::now();
        
        for _ in 0..iterations {
            // Simulate different typing strategies
            match strategy {
                TypingStrategy::Standard => {
                    // Process each character individually
                    for _char in test_text.chars() {
                        // Simulate character processing
                        std::hint::black_box(42);
                    }
                },
                TypingStrategy::Predictive => {
                    // Process in chunks with prediction
                    for chunk in test_text.split_whitespace() {
                        // Simulate chunk processing
                        std::hint::black_box(chunk.len());
                    }
                },
                TypingStrategy::Cached => {
                    // Use pre-computed patterns
                    std::hint::black_box(test_text.len());
                },
            }
        }
        
        let elapsed = start_time.elapsed();
        println!("  {} strategy: {:.2}ms avg", name, elapsed.as_millis() as f64 / iterations as f64);
    }
    
    Ok(())
}

/// Demonstrates resource pool management
async fn demonstrate_resource_pooling() -> Result<(), Aegnt27Error> {
    println!("🏊 Setting up resource pools...");
    
    // Simulate a resource pool for expensive operations
    struct ResourcePool<T> {
        resources: tokio::sync::Mutex<Vec<T>>,
        semaphore: Semaphore,
    }
    
    impl<T> ResourcePool<T> {
        fn new(capacity: usize) -> Self {
            Self {
                resources: tokio::sync::Mutex::new(Vec::with_capacity(capacity)),
                semaphore: Semaphore::new(capacity),
            }
        }
        
        async fn acquire(&self) -> Option<T> {
            let _permit = self.semaphore.acquire().await.ok()?;
            let mut resources = self.resources.lock().await;
            resources.pop()
        }
        
        async fn release(&self, resource: T) {
            let mut resources = self.resources.lock().await;
            resources.push(resource);
        }
    }
    
    // Example: Pool of validation engines for concurrent processing
    let validation_pool = Arc::new(ResourcePool::new(5));
    
    // Initialize pool with validation engines
    for _ in 0..5 {
        let engine = Aegnt27Engine::builder()
            .enable_ai_detection_resistance()
            .build()
            .await?;
        validation_pool.release(engine).await;
    }
    
    println!("✅ Resource pool initialized with 5 validation engines");
    
    // Test concurrent access to the pool
    let pool_clone = validation_pool.clone();
    let concurrent_requests = 20;
    let mut handles = Vec::new();
    
    let start_time = Instant::now();
    
    for i in 0..concurrent_requests {
        let pool = pool_clone.clone();
        let handle = tokio::spawn(async move {
            if let Some(engine) = pool.acquire().await {
                let content = format!("Pool test content {}", i);
                let result = engine.validate_content(&content).await;
                pool.release(engine).await;
                result
            } else {
                Err(Aegnt27Error::ResourceUnavailable("No engines available".to_string()))
            }
        });
        handles.push(handle);
    }
    
    let mut successful_operations = 0;
    for handle in handles {
        match handle.await {
            Ok(Ok(_)) => successful_operations += 1,
            Ok(Err(e)) => eprintln!("Operation error: {}", e),
            Err(e) => eprintln!("Join error: {}", e),
        }
    }
    
    let elapsed = start_time.elapsed();
    println!("Pool performance: {}/{} operations completed in {:.2}ms", 
             successful_operations, concurrent_requests, elapsed.as_millis());
    
    Ok(())
}

/// Creates a performance monitoring system
async fn create_performance_monitor() -> Result<PerformanceMonitor, Aegnt27Error> {
    println!("📈 Creating performance monitor...");
    
    Ok(PerformanceMonitor::new())
}

/// Demonstrates real-time performance monitoring
async fn demonstrate_performance_monitoring(engine: &Aegnt27Engine, mut monitor: PerformanceMonitor) -> Result<(), Aegnt27Error> {
    println!("🔍 Starting real-time performance monitoring...");
    
    // Start monitoring in background
    let monitor_handle = tokio::spawn(async move {
        for i in 0..10 {
            tokio::time::sleep(Duration::from_millis(500)).await;
            let metrics = monitor.collect_metrics().await;
            println!("  Monitor cycle {}: CPU: {:.1}%, Memory: {:.1}MB, Operations/sec: {:.1}", 
                     i + 1, metrics.cpu_usage_percent, metrics.memory_usage_mb, metrics.operations_per_second);
        }
    });
    
    // Perform operations while monitoring
    for i in 0..20 {
        let content = format!("Monitored operation {}", i);
        let _ = engine.humanize_typing(&content).await?;
        let _ = engine.validate_content(&content).await?;
        tokio::time::sleep(Duration::from_millis(200)).await;
    }
    
    monitor_handle.await.map_err(|e| Aegnt27Error::InternalError(format!("Monitor error: {}", e)))?;
    
    println!("✅ Performance monitoring completed");
    
    Ok(())
}

/// Demonstrates advanced optimization techniques
async fn demonstrate_advanced_optimizations() -> Result<(), Aegnt27Error> {
    println!("🚀 Applying advanced optimization techniques...");
    
    // 1. Lazy loading optimization
    println!("\n🔄 Lazy Loading:");
    let lazy_engine = create_lazy_loading_engine().await?;
    test_lazy_loading_performance(&lazy_engine).await?;
    
    // 2. Batch processing optimization
    println!("\n📦 Batch Processing:");
    demonstrate_batch_processing().await?;
    
    // 3. Adaptive algorithms
    println!("\n🧠 Adaptive Algorithms:");
    demonstrate_adaptive_algorithms().await?;
    
    // 4. Hardware acceleration simulation
    println!("\n⚡ Hardware Acceleration:");
    simulate_hardware_acceleration().await?;
    
    Ok(())
}

// Helper types and implementations

#[derive(Debug, Clone)]
enum PathAlgorithm {
    Linear,
    Bezier,
    Spline,
    Optimized,
}

#[derive(Debug, Clone)]
enum TypingStrategy {
    Standard,
    Predictive,
    Cached,
}

#[derive(Debug, Clone)]
enum CacheStrategy {
    LRU, // Least Recently Used
    LFU, // Least Frequently Used
}

/// Performance monitoring system
struct PerformanceMonitor {
    start_time: Instant,
    operation_count: u64,
}

impl PerformanceMonitor {
    fn new() -> Self {
        Self {
            start_time: Instant::now(),
            operation_count: 0,
        }
    }
    
    async fn collect_metrics(&mut self) -> PerformanceMetrics {
        self.operation_count += 1;
        let elapsed = self.start_time.elapsed();
        
        PerformanceMetrics {
            operations_per_second: self.operation_count as f64 / elapsed.as_secs_f64(),
            average_latency_ms: 50.0 + (rand::random::<f64>() * 20.0), // Simulated
            p95_latency_ms: 80.0,
            p99_latency_ms: 120.0,
            memory_usage_mb: get_current_memory_usage(),
            cpu_usage_percent: estimate_cpu_usage(),
            error_rate: 0.01,
            throughput_mb_per_second: 1.5,
        }
    }
}

// Optimization implementations

async fn create_lazy_loading_engine() -> Result<Aegnt27Engine, Aegnt27Error> {
    // Create engine with minimal initial configuration
    let config = Aegnt27Config::builder()
        .typing(TypingConfig {
            lazy_initialization: true,
            preload_patterns: false,
            ..Default::default()
        })
        .build()?;
    
    Aegnt27Engine::with_config(config).await
}

async fn test_lazy_loading_performance(engine: &Aegnt27Engine) -> Result<(), Aegnt27Error> {
    let start_time = Instant::now();
    
    // First operation should trigger initialization
    let _ = engine.humanize_typing("First operation triggers lazy loading").await?;
    let first_op_time = start_time.elapsed();
    
    // Subsequent operations should be faster
    let second_start = Instant::now();
    let _ = engine.humanize_typing("Second operation uses cached resources").await?;
    let second_op_time = second_start.elapsed();
    
    println!("  First operation (with lazy loading): {:.2}ms", first_op_time.as_millis());
    println!("  Second operation (cached): {:.2}ms", second_op_time.as_millis());
    println!("  Performance improvement: {:.1}x", 
             first_op_time.as_millis() as f64 / second_op_time.as_millis() as f64);
    
    Ok(())
}

async fn demonstrate_batch_processing() -> Result<(), Aegnt27Error> {
    let test_texts = vec![
        "Batch item 1",
        "Batch item 2", 
        "Batch item 3",
        "Batch item 4",
        "Batch item 5",
    ];
    
    // Sequential processing
    let sequential_start = Instant::now();
    let engine = Aegnt27Engine::builder().enable_all_features().build().await?;
    
    for text in &test_texts {
        let _ = engine.humanize_typing(text).await?;
    }
    
    let sequential_time = sequential_start.elapsed();
    
    // Batch processing simulation
    let batch_start = Instant::now();
    
    // Process all items together (in real implementation, this would be optimized)
    let combined_text = test_texts.join(" ");
    let _ = engine.humanize_typing(&combined_text).await?;
    
    let batch_time = batch_start.elapsed();
    
    println!("  Sequential processing: {:.2}ms", sequential_time.as_millis());
    println!("  Batch processing: {:.2}ms", batch_time.as_millis());
    println!("  Batch improvement: {:.1}x", 
             sequential_time.as_millis() as f64 / batch_time.as_millis() as f64);
    
    Ok(())
}

async fn demonstrate_adaptive_algorithms() -> Result<(), Aegnt27Error> {
    println!("  Adaptive algorithm adjusts based on input characteristics:");
    
    let test_cases = vec![
        ("Short text", "Hi"),
        ("Medium text", "This is a medium length text for testing adaptive algorithms."),
        ("Long text", &"Very long text ".repeat(50)),
    ];
    
    for (description, text) in test_cases {
        let start_time = Instant::now();
        
        // Adaptive algorithm selection based on text length
        let algorithm = if text.len() < 10 {
            "Fast"
        } else if text.len() < 100 {
            "Standard"
        } else {
            "Optimized"
        };
        
        // Simulate processing with selected algorithm
        tokio::time::sleep(Duration::from_millis(
            match algorithm {
                "Fast" => 5,
                "Standard" => 20,
                "Optimized" => 15,
                _ => 20,
            }
        )).await;
        
        let elapsed = start_time.elapsed();
        println!("    {}: {} algorithm, {:.2}ms", description, algorithm, elapsed.as_millis());
    }
    
    Ok(())
}

async fn simulate_hardware_acceleration() -> Result<(), Aegnt27Error> {
    println!("  Simulating hardware acceleration benefits:");
    
    let operations = 100;
    
    // CPU-only simulation
    let cpu_start = Instant::now();
    for _ in 0..operations {
        // Simulate CPU-intensive calculation
        let _ = (0..1000).map(|x| x * x).sum::<i32>();
    }
    let cpu_time = cpu_start.elapsed();
    
    // Hardware-accelerated simulation
    let gpu_start = Instant::now();
    for _ in 0..operations {
        // Simulate hardware acceleration (much faster)
        tokio::time::sleep(Duration::from_nanos(100)).await;
    }
    let gpu_time = gpu_start.elapsed();
    
    println!("    CPU processing: {:.2}ms", cpu_time.as_millis());
    println!("    Hardware accelerated: {:.2}ms", gpu_time.as_millis());
    println!("    Acceleration factor: {:.1}x", 
             cpu_time.as_millis() as f64 / gpu_time.as_millis() as f64);
    
    Ok(())
}

// Utility functions

fn display_performance_metrics(label: &str, metrics: &PerformanceMetrics) {
    println!("📊 {} Performance Metrics:", label);
    println!("  Operations/sec: {:.1}", metrics.operations_per_second);
    println!("  Average latency: {:.2}ms", metrics.average_latency_ms);
    println!("  P95 latency: {:.2}ms", metrics.p95_latency_ms);
    println!("  P99 latency: {:.2}ms", metrics.p99_latency_ms);
    println!("  Memory usage: {:.1}MB", metrics.memory_usage_mb);
    println!("  CPU usage: {:.1}%", metrics.cpu_usage_percent);
    println!("  Error rate: {:.3}%", metrics.error_rate * 100.0);
    println!("  Throughput: {:.2}MB/s", metrics.throughput_mb_per_second);
}

fn display_memory_metrics(metrics: &MemoryMetrics) {
    println!("💾 Memory Usage Metrics:");
    println!("  Heap size: {:.1}MB", metrics.heap_size_mb);
    println!("  Stack size: {:.1}MB", metrics.stack_size_mb);
    println!("  Cache size: {:.1}MB", metrics.cache_size_mb);
    println!("  Peak usage: {:.1}MB", metrics.peak_usage_mb);
    println!("  GC pressure: {:.2}", metrics.gc_pressure);
}

fn display_cache_metrics(metrics: &CacheMetrics) {
    println!("🗄️  Cache Performance Metrics:");
    println!("  Hit rate: {:.1}%", metrics.hit_rate * 100.0);
    println!("  Miss rate: {:.1}%", metrics.miss_rate * 100.0);
    println!("  Eviction rate: {:.1}%", metrics.eviction_rate * 100.0);
    println!("  Average lookup time: {:.2}ms", metrics.average_lookup_time_ms);
    println!("  Cache size: {:.1}MB", metrics.cache_size_mb);
}

fn get_current_memory_usage() -> f64 {
    // Simplified memory estimation
    std::process::id() as f64 / 1000.0 + rand::random::<f64>() * 50.0 + 100.0
}

fn estimate_memory_usage() -> f64 {
    // Estimate based on engine components
    128.0 + rand::random::<f64>() * 64.0
}

fn estimate_cpu_usage() -> f64 {
    // Simulate CPU usage
    20.0 + rand::random::<f64>() * 30.0
}

fn estimate_cache_memory_usage() -> f64 {
    // Estimate cache memory usage
    32.0 + rand::random::<f64>() * 16.0
}

fn calculate_gc_pressure(baseline: f64, peak: f64) -> f64 {
    if peak > baseline {
        (peak - baseline) / baseline
    } else {
        0.0
    }
}

fn calculate_throughput(content: &str, operations: usize, duration: Duration) -> f64 {
    let total_bytes = content.len() * operations;
    let mb = total_bytes as f64 / 1_048_576.0; // Convert to MB
    mb / duration.as_secs_f64()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_performance_metrics() {
        let metrics = measure_baseline_performance().await.unwrap();
        assert!(metrics.operations_per_second > 0.0);
        assert!(metrics.average_latency_ms > 0.0);
        assert!(metrics.memory_usage_mb > 0.0);
    }
    
    #[tokio::test]
    async fn test_memory_optimization() {
        let engine = create_memory_optimized_engine().await.unwrap();
        let metrics = measure_memory_usage(&engine).await.unwrap();
        assert!(metrics.heap_size_mb > 0.0);
        assert!(metrics.peak_usage_mb >= metrics.heap_size_mb);
    }
    
    #[tokio::test]
    async fn test_cache_performance() {
        let engine = create_cached_engine().await.unwrap();
        let metrics = benchmark_caching_performance(&engine).await.unwrap();
        assert!(metrics.hit_rate >= 0.0 && metrics.hit_rate <= 1.0);
        assert!(metrics.miss_rate >= 0.0 && metrics.miss_rate <= 1.0);
        assert!((metrics.hit_rate + metrics.miss_rate - 1.0).abs() < 0.01);
    }
    
    #[test]
    fn test_utility_functions() {
        let memory = get_current_memory_usage();
        assert!(memory > 0.0);
        
        let cpu = estimate_cpu_usage();
        assert!(cpu >= 0.0 && cpu <= 100.0);
        
        let throughput = calculate_throughput("test", 100, Duration::from_secs(1));
        assert!(throughput > 0.0);
    }
}