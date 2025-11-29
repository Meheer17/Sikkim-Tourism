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
            query["uid"] = ObjectId(uid)
        
        if cid:
            query["cid"] = ObjectId(cid)
        
        cursor = self.collection.find(query).skip(skip).limit(limit)
        messages = []
        async for message in cursor:
            msg_db = MessageInDB(**message)
            messages.append(Message(
                id=str(msg_db.id),
                uid=str(msg_db.uid),
                cid=str(msg_db.cid),
                text=msg_db.text,
                created_at=msg_db.created_at
            ))
        return messages
    
    async def create(self, message_create: MessageCreate) -> Message:
        """Create a new message"""
        message_dict = message_create.model_dump()
        message_dict["created_at"] = datetime.utcnow()
        
        # Create MessageInDB instance to ensure ObjectId conversion
        message_in_db = MessageInDB(**message_dict)
        message_dict = message_in_db.model_dump(exclude={"id"})
        
        result = await self.collection.insert_one(message_dict)
        created_message = await self.get_by_id(str(result.inserted_id))
        
        return Message(
            id=str(created_message.id),
            uid=str(created_message.uid),
            cid=str(created_message.cid),
            text=created_message.text,
            created_at=created_message.created_at
        )


message_service = MessageService()
