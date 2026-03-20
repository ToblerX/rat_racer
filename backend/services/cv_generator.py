import io
from docx import Document
from docx.shared import Pt, Inches


def generate_docx(cv_text: str) -> bytes:
    """Generate a DOCX file from plain CV text."""
    doc = Document()

    # Set default font
    style = doc.styles["Normal"]
    font = style.font
    font.name = "Calibri"
    font.size = Pt(11)

    # Set narrow margins
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    lines = cv_text.split("\n")
    for line in lines:
        stripped = line.strip()
        if not stripped:
            doc.add_paragraph("")
            continue

        # Detect section headers (all caps or lines ending with colon)
        if stripped.isupper() or (stripped.endswith(":") and len(stripped) < 60):
            p = doc.add_paragraph()
            run = p.add_run(stripped.rstrip(":"))
            run.bold = True
            run.font.size = Pt(13)
            p.space_after = Pt(4)
        elif stripped.startswith("- ") or stripped.startswith("• "):
            p = doc.add_paragraph(stripped[2:], style="List Bullet")
        else:
            doc.add_paragraph(stripped)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()
