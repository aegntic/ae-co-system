# Web Automation Tutorial

> Complete guide to building human-like web automation with aegnt-27

## Overview

This tutorial demonstrates how to create sophisticated web automation that mimics human behavior, evades detection systems, and provides natural interactions. We'll build a complete example that automates web browsing, form filling, and content interaction.

## Prerequisites

- Rust 1.70+
- Basic knowledge of web scraping/automation
- Familiarity with async/await patterns

## Project Setup

### Dependencies

Add to your `Cargo.toml`:

```toml
[dependencies]
aegnt27 = { version = "2.7.0", features = ["mouse", "typing", "detection"] }
tokio = { version = "1.0", features = ["full"] }
reqwest = { version = "0.11", features = ["json", "cookies"] }
scraper = "0.18"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
url = "2.4"
thiserror = "1.0"
log = "0.4"
env_logger = "0.10"

# Optional: For browser automation
# headless_chrome = "1.0"
# fantoccini = "0.19"
```

### Project Structure

```
web_automation/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── automation/
│   │   ├── mod.rs
│   │   ├── browser.rs
│   │   ├── forms.rs
│   │   └── navigation.rs
│   ├── detection/
│   │   ├── mod.rs
│   │   └── evasion.rs
│   └── utils/
│       ├── mod.rs
│       └── delays.rs
├── config/
│   └── automation.toml
└── examples/
    └── simple_form.rs
```

## Core Implementation

### Main Automation Engine

```rust
// src/automation/mod.rs
pub mod browser;
pub mod forms;
pub mod navigation;

use aegnt27::prelude::*;
use std::sync::Arc;
use std::time::Duration;

#[derive(Debug)]
pub struct WebAutomationEngine {
    aegnt: Arc<Aegnt27Engine>,
    session: AutomationSession,
}

#[derive(Debug)]
pub struct AutomationSession {
    pub user_agent: String,
    pub session_id: String,
    pub viewport_size: (u32, u32),
    pub cookies: std::collections::HashMap<String, String>,
}

impl WebAutomationEngine {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // Create Aegnt27 engine optimized for web automation
        let aegnt_config = create_web_automation_config();
        let aegnt = Arc::new(Aegnt27Engine::with_config(aegnt_config).await?);
        
        let session = AutomationSession {
            user_agent: generate_realistic_user_agent(),
            session_id: uuid::Uuid::new_v4().to_string(),
            viewport_size: (1920, 1080),
            cookies: std::collections::HashMap::new(),
        };
        
        Ok(Self { aegnt, session })
    }
    
    pub async fn navigate_to(&self, url: &str) -> Result<NavigationResult, AutomationError> {
        log::info!("Navigating to: {}", url);
        
        // Generate human-like navigation delay
        let pre_navigation_delay = self.generate_navigation_delay().await?;
        tokio::time::sleep(pre_navigation_delay).await;
        
        // Validate URL looks human-generated
        let url_validation = self.aegnt.validate_content(url).await?;
        if url_validation.resistance_score() < 0.7 {
            log::warn!("URL may appear programmatic: {}", url);
        }
        
        // Perform navigation with human-like mouse movement
        let navigation_result = self.perform_navigation(url).await?;
        
        // Post-navigation delay to simulate reading/loading time
        let post_navigation_delay = self.generate_reading_delay(&navigation_result.content).await?;
        tokio::time::sleep(post_navigation_delay).await;
        
        Ok(navigation_result)
    }
    
    async fn perform_navigation(&self, url: &str) -> Result<NavigationResult, AutomationError> {
        // Simulate clicking in address bar
        let address_bar_position = Point::new(400, 60);
        let current_position = Point::new(640, 360); // Center of screen
        
        let mouse_path = self.aegnt.generate_natural_mouse_path(current_position, address_bar_position).await?;
        let humanized_movement = self.aegnt.humanize_mouse_movement(mouse_path).await?;
        
        // Execute mouse movement (would integrate with actual browser control)
        self.execute_mouse_movement(&humanized_movement).await;
        
        // Type URL with human-like patterns
        let typing_sequence = self.aegnt.humanize_typing(url).await?;
        self.execute_typing(&typing_sequence).await;
        
        // Simulate pressing Enter
        let enter_keystroke = self.aegnt.humanize_typing("\n").await?;
        self.execute_typing(&enter_keystroke).await;
        
        // Fetch page content (simulate browser loading)
        let content = self.fetch_page_content(url).await?;
        
        Ok(NavigationResult {
            url: url.to_string(),
            content,
            status_code: 200,
            load_time: Duration::from_millis(1500),
        })
    }
}

fn create_web_automation_config() -> Aegnt27Config {
    Aegnt27Config::builder()
        .mouse(MouseConfig {
            movement_speed: 1.1,           // Slightly faster for web interactions
            drift_factor: 0.12,            // Natural imprecision
            micro_movement_intensity: 0.7, // Visible micro-movements
            pause_probability: 0.08,       // Occasional hesitation
            overshoot_correction: true,    // Human-like overshoot
            acceleration_profile: AccelerationProfile::Natural,
            ..Default::default()
        })
        .typing(TypingConfig {
            base_wpm: 65.0,               // Realistic web typing speed
            wpm_variation: 18.0,          // Natural speed variation
            error_rate: 0.025,            // Occasional typos
            correction_delay: Duration::from_millis(250),
            burst_typing_probability: 0.12, // Sometimes type in bursts
            fatigue_factor: 0.03,         // Slight slowdown over time
            rhythm_patterns: vec![
                TypingRhythm::Steady,
                TypingRhythm::Burst,
            ],
            ..Default::default()
        })
        .detection(DetectionConfig {
            authenticity_target: 0.93,    // High authenticity for web automation
            detection_models: vec![
                DetectionModel::GPTZero,
                DetectionModel::Custom("BotDetection".to_string()),
            ],
            validation_strictness: ValidationStrictness::Medium,
            ..Default::default()
        })
        .build()
        .unwrap()
}
```

### Form Automation

```rust
// src/automation/forms.rs
use aegnt27::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct FormField {
    pub name: String,
    pub field_type: FieldType,
    pub value: String,
    pub required: bool,
    pub position: Point,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum FieldType {
    Text,
    Email,
    Password,
    Number,
    TextArea,
    Select,
    Checkbox,
    Radio,
}

pub struct FormAutomation {
    aegnt: Arc<Aegnt27Engine>,
}

impl FormAutomation {
    pub fn new(aegnt: Arc<Aegnt27Engine>) -> Self {
        Self { aegnt }
    }
    
    pub async fn fill_form(&self, fields: &[FormField]) -> Result<(), AutomationError> {
        log::info!("Starting form automation with {} fields", fields.len());
        
        for (index, field) in fields.iter().enumerate() {
            log::debug!("Processing field {}: {} ({})", index + 1, field.name, field.field_type);
            
            // Generate realistic delay between fields
            if index > 0 {
                let field_delay = self.generate_field_transition_delay(field).await?;
                tokio::time::sleep(field_delay).await;
            }
            
            // Fill individual field
            self.fill_field(field).await?;
        }
        
        log::info!("Form automation completed successfully");
        Ok(())
    }
    
    async fn fill_field(&self, field: &FormField) -> Result<(), AutomationError> {
        // Navigate to field with natural mouse movement
        let current_position = self.get_current_mouse_position().await;
        let field_path = self.aegnt.generate_natural_mouse_path(current_position, field.position).await?;
        let humanized_movement = self.aegnt.humanize_mouse_movement(field_path).await?;
        
        // Execute mouse movement
        self.execute_mouse_movement(&humanized_movement).await;
        
        // Click on field
        self.perform_click(field.position).await?;
        
        // Handle field-specific input
        match field.field_type {
            FieldType::Text | FieldType::Email => {
                self.type_text_field(&field.value).await?;
            },
            FieldType::Password => {
                self.type_password_field(&field.value).await?;
            },
            FieldType::TextArea => {
                self.type_textarea_field(&field.value).await?;
            },
            FieldType::Select => {
                self.select_dropdown_option(&field.value).await?;
            },
            FieldType::Checkbox => {
                self.toggle_checkbox(&field.value).await?;
            },
            _ => {
                log::warn!("Field type {:?} not fully implemented", field.field_type);
            }
        }
        
        Ok(())
    }
    
    async fn type_text_field(&self, text: &str) -> Result<(), AutomationError> {
        // Validate text appears human-written
        let validation = self.aegnt.validate_content(text).await?;
        if validation.resistance_score() < 0.8 {
            log::warn!("Text may appear automated: {:.1}% resistance", 
                      validation.resistance_score() * 100.0);
        }
        
        // Clear field first (Ctrl+A, Delete)
        self.clear_field().await?;
        
        // Type with human-like patterns
        let typing_sequence = self.aegnt.humanize_typing(text).await?;
        self.execute_typing(&typing_sequence).await;
        
        Ok(())
    }
    
    async fn type_password_field(&self, password: &str) -> Result<(), AutomationError> {
        // Password typing should be more deliberate
        let password_config = TypingConfig {
            base_wpm: 45.0,               // Slower for passwords
            wpm_variation: 12.0,          // Less variation
            error_rate: 0.01,             // Fewer errors (more careful)
            correction_delay: Duration::from_millis(400), // Longer correction time
            burst_typing_probability: 0.05, // Less burst typing
            ..Default::default()
        };
        
        // Create temporary engine with password-specific config
        let temp_config = Aegnt27Config::builder()
            .typing(password_config)
            .build()?;
        let temp_aegnt = Aegnt27Engine::with_config(temp_config).await?;
        
        let typing_sequence = temp_aegnt.humanize_typing(password).await?;
        self.execute_typing(&typing_sequence).await;
        
        Ok(())
    }
    
    async fn type_textarea_field(&self, text: &str) -> Result<(), AutomationError> {
        // Break long text into paragraphs
        let paragraphs: Vec<&str> = text.split('\n').collect();
        
        for (i, paragraph) in paragraphs.iter().enumerate() {
            if i > 0 {
                // Add natural pause between paragraphs
                let paragraph_delay = Duration::from_millis(500 + rand::random::<u64>() % 1000);
                tokio::time::sleep(paragraph_delay).await;
            }
            
            let typing_sequence = self.aegnt.humanize_typing(paragraph).await?;
            self.execute_typing(&typing_sequence).await;
            
            // Add newline if not last paragraph
            if i < paragraphs.len() - 1 {
                let newline_sequence = self.aegnt.humanize_typing("\n").await?;
                self.execute_typing(&newline_sequence).await;
            }
        }
        
        Ok(())
    }
    
    async fn generate_field_transition_delay(&self, field: &FormField) -> Result<Duration, AutomationError> {
        // Generate realistic delay based on field type and complexity
        let base_delay = match field.field_type {
            FieldType::Text | FieldType::Email => Duration::from_millis(800),
            FieldType::Password => Duration::from_millis(1200), // More time to think about passwords
            FieldType::TextArea => Duration::from_millis(1500), // Longer content needs more thought
            FieldType::Select => Duration::from_millis(600),
            FieldType::Checkbox => Duration::from_millis(400),
            _ => Duration::from_millis(800),
        };
        
        // Add random variation (±50%)
        let variation = (rand::random::<f64>() - 0.5) * 0.5;
        let final_delay = Duration::from_millis(
            (base_delay.as_millis() as f64 * (1.0 + variation)) as u64
        );
        
        Ok(final_delay)
    }
}
```

### Search and Content Interaction

```rust
// src/automation/navigation.rs
use aegnt27::prelude::*;
use scraper::{Html, Selector};

pub struct SearchAutomation {
    aegnt: Arc<Aegnt27Engine>,
    session: AutomationSession,
}

impl SearchAutomation {
    pub fn new(aegnt: Arc<Aegnt27Engine>, session: AutomationSession) -> Self {
        Self { aegnt, session }
    }
    
    pub async fn perform_search(&self, query: &str, search_engine: SearchEngine) -> Result<SearchResult, AutomationError> {
        log::info!("Performing search: '{}' on {:?}", query, search_engine);
        
        // Validate query appears human-written
        let query_validation = self.aegnt.validate_content(query).await?;
        if query_validation.resistance_score() < 0.85 {
            log::warn!("Search query may appear automated: {:.1}% resistance", 
                      query_validation.resistance_score() * 100.0);
        }
        
        // Navigate to search engine
        let search_url = search_engine.get_url();
        self.navigate_to_search_page(&search_url).await?;
        
        // Locate and interact with search box
        let search_box_position = self.find_search_box_position(&search_engine).await?;
        self.interact_with_search_box(search_box_position, query).await?;
        
        // Submit search
        self.submit_search().await?;
        
        // Parse results
        let results = self.parse_search_results().await?;
        
        Ok(SearchResult {
            query: query.to_string(),
            engine: search_engine,
            results,
            search_time: Duration::from_millis(850),
        })
    }
    
    async fn interact_with_search_box(&self, position: Point, query: &str) -> Result<(), AutomationError> {
        // Move mouse to search box with natural movement
        let current_pos = self.get_current_mouse_position().await;
        let search_path = self.aegnt.generate_natural_mouse_path(current_pos, position).await?;
        let humanized_movement = self.aegnt.humanize_mouse_movement(search_path).await?;
        
        self.execute_mouse_movement(&humanized_movement).await;
        
        // Click in search box
        self.perform_click(position).await?;
        
        // Type search query
        let typing_sequence = self.aegnt.humanize_typing(query).await?;
        self.execute_typing(&typing_sequence).await;
        
        Ok(())
    }
    
    pub async fn browse_result(&self, result_url: &str) -> Result<BrowsingResult, AutomationError> {
        log::info!("Browsing search result: {}", result_url);
        
        // Navigate to result
        let navigation_result = self.navigate_to_result(result_url).await?;
        
        // Simulate human reading behavior
        let reading_behavior = self.simulate_reading_behavior(&navigation_result.content).await?;
        
        // Optionally interact with page content
        let interactions = self.perform_page_interactions(&navigation_result.content).await?;
        
        Ok(BrowsingResult {
            url: result_url.to_string(),
            content: navigation_result.content,
            reading_time: reading_behavior.total_time,
            scroll_events: reading_behavior.scroll_events,
            interactions,
        })
    }
    
    async fn simulate_reading_behavior(&self, content: &str) -> Result<ReadingBehavior, AutomationError> {
        let word_count = content.split_whitespace().count();
        
        // Calculate realistic reading time (average 200-250 WPM)
        let reading_wpm = 220.0 + (rand::random::<f64>() - 0.5) * 50.0;
        let base_reading_time = Duration::from_secs((word_count as f64 / reading_wpm * 60.0) as u64);
        
        // Add pauses for complex content
        let complexity_factor = self.assess_content_complexity(content);
        let adjusted_time = Duration::from_millis(
            (base_reading_time.as_millis() as f64 * complexity_factor) as u64
        );
        
        // Generate scroll events
        let scroll_events = self.generate_scroll_events(content.len(), adjusted_time).await?;
        
        // Execute reading simulation
        for scroll_event in &scroll_events {
            tokio::time::sleep(scroll_event.delay).await;
            self.execute_scroll(scroll_event.direction, scroll_event.amount).await;
        }
        
        Ok(ReadingBehavior {
            total_time: adjusted_time,
            scroll_events: scroll_events.len(),
        })
    }
    
    async fn generate_scroll_events(&self, content_length: usize, total_time: Duration) -> Result<Vec<ScrollEvent>, AutomationError> {
        let mut events = Vec::new();
        
        // Estimate number of scroll events based on content length
        let estimated_screens = (content_length / 2000).max(1); // ~2000 chars per screen
        let scroll_count = estimated_screens + rand::random::<usize>() % 3;
        
        let time_per_scroll = total_time / scroll_count as u32;
        
        for i in 0..scroll_count {
            let base_delay = time_per_scroll * i as u32;
            let variation = Duration::from_millis(rand::random::<u64>() % 2000);
            
            events.push(ScrollEvent {
                delay: base_delay + variation,
                direction: ScrollDirection::Down,
                amount: 300 + rand::random::<i32>() % 200, // Variable scroll amounts
            });
        }
        
        Ok(events)
    }
    
    fn assess_content_complexity(&self, content: &str) -> f64 {
        let mut complexity = 1.0;
        
        // Technical content takes longer to read
        let technical_keywords = ["algorithm", "implementation", "configuration", "optimization"];
        for keyword in technical_keywords {
            if content.to_lowercase().contains(keyword) {
                complexity += 0.1;
            }
        }
        
        // Long sentences increase complexity
        let avg_sentence_length = content.split('.').map(|s| s.len()).sum::<usize>() / content.split('.').count().max(1);
        if avg_sentence_length > 100 {
            complexity += 0.2;
        }
        
        complexity.min(2.0) // Cap at 2x normal reading time
    }
}

#[derive(Debug)]
pub enum SearchEngine {
    Google,
    Bing,
    DuckDuckGo,
}

impl SearchEngine {
    fn get_url(&self) -> &'static str {
        match self {
            SearchEngine::Google => "https://www.google.com",
            SearchEngine::Bing => "https://www.bing.com", 
            SearchEngine::DuckDuckGo => "https://duckduckgo.com",
        }
    }
}

#[derive(Debug)]
pub struct SearchResult {
    pub query: String,
    pub engine: SearchEngine,
    pub results: Vec<SearchResultItem>,
    pub search_time: Duration,
}

#[derive(Debug)]
pub struct SearchResultItem {
    pub title: String,
    pub url: String,
    pub snippet: String,
}

#[derive(Debug)]
pub struct ReadingBehavior {
    pub total_time: Duration,
    pub scroll_events: usize,
}

#[derive(Debug)]
pub struct ScrollEvent {
    pub delay: Duration,
    pub direction: ScrollDirection,
    pub amount: i32,
}

#[derive(Debug)]
pub enum ScrollDirection {
    Up,
    Down,
    Left,
    Right,
}
```

### Anti-Detection Measures

```rust
// src/detection/evasion.rs
use aegnt27::prelude::*;
use std::collections::HashMap;

pub struct DetectionEvasion {
    aegnt: Arc<Aegnt27Engine>,
    evasion_strategies: Vec<EvasionStrategy>,
}

#[derive(Debug, Clone)]
pub enum EvasionStrategy {
    RandomizeTimings,
    VaryMousePaths,
    InjectTypos,
    SimulateDistraction,
    ModifyHeaders,
    RotateUserAgents,
}

impl DetectionEvasion {
    pub fn new(aegnt: Arc<Aegnt27Engine>) -> Self {
        Self {
            aegnt,
            evasion_strategies: vec![
                EvasionStrategy::RandomizeTimings,
                EvasionStrategy::VaryMousePaths,
                EvasionStrategy::InjectTypos,
                EvasionStrategy::SimulateDistraction,
            ],
        }
    }
    
    pub async fn apply_evasion_strategies(&self, context: &AutomationContext) -> Result<EvasionResult, AutomationError> {
        let mut applied_strategies = Vec::new();
        
        for strategy in &self.evasion_strategies {
            match strategy {
                EvasionStrategy::RandomizeTimings => {
                    self.apply_timing_randomization(context).await?;
                    applied_strategies.push(strategy.clone());
                },
                EvasionStrategy::VaryMousePaths => {
                    self.apply_path_variation(context).await?;
                    applied_strategies.push(strategy.clone());
                },
                EvasionStrategy::InjectTypos => {
                    if rand::random::<f64>() < 0.15 { // 15% chance
                        self.apply_typo_injection(context).await?;
                        applied_strategies.push(strategy.clone());
                    }
                },
                EvasionStrategy::SimulateDistraction => {
                    if rand::random::<f64>() < 0.08 { // 8% chance
                        self.apply_distraction_simulation(context).await?;
                        applied_strategies.push(strategy.clone());
                    }
                },
                _ => {} // Other strategies handled elsewhere
            }
        }
        
        Ok(EvasionResult {
            applied_strategies,
            effectiveness_score: self.calculate_effectiveness_score(&applied_strategies),
        })
    }
    
    async fn apply_timing_randomization(&self, _context: &AutomationContext) -> Result<(), AutomationError> {
        // Inject random micro-delays
        let delay = Duration::from_millis(50 + rand::random::<u64>() % 200);
        tokio::time::sleep(delay).await;
        
        log::debug!("Applied timing randomization: {}ms", delay.as_millis());
        Ok(())
    }
    
    async fn apply_path_variation(&self, context: &AutomationContext) -> Result<(), AutomationError> {
        // Add slight variation to mouse paths
        if let Some(target) = &context.next_target {
            let current_pos = context.current_mouse_position;
            
            // Create path with extra variation
            let varied_config = MouseConfig {
                bezier_curve_randomness: 0.4, // Higher randomness
                drift_factor: 0.2,
                ..Default::default()
            };
            
            // This would be applied to the next mouse movement
            log::debug!("Path variation applied for target: {:?}", target);
        }
        
        Ok(())
    }
    
    async fn apply_typo_injection(&self, context: &AutomationContext) -> Result<(), AutomationError> {
        // Simulate occasional typos followed by corrections
        if let Some(text) = &context.next_text_input {
            let typo_chance = 0.02; // 2% per character
            
            // This would be integrated into the typing sequence
            log::debug!("Typo injection enabled for text input: {} chars", text.len());
        }
        
        Ok(())
    }
    
    async fn apply_distraction_simulation(&self, _context: &AutomationContext) -> Result<(), AutomationError> {
        // Simulate brief distraction (pause + random mouse movement)
        let distraction_duration = Duration::from_millis(800 + rand::random::<u64>() % 1200);
        
        // Brief pause
        tokio::time::sleep(distraction_duration / 2).await;
        
        // Small random mouse movement
        let current_pos = Point::new(640, 360); // Would get actual position
        let distraction_target = Point::new(
            current_pos.x() + (rand::random::<i32>() % 100 - 50),
            current_pos.y() + (rand::random::<i32>() % 100 - 50),
        );
        
        let distraction_path = self.aegnt.generate_natural_mouse_path(current_pos, distraction_target).await?;
        // Would execute this movement
        
        // Resume with another pause
        tokio::time::sleep(distraction_duration / 2).await;
        
        log::debug!("Applied distraction simulation: {}ms", distraction_duration.as_millis());
        Ok(())
    }
    
    fn calculate_effectiveness_score(&self, strategies: &[EvasionStrategy]) -> f64 {
        // Simple scoring based on number and type of strategies applied
        let mut score = 0.7; // Base score
        
        for strategy in strategies {
            match strategy {
                EvasionStrategy::RandomizeTimings => score += 0.05,
                EvasionStrategy::VaryMousePaths => score += 0.08,
                EvasionStrategy::InjectTypos => score += 0.12,
                EvasionStrategy::SimulateDistraction => score += 0.15,
                _ => score += 0.03,
            }
        }
        
        score.min(0.98) // Cap at 98%
    }
}

#[derive(Debug)]
pub struct AutomationContext {
    pub current_mouse_position: Point,
    pub next_target: Option<Point>,
    pub next_text_input: Option<String>,
    pub session_duration: Duration,
    pub action_count: usize,
}

#[derive(Debug)]
pub struct EvasionResult {
    pub applied_strategies: Vec<EvasionStrategy>,
    pub effectiveness_score: f64,
}
```

## Complete Example: E-commerce Automation

```rust
// examples/ecommerce_automation.rs
use aegnt27::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Product {
    name: String,
    price: f64,
    url: String,
    in_stock: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct PurchaseInfo {
    email: String,
    shipping_address: Address,
    payment_method: PaymentMethod,
}

#[derive(Debug, Serialize, Deserialize)]
struct Address {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
}

#[derive(Debug, Serialize, Deserialize)]
enum PaymentMethod {
    CreditCard {
        number: String,
        expiry: String,
        cvv: String,
    },
    PayPal {
        email: String,
    },
}

async fn automate_product_purchase() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    // Initialize automation engine
    let automation = WebAutomationEngine::new().await?;
    
    // Product to purchase
    let product = Product {
        name: "Wireless Headphones".to_string(),
        price: 99.99,
        url: "https://example-store.com/headphones".to_string(),
        in_stock: true,
    };
    
    // Purchase information
    let purchase_info = PurchaseInfo {
        email: "user@example.com".to_string(),
        shipping_address: Address {
            street: "123 Main St".to_string(),
            city: "Anytown".to_string(),
            state: "CA".to_string(),
            zip: "12345".to_string(),
            country: "US".to_string(),
        },
        payment_method: PaymentMethod::CreditCard {
            number: "4111111111111111".to_string(),
            expiry: "12/25".to_string(),
            cvv: "123".to_string(),
        },
    };
    
    // Execute purchase automation
    let result = execute_purchase_flow(&automation, &product, &purchase_info).await?;
    
    println!("Purchase automation completed: {:?}", result);
    
    Ok(())
}

async fn execute_purchase_flow(
    automation: &WebAutomationEngine,
    product: &Product,
    purchase_info: &PurchaseInfo,
) -> Result<PurchaseResult, Box<dyn std::error::Error>> {
    
    // Step 1: Navigate to product page
    log::info!("Step 1: Navigating to product page");
    let navigation_result = automation.navigate_to(&product.url).await?;
    
    // Step 2: Add to cart with human-like interaction
    log::info!("Step 2: Adding product to cart");
    let add_to_cart_result = add_product_to_cart(automation, product).await?;
    
    // Step 3: Proceed to checkout
    log::info!("Step 3: Proceeding to checkout");
    let checkout_result = proceed_to_checkout(automation).await?;
    
    // Step 4: Fill shipping information
    log::info!("Step 4: Filling shipping information");
    let shipping_result = fill_shipping_form(automation, &purchase_info.shipping_address).await?;
    
    // Step 5: Enter payment information
    log::info!("Step 5: Entering payment information");
    let payment_result = fill_payment_form(automation, &purchase_info.payment_method).await?;
    
    // Step 6: Review and complete purchase
    log::info!("Step 6: Completing purchase");
    let completion_result = complete_purchase(automation).await?;
    
    Ok(PurchaseResult {
        success: true,
        order_id: completion_result.order_id,
        total_time: navigation_result.load_time + checkout_result.duration + completion_result.duration,
    })
}

async fn add_product_to_cart(automation: &WebAutomationEngine, product: &Product) -> Result<AddToCartResult, Box<dyn std::error::Error>> {
    // Simulate finding and clicking "Add to Cart" button
    let add_to_cart_button = Point::new(650, 400); // Example position
    
    // Generate human-like mouse movement to button
    let current_pos = Point::new(400, 300);
    let mouse_path = automation.aegnt.generate_natural_mouse_path(current_pos, add_to_cart_button).await?;
    let humanized_movement = automation.aegnt.humanize_mouse_movement(mouse_path).await?;
    
    // Execute movement and click
    automation.execute_mouse_movement(&humanized_movement).await;
    automation.perform_click(add_to_cart_button).await?;
    
    // Wait for cart update animation
    tokio::time::sleep(Duration::from_millis(1500)).await;
    
    Ok(AddToCartResult {
        success: true,
        cart_count: 1,
    })
}

// Additional helper functions would be implemented similarly...

#[derive(Debug)]
struct PurchaseResult {
    success: bool,
    order_id: String,
    total_time: Duration,
}

#[derive(Debug)]
struct AddToCartResult {
    success: bool,
    cart_count: u32,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    automate_product_purchase().await
}
```

## Testing Your Automation

### Unit Tests

```rust
// tests/automation_tests.rs
use aegnt27::prelude::*;

#[tokio::test]
async fn test_form_field_validation() {
    let aegnt = Aegnt27Engine::builder()
        .enable_typing_humanization()
        .enable_ai_detection_resistance()
        .build()
        .await
        .unwrap();
    
    let test_inputs = vec![
        ("john.doe@example.com", true),  // Valid email
        ("not-an-email", false),        // Invalid email
        ("user@domain.co", true),       // Valid email
    ];
    
    for (input, should_be_valid) in test_inputs {
        let validation = aegnt.validate_content(input).await.unwrap();
        let is_valid = validation.resistance_score() > 0.7;
        assert_eq!(is_valid, should_be_valid, "Input: {}", input);
    }
}

#[tokio::test]
async fn test_typing_patterns() {
    let aegnt = Aegnt27Engine::builder()
        .enable_typing_humanization()
        .build()
        .await
        .unwrap();
    
    let test_text = "This is a test message for typing automation";
    let result = aegnt.humanize_typing(test_text).await.unwrap();
    
    // Verify human-like characteristics
    assert!(result.average_wpm() > 20.0 && result.average_wpm() < 150.0);
    assert!(result.total_duration().as_millis() > 100);
    assert!(!result.keystrokes().is_empty());
}
```

### Integration Tests

```rust
// tests/integration_tests.rs
use std::time::Duration;

#[tokio::test]
async fn test_complete_form_automation() {
    let automation = WebAutomationEngine::new().await.unwrap();
    
    let test_fields = vec![
        FormField {
            name: "email".to_string(),
            field_type: FieldType::Email,
            value: "test@example.com".to_string(),
            required: true,
            position: Point::new(400, 200),
        },
        FormField {
            name: "message".to_string(),
            field_type: FieldType::TextArea,
            value: "This is a test message".to_string(),
            required: false,
            position: Point::new(400, 300),
        },
    ];
    
    let form_automation = FormAutomation::new(automation.aegnt.clone());
    let result = form_automation.fill_form(&test_fields).await;
    
    assert!(result.is_ok());
}
```

## Best Practices

### 1. Realistic Timing
```rust
// Always use variable delays that match human behavior
let reading_delay = Duration::from_millis(
    2000 + (content.len() as u64 * 50) + rand::random::<u64>() % 1000
);
```

### 2. Error Handling
```rust
// Implement graceful fallbacks for automation failures
match automation.fill_form(&fields).await {
    Ok(_) => log::info!("Form filled successfully"),
    Err(e) => {
        log::warn!("Form automation failed: {}", e);
        // Implement manual fallback or retry logic
    }
}
```

### 3. Content Validation
```rust
// Always validate content before submission
let validation = aegnt.validate_content(&form_data).await?;
if validation.resistance_score() < 0.85 {
    // Apply improvements or use alternative content
}
```

### 4. Session Management
```rust
// Maintain realistic session state
struct SessionState {
    start_time: Instant,
    page_views: u32,
    last_interaction: Instant,
    user_agent: String,
}
```

## Conclusion

This tutorial demonstrates how to build sophisticated web automation that:

- **Mimics human behavior** through natural mouse movements and typing patterns
- **Evades detection systems** using aegnt-27's AI resistance capabilities  
- **Handles complex workflows** like form filling and e-commerce transactions
- **Maintains reliability** through proper error handling and testing

The key to successful web automation is balancing speed with authenticity. aegnt-27 provides the tools to create automation that is both efficient and indistinguishable from human behavior.

## Next Steps

- Explore the [Content Generation Tutorial](content_generation.md) for AI content humanization
- Review [Best Practices](../guides/best_practices.md) for production deployment
- Check the [API Reference](../api/README.md) for advanced configuration options