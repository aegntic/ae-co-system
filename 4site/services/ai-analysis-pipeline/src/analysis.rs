use anyhow::Result;
use chrono::Utc;
use tracing::{info, warn, error};
use serde::{Deserialize, Serialize};
use std::time::Instant;

use crate::config::Config;
use crate::database::{Database, AnalysisResult, Repository, RepositoryFile, GeneratedSite};
use crate::queue::{QueueJob, QueueManager};
use crate::ai_models::{AiModelManager, AnalysisContext, AnalysisResponse};
use crate::content_processor::{ContentProcessor, ProcessedContent};
use crate::partner_recommender::{PartnerRecommender, RecommendationContext};
use crate::template_selector::{TemplateSelector, ProjectAnalysis, TemplateSelection};

#[derive(Debug, Clone)]
pub struct AnalysisEngine {
    config: Config,
    database: Database,
    ai_model: AiModelManager,
    content_processor: ContentProcessor,
    partner_recommender: PartnerRecommender,
    template_selector: TemplateSelector,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompleteAnalysis {
    pub project_analysis: ProjectAnalysis,
    pub ai_analysis: AnalysisResponse,
    pub processed_content: ProcessedContent,
    pub template_selection: TemplateSelection,
    pub partner_recommendations: Vec<crate::database::PartnerRecommendation>,
    pub metadata: AnalysisMetadata,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisMetadata {
    pub analysis_id: String,
    pub started_at: chrono::DateTime<Utc>,
    pub completed_at: chrono::DateTime<Utc>,
    pub processing_time_ms: u64,
    pub ai_model_used: String,
    pub analysis_version: String,
    pub confidence_score: f32,
}

impl AnalysisEngine {
    pub async fn new(config: Config, database: Database) -> Result<Self> {
        info!("Initializing Analysis Engine");
        
        let ai_model = AiModelManager::new(config.ai_config.clone()).await?;
        let content_processor = ContentProcessor::new();
        let partner_recommender = PartnerRecommender::new(&database).await?;
        let template_selector = TemplateSelector::new();

        Ok(AnalysisEngine {
            config,
            database,
            ai_model,
            content_processor,
            partner_recommender,
            template_selector,
        })
    }

    pub async fn process_job(&self, job: QueueJob) -> Result<()> {
        let start_time = Instant::now();
        info!("Processing analysis job: {}", job.id);

        match self.analyze_repository(job.data.project_id, job.data.repository_id).await {
            Ok(_) => {
                let processing_time = start_time.elapsed().as_millis() as i32;
                info!("Analysis completed successfully in {}ms", processing_time);
                
                // Record success metrics
                self.database.record_analysis_metrics(
                    job.data.repository_id,
                    processing_time,
                    true,
                    None,
                ).await?;
            }
            Err(e) => {
                let processing_time = start_time.elapsed().as_millis() as i32;
                error!("Analysis failed: {}", e);
                
                // Record failure metrics
                self.database.record_analysis_metrics(
                    job.data.repository_id,
                    processing_time,
                    false,
                    Some(&e.to_string()),
                ).await?;
                
                return Err(e);
            }
        }

        Ok(())
    }

    pub async fn analyze_repository(
        &self,
        site_id: uuid::Uuid,
        repository_id: uuid::Uuid,
    ) -> Result<CompleteAnalysis> {
        let analysis_start = Utc::now();
        let analysis_id = uuid::Uuid::new_v4().to_string();
        
        info!("Starting complete analysis for repository: {}", repository_id);

        // Update site status to processing
        self.database.update_site_status(site_id, "analyzing", None).await?;

        // 1. Fetch repository data
        let repository = self.database.get_repository(repository_id).await?
            .ok_or_else(|| anyhow::anyhow!("Repository not found: {}", repository_id))?;
        
        let repository_files = self.database.get_repository_files(repository_id).await?;
        
        info!("Repository data fetched: {} files found", repository_files.len());

        // 2. Create analysis context
        let context = self.create_analysis_context(&repository, &repository_files)?;
        
        // 3. Run AI analysis
        info!("Running AI analysis");
        let ai_analysis = self.ai_model.analyze_repository(context.clone()).await?;
        
        // 4. Process content
        info!("Processing repository content");
        let processed_content = self.process_repository_content(&repository_files)?;
        
        // 5. Create project analysis for template selection
        let project_analysis = self.create_project_analysis(&repository, &repository_files, &ai_analysis)?;
        
        // 6. Select template
        info!("Selecting optimal template");
        let template_selection = self.template_selector.select_template(&project_analysis)?;
        
        // 7. Generate partner recommendations
        info!("Generating partner recommendations");
        let recommendation_context = self.create_recommendation_context(&repository, &ai_analysis);
        let partner_recommendations = self.partner_recommender.recommend_partners(
            &recommendation_context,
            self.config.partner_config.max_recommendations,
            self.config.partner_config.confidence_threshold,
        );

        let analysis_end = Utc::now();
        let processing_time = (analysis_end - analysis_start).num_milliseconds() as u64;

        // 8. Create complete analysis result
        let complete_analysis = CompleteAnalysis {
            project_analysis,
            ai_analysis: ai_analysis.clone(),
            processed_content,
            template_selection: template_selection.clone(),
            partner_recommendations: partner_recommendations.clone(),
            metadata: AnalysisMetadata {
                analysis_id: analysis_id.clone(),
                started_at: analysis_start,
                completed_at: analysis_end,
                processing_time_ms: processing_time,
                ai_model_used: if self.config.ai_config.use_local_models {
                    "local-gemma".to_string()
                } else {
                    "api-fallback".to_string()
                },
                analysis_version: "1.0.0".to_string(),
                confidence_score: template_selection.confidence_score,
            },
        };

        // 9. Store analysis results
        info!("Storing analysis results");
        let analysis_data = self.create_analysis_result(&complete_analysis, &partner_recommendations)?;
        
        self.database.update_repository_analysis(
            repository_id,
            &serde_json::to_value(&analysis_data)?,
            template_selection.confidence_score,
        ).await?;

        self.database.update_site_status(
            site_id,
            "analysis_complete",
            Some(&serde_json::to_value(&complete_analysis)?),
        ).await?;

        // 10. Queue next phase (site generation)
        info!("Queueing site generation job");
        self.database.create_site_generation_job(
            site_id,
            &template_selection.template_id,
            &analysis_data,
        ).await?;

        info!("Analysis completed successfully in {}ms", processing_time);
        Ok(complete_analysis)
    }

    fn create_analysis_context(
        &self,
        repository: &Repository,
        files: &[RepositoryFile],
    ) -> Result<AnalysisContext> {
        let readme_content = files
            .iter()
            .find(|f| f.file_type.as_deref() == Some("readme"))
            .map(|f| f.content.clone());

        let package_info = files
            .iter()
            .find(|f| f.file_type.as_deref() == Some("config"))
            .and_then(|f| serde_json::from_str(&f.content).ok());

        let file_structure: Vec<String> = files
            .iter()
            .map(|f| f.file_path.clone())
            .collect();

        Ok(AnalysisContext {
            repository_name: repository.repository_name.clone(),
            repository_description: repository.repository_description.clone(),
            primary_language: repository.primary_language.clone(),
            languages: repository.languages.clone(),
            topics: repository.repository_topics.clone(),
            readme_content,
            package_info,
            file_structure,
        })
    }

    fn process_repository_content(&self, files: &[RepositoryFile]) -> Result<ProcessedContent> {
        // Find and process README content
        if let Some(readme_file) = files.iter().find(|f| f.file_type.as_deref() == Some("readme")) {
            let repository_name = "Project"; // This could be extracted from context
            self.content_processor.process_markdown(&readme_file.content, repository_name)
        } else {
            // Create minimal processed content if no README
            Ok(ProcessedContent {
                sections: vec![],
                metadata: crate::content_processor::ContentMetadata {
                    total_word_count: 0,
                    estimated_reading_time: 0,
                    complexity_level: "Unknown".to_string(),
                    primary_topics: vec![],
                    mentioned_technologies: vec![],
                    external_links: vec![],
                },
                seo_data: crate::content_processor::SeoData {
                    title: "Project Showcase".to_string(),
                    description: "A software project".to_string(),
                    keywords: vec![],
                    meta_tags: std::collections::HashMap::new(),
                    structured_data: serde_json::json!({}),
                },
            })
        }
    }

    fn create_project_analysis(
        &self,
        repository: &Repository,
        files: &[RepositoryFile],
        ai_analysis: &AnalysisResponse,
    ) -> Result<ProjectAnalysis> {
        let has_demo = files.iter().any(|f| 
            f.file_path.to_lowercase().contains("demo") ||
            f.content.to_lowercase().contains("demo") ||
            f.content.to_lowercase().contains("example")
        );

        let has_api_docs = files.iter().any(|f|
            f.file_path.to_lowercase().contains("api") ||
            f.content.to_lowercase().contains("api documentation") ||
            f.file_type.as_deref() == Some("api_reference")
        );

        let has_documentation = files.iter().any(|f|
            f.file_type.as_deref() == Some("readme") ||
            f.file_path.to_lowercase().contains("doc") ||
            f.file_path.to_lowercase().contains("guide")
        );

        let visual_assets_needed = self.determine_visual_assets(&ai_analysis.project_type);

        Ok(ProjectAnalysis {
            project_type: ai_analysis.project_type.clone(),
            complexity_score: ai_analysis.complexity_score,
            primary_language: repository.primary_language.clone(),
            tech_stack: ai_analysis.tech_stack.clone(),
            key_features: ai_analysis.key_features.clone(),
            target_audience: ai_analysis.target_audience.clone(),
            has_demo,
            has_api_docs,
            has_documentation,
            visual_assets_needed,
        })
    }

    fn determine_visual_assets(&self, project_type: &str) -> Vec<String> {
        match project_type {
            "web-application" => vec![
                "screenshots".to_string(),
                "demo-video".to_string(),
                "feature-images".to_string(),
            ],
            "game" | "creative" => vec![
                "screenshots".to_string(),
                "gameplay-video".to_string(),
                "artwork".to_string(),
                "trailer".to_string(),
            ],
            "library" | "framework" => vec![
                "code-examples".to_string(),
                "architecture-diagram".to_string(),
                "usage-examples".to_string(),
            ],
            _ => vec![
                "screenshots".to_string(),
                "feature-images".to_string(),
            ],
        }
    }

    fn create_recommendation_context(
        &self,
        repository: &Repository,
        ai_analysis: &AnalysisResponse,
    ) -> RecommendationContext {
        RecommendationContext {
            project_type: ai_analysis.project_type.clone(),
            primary_language: repository.primary_language.clone(),
            tech_stack: ai_analysis.tech_stack.clone(),
            project_topics: repository.repository_topics.clone(),
            complexity_score: ai_analysis.complexity_score,
            target_audience: ai_analysis.target_audience.clone(),
            repository_description: repository.repository_description.clone(),
        }
    }

    fn create_analysis_result(
        &self,
        complete_analysis: &CompleteAnalysis,
        partner_recommendations: &[crate::database::PartnerRecommendation],
    ) -> Result<AnalysisResult> {
        Ok(AnalysisResult {
            project_type: complete_analysis.ai_analysis.project_type.clone(),
            complexity_score: complete_analysis.ai_analysis.complexity_score,
            recommended_template: complete_analysis.template_selection.template_id.clone(),
            key_features: complete_analysis.ai_analysis.key_features.clone(),
            tech_stack: complete_analysis.ai_analysis.tech_stack.clone(),
            partner_recommendations: partner_recommendations.to_vec(),
            content_sections: self.convert_content_sections(&complete_analysis.processed_content),
            seo_keywords: complete_analysis.processed_content.seo_data.keywords.clone(),
            estimated_completion_time: self.estimate_completion_time(&complete_analysis.project_analysis),
        })
    }

    fn convert_content_sections(
        &self,
        processed_content: &ProcessedContent,
    ) -> Vec<crate::database::ContentSection> {
        processed_content.sections.iter().map(|section| {
            crate::database::ContentSection {
                section_type: section.section_type.clone(),
                title: section.title.clone(),
                content: section.content.clone(),
                priority: section.priority,
                media_suggestions: section.media_references.iter().map(|media| {
                    crate::database::MediaSuggestion {
                        media_type: media.media_type.clone(),
                        description: media.alt_text.clone().unwrap_or_else(|| "Media content".to_string()),
                        placement: "inline".to_string(),
                    }
                }).collect(),
            }
        }).collect()
    }

    fn estimate_completion_time(&self, project_analysis: &ProjectAnalysis) -> i32 {
        let mut base_time = 300; // 5 minutes base
        
        // Adjust based on complexity
        base_time += (project_analysis.complexity_score * 600.0) as i32; // Up to 10 minutes
        
        // Adjust based on features
        if project_analysis.has_demo {
            base_time += 180; // 3 minutes for demo processing
        }
        
        if project_analysis.has_api_docs {
            base_time += 120; // 2 minutes for API documentation
        }
        
        // Adjust based on tech stack complexity
        let complex_techs = ["rust", "cpp", "kubernetes", "microservices"];
        for tech in &project_analysis.tech_stack {
            if complex_techs.iter().any(|ct| tech.to_lowercase().contains(ct)) {
                base_time += 60; // 1 minute per complex technology
            }
        }
        
        base_time
    }
}