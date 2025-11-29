import io
from typing import Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, UploadFile, status
from telethon import TelegramClient
from telethon.tl.types import DocumentAttributeFilename

from app.core.config import settings
from app.core.database import get_database
from app.schemas.file import FileUploadResponse, FileMetadata

class TelegramStorageService:
    """Service for Telegram file storage using Telethon"""
    def __init__(self):
        self.api_id = settings.TELEGRAM_API_ID
        self.api_hash = settings.TELEGRAM_API_HASH
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self.session_name = settings.TELEGRAM_SESSION_NAME
        self.db = get_database()
        self.collection = self.db.files
        self.client: Optional[TelegramClient] = None

    async def get_client(self) -> TelegramClient:
        if self.client is None or not self.client.is_connected():
            self.client = TelegramClient(self.session_name, self.api_id, self.api_hash)
            await self.client.start()
        return self.client

    async def upload_file(self, file: UploadFile, user_id: str) -> FileUploadResponse:
        try:
            content = await file.read()
            size = len(content)
            client = await self.get_client()
            message = await client.send_file(self.chat_id, io.BytesIO(content), attributes=[DocumentAttributeFilename(file_name=file.filename)], force_document=True)
            telegram_file_id = None
            if message.document:
                telegram_file_id = getattr(message.document, 'id', None)
            telegram_message_id = message.id
            if not telegram_file_id:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get file ID from Telegram")
            file_metadata = {
                "user_id": user_id,
                "file_name": file.filename,
                "file_size": size,
                "file_type": file.content_type or "application/octet-stream",
                "telegram_file_id": str(telegram_file_id),
                "telegram_message_id": telegram_message_id,
                "telegram_access_hash": str(message.document.access_hash) if message.document else None,
                "uploaded_at": datetime.utcnow()
            }
            result = await self.collection.insert_one(file_metadata)
            file_id = str(result.inserted_id)
            return FileUploadResponse(file_id=file_id, file_name=file.filename, file_size=size, file_type=file.content_type or "application/octet-stream", telegram_file_id=str(telegram_file_id), uploaded_at=file_metadata["uploaded_at"])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to upload file: {str(e)}")

    async def download_file(self, file_id: str, user_id: str) -> tuple[bytes, str, str]:
        try:
            if not ObjectId.is_valid(file_id):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
            file_metadata = await self.collection.find_one({"_id": ObjectId(file_id), "user_id": user_id})
            if not file_metadata:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
            telegram_message_id = file_metadata["telegram_message_id"]
            client = await self.get_client()
            message = await client.get_messages(self.chat_id, ids=telegram_message_id)
            if not message or not message.document:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in Telegram")
            buf = io.BytesIO()
            await client.download_media(message, file=buf)
            content = buf.getvalue()
            return content, file_metadata["file_name"], file_metadata["file_type"]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to download file: {str(e)}")

    async def delete_file(self, file_id: str, user_id: str) -> bool:
        try:
            if not ObjectId.is_valid(file_id):
                return False
            file_metadata = await self.collection.find_one({"_id": ObjectId(file_id), "user_id": user_id})
            if not file_metadata:
                return False
            try:
                client = await self.get_client()
                await client.delete_messages(self.chat_id, message_ids=[file_metadata["telegram_message_id"]])
            except Exception:
                pass
            result = await self.collection.delete_one({"_id": ObjectId(file_id), "user_id": user_id})
            return result.deleted_count > 0
        except Exception:
            return False

    async def close(self):
        if self.client and self.client.is_connected():
            await self.client.disconnect()

    async def list_user_files(self, user_id: str, skip: int = 0, limit: int = 10):
        cursor = self.collection.find({"user_id": user_id}).skip(skip).limit(limit).sort("uploaded_at", -1)
        files = await cursor.to_list(length=limit)
        return [FileMetadata(_id=str(f["_id"]), user_id=f["user_id"], file_name=f["file_name"], file_size=f["file_size"], file_type=f["file_type"], telegram_file_id=f["telegram_file_id"], telegram_message_id=f["telegram_message_id"], uploaded_at=f["uploaded_at"]) for f in files]


telegram_storage_service = TelegramStorageService()
