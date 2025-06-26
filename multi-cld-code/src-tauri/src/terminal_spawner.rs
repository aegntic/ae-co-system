use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tauri::Window;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalProcess {
    pub id: String,
    pub pid: Option<u32>,
    pub terminal_emulator: String,
    pub working_directory: String,
}

pub struct TerminalSpawner {
    processes: Arc<Mutex<HashMap<String, TerminalProcess>>>,
    terminal_emulator: String,
}

impl TerminalSpawner {
    pub fn new() -> Self {
        // Detect available terminal emulator
        let terminal_emulator = Self::detect_terminal_emulator();
        
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
            terminal_emulator,
        }
    }

    fn detect_terminal_emulator() -> String {
        // Try common terminal emulators in order of preference
        let terminals = vec![
            ("alacritty", vec![]),
            ("kitty", vec![]),
            ("gnome-terminal", vec!["--"]),
            ("konsole", vec!["-e"]),
            ("xfce4-terminal", vec!["-e"]),
            ("terminator", vec!["-e"]),
            ("xterm", vec!["-e"]),
        ];

        for (term, _args) in terminals {
            if Command::new("which")
                .arg(term)
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
            {
                return term.to_string();
            }
        }

        // Default to xterm as fallback
        "xterm".to_string()
    }

    pub fn spawn_terminal(&self, 
        terminal_id: &str, 
        window_id: Option<String>,
        position: Option<(i32, i32)>,
        size: Option<(u32, u32)>
    ) -> Result<u32, String> {
        let mut cmd = Command::new(&self.terminal_emulator);

        // Configure terminal based on emulator
        match self.terminal_emulator.as_str() {
            "alacritty" => {
                cmd.arg("--title").arg(format!("CCTM Terminal {}", terminal_id));
                
                if let Some((x, y)) = position {
                    cmd.arg("--position").arg(format!("{},{}", x, y));
                }
                
                if let Some((w, h)) = size {
                    cmd.arg("--dimensions").arg(format!("{} {}", w / 10, h / 20)); // Convert to columns/lines
                }

                // Embed window if possible
                if let Some(wid) = window_id {
                    cmd.arg("--embed").arg(wid);
                }
            },
            "kitty" => {
                cmd.arg("--title").arg(format!("CCTM Terminal {}", terminal_id));
                
                if let Some((w, h)) = size {
                    cmd.arg("--override").arg(format!("initial_window_width={}", w));
                    cmd.arg("--override").arg(format!("initial_window_height={}", h));
                }
            },
            "gnome-terminal" => {
                cmd.arg("--title").arg(format!("CCTM Terminal {}", terminal_id));
                
                if let Some((w, h)) = size {
                    cmd.arg("--geometry").arg(format!("{}x{}", w / 10, h / 20));
                }
            },
            "xterm" => {
                cmd.arg("-T").arg(format!("CCTM Terminal {}", terminal_id));
                
                if let Some((w, h)) = size {
                    cmd.arg("-geometry").arg(format!("{}x{}", w / 10, h / 20));
                }
            },
            _ => {}
        }

        // Spawn the terminal
        let child = cmd
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to spawn terminal: {}", e))?;

        let pid = child.id();

        // Store process info
        let process = TerminalProcess {
            id: terminal_id.to_string(),
            pid: Some(pid),
            terminal_emulator: self.terminal_emulator.clone(),
            working_directory: std::env::current_dir()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
        };

        let mut processes = self.processes.lock().unwrap();
        processes.insert(terminal_id.to_string(), process);

        Ok(pid)
    }

    pub fn spawn_embedded_terminal(&self, parent_window: &Window, terminal_id: &str) -> Result<(), String> {
        // Get window handle for embedding
        #[cfg(target_os = "linux")]
        {
            // TODO: Update for Tauri v2 platform-specific window access
            // For now, spawn as separate window
            self.spawn_terminal(terminal_id, None, None, None)?;
        }

        #[cfg(target_os = "windows")]
        {
            // Windows embedding would use HWND
            return Err("Windows terminal embedding not yet implemented".to_string());
        }

        #[cfg(target_os = "macos")]
        {
            // macOS would use NSView
            return Err("macOS terminal embedding not yet implemented".to_string());
        }

        Ok(())
    }

    pub fn close_terminal(&self, terminal_id: &str) -> Result<(), String> {
        let mut processes = self.processes.lock().unwrap();
        
        if let Some(process) = processes.remove(terminal_id) {
            if let Some(pid) = process.pid {
                // Send SIGTERM to terminal process
                #[cfg(unix)]
                {
                    use nix::sys::signal::{kill, Signal};
                    use nix::unistd::Pid;
                    
                    kill(Pid::from_raw(pid as i32), Signal::SIGTERM)
                        .map_err(|e| format!("Failed to kill terminal: {}", e))?;
                }
                
                #[cfg(windows)]
                {
                    // Windows process termination
                    use winapi::um::processthreadsapi::TerminateProcess;
                    use winapi::um::processthreadsapi::OpenProcess;
                    use winapi::um::winnt::PROCESS_TERMINATE;
                    
                    unsafe {
                        let handle = OpenProcess(PROCESS_TERMINATE, 0, pid);
                        if !handle.is_null() {
                            TerminateProcess(handle, 0);
                        }
                    }
                }
            }
        }
        
        Ok(())
    }

    pub fn get_terminal_emulator(&self) -> String {
        self.terminal_emulator.clone()
    }
}

// Tauri commands
#[tauri::command]
pub fn spawn_system_terminal(
    terminal_id: String, 
    position: Option<(i32, i32)>,
    size: Option<(u32, u32)>,
    state: tauri::State<Arc<TerminalSpawner>>
) -> Result<u32, String> {
    state.spawn_terminal(&terminal_id, None, position, size)
}

#[tauri::command]
pub fn close_system_terminal(
    terminal_id: String,
    state: tauri::State<Arc<TerminalSpawner>>
) -> Result<(), String> {
    state.close_terminal(&terminal_id)
}

#[tauri::command]
pub fn get_terminal_emulator(state: tauri::State<Arc<TerminalSpawner>>) -> String {
    state.get_terminal_emulator()
}