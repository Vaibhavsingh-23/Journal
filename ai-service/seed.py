"""
seed.py
=======
One-shot CLI script to seed ChromaDB with journal entries from MongoDB.

Usage:
    # Seed by username (most convenient — looks up the ObjectId automatically)
    python seed.py --username abcdef

    # Seed by MongoDB ObjectId (if you already know it)
    python seed.py --user-id 64a1b2c3d4e5f6a7b8c9d0e1

    # Seed ALL users in the database
    python seed.py --all

    # Just list all users and their IDs (discovery mode)
    python seed.py --list-users

    # Dry-run — show what would be seeded without writing to ChromaDB
    python seed.py --username abcdef --dry-run

Run from the ai-service/ directory:
    cd d:\\Journal\\ai-service
    python seed.py --list-users
"""

import os
import sys
import argparse
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# MongoDB helpers
# ---------------------------------------------------------------------------

def get_db():
    """Connect to MongoDB and return the database object."""
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DB_NAME", "journaldb")
    if not uri:
        log.error("MONGO_URI is not set in .env — cannot connect to MongoDB.")
        sys.exit(1)
    client = MongoClient(uri, serverSelectionTimeoutMS=10_000)
    return client[db_name]


def list_all_users(db) -> list[dict]:
    """Return all users from the 'users' collection as plain dicts."""
    users = list(db["users"].find({}, {"_id": 1, "username": 1, "email": 1}))
    return users


def find_user_by_username(db, username: str) -> dict | None:
    """Find a single user document by username (case-sensitive)."""
    return db["users"].find_one(
        {"username": username},
        {"_id": 1, "username": 1, "email": 1},
    )


def count_entries_for_user(db, user_id_obj) -> int:
    """Count journal entries owned by user_id_obj."""
    return db["journal_entries"].count_documents({"userId": user_id_obj})


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

def seed_user(user_id_str: str, username: str, dry_run: bool) -> dict:
    """
    Embed all journal entries for one user into ChromaDB.

    Args:
        user_id_str (str): Hex ObjectId string of the user.
        username    (str): Display name for log messages.
        dry_run     (bool): If True, skip the actual embedding call.

    Returns:
        dict: Result from embed_all_entries() or a dry-run placeholder.
    """
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Seeding user: {username!r}  (id={user_id_str})")

    if dry_run:
        print("  ➜  Dry run — skipping ChromaDB write.")
        return {"status": "dry_run", "user_id": user_id_str}

    # Import here so module-level ChromaDB/Gemini init only happens when needed
    from services.embedding_service import embed_all_entries

    result = embed_all_entries(user_id=user_id_str)
    status        = result.get("status", "unknown")
    embedded      = result.get("embedded_count", 0)
    skipped       = result.get("skipped_count", 0)
    detail        = result.get("detail", "")

    if status == "done":
        print(f"  [OK]  Done -- embedded: {embedded}, skipped (empty/error): {skipped}")
    else:
        print(f"  [ERROR]  {detail}")

    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="seed.py",
        description="Seed ChromaDB with journal entries from MongoDB.",
    )
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--username",
        metavar="USERNAME",
        help="Seed by username (looks up the ObjectId automatically).",
    )
    group.add_argument(
        "--user-id",
        metavar="OBJECT_ID",
        dest="user_id",
        help="Seed by raw MongoDB ObjectId hex string.",
    )
    group.add_argument(
        "--all",
        action="store_true",
        help="Seed ALL users in the database.",
    )
    group.add_argument(
        "--list-users",
        action="store_true",
        dest="list_users",
        help="List all users and their IDs (no seeding).",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be seeded without writing to ChromaDB.",
    )
    return p


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    # ── Connect to MongoDB ────────────────────────────────────────────────
    try:
        db = get_db()
        # Force a connection check
        db.client.admin.command("ping")
        log.info("Connected to MongoDB ✓")
    except PyMongoError as e:
        log.error("Could not connect to MongoDB: %s", e)
        sys.exit(1)

    # ── --list-users ──────────────────────────────────────────────────────
    if args.list_users:
        users = list_all_users(db)
        if not users:
            print("\nNo users found in the database.")
            return
        print(f"\n{'-'*62}")
        print(f"  {'USERNAME':<20}  {'OBJECT ID':<28}  ENTRIES")
        print(f"{'-'*62}")
        for u in users:
            uid_obj  = u["_id"]
            uid_str  = str(uid_obj)
            uname    = u.get("username", "(unknown)")
            n        = count_entries_for_user(db, uid_obj)
            print(f"  {uname:<20}  {uid_str:<28}  {n}")
        print(f"{'-'*62}")
        print(f"\n  Total users: {len(users)}")
        print("\nTo seed a specific user run:")
        print("  python seed.py --username <USERNAME>")
        print("  python seed.py --user-id  <OBJECT_ID>")
        return

    # ── --username ────────────────────────────────────────────────────────
    if args.username:
        user_doc = find_user_by_username(db, args.username)
        if not user_doc:
            print(f"\n❌  No user found with username '{args.username}'.")
            print("Tip: run  python seed.py --list-users  to see all usernames.")
            sys.exit(1)
        uid_str = str(user_doc["_id"])
        seed_user(uid_str, args.username, args.dry_run)
        return

    # ── --user-id ─────────────────────────────────────────────────────────
    if args.user_id:
        seed_user(args.user_id, args.user_id, args.dry_run)
        return

    # ── --all ─────────────────────────────────────────────────────────────
    if args.all:
        users = list_all_users(db)
        if not users:
            print("\nNo users found in the database.")
            return
        print(f"\nSeeding {len(users)} user(s)…")
        total_embedded = 0
        for u in users:
            uid_str = str(u["_id"])
            uname   = u.get("username", uid_str)
            result  = seed_user(uid_str, uname, args.dry_run)
            total_embedded += result.get("embedded_count", 0)
        print("[ALL DONE] Total entries embedded: " + str(total_embedded))


if __name__ == "__main__":
    main()
