import google.generativeai as genai
from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.config import settings

router = APIRouter(prefix="/chat", tags=["AI Agent"])

# Model cache
_model = None

def get_model():
    global _model
    if _model is not None:
        return _model
    
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            _model = genai.GenerativeModel('gemini-1.5-flash')
            return _model
        except Exception as e:
            print(f"AI_INIT_ERROR: Failed to configure Gemini: {e}")
            return None
    return None

class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1)

class ChatResponse(BaseModel):
    success: bool
    reply: str

def get_mock_reply(user_msg: str) -> str:
    user_msg = user_msg.lower()
    if "hello" in user_msg or "hi" in user_msg:
        return "Hello! I am EnsureVault's Virtual Assistant. You can ask me about policies, claims, or system privileges."
    elif "policy" in user_msg:
        return "EnsureVault offers three main policy types: Health, Car, and Home. You can create a new policy from your dashboard."
    elif "claim" in user_msg:
        return "To file a claim, navigate to your dashboard and select 'File Claim'. Please ensure you have all relevant documents ready!"
    elif "database" in user_msg or "privilege" in user_msg or "role" in user_msg:
        return "The system implements strict RBAC at the database level. For example, 'dba_admin' has all rights, 'data_analyst' has view-only rights."
    return "I see you're asking about that. As an AI assistant, I can confirm the system is functional, but for specific policy details, please check your dashboard."

@router.post("/", response_model=ChatResponse, summary="Query EnsureVault AI Assistant")
async def chat_with_agent(payload: ChatMessage):
    model = get_model()
    if not model:
        # Fallback to mock if no API key or init failed
        return ChatResponse(success=True, reply=get_mock_reply(payload.message))
    
    try:
        prompt = f"""
        You are 'EnsureVault Assistant', a professional AI assistant for an insurance policy and claims management system called EnsureVault.
        The system handles Health, Car, and Home insurance.
        It uses MySQL with RBAC roles: dba_admin, data_analyst, and claims_processor.
        
        Answer the following user question professionally and concisely:
        {payload.message}
        """
        response = await model.generate_content_async(prompt)
        return ChatResponse(success=True, reply=response.text)
    except Exception:
        # Fallback to mock on API error
        return ChatResponse(success=True, reply=get_mock_reply(payload.message))
