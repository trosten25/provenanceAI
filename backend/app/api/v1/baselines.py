import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.core.database import get_db
from app.models.entities import Student, Baseline
from app.services.extractor import extract_stylometric_features

router = APIRouter(tags=["baselines"])

class BaselineCreate(BaseModel):
    student_id: str
    title: str
    text: str

class BaselineResponse(BaseModel):
    id: str
    student_id: str
    title: str
    stylometric_vector: dict

@router.post("/baselines/ingest", response_model=BaselineResponse)
def ingest_baseline(payload: BaselineCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    vector = extract_stylometric_features(payload.text)

    baseline = Baseline(
        student_id=student.id,
        title=payload.title,
        raw_text=payload.text,
        stylometric_vector=vector,
    )
    db.add(baseline)
    db.commit()
    db.refresh(baseline)

    return {
        "id": str(baseline.id),
        "student_id": str(baseline.student_id),
        "title": baseline.title,
        "stylometric_vector": baseline.stylometric_vector,
    }

@router.get("/students/eligible-for-audit")
def get_audit_eligible_students(db: Session = Depends(get_db)):
    """Returns ONLY students who have at least 1 ingested baseline sample."""
    results = (
        db.query(
            Student.id,
            Student.name,
            Student.roll_no,
            func.count(Baseline.id).label("baseline_count"),
        )
        .join(Baseline, Student.id == Baseline.student_id)
        .group_by(Student.id)
        .all()
    )

    return [
        {
            "id": str(r.id),
            "name": r.name,
            "roll_no": r.roll_no,
            "baseline_count": r.baseline_count,
            "status": "Profile Active",
        }
        for r in results
    ]