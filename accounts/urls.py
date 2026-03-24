from django.urls import path
from django.views.generic import RedirectView

from . import views

app_name = 'accounts'

urlpatterns = [
    path('', RedirectView.as_view(pattern_name='accounts:sign_in', permanent=False), name='root'),
    path('accounts/sign-in/', views.sign_in, name='sign_in'),
    path('accounts/sign-out/', views.sign_out, name='sign_out'),
]

