#!/usr/bin/env python3
"""
MongoDB Database Viewer
View all data from MongoDB collections including users, places, businesses, etc.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime
from bson import ObjectId
import json

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")


class MongoDBViewer:
    def __init__(self):
        self.client = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(MONGODB_URL)
        self.db = self.client[MONGODB_DB_NAME]
        print(f"✓ Connected to MongoDB: {MONGODB_DB_NAME}\n")
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("\n✓ MongoDB connection closed")
    
    def format_value(self, value):
        """Format values for display"""
        if isinstance(value, ObjectId):
            return str(value)
        elif isinstance(value, datetime):
            return value.strftime("%Y-%m-%d %H:%M:%S")
        elif isinstance(value, dict):
            return json.dumps({k: self.format_value(v) for k, v in value.items()}, indent=2)
        elif isinstance(value, list):
            return [self.format_value(v) for v in value]
        return value
    
    def print_document(self, doc, indent=0):
        """Pretty print a document"""
        prefix = "  " * indent
        for key, value in doc.items():
            formatted_value = self.format_value(value)
            if isinstance(formatted_value, dict):
                print(f"{prefix}{key}:")
                self.print_document(formatted_value, indent + 1)
            elif isinstance(formatted_value, list) and formatted_value and isinstance(formatted_value[0], dict):
                print(f"{prefix}{key}:")
                for i, item in enumerate(formatted_value):
                    print(f"{prefix}  [{i}]:")
                    self.print_document(item, indent + 2)
            else:
                print(f"{prefix}{key}: {formatted_value}")
    
    async def list_collections(self):
        """List all collections in the database"""
        collections = await self.db.list_collection_names()
        print("=" * 80)
        print("COLLECTIONS IN DATABASE")
        print("=" * 80)
        for i, collection in enumerate(collections, 1):
            count = await self.db[collection].count_documents({})
            print(f"{i}. {collection} ({count} documents)")
        print()
        return collections
    
    async def view_collection(self, collection_name):
        """View all documents in a collection"""
        collection = self.db[collection_name]
        count = await collection.count_documents({})
        
        print("=" * 80)
        print(f"COLLECTION: {collection_name.upper()} ({count} documents)")
        print("=" * 80)
        
        if count == 0:
            print("No documents found.\n")
            return
        
        cursor = collection.find({})
        documents = await cursor.to_list(length=None)
        
        for i, doc in enumerate(documents, 1):
            print(f"\n--- Document {i}/{count} ---")
            self.print_document(doc)
        
        print()
    
    async def view_all(self):
        """View all collections and their data"""
        collections = await self.list_collections()
        
        for collection_name in collections:
            await self.view_collection(collection_name)
    
    async def view_summary(self):
        """View summary statistics for all collections"""
        collections = await self.list_collections()
        
        print("=" * 80)
        print("DATABASE SUMMARY")
        print("=" * 80)
        
        total_docs = 0
        for collection_name in collections:
            count = await self.db[collection_name].count_documents({})
            total_docs += count
            print(f"\n{collection_name}:")
            print(f"  Total documents: {count}")
            
            # Show sample document structure
            if count > 0:
                sample = await self.db[collection_name].find_one({})
                print(f"  Fields: {', '.join(sample.keys())}")
        
        print(f"\nTotal documents across all collections: {total_docs}")
        print()
    
    async def search_collection(self, collection_name, query=None):
        """Search a collection with optional query"""
        collection = self.db[collection_name]
        
        if query is None:
            query = {}
        
        count = await collection.count_documents(query)
        print(f"\nFound {count} documents in '{collection_name}' matching query: {query}\n")
        
        if count > 0:
            cursor = collection.find(query)
            documents = await cursor.to_list(length=None)
            
            for i, doc in enumerate(documents, 1):
                print(f"--- Document {i}/{count} ---")
                self.print_document(doc)
                print()


async def interactive_menu():
    """Interactive menu for database viewing"""
    viewer = MongoDBViewer()
    await viewer.connect()
    
    while True:
        print("\n" + "=" * 80)
        print("MONGODB DATABASE VIEWER - INTERACTIVE MENU")
        print("=" * 80)
        print("1. View all collections (list)")
        print("2. View all data (all collections)")
        print("3. View specific collection")
        print("4. View database summary")
        print("5. Search in collection")
        print("6. View users")
        print("7. View places")
        print("8. View businesses")
        print("9. View communities")
        print("0. Exit")
        print("=" * 80)
        
        choice = input("\nEnter your choice (0-9): ").strip()
        
        if choice == "0":
            break
        elif choice == "1":
            await viewer.list_collections()
        elif choice == "2":
            await viewer.view_all()
        elif choice == "3":
            collections = await viewer.db.list_collection_names()
            print("\nAvailable collections:")
            for i, coll in enumerate(collections, 1):
                print(f"{i}. {coll}")
            coll_name = input("\nEnter collection name: ").strip()
            if coll_name in collections:
                await viewer.view_collection(coll_name)
            else:
                print(f"Collection '{coll_name}' not found!")
        elif choice == "4":
            await viewer.view_summary()
        elif choice == "5":
            collections = await viewer.db.list_collection_names()
            print("\nAvailable collections:")
            for i, coll in enumerate(collections, 1):
                print(f"{i}. {coll}")
            coll_name = input("\nEnter collection name: ").strip()
            if coll_name in collections:
                print("Enter search query (leave empty for all, or use JSON format like {\"name\": \"John\"}):")
                query_str = input().strip()
                query = json.loads(query_str) if query_str else {}
                await viewer.search_collection(coll_name, query)
            else:
                print(f"Collection '{coll_name}' not found!")
        elif choice == "6":
            await viewer.view_collection("users")
        elif choice == "7":
            await viewer.view_collection("places")
        elif choice == "8":
            await viewer.view_collection("businesses")
        elif choice == "9":
            await viewer.view_collection("communities")
        else:
            print("Invalid choice. Please try again.")
        
        input("\nPress Enter to continue...")
    
    await viewer.close()


async def main():
    """Main function - non-interactive mode"""
    import sys
    
    viewer = MongoDBViewer()
    await viewer.connect()
    
    # Check command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "list":
            await viewer.list_collections()
        elif command == "summary":
            await viewer.view_summary()
        elif command == "all":
            await viewer.view_all()
        elif command == "users":
            await viewer.view_collection("users")
        elif command == "places":
            await viewer.view_collection("places")
        elif command == "businesses":
            await viewer.view_collection("businesses")
        elif command == "communities":
            await viewer.view_collection("communities")
        elif command == "interactive" or command == "menu":
            await interactive_menu()
            return
        else:
            # Assume it's a collection name
            collections = await viewer.db.list_collection_names()
            if command in collections:
                await viewer.view_collection(command)
            else:
                print(f"Unknown command or collection: {command}")
                print("\nUsage:")
                print("  python view_database.py [command]")
                print("\nCommands:")
                print("  list         - List all collections")
                print("  summary      - Show database summary")
                print("  all          - View all data")
                print("  users        - View users collection")
                print("  places       - View places collection")
                print("  businesses   - View businesses collection")
                print("  communities  - View communities collection")
                print("  interactive  - Interactive menu mode")
                print("  <collection> - View specific collection")
    else:
        # No arguments - run interactive menu
        await interactive_menu()
        return
    
    await viewer.close()


if __name__ == "__main__":
    asyncio.run(main())
