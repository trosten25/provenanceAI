import uuid
import secrets
from datetime import datetime, timedelta
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    roll_no = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    baselines = relationship("Baseline", back_populates="student", cascade="all, delete")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete")

class Baseline(Base):
    __tablename__ = "baselines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    title = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    file_path = Column(String(512), nullable=True)
    stylometric_vector = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="baselines")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    title = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    file_path = Column(String(512), nullable=True)
    deviation_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="PENDING")
    stylometric_vector = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="submissions")
    interview = relationship("InterviewSession", back_populates="submission", uselist=False)

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_token = Column(String(128), unique=True, nullable=False, default=lambda: secrets.token_urlsafe(32))
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id"), unique=True, nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    status = Column(String(50), default="ACTIVE")
    messages = Column(JSONB, default=list)
    score = Column(Float, nullable=True)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=48))
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="interview")