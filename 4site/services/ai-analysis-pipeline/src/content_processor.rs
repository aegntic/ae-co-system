use anyhow::Result;
use pulldown_cmark::{Parser, Options, html};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessedContent {
    pub sections: Vec<ContentSection>,
    pub metadata: ContentMetadata,
    pub seo_data: SeoData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContentSection {
    pub section_type: String,
    pub title: String,
    pub content: String,
    pub html_content: String,
    pub word_count: usize,
    pub reading_time: usize, // in minutes
    pub media_references: Vec<MediaReference>,
    pub code_blocks: Vec<CodeBlock>,
    pub priority: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContentMetadata {
    pub total_word_count: usize,
    pub estimated_reading_time: usize,
    pub complexity_level: String,
    pub primary_topics: Vec<String>,
    pub mentioned_technologies: Vec<String>,
    pub external_links: Vec<ExternalLink>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeoData {
    pub title: String,
    pub description: String,
    pub keywords: Vec<String>,
    pub meta_tags: HashMap<String, String>,
    pub structured_data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaReference {
    pub media_type: String, // "image", "video", "diagram"
    pub url: String,
    pub alt_text: Option<String>,
    pub caption: Option<String>,
    pub position: usize, // position in content
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CodeBlock {
    pub language: Option<String>,
    pub code: String,
    pub line_count: usize,
    pub complexity_score: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExternalLink {
    pub url: String,
    pub title: Option<String>,
    pub domain: String,
    pub link_type: String, // "documentation", "demo", "repository", "website"
}

pub struct ContentProcessor {
    tech_keywords: Vec<String>,
    section_patterns: Vec<SectionPattern>,
}

#[derive(Debug)]
struct SectionPattern {
    pattern: Regex,
    section_type: String,
    priority: i32,
}

impl ContentProcessor {
    pub fn new() -> Self {
        let tech_keywords = vec![
            // Languages
            "JavaScript".to_string(), "TypeScript".to_string(), "Python".to_string(),
            "Rust".to_string(), "Go".to_string(), "Java".to_string(), "C++".to_string(),
            "C#".to_string(), "PHP".to_string(), "Ruby".to_string(), "Swift".to_string(),
            
            // Frameworks
            "React".to_string(), "Vue".to_string(), "Angular".to_string(), "Next.js".to_string(),
            "Express".to_string(), "Django".to_string(), "Flask".to_string(), "FastAPI".to_string(),
            "Spring".to_string(), "Laravel".to_string(), "Rails".to_string(),
            
            // Technologies
            "Docker".to_string(), "Kubernetes".to_string(), "AWS".to_string(), "Azure".to_string(),
            "GCP".to_string(), "PostgreSQL".to_string(), "MongoDB".to_string(), "Redis".to_string(),
            "GraphQL".to_string(), "REST".to_string(), "API".to_string(), "Microservices".to_string(),
            
            // Concepts
            "Machine Learning".to_string(), "AI".to_string(), "Blockchain".to_string(),
            "DevOps".to_string(), "CI/CD".to_string(), "Testing".to_string(),
        ];

        let section_patterns = vec![
            SectionPattern {
                pattern: Regex::new(r"(?i)^#{1,3}\s*(installation|install|setup|getting started)").unwrap(),
                section_type: "installation".to_string(),
                priority: 8,
            },
            SectionPattern {
                pattern: Regex::new(r"(?i)^#{1,3}\s*(usage|example|demo|how to)").unwrap(),
                section_type: "usage".to_string(),
                priority: 9,
            },
            SectionPattern {
                pattern: Regex::new(r"(?i)^#{1,3}\s*(features|capabilities|what it does)").unwrap(),
                section_type: "features".to_string(),
                priority: 10,
            },
            SectionPattern {
                pattern: Regex::new(r"(?i)^#{1,3}\s*(api|reference|documentation)").unwrap(),
                section_type: "api_reference".to_string(),
                priority: 6,
            },
            SectionPattern {
                pattern: Regex::new(r"(?i)^#{1,3}\s*(contributing|contribute|development)").unwrap(),
                section_type: "contributing".to_string(),
                priority: 4,
            },
            SectionPattern {
                pattern: Regex::new(r"(?i)^#{1,3}\s*(license|licensing)").unwrap(),
                section_type: "license".to_string(),
                priority: 2,
            },
            SectionPattern {
                pattern: Regex::new(r"(?i)^#{1,3}\s*(changelog|changes|history)").unwrap(),
                section_type: "changelog".to_string(),
                priority: 3,
            },
            SectionPattern {
                pattern: Regex::new(r"(?i)^#{1,3}\s*(roadmap|future|planned)").unwrap(),
                section_type: "roadmap".to_string(),
                priority: 5,
            },
        ];

        ContentProcessor {
            tech_keywords,
            section_patterns,
        }
    }

    pub fn process_markdown(&self, markdown_content: &str, repository_name: &str) -> Result<ProcessedContent> {
        let sections = self.parse_sections(markdown_content)?;
        let metadata = self.extract_metadata(&sections, markdown_content);
        let seo_data = self.generate_seo_data(&sections, repository_name, &metadata);

        Ok(ProcessedContent {
            sections,
            metadata,
            seo_data,
        })
    }

    fn parse_sections(&self, markdown: &str) -> Result<Vec<ContentSection>> {
        let mut sections = Vec::new();
        let lines: Vec<&str> = markdown.lines().collect();
        let mut current_section: Option<ContentSection> = None;
        let mut current_content = String::new();

        for line in lines {
            if line.starts_with('#') {
                // Save previous section
                if let Some(mut section) = current_section.take() {
                    section.content = current_content.trim().to_string();
                    section.html_content = self.markdown_to_html(&section.content);
                    section.word_count = self.count_words(&section.content);
                    section.reading_time = self.calculate_reading_time(section.word_count);
                    section.media_references = self.extract_media_references(&section.content);
                    section.code_blocks = self.extract_code_blocks(&section.content);
                    sections.push(section);
                }

                // Start new section
                let title = line.trim_start_matches('#').trim().to_string();
                let section_type = self.classify_section(&title, line);
                let priority = self.get_section_priority(&section_type);

                current_section = Some(ContentSection {
                    section_type,
                    title,
                    content: String::new(),
                    html_content: String::new(),
                    word_count: 0,
                    reading_time: 0,
                    media_references: Vec::new(),
                    code_blocks: Vec::new(),
                    priority,
                });

                current_content.clear();
            } else {
                current_content.push_str(line);
                current_content.push('\n');
            }
        }

        // Don't forget the last section
        if let Some(mut section) = current_section {
            section.content = current_content.trim().to_string();
            section.html_content = self.markdown_to_html(&section.content);
            section.word_count = self.count_words(&section.content);
            section.reading_time = self.calculate_reading_time(section.word_count);
            section.media_references = self.extract_media_references(&section.content);
            section.code_blocks = self.extract_code_blocks(&section.content);
            sections.push(section);
        }

        // If no sections found, create a main section
        if sections.is_empty() && !markdown.trim().is_empty() {
            sections.push(ContentSection {
                section_type: "main".to_string(),
                title: "Overview".to_string(),
                content: markdown.to_string(),
                html_content: self.markdown_to_html(markdown),
                word_count: self.count_words(markdown),
                reading_time: self.calculate_reading_time(self.count_words(markdown)),
                media_references: self.extract_media_references(markdown),
                code_blocks: self.extract_code_blocks(markdown),
                priority: 10,
            });
        }

        // Sort sections by priority (descending)
        sections.sort_by(|a, b| b.priority.cmp(&a.priority));

        Ok(sections)
    }

    fn classify_section(&self, title: &str, line: &str) -> String {
        for pattern in &self.section_patterns {
            if pattern.pattern.is_match(line) {
                return pattern.section_type.clone();
            }
        }

        // Fallback classification based on keywords
        let title_lower = title.to_lowercase();
        if title_lower.contains("about") || title_lower.contains("overview") {
            "overview".to_string()
        } else if title_lower.contains("config") || title_lower.contains("settings") {
            "configuration".to_string()
        } else if title_lower.contains("troubleshoot") || title_lower.contains("faq") {
            "troubleshooting".to_string()
        } else {
            "general".to_string()
        }
    }

    fn get_section_priority(&self, section_type: &str) -> i32 {
        match section_type {
            "features" => 10,
            "usage" => 9,
            "installation" => 8,
            "overview" => 7,
            "api_reference" => 6,
            "roadmap" => 5,
            "contributing" => 4,
            "changelog" => 3,
            "license" => 2,
            _ => 5,
        }
    }

    fn markdown_to_html(&self, markdown: &str) -> String {
        let mut options = Options::empty();
        options.insert(Options::ENABLE_STRIKETHROUGH);
        options.insert(Options::ENABLE_TABLES);
        options.insert(Options::ENABLE_FOOTNOTES);
        options.insert(Options::ENABLE_TASKLISTS);

        let parser = Parser::new_ext(markdown, options);
        let mut html_output = String::new();
        html::push_html(&mut html_output, parser);
        html_output
    }

    fn count_words(&self, text: &str) -> usize {
        text.split_whitespace().count()
    }

    fn calculate_reading_time(&self, word_count: usize) -> usize {
        // Average reading speed: 200 words per minute
        (word_count as f32 / 200.0).ceil() as usize
    }

    fn extract_media_references(&self, content: &str) -> Vec<MediaReference> {
        let mut media = Vec::new();
        
        // Extract images
        let img_regex = Regex::new(r"!\[([^\]]*)\]\(([^)]+)\)").unwrap();
        for (i, captures) in img_regex.captures_iter(content).enumerate() {
            if let (Some(alt_match), Some(url_match)) = (captures.get(1), captures.get(2)) {
                media.push(MediaReference {
                    media_type: "image".to_string(),
                    url: url_match.as_str().to_string(),
                    alt_text: Some(alt_match.as_str().to_string()),
                    caption: None,
                    position: i,
                });
            }
        }

        // Extract video links (YouTube, etc.)
        let video_regex = Regex::new(r"https?://(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/\S+").unwrap();
        for (i, url_match) in video_regex.find_iter(content).enumerate() {
            media.push(MediaReference {
                media_type: "video".to_string(),
                url: url_match.as_str().to_string(),
                alt_text: None,
                caption: None,
                position: media.len() + i,
            });
        }

        media
    }

    fn extract_code_blocks(&self, content: &str) -> Vec<CodeBlock> {
        let mut code_blocks = Vec::new();
        
        let code_regex = Regex::new(r"```(\w+)?\n([\s\S]*?)```").unwrap();
        for captures in code_regex.captures_iter(content) {
            let language = captures.get(1).map(|m| m.as_str().to_string());
            if let Some(code_match) = captures.get(2) {
                let code = code_match.as_str().to_string();
                let line_count = code.lines().count();
                let complexity_score = self.calculate_code_complexity(&code, &language);
                
                code_blocks.push(CodeBlock {
                    language,
                    code,
                    line_count,
                    complexity_score,
                });
            }
        }

        code_blocks
    }

    fn calculate_code_complexity(&self, code: &str, language: &Option<String>) -> f32 {
        let mut score = 0.0;
        let lines = code.lines().count();
        
        // Base complexity from line count
        score += (lines as f32).log10() * 0.3;
        
        // Language-specific complexity
        if let Some(lang) = language {
            match lang.to_lowercase().as_str() {
                "javascript" | "typescript" | "python" => score += 0.2,
                "rust" | "c++" | "c" => score += 0.4,
                "assembly" | "haskell" => score += 0.6,
                _ => score += 0.3,
            }
        }
        
        // Complexity indicators
        let complexity_indicators = [
            "async", "await", "Promise", "callback", "recursive", "mutex", "thread",
            "generic", "template", "unsafe", "macro", "reflection",
        ];
        
        for indicator in &complexity_indicators {
            if code.contains(indicator) {
                score += 0.1;
            }
        }
        
        score.min(1.0)
    }

    fn extract_metadata(&self, sections: &[ContentSection], content: &str) -> ContentMetadata {
        let total_word_count: usize = sections.iter().map(|s| s.word_count).sum();
        let estimated_reading_time = self.calculate_reading_time(total_word_count);
        
        let complexity_level = if sections.iter().any(|s| !s.code_blocks.is_empty()) {
            "Technical"
        } else if total_word_count > 2000 {
            "Detailed"
        } else {
            "Simple"
        }.to_string();

        let primary_topics = self.extract_topics(content);
        let mentioned_technologies = self.extract_technologies(content);
        let external_links = self.extract_external_links(content);

        ContentMetadata {
            total_word_count,
            estimated_reading_time,
            complexity_level,
            primary_topics,
            mentioned_technologies,
            external_links,
        }
    }

    fn extract_topics(&self, content: &str) -> Vec<String> {
        let mut topics = Vec::new();
        let content_lower = content.to_lowercase();
        
        let topic_keywords = [
            ("web development", vec!["web", "frontend", "backend", "fullstack"]),
            ("machine learning", vec!["ml", "ai", "neural", "model", "training"]),
            ("data science", vec!["data", "analytics", "visualization", "pandas", "numpy"]),
            ("devops", vec!["deployment", "ci/cd", "docker", "kubernetes", "infrastructure"]),
            ("mobile development", vec!["mobile", "ios", "android", "react native", "flutter"]),
            ("game development", vec!["game", "unity", "unreal", "gamedev", "graphics"]),
        ];

        for (topic, keywords) in &topic_keywords {
            if keywords.iter().any(|keyword| content_lower.contains(keyword)) {
                topics.push(topic.to_string());
            }
        }

        topics
    }

    fn extract_technologies(&self, content: &str) -> Vec<String> {
        let mut technologies = Vec::new();
        
        for tech in &self.tech_keywords {
            if content.contains(tech) {
                technologies.push(tech.clone());
            }
        }

        technologies.sort();
        technologies.dedup();
        technologies
    }

    fn extract_external_links(&self, content: &str) -> Vec<ExternalLink> {
        let mut links = Vec::new();
        
        let link_regex = Regex::new(r"\[([^\]]+)\]\((https?://[^)]+)\)").unwrap();
        for captures in link_regex.captures_iter(content) {
            if let (Some(title_match), Some(url_match)) = (captures.get(1), captures.get(2)) {
                let url = url_match.as_str().to_string();
                let title = title_match.as_str().to_string();
                let domain = self.extract_domain(&url);
                let link_type = self.classify_link_type(&url, &title);
                
                links.push(ExternalLink {
                    url,
                    title: Some(title),
                    domain,
                    link_type,
                });
            }
        }

        links
    }

    fn extract_domain(&self, url: &str) -> String {
        if let Ok(parsed_url) = url::Url::parse(url) {
            parsed_url.host_str().unwrap_or("unknown").to_string()
        } else {
            "unknown".to_string()
        }
    }

    fn classify_link_type(&self, url: &str, title: &str) -> String {
        let url_lower = url.to_lowercase();
        let title_lower = title.to_lowercase();
        
        if url_lower.contains("github.com") || url_lower.contains("gitlab.com") {
            "repository".to_string()
        } else if title_lower.contains("demo") || title_lower.contains("live") {
            "demo".to_string()
        } else if title_lower.contains("doc") || title_lower.contains("documentation") {
            "documentation".to_string()
        } else {
            "website".to_string()
        }
    }

    fn generate_seo_data(&self, sections: &[ContentSection], repository_name: &str, metadata: &ContentMetadata) -> SeoData {
        let title = format!("{} - Professional Project Showcase", repository_name);
        
        let description = if let Some(overview_section) = sections.iter().find(|s| s.section_type == "overview") {
            let content = &overview_section.content;
            if content.len() > 160 {
                format!("{}...", &content[..157])
            } else {
                content.clone()
            }
        } else {
            format!("Discover {}, a cutting-edge project with advanced features and professional implementation.", repository_name)
        };

        let mut keywords = metadata.mentioned_technologies.clone();
        keywords.extend(metadata.primary_topics.clone());
        keywords.push(repository_name.to_string());
        keywords.push("open source".to_string());
        keywords.push("software project".to_string());

        let mut meta_tags = HashMap::new();
        meta_tags.insert("og:title".to_string(), title.clone());
        meta_tags.insert("og:description".to_string(), description.clone());
        meta_tags.insert("og:type".to_string(), "website".to_string());
        meta_tags.insert("twitter:card".to_string(), "summary_large_image".to_string());
        meta_tags.insert("twitter:title".to_string(), title.clone());
        meta_tags.insert("twitter:description".to_string(), description.clone());

        let structured_data = serde_json::json!({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": repository_name,
            "description": description,
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Cross-platform",
            "programmingLanguage": metadata.mentioned_technologies
        });

        SeoData {
            title,
            description,
            keywords,
            meta_tags,
            structured_data,
        }
    }
}