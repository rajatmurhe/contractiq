"""Consistent SQLite backup/restore; never overwrite an existing restore target."""
import argparse
import os
import sqlite3
from pathlib import Path


def snapshot(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise ValueError('Source database does not exist')
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation prevents accidental overwriting of live data or previous backups.
    fd = os.open(destination, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    os.close(fd)
    try:
        with sqlite3.connect(source.resolve().as_uri() + '?mode=ro', uri=True) as original:
            with sqlite3.connect(destination) as backup:
                original.backup(backup)
                if backup.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                    raise ValueError('Database integrity check failed')
    except Exception:
        destination.unlink(missing_ok=True)
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['backup', 'restore'])
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    snapshot(args.source, args.destination)
    print(f'{args.operation} completed; integrity check passed. Destination is private to its owner.')


if __name__ == '__main__':
    main()
