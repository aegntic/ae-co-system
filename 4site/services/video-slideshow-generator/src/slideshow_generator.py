"""Slideshow generation functionality"""

import logging
from pathlib import Path
from typing import Any, Dict, List
from PIL import Image, ImageDraw, ImageFont
import json

logger = logging.getLogger(__name__)

class SlideshowGenerator:
    def __init__(self, settings):
        self.settings = settings
        self.output_dir = Path(settings.output_directory)
        
    async def generate_slideshow(
        self, project_id: str, content_sections: List[Dict], 
        design_settings: Dict, project_metadata: Dict
    ) -> Dict[str, Any]:
        """Generate interactive slideshow"""
        try:
            slides = []
            for i, section in enumerate(content_sections):
                slide = self._create_slide(section, i, design_settings)
                slides.append(slide)
            
            # Generate HTML slideshow
            html_path = await self._generate_html_slideshow(
                project_id, slides, project_metadata
            )
            
            return {
                "success": True,
                "output_path": str(html_path),
                "slide_count": len(slides),
            }
        except Exception as e:
            logger.error(f"Slideshow generation failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _create_slide(self, section: Dict, index: int, settings: Dict) -> Dict:
        """Create a single slide"""
        return {
            "id": f"slide_{index}",
            "title": section.get("title", f"Slide {index + 1}"),
            "content": section.get("content", ""),
            "background_color": self._get_slide_color(index),
        }
    
    def _get_slide_color(self, index: int) -> str:
        colors = ["#3498db", "#9b59b6", "#1abc9c", "#f1c40f", "#e67e22"]
        return colors[index % len(colors)]
    
    async def _generate_html_slideshow(
        self, project_id: str, slides: List[Dict], metadata: Dict
    ) -> Path:
        """Generate HTML slideshow file"""
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{metadata.get('name', 'Project')} - Slideshow</title>
    <style>
        .slideshow {{ width: 100%; height: 100vh; overflow: hidden; }}
        .slide {{ width: 100%; height: 100vh; display: none; padding: 2rem; }}
        .slide.active {{ display: flex; flex-direction: column; justify-content: center; }}
        .slide h1 {{ font-size: 3rem; margin-bottom: 2rem; }}
        .slide p {{ font-size: 1.5rem; line-height: 1.6; }}
    </style>
</head>
<body>
    <div class="slideshow">
        {''.join(f'<div class="slide" style="background-color: {slide["background_color"]}"><h1>{slide["title"]}</h1><p>{slide["content"][:200]}...</p></div>' for slide in slides)}
    </div>
    <script>
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        slides[0].classList.add('active');
        
        setInterval(() => {{
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }}, 5000);
    </script>
</body>
</html>"""
        
        output_path = self.output_dir / f"slideshow_{project_id}.html"
        with open(output_path, 'w') as f:
            f.write(html_content)
        
        return output_path