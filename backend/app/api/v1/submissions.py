import uuid
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.entities import Student, Baseline, Submission, InterviewSession
from app.services.extractor import extract_stylometric_features

router = APIRouter(prefix="/submissions", tags=["submissions"])

class SubmissionCreate(BaseModel):
    student_id: str
    title: str
    text: str

@router.post("/analyze")
def analyze_submission(payload: SubmissionCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    baselines = db.query(Baseline).filter(Baseline.student_id == student.id).all()
    if not baselines:
        raise HTTPException(
            status_code=400, 
            detail="Cannot audit this student. No historical baselines have been ingested."
        )

    # Average baseline metrics across all samples
    avg_entropy = sum(b.stylometric_vector.get("entropy", 0) for b in baselines) / len(baselines)
    avg_var = sum(b.stylometric_vector.get("sentence_len_var", 0) for b in baselines) / len(baselines)

    # Extract current submission metrics
    current_vec = extract_stylometric_features(payload.text)

    # Simple normalized deviation score (relative change)
    entropy_delta = abs(current_vec["entropy"] - avg_entropy) / (avg_entropy or 1.0)
    var_delta = abs(current_vec["sentence_len_var"] - avg_var) / (avg_var or 1.0)
    total_deviation = round((entropy_delta * 0.6) + (var_delta * 0.4), 2)

    is_flagged = total_deviation > 0.35  # Threshold
    status = "FLAGGED" if is_flagged else "VERIFIED"

    submission = Submission(
        student_id=student.id,
        title=payload.title,
        raw_text=payload.text,
        deviation_score=total_deviation,
        status=status,
        stylometric_vector=current_vec,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    session_token = None
    if is_flagged:
        session_token = secrets.token_urlsafe(32)
        session = InterviewSession(
            session_token=session_token,
            submission_id=submission.id,
            student_id=student.id,
            status="ACTIVE",
            expires_at=datetime.utcnow() + timedelta(hours=48),
        )
        db.add(session)
        db.commit()

    return {
        "submission_id": str(submission.id),
        "status": status,
        "is_flagged": is_flagged,
        "deviation_score": total_deviation,
        "session_token": session_token,
    }