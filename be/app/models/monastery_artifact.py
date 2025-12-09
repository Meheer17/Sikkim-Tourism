from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class MonasteryArtifactMetadata(BaseModel):
    """Metadata for monastery artifacts"""
    age: Optional[str] = None
    material: Optional[str] = None
    dimensions: Optional[str] = None
    historical_period: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow additional metadata fields


class MonasteryArtifactCreate(BaseModel):
    """Create monastery artifact"""
    monastery_id: str = Field(..., description="ID of the monastery")
    name: str = Field(..., max_length=255, description="Artifact name")
    description: str = Field(..., description="Artifact description")
    category: str = Field(..., description="Category: manuscript, artifact, image, document, other")
    file_id: str = Field(..., description="File ID from upload service")
    file_url: str = Field(..., description="URL to the uploaded file")
    thumbnail_url: Optional[str] = None
    metadata: Optional[MonasteryArtifactMetadata] = None
    tags: Optional[List[str]] = None


class MonasteryArtifact(MonasteryArtifactCreate):
    """Monastery artifact"""
    id: str
    created_at: datetime
    updated_at: datetime


class MonasteryArtifactInDB(MonasteryArtifact):
    """Monastery artifact in database"""
    pass


class ArtifactStats(BaseModel):
    """Artifact statistics"""
    total: int
    by_category: Dict[str, int]
    storage_used: int  # in bytes
    storage_limit: int  # in bytes
