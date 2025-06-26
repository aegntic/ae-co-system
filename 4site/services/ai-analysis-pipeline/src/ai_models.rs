use anyhow::Result;
use candle_core::{Device, Tensor};
use candle_nn::VarBuilder;
use candle_transformers::models::gemma::{Config as GemmaConfig, GemmaModel};
use tokenizers::Tokenizer;
use serde::{Deserialize, Serialize};
use std::path::Path;
use reqwest::Client;
use crate::config::{Config, AiConfig};

#[derive(Debug, Clone)]
pub struct AiModelManager {
    config: AiConfig,
    device: Device,
    local_model: Option<LocalModel>,
    http_client: Client,
}

#[derive(Debug)]
struct LocalModel {
    model: GemmaModel,
    tokenizer: Tokenizer,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisPrompt {
    pub system_prompt: String,
    pub user_prompt: String,
    pub context: AnalysisContext,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisContext {
    pub repository_name: String,
    pub repository_description: Option<String>,
    pub primary_language: Option<String>,
    pub languages: serde_json::Value,
    pub topics: Vec<String>,
    pub readme_content: Option<String>,
    pub package_info: Option<serde_json::Value>,
    pub file_structure: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisResponse {
    pub project_type: String,
    pub complexity_score: f32,
    pub recommended_template: String,
    pub key_features: Vec<String>,
    pub tech_stack: Vec<String>,
    pub target_audience: String,
    pub project_goals: Vec<String>,
    pub unique_selling_points: Vec<String>,
    pub development_stage: String,
    pub content_suggestions: Vec<ContentSuggestion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContentSuggestion {
    pub section_type: String,
    pub title: String,
    pub content: String,
    pub priority: i32,
}

impl AiModelManager {
    pub async fn new(config: AiConfig) -> Result<Self> {
        let device = Device::Cpu; // Use CPU for now, can be GPU-accelerated later
        
        let local_model = if config.use_local_models {
            Self::load_local_model(&config, &device).await.ok()
        } else {
            None
        };

        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()?;

        Ok(AiModelManager {
            config,
            device,
            local_model,
            http_client,
        })
    }

    async fn load_local_model(config: &AiConfig, device: &Device) -> Result<LocalModel> {
        // Load tokenizer
        let tokenizer = Tokenizer::from_file(&config.tokenizer_path)?;
        
        // Load model configuration
        let model_config = GemmaConfig::config_2b_v2();
        
        // Load model weights (this is simplified - actual implementation would load from safetensors)
        let varmap = candle_nn::VarMap::new();
        let vb = VarBuilder::from_varmap(&varmap, candle_core::DType::F32, device);
        let model = GemmaModel::load(&vb, &model_config)?;

        Ok(LocalModel {
            model,
            tokenizer,
        })
    }

    pub async fn analyze_repository(&self, context: AnalysisContext) -> Result<AnalysisResponse> {
        let prompt = self.create_analysis_prompt(context);
        
        // Try local model first, fallback to API
        if let Some(ref local_model) = self.local_model {
            match self.analyze_with_local_model(local_model, &prompt).await {
                Ok(response) => return Ok(response),
                Err(e) => {
                    tracing::warn!("Local model failed, falling back to API: {}", e);
                }
            }
        }

        // Fallback to external API
        self.analyze_with_api(&prompt).await
    }

    fn create_analysis_prompt(&self, context: AnalysisContext) -> AnalysisPrompt {
        let system_prompt = r#"
You are an expert software project analyst specializing in creating professional presentation sites.
Analyze the provided repository information and generate comprehensive insights for creating an optimal site.

Your analysis should consider:
1. Project type classification (web app, library, tool, game, etc.)
2. Technical complexity and sophistication
3. Target audience and use cases
4. Key features and value propositions
5. Appropriate presentation template
6. Content structure recommendations

Respond with a JSON object containing your analysis.
"#.to_string();

        let user_prompt = format!(
            r#"
Analyze this repository:

Repository: {}
Description: {}
Primary Language: {}
Languages: {}
Topics: {:?}

README Content:
{}

Package Information:
{}

File Structure:
{}

Provide a comprehensive analysis in JSON format with the specified fields.
"#,
            context.repository_name,
            context.repository_description.unwrap_or_else(|| "No description".to_string()),
            context.primary_language.unwrap_or_else(|| "Unknown".to_string()),
            context.languages,
            context.topics,
            context.readme_content.unwrap_or_else(|| "No README found".to_string()),
            context.package_info.unwrap_or_else(|| serde_json::json!({})),
            context.file_structure.join("\n")
        );

        AnalysisPrompt {
            system_prompt,
            user_prompt,
            context,
        }
    }

    async fn analyze_with_local_model(
        &self,
        local_model: &LocalModel,
        prompt: &AnalysisPrompt,
    ) -> Result<AnalysisResponse> {
        let full_prompt = format!("{}\n\n{}", prompt.system_prompt, prompt.user_prompt);
        
        // Tokenize input
        let encoding = local_model.tokenizer.encode(full_prompt, true)?;
        let tokens = encoding.get_ids();
        
        // Convert to tensor
        let input_tensor = Tensor::new(tokens, &self.device)?
            .unsqueeze(0)?; // Add batch dimension
        
        // Generate response (simplified - actual implementation would be more complex)
        let logits = local_model.model.forward(&input_tensor)?;
        
        // For now, return a structured response based on simple analysis
        // In a real implementation, you'd decode the model output properly
        Ok(self.create_fallback_analysis(&prompt.context))
    }

    async fn analyze_with_api(&self, prompt: &AnalysisPrompt) -> Result<AnalysisResponse> {
        // Try Gemini API first
        if let Some(ref api_key) = self.config.gemini_api_key {
            match self.call_gemini_api(api_key, prompt).await {
                Ok(response) => return Ok(response),
                Err(e) => tracing::warn!("Gemini API failed: {}", e),
            }
        }

        // Try OpenAI API as fallback
        if let Some(ref api_key) = self.config.openai_api_key {
            match self.call_openai_api(api_key, prompt).await {
                Ok(response) => return Ok(response),
                Err(e) => tracing::warn!("OpenAI API failed: {}", e),
            }
        }

        // Final fallback to rule-based analysis
        Ok(self.create_fallback_analysis(&prompt.context))
    }

    async fn call_gemini_api(&self, api_key: &str, prompt: &AnalysisPrompt) -> Result<AnalysisResponse> {
        let request_body = serde_json::json!({
            "contents": [{
                "parts": [{
                    "text": format!("{}\n\n{}", prompt.system_prompt, prompt.user_prompt)
                }]
            }],
            "generationConfig": {
                "temperature": self.config.temperature,
                "maxOutputTokens": self.config.max_tokens,
                "topP": 0.8,
                "topK": 10
            }
        });

        let response = self.http_client
            .post(&format!("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={}", api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;

        if response.status().is_success() {
            let response_data: serde_json::Value = response.json().await?;
            
            if let Some(text) = response_data["candidates"][0]["content"]["parts"][0]["text"].as_str() {
                // Try to parse JSON response
                if let Ok(analysis) = serde_json::from_str::<AnalysisResponse>(text) {
                    return Ok(analysis);
                }
                
                // If JSON parsing fails, create analysis from text
                return Ok(self.parse_text_response(text, &prompt.context));
            }
        }

        Err(anyhow::anyhow!("Gemini API request failed"))
    }

    async fn call_openai_api(&self, api_key: &str, prompt: &AnalysisPrompt) -> Result<AnalysisResponse> {
        let request_body = serde_json::json!({
            "model": "gpt-4",
            "messages": [
                {
                    "role": "system",
                    "content": prompt.system_prompt
                },
                {
                    "role": "user", 
                    "content": prompt.user_prompt
                }
            ],
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens
        });

        let response = self.http_client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;

        if response.status().is_success() {
            let response_data: serde_json::Value = response.json().await?;
            
            if let Some(text) = response_data["choices"][0]["message"]["content"].as_str() {
                if let Ok(analysis) = serde_json::from_str::<AnalysisResponse>(text) {
                    return Ok(analysis);
                }
                
                return Ok(self.parse_text_response(text, &prompt.context));
            }
        }

        Err(anyhow::anyhow!("OpenAI API request failed"))
    }

    fn create_fallback_analysis(&self, context: &AnalysisContext) -> AnalysisResponse {
        let project_type = self.classify_project_type(context);
        let complexity_score = self.calculate_complexity_score(context);
        let recommended_template = self.recommend_template(&project_type, complexity_score);
        
        AnalysisResponse {
            project_type: project_type.clone(),
            complexity_score,
            recommended_template,
            key_features: self.extract_features(context),
            tech_stack: self.extract_tech_stack(context),
            target_audience: self.determine_target_audience(&project_type),
            project_goals: self.infer_project_goals(context),
            unique_selling_points: self.extract_unique_points(context),
            development_stage: self.assess_development_stage(context),
            content_suggestions: self.generate_content_suggestions(context),
        }
    }

    fn classify_project_type(&self, context: &AnalysisContext) -> String {
        let language = context.primary_language.as_deref().unwrap_or("");
        let topics = &context.topics;
        let name = &context.repository_name.to_lowercase();

        if topics.contains(&"web".to_string()) || topics.contains(&"website".to_string()) {
            return "web-application".to_string();
        }
        
        if topics.contains(&"library".to_string()) || name.contains("lib") {
            return "library".to_string();
        }
        
        if topics.contains(&"cli".to_string()) || topics.contains(&"tool".to_string()) {
            return "developer-tool".to_string();
        }
        
        match language {
            "JavaScript" | "TypeScript" => "web-application",
            "Python" => "data-science-tool",
            "Rust" | "Go" | "C++" => "system-tool",
            "Java" | "Kotlin" => "enterprise-application",
            _ => "general-application",
        }.to_string()
    }

    fn calculate_complexity_score(&self, context: &AnalysisContext) -> f32 {
        let mut score = 0.0;
        
        // Language complexity
        match context.primary_language.as_deref() {
            Some("JavaScript") | Some("Python") => score += 0.3,
            Some("TypeScript") | Some("Java") => score += 0.5,
            Some("Rust") | Some("C++") => score += 0.8,
            _ => score += 0.4,
        }
        
        // Multiple languages increase complexity
        if let Some(languages) = context.languages.as_object() {
            score += (languages.len() as f32 - 1.0) * 0.1;
        }
        
        // Topics indicate complexity
        score += context.topics.len() as f32 * 0.05;
        
        // README length indicates documentation effort
        if let Some(readme) = &context.readme_content {
            score += (readme.len() as f32 / 10000.0).min(0.3);
        }
        
        score.min(1.0)
    }

    fn recommend_template(&self, project_type: &str, complexity_score: f32) -> String {
        match project_type {
            "web-application" => if complexity_score > 0.7 { "enterprise-web" } else { "modern-web" },
            "library" => "developer-library",
            "developer-tool" => "technical-tool",
            "data-science-tool" => "research-project",
            "system-tool" => "technical-showcase",
            _ => "general-project",
        }.to_string()
    }

    fn extract_features(&self, context: &AnalysisContext) -> Vec<String> {
        let mut features = Vec::new();
        
        if context.topics.contains(&"api".to_string()) {
            features.push("RESTful API".to_string());
        }
        if context.topics.contains(&"database".to_string()) {
            features.push("Database Integration".to_string());
        }
        if context.topics.contains(&"machine-learning".to_string()) {
            features.push("Machine Learning".to_string());
        }
        
        features
    }

    fn extract_tech_stack(&self, context: &AnalysisContext) -> Vec<String> {
        let mut stack = Vec::new();
        
        if let Some(lang) = &context.primary_language {
            stack.push(lang.clone());
        }
        
        if let Some(languages) = context.languages.as_object() {
            for lang in languages.keys() {
                if lang != context.primary_language.as_ref().unwrap_or(&String::new()) {
                    stack.push(lang.clone());
                }
            }
        }
        
        stack
    }

    fn determine_target_audience(&self, project_type: &str) -> String {
        match project_type {
            "web-application" => "End users and businesses",
            "library" => "Developers and engineers",
            "developer-tool" => "Software developers",
            "data-science-tool" => "Data scientists and researchers",
            _ => "Technical professionals",
        }.to_string()
    }

    fn infer_project_goals(&self, context: &AnalysisContext) -> Vec<String> {
        let mut goals = vec!["Provide value to users".to_string()];
        
        if context.topics.contains(&"open-source".to_string()) {
            goals.push("Foster community collaboration".to_string());
        }
        
        goals
    }

    fn extract_unique_points(&self, context: &AnalysisContext) -> Vec<String> {
        let mut points = Vec::new();
        
        if let Some(desc) = &context.repository_description {
            if desc.to_lowercase().contains("fast") {
                points.push("High performance".to_string());
            }
            if desc.to_lowercase().contains("simple") {
                points.push("Easy to use".to_string());
            }
        }
        
        points
    }

    fn assess_development_stage(&self, context: &AnalysisContext) -> String {
        // Simple heuristic based on available information
        if context.readme_content.is_some() && !context.topics.is_empty() {
            "Active development"
        } else {
            "Early stage"
        }.to_string()
    }

    fn generate_content_suggestions(&self, context: &AnalysisContext) -> Vec<ContentSuggestion> {
        vec![
            ContentSuggestion {
                section_type: "hero".to_string(),
                title: format!("Welcome to {}", context.repository_name),
                content: context.repository_description.clone().unwrap_or_else(|| 
                    format!("Discover the power of {}", context.repository_name)
                ),
                priority: 1,
            },
            ContentSuggestion {
                section_type: "features".to_string(),
                title: "Key Features".to_string(),
                content: "Highlight the main features and capabilities".to_string(),
                priority: 2,
            },
        ]
    }

    fn parse_text_response(&self, text: &str, context: &AnalysisContext) -> AnalysisResponse {
        // Fallback parsing for non-JSON responses
        self.create_fallback_analysis(context)
    }
}