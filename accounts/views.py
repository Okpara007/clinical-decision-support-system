from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from .decorators import SESSION_EMAIL, SESSION_FLAG
from .forms import SignInForm
from .services import validate_hardcoded_credentials


def _post_login_redirect_url() -> str:
    return reverse('records')


@require_http_methods(['GET', 'POST'])
def sign_in(request: HttpRequest) -> HttpResponse:
    if request.session.get(SESSION_FLAG):
        return redirect(_post_login_redirect_url())

    form = SignInForm(request.POST or None)
    next_url = (request.POST.get('next') or request.GET.get('next') or '').strip()

    if request.method == 'POST' and form.is_valid():
        email = form.cleaned_data['email']
        password = form.cleaned_data['password']
        if validate_hardcoded_credentials(email, password):
            request.session[SESSION_FLAG] = True
            request.session[SESSION_EMAIL] = email
            return redirect(_post_login_redirect_url())
        form.add_error(None, 'Invalid email or password.')

    context = {
        'form': form,
        'next': next_url,
    }
    return render(request, 'accounts/sign_in.html', context)


@require_http_methods(['POST'])
def sign_out(request: HttpRequest) -> HttpResponse:
    request.session.pop(SESSION_FLAG, None)
    request.session.pop(SESSION_EMAIL, None)
    return redirect('accounts:sign_in')
