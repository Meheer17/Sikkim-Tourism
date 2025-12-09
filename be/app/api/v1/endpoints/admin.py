from fastapi import APIRouter, Depends, status
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.core.security import get_current_user_id
from app.core.database import get_database

router = APIRouter()


@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_admin_stats(
    current_user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get admin dashboard statistics
    
    Returns counts for users, businesses, locations, and other metrics
    """
    db = get_database()
    
    try:
        # Count total users
        total_users = await db.users.count_documents({})
        
        # Count total businesses
        total_businesses = await db.business.count_documents({})
        
        # Count total locations
        total_locations = await db.locations.count_documents({})
        
        # Count active users (users who logged in within last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users = await db.users.count_documents({
            "last_login": {"$gte": thirty_days_ago}
        })
        
        # Count pending approvals (businesses with pending status)
        pending_approvals = await db.business.count_documents({
            "status": "pending"
        })
        
        return {
            "total_users": total_users,
            "total_businesses": total_businesses,
            "total_locations": total_locations + total_businesses,
            "active_users": active_users if active_users else total_users,  # Fallback to total if no last_login field
            "pending_approvals": pending_approvals,
            "total_bookings": 0,  # Placeholder for future bookings feature
            "revenue": 0,  # Placeholder for future revenue feature
        }
    except Exception as e:
        print(f"Error fetching admin stats: {e}")
        return {
            "total_users": 0,
            "total_businesses": 0,
            "total_locations": 0,
            "active_users": 0,
            "pending_approvals": 0,
            "total_bookings": 0,
            "revenue": 0,
        }


@router.get("/activities", status_code=status.HTTP_200_OK)
async def get_recent_activities(
    current_user_id: str = Depends(get_current_user_id),
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Get recent activities for admin dashboard
    
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
        recent_locations = await db.location.find().sort("created_at", -1).limit(3).to_list(length=3)
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
