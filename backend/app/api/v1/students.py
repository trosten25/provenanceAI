import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.core.database import get_db
from app.models.entities import Student, Baseline

router = APIRouter(prefix="/students", tags=["students"])

class StudentCreate(BaseModel):
    name: str
    roll_no: str
    email: Optional[str] = None

class StudentResponse(BaseModel):
    id: str
    name: str
    roll_no: str
    email: Optional[str] = None
    baseline_count: int
    status: str

    class Config:
        from_attributes = True

# 1. Eligible Students (Only students with >= 1 baseline)
@router.get("/eligible-for-audit", response_model=List[StudentResponse])
def get_audit_eligible_students(db: Session = Depends(get_db)):
    results = (
        db.query(
            Student.id,
            Student.name,
            Student.roll_no,
            Student.email,
            func.count(Baseline.id).label("baseline_count"),
        )
        .join(Baseline, Student.id == Baseline.student_id)
        .group_by(Student.id, Student.name, Student.roll_no, Student.email)
        .all()
    )

    return [
        {
            "id": str(r.id),
            "name": r.name,
            "roll_no": r.roll_no,
            "email": r.email,
            "baseline_count": r.baseline_count,
            "status": "Profile Active",
        }
        for r in results
    ]

# 2. All Students Roster
@router.get("", response_model=List[StudentResponse])
def list_students(db: Session = Depends(get_db)):
    results = (
        db.query(
            Student.id,
            Student.name,
            Student.roll_no,
            Student.email,
            func.count(Baseline.id).label("baseline_count"),
        )
        .outerjoin(Baseline, Student.id == Baseline.student_id)
        .group_by(Student.id, Student.name, Student.roll_no, Student.email)
        .all()
    )

    return [
        {
            "id": str(r.id),
            "name": r.name,
            "roll_no": r.roll_no,
            "email": r.email,
            "baseline_count": r.baseline_count,
            "status": "Baseline Needed" if r.baseline_count == 0 else "Profile Active",
        }
        for r in results
    ]

# 3. Create Student
@router.post("", response_model=StudentResponse)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.roll_no == payload.roll_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Roll number already registered")
        
    new_student = Student(
        name=payload.name, 
        roll_no=payload.roll_no, 
        email=payload.email
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "id": str(new_student.id),
        "name": new_student.name,
        "roll_no": new_student.roll_no,
        "email": new_student.email,
        "baseline_count": 0,
        "status": "Baseline Needed",
    }