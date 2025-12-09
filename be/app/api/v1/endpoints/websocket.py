from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from fastapi.exceptions import HTTPException
from typing import Dict, Set
import json
import asyncio
from datetime import datetime

from app.core.security import decode_access_token

router = APIRouter()

# Connection manager to track active WebSocket connections
class ConnectionManager:
    def __init__(self):
        # Map of chat_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Map of WebSocket -> user_id for tracking
        self.connection_users: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, chat_id: str, user_id: str):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = set()
        self.active_connections[chat_id].add(websocket)
        self.connection_users[websocket] = user_id
        print(f"[WebSocket] User {user_id} connected to chat {chat_id}. Total connections: {len(self.active_connections[chat_id])}")
        
        # Send online count to all users in this chat
        await self.broadcast_online_count(chat_id)

    def disconnect(self, websocket: WebSocket, chat_id: str):
        if chat_id in self.active_connections:
            self.active_connections[chat_id].discard(websocket)
            if len(self.active_connections[chat_id]) == 0:
                del self.active_connections[chat_id]
        
        user_id = self.connection_users.pop(websocket, "unknown")
        print(f"[WebSocket] User {user_id} disconnected from chat {chat_id}")

    async def broadcast_message(self, chat_id: str, message: dict):
        """Broadcast a message to all connections in a chat room"""
        if chat_id not in self.active_connections:
            return
        
        disconnected = set()
        message_text = json.dumps(message)
        
        for connection in self.active_connections[chat_id]:
            try:
                await connection.send_text(message_text)
            except Exception as e:
                print(f"[WebSocket] Error broadcasting to connection: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected websockets
        for conn in disconnected:
            self.disconnect(conn, chat_id)

    async def broadcast_online_count(self, chat_id: str):
        """Broadcast the current online user count to all connections"""
        if chat_id not in self.active_connections:
            return
        
        count = len(self.active_connections[chat_id])
        await self.broadcast_message(chat_id, {
            "type": "online_count",
            "count": count,
            "timestamp": datetime.utcnow().isoformat()
        })

    def get_online_count(self, chat_id: str) -> int:
        """Get the number of active connections for a chat"""
        return len(self.active_connections.get(chat_id, set()))


manager = ConnectionManager()


async def get_current_user_from_token(token: str) -> str:
    """Verify WebSocket token and return user_id"""
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        return user_id
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


@router.websocket("/ws/chat/{chat_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    chat_id: str,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time chat
    
    - Clients connect with: ws://host/api/v1/ws/chat/{chat_id}?token={jwt_token}
    - Receives new messages in real-time
    - Broadcasts messages to all connected users
    - Tracks online user count
    """
    try:
        # Authenticate user from token
        user_id = await get_current_user_from_token(token)
        
        # Connect to chat room
        await manager.connect(websocket, chat_id, user_id)
        
        try:
            # Send welcome message
            await websocket.send_json({
                "type": "connected",
                "message": f"Connected to chat {chat_id}",
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Keep connection alive and handle incoming messages
            while True:
                # Wait for messages from client
                data = await websocket.receive_text()
                
                try:
                    message_data = json.loads(data)
                    
                    # Handle different message types
                    if message_data.get("type") == "ping":
                        # Respond to ping with pong
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    elif message_data.get("type") == "message":
                        # This is a chat message - in a full implementation,
                        # you'd save it to DB here and broadcast
                        # For now, just echo it back to demonstrate WebSocket works
                        await manager.broadcast_message(chat_id, {
                            "type": "new_message",
                            "message": message_data.get("message"),
                            "user_id": user_id,
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, chat_id)
            await manager.broadcast_online_count(chat_id)
            print(f"[WebSocket] Client disconnected from chat {chat_id}")
            
    except HTTPException as e:
        # Authentication failed
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=e.detail)
    except Exception as e:
        print(f"[WebSocket] Error in websocket endpoint: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason=str(e))


@router.get("/ws/chat/{chat_id}/online")
async def get_online_count(chat_id: str):
    """HTTP endpoint to get current online count for a chat"""
    return {
        "chat_id": chat_id,
        "online_count": manager.get_online_count(chat_id),
        "timestamp": datetime.utcnow().isoformat()
    }
