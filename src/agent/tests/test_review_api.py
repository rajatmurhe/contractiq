import pytest
from fastapi.testclient import TestClient
from app.review.api import app, database
from app.review.engine import SAMPLE, sample_review, verify_findings

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv('REVIEW_DB', str(tmp_path / 'reviews.db'))
    monkeypatch.delenv('REVIEW_LLM_API_KEY', raising=False)
    monkeypatch.delenv('GOOGLE_CLIENT_ID', raising=False)
    return TestClient(app)

def auth(client):
    token = client.post('/api/review/auth/demo').json()['token']
    return {'Authorization': 'Bearer ' + token}

def create(client, headers):
    response = client.post('/api/review/contracts', headers=headers, json={'title': 'Sample', 'text': SAMPLE})
    assert response.status_code == 200, response.text
    return response.json()

def test_sample_citations_are_exact_and_review_is_never_auto_approved(client):
    result = create(client, auth(client))
    assert len(result['findings']) == 5
    assert result['status'] == 'awaiting_review'
    assert result['mode'] == 'sample'
    for f in result['findings']:
        assert SAMPLE[f['start']:f['end']] == f['quote']
        assert f['line'] == SAMPLE[:f['start']].count('\n') + 1

def test_fabricated_citation_fails_closed():
    result = sample_review()
    result.findings[0].quote = 'This text never appeared in the source contract.'
    with pytest.raises(ValueError, match='citation absent'):
        verify_findings(SAMPLE, result)

def test_session_required_and_demo_cannot_review_private_documents(client):
    assert client.get('/api/review/contracts').status_code == 401
    assert client.post('/api/review/contracts', headers=auth(client), json={'text': 'Sensitive contract terms. ' * 5}).status_code == 403

def test_cross_user_access_blocked_on_every_review_route(client):
    owner, other = auth(client), auth(client)
    result = create(client, owner)
    path = '/api/review/contracts/' + result['id']
    assert client.get('/api/review/contracts', headers=other).json() == []
    assert client.get(path, headers=other).status_code == 404
    assert client.get(path + '/audit', headers=other).status_code == 404
    assert client.post(path + '/ask', headers=other, json={'question': 'What is the risk?'}).status_code == 404
    assert client.post(path + '/decision', headers=other, json={'decision': 'approved', 'reason': 'All risks accepted.'}).status_code == 404

def test_decision_requires_reason_is_final_and_audited(client):
    headers = auth(client)
    result = create(client, headers)
    path = '/api/review/contracts/' + result['id']
    assert client.post(path + '/decision', headers=headers, json={'decision': 'approved', 'reason': 'ok'}).status_code == 422
    assert client.post(path + '/decision', headers=headers, json={'decision': 'approved', 'reason': ' ' * 20}).status_code == 422
    decision = {'decision': 'rejected', 'reason': 'Request a reciprocal indemnity before signature.'}
    assert client.post(path + '/decision', headers=headers, json=decision).json()['status'] == 'rejected'
    assert client.post(path + '/decision', headers=headers, json=decision).status_code == 409
    audit = client.get(path + '/audit', headers=headers).json()
    assert audit['valid']
    assert [e['action'] for e in audit['events']] == ['review_created', 'rejected']
    with database() as db:
        db.execute("UPDATE events SET body='{}' WHERE review_id=? AND id=(SELECT min(id) FROM events)", (result['id'],))
    assert client.get(path + '/audit', headers=headers).json()['valid'] is False

def test_logout_revokes_token(client):
    headers = auth(client)
    assert client.post('/api/review/auth/logout', headers=headers).status_code == 200
    assert client.get('/api/review/contracts', headers=headers).status_code == 401

def test_sample_chat_only_returns_owned_evidence(client):
    headers = auth(client)
    result = create(client, headers)
    response = client.post(f"/api/review/contracts/{result['id']}/ask", headers=headers, json={'question': 'Why is liability risky?'}).json()
    assert response['mode'] == 'sample'
    assert response['citations'] == ['F1']
    unsupported = client.post(f"/api/review/contracts/{result['id']}/ask", headers=headers, json={'question': 'Which arbitration tribunal applies?'}).json()
    assert unsupported['citations'] == []
    assert 'not contain enough evidence' in unsupported['answer']

def test_unconfigured_google_and_assistant_are_honest(client):
    assert client.post('/api/review/auth/google', json={'credential': 'x' * 30}).status_code == 503
    response = client.post('/api/review/assistant', json={'question': 'What is the pricing?'})
    assert response.status_code == 200
    assert response.json()['mode'] == 'guided'
    assert 'not enabled' in response.json()['answer']

def test_invalid_google_token_does_not_create_session(client, monkeypatch):
    monkeypatch.setenv('GOOGLE_CLIENT_ID', 'expected-client')
    def invalid(*args):
        raise ValueError('Bad signature')
    monkeypatch.setattr('google.oauth2.id_token.verify_oauth2_token', invalid)
    assert client.post('/api/review/auth/google', json={'credential': 'x' * 30}).status_code == 401

def test_verified_google_user_can_reopen_persisted_review(client, monkeypatch):
    monkeypatch.setenv('GOOGLE_CLIENT_ID', 'expected-client')
    monkeypatch.setenv('REVIEW_LLM_API_KEY', 'test-key')
    def verified(token, request, audience):
        assert audience == 'expected-client'
        return {'sub': 'stable-user-id', 'email_verified': True, 'name': 'Reviewer'}
    monkeypatch.setattr('google.oauth2.id_token.verify_oauth2_token', verified)
    async def fake_completion(*args):
        return sample_review().model_dump_json()
    monkeypatch.setattr('app.review.engine.completion', fake_completion)
    login = lambda: {'Authorization': 'Bearer ' + client.post('/api/review/auth/google', json={'credential': 'x' * 30}).json()['token']}
    headers = login()
    result = create(client, headers)
    assert result['mode'] == 'live'
    client.post('/api/review/auth/logout', headers=headers)
    assert client.get('/api/review/contracts/' + result['id'], headers=login()).status_code == 200

def test_provider_failure_does_not_create_review(client, monkeypatch):
    monkeypatch.setenv('GOOGLE_CLIENT_ID', 'expected-client')
    monkeypatch.setattr('google.oauth2.id_token.verify_oauth2_token', lambda *a: {'sub': 'user', 'email_verified': True})
    token = client.post('/api/review/auth/google', json={'credential': 'x' * 30}).json()['token']
    headers = {'Authorization': 'Bearer ' + token}
    response = client.post('/api/review/contracts', headers=headers, json={'title': 'Real', 'text': SAMPLE})
    assert response.status_code == 503
    assert client.get('/api/review/contracts', headers=headers).json() == []


def test_corrupted_audit_payload_is_reported_without_crashing(client):
    headers = auth(client)
    result = create(client, headers)
    with database() as db:
        db.execute("UPDATE events SET body='not-json' WHERE review_id=?", (result['id'],))
    response = client.get('/api/review/contracts/' + result['id'] + '/audit', headers=headers)
    assert response.status_code == 200
    assert response.json()['valid'] is False
    assert response.json()['events'][0]['action'] == 'corrupted_event'

def test_offsets_use_unicode_codepoints():
    source = 'Vendor 🏢\n' + SAMPLE
    findings = verify_findings(source, sample_review())
    for finding in findings:
        assert source[finding['start']:finding['end']] == finding['quote']


def test_revision_comparison_preserves_original_and_requires_new_decision(client):
    from app.review.engine import REVISED_SAMPLE
    headers = auth(client)
    baseline = create(client, headers)
    path = '/api/review/contracts/' + baseline['id']
    client.post(path + '/decision', headers=headers, json={'decision': 'rejected', 'reason': 'Negotiate liability and data handling.'})
    revised = client.post('/api/review/contracts', headers=headers, json={'title': 'Negotiated draft', 'text': REVISED_SAMPLE, 'baseline_id': baseline['id']})
    assert revised.status_code == 200
    body = revised.json()
    assert body['status'] == 'awaiting_review'
    assert body['comparison']['counts'] == {'remains': 2, 'newly_flagged': 0, 'no_longer_flagged': 3, 'needs_verification': 0}
    assert client.get(path, headers=headers).json()['status'] == 'rejected'
    assert client.get('/api/review/contracts/' + body['id'], headers=headers).json()['comparison'] == body['comparison']
    assert client.get('/api/review/contracts/' + body['id'] + '/audit', headers=headers).json()['events'][0]['data']['baseline_id'] == baseline['id']


def test_revision_cannot_reference_another_users_baseline(client):
    baseline = create(client, auth(client))
    result = client.post('/api/review/contracts', headers=auth(client), json={'text': SAMPLE, 'baseline_id': baseline['id']})
    assert result.status_code == 404


def test_comparison_never_calls_missing_coverage_resolved():
    from app.review.comparison import compare_reviews
    old = {'id': 'a', 'title': 'A', 'findings': [{'rule': 'P1', 'quote': 'old'}]}
    new = {'findings': [{'rule': 'P2', 'quote': 'new'}], 'missing_topics': ['liability']}
    result = compare_reviews(old, new)
    assert result['counts']['needs_verification'] == 1
    assert result['counts']['newly_flagged'] == 1
    assert result['counts']['no_longer_flagged'] == 0


def test_comparison_text_changes_preserve_exact_before_and_after_passages():
    from app.review.comparison import compare_reviews
    old = {'id': 'a', 'title': 'A', 'text': 'Heading\nUnlimited liability.\nFooter', 'findings': []}
    new = {'text': 'Heading\nLiability capped at annual fees.\nFooter', 'findings': []}
    assert compare_reviews(old, new)['changed_passages'] == [{'operation': 'replace', 'before_line': 2, 'after_line': 2, 'before': 'Unlimited liability.', 'after': 'Liability capped at annual fees.'}]


def test_guest_can_prepare_contract_without_model_but_never_get_fake_analysis(client):
    response = client.post('/api/review/auth/guest')
    assert response.status_code == 200
    headers = {'Authorization': 'Bearer ' + response.json()['token']}
    result = client.post('/api/review/contracts', headers=headers, json={'text': SAMPLE})
    assert result.status_code == 503
    assert 'not been analyzed' in result.json()['detail']
    assert client.get('/api/review/contracts', headers=headers).json() == []


def test_guest_can_review_arbitrary_text_without_google_and_is_isolated(client, monkeypatch):
    monkeypatch.setenv('REVIEW_LLM_API_KEY', 'test-key')
    async def fake_completion(*args):
        return sample_review().model_dump_json()
    monkeypatch.setattr('app.review.engine.completion', fake_completion)
    guest = client.post('/api/review/auth/guest').json()
    assert guest['guest'] is True and guest['demo'] is False
    headers = {'Authorization': 'Bearer ' + guest['token']}
    result = client.post('/api/review/contracts', headers=headers, json={'text': SAMPLE + '\nAdditional synthetic contact information.'})
    assert result.status_code == 200
    assert result.json()['mode'] == 'live'
    other = client.post('/api/review/auth/guest').json()
    assert client.get('/api/review/contracts/' + result.json()['id'], headers={'Authorization': 'Bearer ' + other['token']}).status_code == 404


def test_guest_session_creation_is_rate_limited(client, monkeypatch):
    monkeypatch.setenv('REVIEW_LLM_API_KEY', 'test-key')
    for _ in range(5):
        assert client.post('/api/review/auth/guest').status_code == 200
    assert client.post('/api/review/auth/guest').status_code == 429


def test_session_resume_returns_metadata_without_stored_token(client):
    headers = auth(client)
    response = client.get('/api/review/auth/session', headers=headers)
    assert response.status_code == 200
    assert response.json()['demo'] is True
    assert 'token' not in response.json()
    client.post('/api/review/auth/logout', headers=headers)
    assert client.get('/api/review/auth/session', headers=headers).status_code == 401


def test_evidence_export_contains_source_comparison_and_audit_and_is_owned(client):
    from app.review.engine import REVISED_SAMPLE
    headers = auth(client)
    baseline = create(client, headers)
    revised = client.post('/api/review/contracts', headers=headers, json={'text': REVISED_SAMPLE, 'baseline_id': baseline['id']}).json()
    path = '/api/review/contracts/' + revised['id'] + '/export'
    bundle = client.get(path, headers=headers).json()
    assert bundle['review']['text'] == REVISED_SAMPLE
    assert bundle['review']['comparison']['baseline_id'] == baseline['id']
    assert bundle['audit']['valid']
    assert 'P1:' in bundle['playbook']
    assert client.get(path, headers=auth(client)).status_code == 404
