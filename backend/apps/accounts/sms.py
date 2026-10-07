"""SMS sending — Eskiz.uz integration with a console fallback for dev.

Set in .env to enable real SMS:
    ESKIZ_EMAIL=you@example.com
    ESKIZ_PASSWORD=secret
    SMS_SENDER=4546        (optional, default '4546')
"""
import logging

from decouple import config

logger = logging.getLogger(__name__)

ESKIZ_BASE = 'https://notify.eskiz.uz/api'

_token_cache = {'token': None}


def _eskiz_token():
    import requests
    if _token_cache['token']:
        return _token_cache['token']
    resp = requests.post(f'{ESKIZ_BASE}/auth/login', data={
        'email': config('ESKIZ_EMAIL'),
        'password': config('ESKIZ_PASSWORD'),
    }, timeout=15)
    resp.raise_for_status()
    _token_cache['token'] = resp.json()['data']['token']
    return _token_cache['token']


def send_sms(phone: str, message: str) -> bool:
    """Send an SMS. Returns True on success. Falls back to console logging
    when no provider is configured (dev mode)."""
    email = config('ESKIZ_EMAIL', default='')
    password = config('ESKIZ_PASSWORD', default='')
    if not email or not password:
        logger.warning('[SMS dev-mode] to=%s message=%r', phone, message)
        print(f'[SMS dev-mode] to={phone}: {message}')
        return True

    import requests
    try:
        token = _eskiz_token()
        resp = requests.post(f'{ESKIZ_BASE}/message/sms/send', data={
            'mobile_phone': phone.lstrip('+'),
            'message': message,
            'from': config('SMS_SENDER', default='4546'),
        }, headers={'Authorization': f'Bearer {token}'}, timeout=15)
        if resp.status_code == 401:
            _token_cache['token'] = None  # token expired — retry once
            token = _eskiz_token()
            resp = requests.post(f'{ESKIZ_BASE}/message/sms/send', data={
                'mobile_phone': phone.lstrip('+'),
                'message': message,
                'from': config('SMS_SENDER', default='4546'),
            }, headers={'Authorization': f'Bearer {token}'}, timeout=15)
        resp.raise_for_status()
        return True
    except Exception:
        logger.exception('SMS sending failed for %s', phone)
        return False
