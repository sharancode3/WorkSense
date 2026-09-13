"""Authoritative Canonical Golden Demo Dataset for WorkSense.

Establishes a single, un-compromised source of truth for:
- Elena Rostova (Senior Distributed Systems Engineer, EMP-10550, CAN-10550)
- Marcus Chen (Senior Infrastructure Engineer, EMP-10492, 72% Retention Risk)
- Marcus Vance (Engineering Manager, EMP-10021)
- TechCorp International (Org ID: 00000000-0000-0000-0000-000000000001)
- Target Mobility Role: "Principal Distributed Systems Architect — AI Fraud Detection Initiative"
"""

from typing import Any, Dict

# ==============================================================================
# 1. Organization & Tenants
# ==============================================================================
ORG_TECHCORP_ID = "00000000-0000-0000-0000-000000000001"
ORG_TECHCORP_NAME = "TechCorp International"
ORG_TECHCORP_SLUG = "techcorp"

ORG_ACMECORP_ID = "00000000-0000-0000-0000-000000000002"
ORG_ACMECORP_NAME = "AcmeCorp Global"
ORG_ACMECORP_SLUG = "acmecorp"

# ==============================================================================
# 2. Canonical Departments
# ==============================================================================
DEPT_ENG_ID = "60000000-0000-0000-0000-000000000001"
DEPT_ENG_NAME = "Engineering"

DEPT_INFRA_ID = "60000000-0000-0000-0000-000000000002"
DEPT_INFRA_NAME = "Infrastructure & Platform Services"

DEPT_AI_ID = "60000000-0000-0000-0000-000000000003"
DEPT_AI_NAME = "Artificial Intelligence & Fraud Detection"

DEPT_PEOPLE_ID = "60000000-0000-0000-0000-000000000004"
DEPT_PEOPLE_NAME = "People Operations & HR"

# ==============================================================================
# 3. Canonical Job Roles & Requisitions
# ==============================================================================
# Elena's Applied & Hired Role
ROLE_ELENA_APPLIED_ID = "61000000-0000-0000-0000-000000000001"
ROLE_ELENA_APPLIED_CODE = "ROLE-DIST-SR"
ROLE_ELENA_APPLIED_TITLE = "Senior Distributed Systems Engineer"

# Marcus Chen's Current Role
ROLE_MARCUS_CURRENT_ID = "61000000-0000-0000-0000-000000000002"
ROLE_MARCUS_CURRENT_CODE = "ROLE-INFRA-SR"
ROLE_MARCUS_CURRENT_TITLE = "Senior Infrastructure Engineer"

# Marcus Vance's Manager Role
ROLE_VANCE_MANAGER_ID = "61000000-0000-0000-0000-000000000003"
ROLE_VANCE_MANAGER_CODE = "ROLE-ENG-MGR"
ROLE_VANCE_MANAGER_TITLE = "Engineering Manager"

# Marcus Chen's Target Mobility Role (Exact string everywhere)
ROLE_MARCUS_TARGET_ID = "61000000-0000-0000-0000-000000000005"
ROLE_MARCUS_TARGET_CODE = "ROLE-ARCH-PRIN"
ROLE_MARCUS_TARGET_TITLE = "Principal Distributed Systems Architect — AI Fraud Detection Initiative"

# ==============================================================================
# 4. Canonical Personas & Identifiers
# ==============================================================================

# --- Elena Rostova (Candidate -> Employee Twin) ---
ELENA_PROFILE_ID = "30000000-0000-0000-0000-000000000001"
ELENA_CANDIDATE_ID = "30000000-0000-0000-0000-000000000001"
ELENA_EMPLOYEE_ID = "69000000-0000-0000-0000-000000000003"
ELENA_EMPLOYEE_CODE = "EMP-10550"
ELENA_FULL_NAME = "Elena Rostova"
ELENA_EMAIL = "candidate@worksense.local"
ELENA_PERSONAL_EMAIL = "elena.rostova@example.com"
ELENA_APPLIED_ROLE_TITLE = ROLE_ELENA_APPLIED_TITLE
ELENA_APPLICATION_STATUS = "offer_accepted"
ELENA_LIFECYCLE_STATE = "preboarding"
ELENA_INTERVIEW_SCORE = 92.0
ELENA_APPLICATION_ID = "50000000-0000-0000-0000-000000000001"
ELENA_ONBOARDING_CASE_ID = "90000000-0000-0000-0000-000000000001"
ELENA_ONBOARDING_PLAN_ID = "91000000-0000-0000-0000-000000000001"

# --- Marcus Chen (Key Person Retention & Internal Mobility) ---
MARCUS_CHEN_PROFILE_ID = "30000000-0000-0000-0000-000000000002"
MARCUS_CHEN_EMPLOYEE_ID = "69000000-0000-0000-0000-000000000002"
MARCUS_CHEN_EMPLOYEE_CODE = "EMP-10492"
MARCUS_CHEN_FULL_NAME = "Marcus Chen"
MARCUS_CHEN_EMAIL = "employee@techcorp.local"
MARCUS_CHEN_CURRENT_ROLE = ROLE_MARCUS_CURRENT_TITLE
MARCUS_CHEN_TENURE_YEARS = 3.5
MARCUS_CHEN_SENIORITY_BAND = "L5"
MARCUS_CHEN_RETENTION_RISK_SCORE = 72.0
MARCUS_CHEN_RISK_BAND = "priority_review"
MARCUS_CHEN_TARGET_ROLE = ROLE_MARCUS_TARGET_TITLE
MARCUS_CHEN_MOBILITY_MATCH_SCORE = 88.0
MARCUS_CHEN_RECOMMENDATION_ID = "80000000-0000-0000-0000-000000000001"

# --- Marcus Vance (Manager of Engineering & Onboarding) ---
MARCUS_VANCE_PROFILE_ID = "30000000-0000-0000-0000-000000000003"
MARCUS_VANCE_EMPLOYEE_ID = "69000000-0000-0000-0000-000000000001"
MARCUS_VANCE_EMPLOYEE_CODE = "EMP-10021"
MARCUS_VANCE_FULL_NAME = "Marcus Vance"
MARCUS_VANCE_EMAIL = "manager@techcorp.local"
MARCUS_VANCE_ROLE_TITLE = ROLE_VANCE_MANAGER_TITLE

# --- Suspended Demo Account ---
SUSPENDED_USER_PROFILE_ID = "30000000-0000-0000-0000-000000000009"
SUSPENDED_USER_EMAIL = "suspended@techcorp.local"
SUSPENDED_USER_FULL_NAME = "David Wallace"

# ==============================================================================
# 5. Accessor Functions
# ==============================================================================


def get_canonical_elena() -> Dict[str, Any]:
    """Returns canonical Elena Rostova record."""
    return {
        "profile_id": ELENA_PROFILE_ID,
        "candidate_id": ELENA_CANDIDATE_ID,
        "employee_id": ELENA_EMPLOYEE_ID,
        "employee_code": ELENA_EMPLOYEE_CODE,
        "full_name": ELENA_FULL_NAME,
        "email": ELENA_EMAIL,
        "personal_email": ELENA_PERSONAL_EMAIL,
        "applied_role_title": ELENA_APPLIED_ROLE_TITLE,
        "status": ELENA_APPLICATION_STATUS,
        "lifecycle_state": ELENA_LIFECYCLE_STATE,
        "interview_score": ELENA_INTERVIEW_SCORE,
        "application_id": ELENA_APPLICATION_ID,
        "onboarding_case_id": ELENA_ONBOARDING_CASE_ID,
        "onboarding_plan_id": ELENA_ONBOARDING_PLAN_ID,
        "manager_profile_id": MARCUS_VANCE_PROFILE_ID,
        "manager_name": MARCUS_VANCE_FULL_NAME,
    }


def get_canonical_marcus_chen() -> Dict[str, Any]:
    """Returns canonical Marcus Chen record."""
    return {
        "profile_id": MARCUS_CHEN_PROFILE_ID,
        "employee_id": MARCUS_CHEN_EMPLOYEE_ID,
        "employee_code": MARCUS_CHEN_EMPLOYEE_CODE,
        "full_name": MARCUS_CHEN_FULL_NAME,
        "email": MARCUS_CHEN_EMAIL,
        "current_role": MARCUS_CHEN_CURRENT_ROLE,
        "tenure_years": MARCUS_CHEN_TENURE_YEARS,
        "seniority_band": MARCUS_CHEN_SENIORITY_BAND,
        "retention_risk_score": MARCUS_CHEN_RETENTION_RISK_SCORE,
        "risk_band": MARCUS_CHEN_RISK_BAND,
        "target_role": MARCUS_CHEN_TARGET_ROLE,
        "mobility_match_score": MARCUS_CHEN_MOBILITY_MATCH_SCORE,
        "recommendation_id": MARCUS_CHEN_RECOMMENDATION_ID,
        "manager_profile_id": MARCUS_VANCE_PROFILE_ID,
        "manager_name": MARCUS_VANCE_FULL_NAME,
    }
