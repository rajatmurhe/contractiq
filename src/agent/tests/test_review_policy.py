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
    assert result.missing_topics == ['P1']
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
