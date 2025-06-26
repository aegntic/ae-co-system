import sqlite3
import shutil
import logging
from ..data_types import BackupCommand
from ..init_db import init_db

logger = logging.getLogger(__name__)

def backup(command: BackupCommand) -> bool:
    """
    Backup the pocket pick database to a specified location
    
    Args:
        command: BackupCommand with backup destination path
        
    Returns:
        bool: True if backup was successful, False otherwise
    """
    # Make sure source DB exists by initializing it if needed
    db = init_db(command.db_path)
    db.close()
    
    try:
        # Create parent directories if they don't exist
        command.backup_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy the database file to the backup location
        shutil.copy2(command.db_path, command.backup_path)
        
        # Verify the backup file exists
        if command.backup_path.exists():
            logger.info(f"Backup created successfully at {command.backup_path}")
            return True
        else:
            logger.error(f"Backup file not found at {command.backup_path}")
            return False
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        return False