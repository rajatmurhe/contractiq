"""Bounded document extraction. Parser workers never call the model or save uploads."""

import io
import json
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import Any

MAX_BYTES = 5 * 1024 * 1024
MAX_CHARACTERS = 60000
SUPPORTED = {".pdf", ".docx", ".txt"}


def extract_document(data: bytes, filename: str) -> dict[str, Any]:
    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED:
        raise ValueError("Choose a PDF, Word (.docx), or UTF-8 text (.txt) file.")
    if not data or len(data) > MAX_BYTES:
        raise ValueError("Choose a non-empty file up to 5 MB.")
    try:
        result = subprocess.run(  # noqa: S603 - fixed executable/module; allow-listed extension, no shell.
            [sys.executable, "-m", "app.review.documents", extension],
            input=data,
            capture_output=True,
            timeout=20,
            check=False,
        )
    except subprocess.TimeoutExpired:
        raise ValueError("This document took too long to read. Paste its text instead.") from None
    if result.returncode:
        raise ValueError("This document could not be read safely. Paste its text instead.")
    payload: dict[str, Any] = json.loads(result.stdout)
    if "error" in payload:
        raise ValueError(payload["error"])
    return payload


def parse_document(data: bytes, extension: str) -> dict[str, Any]:
    pages = None
    if extension == ".txt":
        try:
            text = data.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ValueError("Save the text file as UTF-8, or paste the contract text.") from None
        if "\x00" in text:
            raise ValueError("This is not a readable text file. Choose a PDF, DOCX, or UTF-8 TXT.")
    elif extension == ".pdf":
        from pypdf import PdfReader

        if not data.startswith(b"%PDF-"):
            raise ValueError("The file is not a valid PDF.")
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise ValueError("This PDF is password-protected. Upload an unlocked copy.")
        pages = len(reader.pages)
        if pages > 100:
            raise ValueError("Choose a PDF with at most 100 pages, or paste the relevant text.")
        chunks = []
        for number, page in enumerate(reader.pages, 1):
            chunk = page.extract_text() or ""
            if not chunk.strip():
                raise ValueError(
                    f"Page {number} has no readable text. Scanned/image pages need OCR first. "
                    "Paste the complete contract text or upload a searchable PDF."
                )
            chunks.append(chunk)
            if sum(map(len, chunks)) > MAX_CHARACTERS:
                raise ValueError(
                    "The extracted text exceeds 60,000 characters. Use a smaller document."
                )
        text = "\n\n".join(chunks)
    else:
        from defusedxml.ElementTree import fromstring

        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            entries = archive.infolist()
            if len(entries) > 1000 or sum(e.file_size for e in entries) > 20 * 1024 * 1024:
                raise ValueError(
                    "This Word document is too complex to extract. Paste its text instead."
                )
            if "word/document.xml" not in archive.namelist():
                raise ValueError("The file is not a valid Word (.docx) document.")
            names = ["word/document.xml"] + sorted(
                e.filename
                for e in entries
                if e.filename.startswith(("word/header", "word/footer"))
                and e.filename.endswith(".xml")
                or e.filename in ("word/footnotes.xml", "word/endnotes.xml")
            )
            paragraphs = []
            ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
            for name in names:
                root = fromstring(archive.read(name))
                for parent in root.iter():
                    for child in list(parent):
                        if child.tag == ns + "del":
                            parent.remove(child)
                for paragraph in root.iter(ns + "p"):
                    parts = []
                    for element in paragraph.iter():
                        if element.tag == ns + "t":
                            parts.append(element.text or "")
                        elif element.tag in (ns + "tab", ns + "br", ns + "cr"):
                            parts.append("\n" if element.tag != ns + "tab" else "\t")
                    paragraphs.append("".join(parts))
            text = "\n".join(paragraphs)
    text = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    if len(text) > MAX_CHARACTERS:
        raise ValueError("The extracted text exceeds 60,000 characters. Use a smaller document.")
    if len(text) < 50:
        raise ValueError("Not enough readable contract text. Paste at least 50 characters.")
    return {"text": text, "format": extension[1:], "pages": pages}


if __name__ == "__main__":
    # Separate worker gives malformed or expensive documents a hard deadline.
    if sys.platform == "linux":
        import resource

        resource.setrlimit(resource.RLIMIT_AS, (512 * 1024 * 1024, 512 * 1024 * 1024))
        resource.setrlimit(resource.RLIMIT_CPU, (15, 15))
    try:
        output = parse_document(sys.stdin.buffer.read(MAX_BYTES + 1), sys.argv[1])
    except ValueError as exc:
        output = {"error": str(exc)}
    except Exception:
        output = {
            "error": "The document is damaged or unsupported. Try another file or paste its text."
        }
    print(json.dumps(output))
