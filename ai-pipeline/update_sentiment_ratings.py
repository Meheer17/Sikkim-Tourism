#!/usr/bin/env python3
"""
Script to fetch comments from MongoDB, analyze sentiment, and update service ratings.
"""

import os
import sys
from pymongo import MongoClient
import requests
from typing import List, Dict
from collections import defaultdict
from dotenv import load_dotenv

# Load environment variables from parent directory
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# Configuration
MONGODB_URL = os.getenv('MONGODB_URL')
MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME')
SENTIMENT_API_URL = 'http://localhost:7050/sentiment/api/v1/classify'
BATCH_SIZE = 3

def connect_to_mongodb():
    """Connect to MongoDB and return database instance."""
    try:
        client = MongoClient(MONGODB_URL)
        db = client[MONGODB_DB_NAME]
        print(f"✓ Connected to MongoDB: {MONGODB_DB_NAME}")
        return db
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        sys.exit(1)

def fetch_all_comments(db):
    """Fetch all comments from the comments collection."""
    try:
        comments_collection = db['comments']
        comments = list(comments_collection.find())
        print(f"✓ Fetched {len(comments)} comments from database")
        return comments
    except Exception as e:
        print(f"✗ Failed to fetch comments: {e}")
        return []

def analyze_sentiment_batch(comments_batch: List[str]) -> List[Dict]:
    """Send a batch of comments to sentiment API and return results."""
    try:
        payload = {"comments": comments_batch}
        response = requests.post(
            SENTIMENT_API_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        print(f"   API Response: {result}")
        return result
    except requests.exceptions.RequestException as e:
        print(f"   ✗ Sentiment API request failed: {e}")
        return []

def calculate_rating_from_sentiment_counts(positive: int, neutral: int, negative: int) -> float:
    """
    Calculate rating from sentiment counts.
    Rating scale: 0-5
    - Positive comments contribute positively
    - Neutral comments are middle ground
    - Negative comments reduce rating
    """
    total = positive + neutral + negative
    if total == 0:
        return 0.0
    
    # Weight: positive=1, neutral=0, negative=-1
    weighted_sum = positive * 1 + neutral * 0 + negative * (-1)
    
    # Normalize from [-total, total] to [0, 5]
    # -total -> 0, 0 -> 2.5, total -> 5
    normalized_rating = ((weighted_sum / total) + 1) * 2.5
    
    # Ensure within bounds
    return max(0.0, min(5.0, normalized_rating))

def process_comments_and_update_ratings(db):
    """Main processing function."""
    # Fetch all comments
    all_comments = fetch_all_comments(db)
    
    if not all_comments:
        print("No comments found. Exiting.")
        return
    
    # Group comments by service_id
    comments_by_service = defaultdict(list)
    for comment in all_comments:
        service_id = comment.get('service_id') or comment.get('serviceId')
        comment_text = comment.get('comment') or comment.get('text') or comment.get('content')
        
        if service_id and comment_text:
            comments_by_service[service_id].append({
                'comment_id': str(comment.get('_id')),
                'text': comment_text
            })
    
    print(f"\n✓ Found comments for {len(comments_by_service)} services")
    
    # Process each service
    services_collection = db['services']
    
    for service_id, service_comments in comments_by_service.items():
        print(f"\n📊 Processing service: {service_id}")
        print(f"   Total comments: {len(service_comments)}")
        
        # Accumulate sentiment counts across all batches
        total_positive = 0
        total_neutral = 0
        total_negative = 0
        
        comment_texts = [c['text'] for c in service_comments]
        
        # Process comments in batches of 3
        for i in range(0, len(comment_texts), BATCH_SIZE):
            batch = comment_texts[i:i + BATCH_SIZE]
            print(f"   Analyzing batch {i//BATCH_SIZE + 1} ({len(batch)} comments)...")
            
            results = analyze_sentiment_batch(batch)
            
            if results and isinstance(results, dict):
                # API returns {'positive': N, 'neutral': N, 'negative': N}
                total_positive += results.get('positive', 0)
                total_neutral += results.get('neutral', 0)
                total_negative += results.get('negative', 0)
        
        if total_positive + total_neutral + total_negative > 0:
            # Calculate normalized rating
            rating = calculate_rating_from_sentiment_counts(total_positive, total_neutral, total_negative)
            
            print(f"   Sentiment counts - Positive: {total_positive}, Neutral: {total_neutral}, Negative: {total_negative}")
            print(f"   ⭐ Calculated rating: {rating:.2f}/5.0")
            
            # Update service rating in database
            try:
                result = services_collection.update_one(
                    {'_id': service_id},
                    {'$set': {'rating': round(rating, 2)}}
                )
                
                if result.modified_count > 0:
                    print(f"   ✓ Updated service rating in database")
                else:
                    print(f"   ⚠ Service not found or rating unchanged")
            except Exception as e:
                print(f"   ✗ Failed to update service: {e}")
        else:
            print(f"   ⚠ No valid sentiment scores obtained")

def main():
    """Main entry point."""
    print("=" * 60)
    print("Sentiment Analysis & Rating Update Script")
    print("=" * 60)
    
    # Validate environment variables
    if not MONGODB_URL or not MONGODB_DB_NAME:
        print("✗ Error: MONGODB_URL and MONGODB_DB_NAME must be set in .env file")
        sys.exit(1)
    
    # Connect to database
    db = connect_to_mongodb()
    
    # Process comments and update ratings
    process_comments_and_update_ratings(db)
    
    print("\n" + "=" * 60)
    print("✓ Processing complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
