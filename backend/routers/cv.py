from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import SavedCV
from schemas import SavedCVOut, SaveCVRequest
from services.parser import parse_cv
from services.cv_generator import generate_docx

router = APIRouter(prefix="/api/cv", tags=["cv"])


@router.post("/parse")
async def parse_cv_file(file: UploadFile = File(...)):
    """Parse an uploaded CV file (PDF/DOCX) and return extracted text."""
    if not file.filename:
        raise HTTPException(400, "No file provided")

    content = await file.read()
    try:
        text = parse_cv(content, file.filename)
    except ValueError as e:
        raise HTTPException(400, str(e))

    return {"text": text, "filename": file.filename}


@router.post("/save", response_model=SavedCVOut)
async def save_cv(req: SaveCVRequest, db: AsyncSession = Depends(get_db)):
    """Save a parsed CV to the database."""
    cv = SavedCV(
        name=req.name,
        original_text=req.original_text,
        original_filename=req.original_filename,
    )
    db.add(cv)
    await db.commit()
    await db.refresh(cv)
    return cv


@router.get("/saved", response_model=list[SavedCVOut])
async def list_saved_cvs(db: AsyncSession = Depends(get_db)):
    """List all saved CVs."""
    result = await db.execute(select(SavedCV).order_by(SavedCV.created_at.desc()))
    return result.scalars().all()


@router.get("/saved/{cv_id}", response_model=SavedCVOut)
async def get_saved_cv(cv_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific saved CV."""
    cv = await db.get(SavedCV, cv_id)
    if not cv:
        raise HTTPException(404, "CV not found")
    return cv


@router.get("/saved/{cv_id}/download")
async def download_saved_cv(cv_id: int, db: AsyncSession = Depends(get_db)):
    """Download a saved CV as DOCX."""
    cv = await db.get(SavedCV, cv_id)
    if not cv:
        raise HTTPException(404, "CV not found")
    docx_bytes = generate_docx(cv.original_text)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{cv.name}.docx"'},
    )


@router.delete("/saved/{cv_id}")
async def delete_saved_cv(cv_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a saved CV."""
    cv = await db.get(SavedCV, cv_id)
    if not cv:
        raise HTTPException(404, "CV not found")
    await db.delete(cv)
    await db.commit()
    return {"ok": True}
