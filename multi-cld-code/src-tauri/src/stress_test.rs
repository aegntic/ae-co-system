/*
 * CCTM Performance Stress Testing Framework
 * 
 * Validates the core claim: "50+ concurrent terminal virtualization"
 * Tests resource usage, memory limits, and attention detection under load
 */

use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::time::sleep;
use anyhow::{Result, Error};
use serde::{Serialize, Deserialize};

use crate::virtualization::{VirtualTerminalPool, ResourceMonitor, ResourceUsage};
use crate::attention_detector::AttentionDetector;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StressTestConfig {
    pub max_terminals: usize,
    pub test_duration_secs: u64,
    pub spawn_interval_ms: u64,
    pub command_interval_ms: u64,
    pub memory_limit_mb: usize,
    pub cpu_limit_percent: f64,
}

impl Default for StressTestConfig {
    fn default() -> Self {
        Self {
            max_terminals: 75, // Test beyond claimed 50+ limit
            test_duration_secs: 300, // 5 minute stress test
            spawn_interval_ms: 100, // Spawn terminal every 100ms
            command_interval_ms: 500, // Send command every 500ms
            memory_limit_mb: 200, // Target: <200MB idle (from CLAUDE.md)
            cpu_limit_percent: 5.0, // Target: <5% CPU idle
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StressTestResults {
    pub terminals_spawned: usize,
    pub terminals_active: usize,
    pub peak_memory_mb: f64,
    pub avg_memory_mb: f64,
    pub peak_cpu_percent: f64,
    pub avg_cpu_percent: f64,
    pub attention_detections: usize,
    pub failed_spawns: usize,
    pub test_duration_actual: Duration,
    pub performance_score: f64, // 0-100 score based on targets
}

#[derive(Debug)]
pub struct StressTestFramework {
    config: StressTestConfig,
    pool: Arc<Mutex<VirtualTerminalPool>>,
    monitor: Arc<ResourceMonitor>,
    attention_detector: Arc<AttentionDetector>,
    results: Arc<Mutex<StressTestResults>>,
}

impl StressTestFramework {
    pub async fn new(config: StressTestConfig) -> Result<Self> {
        let pool = Arc::new(Mutex::new(VirtualTerminalPool::new(config.max_terminals).await?));
        let monitor = Arc::new(ResourceMonitor::new());
        let attention_detector = Arc::new(AttentionDetector::new());
        
        let results = Arc::new(Mutex::new(StressTestResults {
            terminals_spawned: 0,
            terminals_active: 0,
            peak_memory_mb: 0.0,
            avg_memory_mb: 0.0,
            peak_cpu_percent: 0.0,
            avg_cpu_percent: 0.0,
            attention_detections: 0,
            failed_spawns: 0,
            test_duration_actual: Duration::from_secs(0),
            performance_score: 0.0,
        }));

        Ok(Self {
            config,
            pool,
            monitor,
            attention_detector,
            results,
        })
    }

    pub async fn run_comprehensive_stress_test(&self) -> Result<StressTestResults> {
        log::info!("🚀 Starting CCTM Comprehensive Stress Test");
        log::info!("Target: {} concurrent terminals for {} seconds", 
                  self.config.max_terminals, self.config.test_duration_secs);
        
        let start_time = Instant::now();
        
        // Start resource monitoring
        let monitor_task = self.start_resource_monitoring().await;
        
        // Start terminal spawning
        let spawn_task = self.start_terminal_spawning().await;
        
        // Start command simulation
        let command_task = self.start_command_simulation().await;
        
        // Start attention detection testing  
        let attention_task = self.start_attention_testing().await;
        
        // Wait for test duration
        sleep(Duration::from_secs(self.config.test_duration_secs)).await;
        
        // Stop all tasks and collect results
        self.stop_all_tasks().await?;
        
        let actual_duration = start_time.elapsed();
        self.finalize_results(actual_duration).await;
        
        let results = self.results.lock().unwrap().clone();
        log::info!("✅ Stress test completed: {:#?}", results);
        
        Ok(results)
    }

    async fn start_resource_monitoring(&self) -> tokio::task::JoinHandle<()> {
        let monitor = Arc::clone(&self.monitor);
        let results = Arc::clone(&self.results);
        
        tokio::spawn(async move {
            let mut memory_samples = Vec::new();
            let mut cpu_samples = Vec::new();
            
            loop {
                if let Ok(usage) = monitor.get_current_usage() {
                    memory_samples.push(usage.memory_mb);
                    cpu_samples.push(usage.cpu_percent);
                    
                    let mut results_guard = results.lock().unwrap();
                    results_guard.peak_memory_mb = results_guard.peak_memory_mb.max(usage.memory_mb);
                    results_guard.peak_cpu_percent = results_guard.peak_cpu_percent.max(usage.cpu_percent);
                    results_guard.avg_memory_mb = memory_samples.iter().sum::<f64>() / memory_samples.len() as f64;
                    results_guard.avg_cpu_percent = cpu_samples.iter().sum::<f64>() / cpu_samples.len() as f64;
                }
                
                sleep(Duration::from_millis(100)).await;
            }
        })
    }

    async fn start_terminal_spawning(&self) -> tokio::task::JoinHandle<()> {
        let pool = Arc::clone(&self.pool);
        let results = Arc::clone(&self.results);
        let spawn_interval = self.config.spawn_interval_ms;
        let max_terminals = self.config.max_terminals;
        
        tokio::spawn(async move {
            for i in 0..max_terminals {
                let terminal_result = {
                    let mut pool_guard = pool.lock().unwrap();
                    pool_guard.spawn_terminal(format!("stress-test-{}", i), "/tmp".to_string()).await
                };
                
                let mut results_guard = results.lock().unwrap();
                match terminal_result {
                    Ok(_) => {
                        results_guard.terminals_spawned += 1;
                        results_guard.terminals_active += 1;
                    },
                    Err(_) => {
                        results_guard.failed_spawns += 1;
                    }
                }
                drop(results_guard);
                
                sleep(Duration::from_millis(spawn_interval)).await;
            }
        })
    }

    async fn start_command_simulation(&self) -> tokio::task::JoinHandle<()> {
        let pool = Arc::clone(&self.pool);
        let command_interval = self.config.command_interval_ms;
        
        tokio::spawn(async move {
            let test_commands = vec![
                "echo 'CCTM Stress Test Command'",
                "pwd",
                "ls -la",
                "ps aux | head -5",
                "uname -a",
                "date",
            ];
            
            let mut command_index = 0;
            loop {
                let command = test_commands[command_index % test_commands.len()];
                
                // Send command to random active terminal
                if let Ok(terminals) = pool.lock().unwrap().get_active_terminals() {
                    if !terminals.is_empty() {
                        let terminal_id = &terminals[command_index % terminals.len()];
                        let _ = pool.lock().unwrap().send_input(terminal_id.clone(), command.to_string()).await;
                    }
                }
                
                command_index += 1;
                sleep(Duration::from_millis(command_interval)).await;
            }
        })
    }

    async fn start_attention_testing(&self) -> tokio::task::JoinHandle<()> {
        let pool = Arc::clone(&self.pool);
        let attention_detector = Arc::clone(&self.attention_detector);
        let results = Arc::clone(&self.results);
        
        tokio::spawn(async move {
            loop {
                if let Ok(terminals) = pool.lock().unwrap().get_active_terminals() {
                    for terminal_id in terminals {
                        if let Ok(output) = pool.lock().unwrap().get_terminal_output(terminal_id.clone()) {
                            if attention_detector.needs_attention(&output) {
                                results.lock().unwrap().attention_detections += 1;
                            }
                        }
                    }
                }
                
                sleep(Duration::from_millis(200)).await;
            }
        })
    }

    async fn stop_all_tasks(&self) -> Result<()> {
        // Gracefully shutdown all spawned terminals
        let terminal_ids: Vec<String> = {
            let pool_guard = self.pool.lock().unwrap();
            pool_guard.get_active_terminals().unwrap_or_default()
        };
        
        for terminal_id in terminal_ids {
            let _ = self.pool.lock().unwrap().terminate_terminal(terminal_id).await;
        }
        
        Ok(())
    }

    async fn finalize_results(&self, actual_duration: Duration) {
        let mut results_guard = self.results.lock().unwrap();
        results_guard.test_duration_actual = actual_duration;
        
        // Calculate performance score based on targets
        let memory_score = if results_guard.avg_memory_mb <= self.config.memory_limit_mb as f64 {
            100.0
        } else {
            (self.config.memory_limit_mb as f64 / results_guard.avg_memory_mb * 100.0).min(100.0)
        };
        
        let cpu_score = if results_guard.avg_cpu_percent <= self.config.cpu_limit_percent {
            100.0
        } else {
            (self.config.cpu_limit_percent / results_guard.avg_cpu_percent * 100.0).min(100.0)
        };
        
        let spawn_success_rate = if results_guard.terminals_spawned + results_guard.failed_spawns > 0 {
            results_guard.terminals_spawned as f64 / 
            (results_guard.terminals_spawned + results_guard.failed_spawns) as f64 * 100.0
        } else { 0.0 };
        
        // Weight the scores: 40% memory, 30% CPU, 30% spawn success
        results_guard.performance_score = (memory_score * 0.4) + (cpu_score * 0.3) + (spawn_success_rate * 0.3);
    }

    pub async fn quick_validation_test(&self) -> Result<bool> {
        log::info!("🔍 Running quick validation test (10 terminals, 30 seconds)");
        
        let quick_config = StressTestConfig {
            max_terminals: 10,
            test_duration_secs: 30,
            ..Default::default()
        };
        
        let framework = StressTestFramework::new(quick_config).await?;
        let results = framework.run_comprehensive_stress_test().await?;
        
        // Pass if we can spawn at least 8/10 terminals with reasonable resource usage
        let success = results.terminals_spawned >= 8 && 
                     results.avg_memory_mb < 100.0 && 
                     results.avg_cpu_percent < 10.0;
        
        log::info!("Quick validation: {} (spawned: {}, memory: {:.1}MB, CPU: {:.1}%)", 
                  if success { "PASS" } else { "FAIL" },
                  results.terminals_spawned, results.avg_memory_mb, results.avg_cpu_percent);
        
        Ok(success)
    }
}

// Public API for stress testing
pub async fn run_cctm_stress_test() -> Result<StressTestResults> {
    let config = StressTestConfig::default();
    let framework = StressTestFramework::new(config).await?;
    framework.run_comprehensive_stress_test().await
}

pub async fn validate_cctm_performance() -> Result<bool> {
    let config = StressTestConfig::default();
    let framework = StressTestFramework::new(config).await?;
    framework.quick_validation_test().await
}