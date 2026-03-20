from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class SavedCV(Base):
    __tablename__ = "saved_cvs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    original_text = Column(Text, nullable=False)
    original_filename = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cv_id = Column(Integer, nullable=True)
    cv_text = Column(Text, nullable=False)
    vacancy_text = Column(Text, nullable=False)
    vacancy_source = Column(String(20), nullable=False)  # "url" or "text"
    match_score = Column(Integer, nullable=True)
    missing_skills = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)
    optimized_cv = Column(Text, nullable=True)
    conversation_history = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
