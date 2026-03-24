from django.db import models


class RecommendationCache(models.Model):
    patient = models.OneToOneField(
        'patient.Patient',
        on_delete=models.CASCADE,
        related_name='recommendation_cache',
    )
    model = models.CharField(max_length=120)
    summary = models.TextField()
    risk_summary = models.TextField()
    key_factors = models.JSONField(default=list, blank=True)
    safety_flags = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    generated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f'{self.patient.patient_code} - {self.model}'
