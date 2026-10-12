import json

import pytest
from pydantic import ValidationError

from app.review.engine import PolicyReview, SAMPLE


def test_all_topics_are_required(sample_policy_json):
    data = json.loads(sample_policy_json)
    del data['P5']
    with pytest.raises(ValidationError):
        PolicyReview.model_validate(data)


def test_missing_and_compliant_topics_are_distinct(sample_policy_json):
    data = json.loads(sample_policy_json)
    data['P1'] = {'status': 'missing', 'evidence': None, 'findings': []}
    data['P2']['status'] = 'compliant'
    data['P2']['findings'] = []
    result = PolicyReview.model_validate(data).checked_review(SAMPLE)
    assert result.missing_topics == []
    assert result.coverage[0]['status'] == 'uncertain'
    assert result.coverage[1]['status'] == 'compliant'
    assert {f.rule for f in result.findings} == {'P3', 'P4', 'P5'}


@pytest.mark.parametrize('change', ['fabricated evidence', 'compliant with risk', 'wrong rule', 'missing with evidence'])
def test_inconsistent_assessment_is_rejected(sample_policy_json, change):
    data = json.loads(sample_policy_json)
    if change == 'fabricated evidence':
        data['P1']['evidence'] = 'This clause does not exist.'
    elif change == 'compliant with risk':
        data['P1']['status'] = 'compliant'
    elif change == 'wrong rule':
        data['P1']['findings'][0]['rule'] = 'P2'
    else:
        data['P1']['status'] = 'missing'
    with pytest.raises(ValueError):
        PolicyReview.model_validate(data).checked_review(SAMPLE)


@pytest.mark.parametrize('spelling,expected', [('30', 30), ('sixty', 60), ('sixty-one', 61), ('ninety', 90)])
def test_explicit_renewal_deadlines_use_arithmetic(spelling, expected):
    from app.review.engine import TopicAssessment, Finding, check_renewal
    clause = f'The agreement renews annually unless either party gives notice at least {spelling} days before renewal.'
    wrong = Finding(rule='P3', severity='high', title='Incorrect generated finding', quote=clause,
                    rationale='A generated explanation claims this exceeds the preferred cutoff.',
                    proposed_language='Change the cancellation deadline to thirty days.')
    checked, check = check_renewal(TopicAssessment(status='deviation', evidence=clause, findings=[wrong]))
    assert checked.status == ('compliant' if expected <= 60 else 'deviation')
    assert bool(checked.findings) == (expected > 60)
    assert str(expected) in check
    if checked.findings:
        assert checked.findings[0].quote == clause


@pytest.mark.parametrize('clause', [
    'Supplier may terminate for convenience on fourteen days notice and refund unused fees.',
    'Renewal requires notice between 30 days and 90 days before renewal.',
    'Renewal requires notice at least 45 business days before renewal.',
    'Renewal requires notice at least one hundred thirty days before renewal.',
    'Renewal notice may be given within 30 days before renewal.',
    'Renewal requires notice at least 30 days before renewal, except for the initial term.',
    'Renewal notice must be given no more than 90 days before renewal.',
    'The agreement will not renew if notice is given 30 days before renewal.',
    'Invoices are payable 90 days before renewal.',
])
def test_ambiguous_or_unrelated_day_counts_are_not_auto_classified(clause):
    from app.review.engine import explicit_renewal_days
    assert explicit_renewal_days(clause) is None


@pytest.mark.parametrize('rule,clause,compliant', [
    ('P4', "Supplier may terminate for convenience on at least forty-five days' written notice and shall refund fees prepaid for the unused service period.", True),
    ('P4', "Supplier may terminate for convenience on thirty days' notice, refunding unused prepaid fees.", True),
    ('P4', "Supplier may terminate for convenience on seven days' notice and shall refund unused prepaid fees.", False),
    ('P5', 'Supplier shall delete customer data within twenty days after termination and give prior written notice of new subprocessors.', True),
    ('P5', 'Supplier shall delete customer data within 31 days of termination and give prior notice of new subprocessors.', False),
])
def test_service_numeric_checks_preserve_both_policy_requirements(rule, clause, compliant):
    from app.review.engine import TopicAssessment, Finding, check_service_deadline
    finding = Finding(rule=rule, severity='high', title='Generated numeric interpretation', quote=clause,
                      rationale='The model has flagged this source sentence for review.',
                      proposed_language='Change the clause according to the commercial playbook.')
    checked, check = check_service_deadline(TopicAssessment(status='deviation', evidence=clause, findings=[finding]), rule)
    assert checked.status == ('compliant' if compliant else 'deviation')
    assert check is not None
    if checked.findings:
        assert checked.findings[0].quote == clause


@pytest.mark.parametrize('rule,clause', [
    ('P4', "Supplier may terminate for convenience on 45 days' notice. Prepaid fees are non-refundable."),
    ('P4', "Supplier may terminate for convenience on 45 days' notice and may refund unused prepaid fees."),
    ('P4', "Supplier may terminate for convenience on 45 business days' notice and shall refund unused prepaid fees."),
    ('P5', 'Supplier shall delete customer data within 20 days after termination. Subprocessors may be appointed without notice.'),
    ('P5', 'Supplier shall delete customer data within 20 days after termination except when retained for its own purposes, and give prior notice of subprocessors.'),
])
def test_uncertain_refund_or_notice_terms_are_never_automatically_cleared(rule, clause):
    from app.review.engine import TopicAssessment, check_service_deadline
    assessment = TopicAssessment(status='compliant', evidence=clause, findings=[])
    checked, check = check_service_deadline(assessment, rule)
    assert checked is assessment and check is None


def test_numeric_breach_does_not_require_other_topic_terms_to_be_present():
    from app.review.engine import TopicAssessment, check_service_deadline
    clause = 'After the contract ends, Alder Archive must erase all customer files within 31 days.'
    checked, _ = check_service_deadline(TopicAssessment(status='compliant', evidence=clause, findings=[]), 'P5')
    assert checked.status == 'deviation' and checked.findings[0].quote == clause


def test_source_casing_recovery_is_unique_and_preserves_original():
    from app.review.engine import exact_source_span
    assert exact_source_span('The renewal is annual.', 'the renewal is annual.') == 'The renewal is annual.'
    with pytest.raises(ValueError):
        exact_source_span('The renewal is annual. THE RENEWAL IS ANNUAL.', 'the renewal is annual.')
    with pytest.raises(ValueError):
        exact_source_span('The renewal is annual.', 'The renewal is monthly.')


def test_non_refund_rationale_does_not_call_45_days_insufficient():
    from app.review.engine import TopicAssessment, check_service_deadline
    clause = 'Basin may terminate for convenience on 45 days of written notice; all prepaid fees are non-refundable even for services not delivered.'
    result, _ = check_service_deadline(TopicAssessment(status='compliant', evidence=clause, findings=[]), 'P4')
    assert result.status == 'deviation'
    assert 'non-refundable' in result.findings[0].rationale
    assert 'below' not in result.findings[0].rationale
