# ARCHITECTURE.md — Design Decisions & Rationale

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   Graph Visualization   │  │    Chat Interface        │  │
│  │   (React Flow)          │  │    (Custom React UI)     │  │
│  │                         │  │                          │  │
│  │  Nodes: Entity cards    │  │  NL Query → Answer       │  │
│  │  Edges: Relationships   │  │  Shows SQL + data rows   │  │
│  │  Click to expand        │  │  Guardrail rejection     │  │
│  └─────────────┬───────────┘  └──────────┬───────────────┘  │
└────────────────┼────────────────────────┼────────────────────┘
                 │ REST API               │ REST API
┌────────────────▼────────────────────────▼────────────────────┐
│                    FastAPI Backend                           │
│                                                             │
│  /api/graph/*          /api/chat/*                          │
│  ┌──────────────┐      ┌──────────────────────────────────┐  │
│  │ Graph Router │      │ Chat Router                      │  │
│  │              │      │  1. Guardrail check              │  │
│  │ - nodes      │      │  2. NL → SQL (Groq/LLM)          │  │
│  │ - expand     │      │  3. Execute SQL                  │  │
│  │ - schema     │      │  4. SQL + results → Answer (LLM) │  │
│  └──────┬───────┘      └──────────────┬───────────────────┘  │
│         │                            │                       │
│  ┌──────▼──────────────┐  ┌──────────▼──────────┐           │
│  │  Graph Builder      │  │  LLM Service         │           │
│  │  (NetworkX)         │  │  (Groq/Llama)        │           │
│  │                     │  │                      │           │
│  │  Nodes + Edges      │  │  - sql_generation    │           │
│  │  In-memory cache    │  │  - guardrails        │           │
│  └──────┬──────────────┘  └──────────────────────┘           │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────┐     │
│  │               SQLite (erp.db)                        │     │
│  │  customers, addresses, products, orders, order_items │     │
│  │  deliveries, invoices, payments                      │     │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   Groq API          │
                   │   (llama-3.3-70b)   │
                   └─────────────────────┘
```

---

## Key Decisions

### 1. SQLite + NetworkX instead of a dedicated graph database

**Decision:** Store data in SQLite, build graph in memory with NetworkX.

**Why not Neo4j/ArangoDB:**
- Adds operational complexity (separate service to run)
- Dataset is small enough (thousands of rows) to hold in memory
- SQL is far easier for the LLM to generate reliably than Cypher/AQL
- Free tier constraints make a separate DB server harder to deploy

**Why NetworkX:**
- Pure Python, zero setup
- Supports DiGraph with attributes on nodes and edges
- Built-in algorithms (shortest path, connected components) useful for broken flow detection
- Graph is rebuilt from SQLite on startup (~200ms) — acceptable for this scale

**Tradeoff:** For millions of entities this would need rethinking. At demo scale it's correct.

---

### 2. NL → SQL instead of NL → Graph Query

**Decision:** The LLM generates SQL, which runs against SQLite.

**Why SQL over graph traversal:**
- LLMs are heavily trained on SQL — generation quality is much higher
- SQLite is a standard, battle-tested query engine
- SQL answers analytical questions (counts, aggregations, joins) more naturally than graph traversal
- Graph traversal is used for the visualization expand feature (NetworkX), not for the chat

**Flow:**
```
User query → Guardrail → LLM (SQL gen) → SQLite execute → LLM (answer gen) → User
```

---

### 3. Groq (Llama 3.3 70B) as LLM

**Decision:** Groq API via the `groq` SDK, model `llama-3.3-70b-versatile`.

**Why Groq:**
- Free tier with generous rate limits — no credit card required
- Very fast inference (low latency matters for interactive chat)
- Llama 3.3 70B produces high-quality SQL reliably
- OpenAI-compatible message format — easy to swap providers if needed

**Fallback:** Any OpenAI-compatible provider (Gemini, Together AI) with same prompt format.

---

### 4. Two-Step LLM Call for Chat

**Decision:** Two separate LLM calls per chat query.

**Call 1 — Guardrail check:**
```
Classify if this query is about ERP data. Return JSON {is_relevant: bool}.
```

**Call 2 — SQL generation:**
```
Schema: [full schema here]
Generate SQL to answer: [user query]
```

**Call 3 — Answer generation:**
```
Query: [user query]
SQL: [generated sql]
Results: [result rows as JSON]
Generate a natural language answer grounded in these results.
```

**Why separate calls:**
- Guardrail before SQL prevents wasted compute on off-topic queries
- Separating SQL gen from answer gen gives clean SQL we can show to the user
- Easier to debug (can log each step independently)

---

### 5. React Flow for Graph Visualization

**Decision:** React Flow over D3, Cytoscape.js, vis.js.

**Why React Flow:**
- Native React component — no DOM manipulation hacks
- Built-in support for custom node renderers (entity type cards)
- Built-in zoom, pan, minimap
- Good performance for small-to-medium graphs (hundreds of nodes)
- Active community, good docs

**Graph loading strategy:**
- Initial load: fetch ~50 representative nodes (mixed types) from API
- Expansion: click node → fetch neighbors from `/api/graph/expand/{id}` → merge into graph
- Deduplication: nodes are keyed by `{type}_{id}` — merging is safe

---

## Data Model

### Entity Relationship Diagram

```
Customer ──HAS_ADDRESS──► Address

Customer ──PLACED──► Order ──CONTAINS──► OrderItem ──IS_PRODUCT──► Product

Order ──HAS_DELIVERY──► Delivery

Delivery ──BILLED_AS──► Invoice

Invoice ──PAID_BY──► Payment
```

### Core Flow (the "happy path")
```
Customer → Order → OrderItem → Delivery → Invoice → Payment
```

### Broken Flow Detection (query examples)
- Order has Delivery but no Invoice → delivered, not billed
- Order has Invoice but no Delivery → billed without delivery
- Invoice has no Payment → unpaid invoice

---

## Database Schema (will be updated after inspecting actual CSVs)

```sql
customers      (customer_id PK, name, country, ...)
addresses      (address_id PK, customer_id FK, street, city, ...)
products       (product_id PK, description, category, ...)
orders         (order_id PK, customer_id FK, order_date, status, ...)
order_items    (item_id PK, order_id FK, product_id FK, quantity, unit_price, ...)
deliveries     (delivery_id PK, order_id FK, delivery_date, status, plant, ...)
invoices       (invoice_id PK, order_id FK, delivery_id FK, invoice_date, amount, ...)
payments       (payment_id PK, invoice_id FK, payment_date, amount, method, ...)
```

> Actual column names depend on the downloaded dataset. Update this section after Phase 0.

---

## API Contract

### Graph endpoints

```
GET /api/graph/schema
→ { node_types: [...], edge_types: [...] }

GET /api/graph/nodes?type=customer&limit=20&offset=0
→ { nodes: [{ id, type, label, metadata }], total: int }

GET /api/graph/node/{id}
→ { node: {...}, edges: [{ source, target, relationship }], neighbors: [...] }

GET /api/graph/expand/{id}
→ { nodes: [...], edges: [...] }
```

### Chat endpoint

```
POST /api/chat/query
Body: { message: str, history: [{ role, content }] }
Response: {
  answer: str,
  sql: str | null,
  rows: list | null,
  guardrail_blocked: bool,
  error: str | null
}
```

---

## Deployment Architecture

```
Render.com (free tier)
├── Web Service (backend)         ← FastAPI, uvicorn
│   ├── Build: pip install -r requirements.txt
│   ├── Start: uvicorn main:app --host 0.0.0.0 --port $PORT
│   └── Env: GEMINI_API_KEY=xxx
└── Static Site (frontend)        ← or Vercel
    ├── Build: npm run build
    └── Publish: dist/
```

SQLite DB is committed to the repo pre-populated (after ingestion).
It's read-only at runtime — no writes after startup.

---

## LLM Prompt Design

### SQL Generation Prompt
```
You are an expert SQL analyst for an ERP system.

Database schema:
{schema}

Entity relationships:
{relationships}

Rules:
- Generate SQLite-compatible SQL only
- Always use table aliases
- Return only the SQL query, nothing else
- If the question cannot be answered with the available data, return: SELECT 'NO_DATA' as result

User question: {question}
```

### Guardrail Prompt
```
You are a guardrail for an ERP data query system.
The system can only answer questions about: business orders, deliveries, invoices,
payments, customers, products, and related analytics.

Is the following query relevant to this ERP domain?
Return ONLY valid JSON: {"is_relevant": true/false, "reason": "brief explanation"}

Query: {query}
```

### Answer Generation Prompt
```
You are a helpful business analyst. Answer the user's question using ONLY the data provided.
Do not make up information. If the data is empty, say so clearly.

User question: {question}
SQL executed: {sql}
Data results: {results}

Provide a clear, concise answer in 1-3 sentences.
```
