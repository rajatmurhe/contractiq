import re
from pydantic import BaseModel

class InjectionScanResult(BaseModel):
    is_injection: bool
    confidence: float
    matched_patterns: list[str]

# Adversarial patterns often used to jailbreak or inject instructions
INJECTION_PATTERNS = [
    re.compile(r"ignore\s+previous\s+instructions", re.IGNORECASE),
    re.compile(r"you\s+are\s+now", re.IGNORECASE),
    re.compile(r"system\s+prompt", re.IGNORECASE),
    re.compile(r"forget\s+everything", re.IGNORECASE),
    re.compile(r"do\s+not\s+follow", re.IGNORECASE),
    re.compile(r"bypass\s+rules", re.IGNORECASE),
    re.compile(r"<\/?contract>", re.IGNORECASE) # Attempting to close the delimiter
]

def scan_for_injection(text: str) -> InjectionScanResult:
    """
    Heuristic classifier for detecting prompt injection attacks in untrusted contract text.
    Returns early to block processing if confidence is high.
    """
    matches = []
    
    for pattern in INJECTION_PATTERNS:
        if pattern.search(text):
            matches.append(pattern.pattern)
            
    # Simple heuristic: 1 match = 0.5 conf, 2+ matches = 1.0 conf
    if len(matches) == 0:
        return InjectionScanResult(is_injection=False, confidence=0.0, matched_patterns=[])
        
    confidence = min(1.0, len(matches) * 0.5)
    
    return InjectionScanResult(
        is_injection=confidence >= 0.5,
        confidence=confidence,
        matched_patterns=matches
    )
