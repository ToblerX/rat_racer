from fastapi import APIRouter, HTTPException

from schemas import VacancyURLRequest
from services.scraper import scrape_vacancy_url

router = APIRouter(prefix="/api/vacancy", tags=["vacancy"])


@router.post("/scrape")
async def scrape_vacancy(req: VacancyURLRequest):
    """Scrape a job vacancy from a URL and return extracted text."""
    try:
        text = await scrape_vacancy_url(req.url)
    except Exception as e:
        raise HTTPException(400, f"Failed to scrape URL: {e}")

    if not text.strip():
        raise HTTPException(400, "Could not extract text from the provided URL")

    return {"text": text}
