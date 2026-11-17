from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from apps.certificates.models import Certificate
from apps.certificates.utils import generate_certificate_pdf


class Command(BaseCommand):
    help = 'Re-render every stored certificate PDF with the current design.'

    def handle(self, *args, **options):
        done = 0
        for cert in Certificate.objects.select_related('student', 'course__teacher'):
            pdf = generate_certificate_pdf(cert)
            if cert.pdf_file:
                cert.pdf_file.delete(save=False)
            cert.pdf_file.save(f'certificate-{cert.unique_id}.pdf', ContentFile(pdf), save=True)
            done += 1
        self.stdout.write(self.style.SUCCESS(f'{done} ta sertifikat qayta yaratildi'))
