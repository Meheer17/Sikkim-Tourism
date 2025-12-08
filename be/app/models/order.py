from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, List, Annotated, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class PaymentStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class OrderStatus(str, Enum):
    created = "created"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class OrderBase(BaseModel):
    service_id: str  # references service._id
    business_id: str  # references business._id
    user_id: str  # references user._id
    payment_status: PaymentStatus = PaymentStatus.pending
    order_status: OrderStatus = OrderStatus.created
    amount: float = Field(..., ge=0)
    # Metadata for flexible data storage (from_time, to_time, quantity, etc.)
    metadata: Optional[Dict[str, Any]] = None

    @field_validator("service_id", "business_id", "user_id")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class OrderCreate(BaseModel):
    service_id: str  # references service._id
    business_id: str  # references business._id
    amount: float = Field(..., ge=0)
    metadata: Optional[Dict[str, Any]] = None

    @field_validator("service_id", "business_id")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class OrderUpdate(BaseModel):
    payment_status: Optional[PaymentStatus] = None
    order_status: Optional[OrderStatus] = None
    amount: Optional[float] = Field(None, ge=0)
    metadata: Optional[Dict[str, Any]] = None


class OrderInDB(OrderBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class Order(OrderBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
