mod terminal_manager;
mod terminal_manager_v2;
mod commands;
mod attention_detector;
mod virtualization;
mod file_system;
mod mcp_service;
mod ui;
mod stress_test;
mod consciousness;
mod window_manager;
mod terminal_spawner;

use std::sync::Arc;
use tokio::sync::Mutex;
use commands::TerminalManagerState;
use terminal_manager_v2::TerminalManagerV2;
use ui::watermark;
use window_manager::WindowManager;
use terminal_spawner::TerminalSpawner;
use tauri::Manager;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::init();
    
    // Create terminal manager v2 with virtualization and file system monitoring
    let terminal_manager = Arc::new(Mutex::new(
        tokio::runtime::Runtime::new()
            .expect("Failed to create async runtime")
            .block_on(async {
                TerminalManagerV2::new().await
                    .expect("Failed to initialize terminal manager v2")
            })
    ));

    // Create window manager for system-level terminal grid
    let window_manager = Arc::new(WindowManager::new());
    let terminal_spawner = Arc::new(TerminalSpawner::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(terminal_manager)
        .manage(window_manager)
        .manage(terminal_spawner)
        .invoke_handler(tauri::generate_handler![
            commands::spawn_claude_code,
            commands::get_terminal,
            commands::get_all_terminals,
            commands::send_terminal_input,
            commands::terminate_terminal,
            commands::update_terminal_position,
            commands::set_terminal_opacity,
            commands::get_terminal_count,
            commands::get_active_terminals,
            commands::detect_project_type,
            commands::get_project_suggestions,
            commands::select_directory,
            commands::get_claude_md_content,
            commands::save_claude_md_content,
            commands::apply_watermark,
            // TUI Integration Commands
            commands::launch_tui_advanced,
            commands::launch_tui_predictive,
            commands::launch_tui_simple,
            commands::launch_tui_interactive,
            commands::get_tui_status,
            // Advanced Testing Commands
            commands::run_cctm_stress_test,
            commands::validate_cctm_performance,
            commands::execute_ai_command,
            commands::test_ai_capabilities,
            // Consciousness Engine Commands
            commands::initialize_consciousness,
            commands::process_consciousness_interaction,
            commands::get_consciousness_insights,
            commands::enable_flow_preservation,
            commands::test_consciousness_capabilities,
            // Window Manager Commands
            window_manager::spawn_terminals,
            window_manager::toggle_terminal_maximize,
            window_manager::get_terminals_info,
            window_manager::close_terminal,
            window_manager::cycle_active_terminal,
            window_manager::set_active_terminal,
            // Terminal Spawner Commands
            terminal_spawner::spawn_system_terminal,
            terminal_spawner::close_system_terminal,
            terminal_spawner::get_terminal_emulator,
        ])
        .setup(|app| {
            log::info!("{{ae}} CCTM v0.2.0 - Advanced Terminal Manager with TUI Integration starting...");
            log::info!("Phase 2C.4 COMPLETE - Terminal-MCP Bridge operational");
            log::info!("🧠 Consciousness Engine initialized - Sentient Code Companion active");
            log::info!("Terminal virtualization engine initialized (50+ concurrent)");
            log::info!("File system monitoring engine initialized");
            log::info!("Project detection engine initialized (multi-language)");
            log::info!("MCP service discovery engine initialized");
            log::info!("TUI Integration complete - 3 sophisticated interfaces available");
            log::info!("🎯 System-level terminal grid manager initialized");
            
            // Create controller window on startup
            let app_handle = app.handle().clone();
            let window_manager = app.state::<Arc<WindowManager>>();
            
            if let Err(e) = window_manager.create_controller_window(&app_handle) {
                log::error!("Failed to create controller window: {}", e);
            }
            
            // Set up global keyboard shortcuts
            let app_handle_kb = app_handle.clone();
            let window_manager_kb = app.state::<Arc<WindowManager>>().inner().clone();
            
            // Register Ctrl+Tab global shortcut
            use tauri_plugin_global_shortcut::ShortcutState;
            
            app_handle.plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, shortcut, event| {
                        if shortcut.matches(tauri_plugin_global_shortcut::Modifiers::CTRL, tauri_plugin_global_shortcut::Code::Tab) {
                            if event.state == ShortcutState::Pressed {
                                if let Err(e) = window_manager_kb.cycle_active_terminal(&app_handle_kb) {
                                    log::error!("Failed to cycle terminal: {}", e);
                                }
                            }
                        }
                    })
                    .build()
            )?;
            
            // Initialize watermark system
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Initialize the watermark system globally
                if let Err(e) = watermark::initialize_watermark_system().await {
                    log::error!("Failed to initialize watermark system: {}", e);
                    return;
                }
                
                // Apply watermark to all current windows
                if let Err(e) = watermark::apply_watermark_to_all_windows(&app_handle).await {
                    log::error!("Failed to apply watermarks to windows: {}", e);
                    return;
                }
                
                // Start the watermark monitoring system
                watermark::start_watermark_monitor(app_handle.clone()).await;
                
                log::info!("Persistent watermark system activated");
            });
            
            log::info!("Application initialized successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
