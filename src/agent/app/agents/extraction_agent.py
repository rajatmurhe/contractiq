from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Optional
from ..adapters.llm_provider import get_llm

class ClauseExtraction(BaseModel):
    clause_type: str = Field(description="The type of the clause (e.g., Indemnification, Liability, Termination)")
    text: str = Field(description="The exact text of the clause extracted from the document")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    page_number: int = Field(description="The page number where the clause was found")
    start_char: int = Field(description="The starting character offset in the document")
    end_char: int = Field(description="The ending character offset in the document")

class ExtractionResult(BaseModel):
    clauses: List[ClauseExtraction]

SYSTEM_PROMPT = """You are a highly precise legal extraction specialist.
Your task is to identify and extract specific key clauses from the provided contract text.
You MUST extract the EXACT text as it appears in the source document. Do not summarize or paraphrase.
Extract the following clause types if present:
- Indemnification
- Limitation of Liability
- Termination
- Auto-Renewal
- Governing Law

If a clause type is not present, omit it from the results.
Provide the character offsets for where the text was found.
"""

def extract_clauses(state: dict) -> dict:
    """Extraction agent node."""
    llm = get_llm().with_structured_output(ExtractionResult)
    
    document_text = state.get("document_text", "")
    if not document_text:
        return {"extracted_clauses": []}

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Contract Text:\n\n{text}")
    ])
    
    chain = prompt | llm
    
    # In a real scenario, this handles chunking for large documents.
    result: ExtractionResult = chain.invoke({"text": document_text})
    
    clauses = [c.model_dump() for c in result.clauses]
    
    # Merge with any existing state
    return {"extracted_clauses": clauses}
