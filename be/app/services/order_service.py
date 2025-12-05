from typing import Optional, List
from datetime import datetime, date
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.order import OrderCreate, OrderUpdate, OrderInDB, Order, PaymentStatus, OrderStatus


class OrderService:
    """Service for ORDERS collection operations"""
    
    def __init__(self):
        pass
    
    async def get_by_id(self, order_id: str) -> Optional[OrderInDB]:
        """Get order by ID"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.orders
        if not ObjectId.is_valid(order_id):
            return None
        
        order = await collection.find_one({"_id": ObjectId(order_id)})
        if order:
            return OrderInDB(**order)
        return None
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 10,
        service_id: Optional[str] = None,
        business_id: Optional[str] = None,
        user_id: Optional[str] = None,
        payment_status: Optional[str] = None,
        order_status: Optional[str] = None
    ) -> List[Order]:
        """Get all orders with pagination and filters"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.orders
        query = {}
        
        if service_id:
            if not ObjectId.is_valid(service_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid service ID")
            query["service_id"] = service_id
        
        if business_id:
            if not ObjectId.is_valid(business_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid business ID")
            query["business_id"] = business_id
        
        if user_id:
            if not ObjectId.is_valid(user_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
            query["user_id"] = user_id
        
        if payment_status:
            query["payment_status"] = payment_status
        
        if order_status:
            query["order_status"] = order_status
        
        cursor = collection.find(query).skip(skip).limit(limit)
        orders = []
        async for doc in cursor:
            order_db = OrderInDB(**doc)
            orders.append(Order(
                id=str(order_db.id),
                service_id=order_db.service_id,
                business_id=order_db.business_id,
                user_id=order_db.user_id,
                payment_status=order_db.payment_status,
                order_status=order_db.order_status,
                amount=order_db.amount,
                metadata=order_db.metadata,
                created_at=order_db.created_at,
                updated_at=order_db.updated_at
            ))
        return orders
    
    async def create(self, order_data: OrderCreate, current_user_id: str) -> Order:
        """Create a new order"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.orders
        
        # Verify that the service exists
        service = await db.services.find_one({"_id": ObjectId(order_data.service_id)})
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Verify that the business exists
        business = await db.business.find_one({"_id": ObjectId(order_data.business_id)})
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        order_dict = {
            "service_id": order_data.service_id,
            "business_id": order_data.business_id,
            "user_id": current_user_id,
            "payment_status": PaymentStatus.pending,
            "order_status": OrderStatus.created,
            "amount": order_data.amount,
            "metadata": order_data.metadata or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(order_dict)
        
        created_order = await self.get_by_id(str(result.inserted_id))
        if not created_order:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create order"
            )
        
        return Order(
            id=str(created_order.id),
            service_id=created_order.service_id,
            business_id=created_order.business_id,
            user_id=created_order.user_id,
            payment_status=created_order.payment_status,
            order_status=created_order.order_status,
            amount=created_order.amount,
            metadata=created_order.metadata,
            created_at=created_order.created_at,
            updated_at=created_order.updated_at
        )
    
    async def update(self, order_id: str, order_update: OrderUpdate) -> Order:
        """Update an order"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.orders
        
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid order ID")
        
        # Check if order exists
        existing_order = await self.get_by_id(order_id)
        if not existing_order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        update_dict = order_update.model_dump(by_alias=True, exclude_unset=True, exclude_none=True)
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Add updated_at timestamp
        update_dict["updated_at"] = datetime.utcnow()
        
        await collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_dict}
        )
        
        updated_order = await self.get_by_id(order_id)
        if not updated_order:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update order"
            )
        
        return Order(
            id=str(updated_order.id),
            service_id=updated_order.service_id,
            business_id=updated_order.business_id,
            user_id=updated_order.user_id,
            payment_status=updated_order.payment_status,
            order_status=updated_order.order_status,
            amount=updated_order.amount,
            metadata=updated_order.metadata,
            created_at=updated_order.created_at,
            updated_at=updated_order.updated_at
        )
    
    async def delete(self, order_id: str) -> bool:
        """Delete an order"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.orders
        
        if not ObjectId.is_valid(order_id):
            return False
        
        result = await collection.delete_one({"_id": ObjectId(order_id)})
        return result.deleted_count > 0
    
    async def get_by_user(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 10,
        order_status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> List[Order]:
        """Get all orders for a specific user with optional filters"""
        return await self.get_all(
            user_id=user_id,
            skip=skip,
            limit=limit,
            order_status=order_status,
            payment_status=payment_status
        )
    
    async def get_by_business(
        self, 
        business_id: str, 
        skip: int = 0, 
        limit: int = 10,
        order_status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> List[Order]:
        """Get all orders for a specific business with optional filters"""
        return await self.get_all(
            business_id=business_id,
            skip=skip,
            limit=limit,
            order_status=order_status,
            payment_status=payment_status
        )
    
    async def verify_business_ownership(self, business_id: str,user_id: str) -> bool:
        """Verify if user owns the business"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        user_business_collection = db.user_business
        user_biz = await user_business_collection.find_one({
            "uid": ObjectId(user_id),
            "bid": ObjectId(business_id),
            "role": "owner"
        })
        return user_biz is not None
    
    async def get_user_bookings_count(self, user_id: str) -> dict:
        """Get count of bookings by status for a user"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        collection = db.orders
        
        total = await collection.count_documents({"user_id": user_id})
        pending = await collection.count_documents({"user_id": user_id, "order_status": OrderStatus.created})
        confirmed = await collection.count_documents({"user_id": user_id, "order_status": OrderStatus.confirmed})
        in_progress = await collection.count_documents({"user_id": user_id, "order_status": OrderStatus.in_progress})
        completed = await collection.count_documents({"user_id": user_id, "order_status": OrderStatus.completed})
        cancelled = await collection.count_documents({"user_id": user_id, "order_status": OrderStatus.cancelled})
        
        return {
            "total": total,
            "pending": pending,
            "confirmed": confirmed,
            "in_progress": in_progress,
            "completed": completed,
            "cancelled": cancelled
        }
    
    async def get_user_upcoming_bookings(self, user_id: str, skip: int = 0, limit: int = 10) -> List[Order]:
        """Get upcoming bookings for a user (not yet completed)"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        collection = db.orders
        query = {
            "user_id": user_id,
            "order_status": {"$ne": OrderStatus.completed}
        }
        
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        orders = []
        async for doc in cursor:
            order_db = OrderInDB(**doc)
            orders.append(Order(
                id=str(order_db.id),
                service_id=order_db.service_id,
                business_id=order_db.business_id,
                user_id=order_db.user_id,
                payment_status=order_db.payment_status,
                order_status=order_db.order_status,
                amount=order_db.amount,
                metadata=order_db.metadata,
                created_at=order_db.created_at,
                updated_at=order_db.updated_at
            ))
        return orders
    
    async def get_user_completed_bookings(self, user_id: str, skip: int = 0, limit: int = 10) -> List[Order]:
        """Get completed bookings for a user"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        collection = db.orders
        query = {
            "user_id": user_id,
            "order_status": OrderStatus.completed
        }
        
        cursor = collection.find(query).sort("updated_at", -1).skip(skip).limit(limit)
        orders = []
        async for doc in cursor:
            order_db = OrderInDB(**doc)
            orders.append(Order(
                id=str(order_db.id),
                service_id=order_db.service_id,
                business_id=order_db.business_id,
                user_id=order_db.user_id,
                payment_status=order_db.payment_status,
                order_status=order_db.order_status,
                amount=order_db.amount,
                metadata=order_db.metadata,
                created_at=order_db.created_at,
                updated_at=order_db.updated_at
            ))
        return orders
    
    async def get_todays_bookings_for_user_businesses(self, user_id: str) -> List[Order]:
        """Get today's bookings for all businesses owned by user"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        # Get all businesses owned by this user
        user_business_collection = db.user_business
        business_ids = []
        cursor = user_business_collection.find({"uid": ObjectId(user_id), "role": "owner"})
        async for ub in cursor:
            business_ids.append(str(ub["bid"]))
        if not business_ids:
            return []

        # Get today's orders for these businesses
        today_start = datetime.combine(date.today(), datetime.min.time())
        today_end = datetime.combine(date.today(), datetime.max.time())
        
        collection = db.orders
        query = {
            "business_id": {"$in": business_ids},
            "created_at": {"$gte": today_start, "$lte": today_end}
        }
        
        cursor = collection.find(query).sort("created_at", -1)
        orders = []
        async for doc in cursor:
            order_db = OrderInDB(**doc)
            orders.append(Order(
                id=str(order_db.id),
                service_id=order_db.service_id,
                business_id=order_db.business_id,
                user_id=order_db.user_id,
                payment_status=order_db.payment_status,
                order_status=order_db.order_status,
                amount=order_db.amount,
                metadata=order_db.metadata,
                created_at=order_db.created_at,
                updated_at=order_db.updated_at
            ))
        return orders
    
    async def get_todays_bookings_count_for_user_businesses(self, user_id: str) -> dict:
        """Get count of today's bookings for user's businesses by status"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        # Get all businesses owned by this user
        user_business_collection = db.user_business
        business_ids = []
        
        cursor = user_business_collection.find({"uid": ObjectId(user_id), "role": "owner"})
        async for ub in cursor:
            business_ids.append(str(ub["bid"]))
        
        if not business_ids:
            return {
                "total": 0,
                "pending": 0,
                "confirmed": 0,
                "in_progress": 0,
                "completed": 0,
                "cancelled": 0
            }
        
        today_start = datetime.combine(date.today(), datetime.min.time())
        today_end = datetime.combine(date.today(), datetime.max.time())
        
        collection = db.orders
        base_query = {
            "business_id": {"$in": business_ids},
            "created_at": {"$gte": today_start, "$lte": today_end}
        }
        
        total = await collection.count_documents(base_query)
        pending = await collection.count_documents({**base_query, "order_status": OrderStatus.created})
        confirmed = await collection.count_documents({**base_query, "order_status": OrderStatus.confirmed})
        in_progress = await collection.count_documents({**base_query, "order_status": OrderStatus.in_progress})
        completed = await collection.count_documents({**base_query, "order_status": OrderStatus.completed})
        cancelled = await collection.count_documents({**base_query, "order_status": OrderStatus.cancelled})
        
        return {
            "total": total,
            "pending": pending,
            "confirmed": confirmed,
            "in_progress": in_progress,
            "completed": completed,
            "cancelled": cancelled
        }
    
    async def get_upcoming_bookings_for_user_businesses(self, user_id: str, skip: int = 0, limit: int = 10) -> List[Order]:
        """Get upcoming bookings for all businesses owned by user"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        # Get all businesses owned by this user
        user_business_collection = db.user_business
        business_ids = []
        
        cursor = user_business_collection.find({"uid": ObjectId(user_id), "role": "owner"})
        async for ub in cursor:
            business_ids.append(str(ub["bid"]))
        
        if not business_ids:
            return []
        
        collection = db.orders
        query = {
            "business_id": {"$in": business_ids},
            "order_status": {"$ne": OrderStatus.completed}
        }
        
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        orders = []
        async for doc in cursor:
            order_db = OrderInDB(**doc)
            orders.append(Order(
                id=str(order_db.id),
                service_id=order_db.service_id,
                business_id=order_db.business_id,
                user_id=order_db.user_id,
                payment_status=order_db.payment_status,
                order_status=order_db.order_status,
                amount=order_db.amount,
                metadata=order_db.metadata,
                created_at=order_db.created_at,
                updated_at=order_db.updated_at
            ))
        return orders
    
    async def get_pending_payment_bookings_for_user_businesses(self, user_id: str, skip: int = 0, limit: int = 10) -> List[Order]:
        """Get bookings with pending payment for all businesses owned by user"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        # Get all businesses owned by this user
        user_business_collection = db.user_business
        business_ids = []
        
        cursor = user_business_collection.find({"uid": ObjectId(user_id), "role": "owner"})
        async for ub in cursor:
            business_ids.append(str(ub["bid"]))
        
        if not business_ids:
            return []
        
        collection = db.orders
        query = {
            "business_id": {"$in": business_ids},
            "payment_status": PaymentStatus.pending
        }
        
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        orders = []
        async for doc in cursor:
            order_db = OrderInDB(**doc)
            orders.append(Order(
                id=str(order_db.id),
                service_id=order_db.service_id,
                business_id=order_db.business_id,
                user_id=order_db.user_id,
                payment_status=order_db.payment_status,
                order_status=order_db.order_status,
                amount=order_db.amount,
                metadata=order_db.metadata,
                created_at=order_db.created_at,
                updated_at=order_db.updated_at
            ))
        return orders
    
    async def get_business_bookings(
        self,
        business_id: str,
        skip: int = 0,
        limit: int = 10,
        order_status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> List[Order]:
        """Get all bookings for a specific business"""
        return await self.get_all(
            business_id=business_id,
            skip=skip,
            limit=limit,
            order_status=order_status,
            payment_status=payment_status
        )
    
    async def get_business_todays_bookings(self, business_id: str) -> List[Order]:
        """Get today's bookings for a specific business"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        today_start = datetime.combine(date.today(), datetime.min.time())
        today_end = datetime.combine(date.today(), datetime.max.time())
        
        collection = db.orders
        query = {
            "business_id": business_id,
            "created_at": {"$gte": today_start, "$lte": today_end}
        }
        
        cursor = collection.find(query).sort("created_at", -1)
        orders = []
        async for doc in cursor:
            order_db = OrderInDB(**doc)
            orders.append(Order(
                id=str(order_db.id),
                service_id=order_db.service_id,
                business_id=order_db.business_id,
                user_id=order_db.user_id,
                payment_status=order_db.payment_status,
                order_status=order_db.order_status,
                amount=order_db.amount,
                metadata=order_db.metadata,
                created_at=order_db.created_at,
                updated_at=order_db.updated_at
            ))
        return orders
    
    async def get_business_bookings_count(self, business_id: str) -> dict:
        """Get booking statistics for a business"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        collection = db.orders
        
        total = await collection.count_documents({"business_id": business_id})
        pending = await collection.count_documents({"business_id": business_id, "order_status": OrderStatus.created})
        confirmed = await collection.count_documents({"business_id": business_id, "order_status": OrderStatus.confirmed})
        in_progress = await collection.count_documents({"business_id": business_id, "order_status": OrderStatus.in_progress})
        completed = await collection.count_documents({"business_id": business_id, "order_status": OrderStatus.completed})
        cancelled = await collection.count_documents({"business_id": business_id, "order_status": OrderStatus.cancelled})
        
        payment_completed = await collection.count_documents({
            "business_id": business_id,
            "payment_status": PaymentStatus.completed
        })
        
        return {
            "total": total,
            "pending": pending,
            "confirmed": confirmed,
            "in_progress": in_progress,
            "completed": completed,
            "cancelled": cancelled,
            "payment_completed": payment_completed
        }


order_service = OrderService()
