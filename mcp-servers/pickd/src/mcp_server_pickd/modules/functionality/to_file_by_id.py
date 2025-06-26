from pathlib import Path
import logging
import os
from ..data_types import ToFileByIdCommand, PocketItem
from .get import get
from .get import GetCommand

logger = logging.getLogger(__name__)

def to_file_by_id(command: ToFileByIdCommand) -> bool:
    """
    Write pocket pick content with given ID to the specified file
    
    Args:
        command: ToFileByIdCommand with id, output_file_path and db_path
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # First get the item from the database
        get_command = GetCommand(
            id=command.id,
            db_path=command.db_path
        )
        
        item = get(get_command)
        
        if not item:
            logger.error(f"Item with ID {command.id} not found")
            return False
        
        # Ensure parent directory exists
        output_path = Path(command.output_file_path_abs)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write content to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(item.text)
        
        return True
    except Exception as e:
        logger.error(f"Error writing to file {command.output_file_path_abs}: {e}")
        return False