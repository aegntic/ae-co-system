use anyhow::Result;
use redis::{AsyncCommands, Client, Connection};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct QueueManager {
    client: Client,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueueJob {
    pub id: String,
    pub job_type: String,
    pub data: JobData,
    pub created_at: DateTime<Utc>,
    pub attempts: u32,
    pub max_attempts: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobData {
    pub project_id: Uuid,
    pub repository_id: Uuid,
    pub repo_url: String,
    pub user_id: Uuid,
    pub requested_at: String,
    pub options: Option<JobOptions>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobOptions {
    pub force_reanalysis: Option<bool>,
    pub include_files: Option<Vec<String>>,
    pub analysis_depth: Option<String>,
}

impl QueueManager {
    pub async fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url)?;
        
        // Test connection
        let mut conn = client.get_async_connection().await?;
        let _: String = conn.ping().await?;
        
        Ok(QueueManager { client })
    }

    pub async fn get_next_job(&self, queue_name: &str, timeout_seconds: u64) -> Result<Option<QueueJob>> {
        let mut conn = self.client.get_async_connection().await?;
        
        // Try to get job with blocking pop
        let result: Option<Vec<String>> = conn
            .blpop(queue_name, timeout_seconds as usize)
            .await?;

        if let Some(values) = result {
            if values.len() >= 2 {
                let job_json = &values[1];
                let job: QueueJob = serde_json::from_str(job_json)?;
                return Ok(Some(job));
            }
        }

        Ok(None)
    }

    pub async fn add_job_to_next_queue(&self, job_type: &str, job_data: serde_json::Value) -> Result<()> {
        let mut conn = self.client.get_async_connection().await?;
        
        let queue_name = match job_type {
            "site_generation" => "site_generation_queue",
            "video_generation" => "video_generation_queue", 
            "deployment" => "deployment_queue",
            _ => return Err(anyhow::anyhow!("Unknown job type: {}", job_type)),
        };

        let job = QueueJob {
            id: Uuid::new_v4().to_string(),
            job_type: job_type.to_string(),
            data: serde_json::from_value(job_data)?,
            created_at: Utc::now(),
            attempts: 0,
            max_attempts: 3,
        };

        let job_json = serde_json::to_string(&job)?;
        conn.rpush(queue_name, job_json).await?;
        
        Ok(())
    }

    pub async fn report_job_success(&self, job: &QueueJob) -> Result<()> {
        let mut conn = self.client.get_async_connection().await?;
        
        // Store job result for tracking
        let key = format!("job_result:{}", job.id);
        let result = serde_json::json!({
            "status": "completed",
            "completed_at": Utc::now().to_rfc3339(),
            "job_id": job.id
        });
        
        conn.setex(key, 86400, serde_json::to_string(&result)?).await?; // 24 hour TTL
        
        Ok(())
    }

    pub async fn report_job_failure(&self, job: &QueueJob, error: &str, retry: bool) -> Result<()> {
        let mut conn = self.client.get_async_connection().await?;
        
        if retry && job.attempts < job.max_attempts {
            // Retry with exponential backoff
            let delay = 2_u64.pow(job.attempts);
            let retry_job = QueueJob {
                attempts: job.attempts + 1,
                ..job.clone()
            };
            
            let job_json = serde_json::to_string(&retry_job)?;
            
            // Add to delayed queue
            let score = (Utc::now().timestamp() + delay as i64) as f64;
            conn.zadd("delayed_jobs", job_json, score).await?;
        } else {
            // Mark as failed
            let key = format!("job_result:{}", job.id);
            let result = serde_json::json!({
                "status": "failed",
                "failed_at": Utc::now().to_rfc3339(),
                "error": error,
                "attempts": job.attempts,
                "job_id": job.id
            });
            
            conn.setex(key, 86400, serde_json::to_string(&result)?).await?;
        }
        
        Ok(())
    }

    pub async fn get_queue_stats(&self, queue_name: &str) -> Result<QueueStats> {
        let mut conn = self.client.get_async_connection().await?;
        
        let pending: i32 = conn.llen(queue_name).await?;
        let delayed: i32 = conn.zcard("delayed_jobs").await?;
        
        Ok(QueueStats {
            queue_name: queue_name.to_string(),
            pending_jobs: pending,
            delayed_jobs: delayed,
            total_jobs: pending + delayed,
        })
    }

    pub async fn process_delayed_jobs(&self) -> Result<()> {
        let mut conn = self.client.get_async_connection().await?;
        let now = Utc::now().timestamp() as f64;
        
        // Get ready jobs
        let ready_jobs: Vec<String> = conn
            .zrangebyscore_limit("delayed_jobs", 0.0, now, 0, 100)
            .await?;

        for job_json in ready_jobs {
            // Parse job to determine target queue
            if let Ok(job) = serde_json::from_str::<QueueJob>(&job_json) {
                let queue_name = match job.job_type.as_str() {
                    "repo_analysis" => "repo_analysis_queue",
                    "site_generation" => "site_generation_queue",
                    "video_generation" => "video_generation_queue",
                    "deployment" => "deployment_queue",
                    _ => continue,
                };
                
                // Move to active queue
                conn.rpush(queue_name, &job_json).await?;
                conn.zrem("delayed_jobs", &job_json).await?;
            }
        }
        
        Ok(())
    }
}

#[derive(Debug, Serialize)]
pub struct QueueStats {
    pub queue_name: String,
    pub pending_jobs: i32,
    pub delayed_jobs: i32,
    pub total_jobs: i32,
}