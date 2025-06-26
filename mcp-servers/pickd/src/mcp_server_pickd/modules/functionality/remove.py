import sqlite3
import logging
from ..data_types import RemoveCommand
from ..init_db import init_db

logger = logging.getLogger(__name__)

def remove(command: RemoveCommand) -> bool:
    """
    Remove an item from the pocket pick database by ID
    
    Args:
        command: RemoveCommand with item ID
        
    Returns:
        bool: True if an item was removed, False if no matching item was found
    """
    # Connect to database
    db = init_db(command.db_path)
    
    try:
        # Delete item with given ID
        cursor = db.execute("DELETE FROM PICKD WHERE id = ?", (command.id,))
        
        # Commit the transaction
        db.commit()
        
        # Check if any row was affected
        return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error removing item {command.id}: {e}")
        raise
    finally:
        db.close()