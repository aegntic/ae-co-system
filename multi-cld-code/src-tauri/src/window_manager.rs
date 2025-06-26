use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{Manager, Window, Position, Size, LogicalPosition, LogicalSize};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalInstance {
    pub id: String,
    pub label: String,
    pub position: (i32, i32),
    pub size: (u32, u32),
    pub is_maximized: bool,
    pub grid_index: usize,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GridConfig {
    pub columns: usize,
    pub rows: usize,
    pub tile_width: u32,
    pub tile_height: u32,
    pub gap: u32,
    pub offset_x: u32,
    pub offset_y: u32,
}

impl Default for GridConfig {
    fn default() -> Self {
        Self {
            columns: 6,
            rows: 3,
            tile_width: 300,
            tile_height: 200,
            gap: 10,
            offset_x: 50,
            offset_y: 50,
        }
    }
}

pub struct WindowManager {
    terminals: Arc<Mutex<HashMap<String, TerminalInstance>>>,
    maximized_terminals: Arc<Mutex<Vec<String>>>,
    grid_config: GridConfig,
    next_id: Arc<Mutex<usize>>,
    active_terminal: Arc<Mutex<Option<String>>>,
    terminal_order: Arc<Mutex<Vec<String>>>,
}

impl WindowManager {
    pub fn new() -> Self {
        Self {
            terminals: Arc::new(Mutex::new(HashMap::new())),
            maximized_terminals: Arc::new(Mutex::new(Vec::new())),
            grid_config: GridConfig::default(),
            next_id: Arc::new(Mutex::new(0)),
            active_terminal: Arc::new(Mutex::new(None)),
            terminal_order: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn spawn_terminal_grid(&self, app_handle: &tauri::AppHandle, count: usize) -> Result<(), String> {
        for i in 0..count {
            self.spawn_terminal_at_grid_position(app_handle, i)?;
        }
        Ok(())
    }

    pub fn spawn_terminal_at_grid_position(&self, app_handle: &tauri::AppHandle, grid_index: usize) -> Result<String, String> {
        let mut id_counter = self.next_id.lock().unwrap();
        let terminal_id = format!("terminal-{}", *id_counter);
        *id_counter += 1;

        let (x, y) = self.calculate_grid_position(grid_index);
        
        let terminal = TerminalInstance {
            id: terminal_id.clone(),
            label: format!("Terminal {}", grid_index + 1),
            position: (x, y),
            size: (self.grid_config.tile_width, self.grid_config.tile_height),
            is_maximized: false,
            grid_index,
            is_active: false,
        };

        // Create the terminal window
        let window = tauri::WebviewWindowBuilder::new(
            app_handle,
            &terminal_id,
            "/terminal.html"
        )
        .title(&terminal.label)
        .position(x as f64, y as f64)
        .inner_size(terminal.size.0 as f64, terminal.size.1 as f64)
        .resizable(true)
        .decorations(true)
        .always_on_top(false)
        .visible(true)
        .build()
        .map_err(|e| format!("Failed to create window: {}", e))?;

        // Store terminal instance
        let mut terminals = self.terminals.lock().unwrap();
        terminals.insert(terminal_id.clone(), terminal);
        
        // Add to terminal order
        let mut order = self.terminal_order.lock().unwrap();
        order.push(terminal_id.clone());
        
        // Set as active if it's the first terminal
        let mut active = self.active_terminal.lock().unwrap();
        if active.is_none() {
            *active = Some(terminal_id.clone());
            self.apply_active_glow(&app_handle, &terminal_id).ok();
        }

        Ok(terminal_id)
    }

    pub fn toggle_maximize(&self, app_handle: &tauri::AppHandle, terminal_id: &str) -> Result<(), String> {
        let mut terminals = self.terminals.lock().unwrap();
        let mut maximized = self.maximized_terminals.lock().unwrap();

        if let Some(terminal) = terminals.get_mut(terminal_id) {
            if terminal.is_maximized {
                // Restore to grid position
                terminal.is_maximized = false;
                maximized.retain(|id| id != terminal_id);

                let (x, y) = self.calculate_grid_position(terminal.grid_index);
                terminal.position = (x, y);
                terminal.size = (self.grid_config.tile_width, self.grid_config.tile_height);

                if let Some(window) = app_handle.get_webview_window(terminal_id) {
                    window.set_position(LogicalPosition::new(x, y)).ok();
                    window.set_size(LogicalSize::new(terminal.size.0, terminal.size.1)).ok();
                }
            } else if maximized.len() < 4 {
                // Maximize terminal
                terminal.is_maximized = true;
                maximized.push(terminal_id.to_string());

                // Calculate maximized position
                let (x, y, w, h) = self.calculate_maximized_position(maximized.len() - 1);
                terminal.position = (x, y);
                terminal.size = (w, h);

                if let Some(window) = app_handle.get_webview_window(terminal_id) {
                    window.set_position(LogicalPosition::new(x, y)).ok();
                    window.set_size(LogicalSize::new(w, h)).ok();
                    window.set_focus().ok();
                }
            }
        }

        Ok(())
    }

    fn calculate_grid_position(&self, index: usize) -> (i32, i32) {
        let col = index % self.grid_config.columns;
        let row = index / self.grid_config.columns;
        
        let x = self.grid_config.offset_x + col as u32 * (self.grid_config.tile_width + self.grid_config.gap);
        let y = self.grid_config.offset_y + row as u32 * (self.grid_config.tile_height + self.grid_config.gap);
        
        (x as i32, y as i32)
    }

    fn calculate_maximized_position(&self, index: usize) -> (i32, i32, u32, u32) {
        // Arrange maximized windows in a 2x2 grid
        let positions = [
            (100, 100, 800, 600),    // Top-left
            (950, 100, 800, 600),    // Top-right
            (100, 750, 800, 600),    // Bottom-left
            (950, 750, 800, 600),    // Bottom-right
        ];
        
        positions.get(index).copied().unwrap_or(positions[0])
    }

    pub fn create_controller_window(&self, app_handle: &tauri::AppHandle) -> Result<(), String> {
        tauri::WebviewWindowBuilder::new(
            app_handle,
            "controller",
            "/controller.html"
        )
        .title("CCTM Controller")
        .position(10.0, 10.0)
        .inner_size(350.0, 500.0)
        .resizable(false)
        .always_on_top(true)
        .decorations(true)
        .visible(true)
        .build()
        .map_err(|e| format!("Failed to create controller window: {}", e))?;

        Ok(())
    }

    pub fn get_terminal_info(&self) -> Vec<TerminalInstance> {
        let terminals = self.terminals.lock().unwrap();
        terminals.values().cloned().collect()
    }

    pub fn close_terminal(&self, app_handle: &tauri::AppHandle, terminal_id: &str) -> Result<(), String> {
        let mut terminals = self.terminals.lock().unwrap();
        let mut maximized = self.maximized_terminals.lock().unwrap();
        let mut order = self.terminal_order.lock().unwrap();
        let mut active = self.active_terminal.lock().unwrap();

        if terminals.remove(terminal_id).is_some() {
            maximized.retain(|id| id != terminal_id);
            order.retain(|id| id != terminal_id);
            
            // If this was the active terminal, set a new one
            if active.as_ref() == Some(&terminal_id.to_string()) {
                *active = order.first().cloned();
                if let Some(new_active) = active.as_ref() {
                    self.apply_active_glow(app_handle, new_active).ok();
                }
            }
            
            if let Some(window) = app_handle.get_webview_window(terminal_id) {
                window.close().ok();
            }
        }

        Ok(())
    }

    pub fn snap_to_grid(&self, app_handle: &tauri::AppHandle, terminal_id: &str, x: i32, y: i32) -> Result<(), String> {
        let grid_size = 50;
        let snapped_x = (x / grid_size) * grid_size;
        let snapped_y = (y / grid_size) * grid_size;

        if let Some(window) = app_handle.get_webview_window(terminal_id) {
            window.set_position(LogicalPosition::new(snapped_x, snapped_y)).ok();
        }

        let mut terminals = self.terminals.lock().unwrap();
        if let Some(terminal) = terminals.get_mut(terminal_id) {
            terminal.position = (snapped_x, snapped_y);
        }

        Ok(())
    }

    pub fn cycle_active_terminal(&self, app_handle: &tauri::AppHandle) -> Result<(), String> {
        let order = self.terminal_order.lock().unwrap();
        if order.is_empty() {
            return Ok(());
        }

        let mut active = self.active_terminal.lock().unwrap();
        let current_idx = active.as_ref()
            .and_then(|id| order.iter().position(|x| x == id))
            .unwrap_or(0);

        let next_idx = (current_idx + 1) % order.len();
        let next_id = order[next_idx].clone();

        // Remove glow from current active
        if let Some(current_id) = active.as_ref() {
            self.remove_active_glow(app_handle, current_id).ok();
        }

        // Set new active and apply glow
        *active = Some(next_id.clone());
        self.apply_active_glow(app_handle, &next_id).ok();

        // Focus the window
        if let Some(window) = app_handle.get_webview_window(&next_id) {
            window.set_focus().ok();
        }

        // Update terminal states
        let mut terminals = self.terminals.lock().unwrap();
        for (id, terminal) in terminals.iter_mut() {
            terminal.is_active = id == &next_id;
        }

        Ok(())
    }

    pub fn set_active_terminal(&self, app_handle: &tauri::AppHandle, terminal_id: &str) -> Result<(), String> {
        let mut active = self.active_terminal.lock().unwrap();
        
        // Remove glow from current active
        if let Some(current_id) = active.as_ref() {
            if current_id != terminal_id {
                self.remove_active_glow(app_handle, current_id).ok();
            }
        }

        // Set new active and apply glow
        *active = Some(terminal_id.to_string());
        self.apply_active_glow(app_handle, terminal_id).ok();

        // Update terminal states
        let mut terminals = self.terminals.lock().unwrap();
        for (id, terminal) in terminals.iter_mut() {
            terminal.is_active = id == terminal_id;
        }

        Ok(())
    }

    fn apply_active_glow(&self, app_handle: &tauri::AppHandle, terminal_id: &str) -> Result<(), String> {
        if let Some(window) = app_handle.get_webview_window(terminal_id) {
            // Inject CSS for neon glow effect
            let glow_script = r#"
                if (!document.getElementById('active-glow-style')) {
                    const style = document.createElement('style');
                    style.id = 'active-glow-style';
                    style.textContent = `
                        body {
                            box-shadow: 
                                0 0 20px #00ff00,
                                0 0 40px #00ff00,
                                0 0 60px #00ff00,
                                0 0 80px #00ff00,
                                inset 0 0 20px rgba(0, 255, 0, 0.2);
                            animation: pulse-glow 2s ease-in-out infinite;
                        }
                        
                        @keyframes pulse-glow {
                            0%, 100% {
                                box-shadow: 
                                    0 0 20px #00ff00,
                                    0 0 40px #00ff00,
                                    0 0 60px #00ff00,
                                    0 0 80px #00ff00,
                                    inset 0 0 20px rgba(0, 255, 0, 0.2);
                            }
                            50% {
                                box-shadow: 
                                    0 0 30px #00ff00,
                                    0 0 60px #00ff00,
                                    0 0 90px #00ff00,
                                    0 0 120px #00ff00,
                                    inset 0 0 30px rgba(0, 255, 0, 0.3);
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }
            "#;
            
            window.eval(&glow_script).ok();
        }
        Ok(())
    }

    fn remove_active_glow(&self, app_handle: &tauri::AppHandle, terminal_id: &str) -> Result<(), String> {
        if let Some(window) = app_handle.get_webview_window(terminal_id) {
            let remove_script = r#"
                const style = document.getElementById('active-glow-style');
                if (style) {
                    style.remove();
                }
            "#;
            
            window.eval(&remove_script).ok();
        }
        Ok(())
    }
}

// Tauri commands to expose to frontend
#[tauri::command]
pub fn spawn_terminals(count: usize, state: tauri::State<Arc<WindowManager>>, app_handle: tauri::AppHandle) -> Result<(), String> {
    state.spawn_terminal_grid(&app_handle, count)
}

#[tauri::command]
pub fn toggle_terminal_maximize(terminal_id: String, state: tauri::State<Arc<WindowManager>>, app_handle: tauri::AppHandle) -> Result<(), String> {
    state.toggle_maximize(&app_handle, &terminal_id)
}

#[tauri::command]
pub fn get_terminals_info(state: tauri::State<Arc<WindowManager>>) -> Vec<TerminalInstance> {
    state.get_terminal_info()
}

#[tauri::command]
pub fn close_terminal(terminal_id: String, state: tauri::State<Arc<WindowManager>>, app_handle: tauri::AppHandle) -> Result<(), String> {
    state.close_terminal(&app_handle, &terminal_id)
}

#[tauri::command]
pub fn cycle_active_terminal(state: tauri::State<Arc<WindowManager>>, app_handle: tauri::AppHandle) -> Result<(), String> {
    state.cycle_active_terminal(&app_handle)
}

#[tauri::command]
pub fn set_active_terminal(terminal_id: String, state: tauri::State<Arc<WindowManager>>, app_handle: tauri::AppHandle) -> Result<(), String> {
    state.set_active_terminal(&app_handle, &terminal_id)
}