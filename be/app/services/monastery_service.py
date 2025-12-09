from datetime import datetime as dt, datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.core.security import get_password_hash
from app.models.user import UserCreate, User
from app.models.location import LocationCreate, LocationType, Position
from app.models.business import businessCreate, OpenHours, business
from app.models.user_relations import UserBusinessInDB
from app.schemas.auth import MonasteryRegistrationRequest
from app.services.user_service import user_service
from app.services.location_service import location_service
from app.services.business_service import business_service


# Hardcoded monastery type ID - this is the business type ID for monasteries
MONASTERY_TYPE_ID = "69367fbfbde0a7ba5f19846f"


class MonasteryService:
    """Service for monastery registration"""
    
    async def register_monastery(self, monastery_data: MonasteryRegistrationRequest) -> dict:
        """
        Register a new monastery with the following flow:
        1. Create a user with role=business
        2. Create a location with type=monastery and store coordinates
        3. Create a business with the hardcoded monastery type_id and location_id
        4. Link the user and business in user_business collection
        
        Args:
            monastery_data: MonasteryRegistrationRequest with all required data
            
        Returns:
            Dictionary with user, location, and business information
        """
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )
        
        try:
            # Step 1: Create User with role=business
            user_create = UserCreate(
                name=monastery_data.name,
                address=monastery_data.address,
                gender="other",
                role="monastery",
                email=monastery_data.email,
                password=monastery_data.password
            )
            
            # Check if user already exists
            existing_user = await user_service.get_by_email(monastery_data.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Create user in database
            user_dict = user_create.model_dump()
            user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
            user_dict["role"] = "business"  # Set role to business
            user_dict["approved"] = True
            user_dict["created_at"] = dt.utcnow()
            user_dict["updated_at"] = dt.utcnow()
            
            users_collection = db.users
            user_result = await users_collection.insert_one(user_dict)
            user_id = str(user_result.inserted_id)
            
            created_user = await user_service.get_by_id(user_id)
            user = User(
                id=str(created_user.id),
                name=created_user.name,
                address=created_user.address,
                gender=created_user.gender,
                email=created_user.email,
                role=created_user.role,
                approved=created_user.approved,
                last_synced_at=created_user.last_synced_at,
                created_at=created_user.created_at,
                updated_at=created_user.updated_at
            )
            
            # Step 2: Create Location with type=monastery
            # Convert dict position to Position model
            position_obj = Position(
                x=monastery_data.position.get("x") if isinstance(monastery_data.position, dict) else monastery_data.position.x,
                y=monastery_data.position.get("y") if isinstance(monastery_data.position, dict) else monastery_data.position.y
            )
            
            location_create = LocationCreate(
                name=monastery_data.name,
                description=monastery_data.description,
                short_description=monastery_data.short_description,
                position=position_obj,
                metadata=monastery_data.metadata or {},
                type=LocationType.monastery
            )
            
            location = await location_service.create(location_create)
            location_id = location.id
            
            # Step 3: Create Business with hardcoded monastery type_id and location_id
            open_hours = OpenHours(
                start=monastery_data.open_hours_start,
                end=monastery_data.open_hours_end
            )
            
            # Parse scheduled_at from string to datetime
            scheduled_at = dt.fromisoformat(monastery_data.scheduled_at.replace('Z', '+00:00'))
            
            business_create = businessCreate(
                name=monastery_data.name,
                description=monastery_data.description,
                short_description=monastery_data.short_description,
                open_hours=open_hours,
                type_id=MONASTERY_TYPE_ID,
                l_id=location_id,
                position=position_obj,  # Use the Position object we created earlier
                scheduled_at=scheduled_at
            )
            
            business_collection = db.business
            business_dict = business_create.model_dump()
            business_dict["l_id"] = location_id
            business_dict["type_id"] = MONASTERY_TYPE_ID
            business_dict["open_hours"] = open_hours.model_dump()
            # Convert Position object to dict for database storage
            if hasattr(business_dict["position"], "dict"):
                business_dict["position"] = business_dict["position"].dict()
            elif isinstance(business_dict["position"], dict):
                business_dict["position"] = business_dict["position"]
            else:
                business_dict["position"] = {"x": business_dict["position"].x, "y": business_dict["position"].y}
            business_dict["created_at"] = dt.utcnow()
            business_dict["updated_at"] = dt.utcnow()
            
            business_result = await business_collection.insert_one(business_dict)
            business_id = str(business_result.inserted_id)
            
            # Get the created business
            created_business = await business_service.get_by_id(business_id)
            business_obj = business(
                id=str(created_business.id),
                name=created_business.name,
                description=created_business.description,
                short_description=created_business.short_description,
                open_hours=created_business.open_hours,
                type_id=str(created_business.type_id),
                l_id=str(created_business.l_id),
                scheduled_at=created_business.scheduled_at,
                approved=created_business.approved,
                created_at=created_business.created_at,
                updated_at=created_business.updated_at
            )
            
            # Step 4: Link user and business in user_business collection
            user_business_collection = db.user_business
            user_business_data = {
                "uid": ObjectId(user_id),
                "bid": ObjectId(business_id),
                "role": "owner",
                "created_at": dt.utcnow(),
                "updated_at": dt.utcnow()
            }
            
            await user_business_collection.insert_one(user_business_data)
            
            return {
                "user": user.model_dump(),
                "location": location.model_dump(),
                "business": business_obj.model_dump(),
                "message": "Monastery registered successfully"
            }
            
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error registering monastery: {str(e)}"
            )

    async def get_monastery_details(self, user_id: str) -> dict:
        """Get monastery details for a user"""
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            # Get user-business relationship
            user_business_collection = db.user_business
            user_business = await user_business_collection.find_one({"uid": ObjectId(user_id)})
            
            if not user_business:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Monastery not found"
                )

            business_id = str(user_business["bid"])
            
            # Get business details
            business_collection = db.business
            business_doc = await business_collection.find_one({"_id": ObjectId(business_id)})
            
            if not business_doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Monastery business not found"
                )

            # Get user details
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})

            # Count artifacts
            artifact_count = await db.monastery_artifacts.count_documents({"monastery_id": business_id})

            return {
                "id": business_id,
                "user_id": user_id,
                "name": business_doc.get("name"),
                "email": user_doc.get("email"),
                "address": user_doc.get("address"),
                "description": business_doc.get("description"),
                "short_description": business_doc.get("short_description"),
                "position": business_doc.get("position"),
                "open_hours": business_doc.get("open_hours"),
                "verified": user_doc.get("approved", False),
                "approved": business_doc.get("approved", False),
                "artifacts_count": artifact_count,
                "created_at": business_doc.get("created_at"),
                "updated_at": business_doc.get("updated_at")
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving monastery details: {str(e)}"
            )

    async def update_monastery(self, user_id: str, data: dict) -> dict:
        """Update monastery information"""
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            # Get business ID from user-business relationship
            user_business = await db.user_business.find_one({"uid": ObjectId(user_id)})
            
            if not user_business:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Monastery not found"
                )

            business_id = user_business["bid"]
            
            # Update business information
            data["updated_at"] = dt.utcnow()
            await db.business.update_one(
                {"_id": business_id},
                {"$set": data}
            )

            # Update user information if needed
            user_data = {}
            if "address" in data:
                user_data["address"] = data["address"]
            if user_data:
                await db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": user_data}
                )

            # Return updated monastery details
            return await self.get_monastery_details(user_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating monastery: {str(e)}"
            )


monastery_service = MonasteryService()

