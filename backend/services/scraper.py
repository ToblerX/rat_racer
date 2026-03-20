import httpx
from bs4 import BeautifulSoup


async def scrape_vacancy_url(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove scripts, styles, nav, footer
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    # Try to find the main content area
    main = (
        soup.find("main") or soup.find("article") or soup.find("div", {"role": "main"})
    )
    target = main if main else soup.body if soup.body else soup

    text = target.get_text(separator="\n", strip=True)

    # Collapse multiple blank lines
    lines = [line.strip() for line in text.splitlines()]
    cleaned = "\n".join(line for line in lines if line)

    # Truncate to reasonable length
    if len(cleaned) > 15000:
        cleaned = cleaned[:15000] + "\n\n[Content truncated]"

    return cleaned
