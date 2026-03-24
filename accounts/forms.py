from django import forms


class SignInForm(forms.Form):
    email = forms.EmailField(max_length=254)
    password = forms.CharField(widget=forms.PasswordInput, strip=False)

