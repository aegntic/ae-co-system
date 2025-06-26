# Pickd - Your Personal Knowledge Base

As engineers we end up reusing ideas, patterns and code snippets all the time but keeping track of these snippets can be hard and remembering where you stored them can be even harder. What if the exact snippet or idea you were looking for was one prompt away?

With Anthropics new MCP (model context protocol) and a minimal portable database layer - we can solve this problem. Pickd is your personal engineering knowledge base that lets you quickly store ideas, patterns and code snippets and gives you a DEAD SIMPLE text or tag based searching to quickly find them in the future.

To implement this we'll...
1. Build the key sqlite functionality
2. Test the functionality with pytest
3. Expose the functionality via MCP server.

## SQLITE Database Structure

```
CREATE TABLE if not exists POCKET_PICK {
    id: str,
    created: datetime,
    text: str,
    tags: str[],
}
```

## Implementation Notes
- DEFAULT_SQLITE_DATABASE_PATH = Path.home() / ".pocket_pick.db" - place in constants.py
- always force (auto update) tags to be lowercase, trim whitespace, and use dash instead of spaces or underscores.
- mcp comands will return whatever the command returns.
- mirror ai_docs/mcp-server-git-repomix-output.xml structure to understand how to setup the mcp server
- use ai_docs/paic-pkb-repomix-output.xml to get a rough understanding of what we're building.
- libraries should be
  - click
  - mcp
  - pydantic
  - pytest (dev dependency)
  - sqlite3 (standard library)
- use `uv add <package>` to add libraries.
- we're using uv to manage the project.
- add mcp-server-pickd = "mcp_server_pocket_pick:main" to the project.scripts section in pyproject.toml

## API

```
pocket add <text> \
    --tags, t: str[] (optional)
    --db: str = DEFAULT_SQLITE_DATABASE_PATH

pocket find <text> \
    --mode: substr | fts | glob | regex | exact (optional) \
    --limit, -l: number = 5 \
    --info, -i: bool (show with metadata like id) \
    --tags, -t: str[] (optional) \
    --db: str = DEFAULT_SQLITE_DATABASE_PATH

pocket list \
    --tags, -t: str[] (optional) \
    --limit, -l: number = 100 \
    --db: str = DEFAULT_SQLITE_DATABASE_PATH

pocket list-tags \
    --limit, -l: number = 1000 \
    --db: str = DEFAULT_SQLITE_DATABASE_PATH

pocket remove \
    --id, -i: str \
    --db: str = DEFAULT_SQLITE_DATABASE_PATH

pocket get \
    --id, -i: str \
    --db: str = DEFAULT_SQLITE_DATABASE_PATH

pocket backup <backup_absolute_path> \
    --db: str = DEFAULT_SQLITE_DATABASE_PATH
```

### Example API Calls (for find modes)
```
# basic sqlite substring search
pocket find "test" --mode substr

# full text search
pocket find "test" --mode fts

# glob search
pocket find "test*" --mode glob

# regex search
pocket find "^start.*test.*$" --mode regex

# exact search
pocket find "match exactly test" --mode exact
```

## Project Structure
- src/
  - mcp_server_pocket_pick/
    - __init__.py - MIRROR ai_docs/mcp-server-git-repomix-output.xml
    - __main__.py - MIRROR ai_docs/mcp-server-git-repomix-output.xml
    - server.py - MIRROR but use our functionality
      - serve(sqlite_database: Path | None) -> None
      - pass sqlite_database to every tool call (--db arg)
    - modules/
      - __init__.py
      - init_db.py
      - data_types.py
        - class AddCommand(BaseModel) {text: str, tags: list[str] = [], db_path: Path = DEFAULT_SQLITE_DATABASE_PATH}
        - ...
      - constants.py
        - DEFAULT_SQLITE_DATABASE_PATH: Path = Path.home() / ".pocket_pick.db"
      - functionality/
        - add.py
        - find.py
        - list.py
        - list_tags.py
        - remove.py
        - get.py
        - backup.py
    - tests/
      - __init__.py
      - test_init_db.py
      - functionality/
        - test_add.py
        - test_find.py
        - test_list.py
        - test_list_tags.py
        - test_remove.py
        - test_get.py
        - test_backup.py
    

## Validation (close the loop)
- use `uv run pytest` to validate the tests pass.
- use `uv run mcp-server-pickd --help` to validate the mcp server works.