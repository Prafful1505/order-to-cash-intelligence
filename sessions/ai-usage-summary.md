# AI Coding Session Summary

**Tool used:** Claude Code (claude-code CLI) — used as an accelerator, not a replacement for engineering judgment
**Project:** Order-to-Cash Intelligence Layer

---

## My Approach to Using AI

I treat AI coding tools the way a senior engineer uses a junior developer — I define the architecture, make the decisions, review everything that comes out, and debug failures myself. Claude Code was used to accelerate implementation of decisions I had already made, not to make decisions for me.

The workflow I designed and followed throughout:

```
I decide architecture → I define skills to encode my decisions →
I write the plan in phases → I direct execution one phase at a time →
I manually test and validate → I diagnose failures from logs → I fix or redirect
```

---

## 1. Architecture Decisions I Made First

Before any code was written, I spent time understanding the dataset and making the core architectural decisions myself:

**SQLite + NetworkX over a graph database** — I chose this deliberately. The dataset is ~1,200 rows. A graph DB like Neo4j adds operational overhead and, more importantly, LLMs generate far more reliable SQL than Cypher. Since the whole point of the system is LLM-powered querying, SQL was the right choice. I would have made this same call without AI assistance.

**3-step LLM pipeline with guardrails first** — I designed this pipeline structure myself: guardrail check → SQL generation → grounded answer. The guardrail runs before SQL to avoid wasted LLM calls. The answer step is explicitly constrained to the returned rows — no hallucination path. These were my design constraints.

**Separate backend and frontend tracks** — I kept these completely independent, finishing and validating the backend API contract before the frontend consumed it. This prevents interface drift.

---

## 2. Skills — Encoding My Decisions as Reusable Context

I created domain-specific skills in Claude Code to encode the decisions I had already made:

- `dodge-ai-backend` — my FastAPI structure, model conventions, Pydantic schema patterns
- `dodge-ai-graph` — my node/edge schema, NetworkX builder approach, expand endpoint design
- `dodge-ai-llm-pipeline` — my 3-step pipeline, my prompt constraints, my guardrail logic
- `dodge-ai-frontend` — my React Flow approach, Zustand store shape, component structure

This way, each implementation session had my decisions baked in — Claude was implementing my architecture, not inventing its own.

---

## 3. Phased Execution — My Discipline, Not AI's

I wrote the phased plan and enforced the discipline of one phase at a time:

```
Phase 0 — Scaffold
Phase 1 — Data ingestion
Phase 2 — Graph construction
Phase 3 — Graph API
Phase 4 — LLM pipeline
Phase 5 — Frontend
Phase 6 — Validation
```

**I never moved to the next phase without manually validating the current one.** This was my call — AI tools have no concept of "done enough to proceed." That judgment was mine.

---

## 4. Manual Testing and Validation I Did Myself

This is where I spent significant time. After each phase:

**Phase 1** — I opened the SQLite DB directly and verified row counts per table. 11 tables, ~1,200 rows. Checked that business_partners, sales_order_headers, billing_document_items etc. were all populated correctly.

**Phase 2** — I verified the NetworkX graph had 721 nodes and 811 edges. Manually traced a few node relationships to confirm the edges made sense (Customer → Order → Delivery → Billing → Payment).

**Phase 3** — I hit every endpoint manually via the browser and Swagger UI. Checked response shapes, tested pagination, confirmed expand returned correct neighbours.

**Phase 4** — I ran all 8 required queries from the task spec myself in the chat interface. Two returned 0 rows — I diagnosed this myself by tracing the SQL generation output and realising the join keys were wrong. The fix required me to inspect the actual DB schema with `PRAGMA table_info()` and correct the O2C join chain in the prompt.

**Phase 5/6** — Full end-to-end browser testing. Typed queries, checked SQL display, verified guardrail rejection message, confirmed rows tables rendered correctly.

---

## 5. Bugs I Found and Diagnosed Myself

**Zero edges on the graph** — After the frontend loaded, clicking nodes did nothing. I traced the issue myself: the expand function was returning early before making any API call. Reading through the code, I found that `markLoaded()` was being called for every initial node during startup, which set a flag that the expand guard checked — so every click silently returned early. Fix: only mark nodes as loaded after a successful expand, and auto-expand 2 seed nodes on startup so edges are visible immediately.

**Toolbar clicks not registering** — The "Hide Connections" button appeared to do nothing. I checked the browser dev tools, confirmed the click events were firing, but something upstream was intercepting them. Diagnosed: React Flow creates its own stacking context and its pane element intercepts pointer events from siblings in the same container. Fix: moved the toolbar outside the ReactFlow container entirely.

**Graph layout forming arc shapes** — The initial graph looked like scattered broken circles instead of a proper network. I recognised this was a layout algorithm problem — the radial cluster formula was placing each node in a semicircle arc with gaps. Rewrote the layout to use a 4×2 grid with compact square node groups.

**Gemini API quota failure** — The LLM was failing silently. I checked the API response and saw `limit: 0` on the generation endpoint. Switched to Groq (`llama-3.3-70b-versatile`) — same prompt format, no other changes needed.

**Render deployment: Python 3.14** — Build failed with a Rust compilation error for `pydantic-core`. I read the logs, identified Render was using Python 3.14 (too new, no pre-built wheels), and pinned Python to 3.11 via environment variable.

**CORS blocking the deployed frontend** — After deploying, the frontend couldn't reach the backend. I recognised this immediately as a CORS issue — the backend only allowed `localhost:5173`. Added the Vercel URL to `CORS_ORIGINS` on Render.

---

## 6. What I Used Claude Code For

- Implementing the data models and ingestion script once I had defined the schema
- Writing the FastAPI route handlers to the API contract I designed
- Scaffolding the React component structure I had planned
- Generating boilerplate (Zustand store shape, TypeScript types) from my specs
- Accelerating CSS/Tailwind styling iteration

Claude Code wrote code to my specs. I reviewed, tested, and debugged everything that came out of it. When something didn't work, I diagnosed it myself from logs and symptoms before directing a fix.

---

## 7. What I Did Not Use AI For

- Architectural decisions (SQLite vs graph DB, SQL vs Cypher, 3-step pipeline design)
- Deciding which phases to build and in what order
- Manual testing of every endpoint and query
- Reading Render build logs to diagnose the Python 3.14 failure
- Diagnosing the CORS issue on the deployed app
- Deciding which 8 queries best demonstrate the O2C flow
