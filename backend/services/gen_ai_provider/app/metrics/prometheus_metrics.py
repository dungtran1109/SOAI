from prometheus_client import Counter

GET_MODELS_REQUESTS = Counter("genai_get_models_requests_total", "Total get_available_models calls", ["provider"])
GET_MODELS_ERRORS = Counter("genai_get_models_errors_total", "Total errors in get_available_models", ["provider"])
CHAT_REQUESTS = Counter("genai_chat_requests_total", "Total chat requests", ["provider"])
CHAT_ERRORS = Counter("genai_chat_errors_total", "Total chat request errors", ["provider"])