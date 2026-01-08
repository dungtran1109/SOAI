from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.asgi import OpenTelemetryMiddleware
from config.constants import *
from config.log_config import AppLogger
from fastapi import FastAPI
import socket

logger = AppLogger(__name__)

def is_otel_collector_up(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

def setup_otel(
    app: FastAPI,
    service_name: str = SERVICE_NAME,
    otlp_endpoint: str = OTEL_ENDPOINT,
):
    """
    Initializes OpenTelemetry tracing for FastAPI.
    Falls back to ConsoleSpanExporter if the OTEL Collector is unavailable.
    """
    resource = Resource(attributes={"service.name": service_name})
    tracer_provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(tracer_provider)

    host, port_str = otlp_endpoint.split(":")
    port = int(port_str)

    try:
        if is_otel_collector_up(host, port):
            exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
            logger.info(f"Tracing: connected to OTEL Collector at {otlp_endpoint}")
        else:
            raise ConnectionError(f"OTEL Collector at {otlp_endpoint} is unreachable.")
    except Exception as e:
        exporter = ConsoleSpanExporter()
        logger.warn(f"Tracing: Falling back to ConsoleSpanExporter. Reason: {e}")

    tracer_provider.add_span_processor(BatchSpanProcessor(exporter))

    try:
        FastAPIInstrumentor().instrument_app(app)
        app.add_middleware(OpenTelemetryMiddleware)
    except Exception as e:
        logger.warn(f"Tracing: FastAPI instrumentation or middleware failed: {e}")
