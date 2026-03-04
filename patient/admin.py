from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        'patient_code',
        'full_name',
        'age',
        'gender',
        'hba1c',
        'systolic_bp',
        'review_status',
        'last_assessed',
    )
    list_filter = ('review_status', 'gender', 'smoking_status', 'last_assessed')
    search_fields = ('patient_code', 'full_name')
    ordering = ('-last_assessed', 'full_name')
