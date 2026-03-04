import json
import os
from urllib import error, request


class RecommendationServiceError(Exception):
    pass


def _derive_key_factors(patient_payload):
    factors = []

    age = patient_payload.get('age') or 0
    if age >= 75:
        factors.append({'factor': 'Age', 'impact': '+0.21', 'reason': 'Advanced age increases overall clinical risk burden.'})

    sbp = patient_payload.get('sbp') or 0
    if sbp >= 160:
        factors.append({'factor': 'High blood pressure', 'impact': '+0.18', 'reason': 'Elevated systolic blood pressure increases cardiovascular and BP-control risk.'})
    elif sbp >= 140:
        factors.append({'factor': 'Elevated blood pressure', 'impact': '+0.12', 'reason': 'Above-target systolic blood pressure contributes to hypertension-related risk.'})

    hba1c = patient_payload.get('hba1c') or 0
    if hba1c >= 8.5:
        factors.append({'factor': 'High HbA1c', 'impact': '+0.12', 'reason': 'Poor glycemic control raises hypoglycemia management complexity and cardiovascular risk.'})
    elif hba1c >= 7.5:
        factors.append({'factor': 'Suboptimal HbA1c', 'impact': '+0.08', 'reason': 'Suboptimal glycemic control contributes to metabolic risk.'})

    meds = patient_payload.get('meds') or []
    if len(meds) >= 5:
        factors.append({'factor': 'Polypharmacy burden', 'impact': '+0.14', 'reason': 'High medication count increases drug interaction and adherence risk.'})

    creatinine = patient_payload.get('creatinine')
    if creatinine is not None and creatinine >= 1.4:
        factors.append({'factor': 'Renal function concern', 'impact': '+0.10', 'reason': 'Renal impairment may affect medication safety and dosing.'})

    return factors[:4]


def _build_risk_summary(patient_payload):
    risk_map = patient_payload.get('risks', {})
    return {
        'hypoglycemia': {
            'score': risk_map.get('hypoglycemia'),
            'category': _risk_category(risk_map.get('hypoglycemia')),
        },
        'cardiovascular': {
            'score': risk_map.get('cardiovascular'),
            'category': _risk_category(risk_map.get('cardiovascular')),
        },
        'bloodpressure': {
            'score': risk_map.get('bloodpressure'),
            'category': _risk_category(risk_map.get('bloodpressure')),
        },
        'polypharmacy': {
            'score': risk_map.get('polypharmacy'),
            'category': _risk_category(risk_map.get('polypharmacy')),
        },
        'overall': patient_payload.get('overallRisk'),
    }


def _risk_category(score):
    if score is None:
        return 'unknown'
    if score >= 70:
        return 'high'
    if score >= 40:
        return 'medium'
    return 'low'


def generate_recommendations(patient_payload):
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise RecommendationServiceError('OPENAI_API_KEY is not configured on the server.')

    model = os.environ.get('OPENAI_RECOMMENDATION_MODEL', 'gpt-4o-mini')
    risk_summary = _build_risk_summary(patient_payload)
    key_factors = _derive_key_factors(patient_payload)

    schema = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['summary', 'risk_summary', 'key_factors', 'safety_flags', 'recommendations'],
        'properties': {
            'summary': {'type': 'string'},
            'risk_summary': {
                'type': 'string',
            },
            'key_factors': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'additionalProperties': False,
                    'required': ['factor', 'impact', 'reason'],
                    'properties': {
                        'factor': {'type': 'string'},
                        'impact': {'type': 'string'},
                        'reason': {'type': 'string'},
                    },
                },
            },
            'safety_flags': {
                'type': 'array',
                'items': {'type': 'string'},
            },
            'recommendations': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'additionalProperties': False,
                    'required': ['id', 'title', 'subtitle', 'priority', 'rationale', 'actions', 'citations', 'guideline_basis'],
                    'properties': {
                        'id': {'type': 'string'},
                        'title': {'type': 'string'},
                        'subtitle': {'type': 'string'},
                        'priority': {'type': 'string', 'enum': ['urgent', 'high', 'moderate', 'review']},
                        'rationale': {'type': 'string'},
                        'actions': {'type': 'array', 'items': {'type': 'string'}},
                        'citations': {'type': 'array', 'items': {'type': 'string'}},
                        'guideline_basis': {'type': 'string'},
                    },
                },
            },
        },
    }

    system_prompt = (
        'You are the prescriptive recommendation layer of a clinical decision support system. '
        'Primary risk prediction has already been completed upstream by an explainable Random Forest model. '
        'Do not perform new risk prediction. '
        'Your task is to translate the provided risk results, patient context, and explainability factors into conservative clinician-facing treatment recommendations. '
        'Recommendations must align with recognized guidance such as ADA diabetes guidance, ESC cardiovascular guidance, and hypertension treatment standards. '
        'You must also surface safety concerns, contraindications, possible drug interaction concerns, and whether clinician review is needed before action. '
        'Do not present output as final medical advice or diagnosis. '
        'The output is meant to populate a clinician dashboard with risk summary, key factors, recommendations, safety flags, and guideline basis.'
    )
    user_prompt = (
        'Use the following already-computed prediction results and patient context. '
        'Generate output for the clinician interface. '
        'The interface should show patient risk dashboard content, key contributing factors, treatment recommendations, safety warnings, and guideline basis. '
        'Where safety concerns exist, include them in safety_flags. '
        'Where recommendation justification exists, include official guideline basis. '
        'If no concrete safety issue is evident from the provided data, return an empty safety_flags array.\n\n'
        f'{json.dumps({"patient": patient_payload, "risk_summary": risk_summary, "key_factors": key_factors})}'
    )

    body = {
        'model': model,
        'instructions': system_prompt,
        'input': user_prompt,
        'text': {
            'format': {
                'type': 'json_schema',
                'name': 'clinical_recommendations',
                'strict': True,
                'schema': schema,
            },
        },
    }

    req = request.Request(
        'https://api.openai.com/v1/responses',
        data=json.dumps(body).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with request.urlopen(req, timeout=60) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except error.HTTPError as exc:
        details = exc.read().decode('utf-8', errors='ignore')
        raise RecommendationServiceError(f'OpenAI request failed: {details or exc.reason}') from exc
    except error.URLError as exc:
        raise RecommendationServiceError(f'Unable to reach OpenAI: {exc.reason}') from exc

    output_text = payload.get('output_text')
    if not output_text:
        raise RecommendationServiceError('OpenAI returned no recommendation output.')

    try:
        parsed = json.loads(output_text)
    except json.JSONDecodeError as exc:
        raise RecommendationServiceError('OpenAI returned invalid JSON output.') from exc

    return {
        'model': model,
        'summary': parsed.get('summary', ''),
        'risk_summary': parsed.get('risk_summary', ''),
        'key_factors': parsed.get('key_factors', []),
        'safety_flags': parsed.get('safety_flags', []),
        'recommendations': parsed.get('recommendations', []),
    }
