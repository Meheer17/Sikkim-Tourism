import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def cleanup():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DB_NAME", "sih2025")]
    
    # Find all communities with the same name
    communities = await db.communities.find({"name": "Sikkim Travelers"}).to_list(length=100)
    print(f"Found {len(communities)} 'Sikkim Travelers' communities")
    
    if len(communities) > 1:
        # Keep the first one, delete the rest
        keep_id = communities[0]["_id"]
        delete_ids = [c["_id"] for c in communities[1:]]
        
        result = await db.communities.delete_many({"_id": {"$in": delete_ids}})
        print(f"Deleted {result.deleted_count} duplicate communities")
        print(f"Kept community with id: {keep_id}")
    else:
        print("No duplicates to clean up")
    
    client.close()

asyncio.run(cleanup())
