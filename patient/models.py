from django.db import models


class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'

    class ReviewStatus(models.TextChoices):
        URGENT = 'Urgent', 'Urgent'
        PENDING = 'Pending', 'Pending'
        REVIEWED = 'Reviewed', 'Reviewed'

    patient_code = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=255)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=1, choices=Gender.choices)

    weight = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    hba1c = models.DecimalField(max_digits=4, decimal_places=1)
    systolic_bp = models.PositiveIntegerField()
    diastolic_bp = models.PositiveIntegerField()
    heart_rate = models.PositiveIntegerField()
    fasting_glucose = models.PositiveIntegerField()
    ldl = models.PositiveIntegerField(null=True, blank=True)
    creatinine = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

    smoking_status = models.CharField(max_length=50, blank=True)
    adherence = models.CharField(max_length=50, blank=True)
    mobility_status = models.CharField(max_length=50, blank=True)
    cognitive_status = models.CharField(max_length=50, blank=True)
    fall_history = models.CharField(max_length=50, blank=True)
    medications = models.JSONField(default=list, blank=True)
    review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
    )
    last_assessed = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_assessed', 'full_name']

    def __str__(self):
        return f'{self.full_name} ({self.patient_code})'
