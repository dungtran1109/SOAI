-- otel_traces table
DROP TABLE IF EXISTS otel_traces;

CREATE TABLE IF NOT EXISTS otel_traces (
    Timestamp DateTime64(9),
    TraceId String,
    SpanId String,
    TraceState String,
    ParentSpanId String,
    Name String,
    Kind Int32,
    StartTime DateTime64(9),
    EndTime DateTime64(9),
    Duration UInt64 ALIAS toUnixTimestamp64Nanosecond(EndTime) - toUnixTimestamp64Nanosecond(StartTime),
    Attributes Map(String, String),
    DroppedAttributesCount Int32,
    Events Nested (
        Name String,
        Attributes Map(String, String),
        DroppedAttributesCount Int32,
        Timestamp DateTime64(9)
    ),
    DroppedEventsCount Int32,
    StatusCode Int32,
    StatusMessage String,
    ServiceName LowCardinality(String),
    ResourceAttributes Map(String, String),
    ScopeName LowCardinality(String),
    ScopeVersion String
) ENGINE = MergeTree
ORDER BY (ServiceName, StartTime)
TTL StartTime + INTERVAL 7 DAY;

-- otel_logs table
DROP TABLE IF EXISTS otel_logs;

CREATE TABLE IF NOT EXISTS otel_logs (
    Timestamp DateTime64(9),
    TraceId String,
    SpanId String,
    TraceFlags UInt8,
    SeverityText String,
    SeverityNumber Int32,
    Body String,
    Attributes Map(String, String),
    DroppedAttributesCount Int32,
    ResourceAttributes Map(String, String),
    ScopeName LowCardinality(String),
    ScopeVersion String,
    ServiceName LowCardinality(String)
) ENGINE = MergeTree
ORDER BY (ServiceName, Timestamp)
TTL Timestamp + INTERVAL 7 DAY;
