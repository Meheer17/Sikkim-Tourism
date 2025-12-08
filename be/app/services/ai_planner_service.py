from bson import ObjectId
import google.generativeai as genai
from typing import List, Dict, Any, Optional
import asyncio
import time
import json
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import random
import uuid
from fastapi import HTTPException, status

from app.core.config import settings
from app.services.location_service import location_service
from app.services.business_service import business_service
from app.schemas.ai_planner import (
    Question, 
    Answer, 
    TravelPlan, 
    TravelPlanResponse,
    DayItinerary,
    ActivityDetail,
    ChatMessage,
    ChatResponse
)

from app.schemas.ai_planner import TriggerRequest, TriggerResponse
from app.core.database import get_database
from app.utils.encryption import encrypt_text, decrypt_text


# In-memory storage for chat sessions (in production, use Redis or database)
chat_sessions: Dict[str, Dict[str, Any]] = {}


class AIPlannerService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Configure safety settings to be less restrictive for travel planning
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_ONLY_HIGH"
                }
            ]
            self.model = genai.GenerativeModel('gemini-flash-latest', safety_settings=safety_settings)
        else:
            self.model = None

        # Prepare IST timezone resiliently: prefer zoneinfo but fall back to fixed offset
        try:
            self.ist_zone = ZoneInfo("Asia/Kolkata")
        except Exception:
            # Fallback to fixed +5:30 offset if tzdata is not available on the host
            self.ist_zone = timezone(timedelta(hours=5, minutes=30))

    async def _call_model_generate(self, prompt: str, retries: int = 3, backoff: float = 1.0):
        """Call Gemini model.generate_content in a thread with retries/backoff to handle transient network errors."""
        if not self.model:
            raise Exception("Gemini model not configured")

        last_exc = None
        for attempt in range(1, retries + 1):
            try:
                # Run the blocking SDK call in a thread
                resp = await asyncio.to_thread(self.model.generate_content, prompt)
                return resp
            except Exception as e:
                last_exc = e
                print(f"Attempt {attempt} failed calling Gemini: {e}")
                if attempt < retries:
                    sleep_for = backoff * (2 ** (attempt - 1))
                    print(f"Retrying Gemini call in {sleep_for}s (attempt {attempt + 1}/{retries})")
                    await asyncio.sleep(sleep_for)
                else:
                    print("Gemini call failed after retries; raising last exception")
                    raise
    
    # Chat-based travel planning methods
    
    async def create_chat_session(self, initial_message: str) -> ChatResponse:
        """Create a new chat session and handle the first user message"""
        try:
            if not self.model:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Gemini API is not configured"
                )
            
            session_id = str(uuid.uuid4())
            
            # Fetch database context (same as before)
            locations = await self._get_locations_from_db()
            if not locations:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="No locations available in database"
                )
            
            # Create system prompt for conversational assistant
            system_prompt = self._create_system_prompt(locations)
            
            # Initialize chat history
            messages = [
                ChatMessage(role="system", content=system_prompt, timestamp=datetime.now()),
                ChatMessage(role="user", content=initial_message, timestamp=datetime.now())
            ]
            
            # Get AI response
            ai_response = await self._get_ai_chat_response(messages, locations)
            
            # Store session
            chat_sessions[session_id] = {
                "messages": messages + [ChatMessage(role="assistant", content=ai_response["message"], timestamp=datetime.now())],
                "locations": locations,
                "preferences": ai_response.get("preferences", {}),
                "is_ready": ai_response.get("is_ready", False),
                "created_at": datetime.now()
            }
            print(f"✅ Created chat session: {session_id}, is_ready: {ai_response.get('is_ready', False)}")
            print(f"📊 Total active sessions: {len(chat_sessions)}")
            
            return ChatResponse(
                session_id=session_id,
                message=ai_response["message"],
                requires_input=not ai_response.get("is_ready", False),
                is_complete=ai_response.get("is_ready", False),
                extracted_preferences=ai_response.get("preferences")
            )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error in create_chat_session: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create chat session: {str(e)}"
            )
    
    async def continue_chat(self, session_id: str, user_message: str) -> ChatResponse:
        """Continue an existing chat conversation"""
        if not self.model:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API is not configured"
            )
        
        # Retrieve session
        session = chat_sessions.get(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found. Please start a new conversation."
            )
        
        # Add user message
        session["messages"].append(
            ChatMessage(role="user", content=user_message, timestamp=datetime.now())
        )
        
        # Get AI response
        ai_response = await self._get_ai_chat_response(
            session["messages"], 
            session["locations"],
            session["preferences"]
        )
        
        # Update session
        session["messages"].append(
            ChatMessage(role="assistant", content=ai_response["message"], timestamp=datetime.now())
        )
        session["preferences"].update(ai_response.get("preferences", {}))
        session["is_ready"] = ai_response.get("is_ready", False)
        
        return ChatResponse(
            session_id=session_id,
            message=ai_response["message"],
            requires_input=not ai_response.get("is_ready", False),
            is_complete=ai_response.get("is_ready", False),
            extracted_preferences=ai_response.get("preferences")
        )
    
    async def generate_plans_from_chat(self, session_id: str) -> TravelPlanResponse:
        """Generate travel plans from a completed chat session"""
        print(f"🔍 Looking for session: {session_id}")
        print(f"📊 Available sessions: {list(chat_sessions.keys())}")
        
        session = chat_sessions.get(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chat session not found. Session may have expired. Please start a new conversation. Active sessions: {len(chat_sessions)}"
            )
        
        if not session.get("is_ready"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough information collected yet. Please continue the conversation."
            )
        
        # Generate plans using collected preferences
        plans = await self._generate_plans_from_preferences(
            session["preferences"],
            session["locations"]
        )
        
        # Filter out system messages from conversation history
        conversation_history = []
        for msg in session["messages"]:
            try:
                if isinstance(msg, ChatMessage):
                    if msg.role != "system":
                        conversation_history.append(msg)
                elif isinstance(msg, dict):
                    if msg.get("role") != "system":
                        conversation_history.append(ChatMessage(**msg))
            except Exception as e:
                print(f"Error processing message for history: {e}")
                continue
        
        return TravelPlanResponse(
            plans=plans,
            generated_at=datetime.now(),
            based_on_preferences=session["preferences"],
            conversation_history=conversation_history
        )
    
    async def _get_ai_chat_response(
        self, 
        messages: List[ChatMessage], 
        locations: List[Any],
        current_preferences: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Get AI response in conversation, extract preferences, and determine if ready to plan"""
        
        try:
            # Build conversation context for Gemini
            conversation_parts = []
            for msg in messages:
                try:
                    role = msg.role if hasattr(msg, 'role') else str(msg.get('role', 'unknown'))
                    content = msg.content if hasattr(msg, 'content') else str(msg.get('content', ''))
                    conversation_parts.append(f"{role.upper()}: {content}")
                except Exception as msg_err:
                    print(f"Error processing message: {msg_err}, msg={msg}")
                    continue
            
            conversation_text = "\n\n".join(conversation_parts)
            print(f"Conversation text built successfully, length: {len(conversation_text)}")
        except Exception as e:
            print(f"Error building conversation text: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to build conversation: {str(e)}"
            )
        
        # Create prompt for response generation
        response_prompt = f"""
{conversation_text}

RESPOND IN THIS JSON FORMAT:
{{
    "message": "Your friendly response to the user with a question if needed",
    "preferences": {{
        "duration_days": <number or null>,
        "budget_category": "budget|moderate|comfortable|luxury or null",
        "traveler_type": "adventure|culture|nature|relaxation|photography or null",
        "companions": "solo|couple|family|friends or null",
        "interests": ["interest1", "interest2", ...],
        "special_requirements": ["requirement1", ...]
    }},
    "is_ready": <true if you have enough info to generate plans, false otherwise>
}}

Only set is_ready to true when you have at least: duration, budget, and traveler type.
"""
        
        try:
            print(f"Calling Gemini API with prompt length: {len(response_prompt)}")
            response = await self._call_model_generate(response_prompt)
            
            # Check if response was blocked by safety filters
            if not response.candidates or not response.candidates[0].content.parts:
                print(f"⚠️ Gemini response blocked or empty. Finish reason: {response.candidates[0].finish_reason if response.candidates else 'No candidates'}")
                
                # Return a fallback response asking user to clarify
                return {
                    "message": "I'd be happy to help you plan a trip to Sikkim! Note that I specialize in Sikkim tourism. Could you please confirm if you meant Sikkim, or would you like recommendations for visiting Sikkim instead? Also, let me know your budget range (budget-friendly, moderate, or luxury) and any specific interests (nature, culture, adventure, relaxation)?",
                    "preferences": {
                        "duration_days": None,
                        "budget_category": None,
                        "traveler_type": None,
                        "companions": None,
                        "interests": [],
                        "special_requirements": []
                    },
                    "is_ready": False
                }
            
            print(f"Gemini API response received, text length: {len(response.text)}")
            print(f"Gemini response text: {response.text[:500]}")
            result = self._parse_json_response(response.text)
            print(f"Parsed result: {result}")
            return result
        except ValueError as e:
            # Handle safety filter blocking
            if "finish_reason" in str(e):
                print(f"⚠️ Gemini safety filter triggered: {e}")
                return {
                    "message": "I'd be happy to help you plan a trip to Sikkim! To get started, could you tell me:\n1. Your budget range (budget-friendly, moderate, or luxury)\n2. What type of experience you're looking for (adventure, relaxation, culture, nature)\n3. Any specific interests or activities?\n\nNote: I specialize in Sikkim tourism specifically.",
                    "preferences": {
                        "duration_days": None,
                        "budget_category": None,
                        "traveler_type": None,
                        "companions": None,
                        "interests": [],
                        "special_requirements": []
                    },
                    "is_ready": False
                }
            raise
        except Exception as e:
            print(f"Error in _get_ai_chat_response: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get AI response: {str(e)}"
            )
    
    def _create_system_prompt(self, locations: List[Any]) -> str:
        """Create system prompt with database context"""
        try:
            location_context = "\n".join([
                f"- {loc.get('name', 'Unknown')}: {loc.get('description', loc.get('short_description', 'No description'))[:100]}"
                for loc in locations[:20]  # First 20 locations
            ])
        except Exception as e:
            print(f"Error creating location context: {e}")
            location_context = "Various locations in Sikkim"
        
        return f"""You are a helpful Sikkim travel planning assistant. You specialize in creating travel plans for Sikkim, India.

IMPORTANT: You ONLY plan trips to Sikkim. If a user mentions other locations (like Shillong, Darjeeling, etc.), politely clarify that you specialize in Sikkim tourism and ask if they'd like to visit Sikkim instead.

Available Sikkim locations in our database:

{location_context}

Your job:
1. Have a natural, friendly conversation to understand the user's preferences
2. If they mention non-Sikkim locations, politely redirect to Sikkim tourism
3. Ask follow-up questions to collect: duration, budget, interests, companions
4. When you have enough information, indicate you're ready to generate personalized plans
5. ONLY reference locations from the Sikkim database provided above
6. Be enthusiastic about Sikkim's natural beauty, culture, and attractions


IMPORTANT: ONLY GIVE CONSISE INFO"""

    async def trigger_event(self, user_id: str, trigger: TriggerRequest) -> TriggerResponse:
        """Handle a movement trigger (standing|walking|driving).

        For now this is a pass-through stub that logs the trigger and returns a success response.
        Later this should construct a Gemini prompt and invoke the model.
        """
        try:
            print(f"🔔 Trigger received from user={user_id}: type={trigger.type}, time={trigger.time}, position={trigger.position}")

            # Admin check: skip AI suggestions for admin users
            try:
                usr = await user_service.get_by_id(user_id)
                if usr and getattr(usr, 'role', None) == 'admin':
                    print(f"[AIPlannerService] Admin user {user_id} - skipping AI suggestions")
                    return TriggerResponse(
                        status="ok",
                        message="AI suggestions disabled for admin accounts",
                        data={"type": trigger.type, "position": {"x": trigger.position.x, "y": trigger.position.y}},
                        gemini={"type": "no_action", "no_popup": True}
                    )
            except Exception as e:
                print(f"[AIPlannerService] Warning: failed to check user role for {user_id}: {e}")

            # Normalize incoming trigger time to IST (Asia/Kolkata), using self.ist_zone which has a safe fallback
            try:
                if trigger.time:
                    if trigger.time.tzinfo is None:
                        trigger_time_ist = trigger.time.replace(tzinfo=self.ist_zone)
                    else:
                        trigger_time_ist = trigger.time.astimezone(self.ist_zone)
                else:
                    trigger_time_ist = datetime.now(tz=self.ist_zone)
            except Exception as e:
                print(f"[AIPlannerService] Failed to normalize trigger time, falling back to UTC: {e}")
                trigger_time_ist = datetime.utcnow()

            # Fetch recent actions for cooldown enforcement
            recent_actions_map: Dict[str, str] = {}
            try:
                db = get_database()
                if db is not None:
                    query = {"uid": ObjectId(user_id)}
                    cursor = db.triggers.find(query, {"action": 1, "type": 1, "createdAt": 1}).sort("createdAt", -1).limit(20)
                    docs = await cursor.to_list(length=20)
                    for d in docs:
                        action = d.get("action") or d.get("type") or None
                        created = d.get("createdAt") or d.get("created_at") or d.get("time")
                        if not action or not created:
                            continue
                        try:
                            created_iso = created.isoformat()
                        except Exception:
                            created_iso = str(created)
                        if action not in recent_actions_map:
                            recent_actions_map[action] = created_iso
                    if recent_actions_map:
                        print(f"Found recent actions for user {user_id}: {recent_actions_map}")
            except Exception as e:
                print(f"Could not fetch recent triggers from DB: {e}")

            # Prepare prompt context values
            try:
                trigger_time_iso = trigger_time_ist.isoformat()
                hour = trigger_time_ist.hour
            except Exception:
                trigger_time_iso = None
                hour = None

            service_types = [
                {"type": "hotel", "category": "buy", "id": "6927dd74c83ad21b4792693d"},
                {"type": "restaurant", "category": "buy", "id": "6927dd74c83ad21b4792693e"},
                {"type": "cab", "category": "buy", "id": "6927dd74c83ad21b4792693f"},
                {"type": "guide", "category": "book", "id": "6927dd74c83ad21b47926940"},
                {"type": "event", "category": "event", "id": "6927dd74c83ad21b47926941"},
                {"type": "tourist_entry", "category": "tourist_entry", "id": "69330a6098cade204f63d80f"}
            ]

            recent_actions_json = json.dumps(recent_actions_map)

            prompt = f"""
You are a concise assistant that suggests an immediate contextual action when a mobile client reports movement triggers.

Input:
- trigger.type: {trigger.type}
- trigger.time: {trigger_time_iso}
- trigger.hour: {hour}
- trigger.position: {{"x": {trigger.position.x}, "y": {trigger.position.y}}}
- available service types (JSON): {service_types}
- recent_actions (last seen timestamps by action, JSON): {recent_actions_json}

COOLDOWN RULES (use these to avoid repeating suggestions too frequently):
- Minimum cooldowns (minutes): {{"restaurant": 160, "cab": 105, "hotel":160, "guide": 120, "event": 160, "tourist_entry": 160}}
- The `recent_actions` JSON shows when each action was last suggested/triggered for this user.
- If the best suggested action would violate the cooldown (i.e., last seen within the cooldown window), DO NOT suggest it again immediately.
- In such cases, return a JSON response with `type` set to the literal string "no_action" (no extra text), and set `agent_message` to a short friendly sentence offering to remind later.
- Example `no_action` buttons: positive {{"text": "Remind me", "action": "remind"}} and negative {{"text": "Dismiss", "action": "return"}}.

Goal:
Return a single JSON object (no extra text) in this exact shape:
{{
  "type": "<one of service types (e.g. restaurant)>",
  "agent_message": "Friendly short prompt to the user (1-2 sentences)",
  "buttons": {{
    "positive": {{"text": "<short text>", "action": "search|book|navigate|remind|return"}},
    "negative": {{"text": "<short text>", "action": "return"}}
  }}
}}

Hints:
- If the user is driving and the time looks like a common meal time (e.g., 11-14 lunchtime, 18-20 dinner), suggest a "restaurant" action and ask a friendly question like "It's around lunchtime — would you like me to find nearby places to eat?".
- If the user is standing near a point of interest, suggest "tourist_entry" or "event" where appropriate.
- Keep the agent_message friendly and concise. Buttons should be short words like "Yes", "No", "Show me".
- Do not include any explanatory text outside the JSON.

Remember
- Always respond with ONLY the JSON object as specified above.
- Always keep the messages and button texts concise and user-friendly.
"""

            gemini_result = None
            try:
                if not self.model:
                    raise Exception("Gemini model not configured")

                response = await self._call_model_generate(prompt)
                if not response.candidates or not response.candidates[0].content.parts:
                    raise Exception("Empty Gemini response or blocked by safety filter")

                gemini_json = self._parse_json_response(response.text)
                gemini_result = gemini_json
                # Attach a default nearby places query so the mobile client can call the locations API
                try:
                    lat = float(trigger.position.y)
                    lng = float(trigger.position.x)
                    radius = 1000  # default radius in meters (maps default-ish)
                    nearby_url = f"/api/v1/location?position_lat={lat}&position_lng={lng}&radius_m={radius}&skip=0&limit=50"
                    gemini_result.setdefault('nearby_url', nearby_url)
                except Exception:
                    pass

                # If model suggests no_action, suppress popups on the client by removing message/buttons and setting a flag
                try:
                    if isinstance(gemini_result, dict) and gemini_result.get('type') == 'no_action':
                        gemini_result.pop('agent_message', None)
                        gemini_result.pop('buttons', None)
                        gemini_result['no_popup'] = True
                except Exception as e:
                    print(f"Error applying no_action suppression to gemini result: {e}")

                # Server-side cooldown enforcement
                try:
                    cooldowns = {"restaurant": 160, "cab": 105, "hotel": 160, "guide": 120, "event": 160, "tourist_entry": 160}
                    if isinstance(gemini_result, dict):
                        suggested = gemini_result.get('type')
                        if suggested and suggested in recent_actions_map:
                            last_seen_iso = recent_actions_map.get(suggested)
                            try:
                                last_seen_dt = datetime.fromisoformat(last_seen_iso)
                            except Exception:
                                try:
                                    last_seen_dt = datetime.fromisoformat(last_seen_iso.replace('Z', '+00:00'))
                                except Exception:
                                    last_seen_dt = None

                            if last_seen_dt is not None and trigger_time_ist is not None:
                                elapsed_minutes = (trigger_time_ist - last_seen_dt).total_seconds() / 60.0
                                cd = cooldowns.get(suggested, 0)
                                if elapsed_minutes < cd:
                                    gemini_result = {
                                        "type": "no_action",
                                        "agent_message": "I'll remind you later.",
                                        "buttons": {"positive": {"text": "Remind me", "action": "remind"}, "negative": {"text": "Dismiss", "action": "return"}},
                                        "no_popup": True
                                    }
                                    print(f"Server cooldown enforced for user={user_id}, action={suggested}, elapsed_minutes={elapsed_minutes:.1f} < cooldown={cd}")
                except Exception as e:
                    print(f"Error enforcing cooldowns: {e}")
            except Exception as e:
                # Fallback: rule-based suggestion
                print(f"⚠️ Gemini trigger suggestion failed, falling back to rule-based: {e}")

                suggested_type = "restaurant"
                agent_message = "Would you like me to find nearby places to eat?"
                positive = {"text": "Yes", "action": "search"}
                negative = {"text": "No", "action": "return"}

                try:
                    if trigger.type == 'driving' and hour is not None:
                        if 11 <= hour <= 14:
                            agent_message = "It's around lunchtime — need nearby places to eat?"
                        elif 18 <= hour <= 20:
                            agent_message = "It's dinner time — would you like dinner suggestions nearby?"
                        else:
                            agent_message = "Need recommendations while you're on the move? I can find food, cabs, or places to stop."
                    elif trigger.type == 'walking':
                        agent_message = "Looking for something nearby? I can find cafes, events, or attractions."
                    elif trigger.type == 'standing':
                        agent_message = "You're nearby — would you like recommendations for nearby attractions or services?"
                except Exception:
                    pass

                gemini_result = {
                    "type": suggested_type,
                    "agent_message": agent_message,
                    "buttons": {"positive": positive, "negative": negative}
                }

                try:
                    lat = float(trigger.position.y)
                    lng = float(trigger.position.x)
                    radius = 1000
                    gemini_result["nearby_url"] = f"/api/v1/location?position_lat={lat}&position_lng={lng}&radius_m={radius}&skip=0&limit=50"
                except Exception:
                    pass

                try:
                    if isinstance(gemini_result, dict) and gemini_result.get('type') == 'no_action':
                        gemini_result.pop('agent_message', None)
                        gemini_result.pop('buttons', None)
                        gemini_result['no_popup'] = True
                except Exception as e:
                    print(f"Error applying no_action suppression to fallback gemini result: {e}")

            # Persist trigger and AI result
            try:
                db = get_database()
                if db is not None:
                    action_from_ai = None
                    try:
                        if isinstance(gemini_result, dict):
                            action_from_ai = gemini_result.get('type')
                    except Exception:
                        action_from_ai = None

                    # Encrypt sensitive trigger data
                    encrypted_type = await encrypt_text(user_id, trigger.type)
                    encrypted_action = await encrypt_text(user_id, action_from_ai) if action_from_ai else None
                    encrypted_position = None
                    if getattr(trigger, "position", None):
                        encrypted_x = await encrypt_text(user_id, str(trigger.position.x))
                        encrypted_y = await encrypt_text(user_id, str(trigger.position.y))
                        encrypted_position = {"x": encrypted_x, "y": encrypted_y}
                    
                    doc = {
                        "uid": ObjectId(user_id),
                        "type": encrypted_type,
                        "action": encrypted_action,
                        "position": encrypted_position,
                        "createdAt": trigger_time_ist,
                        "raw": trigger.dict()
                    }
                    try:
                        insert_result = await db.triggers.insert_one(doc)
                        print(f"Inserted trigger record for user={user_id}, id={insert_result.inserted_id}, action={action_from_ai}")
                    except Exception as ie:
                        print(f"Failed to insert trigger record: {ie}")
            except Exception as e:
                print(f"Could not persist trigger to DB: {e}")

            result = {
                "status": "ok",
                "message": "Trigger processed",
                "data": {
                    "type": trigger.type,
                    "time": trigger_time_iso,
                    "position": {"x": trigger.position.x, "y": trigger.position.y}
                },
                "gemini": gemini_result
            }

            return TriggerResponse(**result)
        except Exception as e:
            print(f"Error handling trigger_event: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to handle trigger: {str(e)}"
            )
    
    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON from Gemini response, handling markdown code blocks"""
        try:
            # Clean the response if it has markdown code blocks
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text: {response_text[:500]}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI returned invalid JSON response"
            )
    
    async def _generate_plans_from_preferences(
        self, 
        preferences: Dict[str, Any], 
        locations: List[Any]
    ) -> List[TravelPlan]:
        """Generate travel plans from extracted preferences (similar to existing method)"""
        
        print(f"🎯 Generating plans with preferences: {preferences}")
        print(f"📍 Available locations: {len(locations)}")
        
        prompt = self._create_planning_prompt(preferences, locations)
        print(f"📝 Prompt created, length: {len(prompt)}")
        
        try:
            print("🤖 Calling Gemini API for plan generation...")
            response = self.model.generate_content(prompt)
            
            # Check if response was blocked by safety filters
            if not response.candidates or not response.candidates[0].content.parts:
                print(f"⚠️ Gemini plan generation blocked. Finish reason: {response.candidates[0].finish_reason if response.candidates else 'No candidates'}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="AI safety filters blocked the response. This may be due to content concerns. Please try adjusting your preferences or try again."
                )
            
            print(f"✅ Gemini response received, length: {len(response.text)}")
            
            plans_data = self._parse_json_response(response.text)
            print(f"📊 Parsed plans data: {type(plans_data)}")
            
            # Validate and parse plans
            if not isinstance(plans_data, list):
                plans_data = plans_data.get("plans", [])
            
            print(f"🔢 Number of plans: {len(plans_data)}")
            plans = [TravelPlan(**plan) for plan in plans_data]
            
            # Validate plans use only database locations
            self._validate_plans_use_db_data(plans, locations, None)
            
            print(f"✅ Successfully generated {len(plans)} travel plans")
            return plans
            
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except ValueError as e:
            # Handle safety filter blocking
            if "finish_reason" in str(e):
                print(f"⚠️ Gemini safety filter triggered during plan generation: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="AI safety filters blocked the response. Please try generating plans again or adjust your preferences."
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse AI response: {str(e)}"
            )
        except Exception as e:
            print(f"❌ Error generating plans: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate travel plans: {str(e)}"
            )
    
    def _validate_plans_use_db_data(
        self, 
        plans: List[TravelPlan], 
        locations: List[Any],
        businesses: Optional[List[Dict]] = None
    ) -> None:
        """Validate that generated plans only reference database locations and businesses"""
        if isinstance(locations[0], dict):
            location_ids = {loc['id'] for loc in locations}
            location_names = {loc['name'].lower() for loc in locations}
        else:
            location_ids = {loc.get('_id') or loc.get('id') for loc in locations}
            location_names = {loc.get('name', '').lower() for loc in locations}
        
        if businesses:
            business_names = {biz['name'].lower() for biz in businesses}
        
        for plan in plans:
            # Check that location IDs are from database
            for loc_id in plan.locations_included:
                if loc_id not in location_ids:
                    print(f"Warning: Plan includes non-database location ID: {loc_id}")
            
            # Check highlights reference real locations
            for highlight in plan.highlights:
                highlight_lower = highlight.lower()
                found = any(loc_name in highlight_lower for loc_name in location_names)
                if not found:
                    print(f"Warning: Highlight may not reference database location: {highlight}")
    
    def _create_planning_prompt(self, preferences: Dict, locations: List[Any]) -> str:
        """Create prompt for plan generation from preferences"""
        
        try:
            locations_json = json.dumps([{
                "id": loc.get("id") or loc.get("_id"),
                "name": loc.get("name", "Unknown"),
                "description": loc.get("description") or loc.get("short_description", ""),
                "category": loc.get("category") or loc.get("type", ""),
                "activities": loc.get("activities", [])
            } for loc in locations], indent=2)
        except Exception as e:
            print(f"Error creating locations JSON: {e}")
            import traceback
            traceback.print_exc()
            locations_json = "[]"
        
        duration = preferences.get("duration_days", 3)
        budget = preferences.get("budget_category", "moderate")
        traveler_type = preferences.get("traveler_type", "nature")
        
        return f"""Generate 3 personalized travel plans for Sikkim based on these preferences:
- Duration: {duration} days
- Budget: {budget}
- Traveler Type: {traveler_type}
- Companions: {preferences.get('companions', 'not specified')}
- Interests: {', '.join(preferences.get('interests', []))}

AVAILABLE LOCATIONS (USE ONLY THESE):
{locations_json}

CRITICAL RULES:
1. Use ONLY locations from the provided database
2. Reference locations by their exact "id" in locations_included
3. Generate {duration}-day detailed itineraries
4. Match budget category: {budget}
5. Match traveler type: {traveler_type}

RESPOND IN THIS EXACT JSON FORMAT:
[
  {{
    "id": "plan_1",
    "title": "Plan Title",
    "duration": "{duration} days",
    "budget": "{budget.capitalize()}",
    "description": "Brief description",
    "highlights": ["highlight1", "highlight2", "highlight3"],
    "activities": ["activity1", "activity2"],
    "accommodation": "Accommodation type",
    "best_for": "Who is this for",
    "rating": 4.5,
    "image_color": "#hexcolor",
    "detailed_itinerary": [
      {{
        "day": 1,
        "title": "Day 1 Title",
        "activities": [
          {{
            "name": "Activity Name",
            "description": "What you'll do",
            "duration": "2 hours",
            "time": "09:00 AM"
          }}
        ]
      }}
    ],
    "locations_included": ["location_id_1", "location_id_2"],
    "estimated_costs": {{
      "accommodation": "₹X,XXX",
      "food": "₹X,XXX",
      "activities": "₹X,XXX",
      "transport": "₹X,XXX",
      "total": "₹X,XXX"
    }}
  }}
]"""
    
    # Legacy question-based methods (keeping for backward compatibility)
    
    async def get_questions(self) -> List[Question]:
        """Return the questionnaire for travel planning"""
        questions = [
            Question(
                id="1",
                question="What type of traveler are you?",
                type="single",
                options=['Adventure Seeker', 'Culture Enthusiast', 'Nature Lover', 'Relaxation Focused', 'Photography Buff']
            ),
            Question(
                id="2",
                question="What is your preferred travel duration?",
                type="single",
                options=['1-2 days', '3-5 days', '1 week', '2 weeks', 'Flexible']
            ),
            Question(
                id="3",
                question="What is your budget range?",
                type="single",
                options=['Budget (₹5k-15k)', 'Moderate (₹15k-30k)', 'Comfortable (₹30k-50k)', 'Luxury (₹50k+)']
            ),
            Question(
                id="4",
                question="Which activities interest you? (Select multiple)",
                type="multiple",
                options=['Trekking', 'Monastery Visits', 'River Rafting', 'Cable Car Rides', 'Local Cuisine', 'Shopping', 'Photography']
            ),
            Question(
                id="5",
                question="What is your preferred accommodation?",
                type="single",
                options=['Budget Hotels', 'Mid-range Hotels', 'Luxury Resorts', 'Homestays', 'No Preference']
            ),
            Question(
                id="6",
                question="When do you plan to travel?",
                type="single",
                options=['This Month', 'Next Month', 'Next 3 Months', 'Next 6 Months', 'Not Sure Yet']
            ),
            Question(
                id="7",
                question="Who are you traveling with?",
                type="single",
                options=['Solo', 'Partner/Spouse', 'Family', 'Friends', 'Group Tour']
            ),
        ]
        return questions
    
    async def _get_locations_from_db(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch all tourism locations from database"""
        locations = await location_service.get_all(skip=0, limit=limit)
        
        if not locations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No locations found in database. Please add tourism locations first."
            )
        
        location_data = []
        for loc in locations:
            location_data.append({
                "id": str(loc.id),
                "name": loc.name,
                "description": loc.description,
                "short_description": loc.short_description,
                "position": {"lat": loc.position.y, "lng": loc.position.x},
                "type": loc.type,
                "metadata": loc.metadata
            })
        
        return location_data
    
    async def _get_businesses_from_db(self, limit: int = 30) -> List[Dict[str, Any]]:
        """Fetch accommodations and services from database"""
        businesses = await business_service.get_all(skip=0, limit=limit)
        
        business_data = []
        for biz in businesses:
            business_data.append({
                "id": str(biz.id),
                "name": biz.name,
                "description": biz.description,
                "business_type": biz.business_type,
                "position": {"lat": biz.position.y, "lng": biz.position.x},
                "contact": biz.contact,
                "metadata": biz.metadata
            })
        
        return business_data
    
    def _parse_answers(self, answers: List[Answer]) -> Dict[str, Any]:
        """Parse answers into structured preferences"""
        preferences = {}
        
        for answer in answers:
            q_id = answer.question_id
            if q_id == "1":
                preferences["traveler_type"] = answer.answer
            elif q_id == "2":
                preferences["duration"] = answer.answer
            elif q_id == "3":
                preferences["budget"] = answer.answer
            elif q_id == "4":
                preferences["activities"] = answer.answer if isinstance(answer.answer, list) else [answer.answer]
            elif q_id == "5":
                preferences["accommodation"] = answer.answer
            elif q_id == "6":
                preferences["travel_time"] = answer.answer
            elif q_id == "7":
                preferences["travel_companions"] = answer.answer
        
        return preferences
    
    def _extract_duration_days(self, duration_str: str) -> int:
        """Extract number of days from duration string"""
        if "1-2" in duration_str:
            return 2
        elif "3-5" in duration_str:
            return 4
        elif "week" in duration_str.lower():
            if "2" in duration_str:
                return 14
            return 7
        else:
            return 5  # Default
    
    def _extract_budget_range(self, budget_str: str) -> tuple:
        """Extract budget range from string"""
        if "5k-15k" in budget_str:
            return (5000, 15000)
        elif "15k-30k" in budget_str:
            return (15000, 30000)
        elif "30k-50k" in budget_str:
            return (30000, 50000)
        elif "50k+" in budget_str:
            return (50000, 100000)
        return (10000, 30000)
    
    async def generate_travel_plans(self, answers: List[Answer]) -> TravelPlanResponse:
        """Generate AI-powered travel plans using Gemini API and database data ONLY"""
        
        # Validate Gemini API is configured
        if not self.model or not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API is not configured. Please contact administrator to set up GEMINI_API_KEY."
            )
        
        # Parse user preferences
        preferences = self._parse_answers(answers)
        
        # Fetch data from database - will raise 404 if no data
        locations = await self._get_locations_from_db()
        businesses = await self._get_businesses_from_db()
        
        # Extract key parameters
        num_days = self._extract_duration_days(preferences.get("duration", "3-5 days"))
        budget_min, budget_max = self._extract_budget_range(preferences.get("budget", "Moderate (₹15k-30k)"))
        
        # Prepare prompt for Gemini with STRICT instructions to use only provided data
        prompt = self._create_gemini_prompt(preferences, locations, businesses, num_days, budget_min, budget_max)
        
        # Generate plans with Gemini - NO FALLBACK
        try:
            response = self.model.generate_content(prompt)
            plans_data = self._parse_gemini_response(response.text, locations, businesses)
            
            if not plans_data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="AI failed to generate valid travel plans. Please try again."
                )
            
            # Validate that plans only use database locations
            self._validate_plans_use_db_data(plans_data, locations, businesses)
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Gemini API error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate travel plans with AI: {str(e)}"
            )
        
        return TravelPlanResponse(
            plans=plans_data,
            generated_at=datetime.now(),
            based_on_preferences=preferences
        )
    
    def _validate_plans_use_db_data(
        self, 
        plans: List[TravelPlan], 
        locations: List[Any], 
        businesses: Optional[List[Dict]] = None
    ) -> None:
        """Validate that generated plans only reference database locations and businesses"""
        if isinstance(locations[0], dict):
            location_ids = {loc['id'] for loc in locations}
            location_names = {loc['name'].lower() for loc in locations}
        else:
            location_ids = {loc.get('_id') or loc.get('id') for loc in locations}
            location_names = {loc.get('name', '').lower() for loc in locations}
        
        if businesses:
            business_names = {biz['name'].lower() for biz in businesses}
        
        for plan in plans:
            # Check that location IDs are from database
            for loc_id in plan.locations_included:
                if loc_id not in location_ids:
                    print(f"Warning: Plan includes non-database location ID: {loc_id}")
            
            # Check highlights reference real locations
            for highlight in plan.highlights:
                highlight_lower = highlight.lower()
                found = any(loc_name in highlight_lower for loc_name in location_names)
                if not found:
                    print(f"Warning: Highlight may not reference database location: {highlight}")
    
    def _create_gemini_prompt(
        self, 
        preferences: Dict[str, Any], 
        locations: List[Dict], 
        businesses: List[Dict],
        num_days: int,
        budget_min: int,
        budget_max: int
    ) -> str:
        """Create detailed prompt for Gemini API with STRICT data source requirements"""
        
        # Create detailed location list with IDs
        location_details = "\n".join([
            f"ID: {loc['id']} | Name: {loc['name']} | Description: {loc['short_description']} | Type: {loc['type']} | Coordinates: ({loc['position']['lat']}, {loc['position']['lng']})"
            for loc in locations[:40]
        ])
        
        # Create detailed business list
        business_details = "\n".join([
            f"ID: {biz['id']} | Name: {biz['name']} | Type: {biz.get('business_type', 'N/A')} | Description: {biz['description']}"
            for biz in businesses[:25]
        ])
        
        prompt = f"""You are an expert travel planner for Sikkim, India. Generate 3 diverse travel itineraries based STRICTLY on the database locations and businesses provided below.

USER PREFERENCES:
- Traveler Type: {preferences.get('traveler_type', 'General')}
- Duration: {num_days} days
- Budget Range: ₹{budget_min:,} - ₹{budget_max:,}
- Preferred Activities: {', '.join(preferences.get('activities', ['Sightseeing']))}
- Accommodation: {preferences.get('accommodation', 'Mid-range Hotels')}
- Travel Companions: {preferences.get('travel_companions', 'Solo')}

AVAILABLE LOCATIONS FROM DATABASE (USE ONLY THESE):
{location_details}

AVAILABLE ACCOMMODATIONS & SERVICES FROM DATABASE (USE ONLY THESE):
{business_details}

CRITICAL INSTRUCTIONS:
1. You MUST ONLY use locations and businesses from the lists above
2. Do NOT invent, imagine, or suggest any locations not in the database
3. Use the exact names from the database
4. Include the location IDs in locations_included array
5. Create 3 different travel plans with varying themes matching user preferences
6. Each plan must include:
   - A catchy title matching the theme
   - Duration matching {num_days} days / {num_days-1} nights
   - Budget estimate within ₹{budget_min:,} - ₹{budget_max:,}
   - Comprehensive description
   - 4-7 key highlights using EXACT location names from database
   - Day-by-day detailed itinerary with specific database locations
   - Accommodation recommendations from database businesses
   - Realistic timing and distances between locations
   - Estimated costs breakdown
   - Best suited traveler type

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{{
  "plans": [
    {{
      "title": "Adventure Through Sikkim's Peaks",
      "duration": "{num_days} Days / {num_days-1} Nights",
      "budget": "₹{budget_min//1000}k - ₹{budget_max//1000}k",
      "description": "Detailed 2-3 sentence description",
      "highlights": ["Exact Location Name 1", "Exact Location Name 2", "Exact Location Name 3", "Exact Location Name 4"],
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "accommodation": "Type from preferences",
      "best_for": "Target audience from preferences",
      "rating": 4.7,
      "image_color": "#10b981",
      "detailed_itinerary": [
        {{
          "day": 1,
          "title": "Day 1: Specific Theme",
          "activities": [
            {{
              "name": "Visit Exact Location Name",
              "description": "What to do there based on database info",
              "duration": "2-3 hours",
              "time": "09:00 AM"
            }},
            {{
              "name": "Lunch at Exact Business Name",
              "description": "Local cuisine experience",
              "duration": "1 hour",
              "time": "12:30 PM"
            }}
          ]
        }}
      ],
      "locations_included": ["location_id_1", "location_id_2", "location_id_3"],
      "estimated_costs": {{
        "accommodation": {int(budget_min * 0.4)},
        "food": {int(budget_min * 0.25)},
        "transport": {int(budget_min * 0.15)},
        "activities": {int(budget_min * 0.15)},
        "miscellaneous": {int(budget_min * 0.05)}
      }}
    }}
  ]
}}

VALIDATION CHECKLIST BEFORE RETURNING:
✓ All location names are from the database list above
✓ All business names are from the database list above
✓ Location IDs match the database IDs
✓ No fictional or imagined places included
✓ JSON is valid with no markdown formatting
✓ All 3 plans are different themes
✓ Budget calculations are realistic
✓ Timing in itinerary is logical

Return ONLY the JSON response, nothing else."""
        
        return prompt
    
    def _parse_gemini_response(
        self, 
        response_text: str, 
        locations: List[Dict], 
        businesses: List[Dict]
    ) -> List[TravelPlan]:
        """Parse Gemini's JSON response into TravelPlan objects"""
        
        try:
            # Clean the response if it has markdown code blocks
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            data = json.loads(cleaned_text)
            plans = []
            
            for idx, plan_data in enumerate(data.get("plans", [])):
                # Build detailed itinerary
                itinerary = []
                for day_data in plan_data.get("detailed_itinerary", []):
                    activities = [
                        ActivityDetail(**activity)
                        for activity in day_data.get("activities", [])
                    ]
                    itinerary.append(DayItinerary(
                        day=day_data["day"],
                        title=day_data["title"],
                        activities=activities
                    ))
                
                plan = TravelPlan(
                    id=f"plan_{idx + 1}_{int(datetime.now().timestamp())}",
                    title=plan_data.get("title", "Sikkim Adventure"),
                    duration=plan_data.get("duration", "5 Days / 4 Nights"),
                    budget=plan_data.get("budget", "₹15k - ₹30k"),
                    description=plan_data.get("description", ""),
                    highlights=plan_data.get("highlights", []),
                    activities=plan_data.get("activities", []),
                    accommodation=plan_data.get("accommodation", "Mid-range Hotels"),
                    best_for=plan_data.get("best_for", "All travelers"),
                    rating=plan_data.get("rating", 4.5),
                    image_color=plan_data.get("image_color", "#10b981"),
                    detailed_itinerary=itinerary,
                    locations_included=plan_data.get("locations_included", []),
                    estimated_costs=plan_data.get("estimated_costs", {
                        "accommodation": 0,
                        "food": 0,
                        "transport": 0,
                        "activities": 0,
                        "miscellaneous": 0
                    })
                )
                plans.append(plan)
            
            return plans
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text: {response_text[:1000]}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI returned invalid JSON response. Please try again."
            )
        except Exception as e:
            print(f"Error parsing Gemini response: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse AI response: {str(e)}"
            )


ai_planner_service = AIPlannerService()

