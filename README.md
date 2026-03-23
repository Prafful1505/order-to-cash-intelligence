# Order-to-Cash Intelligence Layer

A graph-based intelligence system for SAP ERP data. Models the Order-to-Cash process as an interactive knowledge graph, with a natural language query interface powered by a 3-step LLM pipeline.

Built as part of a Forward Deployed Engineer assignment for [Dodge AI](https://dodgeai.com).

---

## What it does

**Graph exploration** — Browse SAP O2C entities (Sales Orders, Deliveries, Billing Documents, Payments, Customers, Products) as an interactive knowledge graph. Click any node to expand its relationships and visually trace the full O2C flow.

**Natural language queries** — Ask questions in plain English. The system generates SQL, executes it against the real dataset, and returns grounded answers. It never hallucinates — if the data doesn't support an answer, it says so.

### Sample interactions

| Query | What happens |
|---|---|
| *"Which customer has the most orders?"* | SQL JOIN on sales_order_headers + GROUP BY → ranked answer |
| *"Which sales orders were delivered but never billed?"* | LEFT JOIN across deliveries and billing_documents → 3 orders identified |
| *"Trace billing document 91150187 back to the original order"* | Multi-table join → full O2C chain returned |
| *"What is the total payment amount per customer?"* | Aggregation across payments + business_partners |
| *"Who won the 2022 World Cup?"* | Guardrail blocks it → *"This system answers questions about the provided dataset only."* |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  ┌──────────────────────────┐  ┌───────────────────────┐ │
│  │  Graph Visualization     │  │  Chat Interface       │ │
│  │  React Flow              │  │  React + TypeScript   │ │
│  │                          │  │                       │ │
│  │  • Circle nodes by type  │  │  NL query → answer    │ │
│  │  • Smoothstep edges      │  │  Collapsible SQL      │ │
│  │  • Click-to-expand       │  │  Result rows table    │ │
│  └────────────┬─────────────┘  └───────────┬───────────┘ │
└───────────────┼────────────────────────────┼─────────────┘
                │ REST                       │ REST
┌───────────────▼────────────────────────────▼─────────────┐
│                      FastAPI Backend                      │
│                                                           │
│   /api/graph/*               /api/chat/query             │
│   ┌─────────────────┐        ┌────────────────────────┐   │
│   │  Graph Router   │        │  Chat Router           │   │
│   │  NetworkX graph │        │  1. Guardrail check    │   │
│   │  expand/traverse│        │  2. NL → SQL (LLM)     │   │
│   └────────┬────────┘        │  3. Execute SQL        │   │
│            │                 │  4. Results → Answer   │   │
│   ┌────────▼────────────────────────────────────────┐ │   │
│   │              SQLite  (erp.db)                   │ │   │
│   │   11 tables · ~1,200 rows · pre-populated       │ │   │
│   └─────────────────────────────────────────────────┘ │   │
└───────────────────────────────────┬───────────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Groq API          │
                         │   llama-3.3-70b     │
                         │   (free tier)       │
                         └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | FastAPI + Python 3.11 | Async, clean type hints, great for LLM/data work |
| Database | SQLite + SQLAlchemy | Zero ops, portable, SQL-queryable by the LLM |
| Graph engine | NetworkX | In-memory, Python-native, built in ~200ms from SQLite |
| LLM | Groq (Llama 3.3 70B) | Free tier, fast inference, strong SQL generation |
| Frontend | React + TypeScript + Vite | Type-safe, fast dev cycle |
| Graph viz | React Flow | Native React, custom node renderers, interactive |
| Styling | Tailwind CSS | Utility-first, fast to iterate |
| State | Zustand | Minimal boilerplate, single source of truth |

---

## Key Design Decisions

### SQLite + NetworkX over a graph database

SQLite + NetworkX was chosen over Neo4j/ArangoDB deliberately:

- **LLM SQL quality** — LLMs produce far more reliable SQL than Cypher or AQL. Critical for the NL query interface.
- **Zero operational overhead** — no separate service, single file, trivially deployable.
- **Scale fit** — at ~1,200 rows, this is correct. NetworkX graph rebuilds from SQLite in ~200ms on startup.
- **Tradeoff acknowledged** — at millions of entities, this architecture would need rethinking.

### 3-step LLM pipeline with guardrails first

```
User query
  → Step 1: Guardrail (LLM classifies domain relevance)
  → Step 2: NL → SQL (LLM generates SQLite-compatible SQL, schema injected)
  → Step 3: Results → Answer (LLM summarises real query results)
```

Guardrail runs **before** SQL generation — prevents wasted LLM calls and SQL injection-style prompt attacks. The answer step is explicitly grounded: if rows are empty, the model says so. No hallucination path.

### Graph visualization strategy

Nodes are loaded by entity type in a grid layout on initial render. Seed nodes (customers + orders) are auto-expanded so connections are visible immediately. Additional connections load on click via `/api/graph/expand/{id}`. Edges use smoothstep routing to reduce visual crossing.

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Free Groq API key — [console.groq.com](https://console.groq.com)

### One-click (Windows)

```
double-click start.bat
```

This activates the Python venv, starts the FastAPI backend on port 8000, and starts the Vite dev server. Open http://localhost:5173.

### Manual setup

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

cp .env.example .env
# Edit .env — add your GROQ_API_KEY

python -m app.services.ingestion   # builds erp.db from JSONL source files
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 · API docs at http://localhost:8000/docs

---

## Project Structure

```
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── models/                # SQLAlchemy ORM (11 tables)
│       ├── routers/               # graph.py + chat.py endpoints
│       ├── services/
│       │   ├── ingestion.py       # JSONL → SQLite loader
│       │   ├── graph_builder.py   # SQLite → NetworkX graph
│       │   ├── llm.py             # Groq API wrapper
│       │   ├── query_engine.py    # 3-step NL→SQL→answer pipeline
│       │   └── guardrails.py      # off-topic query detection
│       └── prompts/               # LLM prompt templates
│           ├── sql_generation.py  # schema-injected SQL prompt
│           └── guardrails.py      # domain classifier prompt
└── frontend/
    └── src/
        ├── components/
        │   ├── Graph/             # GraphCanvas, NodeTypes, NodeDetailPanel
        │   ├── Chat/              # ChatPanel, MessageBubble, QueryInput
        │   └── Layout/            # SplitView, BreadcrumbHeader
        ├── hooks/                 # useGraph, useChat
        ├── store/                 # graphStore (Zustand)
        └── api/                   # graph.ts, chat.ts HTTP clients
```

---

## API Reference

```
GET  /api/graph/schema          → node types, edge types, counts
GET  /api/graph/nodes           → paginated nodes, filterable by type
GET  /api/graph/node/{id}       → single node + edges + neighbours
GET  /api/graph/expand/{id}     → expand node: return neighbours + edges
POST /api/chat/query            → { message, history } → { answer, sql, rows, guardrail_blocked }
```

---

## Guardrails

Off-topic queries are blocked before SQL generation using a lightweight LLM classifier:

```
Blocked: "What is the capital of France?"
→ "This system is designed to answer questions related to the provided dataset only."

Blocked: "Write me a poem"
→ same rejection

Allowed: "Which customers have unpaid invoices?"
→ SQL generated and executed
```
