from django.urls import reverse


def navbar(request):
    url_name = getattr(getattr(request, 'resolver_match', None), 'url_name', None)

    configs = {
        'home': {
            'breadcrumbs': [
                {'label': 'Home'},
                {'label': 'Patient Records'},
            ],
            'status': 'System Online',
            'action': {
                'label': '+ New Patient',
                'url': reverse('patient_entry'),
            },
        },
        'records': {
            'breadcrumbs': [
                {'label': 'Home', 'url': reverse('home')},
                {'label': 'Patient Records'},
            ],
            'status': 'System Online',
            'action': {
                'label': '+ New Patient',
                'url': reverse('patient_entry'),
            },
        },
        'patient_entry': {
            'breadcrumbs': [
                {'label': 'Home', 'url': reverse('home')},
                {'label': 'Records', 'url': reverse('records')},
                {'label': 'Patient Entry'},
            ],
            'status': 'Session Active',
            'action': None,
        },
        'dashboard': {
            'breadcrumbs': [
                {'label': 'Records', 'url': reverse('records')},
                {'label': 'Patient Entry', 'url': reverse('patient_entry')},
                {'label': 'Risk Dashboard'},
            ],
            'status': 'Model Active',
            'action': None,
        },
        'recommendations': {
            'breadcrumbs': [
                {'label': 'Records', 'url': reverse('records')},
                {'label': 'Risk Dashboard', 'url': reverse('dashboard')},
                {'label': 'Recommendations'},
            ],
            'status': 'LLM Active',
            'action': None,
        },
    }

    default = {
        'breadcrumbs': [{'label': 'Home', 'url': reverse('home')}],
        'status': 'System Online',
        'action': None,
    }

    return {'navbar': configs.get(url_name, default)}
