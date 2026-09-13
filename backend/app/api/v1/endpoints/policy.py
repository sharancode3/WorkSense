"""API endpoints for HR Policy Reasoning (Stage 6)."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.api.v1.dependencies import get_current_access_context, require_role
from app.schemas.auth import AccessContext
from app.schemas.policy import (
    PolicyActionRequestResponse,
    PolicyActionSubmitRequest,
    PolicyQueryRequest,
    PolicyQueryResponse,
    PolicyUploadResponse,
)
from app.services.policy_rag_service import policy_rag_service
from app.services.workforce_service import workforce_service

router = APIRouter()


@router.get("", response_model=List[Dict[str, Any]], summary="List policy documents")
def list_policies(
    category: Optional[str] = None,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Lists published policy documents accessible to the current tenant."""
    org_id = ctx.active_organization.id if ctx.active_organization else "00000000-0000-0000-0000-000000000001"
    docs = workforce_service.list_policy_documents(org_id=org_id, category=category)
    return [d.model_dump() for d in docs]


@router.post("/upload", response_model=PolicyUploadResponse, status_code=status.HTTP_201_CREATED, summary="Upload and index policy document")
async def upload_policy_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    policy_code: str = Form(...),
    category: str = Form("general"),
    version_number: str = Form("1.0"),
    effective_date: str = Form("2026-01-01"),
    access_classification: str = Form("all_employees"),
    ctx: AccessContext = Depends(require_role(["hr", "administrator"])),
):
    """Uploads a PDF or text policy document, performs deterministic extraction, chunking, and vector indexing."""
    org_id = ctx.active_organization.id if ctx.active_organization else "00000000-0000-0000-0000-000000000001"
    file_bytes = await file.read()

    return policy_rag_service.process_policy_upload(
        organization_id=org_id,
        title=title,
        policy_code=policy_code,
        category=category,
        version_number=version_number,
        effective_date=effective_date,
        file_name=file.filename or "policy.pdf",
        file_bytes=file_bytes,
        access_classification=access_classification,
        uploaded_by_id=ctx.user.id,
    )


@router.post("/query", response_model=PolicyQueryResponse, summary="Query policy with grounded Qwen citations")
async def query_policy(
    payload: PolicyQueryRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Answers employee policy queries using strictly grounded citations from the authoritative policy library."""
    org_id = ctx.active_organization.id if ctx.active_organization else "00000000-0000-0000-0000-000000000001"
    user_roles = ctx.active_roles

    return await policy_rag_service.answer_policy_query(
        organization_id=org_id,
        user_id=ctx.user.id,
        user_roles=user_roles,
        query_text=payload.query_text,
        category_filter=payload.category_filter,
    )


@router.post("/actions", response_model=PolicyActionRequestResponse, status_code=status.HTTP_201_CREATED, summary="Submit proposed policy action")
def submit_policy_action(
    payload: PolicyActionSubmitRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Submits a proposed policy workflow action (e.g. remote work request) for human review."""
    org_id = ctx.active_organization.id if ctx.active_organization else "00000000-0000-0000-0000-000000000001"
    res = policy_rag_service.submit_policy_action_request(
        organization_id=org_id,
        requester_id=ctx.user.id,
        action_type=payload.action_type,
        action_payload=payload.action_payload,
        policy_query_id=payload.policy_query_id,
    )
    return PolicyActionRequestResponse(**res)


@router.get("/actions", response_model=List[PolicyActionRequestResponse], summary="List policy action requests")
def list_policy_actions(
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Lists policy workflow action requests for the organization."""
    org_id = ctx.active_organization.id if ctx.active_organization else "00000000-0000-0000-0000-000000000001"
    records = policy_rag_service.list_policy_action_requests(organization_id=org_id)
    return [PolicyActionRequestResponse(**r) for r in records]
