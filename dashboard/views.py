from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_GET

from patient.models import Patient
from patient.services import serialize_patient

from .services import RecommendationServiceError, generate_recommendations

def Dashboard(request):
    return render(request, 'dashboard/dashboard.html')

def recommendations(request):
    return render(request, 'dashboard/recommendations.html')


@require_GET
def recommendation_api(request, patient_code):
    patient = get_object_or_404(Patient, patient_code=patient_code)
    serialized_patient = serialize_patient(patient)

    try:
        recommendation_payload = generate_recommendations(serialized_patient)
    except RecommendationServiceError as exc:
        return JsonResponse({'error': str(exc)}, status=503)

    return JsonResponse({
        'patient': serialized_patient,
        'summary': recommendation_payload['summary'],
        'risk_summary': recommendation_payload['risk_summary'],
        'key_factors': recommendation_payload['key_factors'],
        'safety_flags': recommendation_payload['safety_flags'],
        'recommendations': recommendation_payload['recommendations'],
        'model': recommendation_payload['model'],
    })
