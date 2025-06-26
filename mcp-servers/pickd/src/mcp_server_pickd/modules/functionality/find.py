import sqlite3
import json
from datetime import datetime
from typing import List
import logging
import re
from ..data_types import FindCommand, PocketItem
from ..init_db import init_db, normalize_tags

logger = logging.getLogger(__name__)

def find(command: FindCommand) -> List[PocketItem]:
    """
    Find items in the pocket pick database matching the search criteria
    
    Args:
        command: FindCommand with search parameters
        
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
        where_clauses = []
        
        # Apply search mode
        if command.text:
            if command.mode == "substr":
                where_clauses.append("text LIKE ?")
                params.append(f"%{command.text}%")
            elif command.mode == "fts":
                try:
                    # First, try using FTS5 virtual table
                    # Replace normal query with FTS query
                    query = """
                    SELECT PICKD.id, PICKD.created, PICKD.text, PICKD.tags 
                    FROM pickd_fts 
                    JOIN PICKD ON pickd_fts.rowid = PICKD.rowid
                    """
                    
                    # FTS5 query syntax
                    if command.mode == "fts":
                        # Check for different query formats
                        
                        # Direct quoted phrase - user already provided quotes for exact phrases
                        if command.text.startswith('"') and command.text.endswith('"'):
                            # User wants exact phrase matching (e.g., "word1 word2")
                            # Just use it directly - FTS5 understands quoted phrases
                            search_term = command.text
                            logger.debug(f"Using quoted phrase search: {search_term}")
                            
                        # Multi-word regular search
                        elif ' ' in command.text:
                            # Default: Match all terms independently (AND behavior)
                            search_term = command.text
                            
                        # Single word search
                        else:
                            search_term = command.text
                    else:
                        search_term = command.text
                    
                    # Using standard FTS5 query approach
                    
                    # Set up FTS5 query parameters
                    where_clauses = [f"pickd_fts MATCH ?"]
                    params = [search_term]
                    
                    # FTS5 table doesn't have these columns, so we need to add tags filter separately
                    if normalized_tags:
                        tag_clauses = []
                        for tag in normalized_tags:
                            tag_clauses.append("PICKD.tags LIKE ?")
                            params.append(f"%\"{tag}\"%")
                        
                        where_clauses.append(f"({' AND '.join(tag_clauses)})")
                    
                    # We'll handle the query execution in a special way
                    use_fts5 = True
                except sqlite3.OperationalError:
                    # Fallback to basic LIKE-based search if FTS5 is not available
                    logger.warning("FTS5 not available, falling back to basic search")
                    use_fts5 = False
                    
                    # Standard fallback approach (original implementation)
                    search_words = command.text.split()
                    word_clauses = []
                    for word in search_words:
                        word_clauses.append("text LIKE ?")
                        params.append(f"%{word}%")
                    where_clauses.append(f"({' AND '.join(word_clauses)})")
            elif command.mode == "glob":
                where_clauses.append("text GLOB ?")
                params.append(command.text)
            elif command.mode == "regex":
                # We'll need to filter with regex after query
                pass
            elif command.mode == "exact":
                where_clauses.append("text = ?")
                params.append(command.text)
        
        # Apply tag filter if tags are specified
        if normalized_tags:
            # Find items that have all the specified tags
            # We need to check if each tag exists in the JSON array
            tag_clauses = []
            for tag in normalized_tags:
                tag_clauses.append("tags LIKE ?")
                # Use JSON substring matching, looking for the tag surrounded by quotes and commas or brackets
                params.append(f"%\"{tag}\"%")
            
            where_clauses.append(f"({' AND '.join(tag_clauses)})")
        
        # Handle query construction based on whether we're using FTS5
        if command.mode == "fts" and 'use_fts5' in locals() and use_fts5:
            # For FTS5, we've already constructed the base query
            if where_clauses:
                query += f" WHERE {' AND '.join(where_clauses)}"
            
            # Special ordering for FTS5 to get the best matches first
            query += f" ORDER BY rank, created DESC LIMIT {command.limit}"
            
            logger.debug(f"Using FTS5 query: {query}")
        else:
            # Standard query construction
            if where_clauses:
                query += f" WHERE {' AND '.join(where_clauses)}"
            
            # Apply limit
            query += f" ORDER BY created DESC LIMIT {command.limit}"
        
        # Execute query
        try:
            cursor = db.execute(query, params)
        except sqlite3.OperationalError as e:
            # If the FTS5 query fails, fall back to the basic query
            if command.mode == "fts" and 'use_fts5' in locals() and use_fts5:
                logger.warning(f"FTS5 query failed: {e}. Falling back to basic search.")
                
                # Reset to base query
                query = "SELECT id, created, text, tags FROM PICKD"
                params = []
                
                # Standard fallback approach
                if command.text:
                    search_words = command.text.split()
                    word_clauses = []
                    for word in search_words:
                        word_clauses.append("text LIKE ?")
                        params.append(f"%{word}%")
                    query += f" WHERE ({' AND '.join(word_clauses)})"
                
                    # Re-add tag filters if needed
                    if normalized_tags:
                        tag_clauses = []
                        for tag in normalized_tags:
                            tag_clauses.append("tags LIKE ?")
                            params.append(f"%\"{tag}\"%")
                        
                        query += f" AND ({' AND '.join(tag_clauses)})"
                    
                query += f" ORDER BY created DESC LIMIT {command.limit}"
                cursor = db.execute(query, params)
            else:
                # If it's not an FTS5 issue, re-raise the exception
                raise
        
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
            
            # Apply regex filter if needed (we do this after the SQL query)
            if command.mode == "regex" and command.text:
                try:
                    pattern = re.compile(command.text, re.IGNORECASE)
                    if not pattern.search(text):
                        continue
                except re.error:
                    logger.warning(f"Invalid regex pattern: {command.text}")
                    continue
            
            results.append(item)
        
        return results
    except Exception as e:
        logger.error(f"Error finding items: {e}")
        raise
    finally:
        db.close()