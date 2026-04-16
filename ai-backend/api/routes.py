from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.database import save_chat_message
import os
from dotenv import load_dotenv

load_dotenv()

api_router = APIRouter()

class ChatRequest(BaseModel):
    userId: str
    message: str

class ChatResponse(BaseModel):
    response: str

class IngestRequest(BaseModel):
    url: str

class SupportTicket(BaseModel):
    userId: str
    issue: str

SYSTEM_PROMPT = """You are 'Later', the AI Business Concierge for Morchantra — a premium B2B services platform.
You help clients with: Legal Advisory, Insurance Services, AWS/Azure Cloud Setup, MERN Development, AI Chatbot Building, Data Analytics, and Civil/Property Support.
Be concise, professional, and helpful. If you cannot find specific information, suggest contacting support@morchantra.com.
Never make up facts. If asked about a specific client request or invoice, say you need to check and suggest they use the dashboard."""

@api_router.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "service": "morchantra-ai-backend"}

@api_router.post("/chat", response_model=ChatResponse, tags=["AI"])
async def chat_endpoint(request: ChatRequest):
    try:
        from groq import Groq
        
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.message}
            ],
            temperature=0.3,
            max_tokens=512,
        )
        
        response_text = completion.choices[0].message.content
        
        # Persist to DB
        try:
            await save_chat_message(request.userId, sender="user", message=request.message)
            await save_chat_message(request.userId, sender="bot", message=response_text)
        except Exception:
            pass  # Don't fail the request if DB write fails
            
        return ChatResponse(response=response_text)
        
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "401" in error_msg or "authentication" in error_msg.lower():
            return ChatResponse(response="⚠️ AI service error: Please check the GROQ_API_KEY in ai-backend/.env")
        return ChatResponse(response=f"I'm having trouble connecting right now. Please try again in a moment.")

@api_router.post("/ingest", tags=["Knowledge Base"])
async def ingest_knowledge(request: IngestRequest):
    """Hits the crawler and pushes URL data into Qdrant RAG index."""
    try:
        from ingestion.crawler import crawl_url
        from rag.indexer import index_text_content
        raw_text = crawl_url(request.url)
        status = index_text_content(text=raw_text, source_url=request.url)
        return {"status": status, "url": request.url, "chars_ingested": len(raw_text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/support-ticket", tags=["Escalation"])
async def create_support_ticket(ticket: SupportTicket):
    return {"status": "Ticket escalated to human queue", "userId": ticket.userId}
