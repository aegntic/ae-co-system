import sqlite3
import json
from datetime import datetime
import logging
from typing import Optional
from ..data_types import GetCommand, PocketItem
from ..init_db import init_db

logger = logging.getLogger(__name__)

def get(command: GetCommand) -> Optional[PocketItem]:
    """
    Get an item from the pocket pick database by ID
    
    Args:
        command: GetCommand with item ID
        
    Returns:
        Optional[PocketItem]: The item if found, None otherwise
    """
    # Connect to database
    db = init_db(command.db_path)
    
    try:
        # Query for item with given ID
        cursor = db.execute(
            "SELECT id, created, text, tags FROM PICKD WHERE id = ?",
            (command.id,)
        )
        
        # Fetch the row
        row = cursor.fetchone()
        
        # If no row was found, return None
        if row is None:
            return None
        
        # Process the row
        id, created_str, text, tags_json = row
        
        # Parse the created timestamp
        created = datetime.fromisoformat(created_str)
        
        # Parse the tags JSON
        tags = json.loads(tags_json)
        
        # Create and return the item
        return PocketItem(
            id=id,
            created=created,
            text=text,
            tags=tags
        )
    except Exception as e:
        logger.error(f"Error getting item {command.id}: {e}")
        raise
    finally:
        db.close()