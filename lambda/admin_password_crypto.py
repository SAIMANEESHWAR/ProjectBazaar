"""Store a recoverable copy of login passwords for admin support (admin API only)."""
import base64
import hashlib
import os


def _key_bytes():
    key = os.environ.get("ADMIN_PASSWORD_VIEW_KEY", "projectbazaar-admin-view-key")
    return hashlib.sha256(key.encode("utf-8")).digest()


def encrypt_password_for_admin(plain: str) -> str:
    if not plain:
        return ""
    key = _key_bytes()
    data = plain.encode("utf-8")
    enc = bytes(data[i] ^ key[i % len(key)] for i in range(len(data)))
    return base64.urlsafe_b64encode(enc).decode("ascii")


def decrypt_password_for_admin(enc: str) -> str:
    if not enc:
        return ""
    try:
        key = _key_bytes()
        data = base64.urlsafe_b64decode(enc.encode("ascii"))
        plain = bytes(data[i] ^ key[i % len(key)] for i in range(len(data)))
        return plain.decode("utf-8")
    except Exception:
        return ""
