use anyhow::Result;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Database {
    pool: PgPool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Repository {
    pub id: Uuid,
    pub user_id: Uuid,
    pub github_repo_url: String,
    pub repository_name: String,
    pub repository_description: Option<String>,
    pub primary_language: Option<String>,
    pub languages: serde_json::Value,
    pub repository_topics: Vec<String>,
    pub stars_count: i32,
    pub forks_count: i32,
    pub analysis_data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepositoryFile {
    pub id: Uuid,
    pub repository_id: Uuid,
    pub file_path: String,
    pub file_type: Option<String>,
    pub content: String,
    pub content_size: i32,
    pub analysis_data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratedSite {
    pub id: Uuid,
    pub repository_id: Uuid,
    pub user_id: Uuid,
    pub site_name: String,
    pub site_description: Option<String>,
    pub template_used: String,
    pub status: String,
    pub analysis_data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub project_type: String,
    pub complexity_score: f32,
    pub recommended_template: String,
    pub key_features: Vec<String>,
    pub tech_stack: Vec<String>,
    pub partner_recommendations: Vec<PartnerRecommendation>,
    pub content_sections: Vec<ContentSection>,
    pub seo_keywords: Vec<String>,
    pub estimated_completion_time: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PartnerRecommendation {
    pub partner_id: Uuid,
    pub partner_name: String,
    pub relevance_score: f32,
    pub integration_type: String,
    pub cta_text: String,
    pub placement_priority: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContentSection {
    pub section_type: String,
    pub title: String,
    pub content: String,
    pub priority: i32,
    pub media_suggestions: Vec<MediaSuggestion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaSuggestion {
    pub media_type: String, // 'image', 'video', 'diagram'
    pub description: String,
    pub placement: String,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPool::connect(database_url).await?;
        
        // Run any pending migrations
        sqlx::migrate!("./migrations").run(&pool).await?;
        
        Ok(Database { pool })
    }

    pub async fn get_repository(&self, repository_id: Uuid) -> Result<Option<Repository>> {
        let row = sqlx::query!(
            r#"
            SELECT id, user_id, github_repo_url, repository_name, repository_description,
                   primary_language, languages, repository_topics, stars_count, forks_count,
                   analysis_data
            FROM repositories 
            WHERE id = $1
            "#,
            repository_id
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            Ok(Some(Repository {
                id: row.id,
                user_id: row.user_id,
                github_repo_url: row.github_repo_url,
                repository_name: row.repository_name,
                repository_description: row.repository_description,
                primary_language: row.primary_language,
                languages: row.languages,
                repository_topics: row.repository_topics,
                stars_count: row.stars_count,
                forks_count: row.forks_count,
                analysis_data: row.analysis_data,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn get_repository_files(&self, repository_id: Uuid) -> Result<Vec<RepositoryFile>> {
        let rows = sqlx::query!(
            r#"
            SELECT id, repository_id, file_path, file_type, content, content_size, analysis_data
            FROM repository_files 
            WHERE repository_id = $1
            ORDER BY file_type, file_path
            "#,
            repository_id
        )
        .fetch_all(&self.pool)
        .await?;

        let files = rows.into_iter().map(|row| RepositoryFile {
            id: row.id,
            repository_id: row.repository_id,
            file_path: row.file_path,
            file_type: row.file_type,
            content: row.content,
            content_size: row.content_size,
            analysis_data: row.analysis_data,
        }).collect();

        Ok(files)
    }

    pub async fn get_generated_site(&self, site_id: Uuid) -> Result<Option<GeneratedSite>> {
        let row = sqlx::query!(
            r#"
            SELECT id, repository_id, user_id, site_name, site_description, 
                   template_used, status, theme_config as analysis_data
            FROM generated_sites 
            WHERE id = $1
            "#,
            site_id
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            Ok(Some(GeneratedSite {
                id: row.id,
                repository_id: row.repository_id,
                user_id: row.user_id,
                site_name: row.site_name,
                site_description: row.site_description,
                template_used: row.template_used,
                status: row.status,
                analysis_data: Some(row.analysis_data),
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update_repository_analysis(
        &self,
        repository_id: Uuid,
        analysis_data: &serde_json::Value,
        analysis_score: f32,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE repositories 
            SET analysis_data = $1, 
                analysis_score = $2,
                last_analyzed_at = NOW(),
                updated_at = NOW()
            WHERE id = $3
            "#,
            analysis_data,
            analysis_score as f64,
            repository_id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_site_status(
        &self,
        site_id: Uuid,
        status: &str,
        analysis_data: Option<&serde_json::Value>,
    ) -> Result<()> {
        if let Some(data) = analysis_data {
            sqlx::query!(
                r#"
                UPDATE generated_sites 
                SET status = $1, 
                    theme_config = $2,
                    updated_at = NOW()
                WHERE id = $3
                "#,
                status,
                data,
                site_id
            )
            .execute(&self.pool)
            .await?;
        } else {
            sqlx::query!(
                r#"
                UPDATE generated_sites 
                SET status = $1,
                    updated_at = NOW()
                WHERE id = $2
                "#,
                status,
                site_id
            )
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }

    pub async fn create_site_generation_job(
        &self,
        site_id: Uuid,
        template_type: &str,
        analysis_result: &AnalysisResult,
    ) -> Result<()> {
        let job_data = serde_json::json!({
            "siteId": site_id,
            "templateType": template_type,
            "analysisResult": analysis_result,
            "requestedAt": Utc::now().to_rfc3339()
        });

        sqlx::query!(
            r#"
            INSERT INTO job_queue (job_type, job_data, priority, status)
            VALUES ('site_generation', $1, 5, 'pending')
            "#,
            job_data
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_partners(&self) -> Result<Vec<serde_json::Value>> {
        let rows = sqlx::query!(
            r#"
            SELECT id, name, slug, description, supported_features, 
                   commission_rate, integration_methods
            FROM partners 
            WHERE is_active = true
            ORDER BY name
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        let partners = rows.into_iter().map(|row| {
            serde_json::json!({
                "id": row.id,
                "name": row.name,
                "slug": row.slug,
                "description": row.description,
                "supported_features": row.supported_features,
                "commission_rate": row.commission_rate,
                "integration_methods": row.integration_methods
            })
        }).collect();

        Ok(partners)
    }

    pub async fn record_analysis_metrics(
        &self,
        repository_id: Uuid,
        processing_time_ms: i32,
        success: bool,
        error_message: Option<&str>,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO analytics.analysis_metrics 
            (repository_id, processing_time_ms, success, error_message, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            "#,
            repository_id,
            processing_time_ms,
            success,
            error_message
        )
        .execute(&self.pool)
        .await
        .ok(); // Don't fail if analytics table doesn't exist

        Ok(())
    }
}