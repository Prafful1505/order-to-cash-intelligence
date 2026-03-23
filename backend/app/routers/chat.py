from fastapi import APIRouter
from pydantic import BaseModel

from app.services.query_engine import run_query

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict] = []


@router.post("/query")
async def query(request: ChatRequest):
    result = run_query(request.message)
    return {
        "answer": result.answer,
        "sql": result.sql,
        "rows": result.rows,
        "row_count": result.row_count,
        "guardrail_blocked": result.guardrail_blocked,
    }
