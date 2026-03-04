from django.urls import path
from . import views 

urlpatterns = [
    path('patient-entry/', views.patient_entry, name='patient_entry'),
    path('api/records/', views.records_api, name='patient_records_api'),
]
