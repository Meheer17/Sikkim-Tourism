from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException

from app.core.security import get_current_user_id, get_current_user_id_optional
from app.services.ai_planner_service import ai_planner_service
from app.schemas.ai_planner import (
    Question, 
    PlannerAnswers, 
    TravelPlanResponse,
    ChatSessionCreate,
    ChatMessageRequest,
    ChatResponse
)
from app.schemas.ai_planner import TriggerRequest, TriggerResponse

router = APIRouter()


# NEW: Chat-based AI Travel Planning Endpoints

@router.post("/chat/start", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def start_chat_session(
    chat_start: ChatSessionCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Start a new conversational AI travel planning session.
    
    Send your initial message like:
    - "I need a 3-day adventure trip to Sikkim"
    - "Planning a honeymoon, what do you recommend?"
    - "I want to visit Sikkim with my family next month"
    
    The AI will respond and ask follow-up questions to understand your preferences.
    """
    try:
        response = await ai_planner_service.create_chat_session(chat_start.initial_message)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start chat session: {str(e)}"
        )


@router.post("/chat/message", response_model=ChatResponse)
async def send_chat_message(
    chat_message: ChatMessageRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Continue an existing chat conversation.
    
    Send your response to the AI's questions. The AI will:
    - Collect information about your trip preferences
    - Ask follow-up questions for missing details
    - Indicate when enough info is collected (is_complete=true)
    """
    try:
        response = await ai_planner_service.continue_chat(
            chat_message.session_id,
            chat_message.message
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )


@router.post("/chat/{session_id}/generate", response_model=TravelPlanResponse)
async def generate_plans_from_chat(
    session_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Generate travel plans from a completed chat conversation.
    
    Only works when the AI has collected enough information (is_complete=true).
    Returns 3 personalized travel plans based on the conversation.
    """
    try:
        travel_plans = await ai_planner_service.generate_plans_from_chat(session_id)
        return travel_plans
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate plans: {str(e)}"
        )



@router.post('/trigger', response_model=TriggerResponse)
async def trigger_event(
    trigger: TriggerRequest,
    current_user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """
    Receive a movement trigger from client devices.

    Request JSON:
    {
      "type": "standing|walking|driving",
      "time": "ISO datetime (optional)",
      "position": { "x": <float>, "y": <float> }
    }

    For now this endpoint passes the trigger to the AI planner service which returns a stub response.
    Authentication is optional for this endpoint (unauthenticated requests allowed).
    """
    try:
        # If no user is authenticated, return a default response
        if not current_user_id:
            return TriggerResponse(
                message="Trigger received (unauthenticated)",
                gemini=None,
                data={"position": trigger.position}
            )
        
        response = await ai_planner_service.trigger_event(current_user_id, trigger)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process trigger: {str(e)}"
        )


# LEGACY: Question-based endpoints (keeping for backward compatibility)

@router.get("/questions", response_model=List[Question])
async def get_planner_questions(
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get the questionnaire for AI travel planning.
    Returns a list of questions with options for users to answer.
    
    LEGACY: Consider using the new /chat/start endpoint for a better conversational experience.
    """
    questions = await ai_planner_service.get_questions()
    return questions


@router.post("/generate", response_model=TravelPlanResponse)
async def generate_travel_plans(
    planner_answers: PlannerAnswers,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Generate personalized travel plans based on user answers.
    Uses Gemini AI to create 3 customized itineraries using real location
    and business data from the database.
    
    LEGACY: Consider using the new chat-based flow for a better experience.
    """
    if not planner_answers.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No answers provided"
        )
    
    try:
        travel_plans = await ai_planner_service.generate_travel_plans(planner_answers.answers)
        
        if not travel_plans.plans:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate travel plans. Please try again."
            )
        
        return travel_plans
    
    except Exception as e:
        print(f"Error generating travel plans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate travel plans: {str(e)}"
        )
