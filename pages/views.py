from django.shortcuts import redirect, render
from django.views.decorators.csrf import ensure_csrf_cookie

from accounts.decorators import hardcoded_login_required

def home(request):
    return redirect('records')


@hardcoded_login_required
def records(request):
    return render(request, 'pages/index.html')


@hardcoded_login_required
@ensure_csrf_cookie
def patient_entry(request):
    return render(request, 'patient/patient_entry.html')


@hardcoded_login_required
def dashboard(request):
    return render(request, 'dashboard/dashboard.html')


@hardcoded_login_required
def recommendations(request):
    return render(request, 'dashboard/recommendations.html')
