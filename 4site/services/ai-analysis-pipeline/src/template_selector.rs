use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateSelection {
    pub template_id: String,
    pub template_name: String,
    pub confidence_score: f32,
    pub reasoning: String,
    pub customization_options: Vec<CustomizationOption>,
    pub alternative_templates: Vec<AlternativeTemplate>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomizationOption {
    pub option_type: String,
    pub option_name: String,
    pub suggested_value: serde_json::Value,
    pub reasoning: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AlternativeTemplate {
    pub template_id: String,
    pub template_name: String,
    pub score: f32,
    pub reason: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateMetadata {
    pub id: String,
    pub name: String,
    pub description: String,
    pub target_projects: Vec<String>,
    pub complexity_range: (f32, f32), // min, max complexity scores
    pub required_features: Vec<String>,
    pub optional_features: Vec<String>,
    pub design_style: String,
    pub color_schemes: Vec<ColorScheme>,
    pub layout_options: Vec<LayoutOption>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColorScheme {
    pub name: String,
    pub primary: String,
    pub secondary: String,
    pub accent: String,
    pub background: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LayoutOption {
    pub name: String,
    pub description: String,
    pub sections: Vec<String>,
    pub best_for: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectAnalysis {
    pub project_type: String,
    pub complexity_score: f32,
    pub primary_language: Option<String>,
    pub tech_stack: Vec<String>,
    pub key_features: Vec<String>,
    pub target_audience: String,
    pub has_demo: bool,
    pub has_api_docs: bool,
    pub has_documentation: bool,
    pub visual_assets_needed: Vec<String>,
}

pub struct TemplateSelector {
    templates: Vec<TemplateMetadata>,
    selection_rules: HashMap<String, f32>,
}

impl TemplateSelector {
    pub fn new() -> Self {
        let templates = Self::initialize_templates();
        let selection_rules = Self::create_selection_rules();
        
        TemplateSelector {
            templates,
            selection_rules,
        }
    }

    fn initialize_templates() -> Vec<TemplateMetadata> {
        vec![
            // Modern Web Application Template
            TemplateMetadata {
                id: "modern-web".to_string(),
                name: "Modern Web Application".to_string(),
                description: "Clean, professional template for web applications with interactive demos".to_string(),
                target_projects: vec!["web-application".to_string(), "saas".to_string(), "startup".to_string()],
                complexity_range: (0.4, 1.0),
                required_features: vec!["hero-section".to_string(), "features".to_string(), "demo".to_string()],
                optional_features: vec!["testimonials".to_string(), "pricing".to_string(), "blog".to_string()],
                design_style: "modern".to_string(),
                color_schemes: vec![
                    ColorScheme {
                        name: "Tech Blue".to_string(),
                        primary: "#3B82F6".to_string(),
                        secondary: "#1E40AF".to_string(),
                        accent: "#F59E0B".to_string(),
                        background: "#FFFFFF".to_string(),
                        text: "#1F2937".to_string(),
                    },
                    ColorScheme {
                        name: "Innovation Purple".to_string(),
                        primary: "#8B5CF6".to_string(),
                        secondary: "#7C3AED".to_string(),
                        accent: "#10B981".to_string(),
                        background: "#FAFAFA".to_string(),
                        text: "#111827".to_string(),
                    }
                ],
                layout_options: vec![
                    LayoutOption {
                        name: "Full Demo".to_string(),
                        description: "Prominent demo section with interactive elements".to_string(),
                        sections: vec!["hero".to_string(), "demo".to_string(), "features".to_string(), "cta".to_string()],
                        best_for: vec!["interactive-apps".to_string(), "tools".to_string()],
                    }
                ],
            },

            // Developer Library Template
            TemplateMetadata {
                id: "developer-library".to_string(),
                name: "Developer Library".to_string(),
                description: "Documentation-focused template for libraries and frameworks".to_string(),
                target_projects: vec!["library".to_string(), "framework".to_string(), "sdk".to_string()],
                complexity_range: (0.3, 0.8),
                required_features: vec!["documentation".to_string(), "api-reference".to_string(), "installation".to_string()],
                optional_features: vec!["examples".to_string(), "playground".to_string(), "community".to_string()],
                design_style: "documentation".to_string(),
                color_schemes: vec![
                    ColorScheme {
                        name: "Code Dark".to_string(),
                        primary: "#2D3748".to_string(),
                        secondary: "#4A5568".to_string(),
                        accent: "#38B2AC".to_string(),
                        background: "#1A202C".to_string(),
                        text: "#E2E8F0".to_string(),
                    }
                ],
                layout_options: vec![
                    LayoutOption {
                        name: "Docs First".to_string(),
                        description: "Prioritizes documentation and code examples".to_string(),
                        sections: vec!["hero".to_string(), "quick-start".to_string(), "docs".to_string(), "api".to_string()],
                        best_for: vec!["libraries".to_string(), "apis".to_string()],
                    }
                ],
            },

            // Technical Showcase Template
            TemplateMetadata {
                id: "technical-showcase".to_string(),
                name: "Technical Showcase".to_string(),
                description: "Advanced template for complex technical projects".to_string(),
                target_projects: vec!["system-tool".to_string(), "research".to_string(), "enterprise".to_string()],
                complexity_range: (0.6, 1.0),
                required_features: vec!["technical-overview".to_string(), "architecture".to_string(), "performance".to_string()],
                optional_features: vec!["benchmarks".to_string(), "research-papers".to_string(), "case-studies".to_string()],
                design_style: "technical".to_string(),
                color_schemes: vec![
                    ColorScheme {
                        name: "Enterprise Gray".to_string(),
                        primary: "#374151".to_string(),
                        secondary: "#6B7280".to_string(),
                        accent: "#F59E0B".to_string(),
                        background: "#F9FAFB".to_string(),
                        text: "#111827".to_string(),
                    }
                ],
                layout_options: vec![
                    LayoutOption {
                        name: "Research Focus".to_string(),
                        description: "Emphasizes technical depth and research aspects".to_string(),
                        sections: vec!["abstract".to_string(), "architecture".to_string(), "results".to_string(), "conclusion".to_string()],
                        best_for: vec!["research".to_string(), "enterprise".to_string()],
                    }
                ],
            },

            // Creative Project Template
            TemplateMetadata {
                id: "creative-project".to_string(),
                name: "Creative Project".to_string(),
                description: "Visual-first template for games, art, and creative projects".to_string(),
                target_projects: vec!["game".to_string(), "art".to_string(), "creative".to_string(), "design".to_string()],
                complexity_range: (0.2, 0.9),
                required_features: vec!["gallery".to_string(), "visual-showcase".to_string(), "story".to_string()],
                optional_features: vec!["video-trailer".to_string(), "download".to_string(), "social-sharing".to_string()],
                design_style: "creative".to_string(),
                color_schemes: vec![
                    ColorScheme {
                        name: "Vibrant Creative".to_string(),
                        primary: "#EC4899".to_string(),
                        secondary: "#BE185D".to_string(),
                        accent: "#F59E0B".to_string(),
                        background: "#FEFBFF".to_string(),
                        text: "#1F2937".to_string(),
                    }
                ],
                layout_options: vec![
                    LayoutOption {
                        name: "Visual Story".to_string(),
                        description: "Image and video-heavy layout telling a visual story".to_string(),
                        sections: vec!["hero-video".to_string(), "gallery".to_string(), "story".to_string(), "download".to_string()],
                        best_for: vec!["games".to_string(), "art".to_string()],
                    }
                ],
            },

            // Startup/Product Template
            TemplateMetadata {
                id: "startup-product".to_string(),
                name: "Startup Product".to_string(),
                description: "Marketing-focused template for startups and products".to_string(),
                target_projects: vec!["startup".to_string(), "product".to_string(), "saas".to_string()],
                complexity_range: (0.3, 0.8),
                required_features: vec!["value-proposition".to_string(), "features".to_string(), "social-proof".to_string()],
                optional_features: vec!["pricing".to_string(), "testimonials".to_string(), "waitlist".to_string()],
                design_style: "marketing".to_string(),
                color_schemes: vec![
                    ColorScheme {
                        name: "Startup Green".to_string(),
                        primary: "#059669".to_string(),
                        secondary: "#047857".to_string(),
                        accent: "#F59E0B".to_string(),
                        background: "#FFFFFF".to_string(),
                        text: "#1F2937".to_string(),
                    }
                ],
                layout_options: vec![
                    LayoutOption {
                        name: "Conversion Focus".to_string(),
                        description: "Optimized for conversions with clear CTAs".to_string(),
                        sections: vec!["hero-cta".to_string(), "benefits".to_string(), "social-proof".to_string(), "final-cta".to_string()],
                        best_for: vec!["saas".to_string(), "products".to_string()],
                    }
                ],
            },

            // Minimal Portfolio Template
            TemplateMetadata {
                id: "minimal-portfolio".to_string(),
                name: "Minimal Portfolio".to_string(),
                description: "Clean, minimalist template for personal projects and portfolios".to_string(),
                target_projects: vec!["personal".to_string(), "portfolio".to_string(), "blog".to_string()],
                complexity_range: (0.1, 0.6),
                required_features: vec!["about".to_string(), "projects".to_string(), "contact".to_string()],
                optional_features: vec!["blog".to_string(), "resume".to_string(), "skills".to_string()],
                design_style: "minimal".to_string(),
                color_schemes: vec![
                    ColorScheme {
                        name: "Minimal Black".to_string(),
                        primary: "#000000".to_string(),
                        secondary: "#404040".to_string(),
                        accent: "#0070F3".to_string(),
                        background: "#FFFFFF".to_string(),
                        text: "#333333".to_string(),
                    }
                ],
                layout_options: vec![
                    LayoutOption {
                        name: "Simple Grid".to_string(),
                        description: "Clean grid layout with plenty of whitespace".to_string(),
                        sections: vec!["intro".to_string(), "projects-grid".to_string(), "about".to_string(), "contact".to_string()],
                        best_for: vec!["personal".to_string(), "portfolio".to_string()],
                    }
                ],
            },
        ]
    }

    fn create_selection_rules() -> HashMap<String, f32> {
        let mut rules = HashMap::new();
        
        // Project type weights
        rules.insert("web-application".to_string(), 1.0);
        rules.insert("library".to_string(), 0.8);
        rules.insert("tool".to_string(), 0.7);
        rules.insert("game".to_string(), 0.9);
        rules.insert("startup".to_string(), 0.9);
        
        // Complexity considerations
        rules.insert("high-complexity".to_string(), 0.8);
        rules.insert("medium-complexity".to_string(), 1.0);
        rules.insert("low-complexity".to_string(), 0.9);
        
        // Feature importance
        rules.insert("has-demo".to_string(), 1.2);
        rules.insert("has-docs".to_string(), 1.1);
        rules.insert("has-api".to_string(), 1.1);
        rules.insert("visual-heavy".to_string(), 1.3);
        
        rules
    }

    pub fn select_template(&self, analysis: &ProjectAnalysis) -> Result<TemplateSelection> {
        let mut scored_templates: Vec<(f32, &TemplateMetadata)> = self.templates
            .iter()
            .map(|template| {
                let score = self.calculate_template_score(template, analysis);
                (score, template)
            })
            .collect();

        // Sort by score (highest first)
        scored_templates.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));

        if let Some((best_score, best_template)) = scored_templates.first() {
            let customization_options = self.generate_customization_options(best_template, analysis);
            let alternative_templates = self.get_alternative_templates(&scored_templates[1..]);
            let reasoning = self.generate_selection_reasoning(best_template, analysis, *best_score);

            Ok(TemplateSelection {
                template_id: best_template.id.clone(),
                template_name: best_template.name.clone(),
                confidence_score: *best_score,
                reasoning,
                customization_options,
                alternative_templates,
            })
        } else {
            Err(anyhow::anyhow!("No suitable template found"))
        }
    }

    fn calculate_template_score(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis) -> f32 {
        let mut score = 0.0;
        
        // Project type matching (40% weight)
        score += self.score_project_type_match(template, analysis) * 0.4;
        
        // Complexity matching (20% weight)
        score += self.score_complexity_match(template, analysis) * 0.2;
        
        // Feature alignment (25% weight)
        score += self.score_feature_alignment(template, analysis) * 0.25;
        
        // Technology stack consideration (15% weight)
        score += self.score_tech_stack_alignment(template, analysis) * 0.15;
        
        score.min(1.0)
    }

    fn score_project_type_match(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis) -> f32 {
        let project_type = &analysis.project_type;
        
        // Direct match
        if template.target_projects.contains(project_type) {
            return 1.0;
        }
        
        // Partial matching
        for target in &template.target_projects {
            if project_type.contains(target) || target.contains(project_type) {
                return 0.8;
            }
        }
        
        // Category-based matching
        match project_type.as_str() {
            "web-application" => {
                if template.target_projects.iter().any(|t| t.contains("web") || t.contains("app")) {
                    0.7
                } else {
                    0.3
                }
            },
            "library" | "framework" => {
                if template.target_projects.contains(&"library".to_string()) {
                    0.9
                } else if template.target_projects.contains(&"developer-tool".to_string()) {
                    0.6
                } else {
                    0.2
                }
            },
            _ => 0.4, // Default moderate score
        }
    }

    fn score_complexity_match(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis) -> f32 {
        let complexity = analysis.complexity_score;
        let (min_complexity, max_complexity) = template.complexity_range;
        
        if complexity >= min_complexity && complexity <= max_complexity {
            1.0 // Perfect fit
        } else if complexity < min_complexity {
            // Template is too complex for project
            let diff = min_complexity - complexity;
            (1.0 - diff * 2.0).max(0.0)
        } else {
            // Template is too simple for project
            let diff = complexity - max_complexity;
            (1.0 - diff * 1.5).max(0.0)
        }
    }

    fn score_feature_alignment(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis) -> f32 {
        let mut score = 0.0;
        let mut total_weight = 0.0;
        
        // Check required features
        for required_feature in &template.required_features {
            let weight = 2.0; // Required features have high weight
            total_weight += weight;
            
            if self.project_supports_feature(required_feature, analysis) {
                score += weight;
            }
        }
        
        // Check optional features (bonus points)
        for optional_feature in &template.optional_features {
            let weight = 0.5; // Optional features have lower weight
            total_weight += weight;
            
            if self.project_supports_feature(optional_feature, analysis) {
                score += weight;
            }
        }
        
        if total_weight > 0.0 {
            score / total_weight
        } else {
            0.5 // Default score
        }
    }

    fn project_supports_feature(&self, feature: &str, analysis: &ProjectAnalysis) -> bool {
        match feature {
            "demo" => analysis.has_demo,
            "documentation" | "docs" => analysis.has_documentation,
            "api-reference" => analysis.has_api_docs,
            "gallery" | "visual-showcase" => {
                analysis.visual_assets_needed.iter().any(|asset| 
                    asset.contains("image") || asset.contains("screenshot")
                )
            },
            "technical-overview" => {
                analysis.project_type.contains("technical") || 
                analysis.complexity_score > 0.6
            },
            "value-proposition" => {
                analysis.project_type.contains("startup") || 
                analysis.project_type.contains("product")
            },
            _ => true, // Default to supported
        }
    }

    fn score_tech_stack_alignment(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis) -> f32 {
        // Score based on how well the template design matches the tech stack
        let tech_score = match analysis.primary_language.as_deref() {
            Some("JavaScript") | Some("TypeScript") => {
                if template.design_style == "modern" { 1.0 } else { 0.7 }
            },
            Some("Python") => {
                if template.design_style == "technical" || template.design_style == "documentation" { 
                    0.9 
                } else { 
                    0.6 
                }
            },
            Some("Rust") | Some("Go") | Some("C++") => {
                if template.design_style == "technical" { 1.0 } else { 0.5 }
            },
            Some("Swift") | Some("Kotlin") => {
                if template.design_style == "modern" || template.design_style == "creative" { 
                    0.8 
                } else { 
                    0.5 
                }
            },
            _ => 0.6, // Default score
        };
        
        tech_score
    }

    fn generate_customization_options(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis) -> Vec<CustomizationOption> {
        let mut options = Vec::new();
        
        // Color scheme selection
        let suggested_color_scheme = self.suggest_color_scheme(template, analysis);
        options.push(CustomizationOption {
            option_type: "color_scheme".to_string(),
            option_name: "Primary Color Scheme".to_string(),
            suggested_value: serde_json::to_value(&suggested_color_scheme).unwrap_or_default(),
            reasoning: self.explain_color_choice(template, analysis),
        });
        
        // Layout option
        if let Some(layout) = template.layout_options.first() {
            options.push(CustomizationOption {
                option_type: "layout".to_string(),
                option_name: "Page Layout".to_string(),
                suggested_value: serde_json::to_value(layout).unwrap_or_default(),
                reasoning: "Best layout for this project type and complexity".to_string(),
            });
        }
        
        // Feature enablement
        if analysis.has_demo {
            options.push(CustomizationOption {
                option_type: "feature".to_string(),
                option_name: "Interactive Demo".to_string(),
                suggested_value: serde_json::json!({"enabled": true, "placement": "prominent"}),
                reasoning: "Project appears to have demo capabilities".to_string(),
            });
        }
        
        // Branding customization
        options.push(CustomizationOption {
            option_type: "branding".to_string(),
            option_name: "Logo Placement".to_string(),
            suggested_value: serde_json::json!({"position": "header", "size": "medium"}),
            reasoning: "Standard logo placement for professional appearance".to_string(),
        });
        
        options
    }

    fn suggest_color_scheme(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis) -> &ColorScheme {
        // Simple logic to pick the first suitable color scheme
        // In a real implementation, this could be more sophisticated
        template.color_schemes.first().unwrap_or(&ColorScheme {
            name: "Default".to_string(),
            primary: "#3B82F6".to_string(),
            secondary: "#1E40AF".to_string(),
            accent: "#F59E0B".to_string(),
            background: "#FFFFFF".to_string(),
            text: "#1F2937".to_string(),
        })
    }

    fn explain_color_choice(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis) -> String {
        match analysis.project_type.as_str() {
            "web-application" => "Professional blue scheme conveys trust and reliability".to_string(),
            "creative" | "game" => "Vibrant colors to showcase creativity and engagement".to_string(),
            "library" | "framework" => "Technical color scheme appropriate for developer tools".to_string(),
            _ => "Balanced color scheme suitable for professional presentation".to_string(),
        }
    }

    fn get_alternative_templates(&self, scored_templates: &[(f32, &TemplateMetadata)]) -> Vec<AlternativeTemplate> {
        scored_templates
            .iter()
            .take(3) // Top 3 alternatives
            .map(|(score, template)| AlternativeTemplate {
                template_id: template.id.clone(),
                template_name: template.name.clone(),
                score: *score,
                reason: format!("Alternative option with {:.1}% compatibility", score * 100.0),
            })
            .collect()
    }

    fn generate_selection_reasoning(&self, template: &TemplateMetadata, analysis: &ProjectAnalysis, score: f32) -> String {
        let mut reasons = Vec::new();
        
        // Project type fit
        if template.target_projects.contains(&analysis.project_type) {
            reasons.push(format!("Perfect match for {} projects", analysis.project_type));
        }
        
        // Complexity fit
        let (min_comp, max_comp) = template.complexity_range;
        if analysis.complexity_score >= min_comp && analysis.complexity_score <= max_comp {
            reasons.push("Appropriate complexity level for your project".to_string());
        }
        
        // Feature support
        if analysis.has_demo && template.required_features.contains(&"demo".to_string()) {
            reasons.push("Excellent support for interactive demos".to_string());
        }
        
        if analysis.has_documentation && template.required_features.contains(&"documentation".to_string()) {
            reasons.push("Strong documentation presentation features".to_string());
        }
        
        // Design style fit
        match template.design_style.as_str() {
            "modern" => reasons.push("Modern design aesthetic matches current trends".to_string()),
            "technical" => reasons.push("Technical design appropriate for complex projects".to_string()),
            "creative" => reasons.push("Creative design showcases visual elements effectively".to_string()),
            _ => {}
        }
        
        let confidence_desc = match score {
            s if s >= 0.9 => "Excellent fit",
            s if s >= 0.7 => "Very good fit", 
            s if s >= 0.5 => "Good fit",
            _ => "Reasonable fit",
        };
        
        format!(
            "{} (confidence: {:.1}%). {}",
            confidence_desc,
            score * 100.0,
            reasons.join(". ")
        )
    }

    pub fn get_template_by_id(&self, template_id: &str) -> Option<&TemplateMetadata> {
        self.templates.iter().find(|t| t.id == template_id)
    }

    pub fn list_all_templates(&self) -> &[TemplateMetadata] {
        &self.templates
    }
}