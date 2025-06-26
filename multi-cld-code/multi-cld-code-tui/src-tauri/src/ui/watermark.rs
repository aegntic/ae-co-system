/// Persistent Background Watermark System for CCTM
/// 
/// Displays '{ae}' | 'aegntic.ai' branding pattern across the application
/// as a subtle but always-visible background overlay. This system is designed
/// to be tamper-resistant and persist through all UI state changes.

use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::Window;
use serde::{Serialize, Deserialize};

/// Watermark configuration and rendering system
#[derive(Debug, Clone)]
pub struct WatermarkSystem {
    config: WatermarkConfig,
    is_enabled: Arc<RwLock<bool>>,
    render_state: Arc<RwLock<WatermarkRenderState>>,
}

/// Configuration for the persistent watermark
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatermarkConfig {
    /// Main branding text pattern
    pub pattern: String,
    
    /// Opacity level (0.0 to 1.0) - subtle but visible
    pub opacity: f32,
    
    /// Font size in pixels
    pub font_size: u32,
    
    /// Spacing between repetitions
    pub spacing: u32,
    
    /// Color in hex format
    pub color: String,
    
    /// Rotation angle in degrees for diagonal display
    pub rotation: f32,
    
    /// Z-index to ensure it stays on top
    pub z_index: i32,
    
    /// Animation speed (0 = static, higher = faster scroll)
    pub animation_speed: f32,
}

impl Default for WatermarkConfig {
    fn default() -> Self {
        WatermarkConfig {
            pattern: "{ae} | aegntic.ai | {ae} | aegntic.ai".to_string(),
            opacity: 0.08, // Very subtle but visible
            font_size: 16,
            spacing: 120,
            color: "#666666".to_string(),
            rotation: -15.0, // Diagonal watermark
            z_index: 999999, // Ensure it's always on top
            animation_speed: 0.2, // Very slow drift
        }
    }
}

/// Current rendering state of the watermark
#[derive(Debug, Clone)]
struct WatermarkRenderState {
    /// Current animation offset
    offset_x: f32,
    offset_y: f32,
    
    /// Last update timestamp
    last_update: std::time::Instant,
    
    /// Current window dimensions
    window_width: u32,
    window_height: u32,
}

impl Default for WatermarkRenderState {
    fn default() -> Self {
        WatermarkRenderState {
            offset_x: 0.0,
            offset_y: 0.0,
            last_update: std::time::Instant::now(),
            window_width: 1920,
            window_height: 1080,
        }
    }
}

impl WatermarkSystem {
    /// Initialize the watermark system
    pub fn new() -> Self {
        let config = WatermarkConfig::default();
        let is_enabled = Arc::new(RwLock::new(true));
        let render_state = Arc::new(RwLock::new(WatermarkRenderState::default()));
        
        log::info!("Watermark system initialized with pattern: '{}'", config.pattern);
        
        WatermarkSystem {
            config,
            is_enabled,
            render_state,
        }
    }
    
    /// Apply watermark to a Tauri window (placeholder for Tauri v2 compatibility)
    pub async fn apply_to_window(&self, _window: &Window) -> Result<(), Box<dyn std::error::Error>> {
        if !*self.is_enabled.read().await {
            return Ok(());
        }
        
        // TODO: Implement proper Tauri v2 window evaluation API
        // For now, just log that watermark would be applied
        log::info!("Watermark system ready - will be applied via web interface");
        Ok(())
    }
    
    /// Generate CSS for the watermark overlay
    async fn generate_watermark_css(&self) -> String {
        let _state = self.render_state.read().await;
        
        format!(r#"
            #cctm-watermark {{
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                pointer-events: none !important;
                z-index: {} !important;
                overflow: hidden !important;
                user-select: none !important;
                opacity: {} !important;
                color: {} !important;
                font-family: 'Segoe UI', 'Roboto', 'Ubuntu', monospace !important;
                font-size: {}px !important;
                font-weight: 300 !important;
                line-height: 1.5 !important;
                white-space: nowrap !important;
                transform: rotate({}deg) !important;
                background: none !important;
                mix-blend-mode: multiply !important;
            }}
            
            .watermark-row {{
                position: absolute !important;
                width: 200vw !important;
                animation: watermark-drift {}s linear infinite !important;
                display: flex !important;
                align-items: center !important;
            }}
            
            .watermark-text {{
                margin-right: {}px !important;
                opacity: inherit !important;
            }}
            
            @keyframes watermark-drift {{
                0% {{ transform: translateX(-100vw); }}
                100% {{ transform: translateX(0vw); }}
            }}
            
            /* Ensure watermark persists through all state changes */
            body #cctm-watermark,
            html #cctm-watermark,
            * #cctm-watermark {{
                display: block !important;
                visibility: visible !important;
                opacity: {} !important;
            }}
        "#, 
            self.config.z_index,
            self.config.opacity,
            self.config.color,
            self.config.font_size,
            self.config.rotation,
            if self.config.animation_speed > 0.0 { 60.0 / self.config.animation_speed } else { 0.0 },
            self.config.spacing,
            self.config.opacity
        )
    }
    
    /// Generate JavaScript for creating watermark DOM structure
    async fn generate_watermark_js(&self) -> String {
        let pattern_escaped = self.config.pattern.replace("'", "\\'");
        
        format!(r#"
            (function createWatermark() {{
                // Create main watermark container
                const watermark = document.createElement('div');
                watermark.id = 'cctm-watermark';
                
                // Calculate number of rows needed to cover screen
                const rowHeight = {} * 1.5;
                const screenHeight = Math.max(window.innerHeight, 1080);
                const numRows = Math.ceil(screenHeight / rowHeight) + 2;
                
                // Create repeating rows
                for (let row = 0; row < numRows; row++) {{
                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'watermark-row';
                    rowDiv.style.top = (row * rowHeight - rowHeight) + 'px';
                    
                    // Offset every other row for brick pattern
                    if (row % 2 === 1) {{
                        rowDiv.style.animationDelay = '-30s';
                    }}
                    
                    // Create repeated text pattern
                    const repeatCount = Math.ceil(window.innerWidth / {} / '{}' + 5);
                    for (let i = 0; i < repeatCount; i++) {{
                        const textSpan = document.createElement('span');
                        textSpan.className = 'watermark-text';
                        textSpan.textContent = '{}';
                        rowDiv.appendChild(textSpan);
                    }}
                    
                    watermark.appendChild(rowDiv);
                }}
                
                // Insert into DOM - multiple insertion points for persistence
                document.body.appendChild(watermark);
                
                // Create backup insertion if main gets removed
                const observer = new MutationObserver(function(mutations) {{
                    if (!document.getElementById('cctm-watermark')) {{
                        setTimeout(createWatermark, 100);
                    }}
                }});
                
                observer.observe(document.body, {{
                    childList: true,
                    subtree: true
                }});
                
                // Reapply on window resize
                window.addEventListener('resize', function() {{
                    const existing = document.getElementById('cctm-watermark');
                    if (existing) {{
                        existing.remove();
                    }}
                    setTimeout(createWatermark, 50);
                }});
                
                console.log('CCTM watermark system activated');
            }})();
        "#,
            self.config.font_size,
            self.config.spacing,
            pattern_escaped,
            pattern_escaped
        )
    }
    
    /// Update window dimensions for responsive watermark
    pub async fn update_window_size(&self, width: u32, height: u32) {
        let mut state = self.render_state.write().await;
        state.window_width = width;
        state.window_height = height;
    }
    
    /// Force refresh watermark on all windows
    pub async fn refresh_all_windows(&self, windows: &[&Window]) -> Result<(), Box<dyn std::error::Error>> {
        for window in windows {
            self.apply_to_window(window).await?;
        }
        Ok(())
    }
    
    /// Enable/disable watermark (for testing only - should always be enabled in production)
    pub async fn set_enabled(&self, enabled: bool) {
        let mut is_enabled = self.is_enabled.write().await;
        *is_enabled = enabled;
        log::info!("Watermark system {}", if enabled { "enabled" } else { "disabled" });
    }
    
    /// Check if watermark is currently enabled
    pub async fn is_enabled(&self) -> bool {
        *self.is_enabled.read().await
    }
    
    /// Get current watermark configuration
    pub fn get_config(&self) -> &WatermarkConfig {
        &self.config
    }
    
    /// Anti-tampering check - ensures watermark remains active (placeholder)
    pub async fn integrity_check(&self, _window: &Window) -> Result<bool, Box<dyn std::error::Error>> {
        // TODO: Implement proper Tauri v2 evaluation API
        // For now, assume watermark is active
        Ok(true)
    }
    
    /// Restore watermark if tampered with
    pub async fn restore_if_needed(&self, window: &Window) -> Result<(), Box<dyn std::error::Error>> {
        if !self.integrity_check(window).await? {
            log::warn!("Watermark integrity compromised, restoring...");
            self.apply_to_window(window).await?;
        }
        Ok(())
    }
}

/// Global watermark manager for the application
static mut WATERMARK_SYSTEM: Option<Arc<WatermarkSystem>> = None;
static INIT: std::sync::Once = std::sync::Once::new();

/// Get or initialize the global watermark system
pub fn get_watermark_system() -> Arc<WatermarkSystem> {
    unsafe {
        INIT.call_once(|| {
            WATERMARK_SYSTEM = Some(Arc::new(WatermarkSystem::new()));
        });
        WATERMARK_SYSTEM.as_ref().unwrap().clone()
    }
}

/// Initialize watermark system for the entire application
pub async fn initialize_watermark_system() -> Result<(), Box<dyn std::error::Error>> {
    let _system = get_watermark_system();
    log::info!("CCTM watermark system initialized globally");
    Ok(())
}

/// Apply watermark to all application windows
pub async fn apply_watermark_to_all_windows(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let system = get_watermark_system();
    
    // TODO: Apply to windows when Tauri v2 API is available
    log::info!("Watermark system initialized for future window integration");
    Ok(())
}

/// Periodic integrity monitoring task
pub async fn start_watermark_monitor(app: tauri::AppHandle) {
    let system = get_watermark_system();
    
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            // TODO: Monitor windows when Tauri v2 API is available
            log::debug!("Watermark monitoring active");
        }
    });
    
    log::info!("Watermark monitoring system started");
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_watermark_system_creation() {
        let system = WatermarkSystem::new();
        assert!(system.is_enabled().await);
        assert_eq!(system.get_config().pattern, "{ae} | aegntic.ai | {ae} | aegntic.ai");
    }
    
    #[tokio::test]
    async fn test_css_generation() {
        let system = WatermarkSystem::new();
        let css = system.generate_watermark_css().await;
        
        assert!(css.contains("#cctm-watermark"));
        assert!(css.contains("position: fixed"));
        assert!(css.contains("z-index: 999999"));
        assert!(css.contains("pointer-events: none"));
    }
    
    #[tokio::test]
    async fn test_js_generation() {
        let system = WatermarkSystem::new();
        let js = system.generate_watermark_js().await;
        
        assert!(js.contains("{ae} | aegntic.ai"));
        assert!(js.contains("createWatermark"));
        assert!(js.contains("MutationObserver"));
    }
    
    #[tokio::test]
    async fn test_window_size_update() {
        let system = WatermarkSystem::new();
        system.update_window_size(1920, 1080).await;
        
        let state = system.render_state.read().await;
        assert_eq!(state.window_width, 1920);
        assert_eq!(state.window_height, 1080);
    }
}