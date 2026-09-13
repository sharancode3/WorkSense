"""Request correlation ID and HTTP access logging middleware."""

import contextvars
import logging
import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Context variable for correlation ID across async execution
correlation_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id", default="")

logger = logging.getLogger("worksense.access")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Extracts or generates an X-Correlation-ID / X-Request-ID header."""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        # Check incoming headers for existing correlation/request ID
        incoming_id = request.headers.get("X-Correlation-ID") or request.headers.get("X-Request-ID")

        if incoming_id and len(incoming_id) <= 128 and incoming_id.replace("-", "").isalnum():
            request_id = incoming_id
        else:
            request_id = str(uuid.uuid4())

        # Store in request state and contextvar
        request.state.request_id = request_id
        token = correlation_id_ctx.set(request_id)

        start_time = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled error in {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "http_info": {
                        "method": request.method,
                        "path": request.url.path,
                        "duration_ms": duration_ms,
                        "status_code": 500,
                    },
                },
                exc_info=True,
            )
            correlation_id_ctx.reset(token)
            raise

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Inject correlation ID into response headers
        response.headers["X-Correlation-ID"] = request_id
        response.headers["X-Request-ID"] = request_id

        # Log completion
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
            extra={
                "request_id": request_id,
                "http_info": {
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            },
        )

        correlation_id_ctx.reset(token)
        return response
