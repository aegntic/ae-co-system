//! Cross-platform system tray indicator for DailyDoco Pro
//! 
//! Provides visual status indicator and quick controls in the system tray
//! Supports Windows, macOS, and Linux with native look and feel

use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::sync::mpsc;
use serde::{Deserialize, Serialize};

#[cfg(target_os = "windows")]
use windows::Win32::UI::Shell::Shell_NotifyIconW;

#[cfg(target_os = "macos")]
use cocoa::appkit::{NSStatusBar, NSStatusItem};

#[cfg(target_os = "linux")]
use x11::xlib;

use crate::capture::CaptureStatus;
use crate::config::Config;

/// System tray application state
#[derive(Debug, Clone)]
pub struct SystemTrayState {
    pub status: TrayStatus,
    pub capture_active: bool,
    pub processing_queue: usize,
    pub last_activity: String,
    pub cpu_usage: f32,
    pub memory_usage: f32,
}

/// Visual status indicators for the tray icon
#[derive(Debug, Clone, PartialEq)]
pub enum TrayStatus {
    /// Green - actively capturing
    Active,
    /// Yellow - processing video
    Processing,
    /// Blue - idle but ready
    Ready,
    /// Red - error or offline
    Error,
}

impl TrayStatus {
    /// Get the icon path for the current status
    pub fn icon_path(&self) -> &'static str {
        match self {
            TrayStatus::Active => "icons/tray-active.png",
            TrayStatus::Processing => "icons/tray-processing.png", 
            TrayStatus::Ready => "icons/tray-ready.png",
            TrayStatus::Error => "icons/tray-error.png",
        }
    }

    /// Get the status text for tooltips
    pub fn status_text(&self) -> &'static str {
        match self {
            TrayStatus::Active => "DailyDoco Pro - Capturing",
            TrayStatus::Processing => "DailyDoco Pro - Processing",
            TrayStatus::Ready => "DailyDoco Pro - Ready",
            TrayStatus::Error => "DailyDoco Pro - Error",
        }
    }
}

/// Context menu actions
#[derive(Debug, Clone)]
pub enum TrayAction {
    StartCapture,
    StopCapture,
    OpenDashboard,
    OpenSettings,
    ViewProjects,
    ToggleAegnt27,
    ShowNotifications,
    Exit,
}

/// System tray manager
pub struct SystemTrayManager {
    state: Arc<Mutex<SystemTrayState>>,
    action_sender: mpsc::UnboundedSender<TrayAction>,
    config: Config,
    #[cfg(target_os = "windows")]
    hwnd: windows::Win32::Foundation::HWND,
    #[cfg(target_os = "macos")]
    status_item: *mut cocoa::base::id,
    #[cfg(target_os = "linux")]
    display: *mut x11::xlib::Display,
}

impl SystemTrayManager {
    /// Create a new system tray manager
    pub async fn new(config: Config) -> Result<Self, SystemTrayError> {
        let (action_sender, action_receiver) = mpsc::unbounded_channel();
        
        let initial_state = SystemTrayState {
            status: TrayStatus::Ready,
            capture_active: false,
            processing_queue: 0,
            last_activity: "DailyDoco Pro started".to_string(),
            cpu_usage: 0.0,
            memory_usage: 0.0,
        };

        let state = Arc::new(Mutex::new(initial_state));

        #[cfg(target_os = "windows")]
        let hwnd = Self::create_windows_tray(&config)?;
        
        #[cfg(target_os = "macos")]
        let status_item = Self::create_macos_tray(&config)?;
        
        #[cfg(target_os = "linux")]
        let display = Self::create_linux_tray(&config)?;

        let manager = Self {
            state: state.clone(),
            action_sender,
            config,
            #[cfg(target_os = "windows")]
            hwnd,
            #[cfg(target_os = "macos")]
            status_item,
            #[cfg(target_os = "linux")]
            display,
        };

        // Start action handler
        tokio::spawn(Self::handle_actions(state.clone(), action_receiver));

        Ok(manager)
    }

    /// Update the tray status and icon
    pub async fn update_status(&self, new_status: TrayStatus) -> Result<(), SystemTrayError> {
        {
            let mut state = self.state.lock().unwrap();
            state.status = new_status.clone();
        }

        self.update_icon(new_status).await?;
        Ok(())
    }

    /// Update capture metrics
    pub async fn update_metrics(
        &self,
        capture_active: bool,
        processing_queue: usize,
        cpu_usage: f32,
        memory_usage: f32,
    ) -> Result<(), SystemTrayError> {
        {
            let mut state = self.state.lock().unwrap();
            state.capture_active = capture_active;
            state.processing_queue = processing_queue;
            state.cpu_usage = cpu_usage;
            state.memory_usage = memory_usage;
        }

        // Update status based on activity
        let new_status = if processing_queue > 0 {
            TrayStatus::Processing
        } else if capture_active {
            TrayStatus::Active
        } else {
            TrayStatus::Ready
        };

        self.update_status(new_status).await?;
        Ok(())
    }

    /// Show a notification
    pub async fn show_notification(
        &self,
        title: &str,
        message: &str,
        urgent: bool,
    ) -> Result<(), SystemTrayError> {
        #[cfg(target_os = "windows")]
        self.show_windows_notification(title, message, urgent).await?;
        
        #[cfg(target_os = "macos")]
        self.show_macos_notification(title, message, urgent).await?;
        
        #[cfg(target_os = "linux")]
        self.show_linux_notification(title, message, urgent).await?;

        Ok(())
    }

    async fn update_icon(&self, status: TrayStatus) -> Result<(), SystemTrayError> {
        #[cfg(target_os = "windows")]
        self.update_windows_icon(status).await?;
        
        #[cfg(target_os = "macos")]
        self.update_macos_icon(status).await?;
        
        #[cfg(target_os = "linux")]
        self.update_linux_icon(status).await?;

        Ok(())
    }

    async fn handle_actions(
        state: Arc<Mutex<SystemTrayState>>,
        mut receiver: mpsc::UnboundedReceiver<TrayAction>,
    ) {
        while let Some(action) = receiver.recv().await {
            match action {
                TrayAction::StartCapture => {
                    log::info!("Starting capture from system tray");
                    // TODO: Send message to capture engine
                }
                TrayAction::StopCapture => {
                    log::info!("Stopping capture from system tray");
                    // TODO: Send message to capture engine
                }
                TrayAction::OpenDashboard => {
                    log::info!("Opening dashboard from system tray");
                    // TODO: Open web dashboard
                }
                TrayAction::OpenSettings => {
                    log::info!("Opening settings from system tray");
                    // TODO: Open settings window
                }
                TrayAction::ViewProjects => {
                    log::info!("Viewing projects from system tray");
                    // TODO: Open project manager
                }
                TrayAction::ToggleAegnt27 => {
                    log::info!("Toggling aegnt-27 from system tray");
                    // TODO: Toggle aegnt-27 humanization
                }
                TrayAction::ShowNotifications => {
                    log::info!("Showing notifications from system tray");
                    // TODO: Show notification center
                }
                TrayAction::Exit => {
                    log::info!("Exiting DailyDoco from system tray");
                    std::process::exit(0);
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    fn create_windows_tray(config: &Config) -> Result<windows::Win32::Foundation::HWND, SystemTrayError> {
        use windows::Win32::UI::WindowsAndMessaging::*;
        use windows::Win32::Foundation::*;
        
        // Create hidden window for tray messages
        let class_name = windows::core::w!("DailyDocoTray");
        
        let wc = WNDCLASSW {
            lpfnWndProc: Some(Self::windows_wnd_proc),
            hInstance: unsafe { GetModuleHandleW(None) }.unwrap(),
            lpszClassName: class_name,
            ..Default::default()
        };
        
        unsafe {
            RegisterClassW(&wc);
            
            let hwnd = CreateWindowExW(
                WINDOW_EX_STYLE::default(),
                class_name,
                windows::core::w!("DailyDoco Pro Tray"),
                WS_OVERLAPPEDWINDOW,
                0, 0, 0, 0,
                None,
                None,
                GetModuleHandleW(None).unwrap(),
                None,
            )?;
            
            Ok(hwnd)
        }
    }

    #[cfg(target_os = "windows")]
    unsafe extern "system" fn windows_wnd_proc(
        hwnd: windows::Win32::Foundation::HWND,
        msg: u32,
        wparam: windows::Win32::Foundation::WPARAM,
        lparam: windows::Win32::Foundation::LPARAM,
    ) -> windows::Win32::Foundation::LRESULT {
        use windows::Win32::UI::WindowsAndMessaging::*;
        
        match msg {
            WM_USER + 1 => {
                // Tray icon message
                match lparam.0 as u32 {
                    WM_RBUTTONUP => {
                        // Show context menu
                        // TODO: Implement context menu
                    }
                    WM_LBUTTONDBLCLK => {
                        // Double-click action
                        // TODO: Open dashboard
                    }
                    _ => {}
                }
                windows::Win32::Foundation::LRESULT(0)
            }
            _ => DefWindowProcW(hwnd, msg, wparam, lparam),
        }
    }

    #[cfg(target_os = "macos")]
    fn create_macos_tray(config: &Config) -> Result<*mut cocoa::base::id, SystemTrayError> {
        use cocoa::appkit::*;
        use cocoa::base::*;
        use cocoa::foundation::*;
        
        unsafe {
            let status_bar = NSStatusBar::systemStatusBar(nil);
            let status_item = status_bar.statusItemWithLength_(NSStatusItemLength::NSVariableStatusItemLength);
            
            let button = status_item.button();
            let title = NSString::alloc(nil).init_str("📹");
            button.setTitle_(title);
            
            Ok(status_item as *mut id)
        }
    }

    #[cfg(target_os = "linux")]
    fn create_linux_tray(config: &Config) -> Result<*mut x11::xlib::Display, SystemTrayError> {
        use x11::xlib::*;
        
        unsafe {
            let display = XOpenDisplay(std::ptr::null());
            if display.is_null() {
                return Err(SystemTrayError::PlatformError("Failed to open X11 display".to_string()));
            }
            
            // TODO: Implement proper Linux tray icon using freedesktop standards
            Ok(display)
        }
    }

    #[cfg(target_os = "windows")]
    async fn update_windows_icon(&self, status: TrayStatus) -> Result<(), SystemTrayError> {
        // TODO: Update Windows tray icon
        Ok(())
    }

    #[cfg(target_os = "macos")]
    async fn update_macos_icon(&self, status: TrayStatus) -> Result<(), SystemTrayError> {
        // TODO: Update macOS status item
        Ok(())
    }

    #[cfg(target_os = "linux")]
    async fn update_linux_icon(&self, status: TrayStatus) -> Result<(), SystemTrayError> {
        // TODO: Update Linux tray icon
        Ok(())
    }

    #[cfg(target_os = "windows")]
    async fn show_windows_notification(&self, title: &str, message: &str, urgent: bool) -> Result<(), SystemTrayError> {
        // TODO: Show Windows notification
        Ok(())
    }

    #[cfg(target_os = "macos")]
    async fn show_macos_notification(&self, title: &str, message: &str, urgent: bool) -> Result<(), SystemTrayError> {
        // TODO: Show macOS notification
        Ok(())
    }

    #[cfg(target_os = "linux")]
    async fn show_linux_notification(&self, title: &str, message: &str, urgent: bool) -> Result<(), SystemTrayError> {
        // TODO: Show Linux notification using libnotify
        Ok(())
    }
}

/// System tray errors
#[derive(Debug, thiserror::Error)]
pub enum SystemTrayError {
    #[error("Platform-specific error: {0}")]
    PlatformError(String),
    
    #[error("Icon loading error: {0}")]
    IconError(String),
    
    #[error("Notification error: {0}")]
    NotificationError(String),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Live metrics monitoring for the tray
pub struct TrayMetricsMonitor {
    tray_manager: Arc<SystemTrayManager>,
}

impl TrayMetricsMonitor {
    pub fn new(tray_manager: Arc<SystemTrayManager>) -> Self {
        Self { tray_manager }
    }

    /// Start monitoring system metrics
    pub async fn start_monitoring(&self) -> Result<(), SystemTrayError> {
        let tray = self.tray_manager.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(2));
            
            loop {
                interval.tick().await;
                
                // Collect metrics
                let cpu_usage = Self::get_cpu_usage().await;
                let memory_usage = Self::get_memory_usage().await;
                let capture_active = Self::is_capture_active().await;
                let processing_queue = Self::get_processing_queue_length().await;
                
                // Update tray
                if let Err(e) = tray.update_metrics(
                    capture_active,
                    processing_queue,
                    cpu_usage,
                    memory_usage,
                ).await {
                    log::error!("Failed to update tray metrics: {}", e);
                }
                
                // Show notifications for important events
                if cpu_usage > 90.0 {
                    tray.show_notification(
                        "High CPU Usage",
                        &format!("DailyDoco is using {}% CPU", cpu_usage),
                        true,
                    ).await.ok();
                }
            }
        });

        Ok(())
    }

    async fn get_cpu_usage() -> f32 {
        // TODO: Implement cross-platform CPU usage monitoring
        0.0
    }

    async fn get_memory_usage() -> f32 {
        // TODO: Implement memory usage monitoring
        0.0
    }

    async fn is_capture_active() -> bool {
        // TODO: Check capture engine status
        false
    }

    async fn get_processing_queue_length() -> usize {
        // TODO: Check video processing queue
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_tray_status() {
        let status = TrayStatus::Active;
        assert_eq!(status.status_text(), "DailyDoco Pro - Capturing");
        assert_eq!(status.icon_path(), "icons/tray-active.png");
    }

    #[tokio::test]
    async fn test_tray_state() {
        let state = SystemTrayState {
            status: TrayStatus::Processing,
            capture_active: true,
            processing_queue: 2,
            last_activity: "Test activity".to_string(),
            cpu_usage: 15.5,
            memory_usage: 128.0,
        };

        assert_eq!(state.status, TrayStatus::Processing);
        assert!(state.capture_active);
        assert_eq!(state.processing_queue, 2);
    }
}