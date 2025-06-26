import os
import json
import time
from typing import Dict, Any, Optional

import streamlit as st
from dotenv import load_dotenv

from app.video_processor import VideoProcessor
from app.prompt_generator import PromptGenerator
from app.utils import is_valid_youtube_url, get_available_prompt_types, format_seconds_to_time

# Load environment variables
load_dotenv()

# Page config
st.set_page_config(
    page_title="YouTube Video Prompt Generator",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Function to initialize session state
def init_session_state():
    if "api_key" not in st.session_state:
        st.session_state.api_key = os.getenv("OPENROUTER_API_KEY", "")
    if "generated_prompt" not in st.session_state:
        st.session_state.generated_prompt = None
    if "video_data" not in st.session_state:
        st.session_state.video_data = None

# Initialize session state
init_session_state()

# Sidebar for configuration
with st.sidebar:
    st.title("⚙️ Configuration")
    
    # OpenRouter API Key input
    api_key = st.text_input("OpenRouter API Key", 
                         value=st.session_state.api_key,
                         type="password",
                         help="Enter your OpenRouter API key here. It will not be stored permanently.")
    
    # Update session state
    if api_key:
        st.session_state.api_key = api_key
    
    # Model selection
    model = st.selectbox(
        "Model",
        options=[
            "openai/gpt-4", 
            "openai/gpt-3.5-turbo", 
            "anthropic/claude-3-opus", 
            "anthropic/claude-3-sonnet",
            "anthropic/claude-3-haiku",
            "google/gemini-pro",
            "meta-llama/llama-3-70b-instruct",
            "meta-llama/llama-3-8b-instruct",
            "mistralai/mistral-7b-instruct"
        ],
        index=0,
        help="Select the model to use for generating prompts. Format: provider/model-name"
    )
    
    # Prompt type selection
    prompt_type = st.selectbox(
        "Prompt Type",
        options=get_available_prompt_types(),
        index=0,
        help="Select the type of prompt to generate."
    )
    
    st.markdown("---")
    st.markdown("### About")
    st.markdown(
        "This app generates structured prompts from YouTube videos. "
        "Enter a YouTube URL, select your preferences, and get a structured prompt based on the video content."
    )

# Main content
st.title("🎬 YouTube Video Prompt Generator")

# URL input
st.markdown("## Video Input")

# Add toggle for single/multiple video mode
mode = st.radio(
    "Mode",
    options=["Single Video", "Multiple Videos"],
    index=0,
    help="Choose whether to process a single video or multiple videos"
)

if mode == "Single Video":
    # Single URL input
    url = st.text_input("Enter YouTube URL", 
                      placeholder="https://www.youtube.com/watch?v=...",
                      help="Enter the full URL of a YouTube video")
    
    # Process video button
    if st.button("Process Video", disabled=not url or not st.session_state.api_key):
        if not is_valid_youtube_url(url):
            st.error("Please enter a valid YouTube URL")
        else:
            with st.spinner("Processing video..."):
                try:
                    # Process video
                    video_processor = VideoProcessor()
                    video_data = video_processor.process_video(url)
                    st.session_state.video_data = video_data
                    st.session_state.is_batch = False
                    
                    # Display success message
                    st.success(f"Video processed successfully: {video_data['metadata']['title']}")
                    
                except Exception as e:
                    st.error(f"Error processing video: {e}")

else:  # Multiple Videos mode
    # Import the batch processor
    from app.batch_processor import BatchProcessor
    
    # Multiple URL input
    urls_text = st.text_area(
        "Enter YouTube URLs (one per line)", 
        placeholder="https://www.youtube.com/watch?v=...
https://www.youtube.com/watch?v=...",
        height=150,
        help="Enter multiple YouTube URLs, one per line"
    )
    
    # Convert text area to list of URLs
    urls = [url.strip() for url in urls_text.split('\n') if url.strip()]
    
    # Add progress indicators
    max_workers = st.slider("Concurrent workers", min_value=1, max_value=5, value=3, 
                         help="Number of videos to process simultaneously")
    
    # Process videos button
    if st.button("Process Videos", disabled=not urls or not st.session_state.api_key):
        # Validate URLs
        invalid_urls = [url for url in urls if not is_valid_youtube_url(url)]
        if invalid_urls:
            st.error(f"Found {len(invalid_urls)} invalid YouTube URLs. Please check your input.")
            st.write("Invalid URLs:")
            for url in invalid_urls[:5]:  # Show first 5 invalid URLs
                st.write(f"- {url}")
            if len(invalid_urls) > 5:
                st.write(f"... and {len(invalid_urls) - 5} more")
        else:
            with st.spinner(f"Processing {len(urls)} videos..."):
                try:
                    # Create progress bar
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    # Process videos in batch
                    batch_processor = BatchProcessor(max_workers=max_workers)
                    
                    # Process the videos
                    batch_data = batch_processor.process_videos(urls)
                    st.session_state.video_data = batch_data
                    st.session_state.is_batch = True
                    
                    # Update progress to complete
                    progress_bar.progress(100)
                    
                    # Display success/failure info
                    summary = batch_data["processing_summary"]
                    if summary["failed"] > 0:
                        st.warning(f"Processed {summary['successful']} videos successfully. {summary['failed']} videos failed.")
                    else:
                        st.success(f"All {summary['successful']} videos processed successfully!")
                    
                except Exception as e:
                    st.error(f"Error processing videos: {e}")

# Generate prompt button (only show if video data is available)
if st.session_state.video_data and st.button("Generate Prompt", disabled=not st.session_state.api_key):
    with st.spinner(f"Generating {prompt_type} prompt..."):
        try:
            # Check if we're processing single or batch data
            is_batch = st.session_state.get("is_batch", False)
            
            # Generate prompt
            prompt_generator = PromptGenerator(api_key=st.session_state.api_key, model=model)
            prompt_data = prompt_generator.generate_prompt(st.session_state.video_data, prompt_type=prompt_type, is_batch=is_batch)
            
            # Store generated prompt
            st.session_state.generated_prompt = prompt_data
            
            # Save prompt
            output_path = prompt_generator.save_prompt(prompt_data)
            st.success(f"Prompt generated successfully and saved to {output_path}")
            
        except Exception as e:
            st.error(f"Error generating prompt: {e}")

# Display video information if available
if st.session_state.video_data:
    is_batch = st.session_state.get("is_batch", False)
    
    if is_batch:
        # Display batch information
        st.markdown("## Videos Information")
        batch_data = st.session_state.video_data
        combined_metadata = batch_data["combined_metadata"]
        
        # Display summary information
        st.markdown(f"### {combined_metadata['title']}")
        st.markdown(f"**Total Videos:** {combined_metadata['total_videos']}")
        st.markdown(f"**Total Duration:** {format_seconds_to_time(combined_metadata['total_length_seconds'])}")
        st.markdown(f"**Authors:** {', '.join(combined_metadata['authors'])}")
        
        # Display individual videos in an expander
        with st.expander("Video Details", expanded=True):
            for i, video in enumerate(combined_metadata['videos']):
                # Create a container for each video
                with st.container():
                    st.markdown(f"#### {i+1}. {video['title']}")
                    
                    # Create two columns for each video
                    col1, col2 = st.columns([1, 3])
                    
                    with col1:
                        # Display thumbnail
                        st.image(video["thumbnail_url"], use_column_width=True)
                    
                    with col2:
                        # Display metadata
                        st.markdown(f"**Author:** {video['author']}")
                        st.markdown(f"**Duration:** {format_seconds_to_time(video['length'])}")
                        if video.get('views'):
                            st.markdown(f"**Views:** {video['views']:,}")
                        if video.get('publish_date'):
                            st.markdown(f"**Published:** {video['publish_date'][:10] if video['publish_date'] else 'Unknown'}")
                        
                        # Add a link to the video
                        st.markdown(f"[Watch on YouTube]({video['url']})")
                    
                    # Add a separator between videos (except after the last one)
                    if i < len(combined_metadata['videos']) - 1:
                        st.markdown("---")
        
        # Show combined transcript preview if available
        if batch_data.get("combined_transcript"):
            with st.expander("Combined Transcript Preview"):
                combined_transcript = batch_data.get("combined_transcript", "")
                # Show a preview of the transcript
                preview_length = min(2000, len(combined_transcript))
                st.text_area(
                    "Combined Transcript Preview", 
                    combined_transcript[:preview_length] + ("..." if preview_length < len(combined_transcript) else ""),
                    height=300,
                    disabled=True
                )
        else:
            st.warning("No transcripts available for these videos.")
    
    else:  # Single video mode
        st.markdown("## Video Information")
        
        # Extract metadata
        metadata = st.session_state.video_data["metadata"]
        
        # Create two columns
        col1, col2 = st.columns([1, 2])
        
        with col1:
            # Display thumbnail
            st.image(metadata["thumbnail_url"], use_column_width=True)
        
        with col2:
            # Display metadata
            st.markdown(f"### {metadata['title']}")
            st.markdown(f"**Author:** {metadata['author']}")
            st.markdown(f"**Duration:** {format_seconds_to_time(metadata['length'])}")
            st.markdown(f"**Views:** {metadata['views']:,}")
            if metadata.get('publish_date'):
                st.markdown(f"**Published:** {metadata['publish_date'][:10] if metadata['publish_date'] else 'Unknown'}")
            
            # Add a link to the video
            st.markdown(f"[Watch on YouTube]({metadata['url']})")
        
        # Show transcript preview if available
        if st.session_state.video_data.get("transcript"):
            with st.expander("Transcript Preview"):
                transcript_text = st.session_state.video_data.get("transcript_text", "")
                # Show a preview of the transcript
                preview_length = min(1000, len(transcript_text))
                st.text_area(
                    "Transcript Preview", 
                    transcript_text[:preview_length] + ("..." if preview_length < len(transcript_text) else ""),
                    height=200,
                    disabled=True
                )
        else:
            st.warning("No transcript available for this video.")

# Display generated prompt if available
if st.session_state.generated_prompt:
    st.markdown("## Generated Prompt")
    
    # Display the prompt
    st.markdown(st.session_state.generated_prompt["prompt"])
    
    # Add export options
    st.download_button(
        label="Download Prompt as Text",
        data=st.session_state.generated_prompt["prompt"],
        file_name=f"{st.session_state.generated_prompt['video_id']}_prompt.txt",
        mime="text/plain"
    )
    
    st.download_button(
        label="Download Complete Data as JSON",
        data=json.dumps(st.session_state.generated_prompt, indent=2),
        file_name=f"{st.session_state.generated_prompt['video_id']}_data.json",
        mime="application/json"
    )