from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
import app.models  # noqa: F401 — registers all ORM models
from app.routers import graph, chat
from app.services.graph_builder import init_graph

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        init_graph(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Dodge AI ERP Graph", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}
