import json

from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from accounts.decorators import hardcoded_login_required
from .models import Patient


def _compute_risks(patient):
    hba1c = float(patient.hba1c or 7.5)
    sbp = int(patient.systolic_bp or 140)
    age = int(patient.age or 72)
    meds_count = len(patient.medications or [])

    seed = len(patient.full_name or 'x') + age + round(hba1c * 10)

    def rng(minimum, maximum, offset):
        value = ((seed + offset) * 9301 + 49297) % 233280
        return minimum + (value / 233280) * (maximum - minimum)

    scores = {
        'hypoglycemia': min(95, round(20 + (hba1c - 6) * 8 + rng(0, 15, 1))),
        'cardiovascular': min(95, round(15 + (sbp - 120) * 0.4 + (age - 60) * 0.5 + rng(0, 12, 2))),
        'bloodpressure': min(95, round(20 + (sbp - 120) * 0.5 + rng(0, 18, 3))),
        'polypharmacy': min(95, round(10 + meds_count * 6 + rng(0, 14, 4))),
    }
    average = round(sum(scores.values()) / len(scores))
    overall = 'high' if average >= 65 else 'medium' if average >= 40 else 'low'
    return scores, overall


def _serialize_patient(patient):
    risks, overall_risk = _compute_risks(patient)
    return {
        'id': patient.patient_code,
        'name': patient.full_name,
        'age': patient.age,
        'gender': patient.gender,
        'weight': float(patient.weight) if patient.weight is not None else None,
        'height': float(patient.height) if patient.height is not None else None,
        'hba1c': float(patient.hba1c),
        'sbp': patient.systolic_bp,
        'dbp': patient.diastolic_bp,
        'hr': patient.heart_rate,
        'fasting': patient.fasting_glucose,
        'ldl': patient.ldl,
        'creatinine': float(patient.creatinine) if patient.creatinine is not None else None,
        'smoking': patient.smoking_status,
        'adherence': patient.adherence,
        'mobility': patient.mobility_status,
        'cognitive': patient.cognitive_status,
        'meds': patient.medications or [],
        'falls': patient.fall_history,
        'status': patient.review_status,
        'date': patient.last_assessed.isoformat(),
        'risks': risks,
        'overallRisk': overall_risk,
    }


@hardcoded_login_required
def patient_entry(request):
    return render(request, 'patient/patient_entry.html')


def _gender_code(value):
    value = (value or '').strip().lower()
    if value in {'male', 'm'}:
        return 'M'
    if value in {'female', 'f'}:
        return 'F'
    return 'F'


def _parse_int(value):
    if value in (None, '', 'skip'):
        return None
    return int(float(value))


def _parse_decimal(value):
    if value in (None, '', 'skip'):
        return None
    return round(float(value), 1)


def _review_status_for(overall_risk):
    if overall_risk == 'high':
        return Patient.ReviewStatus.URGENT
    if overall_risk == 'medium':
        return Patient.ReviewStatus.PENDING
    return Patient.ReviewStatus.REVIEWED


def _next_patient_code():
    latest = Patient.objects.order_by('-id').first()
    if not latest:
        return 'PT-000001'
    try:
        numeric = int(latest.patient_code.split('-')[-1])
    except (TypeError, ValueError):
        numeric = latest.id
    return f'PT-{numeric + 1:06d}'


def _build_patient_from_payload(payload):
    patient = Patient(
        patient_code=_next_patient_code(),
        full_name=(payload.get('fullName') or '').strip(),
        age=_parse_int(payload.get('age')),
        gender=_gender_code(payload.get('gender')),
        weight=_parse_decimal(payload.get('weight')),
        height=_parse_decimal(payload.get('height')),
        hba1c=_parse_decimal(payload.get('hba1c')),
        systolic_bp=_parse_int(payload.get('systolicBP')),
        diastolic_bp=_parse_int(payload.get('diastolicBP')),
        heart_rate=_parse_int(payload.get('heartRate')),
        fasting_glucose=_parse_int(payload.get('fastingGlucose')),
        ldl=_parse_int(payload.get('ldl')),
        creatinine=_parse_decimal(payload.get('creatinine')),
        smoking_status=(payload.get('smokingStatus') or '').strip(),
        adherence=(payload.get('adherence') or '').strip(),
        mobility_status=(payload.get('mobilityStatus') or '').strip(),
        cognitive_status=(payload.get('cognitiveStatus') or '').strip(),
        fall_history=(payload.get('fallHistory') or '').strip(),
        medications=payload.get('currentMeds') or [],
        last_assessed=timezone.localdate(),
    )
    risks, overall_risk = _compute_risks(patient)
    patient.review_status = _review_status_for(overall_risk)
    return patient, risks, overall_risk


@hardcoded_login_required
@require_http_methods(['GET', 'POST'])
def records_api(request):
    if request.method == 'POST':
        payload = json.loads(request.body.decode('utf-8'))
        required_fields = [
            'fullName',
            'age',
            'gender',
            'weight',
            'height',
            'systolicBP',
            'diastolicBP',
            'heartRate',
            'hba1c',
            'fastingGlucose',
        ]
        missing = [field for field in required_fields if not payload.get(field)]
        if missing:
            return JsonResponse(
                {'error': 'Missing required fields', 'fields': missing},
                status=400,
            )

        patient, risks, overall_risk = _build_patient_from_payload(payload)
        patient.save()

        serialized = _serialize_patient(patient)
        serialized['risks'] = risks
        serialized['overallRisk'] = overall_risk
        return JsonResponse({'patient': serialized}, status=201)

    patients = [_serialize_patient(patient) for patient in Patient.objects.all()]
    return JsonResponse({'patients': patients})


@hardcoded_login_required
@require_http_methods(['GET'])
def record_detail_api(request, patient_code):
    patient = Patient.objects.filter(patient_code=patient_code).first()
    if not patient:
        return JsonResponse({'error': 'Patient not found'}, status=404)
    return JsonResponse({'patient': _serialize_patient(patient)})


@hardcoded_login_required
@require_http_methods(['GET'])
def latest_record_api(request):
    patient = Patient.objects.order_by('-id').first()
    if not patient:
        return JsonResponse({'error': 'No patients found'}, status=404)
    return JsonResponse({'patient': _serialize_patient(patient)})
