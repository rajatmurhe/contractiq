from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List
from ..adapters.llm_provider import get_llm

class VerificationFinding(BaseModel):
    is_valid: bool = Field(description="True if the extracted text exists exactly in the source document")
    clause_index: int = Field(description="The index of the clause being checked")
    correction: str = Field(description="If invalid, provide the exact corrected text. If valid, leave empty.")

class CriticResult(BaseModel):
    verifications: List[VerificationFinding]
    requires_re_extraction: bool = Field(description="True if any clauses failed verification")

SYSTEM_PROMPT = """You are an auditor verifying the work of an extraction system.
Your job is to prevent AI hallucinations. You will be provided with the SOURCE DOCUMENT and EXTRACTED CLAUSES.
For every extracted clause, verify that the `text` is an EXACT substring of the SOURCE DOCUMENT.
If a clause is missing from the source document, or words were altered, flag it as invalid (is_valid=False).
"""

def verify_extractions(state: dict) -> dict:
    """Critic agent node to verify extractions."""
    document_text = state.get("document_text", "")
    clauses = state.get("extracted_clauses", [])
    
    if not clauses or not document_text:
        return {"critic_passed": True}

    # Deterministic fallback check first: just check if substring exists
    # This prevents LLM hallucination on the validation step itself!
    all_valid = True
    for c in clauses:
        if c["text"] not in document_text:
            all_valid = False
            break
            
    if all_valid:
        return {"critic_passed": True}

    # If simple substring fails, use LLM to figure out the correction
    llm = get_llm().with_structured_output(CriticResult)
    
    clauses_text = "\\n".join([f"[{i}] {c['text']}" for i, c in enumerate(clauses)])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "SOURCE DOCUMENT:\n{doc}\n\nEXTRACTED CLAUSES:\n{clauses}")
    ])
    
    chain = prompt | llm
    result: CriticResult = chain.invoke({
        "doc": document_text[:50000], # truncating for safety
        "clauses": clauses_text
    })
    
    return {"critic_passed": not result.requires_re_extraction}
