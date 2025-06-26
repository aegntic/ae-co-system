import os
import re
import json
from typing import Dict, Any, List, Optional

def is_valid_youtube_url(url: str) -> bool:
    """Check if a URL is a valid YouTube URL.
    
    Args:
        url: URL to check
        
    Returns:
        True if URL is a valid YouTube URL, False otherwise
    """
    youtube_regex = (
        r'(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})'
    )
    return bool(re.match(youtube_regex, url))

def format_seconds_to_time(seconds: int) -> str:
    """Format seconds to a time string (HH:MM:SS).
    
    Args:
        seconds: Number of seconds
        
    Returns:
        Formatted time string
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes}:{seconds:02d}"

def load_json_file(file_path: str) -> Dict[str, Any]:
    """Load a JSON file.
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        Dictionary containing the loaded JSON data
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise RuntimeError(f"Failed to load JSON file {file_path}: {e}")

def get_available_prompt_types() -> List[str]:
    """Get a list of available prompt types.
    
    Returns:
        List of available prompt types
    """
    return ["standard", "detailed", "creative"]

def extract_prompt_content(prompt_data: Dict[str, Any]) -> str:
    """Extract the prompt content from prompt data.
    
    Args:
        prompt_data: Prompt data dictionary
        
    Returns:
        Extracted prompt content as a string
    """
    return prompt_data.get("prompt", "")