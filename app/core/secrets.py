from __future__ import annotations

import json
import time
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class _CachedSecret:
    value: str
    expires_at: float


class SecretManager:
    def __init__(self, ttl_seconds: int = 300):
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, _CachedSecret] = {}

    def _from_settings(self, key: str) -> str:
        if not hasattr(settings, key):
            raise KeyError(f"Unknown secret key: {key}")
        value = getattr(settings, key)
        return "" if value is None else str(value)

    def _from_aws(self, key: str) -> str:
        import boto3

        client = boto3.client("secretsmanager", region_name=settings.aws_region)
        payload = client.get_secret_value(SecretId=key)
        secret_string = payload.get("SecretString", "")
        if not secret_string:
            return ""
        try:
            parsed = json.loads(secret_string)
            if isinstance(parsed, dict):
                return str(parsed.get(key, next(iter(parsed.values()), "")))
        except json.JSONDecodeError:
            pass
        return str(secret_string)

    def get(self, key: str) -> str:
        now = time.time()
        cached = self._cache.get(key)
        if cached and cached.expires_at > now:
            return cached.value

        if settings.app_env == "development":
            value = self._from_settings(key)
        else:
            try:
                value = self._from_aws(key)
            except Exception:
                value = self._from_settings(key)

        self._cache[key] = _CachedSecret(value=value, expires_at=now + self.ttl_seconds)
        return value


secret_manager = SecretManager()
