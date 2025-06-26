#!/usr/bin/env python3

import os
import sys
from pathlib import Path

try:
    from PySide6.QtGui import QIcon, QPixmap, QPainter, QColor, QFont, QBrush, QLinearGradient
    from PySide6.QtCore import Qt, QSize, QRect
    print("PySide6 modules imported successfully")
except ImportError as e:
    print(f"Error importing PySide6: {e}")
    print("Falling back to creating a simple icon")
    # Simple fallback icon creation logic will be here
    sys.exit(1)

# Create resources directory
resources_dir = Path(__file__).parent.absolute()
os.makedirs(resources_dir, exist_ok=True)
output_path = resources_dir / "app_icon.png"

try:
    # Create app icon
    size = 128
    pixmap = QPixmap(size, size)
    pixmap.fill(Qt.transparent)
    
    # Create painter
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing)
    
    # Define colors
    primary_color = QColor("#0078D7")  # Microsoft Blue
    accent_color = QColor("#2B2B2B")   # Dark Gray
    
    # Create gradient background
    gradient = QLinearGradient(0, 0, size, size)
    gradient.setColorAt(0, primary_color)
    gradient.setColorAt(1, QColor(primary_color).darker(150))
    
    # Draw rounded rectangle background
    painter.setPen(Qt.NoPen)
    painter.setBrush(QBrush(gradient))
    painter.drawRoundedRect(QRect(4, 4, size-8, size-8), 16, 16)
    
    # Draw film icon shape
    painter.setPen(Qt.NoPen)
    painter.setBrush(QBrush(QColor("white")))
    
    # Film strip base
    rect = QRect(size//4, size//4, size//2, size//2)
    painter.drawRoundedRect(rect, 8, 8)
    
    # Film holes
    hole_size = size // 12
    hole_margin = size // 24
    
    # Left film holes
    painter.setBrush(QBrush(accent_color))
    painter.drawEllipse(hole_margin, size//4 + hole_margin, hole_size, hole_size)
    painter.drawEllipse(hole_margin, size*3//4 - hole_margin - hole_size, hole_size, hole_size)
    
    # Right film holes
    painter.drawEllipse(size - hole_margin - hole_size, size//4 + hole_margin, hole_size, hole_size)
    painter.drawEllipse(size - hole_margin - hole_size, size*3//4 - hole_margin - hole_size, hole_size, hole_size)
    
    # Add YT letters
    painter.setFont(QFont("Arial", size // 6, QFont.Bold))
    painter.setPen(QColor(primary_color))
    painter.drawText(rect, Qt.AlignCenter, "YT")
    
    # End painting
    painter.end()
    
    # Save icon
    pixmap.save(str(output_path))
    print(f"Icon successfully created and saved to: {output_path}")

except Exception as e:
    print(f"Error creating icon: {e}")
    
    # Create a very simple fallback icon
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create a blank image with a blue background
        img = Image.new('RGBA', (128, 128), color=(0, 120, 215, 255))
        draw = ImageDraw.Draw(img)
        
        # Draw a simple shape
        draw.rounded_rectangle([(20, 20), (108, 108)], radius=10, fill=(255, 255, 255, 220))
        draw.text((64, 64), "YT", fill=(0, 0, 0, 255), anchor="mm")
        
        # Save the image
        img.save(output_path)
        print(f"Simple fallback icon created and saved to: {output_path}")
        
    except Exception as fallback_error:
        print(f"Could not create fallback icon: {fallback_error}")
        print("No icon created. The application will use system defaults.")