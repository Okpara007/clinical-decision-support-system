from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('accounts.urls')),
    path('', include('pages.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('patient/', include('patient.urls')),
    path('admin/', admin.site.urls),
]
