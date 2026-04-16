from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

def crawl_url(url: str) -> str:
    """Uses Playwright to fully load a page (including JS), then BeautifulSoup to extract text."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        html_content = page.content()
        browser.close()

    soup = BeautifulSoup(html_content, "html.parser")
    
    # Remove script, style, nav, and footer to clean up the content
    for element in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        element.extract()
        
    text = soup.get_text(separator="\n")
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    clean_text = "\n".join(chunk for chunk in chunks if chunk)
    
    return clean_text
