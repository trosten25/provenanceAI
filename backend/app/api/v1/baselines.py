from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import Baseline, Student
from app.services.breeth import BreethMemoryClient
from app.services.extractor import extract_stylometric_features

router = APIRouter(prefix="/baselines", tags=["baselines"])


class BaselineCreate(BaseModel):
    student_id: str
    title: str
    text: str

@router.post("/ingest")
async def ingest_baseline(payload: BaselineCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    vector = extract_stylometric_features(payload.text)

    # 1. Save to Postgres
    baseline = Baseline(
        student_id=student.id,
        title=payload.title,
        raw_text=payload.text,
        stylometric_vector=vector,
    )
    db.add(baseline)
    db.commit()

    # 2. Asynchronously append sample to Breeth Cognitive Memory Graph
    breeth = BreethMemoryClient()
    await breeth.log_baseline_episode(
        student_id=str(student.id),
        student_name=student.name,
        metrics=vector,
        sample_title=payload.title
    )

    return {"id": str(baseline.id), "stylometric_vector": vector}