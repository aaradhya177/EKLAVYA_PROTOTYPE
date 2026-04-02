from collections.abc import MutableMapping
from time import time

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings


class InMemoryRedis:
    def __init__(self):
        self._store: dict[str, tuple[str, float | None]] = {}

    def _purge(self, key: str) -> None:
        if key in self._store:
            _, expiry = self._store[key]
            if expiry is not None and expiry < time():
                del self._store[key]

    def setex(self, key: str, ttl: int, value: str) -> bool:
        self._store[key] = (value, time() + ttl)
        return True

    def get(self, key: str):
        self._purge(key)
        return self._store.get(key, (None, None))[0]

    def incr(self, key: str) -> int:
        self._purge(key)
        value, expiry = self._store.get(key, ("0", None))
        new_value = str(int(value) + 1)
        self._store[key] = (new_value, expiry)
        return int(new_value)

    def expire(self, key: str, ttl: int) -> bool:
        self._purge(key)
        if key not in self._store:
            return False
        value, _ = self._store[key]
        self._store[key] = (value, time() + ttl)
        return True

    def ttl(self, key: str) -> int:
        self._purge(key)
        if key not in self._store:
            return -2
        _, expiry = self._store[key]
        if expiry is None:
            return -1
        return max(int(expiry - time()), -2)

    def ping(self) -> bool:
        return True

    def flushall(self) -> bool:
        self._store.clear()
        return True


_client = None


def get_redis_client():
    global _client
    if _client is not None:
        return _client
    try:
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        _client = client
    except RedisError:
        _client = InMemoryRedis()
    return _client


def reset_redis_client() -> None:
    global _client
    if isinstance(_client, InMemoryRedis):
        _client.flushall()
    _client = None
