# AI Coding Session Summary

**Tool used:** Claude Code (claude-code CLI) — `claude-sonnet-4-6`
**Project:** Order-to-Cash Intelligence Layer
**Approach:** Claude Code was used as a primary development partner throughout the entire build — not just for boilerplate, but for architectural decisions, debugging real failures, and iterating on the UI until it matched the reference design.

---

## How I Used Claude Code

### 1. Starting with architecture, not code

Before writing a line of code, I used Claude to reason through the architecture:

> *"I need to build a graph-based ERP query system. The dataset is SAP O2C JSONL files. I need a graph visualization, a chat interface, and NL→SQL. What's the right database and graph engine for this scale?"*

This produced the core decision: **SQLite + NetworkX over Neo4j**, because LLMs generate more reliable SQL than Cypher, and the dataset (~1,200 rows) doesn't justify operational overhead of a graph DB. This decision held throughout the project.

### 2. Schema-first development

I had Claude inspect the actual database schema using `PRAGMA table_info()` before writing any SQL prompts. The skill templates I initially used had wrong column names (SAP-style names like `sold_to_party`, `total_net_amount` — not the generic names in the templates). This would have caused every query to return 0 rows.

**Key prompt pattern:**
```
Read the actual schema from the database.
Then write the SQL generation prompt using only real column names.
Do not assume — inspect first.
```

### 3. LLM pipeline design

I prompted Claude to design the 3-step pipeline explicitly:

> *"How should I structure the chat flow to avoid hallucination? The answer must be grounded in real data."*

This produced the guardrail-first architecture:
1. Guardrail check (fast LLM call, classify domain relevance)
2. NL → SQL (schema injected, SQLite-compatible only)
3. SQL results → NL answer (grounded, cannot fabricate)

The grounding constraint was explicit in the answer generation prompt: *"If the data is empty, say so. Never answer beyond what the rows contain."*

### 4. Debugging real failures

**LLM provider switch:** Gemini's free tier quota was exhausted mid-build (`limit: 0` on the generation endpoint). `list_models()` had returned success, giving a false green signal. Claude flagged this pattern immediately:

> *"list_models() is a metadata call — it always works even when the quota is gone. You need to test with an actual generate call."*

Switched to Groq (`llama-3.3-70b-versatile`) in under 10 minutes. Same prompt format, no other changes.

**Graph had zero edges:** After building the frontend, clicking nodes did nothing — no connections appeared. Root cause: `useInitialGraphLoad()` was calling `markLoaded(nodeId)` for every node during initial placement, which set a flag that prevented expansion. Every click silently returned early. Claude traced through the expand guard logic:

```
if (loadedNodeIds.has(flowNode.id)) return;   ← all initial nodes pass this check
```

Fix: remove `markLoaded` from initial load, only call it after a successful expand API response. Also added auto-expansion of 2 seed nodes (customers + orders) on startup so edges are visible without any user interaction.

**Toolbar clicks intercepted by React Flow:** The "Hide Connections" button was rendered inside the React Flow container div. React Flow's `.react-flow__pane` element intercepts all pointer events within its stacking context, even from elements with `z-10`. Button clicks were silently swallowed.

Fix: moved all toolbar elements to a sibling div above the `<ReactFlow>` component, outside its stacking context entirely.

### 5. UI iteration

The graph initially rendered nodes in semicircular arc shapes — the radial cluster layout placed each type group in a circle and each node in an arc around it. With partial groups (8–20 nodes per type), these looked like broken crescents.

Prompt:
> *"The nodes form arc shapes. Rewrite computeInitialPositions to use a 4×2 grid layout — type groups in cells, nodes within each group in a compact square grid."*

This made the initial graph legible immediately.

Edge routing was also a problem — default straight edges crossed everything. Switched to `type: 'smoothstep'` in `toFlowEdge`, which uses curved routing that avoids node clusters.

---

## Key Prompting Patterns I Used

| Pattern | What it solved |
|---|---|
| **Inspect before writing** — read DB schema, read file contents before any edit | Prevented column name mismatches, wrong assumptions |
| **Root cause first** — describe the symptom, ask for the mechanism | Found the markLoaded bug, the React Flow z-index issue, the Gemini quota false signal |
| **Explicit constraints in prompts** — "never mock data", "only SQLite-compatible SQL", "grounded answers only" | LLM stayed in lane without drift |
| **Critical analysis before code** — share a screenshot, ask what's wrong | Caught graph layout arc issue, edge chaos, chat overflow before writing fixes |
| **Architecture reasoning early** — why this database, why this engine | Produced defensible decisions, not just working code |

---

## Debugging Workflow

1. **Identify the symptom** precisely (e.g. "clicking node does nothing" not "graph is broken")
2. **Read the relevant code** before asking Claude anything
3. **Trace the execution path** — Claude would walk through the call stack to find where it fails
4. **Fix at root cause** — never patch symptoms (e.g. didn't add a retry loop, found why the guard was wrong)
5. **Verify the fix logic** before running — reason through why the fix is correct

---

## What I Did Not Use AI For

- Running the actual servers and testing queries — done manually
- Verifying query correctness against the real dataset — ran them in the REPL
- Deciding which queries to demo — used business judgement on what demonstrates the O2C flow best
