"""Central application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """WorkSense application settings and environment variable validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Core Application
    app_name: str = Field(default="WorkSense API", description="Name of the application")
    app_env: str = Field(default="development", description="Environment: development, test, demo, production")
    app_version: str = Field(default="1.0.0", description="Semantic version of the application")
    port: int = Field(default=8000, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
    log_level: str = Field(default="INFO", description="Logging level")

    # CORS Allowlist
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
        description="Allowed CORS origins",
    )

    # Supabase (Server-only credentials, optional in Stage 1)
    supabase_url: Optional[str] = Field(default=None, description="Supabase project URL")
    supabase_anon_key: Optional[str] = Field(default=None, description="Supabase client anon key")
    supabase_service_role_key: Optional[str] = Field(default=None, description="Supabase server-only service role key")
    supabase_jwt_secret: Optional[str] = Field(default=None, description="Supabase JWT secret for validating access tokens")

    # Local / Hybrid JWT Auth Settings
    jwt_secret: str = Field(
        default="worksense-stage2-secure-local-jwt-secret-key-for-auth-token-validation-32chars",
        description="JWT secret key for token signature and verification",
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_expiry_minutes: int = Field(default=120, description="JWT token expiry in minutes")

    # Local AI Gateway / Qwen (Stage 4 Verified)
    qwen_gateway_url: Optional[str] = Field(default="http://localhost:8001", description="Local AI Gateway endpoint")
    qwen_gateway_auth_key: Optional[str] = Field(default=None, description="HMAC or Bearer token for AI gateway")
    ollama_url: str = Field(default="http://localhost:11434", description="Local Ollama daemon API base URL")
    qwen_model: str = Field(default="qwen3:4b-instruct-2507-q4_K_M", description="Locked local Qwen model identifier")
    ollama_timeout_seconds: float = Field(default=35.0, description="Ollama inference request timeout in seconds")
    resume_storage_dir: str = Field(default="storage/resumes", description="Local filesystem path for resume storage")

    # EnterPro Orchestrator (Optional in Stage 1)
    enterpro_api_url: Optional[str] = Field(default=None, description="EnterPro REST API URL")
    enterpro_webhook_secret: Optional[str] = Field(default=None, description="Webhook signature secret")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: object) -> List[str]:
        """Convert comma-separated string or list to list of clean origins."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("app_env")
    @classmethod
    def validate_app_env(cls, v: str) -> str:
        """Validate allowed runtime environments."""
        valid_envs = {"development", "test", "demo", "production"}
        lowered = v.lower()
        if lowered not in valid_envs:
            return "development"
        return lowered


@lru_cache()
def get_settings() -> Settings:
    """Return a cached instance of the application settings."""
    return Settings()
