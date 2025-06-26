use crate::terminal_manager::{Terminal, TerminalPosition};
use crate::terminal_manager_v2::TerminalManagerV2;
use crate::ui::watermark;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SpawnTerminalRequest {
    pub working_dir: String,
    pub title: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SendInputRequest {
    pub terminal_id: String,
    pub input: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePositionRequest {
    pub terminal_id: String,
    pub position: TerminalPosition,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SetOpacityRequest {
    pub terminal_id: String,
    pub opacity: f32,
}

pub type TerminalManagerState = Arc<Mutex<TerminalManagerV2>>;

#[tauri::command]
pub async fn spawn_claude_code(
    request: SpawnTerminalRequest,
    manager: State<'_, TerminalManagerState>,
) -> Result<String, String> {
    let working_dir = PathBuf::from(&request.working_dir);
    
    // Validate that the directory exists
    if !working_dir.exists() || !working_dir.is_dir() {
        return Err(format!("Directory does not exist: {}", request.working_dir));
    }

    let manager = manager.lock().await;
    match manager.spawn_claude_code(working_dir, request.title).await {
        Ok(terminal_id) => {
            log::info!("Successfully spawned Claude Code terminal: {}", terminal_id);
            Ok(terminal_id)
        }
        Err(e) => {
            log::error!("Failed to spawn Claude Code terminal: {}", e);
            Err(format!("Failed to spawn terminal: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_terminal(
    terminal_id: String,
    manager: State<'_, TerminalManagerState>,
) -> Result<Option<Terminal>, String> {
    let terminal = {
        let manager = manager.lock().await;
        manager.get_terminal(&terminal_id).await
    };
    Ok(terminal)
}

#[tauri::command]
pub async fn get_all_terminals(
    manager: State<'_, TerminalManagerState>,
) -> Result<Vec<Terminal>, String> {
    let manager = manager.lock().await;
    Ok(manager.get_all_terminals().await)
}

#[tauri::command]
pub async fn send_terminal_input(
    request: SendInputRequest,
    manager: State<'_, TerminalManagerState>,
) -> Result<(), String> {
    let result = {
        let manager = manager.lock().await;
        manager.send_input(&request.terminal_id, &request.input).await
    };
    
    match result {
        Ok(()) => {
            log::info!("Sent input to terminal {}: {}", request.terminal_id, request.input);
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to send input to terminal {}: {}", request.terminal_id, e);
            Err(format!("Failed to send input: {}", e))
        }
    }
}

#[tauri::command]
pub async fn terminate_terminal(
    terminal_id: String,
    manager: State<'_, TerminalManagerState>,
) -> Result<(), String> {
    let result = {
        let manager = manager.lock().await;
        manager.terminate_terminal(&terminal_id).await
    };
    
    match result {
        Ok(()) => {
            log::info!("Successfully terminated terminal: {}", terminal_id);
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to terminate terminal {}: {}", terminal_id, e);
            Err(format!("Failed to terminate terminal: {}", e))
        }
    }
}

#[tauri::command]
pub async fn update_terminal_position(
    request: UpdatePositionRequest,
    manager: State<'_, TerminalManagerState>,
) -> Result<(), String> {
    let result = {
        let manager = manager.lock().await;
        manager.update_terminal_position(&request.terminal_id, request.position).await
    };
    match result {
        Ok(()) => Ok(()),
        Err(e) => Err(format!("Failed to update position: {}", e))
    }
}

#[tauri::command]
pub async fn set_terminal_opacity(
    request: SetOpacityRequest,
    manager: State<'_, TerminalManagerState>,
) -> Result<(), String> {
    let result = {
        let manager = manager.lock().await;
        manager.set_terminal_opacity(&request.terminal_id, request.opacity).await
    };
    match result {
        Ok(()) => Ok(()),
        Err(e) => Err(format!("Failed to set opacity: {}", e))
    }
}

#[tauri::command]
pub async fn get_terminal_count(
    manager: State<'_, TerminalManagerState>,
) -> Result<usize, String> {
    let count = {
        let manager = manager.lock().await;
        manager.get_terminal_count().await
    };
    Ok(count)
}

#[tauri::command]
pub async fn get_active_terminals(
    manager: State<'_, TerminalManagerState>,
) -> Result<Vec<Terminal>, String> {
    let terminals = {
        let manager = manager.lock().await;
        manager.get_active_terminals().await
    };
    Ok(terminals)
}

#[tauri::command]
pub async fn detect_project_type(working_dir: String) -> Result<String, String> {
    let path = PathBuf::from(&working_dir);
    
    if !path.exists() || !path.is_dir() {
        return Err("Directory does not exist".to_string());
    }

    // Check for common project files to determine project type
    let project_type = if path.join("package.json").exists() {
        if path.join("tauri.conf.json").exists() || path.join("src-tauri").exists() {
            "tauri"
        } else if path.join("next.config.js").exists() || path.join("next.config.ts").exists() {
            "nextjs"
        } else {
            "nodejs"
        }
    } else if path.join("Cargo.toml").exists() {
        "rust"
    } else if path.join("pyproject.toml").exists() || path.join("requirements.txt").exists() {
        "python"
    } else if path.join("go.mod").exists() {
        "go"
    } else if path.join("pom.xml").exists() {
        "java"
    } else if path.join("Dockerfile").exists() {
        "docker"
    } else if path.join(".git").exists() {
        "git"
    } else {
        "unknown"
    };

    Ok(project_type.to_string())
}

#[tauri::command]
pub async fn get_project_suggestions(working_dir: String) -> Result<Vec<String>, String> {
    let project_type = detect_project_type(working_dir.clone()).await?;
    
    let suggestions = match project_type.as_str() {
        "tauri" => vec![
            "bun run dev".to_string(),
            "bun run tauri dev".to_string(),
            "bun run build".to_string(),
            "bun run tauri build".to_string(),
        ],
        "nextjs" => vec![
            "npm run dev".to_string(),
            "npm run build".to_string(),
            "npm run start".to_string(),
            "npm run lint".to_string(),
        ],
        "nodejs" => vec![
            "npm install".to_string(),
            "npm run dev".to_string(),
            "npm run build".to_string(),
            "npm test".to_string(),
        ],
        "rust" => vec![
            "cargo run".to_string(),
            "cargo build".to_string(),
            "cargo test".to_string(),
            "cargo build --release".to_string(),
        ],
        "python" => vec![
            "uv sync".to_string(),
            "uv run python main.py".to_string(),
            "uv run pytest".to_string(),
            "uv run ruff check".to_string(),
        ],
        _ => vec![
            "ls -la".to_string(),
            "git status".to_string(),
            "code .".to_string(),
        ],
    };

    Ok(suggestions)
}

#[tauri::command]
pub async fn select_directory() -> Result<Option<String>, String> {
    // TODO: Implement proper file dialog for Tauri v2
    // For now, return a default test directory
    let test_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?
        .to_string_lossy()
        .to_string();
    
    log::info!("Directory selection placeholder: {}", test_dir);
    Ok(Some(test_dir))
}

#[tauri::command]
pub async fn get_claude_md_content(working_dir: String) -> Result<Option<String>, String> {
    let claude_md_path = PathBuf::from(&working_dir).join("CLAUDE.md");
    
    if claude_md_path.exists() {
        match std::fs::read_to_string(&claude_md_path) {
            Ok(content) => Ok(Some(content)),
            Err(e) => Err(format!("Failed to read CLAUDE.md: {}", e)),
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn save_claude_md_content(
    working_dir: String,
    content: String,
) -> Result<(), String> {
    let claude_md_path = PathBuf::from(&working_dir).join("CLAUDE.md");
    
    match std::fs::write(&claude_md_path, content) {
        Ok(()) => {
            log::info!("Successfully saved CLAUDE.md at: {:?}", claude_md_path);
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to save CLAUDE.md: {}", e);
            Err(format!("Failed to save CLAUDE.md: {}", e))
        }
    }
}

#[tauri::command]
pub async fn apply_watermark(app: tauri::AppHandle) -> Result<(), String> {
    match watermark::apply_watermark_to_all_windows(&app).await {
        Ok(()) => {
            log::info!("Watermark applied to all windows");
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to apply watermark: {}", e);
            Err(format!("Failed to apply watermark: {}", e))
        }
    }
}