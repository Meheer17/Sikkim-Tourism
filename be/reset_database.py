#!/usr/bin/env python3
"""
MongoDB Database Reset Script
Drops all collections and initializes database with an admin user.

WARNING: This will delete ALL data in the database!
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")

# Admin user credentials
ADMIN_EMAIL = "admin@sikkimtourism.com"
ADMIN_PASSWORD = "Admin@ST25"
ADMIN_NAME = "System Administrator"


class DatabaseResetter:
    def __init__(self):
        self.client = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(MONGODB_URL)
        self.db = self.client[MONGODB_DB_NAME]
        print(f"✓ Connected to MongoDB: {MONGODB_DB_NAME}")
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("✓ MongoDB connection closed")
    
    async def drop_all_collections(self):
        """Drop all collections in the database"""
        collections = await self.db.list_collection_names()
        
        if not collections:
            print("ℹ No collections to drop")
            return
        
        print(f"\n⚠️  Found {len(collections)} collection(s) to drop:")
        for collection in collections:
            count = await self.db[collection].count_documents({})
            print(f"   - {collection} ({count} documents)")
        
        # Confirm before deleting
        print("\n" + "=" * 80)
        print("⚠️  WARNING: This will DELETE ALL DATA in the database!")
        print("=" * 80)
        response = input("\nType 'YES' to confirm deletion: ").strip()
        
        if response != "YES":
            print("\n❌ Operation cancelled")
            return False
        
        print("\n🗑️  Dropping collections...")
        for collection in collections:
            await self.db[collection].drop()
            print(f"   ✓ Dropped {collection}")
        
        print("\n✓ All collections dropped successfully")
        return True
    
    async def create_admin_user(self):
        """Create initial admin user"""
        print("\n👤 Creating admin user...")
        
        # Create admin user document
        admin_user = {
            "name": ADMIN_NAME,
            "address": "Sikkim Tourism Office",
            "gender": "other",
            "email": ADMIN_EMAIL,
            "hashed_password": ADMIN_PASSWORD,  # Password stored as-is (no hashing in this system)
            "role": "admin",
            "approved": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Insert admin user
        result = await self.db.users.insert_one(admin_user)
        
        print(f"   ✓ Admin user created successfully")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print(f"   User ID: {result.inserted_id}")
        print(f"   Role: admin")
        print(f"   Approved: True")
    
    async def create_indexes(self):
        """Create necessary indexes for collections"""
        print("\n📑 Creating indexes...")
        
        # Users collection indexes
        await self.db.users.create_index("email", unique=True)
        print("   ✓ Created unique index on users.email")
        
        # Add more indexes as needed for other collections
        # Example:
        # await self.db.places.create_index("name")
        # await self.db.businesses.create_index("email", unique=True)
    
    async def verify_setup(self):
        """Verify the database setup"""
        print("\n✅ Verifying database setup...")
        
        # Check collections
        collections = await self.db.list_collection_names()
        print(f"   Collections: {len(collections)}")
        for collection in collections:
            count = await self.db[collection].count_documents({})
            print(f"   - {collection}: {count} document(s)")
        
        # Verify admin user
        admin = await self.db.users.find_one({"email": ADMIN_EMAIL})
        if admin:
            print(f"\n   ✓ Admin user verified:")
            print(f"     - Email: {admin['email']}")
            print(f"     - Role: {admin['role']}")
            print(f"     - Approved: {admin['approved']}")
        else:
            print("\n   ❌ Admin user not found!")
    
    async def reset(self):
        """Complete database reset procedure"""
        print("\n" + "=" * 80)
        print("DATABASE RESET UTILITY")
        print("=" * 80)
        
        await self.connect()
        
        # Drop all collections
        dropped = await self.drop_all_collections()
        
        if not dropped:
            await self.close()
            return
        
        # Create admin user
        await self.create_admin_user()
        
        # Create indexes
        await self.create_indexes()
        
        # Verify setup
        await self.verify_setup()
        
        print("\n" + "=" * 80)
        print("✅ DATABASE RESET COMPLETED SUCCESSFULLY")
        print("=" * 80)
        print("\nYou can now login with:")
        print(f"  Email: {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
        print()
        
        await self.close()


async def main():
    """Main function"""
    import sys
    
    resetter = DatabaseResetter()
    
    # Check for --force flag to skip confirmation
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        print("⚠️  Running in FORCE mode - skipping confirmation!")
        print("Connecting to database...")
        await resetter.connect()
        
        collections = await resetter.db.list_collection_names()
        for collection in collections:
            await resetter.db[collection].drop()
            print(f"✓ Dropped {collection}")
        
        await resetter.create_admin_user()
        await resetter.create_indexes()
        await resetter.verify_setup()
        
        print("\n✅ Database reset completed")
        await resetter.close()
    else:
        await resetter.reset()


if __name__ == "__main__":
    asyncio.run(main())
