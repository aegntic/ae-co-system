import os
import subprocess
import sys
from pathlib import Path

# Get the directory of this script
SCRIPT_DIR = Path(__file__).parent.absolute()

def main():
    """Run the Streamlit app with proper Python path setup."""
    # Ensure we're in the right directory
    os.chdir(SCRIPT_DIR)
    
    # Set up the command
    cmd = [
        "streamlit",
        "run",
        "app/streamlit_app.py",
        "--server.port=8501",
        "--server.address=0.0.0.0"
    ]
    
    # Run the command
    try:
        subprocess.run(cmd, check=True)
        return 0
    except subprocess.CalledProcessError as e:
        print(f"Error running Streamlit app: {e}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Streamlit app stopped by user.")
        return 0

if __name__ == "__main__":
    sys.exit(main())