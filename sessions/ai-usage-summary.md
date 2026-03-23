# AI Coding Session Summary

**Tool used:** Claude Code (claude-code CLI) — `claude-sonnet-4-6`
**Project:** Order-to-Cash Intelligence Layer
**Approach:** Claude Code was used as the primary development partner throughout the entire build — from architecture decisions and skill creation, through phased plan execution, to frontend redesign and deployment.

---

## Workflow Overview

The development followed a structured, repeatable loop:

```
Define skill → Enter plan mode → Create phased plan → Execute one phase at a time
→ Validate/test → Fix issues → Repeat for next phase
```

Frontend had its own separate plan and execution track, run independently from the backend.

---

## 1. Skills-First Setup

Before writing any code, I had Claude Code create **custom skills** for each domain area of the project. These skills act as persistent context packages — they encode project-specific patterns, conventions, and decisions so Claude doesn't have to re-derive them each session.

Skills created:
- `dodge-ai-backend` — FastAPI patterns, SQLAlchemy models, Pydantic schemas, ingestion flow
- `dodge-ai-graph` — NetworkX graph construction, node/edge schema, expand endpoint logic
- `dodge-ai-llm-pipeline` — Groq integration, 3-step NL→SQL pipeline, guardrail design, prompt templates
- `dodge-ai-frontend` — React Flow patterns, Zustand store, useGraph/useChat hooks, Tailwind conventions

**Why skills first:** Each skill encodes the decisions made in that domain so that when executing a phase, Claude has the full context of what was already decided — model names, column names, patterns to follow — without re-explaining everything each time.

---

## 2. Plan Mode — Phase-by-Phase Architecture

After skills were ready, I switched to **plan mode** (`/plan`) to architect the full build before touching any code. Claude proposed a phased plan and I reviewed and approved it before execution:

```
Phase 0 — Project scaffold (FastAPI + React + Vite + Tailwind + React Flow + Zustand)
Phase 1 — Data ingestion (JSONL → SQLite, 11 tables)
Phase 2 — Graph construction (SQLite → NetworkX, 721 nodes, 811 edges)
Phase 3 — Graph API (/api/graph/* endpoints)
Phase 4 — LLM pipeline (guardrail → NL→SQL → answer)
Phase 5 — Frontend chat (ChatPanel, MessageBubble, QueryInput)
Phase 6 — Validation (all 8 required queries tested end-to-end)
```

**Key principle:** One phase executed at a time. Never moved to the next phase until the current one passed validation.

---

## 3. Testing Phase After Each Execution Phase

After each phase was executed, a **dedicated validation step** was run before moving forward:

- **Phase 1 validation** — queried SQLite directly, verified row counts per table matched expected data
- **Phase 2 validation** — checked `graph.number_of_nodes()`, `graph.number_of_edges()`, verified key relationships existed
- **Phase 3 validation** — hit every API endpoint via curl/browser, checked response shapes
- **Phase 4 validation** — ran all 8 required queries from the task spec including 2 guardrail-blocked queries; fixed SQL join logic when 2 queries returned 0 rows
- **Phase 5 validation** — full end-to-end test in browser, verified SQL display, rows table, guardrail rejection message

This prevented compounding errors — a bug caught at Phase 3 doesn't propagate into Phase 4 and 5.

---

## 4. Frontend — Separate Plan, Separate Execution

The frontend had its own independent plan, run after the backend was fully validated. This kept concerns separated — the backend API contract was fixed before the frontend consumed it.

**Frontend phases:**
```
F1 — Layout shell (SplitView, BreadcrumbHeader, minimize toggle)
F2 — Graph canvas (React Flow setup, node types, initial load, expand-on-click)
F3 — Chat panel (ChatPanel, MessageBubble, MessageList, QueryInput)
F4 — Graph UX polish (node detail panel, hover tooltips, legend, edge toggle)
F5 — Visual redesign (grid layout, smoothstep edges, node sizing, chat bubble styling)
```

Each frontend phase was validated in the browser before the next started — checking layout, interactions, and API integration at each step.

---

## 5. Key Debugging Moments (Root Cause, Not Symptoms)

**LLM provider switch — Gemini quota exhausted:**
`list_models()` returned success even when `generate_content()` was quota-blocked — false green signal. Diagnosed by testing an actual generation call. Switched to Groq (`llama-3.3-70b-versatile`) in under 10 minutes with no prompt changes.

**Zero edges on graph (markLoaded bug):**
`useInitialGraphLoad()` called `markLoaded(nodeId)` for every initial node. The expand guard `if (loadedNodeIds.has(id)) return` then silently skipped every click. Fix: only call `markLoaded` after a successful expand API response. Also added auto-expansion of 2 seed nodes on startup so edges are visible immediately without any user interaction.

**Toolbar clicks intercepted by React Flow:**
"Hide Connections" button was inside the ReactFlow container div. React Flow's `.react-flow__pane` intercepts all pointer events within its stacking context regardless of z-index. Fix: moved toolbar to a sibling div above `<ReactFlow>`, outside its stacking context.

**Graph layout forming arc/crescent shapes:**
Radial cluster layout placed each node type group in a circle and each node in an arc — with partial groups (8–20 nodes), these looked like broken crescents. Rewrote `computeInitialPositions` to use a 4×2 grid layout with compact square node arrangement per group.

**Wrong O2C join logic:**
Skill template had incorrect join keys. Real SAP linkage:
- SO → Delivery: `outbound_delivery_items.reference_sd_document = sales_order_headers.sales_order`
- Delivery → Billing: `billing_document_items.reference_sd_document = outbound_delivery_headers.delivery_document`

Caught during Phase 4 validation when 2 queries returned 0 rows. Fixed by inspecting the actual DB schema with `PRAGMA table_info()` before updating the SQL prompt.

---

## 6. Key Prompting Patterns

| Pattern | What it solved |
|---|---|
| **Skills before execution** — encode domain context as reusable skills | Claude has full project context in every session without re-explaining |
| **Plan mode first** — review phased plan before any code | Architectural decisions made upfront, not mid-implementation |
| **One phase at a time** — validate before proceeding | Bugs caught early, never compound across phases |
| **Inspect before writing** — read DB schema, read file contents | Prevented column name mismatches, wrong assumptions |
| **Root cause first** — describe the symptom, trace the mechanism | Found the markLoaded bug, React Flow z-index issue, Gemini false signal |
| **Separate frontend plan** — independent track from backend | Clean API contract before frontend consumed it |
| **Explicit constraints** — "grounded answers only", "SQLite-compatible only" | LLM stayed in lane without drift |

---

## 7. What I Did Not Use AI For

- Running the actual servers and testing queries — done manually in the browser
- Verifying query correctness against real data — ran them in the REPL
- Deciding which queries best demonstrate the O2C flow — used business judgement
- Deployment configuration troubleshooting (Python 3.14 → 3.11 pin, CORS fix) — diagnosed from logs, fixed with targeted env var changes
