"""Contract passage retrieval and checked assistant answers. No external actions."""

import re
from typing import Any, Literal

from pydantic import BaseModel, Field

TOPICS = {
    "P1": ("Liability", r"liabilit|damages|exposure"),
    "P2": ("Indemnity", r"indemn|third.party claims"),
    "P3": ("Renewal", r"renew|roll.?over|rolls? over|extend.{0,20}term"),
    "P4": ("Termination", r"terminat|for convenience|end the (?:service|agreement)"),
    "P5": ("Data handling", r"delet|eras|subprocessor|customer (?:data|files)"),
}
STOP = set(
    (
        "the a an what which how why when is are does do can i we you it this that "
        "of to and in for my our contract agreement please explain tell me about"
    ).split()
)
ALIASES = {
    "cancel": "termination terminate renewal notice",
    "end": "termination terminate expiry",
    "pay": "payment fees invoice",
    "payment": "fees invoice prepaid",
    "delete": "erase deletion data files",
    "renew": "renewal subscription",
    "risk": "liability indemnity termination renewal data",
    "risks": "liability indemnity termination renewal data",
    "negotiate": "liability indemnity termination renewal data",
}


def passages(review: dict[str, Any], prefix: str = "S") -> list[dict[str, Any]]:
    source = review["text"]
    result: list[dict[str, Any]] = []
    # Keep original text positions, including Unicode. Limit each source block.
    for match in re.finditer(r"[^\n]+(?:\n(?!\s*\n)[^\n]+)*", source):
        for offset in range(match.start(), match.end(), 1400):
            end = min(offset + 1400, match.end())
            quote = source[offset:end]
            if not quote.strip():
                continue
            result.append(
                {
                    "id": f"{prefix}{len(result) + 1}",
                    "review_id": review["id"],
                    "title": review["title"],
                    "quote": quote,
                    "start": offset,
                    "end": end,
                    "line": source[:offset].count("\n") + 1,
                    "version": "baseline" if prefix == "B" else "current",
                }
            )
    return result


def retrieve(
    question: str,
    review: dict[str, Any],
    baseline: dict[str, Any] | None = None,
    previous_question: str = "",
) -> list[dict[str, Any]]:
    terms = set(re.findall(r"[a-z]+", question.lower())) - STOP
    if previous_question and (
        len(terms) < 3 or re.search(r"\b(it|that|this clause|those)\b", question, re.I)
    ):
        terms |= set(re.findall(r"[a-z]+", previous_question.lower())) - STOP
    for term in list(terms):
        terms.update(ALIASES.get(term, "").split())
    terms |= {term[:-1] for term in terms if len(term) > 3 and term.endswith("s")}
    broad = bool(
        re.search(
            r"\b(summar|overview|biggest|main risk|negotiate|changed|changes|"
            r"compar|coverage|missing)",
            question,
            re.I,
        )
    )
    sources = passages(review)
    if baseline:
        sources += passages(baseline, "B")

    def score(item: dict[str, Any]) -> int:
        words = set(re.findall(r"[a-z]+", item["quote"].lower()))
        words |= {word[:-1] for word in words if len(word) > 3 and word.endswith("s")}
        return len(words & terms)

    ranked = sorted(sources, key=score, reverse=True)
    candidates = [item for item in ranked if broad or score(item) > 0]
    if baseline:
        # Reserve space for both versions. Never mix them without version labels.
        return [x for x in candidates if x["version"] == "current"][:4] + [
            x for x in candidates if x["version"] == "baseline"
        ][:4]
    selected = candidates[:6]
    # Include nearby context to reduce loss of exceptions and definitions.
    for item in list(selected):
        index = sources.index(item)
        for neighbor in sources[max(0, index - 1) : index + 2]:
            if neighbor not in selected and len(selected) < 10:
                selected.append(neighbor)
    return selected


class Claim(BaseModel):
    text: str = Field(min_length=3, max_length=1800)
    source_ids: list[str] = Field(min_length=1, max_length=8)


class Answer(BaseModel):
    status: Literal["supported", "insufficient_evidence"]
    claims: list[Claim] = Field(max_length=8)
    limitation: str = Field(max_length=800)
    draft: str | None = Field(default=None, max_length=3000)


def checked_answer(raw: str, sources: list[dict[str, Any]]) -> dict[str, Any]:
    result = Answer.model_validate_json(raw)
    allowed = {item["id"] for item in sources}
    if result.status == "supported" and not result.claims:
        raise ValueError("Supported answers require evidence-backed claims")
    if result.status == "insufficient_evidence" and (result.claims or result.draft):
        raise ValueError("Insufficient evidence cannot support claims or drafts")
    if result.status == "insufficient_evidence" and not result.limitation.strip():
        raise ValueError("Insufficient evidence requires a useful explanation")
    for claim in result.claims:
        if any(ref not in allowed for ref in claim.source_ids):
            raise ValueError("Unknown source citation")
    used = {ref for claim in result.claims for ref in claim.source_ids}
    return {
        **result.model_dump(),
        "answer": "\n\n".join(c.text for c in result.claims) or result.limitation,
        "sources": [item for item in sources if item["id"] in used],
    }
