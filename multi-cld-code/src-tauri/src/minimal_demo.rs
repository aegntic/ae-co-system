// Minimal demo for CCTM terminal grid functionality
use tauri::{Manager, WebviewWindowBuilder, WebviewUrl};
use std::process::Command;

#[tauri::command]
pub fn launch_terminal_grid(app: tauri::AppHandle) -> Result<(), String> {
    // Create controller window
    WebviewWindowBuilder::new(
        &app,
        "controller",
        "/controller.html"
    )
    .title("CCTM Controller")
    .position(10.0, 10.0)
    .inner_size(350.0, 500.0)
    .resizable(false)
    .always_on_top(true)
    .build()
    .map_err(|e| e.to_string())?;

    // Spawn 18 terminal instances
    for i in 0..18 {
        let col = i % 6;
        let row = i / 6;
        let x = 400 + (col * 310);
        let y = 50 + (row * 210);

        let terminal_id = format!("terminal_{}", i);
        
        // Create terminal window
        WebviewWindowBuilder::new(
            &app,
            &terminal_id,
            "/terminal.html"
        )
        .title(&format!("Terminal {}", i + 1))
        .position(x as f64, y as f64)
        .inner_size(300.0, 200.0)
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;

        // Spawn actual system terminal
        spawn_system_terminal(x as i32, y as i32)?;
    }

    Ok(())
}

fn spawn_system_terminal(x: i32, y: i32) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        // Try different terminal emulators
        let terminals = ["alacritty", "kitty", "gnome-terminal", "xterm"];
        
        for terminal in &terminals {
            if Command::new("which").arg(terminal).output().is_ok() {
                let mut cmd = Command::new(terminal);
                
                match *terminal {
                    "alacritty" => {
                        cmd.arg("--position").arg(format!("{},{}", x, y));
                    }
                    "kitty" => {
                        cmd.arg("--override").arg(format!("initial_window_width=300 initial_window_height=200"));
                    }
                    _ => {}
                }
                
                if cmd.spawn().is_ok() {
                    return Ok(());
                }
            }
        }
    }
    
    Err("No terminal emulator found".to_string())
}

#[tauri::command]
pub fn close_all_terminals() -> Result<(), String> {
    // Simple cleanup - in real implementation would track PIDs
    Ok(())
}