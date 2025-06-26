import os
import json
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.video_processor import VideoProcessor

class BatchProcessor:
    """Handles processing of multiple YouTube videos and combines their data."""
    
    def __init__(self, data_dir: str = "data", max_workers: int = 3):
        """Initialize the BatchProcessor.
        
        Args:
            data_dir: Directory to store processed data
            max_workers: Maximum number of concurrent video processing tasks
        """
        self.data_dir = data_dir
        self.max_workers = max_workers
        self.video_processor = VideoProcessor(data_dir=data_dir)
        os.makedirs(data_dir, exist_ok=True)
        
    def process_videos(self, urls: List[str], save: bool = True) -> Dict[str, Any]:
        """Process multiple YouTube videos concurrently and combine their data.
        
        Args:
            urls: List of YouTube video URLs
            save: Whether to save the processed data to disk
            
        Returns:
            Dictionary containing combined video data
        """
        if not urls:
            raise ValueError("No URLs provided for processing")
        
        # Process videos concurrently
        video_data_list = []
        errors = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_url = {executor.submit(self._process_single_video, url): url for url in urls}
            
            # Process results as they complete
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    result = future.result()
                    if result:
                        video_data_list.append(result)
                except Exception as e:
                    errors.append({"url": url, "error": str(e)})
        
        # Combine data from all videos
        combined_data = self._combine_video_data(video_data_list)
        
        # Add processing summary
        combined_data["processing_summary"] = {
            "total_videos": len(urls),
            "successful": len(video_data_list),
            "failed": len(errors),
            "errors": errors
        }
        
        # Save combined data if requested
        if save and video_data_list:
            # Create a unique filename based on the batch
            filename = f"batch_{len(video_data_list)}_videos_{int(video_data_list[0]['metadata'].get('publish_date', '').split('T')[0].replace('-', '')) if video_data_list[0]['metadata'].get('publish_date') else 'combined'}.json"
            output_path = os.path.join(self.data_dir, filename)
            
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(combined_data, f, ensure_ascii=False, indent=2)
            
            combined_data["saved_path"] = output_path
        
        return combined_data
    
    def _process_single_video(self, url: str) -> Optional[Dict[str, Any]]:
        """Process a single YouTube video.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dictionary containing processed video data, or None if processing failed
        """
        try:
            return self.video_processor.process_video(url, save=True)
        except Exception as e:
            # Don't raise the exception, just return None to handle in the main loop
            return None
    
    def _combine_video_data(self, video_data_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine data from multiple videos into a single structure.
        
        Args:
            video_data_list: List of processed video data dictionaries
            
        Returns:
            Dictionary with combined video data
        """
        if not video_data_list:
            return {"videos": [], "combined_transcript": "", "combined_metadata": {}}
        
        # Extract basic metadata for all videos
        videos_metadata = []
        combined_transcript_text = ""
        combined_keywords = set()
        total_length = 0
        all_authors = set()
        all_transcripts = []
        
        # Process each video
        for i, video_data in enumerate(video_data_list):
            metadata = video_data["metadata"]
            videos_metadata.append({
                "id": metadata["id"],
                "title": metadata["title"],
                "author": metadata["author"],
                "length": metadata["length"],
                "url": metadata["url"],
                "thumbnail_url": metadata["thumbnail_url"],
                "views": metadata.get("views", 0),
                "publish_date": metadata.get("publish_date", None),
            })
            
            # Accumulate transcript text with video separator
            if video_data.get("transcript_text"):
                all_transcripts.append(video_data.get("transcript_text", ""))
                combined_transcript_text += f"\n\n--- VIDEO {i+1}: {metadata['title']} ---\n\n"
                combined_transcript_text += video_data.get("transcript_text", "")
            
            # Collect keywords
            if metadata.get("keywords"):
                combined_keywords.update(metadata.get("keywords", []))
            
            # Accumulate total length
            total_length += metadata.get("length", 0)
            
            # Collect authors
            all_authors.add(metadata.get("author", ""))
        
        # Create combined metadata
        combined_metadata = {
            "total_videos": len(video_data_list),
            "videos": videos_metadata,
            "total_length_seconds": total_length,
            "authors": list(all_authors),
            "keywords": list(combined_keywords),
            "videos_with_transcripts": len([v for v in all_transcripts if v]),
        }
        
        # Generate a summary title for the batch
        if len(videos_metadata) == 1:
            combined_metadata["title"] = videos_metadata[0]["title"]
        else:
            # Try to find a common theme in the titles
            titles = [v["title"] for v in videos_metadata]
            common_authors = ", ".join(list(all_authors)[:3]) + (" et al." if len(all_authors) > 3 else "")
            combined_metadata["title"] = f"Collection of {len(videos_metadata)} videos" + (f" by {common_authors}" if common_authors else "")
        
        # Return the combined data
        return {
            "combined_metadata": combined_metadata,
            "videos": video_data_list,
            "combined_transcript": combined_transcript_text,
            "all_keywords": list(combined_keywords),
        }