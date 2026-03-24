from django.contrib import admin

from .models import RecommendationCache


@admin.register(RecommendationCache)
class RecommendationCacheAdmin(admin.ModelAdmin):
    list_display = ('patient', 'model', 'generated_at', 'created_at')
    search_fields = ('patient__patient_code', 'patient__full_name', 'model')
    readonly_fields = ('generated_at', 'created_at')
