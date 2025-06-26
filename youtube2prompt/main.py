import os
import argparse
from typing import Optional

from dotenv import load_dotenv

from app.video_processor import VideoProcessor
from app.prompt_generator import PromptGenerator
from app.utils import is_valid_youtube_url, get_available_prompt_types

# Load environment variables from .env file
load_dotenv()

def main():
    """Main entry point for the YouTube video prompt generator."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Generate structured prompts from YouTube videos")
    parser.add_argument("--url", help="YouTube video URL (single mode)")
    parser.add_argument("--urls-file", help="File containing YouTube URLs, one per line (batch mode)")
    parser.add_argument("--prompt-type", "-t", choices=get_available_prompt_types(), default="standard",
                        help="Type of prompt to generate")
    parser.add_argument("--output-dir", "-o", default="data", help="Directory to save output files")
    parser.add_argument("--api-key", help="OpenRouter API key (overrides environment variable)")
    parser.add_argument("--model", default="openai/gpt-4", help="Model in format 'provider/model-name'")
    parser.add_argument("--max-workers", type=int, default=3, help="Maximum number of concurrent workers for batch processing")
    args = parser.parse_args()
    
    # Determine operation mode
    if args.url and args.urls_file:
        print("Error: Cannot specify both --url and --urls-file. Choose one mode.")
        return 1
    
    if not args.url and not args.urls_file:
        print("Error: Must specify either --url (single mode) or --urls-file (batch mode).")
        return 1
    
    # Single video mode
    if args.url:
        return process_single_video(args)
    
    # Batch mode
    else:
        return process_multiple_videos(args)

def process_single_video(args):
    """Process a single video and generate a prompt."""
    # Validate YouTube URL
    if not is_valid_youtube_url(args.url):
        print(f"Error: Invalid YouTube URL: {args.url}")
        return 1
    
    try:
        # Process video
        print(f"Processing video: {args.url}")
        video_processor = VideoProcessor(data_dir=args.output_dir)
        video_data = video_processor.process_video(args.url)
        
        # Generate prompt
        print(f"Generating {args.prompt_type} prompt...")
        prompt_generator = PromptGenerator(api_key=args.api_key, model=args.model)
        prompt_data = prompt_generator.generate_prompt(video_data, prompt_type=args.prompt_type, is_batch=False)
        
        # Save prompt
        output_path = prompt_generator.save_prompt(prompt_data, output_dir=args.output_dir)
        print(f"Prompt saved to: {output_path}")
        
        # Display a preview of the prompt
        print("\nPrompt Preview:")
        print("=" * 50)
        preview_length = min(500, len(prompt_data["prompt"]))
        print(prompt_data["prompt"][:preview_length] + ("..." if preview_length < len(prompt_data["prompt"]) else ""))
        print("=" * 50)
        print(f"\nFull prompt saved to: {output_path}")
        
        return 0
    
    except Exception as e:
        print(f"Error: {e}")
        return 1

def process_multiple_videos(args):
    """Process multiple videos and generate a combined prompt."""
    try:
        # Read URLs from file
        with open(args.urls_file, "r") as f:
            urls = [line.strip() for line in f if line.strip()]
        
        if not urls:
            print(f"Error: No URLs found in file: {args.urls_file}")
            return 1
        
        # Validate URLs
        invalid_urls = [url for url in urls if not is_valid_youtube_url(url)]
        if invalid_urls:
            print(f"Error: Found {len(invalid_urls)} invalid YouTube URLs:")
            for url in invalid_urls[:5]:  # Show first 5 invalid URLs
                print(f"- {url}")
            if len(invalid_urls) > 5:
                print(f"... and {len(invalid_urls) - 5} more")
            return 1
        
        # Import and use the batch processor
        from app.batch_processor import BatchProcessor
        
        # Process videos in batch
        print(f"Processing {len(urls)} videos in batch mode...")
        batch_processor = BatchProcessor(data_dir=args.output_dir, max_workers=args.max_workers)
        batch_data = batch_processor.process_videos(urls)
        
        # Display processing summary
        summary = batch_data["processing_summary"]
        print(f"Successfully processed {summary['successful']} of {summary['total_videos']} videos")
        if summary["failed"] > 0:
            print(f"Failed to process {summary['failed']} videos:")
            for error in summary["errors"][:5]:  # Show first 5 errors
                print(f"- {error['url']}: {error['error']}")
            if len(summary["errors"]) > 5:
                print(f"... and {len(summary['errors']) - 5} more")
        
        # Generate prompt if we have at least one successful video
        if summary["successful"] > 0:
            print(f"\nGenerating {args.prompt_type} prompt from {summary['successful']} videos...")
            prompt_generator = PromptGenerator(api_key=args.api_key, model=args.model)
            prompt_data = prompt_generator.generate_prompt(batch_data, prompt_type=args.prompt_type, is_batch=True)
            
            # Save prompt
            output_path = prompt_generator.save_prompt(prompt_data, output_dir=args.output_dir)
            print(f"Prompt saved to: {output_path}")
            
            # Display a preview of the prompt
            print("\nPrompt Preview:")
            print("=" * 50)
            preview_length = min(500, len(prompt_data["prompt"]))
            print(prompt_data["prompt"][:preview_length] + ("..." if preview_length < len(prompt_data["prompt"]) else ""))
            print("=" * 50)
            print(f"\nFull prompt saved to: {output_path}")
            
            return 0
        else:
            print("Error: No videos were successfully processed. Cannot generate prompt.")
            return 1
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())