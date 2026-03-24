from functools import wraps
from urllib.parse import urlencode

from django.shortcuts import redirect
from django.urls import reverse


SESSION_FLAG = 'accounts_authenticated'
SESSION_EMAIL = 'accounts_email'


def hardcoded_login_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.session.get(SESSION_FLAG):
            return view_func(request, *args, **kwargs)

        query = urlencode({'next': request.get_full_path()})
        return redirect(f"{reverse('accounts:sign_in')}?{query}")

    return _wrapped_view
