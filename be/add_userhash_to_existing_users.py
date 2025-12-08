"""
Migration script to add userhash to existing users and encrypt their data.

This script:
1. Finds all users without a userhash
2. Generates a random userhash for each
3. Encrypts their name, address, email, and hashed_password
4. Updates the user document

Run this once to migrate existing users to the encrypted format.
"""

import asyncio
import secrets
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import encryption functions
import sys
sys.path.append('.')
from app.utils.encryption import encrypt_text

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")


async def add_userhash_to_users():
    """Add userhash to existing users and encrypt their data"""
    print("Connecting to database...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB_NAME]
    collection = db.users
    
    # Find users without userhash
    users_without_hash = await collection.find({"userhash": {"$exists": False}}).to_list(length=None)
    
    print(f"Found {len(users_without_hash)} users without userhash")
    
    if not users_without_hash:
        print("All users already have userhash. No migration needed.")
        return
    
    for user in users_without_hash:
        user_id = str(user["_id"])
        print(f"\nProcessing user: {user_id}")
        
        try:
            # Generate random USERHASH
            userhash = secrets.token_hex(32)
            print(f"  Generated userhash: {userhash[:16]}...")
            
            # First, add userhash to the user document
            await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"userhash": userhash}}
            )
            print("  ✓ Added userhash to user document")
            
            # Now encrypt the sensitive fields
            # Get the current unencrypted values
            name = user.get("name", "")
            address = user.get("address", "")
            email = user.get("email", "")
            hashed_password = user.get("hashed_password", "")
            
            # Encrypt each field
            encrypted_name = await encrypt_text(user_id, name)
            encrypted_address = await encrypt_text(user_id, address)
            encrypted_email = await encrypt_text(user_id, email)
            encrypted_password = await encrypt_text(user_id, hashed_password)
            
            # Update user with encrypted fields
            await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "name": encrypted_name,
                    "address": encrypted_address,
                    "email": encrypted_email,
                    "hashed_password": encrypted_password
                }}
            )
            print("  ✓ Encrypted and updated all sensitive fields")
            print(f"  ✓ Successfully migrated user {user_id}")
            
        except Exception as e:
            print(f"  ✗ Error processing user {user_id}: {e}")
            continue
    
    print(f"\n{'='*50}")
    print(f"Migration complete!")
    print(f"Processed {len(users_without_hash)} users")
    print(f"{'='*50}")
    
    client.close()


if __name__ == "__main__":
    print("="*50)
    print("USERHASH Migration Script")
    print("="*50)
    print("\nThis script will:")
    print("1. Find all users without a userhash")
    print("2. Generate a random userhash for each")
    print("3. Encrypt their sensitive data (name, address, email, password)")
    print("\nWARNING: This will modify your database!")
    print("Make sure you have a backup before proceeding.")
    print("="*50)
    
    response = input("\nDo you want to continue? (yes/no): ")
    if response.lower() == "yes":
        asyncio.run(add_userhash_to_users())
    else:
        print("Migration cancelled.")
