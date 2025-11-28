from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from app.core.database import get_database
from app.models.message import MessageCreate, MessageInDB, Message


class MessageService:
    """Service for message operations"""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.messages
    
    async def get_by_id(self, message_id: str) -> Optional[MessageInDB]:
        """Get message by ID"""
        if not ObjectId.is_valid(message_id):
            return None
        
        message = await self.collection.find_one({"_id": ObjectId(message_id)})
        if message:
            return MessageInDB(**message)
        return None
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 10,
        uid: Optional[str] = None,
        cid: Optional[str] = None
    ) -> List[Message]:
        """Get all messages with pagination and optional filters"""
        query = {}
        
        if uid:
            query["uid"] = uid
        
        if cid:
            query["cid"] = cid
        
        cursor = self.collection.find(query).skip(skip).limit(limit)
        messages = []
        async for message in cursor:
            msg_db = MessageInDB(**message)
            messages.append(Message(
                id=str(msg_db.id),
                uid=msg_db.uid,
                cid=msg_db.cid,
                text=msg_db.text,
                created_at=msg_db.created_at
            ))
        return messages
    
    async def create(self, message_create: MessageCreate) -> Message:
        """Create a new message"""
        message_dict = message_create.model_dump()
        message_dict["created_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(message_dict)
        created_message = await self.get_by_id(str(result.inserted_id))
        
        return Message(
            id=str(created_message.id),
            uid=created_message.uid,
            cid=created_message.cid,
            text=created_message.text,
            created_at=created_message.created_at
        )


message_service = MessageService()
