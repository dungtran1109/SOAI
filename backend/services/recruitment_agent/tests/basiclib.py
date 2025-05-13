import httpx
import logging
from constants import AUTH_URL, TIMEOUT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestRecruitmentAPI")

def log_info(message):
    logger.info(message)

def log_debug(message):
    logger.debug(message)

def log_error(message):
    logger.error(message)

def extract_token(username, password, role=None):
    payload = {"userName": username, "password": password}
    url = f"{AUTH_URL}/signup" if role else f"{AUTH_URL}/signin"
    if role:
        payload["role"] = role

    response = httpx.post(url, json=payload, timeout=TIMEOUT)
    if response.status_code == 403 and role:
        url = f"{AUTH_URL}/signin"
        payload.pop("role", None)
        response = httpx.post(url, json=payload, timeout=TIMEOUT)

    response.raise_for_status()
    token = response.json().get("token")
    log_info(f"Token acquired for {username}: {token}")
    return token

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def api_request(method, url, **kwargs):
    try:
        response = httpx.request(method, url, timeout=TIMEOUT, **kwargs)
        log_debug(f"{method.upper()} {url} -> {response.status_code}")
        return response
    except Exception as e:
        log_error(f"HTTPX request error: {method} {url} -> {e}")
        raise
