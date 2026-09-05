from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
import app.models.entities
from app.api.v1.students import router as students_router
from app.api.v1.baselines import router as baselines_router
from app.api.v1.submissions import router as submissions_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ProvenanceAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students_router, prefix="/api/v1")
app.include_router(baselines_router, prefix="/api/v1")
app.include_router(submissions_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "running"}