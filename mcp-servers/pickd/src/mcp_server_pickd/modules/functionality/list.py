import sqlite3
import json
from datetime import datetime
from typing import List
import logging
from ..data_types import ListCommand, PocketItem
from ..init_db import init_db, normalize_tags

logger = logging.getLogger(__name__)

def list_items(command: ListCommand) -> List[PocketItem]:
    """
    List items in the pocket pick database, optionally filtered by tags
    
    Args:
        command: ListCommand with optional tag filters and limit
        
    Returns:
        List[PocketItem]: List of matching items
    """
    # Normalize tags
    normalized_tags = normalize_tags(command.tags) if command.tags else []
    
    # Connect to database
    db = init_db(command.db_path)
    
    try:
        # Base query
        query = "SELECT id, created, text, tags FROM PICKD"
        params = []
        
        # Apply tag filter if tags are specified
        if normalized_tags:
            # We need to check if each tag exists in the JSON array
            tag_clauses = []
            for tag in normalized_tags:
                tag_clauses.append("tags LIKE ?")
                # Use JSON substring matching, looking for the tag surrounded by quotes and commas or brackets
                params.append(f"%\"{tag}\"%")
            
            query += f" WHERE {' AND '.join(tag_clauses)}"
        
        # Apply order and limit
        query += f" ORDER BY created DESC LIMIT {command.limit}"
        
        # Execute query
        cursor = db.execute(query, params)
        
        # Process results
        results = []
        for row in cursor.fetchall():
            id, created_str, text, tags_json = row
            
            # Parse the created timestamp
            created = datetime.fromisoformat(created_str)
            
            # Parse the tags JSON
            tags = json.loads(tags_json)
            
            # Create item
            item = PocketItem(
                id=id,
                created=created,
                text=text,
                tags=tags
            )
            
            results.append(item)
        
        return results
    except Exception as e:
        logger.error(f"Error listing items: {e}")
        raise
    finally:
        db.close()