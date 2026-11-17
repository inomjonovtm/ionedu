from django.db import migrations


def forwards(apps, schema_editor):
    """Accounts created before email verification existed stay usable."""
    User = apps.get_model('accounts', 'CustomUser')
    User.objects.filter(is_verified=False).update(is_verified=True)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_emailverification'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
