from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Analysis
from schemas import (
    AnalysisRequest,
    AnalysisOut,
    IterateRequest,
    IterateResponse,
    ChatMessage,
)
from services.gemini import analyze_cv, iterate_cv
from services.cv_generator import generate_docx

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/run", response_model=AnalysisOut)
async def run_analysis(req: AnalysisRequest, db: AsyncSession = Depends(get_db)):
    """Run a full CV analysis against a job vacancy using Gemini."""
    try:
        result = analyze_cv(req.cv_text, req.vacancy_text)
        if hasattr(result, "__await__"):
            result = await result
    except Exception as e:
        raise HTTPException(500, f"Gemini analysis failed: {e}")

    analysis = Analysis(
        cv_id=req.cv_id,
        cv_text=req.cv_text,
        vacancy_text=req.vacancy_text,
        vacancy_source=req.vacancy_source,
        match_score=result.get("match_score"),
        missing_skills=result.get("missing_skills"),
        suggestions=result.get("suggestions"),
        optimized_cv=result.get("optimized_cv"),
        conversation_history=[],
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


@router.get("/{analysis_id}", response_model=AnalysisOut)
async def get_analysis(analysis_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific analysis."""
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    return analysis


@router.get("/", response_model=list[AnalysisOut])
async def list_analyses(db: AsyncSession = Depends(get_db)):
    """List all analyses."""
    result = await db.execute(select(Analysis).order_by(Analysis.created_at.desc()))
    return result.scalars().all()


@router.post("/iterate", response_model=IterateResponse)
async def iterate_analysis(req: IterateRequest, db: AsyncSession = Depends(get_db)):
    """Iterate on an analysis with user feedback — AI modifies the optimized CV."""
    analysis = await db.get(Analysis, req.analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")

    history = analysis.conversation_history or []

    try:
        result = iterate_cv(
            cv_text=analysis.cv_text,
            vacancy_text=analysis.vacancy_text,
            current_optimized_cv=analysis.optimized_cv or "",
            conversation_history=history,
            user_message=req.user_message,
        )
        if hasattr(result, "__await__"):
            result = await result
    except Exception as e:
        raise HTTPException(500, f"Gemini iteration failed: {e}")

    # Update conversation history
    history.append({"role": "user", "content": req.user_message})
    history.append({"role": "assistant", "content": result.get("message", "")})

    analysis.optimized_cv = result.get("optimized_cv", analysis.optimized_cv)
    analysis.conversation_history = history

    await db.commit()
    await db.refresh(analysis)

    return IterateResponse(
        optimized_cv=analysis.optimized_cv or "",
        assistant_message=result.get("message", ""),
        conversation_history=[ChatMessage(**m) for m in history],
    )


@router.get("/{analysis_id}/download")
async def download_cv(analysis_id: int, db: AsyncSession = Depends(get_db)):
    """Download the optimized CV as a DOCX file."""
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    if not analysis.optimized_cv:
        raise HTTPException(400, "No optimized CV available")

    docx_bytes = generate_docx(analysis.optimized_cv)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=optimized_cv_{analysis_id}.docx"
        },
    )
