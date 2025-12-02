#!/usr/bin/env python3
"""
Script to remove all group data from the database.
This will delete:
1. All groups from the 'groups' collection
2. All location data from the 'group_locations' collection

Usage:
    python cleanup_groups.py
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "sikkim_tourism")


async def cleanup_groups():
    """Remove all group data from the database"""
    
    print(f"Connecting to MongoDB: {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB_NAME]
    
    try:
        # Get counts before deletion
        groups_count = await db.groups.count_documents({})
        locations_count = await db.group_locations.count_documents({})
        
        print(f"\n📊 Current state:")
        print(f"   - Groups: {groups_count}")
        print(f"   - Group locations: {locations_count}")
        
        if groups_count == 0 and locations_count == 0:
            print("\n✅ No group data found. Database is already clean.")
            return
        
        # Confirm deletion
        print(f"\n⚠️  WARNING: This will permanently delete:")
        print(f"   - {groups_count} group(s)")
        print(f"   - {locations_count} location record(s)")
        
        confirm = input("\nAre you sure you want to proceed? (yes/no): ").strip().lower()
        
        if confirm != "yes":
            print("\n❌ Operation cancelled.")
            return
        
        print("\n🗑️  Deleting group data...")
        
        # Delete all group locations
        locations_result = await db.group_locations.delete_many({})
        print(f"   ✓ Deleted {locations_result.deleted_count} location records")
        
        # Delete all groups
        groups_result = await db.groups.delete_many({})
        print(f"   ✓ Deleted {groups_result.deleted_count} groups")
        
        # Verify deletion
        remaining_groups = await db.groups.count_documents({})
        remaining_locations = await db.group_locations.count_documents({})
        
        print(f"\n✅ Cleanup complete!")
        print(f"   - Remaining groups: {remaining_groups}")
        print(f"   - Remaining locations: {remaining_locations}")
        
        if remaining_groups == 0 and remaining_locations == 0:
            print("\n🎉 All group data has been successfully removed!")
        else:
            print("\n⚠️  Warning: Some data may still remain. Please check manually.")
    
    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        raise
    
    finally:
        client.close()
        print("\n🔌 Database connection closed.")


async def list_groups():
    """List all existing groups (for verification)"""
    
    print(f"Connecting to MongoDB: {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB_NAME]
    
    try:
        groups_cursor = db.groups.find({})
        groups = await groups_cursor.to_list(length=None)
        
        if not groups:
            print("\n✅ No groups found in database.")
            return
        
        print(f"\n📋 Found {len(groups)} group(s):")
        print("-" * 80)
        
        for idx, group in enumerate(groups, 1):
            group_id = str(group.get("_id"))
            code = group.get("code")
            owner_id = str(group.get("owner_id"))
            members_count = len(group.get("members", []))
            created_at = group.get("created_at")
            
            print(f"\n{idx}. Group ID: {group_id}")
            print(f"   Code: {code}")
            print(f"   Owner: {owner_id}")
            print(f"   Members: {members_count}")
            print(f"   Created: {created_at}")
        
        print("-" * 80)
        
        # Also show location count
        locations_count = await db.group_locations.count_documents({})
        print(f"\n📍 Total location records: {locations_count}")
    
    except Exception as e:
        print(f"\n❌ Error listing groups: {e}")
        raise
    
    finally:
        client.close()


def main():
    """Main entry point"""
    import sys
    
    print("=" * 80)
    print("🧹 Friends Group Cleanup Utility")
    print("=" * 80)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        print("\n📋 Listing all groups...")
        asyncio.run(list_groups())
    else:
        asyncio.run(cleanup_groups())


if __name__ == "__main__":
    main()
