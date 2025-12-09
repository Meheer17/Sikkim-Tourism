#!/usr/bin/env python3
"""
AI Pipeline Script - MongoDB Connection
"""

import os
import sys
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from typing import List, Dict
import pandas as pd
from prophet import Prophet
from datetime import datetime

# Load environment variables from parent directory
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# MongoDB Configuration
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb+srv://newuser:Pzt8hcnH0uu9BqUb@mycluster.mt6afrt.mongodb.net/?retryWrites=true&w=majority&appName=mycluster')
MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'mona360')


def get_mongo_client():
    """Create and return MongoDB client."""
    return MongoClient(MONGODB_URL)


def connect_to_mongodb():
    """Connect to MongoDB and return database instance."""
    try:
        client = get_mongo_client()
        db = client[MONGODB_DB_NAME]
        # Test the connection
        db.command('ping')
        print(f"✓ Connected to MongoDB: {MONGODB_DB_NAME}")
        return db
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        sys.exit(1)


def get_non_government_users(db) -> pd.DataFrame:
    """
    Fetch all users where role is not 'government' and convert to DataFrame.
    
    Args:
        db: MongoDB database instance
    
    Returns:
        pd.DataFrame: DataFrame containing non-government users
    """
    try:
        users_collection = db['users']
        
        # Query: Get all users where role is not 'government'
        query = {"role": {"$ne": "government"}}
        
        users = list(users_collection.find(query))
        print(f"✓ Fetched {len(users)} non-government users from database")
        
        # Convert to DataFrame
        if users:
            df = pd.DataFrame(users)
            print(f"✓ Converted to DataFrame with shape: {df.shape}")
            print(f"✓ Columns: {df.columns.tolist()}")
            return df
        else:
            print("⚠ No non-government users found")
            return pd.DataFrame()
            
    except Exception as e:
        print(f"✗ Failed to fetch users: {e}")
        return pd.DataFrame()


def main():
    """Main function - entry point for the script."""
    print("Starting AI Pipeline...")
    
    # Connect to database
    db = connect_to_mongodb()
    
    # Step 1: Get all users where role is not 'government' and convert to DataFrame
    df_users = get_non_government_users(db)
    
    if not df_users.empty:
        # Step 2: Get user count by month
        df_users['created_at'] = pd.to_datetime(df_users['created_at'], utc=True)
        df_users['month'] = df_users['created_at'].dt.strftime('%b')
        
        monthly_counts = df_users['month'].value_counts().sort_index()
        
        print("\n📊 User count by month:")
        for month, count in monthly_counts.items():
            print(f"{month} {count}")
        
        # Step 3: Prepare data for Prophet and predict next 3 months
        df_prophet = df_users.groupby(df_users['created_at'].dt.to_period('M')).size().reset_index()
        df_prophet.columns = ['ds', 'y']
        df_prophet['ds'] = df_prophet['ds'].dt.to_timestamp()
        
        # Train Prophet model
        model = Prophet()
        model.fit(df_prophet)
        
        # Predict next 3 months
        future = model.make_future_dataframe(periods=3, freq='M')
        forecast = model.predict(future)
        
        print("\n🔮 Predicted user count for next 3 months:")
        predictions = forecast[['ds', 'yhat']].tail(3)
        for _, row in predictions.iterrows():
            month = row['ds'].strftime('%b')
            count = int(row['yhat'])
            print(f"{month} {count}")
        
        # Step 4: Store data in MongoDB
        analytics_collection = db['monthly_user_analytics']
        predicted_at = datetime.utcnow()
        current_date = datetime.utcnow()
        
        # Create a dictionary to store unique month-year combinations
        analytics_dict = {}
        
        # Add historical actual data
        for _, row in df_prophet.iterrows():
            key = (row['ds'].year, row['ds'].month)
            analytics_dict[key] = {
                'month_number': row['ds'].month,
                'year': row['ds'].year,
                'actual_data': int(row['y']),
                'predicted_data': 0,
                'predicted_at': predicted_at
            }
        
        # Get predictions for next 3 months only (future months)
        future_predictions = forecast[forecast['ds'] > pd.Timestamp(current_date)].head(3)
        
        # Add next 3 months predictions only
        for _, row in future_predictions.iterrows():
            key = (row['ds'].year, row['ds'].month)
            # Only add if not already in dict (shouldn't happen, but safe)
            if key not in analytics_dict:
                analytics_dict[key] = {
                    'month_number': row['ds'].month,
                    'year': row['ds'].year,
                    'actual_data': None,
                    'predicted_data': int(row['yhat']),
                    'predicted_at': predicted_at
                }
        
        # Convert dict to list
        documents = list(analytics_dict.values())
        
        # Clear old analytics and insert new
        if documents:
            analytics_collection.delete_many({})
            analytics_collection.insert_many(documents)
            print(f"\n✓ Stored {len(documents)} records in monthly_user_analytics collection")
            print(f"✓ {len(df_prophet)} historical records + {len(future_predictions)} future predictions")
    
    print("\nReady for next steps...")


if __name__ == "__main__":
    main()
