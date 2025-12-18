import redis
import logging
from config.constants import (
    REDIS_HOST,
    REDIS_PORT,
)

logger = logging.getLogger(__file__)


class RedisClient:
    def __init__(self):
        self.conn = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=0)

    def set_expired(self, key, data, expired_seconds):
        self.conn.set(key, data, ex=expired_seconds)

    def key_expired(self, key, expired_seconds):
        self.conn.expire(key, expired_seconds)

    def exist(self, key):
        return self.conn.exists(key)

    def json_get(self, key, path=None):
        if path is not None:
            return self.conn.json().get(key, path)
        return self.conn.json().get(key)

    def json_set(self, key, data, path="$"):
        self.conn.json().set(key, path, data)

    def json_delete(self, key, path="$"):
        self.conn.json().delete(key=key, path=path)

    def json_clear(self, key, path):
        self.conn.json().clear(key, path)

    def json_arrappend(self, key, data, path):
        self.conn.json().arrappend(key, path, data)

    def get(self, key):
        return self.conn.get(key)

    def set(self, key, data):
        self.conn.set(key, data)

    def delete(self, key):
        self.conn.delete(key)

    def keys(self, prefix_key, pattern="*"):
        keys = []
        pattern_key = prefix_key + pattern
        logger.info(pattern_key)
        keys = self.conn.keys(pattern=pattern_key)

        return keys

    def __del__(self):
        if self.conn:
            self.conn.close()

    def json_get_and_delete(self, redis_key):
        data = None
        try:
            data = self.json_get(redis_key)
            self.delete(redis_key)
        except Exception as e:
            logger.exception(e)
        return data
