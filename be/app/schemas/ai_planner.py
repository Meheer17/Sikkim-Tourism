from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


# Chat-based AI Planner schemas
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[datetime] = None


class ChatSessionCreate(BaseModel):
    initial_message: str


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    session_id: str
    message: str
    requires_input: bool = True
    is_complete: bool = False
    extracted_preferences: Optional[dict] = None


# Legacy question-based schemas (keeping for compatibility)
class QuestionOption(BaseModel):
    id: str
    text: str


class Question(BaseModel):
    id: str
    question: str
    type: str = Field(..., description="single or multiple")
    options: List[str]


class Answer(BaseModel):
    question_id: str
    answer: str | List[str]


class PlannerAnswers(BaseModel):
    answers: List[Answer]


class ActivityDetail(BaseModel):
    name: str
    description: str
    duration: str
    time: Optional[str] = None


class DayItinerary(BaseModel):
    day: int
    title: str
    activities: List[ActivityDetail]


class TravelPlan(BaseModel):
    id: str
    title: str
    duration: str
    budget: str
    description: str
    highlights: List[str]
    activities: List[str]
    accommodation: str
    best_for: str
    rating: float
    image_color: str
    detailed_itinerary: List[DayItinerary]
    locations_included: List[str]  # Location IDs
    estimated_costs: dict


class TravelPlanResponse(BaseModel):
    plans: List[TravelPlan]
    generated_at: datetime
    based_on_preferences: dict
    conversation_history: Optional[List[ChatMessage]] = None
