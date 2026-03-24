import secrets

from django.conf import settings


def validate_hardcoded_credentials(email: str, password: str) -> bool:
    submitted_email = (email or '').strip().lower()
    configured_email = (settings.HARD_CODED_AUTH_EMAIL or '').strip().lower()
    submitted_password = password or ''
    configured_password = settings.HARD_CODED_AUTH_PASSWORD or ''

    return (
        secrets.compare_digest(submitted_email, configured_email)
        and secrets.compare_digest(submitted_password, configured_password)
    )

