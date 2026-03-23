import re
import sqlite3
from dataclasses import dataclass, field

from app.config import settings
from app.prompts.sql_generation import ANSWER_SYNTHESIS_PROMPT, SQL_GENERATION_SYSTEM_PROMPT
from app.services.guardrails import is_relevant_query
from app.services.llm import call_groq


@dataclass
class QueryResult:
    answer: str
    sql: str | None
    rows: list[dict] | None
    guardrail_blocked: bool
    row_count: int = field(default=0)


def _extract_sql(llm_response: str) -> str | None:
    match = re.search(r"```sql\s*([\s\S]*?)```", llm_response, re.IGNORECASE)
    return match.group(1).strip() if match else None


def _execute_sql(sql: str) -> list[dict]:
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cursor = conn.execute(sql)
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def run_query(user_message: str) -> QueryResult:
    # Step 1: Guardrail check
    relevant, reason = is_relevant_query(user_message)
    if not relevant:
        return QueryResult(
            answer="This system is designed to answer questions related to the provided dataset only.",
            sql=None,
            rows=None,
            guardrail_blocked=True,
        )

    # Step 2: Generate SQL
    sql_response = call_groq(SQL_GENERATION_SYSTEM_PROMPT, user_message)
    sql = _extract_sql(sql_response)
    if not sql:
        return QueryResult(
            answer="I couldn't generate a valid SQL query for that question. Please try rephrasing.",
            sql=None,
            rows=None,
            guardrail_blocked=False,
        )

    # Step 3: Execute SQL
    try:
        rows = _execute_sql(sql)
    except Exception as e:
        return QueryResult(
            answer=f"The query ran into a database error: {e}",
            sql=sql,
            rows=None,
            guardrail_blocked=False,
        )

    # Step 4: Synthesize natural language answer
    synthesis_input = (
        f"Question: {user_message}\n"
        f"SQL executed: {sql}\n"
        f"Total rows returned: {len(rows)}\n"
        f"Result sample (first 20 rows): {rows[:20]}"
    )
    answer = call_groq(ANSWER_SYNTHESIS_PROMPT, synthesis_input)

    return QueryResult(
        answer=answer,
        sql=sql,
        rows=rows,
        guardrail_blocked=False,
        row_count=len(rows),
    )
