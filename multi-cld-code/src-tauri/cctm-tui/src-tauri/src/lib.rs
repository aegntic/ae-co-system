mod terminal_manager;
mod terminal_manager_v2;
mod commands;
mod attention_detector;
mod virtualization;
mod file_system;
mod mcp_service;
mod ui;

use std::sync::Arc;
use tokio::sync::Mutex;
use commands::TerminalManagerState;
use terminal_manager_v2::TerminalManagerV2;
use ui::watermark;

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

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .manage(terminal_manager)
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
        ])
        .setup(|app| {
            log::info!("CCTM Phase 2C - Claude Code Terminal Manager with MCP Service Integration starting...");
            log::info!("Terminal virtualization engine initialized");
            log::info!("File system monitoring engine initialized");
            log::info!("Project detection engine initialized");
            log::info!("MCP service discovery engine initialized");
            
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
