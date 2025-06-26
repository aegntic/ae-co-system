import pytest
import tempfile
import os
from pathlib import Path
import sqlite3
from ..modules.init_db import init_db, normalize_tag, normalize_tags

def test_init_db():
    # Create a temporary file path
    fd, path = tempfile.mkstemp()
    os.close(fd)
    
    try:
        # Initialize database with the temp path
        db_path = Path(path)
        db = init_db(db_path)
        
        # Verify connection is open
        assert isinstance(db, sqlite3.Connection)
        
        # Verify PICKD table exists
        cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='PICKD'")
        assert cursor.fetchone() is not None
        
        # Verify indexes exist
        cursor = db.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_pickd_created'")
        assert cursor.fetchone() is not None
        
        cursor = db.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_pickd_text'")
        assert cursor.fetchone() is not None
        
        # Close the connection
        db.close()
    finally:
        # Clean up the temp file
        if os.path.exists(path):
            os.unlink(path)
            
def test_normalize_tag():
    # Test lowercase conversion
    assert normalize_tag("TAG") == "tag"
    
    # Test whitespace trimming
    assert normalize_tag("  tag  ") == "tag"
    
    # Test space replacement
    assert normalize_tag("my tag") == "my-tag"
    
    # Test underscore replacement
    assert normalize_tag("my_tag") == "my-tag"
    
    # Test combined operations
    assert normalize_tag("  MY_TAG with SPACES  ") == "my-tag-with-spaces"
    
def test_normalize_tags():
    tags = ["TAG1", "  tag2  ", "my_tag3", "My Tag4"]
    normalized = normalize_tags(tags)
    
    assert normalized == ["tag1", "tag2", "my-tag3", "my-tag4"]