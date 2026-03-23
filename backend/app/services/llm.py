import re
import time
from groq import Groq
from app.config import settings

_client = Groq(api_key=settings.GROQ_API_KEY)
_MODEL = "llama-3.3-70b-versatile"


def call_groq(system_prompt: str, user_message: str, retries: int = 3) -> str:
    for i in range(retries):
        try:
            response = _client.chat.completions.create(
                model=_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.1,
                max_tokens=2048,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            if "429" in str(e) and i < retries - 1:
                time.sleep(2**i)
            else:
                raise


def call_groq_json(system_prompt: str, user_message: str) -> dict:
    import json

    raw = call_groq(system_prompt, user_message)
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    text = match.group(1) if match else raw
    return json.loads(text)
