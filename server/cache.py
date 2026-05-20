import os
import json
from upstash_redis import Redis

redis = Redis(
    url=os.environ["UPSTASH_REDIS_REST_URL"],
    token=os.environ["UPSTASH_REDIS_REST_TOKEN"],
)

LEADERBOARD_TTL = 30   # seconds
EVENTS_TTL      = 300  # 5 minutes
ANNOUNCEMENTS_TTL = 600 # 10 minutes
BOUNTIES_TTL = 3600  # 1 hr

def cache_get(key: str):
    val = redis.get(key)
    if val is None:
        return None
    return json.loads(val)

def cache_set(key: str, data, ttl: int):
    redis.set(key, json.dumps(data), ex=ttl)

def cache_invalidate_leaderboard():
    redis.delete("leaderboard:individual")

def cache_invalidate_announcements():
    redis.delete("announcements")