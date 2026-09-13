"""Version 1 API router aggregate."""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    auth,
    dashboard,
    demo,
    health,
    intelligence,
    onboarding,
    policy,
    recommendation,
    recruitment,
    workforce,
)

api_v1_router = APIRouter()

# Mount health & diagnostics
api_v1_router.include_router(health.router)

# Mount authentication & identity
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Identity"])

# Mount administration & access governance
api_v1_router.include_router(admin.router, prefix="/admin", tags=["Administration & Governance"])

# Mount core workforce data layer
api_v1_router.include_router(workforce.router)

# Mount recruitment & interview intelligence
api_v1_router.include_router(recruitment.router, prefix="/recruitment", tags=["Recruitment & Interview Intelligence"])

# Mount adaptive onboarding
api_v1_router.include_router(onboarding.router, prefix="/onboarding", tags=["Adaptive Onboarding"])

# Mount HR policy reasoning (Stage 6)
api_v1_router.include_router(policy.router, prefix="/policies", tags=["HR Policy Reasoning"])

# Mount workforce intelligence (Stage 7)
api_v1_router.include_router(intelligence.router, prefix="/intelligence", tags=["Workforce Intelligence"])

# Mount HR decision dashboard (Stage 8)
api_v1_router.include_router(dashboard.router, prefix="/dashboard", tags=["HR Decision Dashboard"])

# Mount recommendation-to-action workflow (Stage 9)
api_v1_router.include_router(recommendation.router, prefix="/recommendations", tags=["Recommendation-to-Action Workflow"])

# Mount demo experience & reset (Stage 10)
api_v1_router.include_router(demo.router, prefix="/demo", tags=["Demo Experience & Golden Paths"])
