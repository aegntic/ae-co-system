#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Make sure we're in the correct directory
SCRIPT_DIR = Path(__file__).parent.absolute()
os.chdir(SCRIPT_DIR)

# Ensure the app's directory is in sys.path
sys.path.insert(0, str(SCRIPT_DIR))

# Set up environment
def setup_env():
    """Set up the environment for running the GUI application"""
    try:
        from dotenv import load_dotenv
        # Load environment variables from .env file
        load_dotenv()
        return True
    except ImportError:
        print("Warning: dotenv not installed. Environment variables won't be loaded from .env file.")
        return False

# Main function
def main():
    """Main entry point for the GUI application"""
    # Set up environment
    setup_env()
    
    try:
        # Import required modules
        from PySide6.QtWidgets import QApplication
        from app.gui.main_window import MainWindow
        
        # Create application
        app = QApplication(sys.argv)
        app.setApplicationName("YouTube Video Prompt Generator")
        app.setApplicationVersion("1.0.0")
        
        # Create and show main window
        main_window = MainWindow()
        
        # Run application
        return app.exec()
    
    except ImportError as e:
        print(f"Error: Required dependencies not installed: {e}")
        print("Please install the required dependencies:")
        print("pip install PySide6 qtawesome plyer")
        return 1
    
    except Exception as e:
        import traceback
        print(f"Error starting application: {e}")
        traceback.print_exc()
        return 1

# Run the app
if __name__ == "__main__":
    sys.exit(main())