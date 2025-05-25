from config.log_config import AppLogger
import requests
from config.constants import *

logger = AppLogger(__name__)

class ServiceRegistration:
    CONSUL_URL = f"http://{CONSUL_HOST}:8500/v1/agent/service/register"

    @staticmethod
    def register_service():
        service_definition = {
            "ID": SERVICE_NAME,
            "Name": SERVICE_NAME,
            "Address": "genai",
            "Port": SERVICE_PORT,
            "Check": {
                "HTTP": f"http://{SERVICE_HOST}:{SERVICE_PORT}/api/v1/gen-ai/health",
                "Interval": "10s",
            },
        }

        try:
            response = requests.put(
                ServiceRegistration.CONSUL_URL, json=service_definition
            )
            if response.status_code == 200:
                logger.info(f"Service {SERVICE_NAME} registered successfully.")
                return True
            else:
                logger.info(f"Failed to register service. Response: {response.text}")
        except Exception as e:
            logger.info(f"Error registering service with Consul: {e}")

        return False
