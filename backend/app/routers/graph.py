from fastapi import APIRouter, HTTPException, Query

from app.services.graph_builder import get_graph

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("/schema")
def get_schema():
    """Return all node types and edge relationship types present in the graph."""
    G = get_graph()
    node_types = sorted({data["type"] for _, data in G.nodes(data=True)})
    edge_types = sorted({data["relationship"] for _, _, data in G.edges(data=True)})
    return {
        "node_types": node_types,
        "edge_types": edge_types,
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
    }


@router.get("/nodes")
def list_nodes(
    type: str | None = Query(None, description="Filter by node type"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Return a paginated list of nodes, optionally filtered by type."""
    G = get_graph()
    nodes = [
        {"id": n, "type": data["type"], "label": data["label"], "properties": data["properties"]}
        for n, data in G.nodes(data=True)
        if type is None or data.get("type") == type
    ]
    return {
        "nodes": nodes[offset: offset + limit],
        "total": len(nodes),
        "limit": limit,
        "offset": offset,
    }


@router.get("/node/{node_id:path}")
def get_node(node_id: str):
    """Return a single node with its edges and neighbor summaries."""
    G = get_graph()
    if node_id not in G:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

    node_data = G.nodes[node_id]

    out_edges = [
        {"source": node_id, "target": t, "relationship": d["relationship"]}
        for _, t, d in G.out_edges(node_id, data=True)
    ]
    in_edges = [
        {"source": s, "target": node_id, "relationship": d["relationship"]}
        for s, _, d in G.in_edges(node_id, data=True)
    ]
    edges = out_edges + in_edges

    # Collect unique neighbor node summaries
    neighbor_ids = {e["target"] for e in out_edges} | {e["source"] for e in in_edges}
    neighbors = [
        {"id": n, "type": G.nodes[n]["type"], "label": G.nodes[n]["label"]}
        for n in neighbor_ids
        if n in G
    ]

    return {
        "id": node_id,
        "type": node_data["type"],
        "label": node_data["label"],
        "properties": node_data["properties"],
        "edges": edges,
        "neighbors": neighbors,
    }


@router.get("/expand/{node_id:path}")
def expand_node(node_id: str):
    """Return the node + all its direct neighbors (for expand-on-click in the graph UI)."""
    G = get_graph()
    if node_id not in G:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

    predecessor_ids = list(G.predecessors(node_id))
    successor_ids = list(G.successors(node_id))
    all_ids = {node_id} | set(predecessor_ids) | set(successor_ids)

    nodes = [
        {"id": n, "type": G.nodes[n]["type"], "label": G.nodes[n]["label"], "properties": G.nodes[n]["properties"]}
        for n in all_ids
        if n in G
    ]

    # Only edges that connect nodes within this neighborhood
    edges = [
        {"source": s, "target": t, "relationship": d["relationship"]}
        for s, t, d in G.edges(data=True)
        if s in all_ids and t in all_ids
    ]

    return {"nodes": nodes, "edges": edges}
