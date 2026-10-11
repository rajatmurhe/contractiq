import io
import zipfile

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject

from app.review.api import app
from app.review.documents import extract_document

TEXT = "Supplier shall return customer data within thirty days after termination."


def docx(xml):
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w") as archive:
        archive.writestr("word/document.xml", xml)
    return output.getvalue()


def test_word_preserves_table_text_and_excludes_deleted_revisions():
    data = docx(f'''<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body><w:p><w:r><w:t>Contract heading</w:t></w:r></w:p><w:tbl><w:tr><w:tc>
    <w:p><w:del><w:r><w:t>DELETED TERM</w:t></w:r></w:del><w:r><w:t>{TEXT}</w:t></w:r></w:p>
    </w:tc></w:tr></w:tbl></w:body></w:document>''')
    result = extract_document(data, "my-contract.docx")
    assert "Contract heading\n" + TEXT == result["text"]
    assert "DELETED" not in result["text"]


def pdf(text=False, encrypted=False):
    writer = PdfWriter()
    page = writer.add_blank_page(width=600, height=800)
    if text:
        font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
        page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): font})})
        stream = DecodedStreamObject()
        stream.set_data(f"BT /F1 12 Tf 50 700 Td ({TEXT}) Tj ET".encode())
        page[NameObject('/Contents')] = stream
    if encrypted:
        writer.encrypt('test-password')
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def test_pdf_extracts_real_text_and_rejects_unreadable_or_locked_documents():
    result = extract_document(pdf(text=True), "contract.pdf")
    assert result["text"] == TEXT
    assert result["pages"] == 1
    with pytest.raises(ValueError, match="OCR"):
        extract_document(pdf(), "scan.pdf")
    with pytest.raises(ValueError, match="password-protected"):
        extract_document(pdf(text=True, encrypted=True), "locked.pdf")


@pytest.mark.parametrize('data,name', [(b'bad', 'broken.pdf'), (b'bad', 'broken.docx'), (b'\xff' * 100, 'wrong.txt'), (TEXT.encode(), 'script.exe'), (b'a' * 60001, 'long.txt')])
def test_invalid_uploads_fail_without_partial_results(data, name):
    with pytest.raises(ValueError):
        extract_document(data, name)


def test_upload_is_authenticated_available_without_ai_and_not_saved(tmp_path, monkeypatch):
    monkeypatch.setenv('REVIEW_DB', str(tmp_path / 'uploads.db'))
    monkeypatch.delenv('REVIEW_LLM_API_KEY', raising=False)
    client = TestClient(app)
    path = '/api/review/documents/extract?filename=mine.txt'
    assert client.post(path, content=TEXT).status_code == 401
    demo = client.post('/api/review/auth/demo').json()['token']
    assert client.post(path, headers={'Authorization': 'Bearer ' + demo}, content=TEXT).status_code == 403
    guest = client.post('/api/review/auth/guest').json()['token']
    headers = {'Authorization': 'Bearer ' + guest}
    result = client.post(path, headers=headers, content=TEXT)
    assert result.status_code == 200
    assert result.json()['text'] == TEXT
    assert client.get('/api/review/contracts', headers=headers).json() == []
    assert client.post(path, headers=headers, content=b'a' * (5 * 1024 * 1024 + 1)).status_code == 413
