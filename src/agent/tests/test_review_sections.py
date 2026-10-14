import asyncio
import copy

import pytest

from app.review import engine


def test_sections_preserve_unicode_and_every_character():
    source = ("A résumé — quoted clause.\n\n" * 100) + ("x" * 2500)
    sections = engine.split_sections(source, 1000)
    assert "".join(text for _, text in sections) == source
    assert all(source[offset : offset + len(text)] == text for offset, text in sections)
    assert all(0 < len(text) <= 1000 for _, text in sections)


def test_multiple_sections_remap_quotes_and_charge_calls(monkeypatch):
    source = "x" * 1000 + "\nSupplier notice is seven days."
    monkeypatch.setenv("REVIEW_SECTION_CHARS", "1000")
    monkeypatch.setenv("REVIEW_SECTION_PAUSE", "0")
    calls = []
    charges = []

    async def fake_review(text, demo, retry=False):
        calls.append(text)
        coverage = [
            {"rule": rule, "label": label, "status": "missing", "evidence": None}
            for rule, (label, _) in engine.TOPICS.items()
        ]
        findings = []
        if "Supplier" in text:
            quote = "Supplier notice is seven days."
            start = text.index(quote)
            coverage[3].update(
                status="deviation", evidence=quote, start=start, end=start + len(quote)
            )
            findings = [
                {
                    "id": "F1",
                    "rule": "P4",
                    "quote": quote,
                    "start": start,
                    "end": start + len(quote),
                }
            ]
        return {"coverage": coverage, "findings": findings, "trace": []}

    monkeypatch.setattr(engine, "_review", fake_review)
    result = asyncio.run(engine.review(source, False, lambda: charges.append(True)))
    assert "".join(calls) == source
    assert len(charges) == len(calls) - 1
    finding = result["findings"][0]
    assert finding["start"] == 1001 and finding["line"] == 2
    assert source[finding["start"] : finding["end"]] == finding["quote"]
    assert result["coverage"][3]["start"] == 1001


def test_conflicting_sections_never_report_compliance(monkeypatch):
    missing = [
        {"rule": rule, "label": label, "status": "missing", "evidence": None}
        for rule, (label, _) in engine.TOPICS.items()
    ]
    first = {"coverage": copy.deepcopy(missing), "findings": []}
    second = copy.deepcopy(first)
    first["coverage"][0].update(status="compliant", evidence="Liability capped.")
    second["coverage"][0].update(status="deviation", evidence="Liability unlimited.")
    second["findings"] = [{"rule": "P1", "quote": "Liability unlimited."}]
    result = engine.merge_sections([first, second], "Liability capped.\nLiability unlimited.")
    assert result["coverage"][0]["status"] == "uncertain"
    assert result["findings"] == []


def test_failure_in_later_section_does_not_return_partial_review(monkeypatch):
    monkeypatch.setenv("REVIEW_SECTION_CHARS", "1000")
    monkeypatch.setenv("REVIEW_SECTION_PAUSE", "0")

    async def fake_review(text, demo, retry=False):
        if text.startswith("b"):
            raise RuntimeError("provider failed")
        return {"coverage": [], "findings": [], "trace": []}

    monkeypatch.setattr(engine, "_review", fake_review)
    with pytest.raises(RuntimeError):
        asyncio.run(engine.review("a" * 1000 + "b" * 1000, False))
    assert engine._USAGE.get() is None
