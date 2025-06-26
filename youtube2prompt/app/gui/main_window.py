import os
import sys
import threading
import time
from typing import Optional, List, Dict, Any

from PySide6.QtCore import Qt, QSize, Signal, Slot, QTimer, QThread, QSettings, QPoint
from PySide6.QtGui import QIcon, QAction, QColor, QPalette, QFont, QPixmap
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QLineEdit, QComboBox, QTextEdit, QProgressBar, QSystemTrayIcon,
    QMenu, QTabWidget, QScrollArea, QFrame, QSlider, QSplitter, QToolBar,
    QToolButton, QCheckBox, QGroupBox, QFileDialog, QMessageBox, QSpacerItem,
    QSizePolicy, QListWidget, QListWidgetItem, QToolTip, QStatusBar
)
import qtawesome as qta
from plyer import notification

# Import our application modules
from app.video_processor import VideoProcessor
from app.batch_processor import BatchProcessor
from app.prompt_generator import PromptGenerator
from app.utils import is_valid_youtube_url, get_available_prompt_types, format_seconds_to_time

# Default styles
DARK_PALETTE = {
    "window": "#1E1E1E",
    "window_text": "#FFFFFF",
    "base": "#2D2D30",
    "alternate_base": "#3C3C3C",
    "text": "#FFFFFF",
    "button": "#0078D7",
    "button_text": "#FFFFFF",
    "bright_text": "#FFFFFF",
    "link": "#4D9DE0",
    "highlight": "#0078D7",
    "highlight_text": "#FFFFFF",
    "accent": "#0078D7",
    "border": "#3C3C3C",
    "toolTip_base": "#3C3C3C",
    "toolTip_text": "#FFFFFF",
    "placeholder_text": "#A0A0A0",
    "input_text": "#E0E0E0"
}

class NotificationWorker(QThread):
    """Background worker for sending notifications"""
    def __init__(self, title: str, message: str, parent=None):
        super().__init__(parent)
        self.title = title
        self.message = message
        
    def run(self):
        notification.notify(
            title=self.title,
            message=self.message,
            app_name="YouTube Video Prompt Generator",
            timeout=5
        )

class VideoProcessingWorker(QThread):
    """Background worker for video processing"""
    progress_update = Signal(int, str)
    processing_complete = Signal(dict)
    processing_error = Signal(str)
    
    def __init__(self, urls: List[str], is_batch: bool = False, max_workers: int = 3, parent=None):
        super().__init__(parent)
        self.urls = urls
        self.is_batch = is_batch
        self.max_workers = max_workers
    
    def run(self):
        try:
            if self.is_batch:
                # Process multiple videos
                self.progress_update.emit(10, "Initializing batch processor...")
                batch_processor = BatchProcessor(max_workers=self.max_workers)
                
                # Process videos
                self.progress_update.emit(20, f"Processing {len(self.urls)} videos...")
                batch_data = batch_processor.process_videos(self.urls)
                
                # Check results
                summary = batch_data["processing_summary"]
                if summary["successful"] == 0:
                    self.processing_error.emit(f"Failed to process any of the {len(self.urls)} videos.")
                    return
                
                self.progress_update.emit(100, f"Processed {summary['successful']} of {summary['total_videos']} videos successfully.")
                self.processing_complete.emit(batch_data)
            else:
                # Process single video
                self.progress_update.emit(20, "Initializing video processor...")
                video_processor = VideoProcessor()
                
                # Process video
                self.progress_update.emit(50, "Processing video...")
                video_data = video_processor.process_video(self.urls[0])
                
                self.progress_update.emit(100, "Video processed successfully!")
                self.processing_complete.emit(video_data)
        
        except Exception as e:
            self.processing_error.emit(str(e))

class PromptGenerationWorker(QThread):
    """Background worker for prompt generation"""
    progress_update = Signal(int, str)
    generation_complete = Signal(dict)
    generation_error = Signal(str)
    
    def __init__(self, video_data: Dict[str, Any], api_key: str, model: str, prompt_type: str, is_batch: bool = False, parent=None):
        super().__init__(parent)
        self.video_data = video_data
        self.api_key = api_key
        self.model = model
        self.prompt_type = prompt_type
        self.is_batch = is_batch
    
    def run(self):
        try:
            self.progress_update.emit(20, "Initializing prompt generator...")
            prompt_generator = PromptGenerator(api_key=self.api_key, model=self.model)
            
            self.progress_update.emit(50, f"Generating {self.prompt_type} prompt...")
            prompt_data = prompt_generator.generate_prompt(
                self.video_data, 
                prompt_type=self.prompt_type, 
                is_batch=self.is_batch
            )
            
            self.progress_update.emit(90, "Saving prompt...")
            output_path = prompt_generator.save_prompt(prompt_data)
            prompt_data["saved_path"] = output_path
            
            self.progress_update.emit(100, "Prompt generated successfully!")
            self.generation_complete.emit(prompt_data)
        
        except Exception as e:
            self.generation_error.emit(str(e))

class MainWindow(QMainWindow):
    """Main application window"""
    def __init__(self):
        super().__init__()
        
        # Load settings
        self.settings = QSettings("YTPromptGenerator", "YouTubeVideoPromptGenerator")
        
        # Initialize variables
        self.video_data = None
        self.is_batch = False
        self.prompt_data = None
        self.api_key = None
        
        # Setup UI
        self._setup_window()
        self._setup_system_tray()
        self._setup_ui()
        self._load_settings()
        
        # Show the window
        self.show()
    
    def _setup_window(self):
        """Setup the main window properties"""
        self.setWindowTitle("YouTube Video Prompt Generator")
        self.setWindowIcon(QIcon(self._get_icon_path("app")))
        self.setMinimumSize(900, 700)
        
        # Setup dark theme
        self._set_dark_theme()
        
        # Load window geometry
        geometry = self.settings.value("geometry")
        if geometry:
            self.restoreGeometry(geometry)
    
    def _setup_system_tray(self):
        """Setup system tray icon and menu"""
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon(self._get_icon_path("app")))
        self.tray_icon.setToolTip("YouTube Video Prompt Generator")
        
        # Create tray menu
        tray_menu = QMenu()
        
        # Add actions
        show_action = QAction("Show", self)
        show_action.triggered.connect(self.show)
        show_action.triggered.connect(self.activateWindow)
        
        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(QApplication.quit)
        
        tray_menu.addAction(show_action)
        tray_menu.addSeparator()
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self._tray_icon_activated)
        
        # Show the tray icon
        self.tray_icon.show()
    
    def _setup_ui(self):
        """Setup the user interface"""
        # Create central widget and main layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)
        
        # Create toolbar with opacity slider
        toolbar = QToolBar("Main Toolbar")
        toolbar.setMovable(False)
        toolbar.setIconSize(QSize(24, 24))
        toolbar.setStyleSheet("QToolBar { border: 0px; }")
        
        # Opacity control
        opacity_widget = QWidget()
        opacity_layout = QHBoxLayout(opacity_widget)
        opacity_layout.setContentsMargins(0, 0, 0, 0)
        
        opacity_label = QLabel("Opacity:")
        self.opacity_slider = QSlider(Qt.Horizontal)
        self.opacity_slider.setRange(20, 100)
        self.opacity_slider.setValue(100)
        self.opacity_slider.setFixedWidth(100)
        self.opacity_slider.valueChanged.connect(self._change_opacity)
        
        opacity_layout.addWidget(opacity_label)
        opacity_layout.addWidget(self.opacity_slider)
        
        opacity_action = toolbar.addWidget(opacity_widget)
        
        # Settings button
        settings_btn = QToolButton()
        settings_btn.setIcon(qta.icon('fa5s.cog'))
        settings_btn.setToolTip("Settings")
        settings_btn.clicked.connect(self._show_settings)
        
        toolbar.addSeparator()
        toolbar.addWidget(settings_btn)
        
        self.addToolBar(toolbar)
        
        # Create tabs
        self.tabs = QTabWidget()
        main_layout.addWidget(self.tabs)
        
        # Input tab
        input_tab = QWidget()
        self.tabs.addTab(input_tab, "Input")
        
        input_layout = QVBoxLayout(input_tab)
        input_layout.setSpacing(15)
        
        # Mode selector
        mode_group = QGroupBox("Processing Mode")
        mode_layout = QHBoxLayout(mode_group)
        
        self.single_mode_radio = QCheckBox("Single Video")
        self.batch_mode_radio = QCheckBox("Multiple Videos")
        self.single_mode_radio.setChecked(True)
        
        # Connect mode radio buttons
        self.single_mode_radio.clicked.connect(lambda: self._toggle_mode(False))
        self.batch_mode_radio.clicked.connect(lambda: self._toggle_mode(True))
        
        mode_layout.addWidget(self.single_mode_radio)
        mode_layout.addWidget(self.batch_mode_radio)
        
        input_layout.addWidget(mode_group)
        
        # Single video input
        self.single_input_widget = QWidget()
        single_input_layout = QVBoxLayout(self.single_input_widget)
        single_input_layout.setContentsMargins(0, 0, 0, 0)
        
        url_label = QLabel("Enter YouTube URL:")
        url_label.setAlignment(Qt.AlignLeft)
        
        self.url_input = QLineEdit()
        self.url_input.setPlaceholderText("https://www.youtube.com/watch?v=...")
        
        single_input_layout.addWidget(url_label)
        single_input_layout.addWidget(self.url_input)
        
        input_layout.addWidget(self.single_input_widget)
        
        # Batch video input
        self.batch_input_widget = QWidget()
        batch_input_layout = QVBoxLayout(self.batch_input_widget)
        batch_input_layout.setContentsMargins(0, 0, 0, 0)
        
        urls_label = QLabel("Enter YouTube URLs (one per line):")
        urls_label.setAlignment(Qt.AlignLeft)
        
        self.urls_input = QTextEdit()
        self.urls_input.setPlaceholderText("https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=...")
        self.urls_input.setMinimumHeight(100)
        
        workers_layout = QHBoxLayout()
        workers_label = QLabel("Concurrent workers:")
        self.workers_input = QSlider(Qt.Horizontal)
        self.workers_input.setRange(1, 5)
        self.workers_input.setValue(3)
        self.workers_value_label = QLabel("3")
        
        self.workers_input.valueChanged.connect(lambda v: self.workers_value_label.setText(str(v)))
        
        workers_layout.addWidget(workers_label)
        workers_layout.addWidget(self.workers_input)
        workers_layout.addWidget(self.workers_value_label)
        
        batch_input_layout.addWidget(urls_label)
        batch_input_layout.addWidget(self.urls_input)
        batch_input_layout.addLayout(workers_layout)
        
        # Initially hide batch input
        self.batch_input_widget.hide()
        input_layout.addWidget(self.batch_input_widget)
        
        # API and model config
        config_group = QGroupBox("Configuration")
        config_layout = QVBoxLayout(config_group)
        
        # API Key input
        api_layout = QHBoxLayout()
        api_label = QLabel("OpenRouter API Key:")
        self.api_key_input = QLineEdit()
        self.api_key_input.setPlaceholderText("Enter your OpenRouter API key")
        self.api_key_input.setEchoMode(QLineEdit.Password)
        
        api_layout.addWidget(api_label)
        api_layout.addWidget(self.api_key_input)
        
        # Model selector
        model_layout = QHBoxLayout()
        model_label = QLabel("Model:")
        self.model_selector = QComboBox()
        self.model_selector.addItems([
            "openai/gpt-4", 
            "openai/gpt-3.5-turbo", 
            "anthropic/claude-3-opus", 
            "anthropic/claude-3-sonnet",
            "anthropic/claude-3-haiku",
            "google/gemini-pro",
            "meta-llama/llama-3-70b-instruct",
            "meta-llama/llama-3-8b-instruct",
            "mistralai/mistral-7b-instruct"
        ])
        
        model_layout.addWidget(model_label)
        model_layout.addWidget(self.model_selector)
        
        # Prompt type selector
        prompt_layout = QHBoxLayout()
        prompt_label = QLabel("Prompt Type:")
        self.prompt_type_selector = QComboBox()
        self.prompt_type_selector.addItems(get_available_prompt_types())
        
        prompt_layout.addWidget(prompt_label)
        prompt_layout.addWidget(self.prompt_type_selector)
        
        # Add them to config layout
        config_layout.addLayout(api_layout)
        config_layout.addLayout(model_layout)
        config_layout.addLayout(prompt_layout)
        
        input_layout.addWidget(config_group)
        
        # Process button
        self.process_btn = QPushButton("Process Video")
        self.process_btn.setMinimumHeight(40)
        self.process_btn.clicked.connect(self._process_video)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(True)
        self.progress_bar.setFormat("%p% %v")
        self.progress_bar.hide()
        
        # Status label
        self.status_label = QLabel("")
        self.status_label.setWordWrap(True)
        self.status_label.hide()
        
        input_layout.addWidget(self.process_btn)
        input_layout.addWidget(self.progress_bar)
        input_layout.addWidget(self.status_label)
        input_layout.addStretch()
        
        # Results tab
        results_tab = QWidget()
        self.tabs.addTab(results_tab, "Results")
        
        results_layout = QVBoxLayout(results_tab)
        
        # Video details section
        self.video_details_widget = QWidget()
        video_details_layout = QVBoxLayout(self.video_details_widget)
        
        self.video_details_title = QLabel("No Video Processed Yet")
        self.video_details_title.setStyleSheet("font-size: 18px; font-weight: bold;")
        
        self.video_details_info = QLabel("Process a video to see details")
        self.video_details_info.setWordWrap(True)
        
        video_details_layout.addWidget(self.video_details_title)
        video_details_layout.addWidget(self.video_details_info)
        
        # Transcript preview
        self.transcript_group = QGroupBox("Transcript Preview")
        transcript_layout = QVBoxLayout(self.transcript_group)
        
        self.transcript_preview = QTextEdit()
        self.transcript_preview.setReadOnly(True)
        self.transcript_preview.setPlaceholderText("No transcript available")
        
        transcript_layout.addWidget(self.transcript_preview)
        
        # Generate prompt section
        generate_group = QGroupBox("Generate Prompt")
        generate_layout = QVBoxLayout(generate_group)
        
        self.generate_btn = QPushButton("Generate Prompt")
        self.generate_btn.setMinimumHeight(40)
        self.generate_btn.clicked.connect(self._generate_prompt)
        self.generate_btn.setEnabled(False)
        
        generate_layout.addWidget(self.generate_btn)
        
        # Add to results layout
        results_layout.addWidget(self.video_details_widget)
        results_layout.addWidget(self.transcript_group)
        results_layout.addWidget(generate_group)
        
        # Prompt tab
        prompt_tab = QWidget()
        self.tabs.addTab(prompt_tab, "Prompt")
        
        prompt_layout = QVBoxLayout(prompt_tab)
        
        # Prompt display
        self.prompt_display = QTextEdit()
        self.prompt_display.setReadOnly(True)
        self.prompt_display.setPlaceholderText("No prompt generated yet. Process a video and click 'Generate Prompt'.")
        
        # Export buttons
        export_layout = QHBoxLayout()
        
        self.copy_prompt_btn = QPushButton("Copy to Clipboard")
        self.copy_prompt_btn.clicked.connect(self._copy_prompt)
        self.copy_prompt_btn.setEnabled(False)
        
        self.export_txt_btn = QPushButton("Export as Text")
        self.export_txt_btn.clicked.connect(lambda: self._export_prompt("txt"))
        self.export_txt_btn.setEnabled(False)
        
        self.export_json_btn = QPushButton("Export as JSON")
        self.export_json_btn.clicked.connect(lambda: self._export_prompt("json"))
        self.export_json_btn.setEnabled(False)
        
        export_layout.addWidget(self.copy_prompt_btn)
        export_layout.addWidget(self.export_txt_btn)
        export_layout.addWidget(self.export_json_btn)
        
        prompt_layout.addWidget(self.prompt_display)
        prompt_layout.addLayout(export_layout)
        
        # Set up status bar
        self.statusBar().showMessage("Ready")
    
    def _toggle_mode(self, is_batch: bool):
        """Toggle between single and batch mode"""
        if is_batch:
            self.single_mode_radio.setChecked(False)
            self.batch_mode_radio.setChecked(True)
            self.single_input_widget.hide()
            self.batch_input_widget.show()
            self.process_btn.setText("Process Videos")
        else:
            self.single_mode_radio.setChecked(True)
            self.batch_mode_radio.setChecked(False)
            self.single_input_widget.show()
            self.batch_input_widget.hide()
            self.process_btn.setText("Process Video")
        
        self.is_batch = is_batch
    
    def _process_video(self):
        """Process the video(s) from input"""
        # Get API key
        api_key = self.api_key_input.text().strip()
        if not api_key:
            QMessageBox.warning(self, "API Key Required", "Please enter your OpenRouter API key.")
            return
        
        # Save API key for later
        self.api_key = api_key
        self.settings.setValue("api_key", api_key)
        
        # Get URLs based on mode
        if self.is_batch:
            # Batch mode
            urls_text = self.urls_input.toPlainText().strip()
            if not urls_text:
                QMessageBox.warning(self, "URLs Required", "Please enter at least one YouTube URL.")
                return
            
            # Parse URLs
            urls = [url.strip() for url in urls_text.split('\n') if url.strip()]
            
            # Validate URLs
            invalid_urls = [url for url in urls if not is_valid_youtube_url(url)]
            if invalid_urls:
                error_msg = f"Found {len(invalid_urls)} invalid YouTube URLs:\n"
                for i, url in enumerate(invalid_urls[:5]):
                    error_msg += f"- {url}\n"
                if len(invalid_urls) > 5:
                    error_msg += f"... and {len(invalid_urls) - 5} more"
                
                QMessageBox.warning(self, "Invalid URLs", error_msg)
                return
            
            # Get number of workers
            max_workers = self.workers_input.value()
            
        else:
            # Single mode
            url = self.url_input.text().strip()
            if not url:
                QMessageBox.warning(self, "URL Required", "Please enter a YouTube URL.")
                return
            
            # Validate URL
            if not is_valid_youtube_url(url):
                QMessageBox.warning(self, "Invalid URL", f"The URL you entered is not a valid YouTube URL:\n{url}")
                return
            
            urls = [url]
            max_workers = 1
        
        # Setup progress display
        self.progress_bar.setValue(0)
        self.progress_bar.show()
        self.status_label.setText("Initializing...")
        self.status_label.show()
        self.process_btn.setEnabled(False)
        
        # Start processing in background
        self.processing_worker = VideoProcessingWorker(urls, self.is_batch, max_workers)
        self.processing_worker.progress_update.connect(self._update_progress)
        self.processing_worker.processing_complete.connect(self._processing_complete)
        self.processing_worker.processing_error.connect(self._processing_error)
        self.processing_worker.start()
    
    def _update_progress(self, value: int, message: str):
        """Update progress bar and status"""
        self.progress_bar.setValue(value)
        self.status_label.setText(message)
        self.statusBar().showMessage(message)
    
    def _processing_complete(self, video_data: Dict[str, Any]):
        """Handle completion of video processing"""
        # Store the video data
        self.video_data = video_data
        
        # Update UI
        self.process_btn.setEnabled(True)
        self.generate_btn.setEnabled(True)
        
        # Show success notification
        if self.isHidden():
            worker = NotificationWorker(
                "Processing Complete",
                f"Successfully processed {len(video_data.get('combined_metadata', {}).get('videos', [1]))} videos" if self.is_batch else "Video processed successfully"
            )
            worker.start()
        
        # Switch to results tab
        self.tabs.setCurrentIndex(1)
        
        # Update results tab
        self._update_results_view()
    
    def _processing_error(self, error_message: str):
        """Handle video processing error"""
        # Update UI
        self.progress_bar.hide()
        self.status_label.setText(f"Error: {error_message}")
        self.process_btn.setEnabled(True)
        
        # Show error notification
        if self.isHidden():
            worker = NotificationWorker("Processing Error", error_message)
            worker.start()
        
        # Show error dialog
        QMessageBox.critical(self, "Processing Error", f"An error occurred during video processing:\n{error_message}")
    
    def _update_results_view(self):
        """Update the results view with video data"""
        if not self.video_data:
            return
        
        if self.is_batch:
            # Batch mode - show combined data
            combined_metadata = self.video_data["combined_metadata"]
            
            # Update title and info
            self.video_details_title.setText(combined_metadata["title"])
            
            info_text = f"Total Videos: {combined_metadata['total_videos']}\n"
            info_text += f"Total Duration: {format_seconds_to_time(combined_metadata['total_length_seconds'])}\n"
            info_text += f"Authors: {', '.join(combined_metadata['authors'])}\n\n"
            
            # Add individual video info
            info_text += "Videos:\n"
            for i, video in enumerate(combined_metadata["videos"]):
                info_text += f"{i+1}. {video['title']} by {video['author']} ({format_seconds_to_time(video['length'])})\n"
            
            self.video_details_info.setText(info_text)
            
            # Show transcript preview
            if self.video_data.get("combined_transcript"):
                combined_transcript = self.video_data.get("combined_transcript", "")
                # Truncate if too long
                preview_length = min(5000, len(combined_transcript))
                preview_text = combined_transcript[:preview_length]
                if preview_length < len(combined_transcript):
                    preview_text += "\n\n[...transcript truncated...]\n"
                
                self.transcript_preview.setText(preview_text)
            else:
                self.transcript_preview.setText("No transcripts available for these videos.")
        
        else:
            # Single video mode
            metadata = self.video_data["metadata"]
            
            # Update title and info
            self.video_details_title.setText(metadata["title"])
            
            info_text = f"Author: {metadata['author']}\n"
            info_text += f"Duration: {format_seconds_to_time(metadata['length'])}\n"
            info_text += f"Views: {metadata.get('views', 0):,}\n"
            if metadata.get('publish_date'):
                info_text += f"Published: {metadata['publish_date'][:10] if metadata['publish_date'] else 'Unknown'}\n"
            info_text += f"URL: {metadata['url']}\n"
            
            self.video_details_info.setText(info_text)
            
            # Show transcript preview
            if self.video_data.get("transcript_text"):
                transcript_text = self.video_data.get("transcript_text", "")
                # Truncate if too long
                preview_length = min(5000, len(transcript_text))
                preview_text = transcript_text[:preview_length]
                if preview_length < len(transcript_text):
                    preview_text += "\n\n[...transcript truncated...]\n"
                
                self.transcript_preview.setText(preview_text)
            else:
                self.transcript_preview.setText("No transcript available for this video.")
    
    def _generate_prompt(self):
        """Generate a prompt from the processed video"""
        if not self.video_data:
            QMessageBox.warning(self, "No Data", "Please process a video first.")
            return
        
        # Get API key
        api_key = self.api_key_input.text().strip()
        if not api_key:
            QMessageBox.warning(self, "API Key Required", "Please enter your OpenRouter API key.")
            return
        
        # Get model and prompt type
        model = self.model_selector.currentText()
        prompt_type = self.prompt_type_selector.currentText()
        
        # Setup progress display
        self.progress_bar.setValue(0)
        self.progress_bar.show()
        self.status_label.setText("Initializing prompt generation...")
        self.status_label.show()
        self.generate_btn.setEnabled(False)
        
        # Start generation in background
        self.generation_worker = PromptGenerationWorker(
            self.video_data, api_key, model, prompt_type, self.is_batch
        )
        self.generation_worker.progress_update.connect(self._update_progress)
        self.generation_worker.generation_complete.connect(self._generation_complete)
        self.generation_worker.generation_error.connect(self._generation_error)
        self.generation_worker.start()
    
    def _generation_complete(self, prompt_data: Dict[str, Any]):
        """Handle completion of prompt generation"""
        # Store the prompt data
        self.prompt_data = prompt_data
        
        # Update UI
        self.generate_btn.setEnabled(True)
        self.copy_prompt_btn.setEnabled(True)
        self.export_txt_btn.setEnabled(True)
        self.export_json_btn.setEnabled(True)
        
        # Show success notification
        if self.isHidden():
            worker = NotificationWorker("Prompt Generated", "Your prompt has been generated successfully!")
            worker.start()
        
        # Switch to prompt tab
        self.tabs.setCurrentIndex(2)
        
        # Update prompt display
        self.prompt_display.setText(prompt_data["prompt"])
        
        # Hide progress elements
        self.progress_bar.hide()
        self.status_label.hide()
    
    def _generation_error(self, error_message: str):
        """Handle prompt generation error"""
        # Update UI
        self.progress_bar.hide()
        self.status_label.setText(f"Error: {error_message}")
        self.generate_btn.setEnabled(True)
        
        # Show error notification
        if self.isHidden():
            worker = NotificationWorker("Generation Error", error_message)
            worker.start()
        
        # Show error dialog
        QMessageBox.critical(self, "Generation Error", f"An error occurred during prompt generation:\n{error_message}")
    
    def _copy_prompt(self):
        """Copy the generated prompt to clipboard"""
        if not self.prompt_data:
            return
        
        # Copy to clipboard
        QApplication.clipboard().setText(self.prompt_data["prompt"])
        
        # Show confirmation
        self.statusBar().showMessage("Prompt copied to clipboard", 3000)
    
    def _export_prompt(self, format_type: str):
        """Export the prompt to a file"""
        if not self.prompt_data:
            return
        
        # Get file path from user
        if format_type == "txt":
            file_path, _ = QFileDialog.getSaveFileName(
                self, "Save Prompt as Text", f"prompt_{int(time.time())}.txt", "Text Files (*.txt)"
            )
            if file_path:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(self.prompt_data["prompt"])
        
        elif format_type == "json":
            file_path, _ = QFileDialog.getSaveFileName(
                self, "Save Data as JSON", f"prompt_data_{int(time.time())}.json", "JSON Files (*.json)"
            )
            if file_path:
                import json
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(self.prompt_data, f, ensure_ascii=False, indent=2)
        
        # Show confirmation if file was saved
        if file_path:
            self.statusBar().showMessage(f"Prompt exported to {file_path}", 3000)
    
    def _change_opacity(self, value: int):
        """Change the window opacity"""
        opacity = value / 100.0
        self.setWindowOpacity(opacity)
        self.settings.setValue("opacity", opacity)
    
    def _show_settings(self):
        """Show settings dialog"""
        # For now, just show a message that settings are available in the toolbar
        QMessageBox.information(
            self, 
            "Settings", 
            "Opacity can be adjusted using the slider in the toolbar.\n\n"
            "API key and model selection is in the Input tab."
        )
    
    def _tray_icon_activated(self, reason):
        """Handle tray icon activation"""
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            if self.isHidden():
                self.show()
                self.activateWindow()
            else:
                self.hide()
    
    def _set_dark_theme(self):
        """Set dark theme for the application"""
        # Create palette
        palette = QPalette()
        
        # Set colors from our palette
        palette.setColor(QPalette.Window, QColor(DARK_PALETTE["window"]))
        palette.setColor(QPalette.WindowText, QColor(DARK_PALETTE["window_text"]))
        palette.setColor(QPalette.Base, QColor(DARK_PALETTE["base"]))
        palette.setColor(QPalette.AlternateBase, QColor(DARK_PALETTE["alternate_base"]))
        palette.setColor(QPalette.Text, QColor(DARK_PALETTE["text"]))
        palette.setColor(QPalette.Button, QColor(DARK_PALETTE["button"]))
        palette.setColor(QPalette.ButtonText, QColor(DARK_PALETTE["button_text"]))
        palette.setColor(QPalette.BrightText, QColor(DARK_PALETTE["bright_text"]))
        palette.setColor(QPalette.Link, QColor(DARK_PALETTE["link"]))
        palette.setColor(QPalette.Highlight, QColor(DARK_PALETTE["highlight"]))
        palette.setColor(QPalette.HighlightedText, QColor(DARK_PALETTE["highlight_text"]))
        
        # Apply palette
        QApplication.setPalette(palette)
        
        # Additional style sheet
        QApplication.setStyle("Fusion")
        
        stylesheet = """
        QMainWindow, QDialog {
            background-color: #1E1E1E;
        }
        
        QToolTip {
            background-color: #3C3C3C;
            color: #FFFFFF;
            border: 1px solid #3C3C3C;
        }
        
        QTabWidget::pane {
            border: 1px solid #3C3C3C;
        }
        
        QTabBar::tab {
            background-color: #2D2D30;
            color: #FFFFFF;
            padding: 8px 12px;
            margin-right: 2px;
        }
        
        QTabBar::tab:selected {
            background-color: #0078D7;
        }
        
        QTabBar::tab:hover:!selected {
            background-color: #3C3C3C;
        }
        
        QPushButton {
            background-color: #0078D7;
            color: #FFFFFF;
            border: none;
            padding: 6px 12px;
            border-radius: 2px;
        }
        
        QPushButton:hover {
            background-color: #1C86DC;
        }
        
        QPushButton:pressed {
            background-color: #0063B1;
        }
        
        QPushButton:disabled {
            background-color: #3C3C3C;
            color: #A0A0A0;
        }
        
        QLineEdit, QTextEdit, QComboBox {
            background-color: #2D2D30;
            color: #E0E0E0;
            border: 1px solid #3C3C3C;
            border-radius: 2px;
            padding: 4px;
        }
        
        QLineEdit:focus, QTextEdit:focus, QComboBox:focus {
            border: 1px solid #0078D7;
        }
        
        QComboBox::drop-down {
            border: none;
            width: 20px;
        }
        
        QComboBox::down-arrow {
            width: 12px;
            height: 12px;
        }
        
        QProgressBar {
            border: 1px solid #3C3C3C;
            border-radius: 2px;
            text-align: center;
            background-color: #2D2D30;
        }
        
        QProgressBar::chunk {
            background-color: #0078D7;
        }
        
        QCheckBox::indicator {
            width: 16px;
            height: 16px;
        }
        
        QGroupBox {
            border: 1px solid #3C3C3C;
            border-radius: 3px;
            margin-top: 6px;
            padding-top: 10px;
        }
        
        QGroupBox::title {
            subcontrol-origin: margin;
            subcontrol-position: top left;
            padding: 0 3px;
        }
        
        QScrollBar:vertical {
            border: none;
            background-color: #2D2D30;
            width: 10px;
            margin: 0;
        }
        
        QScrollBar::handle:vertical {
            background-color: #3C3C3C;
            min-height: 20px;
            border-radius: 5px;
        }
        
        QScrollBar::handle:vertical:hover {
            background-color: #505050;
        }
        
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
            height: 0px;
        }
        
        QSlider::groove:horizontal {
            height: 4px;
            background: #3C3C3C;
            border-radius: 2px;
        }
        
        QSlider::handle:horizontal {
            background: #0078D7;
            border: none;
            width: 14px;
            height: 14px;
            margin: -5px 0;
            border-radius: 7px;
        }
        
        QSlider::handle:horizontal:hover {
            background: #1C86DC;
        }
        """
        
        self.setStyleSheet(stylesheet)
    
    def _get_icon_path(self, icon_name: str) -> str:
        """Get path to an icon, falling back to QtAwesome if file not found"""
        # First try to find the icon file
        icon_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "resources", f"{icon_name}_icon.png")
        
        if os.path.exists(icon_path):
            return icon_path
        
        # Try alternative name
        alt_icon_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "resources", f"{icon_name}.png")
        if os.path.exists(alt_icon_path):
            return alt_icon_path
        
        # If icon file not found, fallback to QtAwesome
        try:
            if icon_name == "app":
                icon = qta.icon('fa5s.film', color='#0078D7')  # Film icon for app
                return ""
        except Exception:
            pass
            
        # Default
        return ""
    
    def _load_settings(self):
        """Load application settings"""
        # Load opacity
        opacity = self.settings.value("opacity", 1.0, type=float)
        self.opacity_slider.setValue(int(opacity * 100))
        self.setWindowOpacity(opacity)
        
        # Load API key
        api_key = self.settings.value("api_key", "")
        self.api_key_input.setText(api_key)
    
    def closeEvent(self, event):
        """Handle window close event"""
        # Save settings
        self.settings.setValue("geometry", self.saveGeometry())
        self.settings.setValue("opacity", self.windowOpacity())
        self.settings.setValue("api_key", self.api_key_input.text())
        
        # Minimize to tray if not quitting
        if not QApplication.quit and self.tray_icon.isVisible():
            QMessageBox.information(self, "YouTube Video Prompt Generator",
                                   "The application will continue running in the system tray. "
                                   "To terminate the program, right-click the tray icon and choose 'Quit'.")
            self.hide()
            event.ignore()
        else:
            event.accept()