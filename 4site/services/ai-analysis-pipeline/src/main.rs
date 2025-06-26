use anyhow::Result;
use tracing::{info, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod database;
mod queue;
mod analysis;
mod ai_models;
mod template_selector;
mod partner_recommender;
mod content_processor;

use config::Config;
use database::Database;
use queue::QueueManager;
use analysis::AnalysisEngine;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ai_analysis_pipeline=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting AI Analysis Pipeline Worker");

    // Load configuration
    let config = Config::load()?;
    info!("Configuration loaded successfully");

    // Initialize database
    let database = Database::new(&config.database_url).await?;
    info!("Database connection established");

    // Initialize queue manager
    let queue = QueueManager::new(&config.redis_url).await?;
    info!("Queue manager initialized");

    // Initialize analysis engine
    let analysis_engine = AnalysisEngine::new(config.clone(), database.clone()).await?;
    info!("Analysis engine initialized");

    // Start worker loop
    info!("Starting worker loop...");
    
    let mut handles = vec![];
    
    // Spawn multiple workers for parallel processing
    for worker_id in 0..config.worker_count {
        let queue_clone = queue.clone();
        let analysis_clone = analysis_engine.clone();
        
        let handle = tokio::spawn(async move {
            worker_loop(worker_id, queue_clone, analysis_clone).await
        });
        
        handles.push(handle);
    }

    // Wait for shutdown signal
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {
            info!("Received shutdown signal");
        }
        _ = futures::future::join_all(handles) => {
            error!("All workers exited unexpectedly");
        }
    }

    info!("Shutting down gracefully");
    Ok(())
}

async fn worker_loop(
    worker_id: usize,
    queue: QueueManager,
    analysis: AnalysisEngine,
) -> Result<()> {
    info!("Worker {} started", worker_id);
    
    loop {
        match queue.get_next_job("repo_analysis_queue", 30).await {
            Ok(Some(job)) => {
                info!("Worker {} processing job: {}", worker_id, job.id);
                
                if let Err(e) = analysis.process_job(job).await {
                    error!("Worker {} failed to process job: {}", worker_id, e);
                }
            }
            Ok(None) => {
                // No job available, continue loop
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
            Err(e) => {
                error!("Worker {} queue error: {}", worker_id, e);
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            }
        }
    }
}