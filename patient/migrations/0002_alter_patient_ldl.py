from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('patient', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patient',
            name='ldl',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
