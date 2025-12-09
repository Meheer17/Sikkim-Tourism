from fastapi import APIRouter, Depends, status
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.core.security import get_current_admin_user
from app.core.database import get_database

router = APIRouter()


@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_government_stats(
    current_user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get government dashboard statistics
    
    Returns counts for users, businesses, locations, and other metrics
    """
    db = get_database()

    try:
        # Count total users
        total_users = await db.users.count_documents({})

        # Count total businesses
        total_businesses = await db.business.count_documents({})

        # Count total places (locations)
        total_places = await db.locations.count_documents({})

        # Count total bookings/orders
        total_bookings = await db.orders.count_documents({})

        # Total revenue from completed payments
        revenue_cursor = db.orders.aggregate([
            {"$match": {"payment_status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ])
        revenue_res = await revenue_cursor.to_list(length=1)
        total_revenue = revenue_res[0]["total"] if revenue_res else 0

        # Total active users: users with updated_at within last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        total_active_users = await db.users.count_documents({
            "updated_at": {"$gte": thirty_days_ago}
        })

        return {
            "total_users": total_users,
            "total_businesses": total_businesses,
            "total_places": total_places,
            "total_bookings": total_bookings,
            "total_revenue": total_revenue,
            "total_active_users": total_active_users,
        }
    except Exception as e:
        print(f"Error fetching government stats: {e}")
        return {
            "total_users": 0,
            "total_businesses": 0,
            "total_places": 0,
            "total_bookings": 0,
            "total_revenue": 0,
            "total_active_users": 0,
        }


@router.get("/activities", status_code=status.HTTP_200_OK)
async def get_recent_activities(
    current_admin_id: str = Depends(get_current_admin_user),
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Get recent activities for government dashboard
    
    Returns recent user registrations, business creations, etc.
    """
    db = get_database()
    
    activities = []
    
    try:
        # Get recent users
        recent_users = await db.users.find().sort("created_at", -1).limit(3).to_list(length=3)
        for user in recent_users:
            activities.append({
                "id": str(user["_id"]),
                "type": "user_registered",
                "title": "New User Registration",
                "description": f"{user.get('name', 'User')} joined the platform",
                "timestamp": user.get("created_at", datetime.utcnow()).isoformat() if isinstance(user.get("created_at"), datetime) else "Just now",
                "user_id": str(user["_id"])
            })
        
        # Get recent businesses
        recent_businesses = await db.business.find().sort("created_at", -1).limit(3).to_list(length=3)
        for business in recent_businesses:
            activities.append({
                "id": str(business["_id"]),
                "type": "business_created",
                "title": "New Business Listed",
                "description": f"{business.get('name', 'Business')} was added",
                "timestamp": business.get("created_at", datetime.utcnow()).isoformat() if isinstance(business.get("created_at"), datetime) else "Just now",
                "business_id": str(business["_id"])
            })
        
        # Get recent locations
        recent_locations = await db.locations.find().sort("created_at", -1).limit(3).to_list(length=3)
        for location in recent_locations:
            activities.append({
                "id": str(location["_id"]),
                "type": "place_added",
                "title": "New Place Added",
                "description": f"{location.get('name', 'Location')} was added to the map",
                "timestamp": location.get("created_at", datetime.utcnow()).isoformat() if isinstance(location.get("created_at"), datetime) else "Just now",
                "location_id": str(location["_id"])
            })
        
        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Return limited results
        return activities[:limit]
        
    except Exception as e:
        print(f"Error fetching activities: {e}")
        return []