// Minimal CCTM launcher for terminal grid demo
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod minimal_demo;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            minimal_demo::launch_terminal_grid,
            minimal_demo::close_all_terminals,
        ])
        .setup(|app| {
            println!("{ae}CCTM - Terminal Grid Demo");
            println!("✨ Launching 18+ terminal grid interface...");
            
            // Auto-launch the grid on startup
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(1));
                if let Err(e) = minimal_demo::launch_terminal_grid(app_handle) {
                    eprintln!("Failed to launch terminal grid: {}", e);
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}