import json

import pytest


@pytest.fixture
def sample_policy_json():
    from app.review.engine import sample_review

    return json.dumps({
        f.rule: {'status': 'deviation', 'evidence': f.quote, 'findings': [f.model_dump()]}
        for f in sample_review().findings
    })
