from app.services.llm import call_groq_json
from app.prompts.guardrails import GUARDRAIL_SYSTEM_PROMPT


def is_relevant_query(user_query: str) -> tuple[bool, str]:
    """Returns (is_relevant, reason). On parse failure, allows through."""
    try:
        result = call_groq_json(GUARDRAIL_SYSTEM_PROMPT, user_query)
        return result.get("is_relevant", False), result.get("reason", "")
    except Exception:
        return True, "guardrail parse error — allowed through"
