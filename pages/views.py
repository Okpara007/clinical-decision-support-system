from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie


def home(request):
    return render(request, 'pages/index.html')


def records(request):
    return render(request, 'pages/index.html')


@ensure_csrf_cookie
def patient_entry(request):
    return render(request, 'patient/patient_entry.html')


def dashboard(request):
    return render(request, 'dashboard/dashboard.html')


def recommendations(request):
    return render(request, 'dashboard/recommendations.html')
