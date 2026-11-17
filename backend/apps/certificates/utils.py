"""Polished A4-landscape certificate generator (ReportLab) — "Atlas" identity."""
import io
import math
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

# "Atlas" palette — identical to frontend/src/components/CertificateView.jsx
PAPER = colors.HexColor('#FBF6EA')
CARD = colors.HexColor('#FFFDF8')
INK = colors.HexColor('#14213D')
MUTED = colors.HexColor('#5B6478')
SUN = colors.HexColor('#FFC83D')
CORAL = colors.HexColor('#FF6A4D')
FOLD = colors.HexColor('#D9CFB8')
TOPO = colors.HexColor('#E8E7E5')  # INK at ~10% over the card colour

# Card geometry (the navy-framed "sticker")
CARD_INSET = 12 * mm
CARD_RADIUS = 6 * mm
CARD_SHADOW = 2.2 * mm

# Standard PDF fonts are WinAnsi-only: map the Uzbek modifier apostrophes
# (U+02BB / U+02BC) to their typographic-quote lookalikes so they render.
_PDF_SAFE = str.maketrans({'ʻ': '‘', 'ʼ': '’'})


def _t(text) -> str:
    return str(text or '').translate(_PDF_SAFE)


def _fit(c, text, font, size, max_w, min_size=8):
    """Largest font size <= size at which text fits into max_w."""
    while size > min_size and c.stringWidth(text, font, size) > max_w:
        size -= 0.5
    return size


def _spaced(c, x, y, text, font, size, space=1.2, align='center'):
    """Letter-spaced string (mono-label look). align: left | center | right."""
    w = c.stringWidth(text, font, size) + space * max(len(text) - 1, 0)
    if align == 'center':
        x -= w / 2
    elif align == 'right':
        x -= w
    t = c.beginText(x, y)
    t.setFont(font, size)
    t.setCharSpace(space)
    t.textOut(text)
    t.setCharSpace(0)  # Tc persists across text objects — reset it
    c.drawText(t)


def _blob_points(cx, cy, r, phase, n=12):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        rad = r * (1 + 0.09 * math.sin(3 * t + phase) + 0.05 * math.cos(2 * t - phase))
        pts.append((cx + rad * math.cos(t), cy + rad * math.sin(t)))
    return pts


def _draw_contours(c, x, y, w, h):
    """Topographic contour lines (closed bezier blobs) in two corners of the card.

    Same formula and coordinates as blobPath() in CertificateView.jsx; the
    blob space is 273 x 186 with the y axis pointing down from the card top.
    """
    c.saveState()
    clip = c.beginPath()
    clip.roundRect(x, y, w, h, CARD_RADIUS)
    c.clipPath(clip, stroke=0, fill=0)
    c.setStrokeColor(TOPO)
    c.setLineWidth(0.35 * mm)
    sx, sy = w / 273.0, h / 186.0
    for gx, gy, rings in ((252, 8, 8), (18, 180, 7)):
        for k in range(rings):
            pts = _blob_points(gx, gy, 14 + 11 * k, k * 0.35)
            pts = [(x + px * sx, y + h - py * sy) for px, py in pts]
            n = len(pts)
            path = c.beginPath()
            path.moveTo(*pts[0])
            for i in range(n):
                p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
                path.curveTo(
                    p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
                    p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
                    p2[0], p2[1],
                )
            path.close()
            c.drawPath(path, stroke=1, fill=0)
    c.restoreState()


def _draw_logo_mark(c, x, y, size):
    """Brand mark: compass on a sun-yellow rounded square (Logo.jsx, 48-unit grid)."""
    u = size / 48.0
    c.saveState()
    c.translate(x, y + size)
    c.scale(u, -u)  # SVG coordinates: y down
    c.setLineJoin(1)
    c.setStrokeColor(INK)
    c.setFillColor(SUN)
    c.setLineWidth(3)
    c.roundRect(2, 2, 44, 44, 14, stroke=1, fill=1)
    c.setFillColor(colors.white)
    c.setLineWidth(2.6)
    c.circle(24, 24, 12, stroke=1, fill=1)
    c.setFillColor(CORAL)
    c.setLineWidth(2)
    needle = c.beginPath()
    needle.moveTo(29.5, 18.5)
    needle.lineTo(26, 26)
    needle.lineTo(18.5, 29.5)
    needle.lineTo(22, 22)
    needle.close()
    c.drawPath(needle, stroke=1, fill=1)
    c.restoreState()


def _draw_seal(c, cx, cy, radius=22 * mm, year=None):
    """Compass-stamp seal: sun-yellow sticker with a hard navy shadow."""
    year = year or datetime.now().year
    off = radius * 0.085
    c.saveState()
    # hard offset shadow
    c.setFillColor(INK)
    c.circle(cx + off, cy - off, radius, stroke=0, fill=1)
    # stamp body
    c.setStrokeColor(INK)
    c.setFillColor(SUN)
    c.setLineWidth(2.4)
    c.circle(cx, cy, radius, stroke=1, fill=1)
    # dashed inner ring
    c.setLineWidth(0.9)
    c.setDash(3, 2.4)
    c.circle(cx, cy, radius - 1.8 * mm, stroke=1, fill=0)
    c.setDash()
    # slightly rotated content, like a hand-pressed stamp
    c.translate(cx, cy)
    c.rotate(8)
    k = radius / (16 * mm)
    # four-point compass star
    s, q = 2.9 * mm * k, 0.75 * mm * k
    sy = 7.6 * mm * k
    star = c.beginPath()
    star.moveTo(0, sy + s)
    for px, py in ((q, sy + q), (s, sy), (q, sy - q), (0, sy - s), (-q, sy - q), (-s, sy), (-q, sy + q)):
        star.lineTo(px, py)
    star.close()
    c.setFillColor(CORAL)
    c.setLineWidth(1)
    c.setLineJoin(1)
    c.drawPath(star, stroke=1, fill=1)
    # text
    c.setFillColor(INK)
    c.setFont('Helvetica-Bold', 14 * k)
    c.drawCentredString(0, -0.4 * mm * k, 'ionedu')
    _spaced(c, 0, -4.2 * mm * k, 'TASDIQLANDI', 'Courier-Bold', 5.8 * k, space=0.8 * k)
    c.setFont('Courier-Bold', 9 * k)
    c.drawCentredString(0, -8.4 * mm * k, str(year))
    c.restoreState()


def generate_certificate_pdf(certificate: Certificate) -> bytes:
    buf = io.BytesIO()
    width, height = landscape(A4)
    c = canvas.Canvas(buf, pagesize=landscape(A4))
    c.setTitle('ionedu sertifikat')
    cx = width / 2

    # ===== Background: map-paper sand + navy-framed sticker card =====
    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    card_x = card_y = CARD_INSET
    card_w, card_h = width - 2 * CARD_INSET, height - 2 * CARD_INSET
    c.setFillColor(INK)
    c.roundRect(card_x + CARD_SHADOW, card_y - CARD_SHADOW, card_w, card_h, CARD_RADIUS, stroke=0, fill=1)
    c.setFillColor(CARD)
    c.roundRect(card_x, card_y, card_w, card_h, CARD_RADIUS, stroke=0, fill=1)
    _draw_contours(c, card_x, card_y, card_w, card_h)
    c.setStrokeColor(INK)
    c.setLineWidth(2.5)
    c.roundRect(card_x, card_y, card_w, card_h, CARD_RADIUS, stroke=1, fill=0)

    left = card_x + 11 * mm
    right = card_x + card_w - 11 * mm

    # ===== Header: brand mark + wordmark (left), coordinates (right) =====
    mark = 11 * mm
    mark_y = height - 31 * mm
    _draw_logo_mark(c, left, mark_y, mark)
    c.setFillColor(INK)
    c.setFont('Helvetica-Bold', 19)
    c.drawString(left + mark + 3 * mm, mark_y + 5 * mm, 'ionedu')
    c.setFillColor(MUTED)
    _spaced(c, left + mark + 3 * mm, mark_y + 1.2 * mm, "GEOGRAFIYA O'RGANISH PLATFORMASI",
            'Courier-Bold', 5.6, space=0.6, align='left')

    coord = '41.31°N · 69.24°E'
    coord_y = mark_y + 4.3 * mm
    c.setFillColor(INK)
    _spaced(c, right, coord_y, coord, 'Courier-Bold', 8.5, space=0.4, align='right')
    coord_w = c.stringWidth(coord, 'Courier-Bold', 8.5) + 0.4 * (len(coord) - 1)
    c.setFillColor(CORAL)
    c.setStrokeColor(INK)
    c.setLineWidth(1.2)
    c.circle(right - coord_w - 3.4 * mm, coord_y + 1.1 * mm, 1.3 * mm, stroke=1, fill=1)

    # ===== Eyebrow pill =====
    pill_w, pill_h = 62 * mm, 7.6 * mm
    pill_y = height - 49 * mm
    c.setFillColor(SUN)
    c.setStrokeColor(INK)
    c.setLineWidth(1.4)
    c.roundRect(cx - pill_w / 2, pill_y, pill_w, pill_h, pill_h / 2, stroke=1, fill=1)
    c.setFillColor(INK)
    _spaced(c, cx, pill_y + 2.6 * mm, 'TUGATISH SERTIFIKATI', 'Courier-Bold', 9, space=1.4)

    # ===== Main heading =====
    c.setFillColor(INK)
    c.setFont('Helvetica-Bold', 50)
    c.drawCentredString(cx, height - 70 * mm, 'Sertifikat')

    # ===== Recipient =====
    c.setFillColor(MUTED)
    c.setFont('Helvetica', 11)
    c.drawCentredString(cx, height - 81 * mm, 'Mazkur sertifikat quyidagi shaxsga taqdim etiladi')

    name = _t(certificate.student.display_name or certificate.student.email or 'Anonim')[:60]
    name_size = _fit(c, name, 'Times-BoldItalic', 38, 215 * mm, min_size=16)
    name_y = height - 98 * mm
    text_w = c.stringWidth(name, 'Times-BoldItalic', name_size)
    # sun-yellow marker stripe behind the lower part of the name
    c.setFillColor(SUN)
    c.rect(cx - text_w / 2 - 4 * mm, name_y - 2.2 * mm, text_w + 8 * mm, 5.2 * mm, stroke=0, fill=1)
    c.setFillColor(INK)
    c.setFont('Times-BoldItalic', name_size)
    c.drawCentredString(cx, name_y, name)

    # ===== Course description (title in bold) =====
    course_title = _t(certificate.course.title if certificate.course else '')
    part_a = f'“{course_title}”'
    part_b = ' kursini muvaffaqiyatli yakunlaganligi uchun.'
    size = 13.0
    max_w = 225 * mm
    while size > 8 and (c.stringWidth(part_a, 'Helvetica-Bold', size)
                        + c.stringWidth(part_b, 'Helvetica', size)) > max_w:
        size -= 0.5
    wa = c.stringWidth(part_a, 'Helvetica-Bold', size)
    wb = c.stringWidth(part_b, 'Helvetica', size)
    x0 = cx - (wa + wb) / 2
    course_y = height - 112 * mm
    c.setFillColor(INK)
    c.setFont('Helvetica-Bold', size)
    c.drawString(x0, course_y, part_a)
    c.setFont('Helvetica', size)
    c.drawString(x0 + wa, course_y, part_b)

    c.setFillColor(MUTED)
    c.setFont('Helvetica', 11)
    score_text = f"Yakuniy natija: {int(certificate.score_percent)}% va undan yuqori ko'rsatkich."
    c.drawCentredString(cx, height - 120 * mm, score_text)

    # ===== Footer signature blocks =====
    y_sig = 56 * mm
    sig_line_w = 62 * mm

    def _sig(center_x, value, role):
        c.setStrokeColor(INK)
        c.setLineWidth(1.4)
        c.line(center_x - sig_line_w / 2, y_sig + 15, center_x + sig_line_w / 2, y_sig + 15)
        c.setFillColor(INK)
        c.setFont('Helvetica-Bold', _fit(c, value, 'Helvetica-Bold', 12, sig_line_w))
        c.drawCentredString(center_x, y_sig + 3, value)
        c.setFillColor(MUTED)
        _spaced(c, center_x, y_sig - 7, role, 'Courier-Bold', 6.8, space=0.9)

    # Left: teacher
    teacher_name = _t(certificate.course.teacher.display_name
                      if certificate.course and certificate.course.teacher else 'Ionedu')
    _sig(72 * mm, teacher_name, 'KURS MUALLIFI')

    # Right: date
    issued = certificate.issued_at or datetime.now()
    _sig(width - 72 * mm, issued.strftime('%d-%m-%Y'), 'BERILGAN SANA')

    # ===== Centre seal =====
    _draw_seal(c, cx, y_sig + 5 * mm, radius=16 * mm, year=issued.year)

    # ===== Map fold line =====
    c.setStrokeColor(FOLD)
    c.setLineWidth(1.2)
    c.setDash(4, 3)
    c.line(left, 41 * mm, right, 41 * mm)
    c.setDash()

    # ===== Bottom-left QR code — scan to verify the certificate online =====
    frontend = config('FRONTEND_URL', default='https://ioneda.uz').rstrip('/')
    verify_url = f'{frontend}/verify/{certificate.unique_id}'
    qr_size = 18 * mm
    box = qr_size + 2.4 * mm
    box_y = 16.5 * mm
    c.setFillColor(colors.white)
    c.setStrokeColor(INK)
    c.setLineWidth(1.4)
    c.roundRect(left, box_y, box, box, 2 * mm, stroke=1, fill=1)
    qr_code = qr.QrCodeWidget(verify_url, barLevel='M', barFillColor=INK)
    b = qr_code.getBounds()
    qw, qh = b[2] - b[0], b[3] - b[1]
    d = Drawing(qr_size, qr_size, transform=[qr_size / qw, 0, 0, qr_size / qh, 0, 0])
    d.add(qr_code)
    renderPDF.draw(d, c, left + 1.2 * mm, box_y + 1.2 * mm)
    c.setFillColor(MUTED)
    cap_x = left + box + 3.5 * mm
    _spaced(c, cap_x, box_y + box / 2 + 0.8 * mm, 'SKANERLAB', 'Courier-Bold', 6.5, space=0.6, align='left')
    _spaced(c, cap_x, box_y + box / 2 - 2.6 * mm, 'TEKSHIRING', 'Courier-Bold', 6.5, space=0.6, align='left')

    # ===== Bottom-right: certificate ID + verify link =====
    host = frontend.replace('https://', '').replace('http://', '')
    c.setFillColor(INK)
    c.setFont('Courier-Bold', 8)
    c.drawRightString(right, 28.5 * mm, f'ID: {certificate.short_id}')
    c.setFillColor(MUTED)
    c.setFont('Courier', 7.2)
    c.drawRightString(right, 24 * mm, f'Tekshirish: {host}/verify/{certificate.unique_id}')

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
