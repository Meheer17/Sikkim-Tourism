#!/usr/bin/env python3
"""
Debug script to check MongoDB collections for transcriptions and file data
"""
import os
import sys
from pymongo import MongoClient
from pprint import pprint
from datetime import datetime, timedelta
from bson import ObjectId

# MongoDB connection string
MONGO_URI = "mongodb+srv://newuser:Pzt8hcnH0uu9BqUb@mycluster.mt6afrt.mongodb.net/mona360"

def main():
    client = MongoClient(MONGO_URI)
    db = client['mona360']
    
    print("=== MongoDB Debug Info ===\n")
    
    # List all collections
    collections = db.list_collection_names()
    print(f"Available collections: {collections}\n")
    
    # Check files collection
    if 'files' in collections:
        files_col = db['files']
        total_files = files_col.count_documents({})
        print(f"Files collection: {total_files} documents")
        
        # Show recent files
        recent_files = list(files_col.find().sort("_id", -1).limit(5))
        print("Recent files:")
        for f in recent_files:
            print(f"  - ID: {f.get('_id')}")
            print(f"    File: {f.get('file_name', 'Unknown')}")
            print(f"    L_ID: {f.get('l_id')}")
            print(f"    B_ID: {f.get('b_id')}")
            print(f"    Uploaded: {f.get('created_at', 'Unknown')}")
            print()
    
    # Check transcriptions collection
    if 'transcriptions' in collections:
        trans_col = db['transcriptions']
        total_transcriptions = trans_col.count_documents({})
        print(f"Transcriptions collection: {total_transcriptions} documents")
        
        # Show recent transcriptions
        recent_trans = list(trans_col.find().sort("_id", -1).limit(5))
        print("Recent transcriptions:")
        for t in recent_trans:
            print(f"  - ID: {t.get('_id')}")
            print(f"    File ID: {t.get('file_id')}")
            print(f"    L_ID: {t.get('l_id')}")
            print(f"    Text preview: {str(t.get('text', ''))[:100]}...")
            print(f"    Confidence: {t.get('avg_confidence')}")
            print(f"    Created: {t.get('created_at')}")
            print()
    
    # Check locations collection
    if 'locations' in collections:
        loc_col = db['locations']
        total_locations = list(loc_col.find({}, {"_id": 1, "name": 1}).limit(10))
        print(f"Sample locations:")
        for loc in total_locations:
            print(f"  - ID: {loc.get('_id')}, Name: {loc.get('name')}")
        print()
    
    # Check for transcriptions with l_id matching locations
    if 'transcriptions' in collections and 'locations' in collections:
        trans_col = db['transcriptions']
        loc_col = db['locations']
        
        print("=== Transcription-Location Matching ===")
        
        # Get all unique l_ids from transcriptions
        trans_l_ids = trans_col.distinct('l_id')
        print(f"Unique l_ids in transcriptions: {len(trans_l_ids)}")
        print(f"L_IDs: {trans_l_ids[:10]}...")  # Show first 10
        
        # Check if these l_ids exist as location ObjectIds
        for l_id in trans_l_ids[:5]:  # Check first 5
            if l_id:
                try:
                    obj_id = ObjectId(l_id)
                    location = loc_col.find_one({"_id": obj_id})
                    if location:
                        trans_count = trans_col.count_documents({"l_id": l_id})
                        print(f"✓ L_ID {l_id} matches location '{location.get('name')}' ({trans_count} transcriptions)")
                    else:
                        print(f"✗ L_ID {l_id} does not match any location")
                except Exception as e:
                    print(f"✗ L_ID {l_id} is not a valid ObjectId: {e}")
    
    client.close()

if __name__ == "__main__":
    main()