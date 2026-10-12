import json

import pytest
from fastapi.testclient import TestClient

from app.review.api import app, database
from app.review.assistant import checked_answer, passages, retrieve
from app.review.engine import SAMPLE, REVISED_SAMPLE, PolicyReview


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv('REVIEW_DB', str(tmp_path / 'reviews.db'))
    monkeypatch.delenv('REVIEW_LLM_API_KEY', raising=False)
    return TestClient(app)


def create(client, headers=None, text=SAMPLE, baseline=None):
    headers = headers or {'Authorization': 'Bearer ' + client.post('/api/review/auth/demo').json()['token']}
    response = client.post('/api/review/contracts', headers=headers,
                           json={'text': text, 'baseline_id': baseline})
    assert response.status_code == 200
    return headers, response.json()


def test_full_text_retrieval_finds_unflagged_payment_and_preserves_unicode():
    body = {'id': 'a', 'title': 'A', 'text': 'Vendor 🏢\n\nPayment: invoices are due within 45 days.\n\nLiability is capped.', 'findings': []}
    result = retrieve('When is payment due?', body)
    assert '45 days' in result[0]['quote']
    for source in passages(body):
        assert body['text'][source['start']:source['end']] == source['quote']
    assert retrieve('Which arbitration tribunal applies?', body) == []


def test_answer_rejects_fabricated_ids_and_unsupported_drafts():
    source = [{'id': 'S1'}]
    with pytest.raises(ValueError):
        checked_answer(json.dumps({'status': 'supported', 'claims': [{'text': 'Pay in thirty days', 'source_ids': ['S99']}], 'limitation': ''}), source)
    with pytest.raises(ValueError):
        checked_answer(json.dumps({'status': 'supported', 'claims': [], 'limitation': ''}), source)
    with pytest.raises(ValueError):
        checked_answer(json.dumps({'status': 'insufficient_evidence', 'claims': [], 'limitation': 'Unknown', 'draft': 'Invented obligation'}), source)


def test_conversation_is_owned_and_deleted_with_review(client):
    headers, body = create(client)
    path = '/api/review/contracts/' + body['id']
    answer = client.post(path + '/ask', headers=headers, json={'question': 'Explain liability.'})
    assert answer.status_code == 200
    data = answer.json()
    assert data['sources'] and data['claims']
    assert body['text'][data['sources'][0]['start']:data['sources'][0]['end']] == data['sources'][0]['quote']
    assert len(client.get(path + '/conversation', headers=headers).json()) == 1
    other, _ = create(client)
    assert client.get(path + '/conversation', headers=other).status_code == 404
    assert client.delete(path, headers=other).status_code == 404
    assert client.delete(path, headers=headers).status_code == 200
    assert client.get(path, headers=headers).status_code == 404
    with database() as db:
        assert db.execute('SELECT count(*) FROM conversations WHERE review_id=?', (body['id'],)).fetchone()[0] == 0
        assert db.execute('SELECT count(*) FROM events WHERE review_id=?', (body['id'],)).fetchone()[0] == 0


def test_baseline_cannot_be_deleted_before_revision(client):
    headers, original = create(client)
    _, revision = create(client, headers, REVISED_SAMPLE, original['id'])
    assert client.delete('/api/review/contracts/' + original['id'], headers=headers).status_code == 409
    assert client.delete('/api/review/contracts/' + revision['id'], headers=headers).status_code == 200
    assert client.delete('/api/review/contracts/' + original['id'], headers=headers).status_code == 200


def test_wrong_topic_evidence_becomes_uncertain(sample_policy_json):
    data = json.loads(sample_policy_json)
    data['P3'] = {'status': 'compliant', 'evidence': data['P4']['evidence'], 'findings': []}
    result = PolicyReview.model_validate(data).checked_review(SAMPLE)
    assert next(x for x in result.coverage if x['rule'] == 'P3')['status'] == 'uncertain'


def test_explicit_uncertainty_cannot_make_risk_assertions(sample_policy_json):
    data = json.loads(sample_policy_json)
    data['P1']['status'] = 'uncertain'
    with pytest.raises(ValueError):
        PolicyReview.model_validate(data).checked_review(SAMPLE)
    data['P1']['findings'] = []
    result = PolicyReview.model_validate(data).checked_review(SAMPLE)
    assert result.coverage[0]['status'] == 'uncertain'


def test_comparison_retrieval_keeps_both_versions_labeled():
    a = {'id': 'a', 'title': 'Original', 'text': 'Liability is unlimited.'}
    b = {'id': 'b', 'title': 'Revised', 'text': 'Liability is capped at twelve months of fees.'}
    result = retrieve('What changed in liability?', b, a)
    assert {s['version'] for s in result} == {'current', 'baseline'}
    assert len({s['id'] for s in result}) == len(result)


def test_backup_restore_preserves_records_and_refuses_overwrite(tmp_path):
    import importlib.util
    import sqlite3
    from pathlib import Path
    script = Path(__file__).resolve().parents[3] / 'scripts/review_backup.py'
    spec = importlib.util.spec_from_file_location('review_backup', script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    original, backup, restored = [tmp_path / name for name in ['original.db', 'backup.db', 'restored.db']]
    with sqlite3.connect(original) as db:
        db.execute('CREATE TABLE records (value TEXT)')
        db.execute("INSERT INTO records VALUES ('synthetic evidence')")
    module.snapshot(original, backup)
    module.snapshot(backup, restored)
    with sqlite3.connect(restored) as db:
        assert db.execute('SELECT value FROM records').fetchone()[0] == 'synthetic evidence'
    with pytest.raises(FileExistsError):
        module.snapshot(backup, original)
