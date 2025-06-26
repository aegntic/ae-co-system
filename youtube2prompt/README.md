# YouTube2Prompt

![GitHub](https://img.shields.io/github/license/YOUR_USERNAME/youtube2prompt?style=flat-square)
![Python](https://img.shields.io/badge/python-3.8%2B-blue?style=flat-square)

An application that converts YouTube videos into structured prompts with context, using AI to analyze video content and generate well-formatted prompts.

## Features

- Extract metadata and transcripts from YouTube videos
- Process multiple videos simultaneously and pool their information
- Generate structured prompts with AI processing
- Multiple prompt formats (standard, detailed, creative)
- Command-line interface for automation
- Web interface for easy interaction
- Support for various AI models via OpenRouter

## Installation

### Prerequisites

- Python 3.8 or higher
- An OpenRouter API key (get one at https://openrouter.ai)

### Setup

1. Clone this repository:
   ```
   git clone https://github.com/YOUR_USERNAME/youtube2prompt.git
   cd youtube2prompt
   ```

2. Create a virtual environment and install the dependencies:
   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the project root with your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_REFERER=http://localhost:8501
   ```

## Usage

### Command Line Interface

To generate a prompt from a single YouTube video:

```bash
python main.py --url "https://www.youtube.com/watch?v=video_id" --prompt-type standard
```

To process multiple videos and generate a combined prompt:

```bash
# First, create a text file with YouTube URLs, one per line
echo "https://www.youtube.com/watch?v=video_id1" > urls.txt
echo "https://www.youtube.com/watch?v=video_id2" >> urls.txt
echo "https://www.youtube.com/watch?v=video_id3" >> urls.txt

# Then process all videos and generate a combined prompt
python main.py --urls-file urls.txt --prompt-type standard
```

Options:
- `--url`: Single YouTube video URL (single mode)
- `--urls-file`: Path to a file containing YouTube URLs, one per line (batch mode)
- `--prompt-type` (or `-t`): Type of prompt to generate (standard, detailed, creative)
- `--output-dir` (or `-o`): Directory to save output files
- `--api-key`: OpenRouter API key (overrides environment variable)
- `--model`: AI model to use in format 'provider/model-name' (default: openai/gpt-4)
- `--max-workers`: Maximum number of concurrent workers for batch processing (default: 3)

### GUI Application

To run the desktop GUI application:

```bash
python run_gui.py
```

#### Dependencies for GUI

For Linux systems, you might need to install additional packages for the GUI:

```bash
# For Debian/Ubuntu
sudo apt-get install libxcb-cursor0 libxcb-xkb1 libxkbcommon-x11-0

# For Fedora/RHEL
sudo dnf install libxcb xcb-util-cursor libxkbcommon-x11
```

Features of the GUI application:
- Dark mode by default
- Adjustable window opacity
- System tray integration (minimize to tray)
- Desktop notifications for completed tasks
- Multi-threaded processing for better performance
- Export options for generated prompts

### Web Interface

Alternatively, you can run the web interface:

```bash
python run_streamlit.py
```

Then open your browser and go to http://localhost:8501

## How It Works

1. **Video Processing**:
   - Fetches video metadata (title, author, description, etc.)
   - Extracts the video transcript if available
   - Can process multiple videos concurrently (in batch mode)

2. **Information Pooling** (in batch mode):
   - Combines metadata from all processed videos
   - Pools transcripts with clear separation between videos
   - Identifies common keywords and themes across videos

3. **Prompt Generation**:
   - Analyzes the video content using AI models via OpenRouter API
   - Supports multiple AI models from providers like OpenAI, Anthropic, Google, and more
   - Generates a structured prompt based on the selected template
   - In batch mode, creates prompts that synthesize information from all videos
   - Formats the prompt with appropriate Markdown styling

4. **Output**:
   - Provides the generated prompt for immediate use
   - Saves both the processed video data and generated prompt for future reference

## Prompt Types

- **Standard**: A balanced, well-structured prompt with clear sections
- **Detailed**: A comprehensive prompt with in-depth exploration points
- **Creative**: An imaginative prompt that takes a unique approach to the content

## License

[MIT License](LICENSE)