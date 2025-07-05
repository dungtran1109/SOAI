from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.asgi import OpenTelemetryMiddleware
from opentelemetry.instrumentation.logging import LoggingInstrumentor

from fastapi import FastAPI
from config.constants import *

def setup_otel(
    app: FastAPI,
    service_name: str = SERVICE_NAME,
    otlp_endpoint: str = OTEL_ENDPOINT,  # Example: "otel-collector:4317"
):
    """
    Initializes OpenTelemetry for FastAPI using gRPC with optional SQLAlchemy and logging instrumentation.
    """
    resource = Resource(attributes={"service.name": service_name})

    trace.set_tracer_provider(TracerProvider(resource=resource))
    tracer_provider = trace.get_tracer_provider()

    # gRPC exporter (default endpoint is 4317)
    tracer_provider.add_span_processor(
        BatchSpanProcessor(
            OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
        )
    )

    FastAPIInstrumentor.instrument_app(app)
    app.add_middleware(OpenTelemetryMiddleware)

    LoggingInstrumentor().instrument(set_logging_format=True)
