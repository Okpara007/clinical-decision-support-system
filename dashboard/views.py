from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_GET

from accounts.decorators import hardcoded_login_required
from patient.models import Patient
from patient.services import serialize_patient

from .models import RecommendationCache
from .services import RecommendationServiceError, generate_recommendations

@hardcoded_login_required
def Dashboard(request):
    return render(request, 'dashboard/dashboard.html')


@hardcoded_login_required
def recommendations(request):
    return render(request, 'dashboard/recommendations.html')


@hardcoded_login_required
@require_GET
def recommendation_api(request, patient_code):
    patient = get_object_or_404(Patient, patient_code=patient_code)
    serialized_patient = serialize_patient(patient)
    refresh = (request.GET.get('refresh') or '').strip().lower() in {'1', 'true', 'yes'}

    cache = RecommendationCache.objects.filter(patient=patient).first()
    if cache and not refresh:
        return JsonResponse({
            'patient': serialized_patient,
            'summary': cache.summary,
            'risk_summary': cache.risk_summary,
            'key_factors': cache.key_factors,
            'safety_flags': cache.safety_flags,
            'recommendations': cache.recommendations,
            'model': cache.model,
            'cached': True,
        })

    try:
        recommendation_payload = generate_recommendations(serialized_patient)
    except RecommendationServiceError as exc:
        return JsonResponse({'error': str(exc)}, status=503)

    RecommendationCache.objects.update_or_create(
        patient=patient,
        defaults={
            'model': recommendation_payload['model'],
            'summary': recommendation_payload['summary'],
            'risk_summary': recommendation_payload['risk_summary'],
            'key_factors': recommendation_payload['key_factors'],
            'safety_flags': recommendation_payload['safety_flags'],
            'recommendations': recommendation_payload['recommendations'],
        },
    )

    return JsonResponse({
        'patient': serialized_patient,
        'summary': recommendation_payload['summary'],
        'risk_summary': recommendation_payload['risk_summary'],
        'key_factors': recommendation_payload['key_factors'],
        'safety_flags': recommendation_payload['safety_flags'],
        'recommendations': recommendation_payload['recommendations'],
        'model': recommendation_payload['model'],
        'cached': False,
    })
