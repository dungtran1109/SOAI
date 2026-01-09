"""SQL migration runner for executing raw .sql files in order.

Usage:
  python -m app.sql_migrate_runner           # runs all .sql files alphabetically
"""

import os
import sys
from typing import List
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError
from config.database import engine
from config.log_config import AppLogger

logger = AppLogger(__name__)


def _sql_dir() -> str:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, "sql_migrations")


def _list_sql_files() -> List[str]:
    folder = _sql_dir()
    if not os.path.isdir(folder):
        return []
    files = [f for f in os.listdir(folder) if f.lower().endswith(".sql")]
    return sorted(files)


def _execute_sql_file(filename: str) -> None:
    path = os.path.join(_sql_dir(), filename)
    with open(path, "r", encoding="utf-8") as f:
        sql_text = f.read()
    # naive split on ";"; safe for simple DDL/DML; adjust if needed for complex scripts
    statements = [s.strip() for s in sql_text.split(";") if s.strip()]
    logger.info(f"Applying SQL migration: {filename} ({len(statements)} statements)")
    with engine.begin() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
            except (OperationalError, ProgrammingError) as e:
                msg = str(e).lower()
                # Ignore idempotent duplicates
                if "duplicate column" in msg or "already exists" in msg or "duplicate key" in msg:
                    logger.info(f"Ignoring idempotent error for statement: {stmt[:120]}... -> {e}")
                    continue
                logger.error(f"Error executing statement from {filename}: {e}")
                raise


def main():
    files = _list_sql_files()
    if not files:
        logger.info("No SQL migration files found.")
        return
    for fname in files:
        _execute_sql_file(fname)
    logger.info("All SQL migrations applied successfully.")


if __name__ == "__main__":
    main()
