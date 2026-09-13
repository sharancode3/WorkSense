"""Structured logging configuration for WorkSense backend."""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict


# Headers and fields that must NEVER be logged
SENSITIVE_PATTERNS = {
    "authorization",
    "cookie",
    "set-cookie",
    "x-supabase-service-role-key",
    "password",
    "token",
    "secret",
    "api_key",
    "service_role_key",
    "bearer",
}


def sanitize_sensitive_data(data: Any) -> Any:
    """Recursively mask sensitive values in dictionaries and lists."""
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if any(pattern in str(k).lower() for pattern in SENSITIVE_PATTERNS):
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = sanitize_sensitive_data(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_sensitive_data(item) for item in data]
    return data


class StructuredJsonFormatter(logging.Formatter):
    """JSON log formatter producing standardized operational log events."""

    def __init__(self, service: str = "worksense-api", environment: str = "development"):
        super().__init__()
        self.service = service
        self.environment = environment

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.service,
            "environment": self.environment,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include request correlation ID if attached to record
        request_id = getattr(record, "request_id", None)
        if request_id:
            log_entry["request_id"] = str(request_id)

        # Include structured HTTP details if present
        http_info = getattr(record, "http_info", None)
        if http_info and isinstance(http_info, dict):
            log_entry["http"] = sanitize_sensitive_data(http_info)

        # Include exception info safely
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logging(log_level: str = "INFO", service: str = "worksense-api", environment: str = "development") -> None:
    """Configure the root logger with structured JSON output."""
    root_logger = logging.getLogger()
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger.setLevel(numeric_level)

    # Clear existing handlers to prevent duplicate lines
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(numeric_level)
    handler.setFormatter(StructuredJsonFormatter(service=service, environment=environment))
    root_logger.addHandler(handler)

    # Silence verbose 3rd party loggers
    for noisy in ("uvicorn.access", "httpcore", "httpx"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
