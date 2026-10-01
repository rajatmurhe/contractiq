from pydantic import BaseModel
from pathlib import Path
import tempfile, os

class PageContent(BaseModel):
    page_number: int
    text: str
    text_density: float
    ocr_used: bool

class SectionNode(BaseModel):
    section_id: str
    title: str
    level: int
    start_char: int
    end_char: int
    children: list['SectionNode']

class PiiSpan(BaseModel):
    start: int
    end: int
    label: str
    text: str

class ContractDocument(BaseModel):
    contract_id: str
    tenant_id: str
    original_filename: str
    content_type: str
    full_text: str
    pages: list[PageContent]
    section_tree: list[SectionNode]
    pii_spans: list[PiiSpan]
    page_count: int
    char_count: int
    ingestion_version: str

class IngestionPipeline:
    def __init__(self, max_file_size_mb: int = 50, enable_pii: bool = True):
        self.max_file_size_mb = max_file_size_mb
        self.enable_pii = enable_pii

    async def process(self, file_content: bytes, filename: str, content_type: str,
                      contract_id: str, tenant_id: str) -> ContractDocument:
        if len(file_content) > self.max_file_size_mb * 1024 * 1024:
            raise ValueError("File too large")
            
        full_text = "Extracted text content..."
        return ContractDocument(
            contract_id=contract_id,
            tenant_id=tenant_id,
            original_filename=filename,
            content_type=content_type,
            full_text=full_text,
            pages=[PageContent(page_number=1, text=full_text, text_density=0.8, ocr_used=False)],
            section_tree=[],
            pii_spans=[],
            page_count=1,
            char_count=len(full_text),
            ingestion_version="0.1.0"
        )
