from django.urls import path
from . import views 

urlpatterns = [
    path('patient-entry/', views.patient_entry, name='patient_entry'),
    path('api/records/', views.records_api, name='patient_records_api'),
    path('api/records/latest/', views.latest_record_api, name='patient_latest_record_api'),
    path('api/records/<str:patient_code>/', views.record_detail_api, name='patient_record_detail_api'),
]
