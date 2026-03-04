from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('records/', views.records, name='records'),
    path('patient-entry/', views.patient_entry, name='patient_entry'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('recommendations/', views.recommendations, name='recommendations'),
]
