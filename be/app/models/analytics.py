from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MonthlyUserAnalytics(BaseModel):
    """Model for monthly user analytics"""
    month_number: int = Field(..., ge=1, le=12, description="Month number (1-12)")
    year: int = Field(..., description="Year")
    actual_data: int = Field(default=0, description="Actual user count for the month")
    predicted_data: int = Field(default=0, description="Predicted user count from Prophet model")
    predicted_at: datetime = Field(..., description="Timestamp when prediction was made")

    model_config = {"json_schema_extra": {
        "example": {
            "month_number": 12,
            "year": 2025,
            "actual_data": 45,
            "predicted_data": 50,
            "predicted_at": "2025-12-09T10:00:00Z"
        }
    }}
