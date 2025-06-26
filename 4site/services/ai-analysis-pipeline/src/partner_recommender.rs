use anyhow::Result;
use fuzzy_matcher::{skim::SkimMatcherV2, FuzzyMatcher};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::database::{Database, PartnerRecommendation};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Partner {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub supported_features: Vec<String>,
    pub commission_rate: f64,
    pub integration_methods: Vec<String>,
    pub target_categories: Vec<String>,
    pub relevance_keywords: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecommendationContext {
    pub project_type: String,
    pub primary_language: Option<String>,
    pub tech_stack: Vec<String>,
    pub project_topics: Vec<String>,
    pub complexity_score: f32,
    pub target_audience: String,
    pub repository_description: Option<String>,
}

pub struct PartnerRecommender {
    partners: Vec<Partner>,
    matcher: SkimMatcherV2,
    category_weights: HashMap<String, f32>,
}

impl PartnerRecommender {
    pub async fn new(database: &Database) -> Result<Self> {
        let partners_data = database.get_partners().await?;
        let mut partners = Vec::new();
        
        for partner_json in partners_data {
            if let Ok(partner) = Self::parse_partner_from_json(partner_json) {
                partners.push(partner);
            }
        }

        // If no partners in database, load default partners
        if partners.is_empty() {
            partners = Self::get_default_partners();
        }

        let matcher = SkimMatcherV2::default();
        let category_weights = Self::create_category_weights();

        Ok(PartnerRecommender {
            partners,
            matcher,
            category_weights,
        })
    }

    fn parse_partner_from_json(json: serde_json::Value) -> Result<Partner> {
        let partner = Partner {
            id: uuid::Uuid::parse_str(json["id"].as_str().unwrap_or(""))?,
            name: json["name"].as_str().unwrap_or("").to_string(),
            slug: json["slug"].as_str().unwrap_or("").to_string(),
            description: json["description"].as_str().unwrap_or("").to_string(),
            supported_features: json["supported_features"]
                .as_array()
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                .unwrap_or_default(),
            commission_rate: json["commission_rate"].as_f64().unwrap_or(0.1),
            integration_methods: json["integration_methods"]
                .as_array()
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                .unwrap_or_default(),
            target_categories: Self::extract_target_categories(&json),
            relevance_keywords: Self::extract_relevance_keywords(&json),
        };
        
        Ok(partner)
    }

    fn extract_target_categories(json: &serde_json::Value) -> Vec<String> {
        // Extract from supported features and description
        let mut categories = Vec::new();
        
        if let Some(features) = json["supported_features"].as_array() {
            for feature in features {
                if let Some(feature_str) = feature.as_str() {
                    categories.push(feature_str.to_lowercase());
                }
            }
        }
        
        categories
    }

    fn extract_relevance_keywords(json: &serde_json::Value) -> Vec<String> {
        let mut keywords = Vec::new();
        
        // From name
        if let Some(name) = json["name"].as_str() {
            keywords.extend(name.to_lowercase().split_whitespace().map(|s| s.to_string()));
        }
        
        // From description
        if let Some(desc) = json["description"].as_str() {
            keywords.extend(Self::extract_keywords_from_text(desc));
        }
        
        keywords
    }

    fn extract_keywords_from_text(text: &str) -> Vec<String> {
        let tech_keywords = [
            "hosting", "deployment", "ci/cd", "monitoring", "analytics", "database",
            "authentication", "storage", "cdn", "api", "serverless", "container",
            "kubernetes", "docker", "aws", "azure", "gcp", "vercel", "netlify",
            "github", "gitlab", "bitbucket", "testing", "security", "performance",
        ];
        
        let text_lower = text.to_lowercase();
        tech_keywords
            .iter()
            .filter(|keyword| text_lower.contains(*keyword))
            .map(|keyword| keyword.to_string())
            .collect()
    }

    fn get_default_partners() -> Vec<Partner> {
        vec![
            Partner {
                id: uuid::Uuid::new_v4(),
                name: "Vercel".to_string(),
                slug: "vercel".to_string(),
                description: "Deploy your web applications with zero configuration".to_string(),
                supported_features: vec!["hosting".to_string(), "deployment".to_string(), "cdn".to_string()],
                commission_rate: 0.15,
                integration_methods: vec!["api".to_string(), "webhook".to_string()],
                target_categories: vec!["web-application".to_string(), "frontend".to_string()],
                relevance_keywords: vec!["hosting".to_string(), "deployment".to_string(), "web".to_string()],
            },
            Partner {
                id: uuid::Uuid::new_v4(),
                name: "Supabase".to_string(),
                slug: "supabase".to_string(),
                description: "Open source Firebase alternative with PostgreSQL".to_string(),
                supported_features: vec!["database".to_string(), "authentication".to_string(), "storage".to_string()],
                commission_rate: 0.12,
                integration_methods: vec!["api".to_string(), "sdk".to_string()],
                target_categories: vec!["web-application".to_string(), "backend".to_string()],
                relevance_keywords: vec!["database".to_string(), "backend".to_string(), "api".to_string()],
            },
            Partner {
                id: uuid::Uuid::new_v4(),
                name: "Railway".to_string(),
                slug: "railway".to_string(),
                description: "Deploy your code with zero DevOps complexity".to_string(),
                supported_features: vec!["hosting".to_string(), "database".to_string(), "deployment".to_string()],
                commission_rate: 0.10,
                integration_methods: vec!["git".to_string(), "api".to_string()],
                target_categories: vec!["backend".to_string(), "full-stack".to_string()],
                relevance_keywords: vec!["deployment".to_string(), "hosting".to_string(), "devops".to_string()],
            },
            Partner {
                id: uuid::Uuid::new_v4(),
                name: "Clerk".to_string(),
                slug: "clerk".to_string(),
                description: "Complete user management and authentication".to_string(),
                supported_features: vec!["authentication".to_string(), "user-management".to_string()],
                commission_rate: 0.20,
                integration_methods: vec!["sdk".to_string(), "api".to_string()],
                target_categories: vec!["web-application".to_string(), "saas".to_string()],
                relevance_keywords: vec!["auth".to_string(), "user".to_string(), "login".to_string()],
            },
            Partner {
                id: uuid::Uuid::new_v4(),
                name: "Sentry".to_string(),
                slug: "sentry".to_string(),
                description: "Application monitoring and error tracking".to_string(),
                supported_features: vec!["monitoring".to_string(), "error-tracking".to_string(), "performance".to_string()],
                commission_rate: 0.08,
                integration_methods: vec!["sdk".to_string(), "api".to_string()],
                target_categories: vec!["monitoring".to_string(), "devops".to_string()],
                relevance_keywords: vec!["monitoring".to_string(), "errors".to_string(), "debugging".to_string()],
            },
        ]
    }

    fn create_category_weights() -> HashMap<String, f32> {
        let mut weights = HashMap::new();
        
        // Project type weights
        weights.insert("web-application".to_string(), 1.0);
        weights.insert("library".to_string(), 0.6);
        weights.insert("tool".to_string(), 0.7);
        weights.insert("game".to_string(), 0.8);
        
        // Technology weights
        weights.insert("javascript".to_string(), 1.0);
        weights.insert("typescript".to_string(), 1.0);
        weights.insert("react".to_string(), 0.9);
        weights.insert("nextjs".to_string(), 0.9);
        weights.insert("node".to_string(), 0.8);
        weights.insert("python".to_string(), 0.7);
        weights.insert("rust".to_string(), 0.6);
        
        // Feature weights
        weights.insert("api".to_string(), 0.9);
        weights.insert("database".to_string(), 0.8);
        weights.insert("authentication".to_string(), 0.7);
        weights.insert("deployment".to_string(), 0.8);
        
        weights
    }

    pub fn recommend_partners(
        &self,
        context: &RecommendationContext,
        max_recommendations: usize,
        confidence_threshold: f32,
    ) -> Vec<PartnerRecommendation> {
        let mut scored_partners: Vec<(f32, &Partner)> = self.partners
            .iter()
            .map(|partner| {
                let score = self.calculate_relevance_score(partner, context);
                (score, partner)
            })
            .filter(|(score, _)| *score >= confidence_threshold)
            .collect();

        // Sort by score (highest first)
        scored_partners.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));

        // Take top recommendations and convert to PartnerRecommendation
        scored_partners
            .into_iter()
            .take(max_recommendations)
            .enumerate()
            .map(|(index, (score, partner))| {
                PartnerRecommendation {
                    partner_id: partner.id,
                    partner_name: partner.name.clone(),
                    relevance_score: score,
                    integration_type: self.suggest_integration_type(partner, context),
                    cta_text: self.generate_cta_text(partner, context),
                    placement_priority: (max_recommendations - index) as i32,
                }
            })
            .collect()
    }

    fn calculate_relevance_score(&self, partner: &Partner, context: &RecommendationContext) -> f32 {
        let mut score = 0.0;
        
        // Project type matching
        score += self.score_project_type_match(partner, context) * 0.3;
        
        // Technology stack matching
        score += self.score_tech_stack_match(partner, context) * 0.25;
        
        // Feature relevance
        score += self.score_feature_relevance(partner, context) * 0.2;
        
        // Keyword matching
        score += self.score_keyword_match(partner, context) * 0.15;
        
        // Complexity appropriateness
        score += self.score_complexity_match(partner, context) * 0.1;
        
        score.min(1.0)
    }

    fn score_project_type_match(&self, partner: &Partner, context: &RecommendationContext) -> f32 {
        let project_type = &context.project_type.to_lowercase();
        
        for category in &partner.target_categories {
            if category.contains(project_type) || project_type.contains(category) {
                return 1.0;
            }
        }
        
        // Fuzzy matching for project types
        let match_score = self.matcher
            .fuzzy_match(project_type, &partner.target_categories.join(" "))
            .unwrap_or(0);
        
        (match_score as f32 / 100.0).min(1.0)
    }

    fn score_tech_stack_match(&self, partner: &Partner, context: &RecommendationContext) -> f32 {
        let mut max_score = 0.0;
        
        for tech in &context.tech_stack {
            let tech_lower = tech.to_lowercase();
            
            for keyword in &partner.relevance_keywords {
                let match_score = self.matcher
                    .fuzzy_match(&tech_lower, keyword)
                    .unwrap_or(0);
                
                let normalized_score = (match_score as f32 / 100.0) * 
                    self.category_weights.get(&tech_lower).unwrap_or(&0.5);
                
                max_score = max_score.max(normalized_score);
            }
        }
        
        max_score
    }

    fn score_feature_relevance(&self, partner: &Partner, context: &RecommendationContext) -> f32 {
        let mut relevance = 0.0;
        
        // Check if partner features align with project needs
        for feature in &partner.supported_features {
            let feature_lower = feature.to_lowercase();
            
            if self.is_feature_relevant(&feature_lower, context) {
                relevance += self.category_weights.get(&feature_lower).unwrap_or(&0.5);
            }
        }
        
        (relevance / partner.supported_features.len() as f32).min(1.0)
    }

    fn is_feature_relevant(&self, feature: &str, context: &RecommendationContext) -> bool {
        match feature {
            "hosting" | "deployment" => {
                context.project_type.contains("application") || 
                context.project_type.contains("web")
            },
            "database" => {
                context.tech_stack.iter().any(|tech| 
                    tech.to_lowercase().contains("sql") || 
                    tech.to_lowercase().contains("database") ||
                    tech.to_lowercase().contains("mongo")
                )
            },
            "authentication" => {
                context.project_type.contains("application") ||
                context.target_audience.to_lowercase().contains("user")
            },
            "monitoring" => {
                context.complexity_score > 0.5 ||
                context.project_type.contains("application")
            },
            _ => true, // Default to relevant
        }
    }

    fn score_keyword_match(&self, partner: &Partner, context: &RecommendationContext) -> f32 {
        let mut total_score = 0.0;
        let mut matches = 0;
        
        // Check description matching
        if let Some(desc) = &context.repository_description {
            for keyword in &partner.relevance_keywords {
                if let Some(match_score) = self.matcher.fuzzy_match(&desc.to_lowercase(), keyword) {
                    total_score += (match_score as f32 / 100.0);
                    matches += 1;
                }
            }
        }
        
        // Check topic matching
        for topic in &context.project_topics {
            for keyword in &partner.relevance_keywords {
                if let Some(match_score) = self.matcher.fuzzy_match(&topic.to_lowercase(), keyword) {
                    total_score += (match_score as f32 / 100.0);
                    matches += 1;
                }
            }
        }
        
        if matches > 0 {
            total_score / matches as f32
        } else {
            0.0
        }
    }

    fn score_complexity_match(&self, partner: &Partner, context: &RecommendationContext) -> f32 {
        // Simple partners for simple projects, complex partners for complex projects
        let partner_complexity = self.estimate_partner_complexity(partner);
        let complexity_diff = (partner_complexity - context.complexity_score).abs();
        
        // Score is higher when complexities match
        1.0 - complexity_diff
    }

    fn estimate_partner_complexity(&self, partner: &Partner) -> f32 {
        let mut complexity = 0.5; // Default medium complexity
        
        // More features = higher complexity
        complexity += (partner.supported_features.len() as f32 * 0.1).min(0.3);
        
        // Certain features indicate higher complexity
        for feature in &partner.supported_features {
            match feature.as_str() {
                "monitoring" | "analytics" | "scaling" => complexity += 0.2,
                "authentication" | "database" => complexity += 0.15,
                "hosting" | "deployment" => complexity += 0.1,
                _ => {}
            }
        }
        
        complexity.min(1.0)
    }

    fn suggest_integration_type(&self, partner: &Partner, context: &RecommendationContext) -> String {
        // Suggest the most appropriate integration method
        if partner.integration_methods.contains(&"sdk".to_string()) && 
           context.project_type.contains("application") {
            "SDK Integration".to_string()
        } else if partner.integration_methods.contains(&"api".to_string()) {
            "API Integration".to_string()
        } else if partner.integration_methods.contains(&"webhook".to_string()) {
            "Webhook Integration".to_string()
        } else {
            "Direct Integration".to_string()
        }
    }

    fn generate_cta_text(&self, partner: &Partner, context: &RecommendationContext) -> String {
        match partner.slug.as_str() {
            "vercel" => "Deploy instantly with Vercel".to_string(),
            "supabase" => "Add backend with Supabase".to_string(),
            "railway" => "Deploy effortlessly on Railway".to_string(),
            "clerk" => "Add authentication with Clerk".to_string(),
            "sentry" => "Monitor with Sentry".to_string(),
            _ => {
                if partner.supported_features.contains(&"hosting".to_string()) {
                    format!("Deploy with {}", partner.name)
                } else if partner.supported_features.contains(&"database".to_string()) {
                    format!("Add database with {}", partner.name)
                } else {
                    format!("Enhance with {}", partner.name)
                }
            }
        }
    }
}