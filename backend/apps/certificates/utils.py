"""Polished A4-landscape certificate generator (ReportLab)."""
import io
from datetime import datetime

from django.core.files.base import ContentFile
from decouple import config

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

from .models import Certificate

GREEN = colors.HexColor('#16A34A')
GREEN_DARK = colors.HexColor('#15803D')
GREEN_MID = colors.HexColor('#86EFAC')
GREEN_SOFT = colors.HexColor('#DCFCE7')
GREEN_PALE = colors.HexColor('#F0FDF4')
TEXT_DARK = colors.HexColor('#111827')
TEXT_MUTED = colors.HexColor('#6B7280')
TEXT_LIGHT = colors.HexColor('#9CA3AF')
GOLD = colors.HexColor('#D97706')


def _draw_corner(c, x, y, size, color, flip_x=False, flip_y=False):
    """Decorative corner ornament — two arcs + a small dot."""
    c.saveState()
    c.translate(x, y)
    if flip_x:
        c.scale(-1, 1)
    if flip_y:
        c.scale(1, -1)
    c.setStrokeColor(color)
    c.setFillColor(color)
    # outer arc
    c.setLineWidth(1.2)
    c.arc(0, 0, size, size, 0, 90)
    # inner arc
    c.setLineWidth(0.6)
    c.arc(size * 0.25, size * 0.25, size * 0.75, size * 0.75, 0, 90)
    # decorative dot
    c.circle(size * 0.5, size * 0.5, 1.4, fill=1)
    c.restoreState()


def _draw_seal(c, cx, cy, radius=22 * mm):
    """Round embossed-style seal in the bottom-right."""
    c.saveState()
    # outer ring
    c.setStrokeColor(GREEN)
    c.setFillColor(GREEN_SOFT)
    c.setLineWidth(2)
    c.circle(cx, cy, radius, stroke=1, fill=1)
    # inner ring
    c.setLineWidth(0.6)
    c.circle(cx, cy, radius - 4, stroke=1, fill=0)
    # center text
    c.setFillColor(GREEN_DARK)
    c.setFont('Helvetica-Bold', 11)
    c.drawCentredString(cx, cy + 4, 'IONEDU')
    c.setFont('Helvetica', 7)
    c.drawCentredString(cx, cy - 4, 'TASDIQLANDI')
    c.setFillColor(GOLD)
    c.setFont('Helvetica-Bold', 9)
    c.drawCentredString(cx, cy - 11, str(datetime.now().year))
    c.restoreState()


def _draw_wave(c, y, width, color):
    """Subtle bottom decorative wave."""
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(0.4)
    path = c.beginPath()
    path.moveTo(0, y)
    seg = width / 6
    for i in range(6):
        x = i * seg
        path.curveTo(x + seg * 0.3, y + 3 * mm, x + seg * 0.7, y - 3 * mm, x + seg, y)
    c.drawPath(path, stroke=1, fill=0)
    c.restoreState()


def generate_certificate_pdf(certificate: Certificate) -> bytes:
    buf = io.BytesIO()
    width, height = landscape(A4)
    c = canvas.Canvas(buf, pagesize=landscape(A4))

    # ===== Background: soft green tint + paper-like white card =====
    c.setFillColor(GREEN_PALE)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.rect(10 * mm, 10 * mm, width - 20 * mm, height - 20 * mm, fill=1, stroke=0)

    # Double border
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.6)
    c.rect(14 * mm, 14 * mm, width - 28 * mm, height - 28 * mm, stroke=1, fill=0)
    c.setStrokeColor(GREEN_MID)
    c.setLineWidth(0.5)
    c.rect(18 * mm, 18 * mm, width - 36 * mm, height - 36 * mm, stroke=1, fill=0)

    # Corner ornaments
    corner_size = 14 * mm
    _draw_corner(c, 22 * mm, height - 22 * mm - corner_size, corner_size, GREEN)
    _draw_corner(c, width - 22 * mm, height - 22 * mm - corner_size, corner_size, GREEN, flip_x=True)
    _draw_corner(c, 22 * mm, 22 * mm + corner_size, corner_size, GREEN, flip_y=True)
    _draw_corner(c, width - 22 * mm, 22 * mm + corner_size, corner_size, GREEN, flip_x=True, flip_y=True)

    # ===== Header: brand =====
    c.setFillColor(GREEN)
    c.setFont('Helvetica-Bold', 20)
    c.drawCentredString(width / 2, height - 38 * mm, 'IONEDU')

    c.setFillColor(TEXT_LIGHT)
    c.setFont('Helvetica', 9)
    c.drawCentredString(width / 2, height - 45 * mm, "GEOGRAFIYA O'RGANISH PLATFORMASI")

    # Eyebrow with horizontal lines
    eyebrow_y = height - 60 * mm
    c.setStrokeColor(GREEN_MID)
    c.setLineWidth(0.6)
    c.line(width / 2 - 70 * mm, eyebrow_y, width / 2 - 32 * mm, eyebrow_y)
    c.line(width / 2 + 32 * mm, eyebrow_y, width / 2 + 70 * mm, eyebrow_y)
    c.setFillColor(GREEN)
    c.setFont('Helvetica-Bold', 11)
    c.drawCentredString(width / 2, eyebrow_y - 3, 'TUGATISH SERTIFIKATI')

    # ===== Main heading =====
    c.setFillColor(TEXT_DARK)
    c.setFont('Times-Italic', 56)
    c.drawCentredString(width / 2, height - 88 * mm, 'Sertifikat')

    # Decorative divider — small diamond between two lines
    div_y = height - 96 * mm
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.2)
    c.line(width / 2 - 32 * mm, div_y, width / 2 - 6 * mm, div_y)
    c.line(width / 2 + 6 * mm, div_y, width / 2 + 32 * mm, div_y)
    c.setFillColor(GREEN)
    c.saveState()
    c.translate(width / 2, div_y)
    c.rotate(45)
    c.rect(-2.5, -2.5, 5, 5, fill=1, stroke=0)
    c.restoreState()

    # ===== Recipient =====
    c.setFillColor(TEXT_MUTED)
    c.setFont('Helvetica', 11)
    c.drawCentredString(width / 2, height - 112 * mm, 'Mazkur sertifikat quyidagi shaxsga taqdim etiladi')

    c.setFillColor(TEXT_DARK)
    c.setFont('Times-BoldItalic', 36)
    name = (certificate.student.display_name or certificate.student.email or 'Anonim')[:60]
    c.drawCentredString(width / 2, height - 128 * mm, name)

    # Underline under name (decorative)
    text_w = c.stringWidth(name, 'Times-BoldItalic', 36)
    c.setStrokeColor(GREEN_MID)
    c.setLineWidth(0.5)
    c.line(width / 2 - text_w / 2 - 6, height - 132 * mm, width / 2 + text_w / 2 + 6, height - 132 * mm)

    # ===== Course description =====
    course_title = certificate.course.title if certificate.course else ''
    c.setFillColor(TEXT_DARK)
    c.setFont('Helvetica', 13)
    c.drawCentredString(width / 2, height - 146 * mm, f'"{course_title}" kursini muvaffaqiyatli yakunlaganligi uchun.')

    c.setFillColor(TEXT_MUTED)
    c.setFont('Helvetica', 11)
    score_text = f"Yakuniy natija: {int(certificate.score_percent)}% va undan yuqori ko'rsatkich."
    c.drawCentredString(width / 2, height - 154 * mm, score_text)

    # ===== Footer signature blocks =====
    y_sig = 38 * mm
    sig_line_w = 60 * mm

    # Left: teacher
    teacher_name = certificate.course.teacher.display_name if certificate.course and certificate.course.teacher else 'Ionedu'
    left_cx = 70 * mm
    c.setStrokeColor(TEXT_DARK)
    c.setLineWidth(0.6)
    c.line(left_cx - sig_line_w / 2, y_sig + 14, left_cx + sig_line_w / 2, y_sig + 14)
    c.setFillColor(TEXT_DARK)
    c.setFont('Helvetica-Bold', 11)
    c.drawCentredString(left_cx, y_sig + 4, teacher_name)
    c.setFillColor(TEXT_MUTED)
    c.setFont('Helvetica', 9)
    c.drawCentredString(left_cx, y_sig - 5, 'Kurs muallifi')

    # Right: date
    issued = certificate.issued_at or datetime.now()
    date_str = issued.strftime('%d-%m-%Y')
    right_cx = width - 70 * mm
    c.line(right_cx - sig_line_w / 2, y_sig + 14, right_cx + sig_line_w / 2, y_sig + 14)
    c.setFillColor(TEXT_DARK)
    c.setFont('Helvetica-Bold', 11)
    c.drawCentredString(right_cx, y_sig + 4, date_str)
    c.setFillColor(TEXT_MUTED)
    c.setFont('Helvetica', 9)
    c.drawCentredString(right_cx, y_sig - 5, 'Berilgan sana')

    # ===== Centre seal =====
    _draw_seal(c, width / 2, y_sig + 8, radius=18 * mm)

    # Bottom-left QR code — scan to verify the certificate online
    frontend = config('FRONTEND_URL', default='https://ioneda.uz').rstrip('/')
    verify_url = f'{frontend}/verify/{certificate.unique_id}'
    qr_size = 24 * mm
    qr_code = qr.QrCodeWidget(verify_url, barLevel='M')
    b = qr_code.getBounds()
    qw, qh = b[2] - b[0], b[3] - b[1]
    d = Drawing(qr_size, qr_size, transform=[qr_size / qw, 0, 0, qr_size / qh, 0, 0])
    d.add(qr_code)
    renderPDF.draw(d, c, 24 * mm, 24 * mm)
    c.setFillColor(TEXT_LIGHT)
    c.setFont('Helvetica', 6.5)
    c.drawCentredString(24 * mm + qr_size / 2, 21 * mm, 'Skanerlab tekshiring')

    # Bottom wave + verify ID
    _draw_wave(c, 24 * mm, width, GREEN_MID)

    c.setFillColor(TEXT_LIGHT)
    c.setFont('Helvetica', 8)
    c.drawCentredString(width / 2, 16 * mm,
                        f'ID: {certificate.short_id}   •   Tekshirish: {frontend.replace("https://", "").replace("http://", "")}/verify/{certificate.unique_id}')

    c.showPage()
    c.save()
    return buf.getvalue()


def issue_certificate(student, course, score_percent: float = 100.0):
    """Idempotent: returns (certificate, created)."""
    cert, created = Certificate.objects.get_or_create(
        student=student, course=course,
        defaults={'score_percent': score_percent},
    )
    if created or not cert.pdf_file:
        pdf = generate_certificate_pdf(cert)
        filename = f'cert-{cert.unique_id}.pdf'
        cert.pdf_file.save(filename, ContentFile(pdf), save=True)
    return cert, created
