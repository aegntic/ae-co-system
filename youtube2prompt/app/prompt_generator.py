import os
import json
import time
import requests
from typing import Dict, Any, List, Optional

class PromptGenerator:
    """Generates structured prompts from processed YouTube video data using OpenRouter API."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "openai/gpt-4"):
        """Initialize the PromptGenerator.
        
        Args:
            api_key: OpenRouter API key. If None, it will try to get from environment.
            model: Model ID to use for prompt generation (in format 'provider/model')
        """
        # Set API key from parameter or environment
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OpenRouter API key is required. Provide it as a parameter or set OPENROUTER_API_KEY in your environment.")
        
        self.model = model
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("OPENROUTER_REFERER", "http://localhost:8501"),  # Required for OpenRouter
            "X-Title": "YouTube Video Prompt Generator", # Optional, for tracking in OpenRouter analytics
        }
    
    def generate_prompt(self, video_data: Dict[str, Any], prompt_type: str = "standard", is_batch: bool = False) -> Dict[str, Any]:
        """Generate a structured prompt from video data.
        
        Args:
            video_data: Processed video data from VideoProcessor or BatchProcessor
            prompt_type: Type of prompt to generate (standard, detailed, creative)
            is_batch: Whether the data is from multiple videos
            
        Returns:
            Dictionary containing the generated prompt
        """
        # Handle both single video and batched videos
        if is_batch:
            return self._generate_batch_prompt(video_data, prompt_type)
        else:
            return self._generate_single_video_prompt(video_data, prompt_type)
    
    def _generate_single_video_prompt(self, video_data: Dict[str, Any], prompt_type: str) -> Dict[str, Any]:
        """Generate a prompt for a single video.
        
        Args:
            video_data: Processed data for a single video
            prompt_type: Type of prompt to generate
            
        Returns:
            Dictionary containing the generated prompt
        """
        metadata = video_data["metadata"]
        transcript_text = video_data.get("transcript_text", "")
        
        # Prepare system message based on prompt type
        system_message = self._get_system_message(prompt_type, is_batch=False)
        
        # Prepare user message with video context
        user_message = f"""I need to create a structured prompt based on this YouTube video:

Title: {metadata['title']}
Author: {metadata['author']}
Length: {metadata['length']} seconds

Description:
{metadata['description']}

"""
        
        # Add transcript if available
        if transcript_text:
            # Truncate transcript if it's too long (to stay within token limits)
            max_transcript_chars = 12000  # Approximate character count to stay under token limits
            if len(transcript_text) > max_transcript_chars:
                user_message += f"Partial Transcript (truncated):\n{transcript_text[:max_transcript_chars]}...[transcript truncated]"
            else:
                user_message += f"Transcript:\n{transcript_text}"
        else:
            user_message += "[No transcript available]"
    
    def _generate_batch_prompt(self, batch_data: Dict[str, Any], prompt_type: str) -> Dict[str, Any]:
        """Generate a prompt from combined data of multiple videos.
        
        Args:
            batch_data: Combined data from multiple videos
            prompt_type: Type of prompt to generate
            
        Returns:
            Dictionary containing the generated prompt
        """
        combined_metadata = batch_data["combined_metadata"]
        combined_transcript = batch_data.get("combined_transcript", "")
        videos = combined_metadata["videos"]
        
        # Prepare system message based on prompt type
        system_message = self._get_system_message(prompt_type, is_batch=True)
        
        # Prepare user message with combined video context
        user_message = f"""I need to create a structured prompt based on {len(videos)} related YouTube videos:

Collection Title: {combined_metadata['title']}
Videos: {len(videos)}
Total Duration: {combined_metadata['total_length_seconds']} seconds
Authors: {', '.join(combined_metadata['authors'])}

Video List:
"""
        
        # Add individual video details
        for i, video in enumerate(videos):
            user_message += f"\n{i+1}. {video['title']} by {video['author']} ({video['length']} seconds) - {video['url']}"
        
        # Add keywords if available
        if batch_data.get("all_keywords"):
            keywords = batch_data["all_keywords"]
            user_message += f"\n\nKeywords: {', '.join(keywords[:30])}" + ("..." if len(keywords) > 30 else "")
        
        # Add combined transcript if available
        if combined_transcript:
            # Truncate transcript if it's too long (to stay within token limits)
            max_transcript_chars = 14000  # Approximate character count to stay under token limits
            if len(combined_transcript) > max_transcript_chars:
                user_message += f"\n\nPartial Combined Transcript (truncated):\n{combined_transcript[:max_transcript_chars]}...[transcript truncated]"
            else:
                user_message += f"\n\nCombined Transcript:\n{combined_transcript}"
        else:
            user_message += "\n\n[No transcripts available]"
        
        # Get completion from OpenRouter
        # Execute the OpenRouter API call and format the response
        return self._execute_prompt_request(system_message, user_message, prompt_type, metadata, is_batch=False)
        
    def _execute_prompt_request(self, system_message: str, user_message: str, prompt_type: str, 
                               metadata: Dict[str, Any], is_batch: bool = False) -> Dict[str, Any]:
        """Execute the API request to generate a prompt.
        
        Args:
            system_message: System message for the AI model
            user_message: User message with video context
            prompt_type: Type of prompt being generated
            metadata: Video metadata (single or combined)
            is_batch: Whether this is a batch prompt
            
        Returns:
            Dictionary containing the generated prompt
        """
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.7,
            }
            
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            response.raise_for_status()  # Raise exception for HTTP errors
            response_data = response.json()
            
            # Extract the prompt from the response
            prompt_text = response_data["choices"][0]["message"]["content"]
            
            # Structure the result differently based on whether it's a batch
            if is_batch:
                result = {
                    "batch": True,
                    "video_count": metadata.get("total_videos", 0),
                    "video_ids": [v.get("id") for v in metadata.get("videos", [])],
                    "title": metadata.get("title", "Batch Video Prompt"),
                    "prompt_type": prompt_type,
                    "prompt": prompt_text,
                    "model_used": self.model,
                    "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
                }
            else:
                result = {
                    "batch": False,
                    "video_id": metadata["id"],
                    "video_title": metadata["title"],
                    "video_url": metadata["url"],
                    "prompt_type": prompt_type,
                    "prompt": prompt_text,
                    "model_used": self.model,
                    "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
                }
            
            return result
            
        except Exception as e:
            raise RuntimeError(f"Failed to generate prompt: {e}")
    
    def _get_system_message(self, prompt_type: str, is_batch: bool = False) -> str:
        """Get the system message for a specific prompt type.
        
        Args:
            prompt_type: Type of prompt to generate
            is_batch: Whether this is for multiple videos
            
        Returns:
            System message for the AI model
        """
        # Check if this is a batch prompt request
        if is_batch:
            return self._get_batch_system_message(prompt_type)
            
        # Single video prompt messages
        if prompt_type == "standard":
            return """
You are a prompt engineer specializing in creating structured prompts from YouTube videos. 
Analyze the video information provided and generate a well-structured prompt that captures the main content, context, and themes of the video.

Your prompt should include:
1. A clear, concise title that reflects the content
2. A brief introduction to the topic or context
3. Key points or questions to explore (3-5 items)
4. Any relevant background knowledge needed to understand the topic
5. A specific, actionable request that would produce a response related to the video content

Format the prompt in markdown with appropriate headings, bullet points, and emphasis.
"""
        
        elif prompt_type == "detailed":
            return """
You are an expert prompt engineer specializing in creating comprehensive, detailed prompts from YouTube videos.
Analyze the video information provided and generate an in-depth prompt that thoroughly explores the content, context, themes, and implications of the video.

Your prompt should include:
1. A descriptive title that precisely captures the content
2. A comprehensive introduction to the topic and its significance
3. Key concepts, theories, or frameworks mentioned in the video
4. Detailed exploration points (5-8 items) with follow-up questions for each
5. Relevant background knowledge and contextual information
6. Technical terminology and definitions where appropriate
7. A structured request for analysis that encourages deep exploration of the topic

Format the prompt in markdown with appropriate headings, subheadings, bullet points, and emphasis. Include sections for different aspects of the topic.
"""
        
        elif prompt_type == "creative":
            return """
You are a creative prompt designer specializing in transforming YouTube videos into imaginative, engaging prompts.
Analyze the video information provided and create a prompt that takes a unique, creative approach to the content.

Your prompt should include:
1. A captivating, intriguing title that draws interest
2. A creative framing device (e.g., a hypothetical scenario, role-play situation, or thought experiment)
3. An unconventional perspective or approach to the topic
4. Open-ended questions that encourage imaginative thinking
5. Suggestions for creative applications or extensions of the ideas
6. A request that encourages an original, thoughtful response

Format the prompt in markdown with appropriate styling to enhance readability and engagement.
"""
        
        else:
            # Default to standard if an unknown type is provided
            return self._get_system_message("standard", is_batch=is_batch)
            
    def _get_batch_system_message(self, prompt_type: str) -> str:
        """Get the system message for batch processing multiple videos.
        
        Args:
            prompt_type: Type of prompt to generate
            
        Returns:
            System message for the AI model for batch processing
        """
        if prompt_type == "standard":
            return """
You are a prompt engineer specializing in creating structured prompts from multiple related YouTube videos. 
Analyze the collection of videos provided and generate a well-structured prompt that synthesizes the main content, contexts, and themes across all videos.

Your prompt should include:
1. A clear, concise title that reflects the combined content of all videos
2. A brief introduction to the overarching topic or context
3. Key points or questions to explore (4-6 items) that span multiple videos in the collection
4. Any relevant background knowledge needed to understand the topic
5. A specific, actionable request that would produce a response synthesizing information from all videos

Make connections between the videos and identify common themes or contrasting viewpoints.
Format the prompt in markdown with appropriate headings, bullet points, and emphasis.
"""
        
        elif prompt_type == "detailed":
            return """
You are an expert prompt engineer specializing in creating comprehensive, detailed prompts that synthesize information from multiple YouTube videos.
Analyze the collection of videos provided and generate an in-depth prompt that thoroughly explores the content, contexts, themes, and relationships between the videos.

Your prompt should include:
1. A descriptive title that captures the essence of the video collection
2. A comprehensive introduction to the overarching topic and its significance
3. Cross-video themes, concepts, or frameworks identified across multiple videos
4. Detailed exploration points (6-10 items) with follow-up questions that encourage comparative analysis
5. Contextual information that helps understand how these videos relate to each other
6. Technical terminology and definitions relevant across multiple videos
7. A structured request for analysis that encourages deep exploration of interconnections between the videos

Identify agreements, disagreements, complementary information, and unique perspectives across the videos.
Format the prompt in markdown with appropriate headings, subheadings, bullet points, and emphasis.
"""
        
        elif prompt_type == "creative":
            return """
You are a creative prompt designer specializing in transforming collections of YouTube videos into imaginative, engaging prompts.
Analyze the videos provided and create a prompt that takes a unique, creative approach to synthesizing their content.

Your prompt should include:
1. A captivating, intriguing title that draws interest to the collection as a whole
2. A creative framing device (e.g., a hypothetical scenario, narrative, or thought experiment) that ties the videos together
3. An unconventional perspective or approach that reveals new insights when considering all videos together
4. Open-ended questions that encourage imaginative thinking across multiple dimensions of the content
5. Suggestions for creative applications or extensions that build upon multiple videos
6. A request that encourages an original response synthesizing elements from all videos

Make unexpected connections between videos and identify innovative ways to integrate their themes.
Format the prompt in markdown with appropriate styling to enhance readability and engagement.
"""
        
        else:
            # Default to standard if an unknown type is provided
            return self._get_batch_system_message("standard")

    def save_prompt(self, prompt_data: Dict[str, Any], output_dir: str = "data") -> str:
        """Save a generated prompt to disk.
        
        Args:
            prompt_data: Generated prompt data
            output_dir: Directory to save the prompt
            
        Returns:
            Path to the saved prompt file
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # Create filename with video ID and prompt type
        filename = f"{prompt_data['video_id']}_{prompt_data['prompt_type']}_prompt.json"
        output_path = os.path.join(output_dir, filename)
        
        # Save as JSON
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(prompt_data, f, ensure_ascii=False, indent=2)
        
        return output_path