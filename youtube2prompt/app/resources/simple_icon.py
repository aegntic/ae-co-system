#!/usr/bin/env python3

import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
    
    # Create resources directory
    resources_dir = Path(__file__).parent.absolute()
    os.makedirs(resources_dir, exist_ok=True)
    output_path = resources_dir / "app_icon.png"
    
    # Create a blank image with a blue background
    size = 128
    img = Image.new('RGBA', (size, size), color=(0, 120, 215, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a white rounded rectangle (simulated since PIL doesn't have direct rounded rect)
    # First draw a filled rectangle
    draw.rectangle([(20, 20), (108, 108)], fill=(255, 255, 255, 220))
    
    # Add some film sprocket holes to simulate a film icon
    hole_size = size // 12
    hole_color = (43, 43, 43, 255)  # Dark gray
    
    # Draw film holes
    draw.ellipse([(10, 30), (10+hole_size, 30+hole_size)], fill=hole_color)
    draw.ellipse([(10, 80), (10+hole_size, 80+hole_size)], fill=hole_color)
    draw.ellipse([(108-hole_size, 30), (108, 30+hole_size)], fill=hole_color)
    draw.ellipse([(108-hole_size, 80), (108, 80+hole_size)], fill=hole_color)
    
    # Try to load a font, if not available use default
    try:
        font = ImageFont.truetype("Arial.ttf", 36)
    except IOError:
        font = ImageFont.load_default()
    
    # Draw the text in the center
    text = "YT"
    # Get text size to center it properly
    try:
        text_size = draw.textlength(text, font=font)
        text_position = ((size - text_size) / 2, size/2 - 20)
        draw.text(text_position, text, fill=(0, 78, 152, 255), font=font)
    except Exception as e:
        # Fallback to a simpler method if the above fails
        draw.text((50, 50), text, fill=(0, 78, 152, 255))
    
    # Save the image
    img.save(output_path)
    print(f"Icon successfully created and saved to: {output_path}")
    
except Exception as e:
    print(f"Error creating icon: {e}")
    print("No icon created. The application will use system defaults.")