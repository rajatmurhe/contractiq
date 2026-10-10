import asyncio
import json
from pathlib import Path

import pytest

from app.review.evaluate import evaluate, score_case, validate_corpus


def corpus():
    return json.loads(Path('evals/review/cases.json').read_text())


def test_corpus_is_valid_and_covers_twenty_varied_cases():
    data = corpus()
    validate_corpus(data)
    assert len(data['cases']) == 20
    assert {'prompt-injection', 'missing-topic', 'boundary', 'negation', 'unicode'} <= {tag for c in data['cases'] for tag in c['tags']}


def test_offline_validation_does_not_claim_model_quality(tmp_path):
    result = asyncio.run(evaluate(corpus(), tmp_path / 'report.json', False))
    assert result['metrics'] is None
    assert result['results'] == []
    assert result['mode'] == 'corpus_validation_only'


def test_wrong_rule_or_unrelated_evidence_is_not_a_true_positive():
    case = corpus()['cases'][0]
    quote = case['source'].splitlines()[1]
    result = score_case(case, {'findings': [{'rule': 'P1', 'quote': quote, 'start': case['source'].index(quote), 'end': case['source'].index(quote) + len(quote)}]})
    assert result['true_positive_rules'] == 0
    assert result['unsupported_findings'] == 1
    assert result['missed_rules'] == ['P1']


def test_provider_errors_count_as_misses_and_never_zero_cost(tmp_path, monkeypatch):
    monkeypatch.setenv('REVIEW_LLM_API_KEY', 'test-only')
    async def fail(*args):
        raise RuntimeError('must not appear in report')
    monkeypatch.setattr('app.review.evaluate.review', fail)
    data = corpus()
    data['cases'] = data['cases'][:1]
    result = asyncio.run(evaluate(data, tmp_path / 'report.json', True))
    assert result['metrics']['failed_cases'] == 1
    assert result['metrics']['rule_recall'] == 0
    assert result['metrics']['estimated_total_cost_usd'] is None
    assert 'must not appear' not in json.dumps(result)


def test_live_eval_without_key_fails_instead_of_using_sample(tmp_path, monkeypatch):
    monkeypatch.delenv('REVIEW_LLM_API_KEY', raising=False)
    with pytest.raises(ValueError, match='REVIEW_LLM_API_KEY'):
        asyncio.run(evaluate(corpus(), tmp_path / 'report.json', True))


def test_gold_findings_score_full_rule_recall():
    from app.review.engine import Finding, ModelReview, verify_findings
    case = corpus()['cases'][6]
    findings = [Finding(title='Commercial deviation', rule=rule, severity='high', quote=quote, rationale='Deviates from customer preference.', proposed_language='Negotiate terms matching the commercial playbook.') for rule, quote in case['expected_evidence'].items()]
    result = score_case(case, {'findings': verify_findings(case['source'], ModelReview(findings=findings)), 'missing_topics': []})
    assert result['true_positive_rules'] == 5
    assert result['unsupported_findings'] == 0
    assert result['missing_topics_correct']


def test_live_usage_cost_and_context_cleanup(monkeypatch):
    import httpx
    from app.review.engine import SAMPLE, _USAGE, review, sample_review
    monkeypatch.setenv('REVIEW_LLM_API_KEY', 'test-only')
    monkeypatch.setenv('REVIEW_INPUT_PRICE_PER_MILLION', '2')
    monkeypatch.setenv('REVIEW_OUTPUT_PRICE_PER_MILLION', '8')
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json={'choices': [{'message': {'content': sample_review().model_dump_json()}}], 'usage': {'prompt_tokens': 1000, 'completion_tokens': 500}}))
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **kw: original(transport=transport, **kw))
    async def run():
        result = await review(SAMPLE, False)
        assert _USAGE.get() is None
        return result
    result = asyncio.run(run())
    assert result['usage'] == {'input_tokens': 1000, 'output_tokens': 500, 'estimated_cost_usd': .006}
