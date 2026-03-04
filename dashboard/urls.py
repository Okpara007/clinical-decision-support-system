from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.Dashboard, name='dashboard'),
    path('recommendations/', views.recommendations, name='recommendations'),
    path('api/recommendations/<str:patient_code>/', views.recommendation_api, name='recommendation_api'),
]
