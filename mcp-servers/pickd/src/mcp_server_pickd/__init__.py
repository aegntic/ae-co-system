import click
from pathlib import Path
import logging
import sys
from .server import serve

@click.command()
@click.option("--database", "-d", type=Path, help="SQLite database path (default: ~/.pickd.db)")
@click.option("-v", "--verbose", count=True)
def main(database: Path | None, verbose: bool) -> None:
    """Pickd - Your Personal Knowledge Base"""
    import asyncio

    logging_level = logging.WARN
    if verbose == 1:
        logging_level = logging.INFO
    elif verbose >= 2:
        logging_level = logging.DEBUG

    logging.basicConfig(level=logging_level, stream=sys.stderr)
    asyncio.run(serve(database))

if __name__ == "__main__":
    main()
