from pydantic import BaseModel
from datetime import datetime


# --- CV ---
class SavedCVOut(BaseModel):
    id: int
    name: str
    original_text: str
    original_filename: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SaveCVRequest(BaseModel):
    name: str
    original_text: str
    original_filename: str | None = None


# --- Vacancy ---
class VacancyTextRequest(BaseModel):
    text: str


class VacancyURLRequest(BaseModel):
    url: str


# --- Analysis ---
class AnalysisRequest(BaseModel):
    cv_text: str
    vacancy_text: str
    vacancy_source: str = "text"
    cv_id: int | None = None


class Suggestion(BaseModel):
    section: str
    original: str
    suggested: str
    reason: str


class AnalysisResult(BaseModel):
    match_score: int
    missing_skills: list[str]
    suggestions: list[Suggestion]
    optimized_cv: str
    summary: str


class AnalysisOut(BaseModel):
    id: int
    cv_id: int | None
    cv_text: str
    vacancy_text: str
    vacancy_source: str
    match_score: int | None
    missing_skills: list | None
    suggestions: list | None
    optimized_cv: str | None
    conversation_history: list | None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Chat / Iterate ---
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class IterateRequest(BaseModel):
    analysis_id: int
    user_message: str


class IterateResponse(BaseModel):
    optimized_cv: str
    assistant_message: str
    conversation_history: list[ChatMessage]
