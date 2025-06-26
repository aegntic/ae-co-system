import sqlite3
import json
from typing import List, Dict
import logging
from ..data_types import ListTagsCommand
from ..init_db import init_db

logger = logging.getLogger(__name__)

def list_tags(command: ListTagsCommand) -> List[Dict[str, int]]:
    """
    List all tags in the pocket pick database with their counts
    
    Args:
        command: ListTagsCommand with limit
        
    Returns:
        List[Dict[str, int]]: List of dicts with tag name and count
    """
    # Connect to database
    db = init_db(command.db_path)
    
    try:
        # Get all tags with their counts
        cursor = db.execute("SELECT tags FROM PICKD")
        
        # Process results to count tags
        tag_counts = {}
        for (tags_json,) in cursor.fetchall():
            tags = json.loads(tags_json)
            for tag in tags:
                if tag in tag_counts:
                    tag_counts[tag] += 1
                else:
                    tag_counts[tag] = 1
        
        # Sort by count (descending) and then alphabetically
        sorted_tags = sorted(tag_counts.items(), key=lambda x: (-x[1], x[0]))
        
        # Apply limit and format result
        result = [{"tag": tag, "count": count} for tag, count in sorted_tags[:command.limit]]
        
        return result
    except Exception as e:
        logger.error(f"Error listing tags: {e}")
        raise
    finally:
        db.close()