import os
import json
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "DUMMY_API_KEY")
MODEL = "gemini-3-flash-preview"

client = genai.Client(api_key=GEMINI_API_KEY)

ANALYSIS_SYSTEM_PROMPT = """You are an expert CV/resume analyst and career coach.
Your job is to analyze a CV against a specific job vacancy and provide actionable optimization advice.

You MUST respond with valid JSON matching this exact schema (no markdown, no code fences):
{
  "match_score": <integer 0-100>,
  "missing_skills": ["skill1", "skill2", ...],
  "suggestions": [
    {
      "section": "<CV section name, e.g. Summary, Experience, Skills, Education, Projects>",
      "original": "<original text from that section>",
      "suggested": "<your improved version>",
      "reason": "<why this change improves the match>"
    }
  ],
  "optimized_cv": "<the full rewritten CV text optimized for this vacancy>",
  "summary": "<2-3 sentence executive summary of the analysis>"
}

Guidelines:
- match_score: how well the current CV matches the vacancy (0=no match, 100=perfect)
- missing_skills: skills/technologies/qualifications mentioned in the vacancy but absent from the CV
- suggestions: provide rewrites for EVERY section of the CV, not just experience
- optimized_cv: a complete, polished, rewritten CV that maximizes match with the vacancy while remaining truthful
- Keep the tone professional and the language clear
- Preserve all factual information from the original CV — do not invent experience or skills the candidate doesn't have
- Reorder, rephrase, and emphasize existing experience to better align with the vacancy requirements
"""

ITERATE_SYSTEM_PROMPT = """You are an expert CV/resume editor. You are helping a user iteratively refine their CV.
You have the context of the original CV, the job vacancy, and the current optimized version.

The user will give you feedback or instructions on how to further modify the CV.

You MUST respond with valid JSON (no markdown, no code fences):
{
  "optimized_cv": "<the updated full CV text incorporating the user's feedback>",
  "message": "<brief explanation of what you changed and why>"
}

Guidelines:
- Apply the user's requested changes precisely
- Maintain professional tone and formatting
- Keep the CV truthful — don't invent qualifications
- If the user's request is unclear, do your best interpretation and explain in the message
"""


async def analyze_cv(cv_text: str, vacancy_text: str) -> dict:
    prompt = f"""Analyze the following CV against the job vacancy and provide optimization suggestions.

--- CV ---
{cv_text}

--- JOB VACANCY ---
{vacancy_text}

Respond with the JSON analysis."""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            system_instruction=ANALYSIS_SYSTEM_PROMPT,
            temperature=0.3,
        ),
    )

    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    return json.loads(text)


async def iterate_cv(
    cv_text: str,
    vacancy_text: str,
    current_optimized_cv: str,
    conversation_history: list[dict],
    user_message: str,
) -> dict:
    context = f"""--- ORIGINAL CV ---
{cv_text}

--- JOB VACANCY ---
{vacancy_text}

--- CURRENT OPTIMIZED CV ---
{current_optimized_cv}
"""

    # Build conversation for context
    messages_text = "\n".join(
        f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
        for m in conversation_history
    )

    prompt = f"""{context}

--- CONVERSATION HISTORY ---
{messages_text}

--- NEW USER REQUEST ---
{user_message}

Apply the user's requested changes to the current optimized CV. Respond with JSON."""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            system_instruction=ITERATE_SYSTEM_PROMPT,
            temperature=0.3,
        ),
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    return json.loads(text)
