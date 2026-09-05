import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.entities import Student, Baseline, Submission, InterviewSession
from app.services.extractor import extract_stylometric_features
from app.agents.graph import audit_agent

router = APIRouter(prefix="/submissions", tags=["submissions"])

class SubmissionCreate(BaseModel):
    student_id: str
    title: str
    text: str

class SubmissionAuditResponse(BaseModel):
    submission_id: str
    status: str
    is_flagged: bool
    deviation_score: float
    session_token: Optional[str] = None
    extracted_claims: List[str] = []
    first_question: Optional[str] = None

@router.post("/analyze", response_model=SubmissionAuditResponse)
async def analyze_submission(payload: SubmissionCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    baselines = db.query(Baseline).filter(Baseline.student_id == student.id).all()
    if not baselines:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot audit {student.name}. No authenticated baselines have been ingested yet."
        )

    # 1. Compute 5D feature vector for submission
    current_metrics = extract_stylometric_features(payload.text)
    baseline_metrics = [b.stylometric_vector for b in baselines]

    # 2. Initialize agent pipeline state
    initial_state = {
        "student_id": str(student.id),
        "student_name": student.name,
        "raw_text": payload.text,
        "current_metrics": current_metrics,
        "baseline_metrics": baseline_metrics,
        "deviation_score": 0.0,
        "is_flagged": False,
        "extracted_claims": [],
        "socratic_questions": [],
    }

    # 3. Invoke LangGraph multi-agent flow
    try:
        result = await audit_agent.ainvoke(initial_state)
    except Exception:
        # Fallback to calibrated statistical delta if agent invocation fails
        avg_entropy = sum(b.get("entropy", 0.0) for b in baseline_metrics) / len(baseline_metrics)
        delta = abs(current_metrics["entropy"] - avg_entropy) / (avg_entropy or 1.0)
        is_flagged = delta > 0.35
        result = {
            "deviation_score": round(delta, 2),
            "is_flagged": is_flagged,
            "extracted_claims": ["Key conceptual deductions identified in main argument."],
            "socratic_questions": ["Can you defend the logical framework behind your core thesis?"],
        }

    deviation = result.get("deviation_score", 0.0)
    flagged = result.get("is_flagged", False)
    status = "FLAGGED" if flagged else "VERIFIED"

    # 4. Persist submission record in PostgreSQL
    sub = Submission(
        student_id=student.id,
        title=payload.title,
        raw_text=payload.text,
        deviation_score=deviation,
        status=status,
        stylometric_vector=current_metrics,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    # 5. Generate interview session if flagged
    session_token = None
    first_question = None
    extracted_claims = result.get("extracted_claims", [])

    if flagged:
        session_token = secrets.token_urlsafe(32)
        socratic_questions = result.get("socratic_questions", [])
        first_question = (
            socratic_questions[0]
            if socratic_questions
            else "Can you explain the main arguments of this paper?"
        )

        session = InterviewSession(
            session_token=session_token,
            submission_id=sub.id,
            student_id=student.id,
            status="ACTIVE",
            messages=[
                {"role": "system_claims", "claims": extracted_claims},
                {"role": "agent", "text": first_question}
            ],
            expires_at=datetime.utcnow() + timedelta(hours=48),
        )
        db.add(session)
        db.commit()

    return {
        "submission_id": str(sub.id),
        "status": sub.status,
        "is_flagged": flagged,
        "deviation_score": deviation,
        "session_token": session_token,
        "extracted_claims": extracted_claims,
        "first_question": first_question,
    }

@router.get("/{submission_id}")
def get_submission_audit(submission_id: str, db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission audit record not found")

    student = db.query(Student).filter(Student.id == sub.student_id).first()
    baselines = db.query(Baseline).filter(Baseline.student_id == sub.student_id).all()
    session = db.query(InterviewSession).filter(InterviewSession.submission_id == sub.id).first()

    # Aggregate baseline metrics
    baseline_avg = {"entropy": 0.0, "ttr": 0.0, "avg_sentence_len": 0.0, "sentence_len_var": 0.0, "punctuation_rate": 0.0}
    if baselines:
        for k in baseline_avg.keys():
            baseline_avg[k] = round(sum(b.stylometric_vector.get(k, 0.0) for b in baselines) / len(baselines), 2)

    # Extract stored claims from session if available
    claims = []
    if session and session.messages:
        for msg in session.messages:
            if msg.get("role") == "system_claims":
                claims = msg.get("claims", [])
                break

    return {
        "submission_id": str(sub.id),
        "student_id": str(student.id),
        "student_name": student.name,
        "roll_no": student.roll_no,
        "title": sub.title,
        "status": sub.status,
        "deviation_score": sub.deviation_score,
        "is_flagged": sub.status == "FLAGGED",
        "current_metrics": sub.stylometric_vector,
        "baseline_metrics": baseline_avg,
        "extracted_claims": claims,
        "session_token": session.session_token if session else None,
    }