def compute_risks(patient):
    hba1c = float(patient.hba1c or 7.5)
    sbp = int(patient.systolic_bp or 140)
    age = int(patient.age or 72)
    meds_count = len(patient.medications or [])

    seed = len(patient.full_name or 'x') + age + round(hba1c * 10)

    def rng(minimum, maximum, offset):
        value = ((seed + offset) * 9301 + 49297) % 233280
        return minimum + (value / 233280) * (maximum - minimum)

    scores = {
        'hypoglycemia': min(95, round(20 + (hba1c - 6) * 8 + rng(0, 15, 1))),
        'cardiovascular': min(95, round(15 + (sbp - 120) * 0.4 + (age - 60) * 0.5 + rng(0, 12, 2))),
        'bloodpressure': min(95, round(20 + (sbp - 120) * 0.5 + rng(0, 18, 3))),
        'polypharmacy': min(95, round(10 + meds_count * 6 + rng(0, 14, 4))),
    }
    average = round(sum(scores.values()) / len(scores))
    overall = 'high' if average >= 65 else 'medium' if average >= 40 else 'low'
    return scores, overall


def serialize_patient(patient):
    risks, overall_risk = compute_risks(patient)
    return {
        'id': patient.patient_code,
        'name': patient.full_name,
        'age': patient.age,
        'gender': patient.gender,
        'weight': float(patient.weight) if patient.weight is not None else None,
        'height': float(patient.height) if patient.height is not None else None,
        'hba1c': float(patient.hba1c),
        'sbp': patient.systolic_bp,
        'dbp': patient.diastolic_bp,
        'hr': patient.heart_rate,
        'fasting': patient.fasting_glucose,
        'ldl': patient.ldl,
        'creatinine': float(patient.creatinine) if patient.creatinine is not None else None,
        'smoking': patient.smoking_status,
        'adherence': patient.adherence,
        'mobility': patient.mobility_status,
        'cognitive': patient.cognitive_status,
        'meds': patient.medications or [],
        'falls': patient.fall_history,
        'status': patient.review_status,
        'date': patient.last_assessed.isoformat(),
        'risks': risks,
        'overallRisk': overall_risk,
    }
