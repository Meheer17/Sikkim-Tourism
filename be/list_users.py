"""
Script to list all users' emails and passwords from the database.
Note: Passwords are stored as hashed values for security.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


async def list_users():
    """Fetch and display all users' emails and hashed passwords."""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Fetch all users from the users collection
        users_collection = db["users"]
        users = await users_collection.find({}).to_list(length=None)
        
        if not users:
            print("No users found in the database.")
            return
        
        print(f"\n{'='*80}")
        print(f"Total Users: {len(users)}")
        print(f"{'='*80}\n")
        
        # Display each user's information
        for idx, user in enumerate(users, 1):
            print(f"User {idx}:")
            print(f"  ID: {user.get('_id')}")
            print(f"  Name: {user.get('name')}")
            print(f"  Email: {user.get('email')}")
            print(f"  Role: {user.get('role')}")
            print(f"  Approved: {user.get('approved')}")
            print(f"  Hashed Password: {user.get('hashed_password')}")
            print(f"  Created At: {user.get('created_at')}")
            print(f"{'-'*80}\n")
        
        # Optional: Export to CSV
        print("\nWould you like to export this to a CSV file? (This is just a display script)")
        
    except Exception as e:
        print(f"Error fetching users: {e}")
    finally:
        # Close the connection
        client.close()
        print("MongoDB connection closed.")


async def list_users_simple():
    """Fetch and display only emails and passwords in a simple format."""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Fetch all users from the users collection
        users_collection = db["users"]
        users = await users_collection.find({}, {"email": 1, "hashed_password": 1}).to_list(length=None)
        
        if not users:
            print("No users found in the database.")
            return
        
        print(f"\n{'='*100}")
        print(f"{'Email':<40} | {'Hashed Password'}")
        print(f"{'='*100}")
        
        for user in users:
            email = user.get('email', 'N/A')
            hashed_password = user.get('hashed_password', 'N/A')
            print(f"{email:<40} | {hashed_password}")
        
        print(f"{'='*100}")
        print(f"\nTotal Users: {len(users)}")
        
    except Exception as e:
        print(f"Error fetching users: {e}")
    finally:
        # Close the connection
        client.close()


if __name__ == "__main__":
    print("Select an option:")
    print("1. Detailed user information")
    print("2. Simple email and password list")
    
    choice = input("\nEnter your choice (1 or 2): ").strip()
    
    if choice == "1":
        asyncio.run(list_users())
    elif choice == "2":
        asyncio.run(list_users_simple())
    else:
        print("Invalid choice. Running detailed view by default...")
        asyncio.run(list_users())
