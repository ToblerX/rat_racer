import io
import pdfplumber
from docx import Document


def parse_pdf(file_bytes: bytes) -> str:
    text_parts: list[str] = []
    all_links: dict[str, str] = {}  # label -> url

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

            # Extract hyperlink annotations
            if page.page.get("Annots"):
                annots = page.page["Annots"]
                if hasattr(annots, "resolve"):
                    annots = annots.resolve()
                if not isinstance(annots, list):
                    continue
                for annot in annots:
                    if hasattr(annot, "resolve"):
                        annot = annot.resolve()
                    if not isinstance(annot, dict):
                        continue
                    if (
                        annot.get("Subtype") == "/Link"
                        or str(annot.get("Subtype")) == "/Link"
                    ):
                        a_dict = annot.get("A")
                        if a_dict:
                            if hasattr(a_dict, "resolve"):
                                a_dict = a_dict.resolve()
                            uri = a_dict.get("URI")
                            if uri:
                                if hasattr(uri, "resolve"):
                                    uri = uri.resolve()
                                url = str(uri)
                                if url not in all_links.values():
                                    all_links[url] = url

    full_text = "\n\n".join(text_parts)

    # Append discovered links that aren't already in the text
    links_to_add = [url for url in all_links.values() if url not in full_text]
    if links_to_add:
        full_text += "\n\nLinks:\n" + "\n".join(links_to_add)

    return full_text


def parse_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))

    # Collect all hyperlink URLs from relationships
    hyperlinks: dict[str, str] = {}  # rId -> url
    for rel in doc.part.rels.values():
        if "hyperlink" in str(rel.reltype).lower():
            hyperlinks[rel.rId] = rel.target_ref

    # Build text with inline hyperlink URLs
    parts: list[str] = []
    for para in doc.paragraphs:
        runs_text: list[str] = []
        for child in para._element:
            tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
            if tag == "hyperlink":
                # Extract the relationship ID
                r_id = child.get(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
                )
                # Get the display text from inner runs
                link_text = "".join(
                    r.text
                    for r in child.findall(
                        ".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"
                    )
                    if r.text
                )
                url = hyperlinks.get(r_id, "") if r_id else ""
                if url and url != link_text:
                    runs_text.append(f"{link_text} ({url})")
                else:
                    runs_text.append(link_text or url)
            elif tag == "r":
                # Normal run
                for t in child.findall(
                    "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"
                ):
                    if t.text:
                        runs_text.append(t.text)

        line = "".join(runs_text).strip()
        if line:
            parts.append(line)

    return "\n\n".join(parts)


def parse_cv(file_bytes: bytes, filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return parse_pdf(file_bytes)
    elif lower.endswith(".docx"):
        return parse_docx(file_bytes)
    else:
        raise ValueError(
            f"Unsupported file type: {filename}. Only PDF and DOCX are supported."
        )
