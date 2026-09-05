import os
from dotenv import load_dotenv

# Ensure environment keys (GOOGLE_API_KEY, DATABASE_URL) are loaded first
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
import app.models.entities 

# Import API Routers
from app.api.v1.students import router as students_router
from app.api.v1.submissions import router as submissions_router

# Auto-create tables in PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ProvenanceAI API")

# Setup CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Endpoints
# Exposes: /api/v1/students, /api/v1/students/eligible-for-audit
app.include_router(students_router, prefix="/api/v1")

# Exposes: /api/v1/submissions/analyze
app.include_router(submissions_router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {"status": "running", "service": "ProvenanceAI API"}