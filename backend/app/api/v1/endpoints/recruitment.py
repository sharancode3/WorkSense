"""REST API endpoints for Stage 4: Recruitment & Interview Intelligence."""

from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.api.v1.dependencies import get_current_access_context
from app.core.errors import ForbiddenError, ValidationError
from app.schemas.auth import AccessContext
from app.schemas.recruitment import (
    CandidateApplicationResponse,
    CandidateMatchEvaluationResponse,
    CandidateRankingListResponse,
    InterviewInsightResponse,
    InterviewKitCreate,
    InterviewKitResponse,
    InterviewKitUpdate,
    InterviewResponseRecord,
    InterviewResponseRecordRequest,
    InterviewSessionCreate,
    InterviewSessionResponse,
    JobOpeningCreate,
    JobOpeningResponse,
    JobRequirementSkillItem,
    JobRequirementVersionResponse,
    JobRequirementWeights,
    MultiBrainRunResponse,
    RecruitmentDecisionCreate,
    RecruitmentDecisionResponse,
    ResumeDocumentResponse,
    ResumeExtractionResponse,
    SkillNormalizationItem,
)
from app.services.recruitment_service import recruitment_service

router = APIRouter()


def _require_org(ctx: AccessContext) -> str:
    """Ensure caller has active organization context."""
    if not ctx.active_organization:
        raise ForbiddenError("Active organization context required for recruitment operations")
    if ctx.membership_status == "suspended":
        raise ForbiddenError("Your membership in this organization is suspended")
    return ctx.active_organization.id


def _require_recruitment_staff(ctx: AccessContext) -> None:
    """Ensure caller has recruiter, HR, administrator, or manager role."""
    allowed = {"recruiter", "hr", "administrator", "manager"}
    if not any(r in allowed for r in ctx.active_roles):
        raise ForbiddenError("Recruitment intelligence operations require staff credentials")


# ====================================================================
# 1. Job Requisitions & Versioning
# ====================================================================

@router.get("/jobs", response_model=List[JobOpeningResponse])
async def list_jobs(
    status: Optional[str] = None,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """List all job openings for active organization."""
    org_id = _require_org(ctx)
    return recruitment_service.list_job_openings(org_id, status=status)


@router.post("/jobs", response_model=JobOpeningResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    data: JobOpeningCreate,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Create a new job opening and versioned requirements contract."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.create_job_opening(org_id, data, creator_profile_id=ctx.user.id)


@router.get("/jobs/{job_id}", response_model=JobOpeningResponse)
async def get_job(
    job_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Fetch single job opening by ID."""
    org_id = _require_org(ctx)
    return recruitment_service.get_job_opening(org_id, job_id)


@router.post("/jobs/{job_id}/requirements", response_model=JobRequirementVersionResponse, status_code=status.HTTP_201_CREATED)
async def update_job_requirements(
    job_id: str,
    responsibilities: str = Form(...),
    min_years_experience: float = Form(0.0),
    required_skills_json: str = Form("[]"),
    preferred_skills_json: str = Form("[]"),
    weights_json: str = Form("{}"),
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Publish a new requirement version, marking historical match evaluations stale."""
    import json
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)

    try:
        req_skills = [JobRequirementSkillItem(**s) for s in json.loads(required_skills_json)]
        pref_skills = [JobRequirementSkillItem(**s) for s in json.loads(preferred_skills_json)]
        weights_dict = json.loads(weights_json) if weights_json != "{}" else {}
        weights = JobRequirementWeights(**weights_dict) if weights_dict else JobRequirementWeights()
    except Exception as e:
        raise ValidationError(f"Invalid requirement JSON payload: {e}")

    return recruitment_service.update_job_requirements(
        org_id=org_id,
        job_id=job_id,
        responsibilities=responsibilities,
        required_skills=req_skills,
        preferred_skills=pref_skills,
        min_years_experience=min_years_experience,
        weights=weights,
        actor_id=ctx.user.id,
    )


# ====================================================================
# 2. Resume Upload & Extraction
# ====================================================================

@router.post("/resumes/upload", response_model=ResumeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    candidate_id: str = Form(...),
    job_opening_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Intake Controller: Upload and parse resume document."""
    org_id = _require_org(ctx)

    # Candidate can upload only for own profile; Staff can upload for any candidate
    if "candidate" in ctx.active_roles and not any(r in {"recruiter", "hr", "administrator"} for r in ctx.active_roles):
        from app.services.workforce_service import workforce_service
        cand = workforce_service._candidate_profiles.get(candidate_id)
        if not cand or cand.get("profile_id") != ctx.user.id:
            raise ForbiddenError("Candidates can only submit resumes for their own application profile")

    file_bytes = await file.read()
    return await recruitment_service.ingest_resume(
        org_id=org_id,
        candidate_id=candidate_id,
        file_bytes=file_bytes,
        file_name=file.filename or "resume.pdf",
        mime_type=file.content_type or "application/pdf",
        job_opening_id=job_opening_id,
        actor_id=ctx.user.id,
    )


@router.post("/resumes/{resume_id}/extract", response_model=ResumeExtractionResponse)
async def extract_resume_evidence(
    resume_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Resume Evidence Extractor: Execute Qwen structured evidence extraction."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return await recruitment_service.extract_resume_evidence(org_id, resume_id, actor_id=ctx.user.id)


@router.get("/candidates/{candidate_id}/skills/normalizations", response_model=List[SkillNormalizationItem])
async def list_skill_normalizations(
    candidate_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Skill Resolver: List normalized skills for candidate."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.list_skill_normalizations(org_id, candidate_id)


# ====================================================================
# 3. Transparent Matching & Candidate Rankings
# ====================================================================

@router.post("/jobs/{job_id}/candidates/{candidate_id}/match", response_model=CandidateMatchEvaluationResponse)
async def calculate_candidate_match(
    job_id: str,
    candidate_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Deterministic match calculation and grounded Qwen explanation."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return await recruitment_service.calculate_candidate_match(org_id, job_id, candidate_id)


@router.get("/jobs/{job_id}/rankings", response_model=CandidateRankingListResponse)
async def get_candidate_rankings(
    job_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Deterministic candidate ranking with transparent criterion scores."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return await recruitment_service.get_candidate_rankings(org_id, job_id)


# ====================================================================
# 4. Interview Architect & Sessions
# ====================================================================

@router.post("/interviews/kits", response_model=InterviewKitResponse, status_code=status.HTTP_201_CREATED)
async def generate_interview_kit(
    data: InterviewKitCreate,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Interview Architect: Generate role-specific questions and 5-point observable rubrics."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return await recruitment_service.generate_interview_kit(
        org_id=org_id,
        job_opening_id=data.job_opening_id,
        candidate_id=data.candidate_id,
        title=data.title,
        stage=data.stage,
        actor_id=ctx.user.id,
    )


@router.get("/interviews/kits", response_model=List[InterviewKitResponse])
async def list_interview_kits(
    job_opening_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """List interview kits for a specific job opening."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.list_interview_kits_for_job(org_id, job_opening_id)


@router.get("/interviews/kits/{kit_id}", response_model=InterviewKitResponse)
async def get_interview_kit(
    kit_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Retrieve interview kit by ID."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.get_interview_kit(org_id, kit_id)


@router.put("/interviews/kits/{kit_id}", response_model=InterviewKitResponse)
async def update_interview_kit(
    kit_id: str,
    data: InterviewKitUpdate,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Update draft interview kit questions and rubrics."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.update_interview_kit(
        org_id=org_id,
        kit_id=kit_id,
        questions=[q.model_dump() for q in data.questions],
        title=data.title,
    )


@router.post("/interviews/kits/{kit_id}/approve", response_model=InterviewKitResponse)
async def approve_interview_kit(
    kit_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Approve an interview kit for active candidate evaluation."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.approve_interview_kit(org_id, kit_id, actor_id=ctx.user.id)


@router.get("/interviews/sessions", response_model=List[InterviewSessionResponse])
async def list_interview_sessions(
    job_opening_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """List interview sessions for a specific job opening."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.list_interview_sessions_for_job(org_id, job_opening_id)


@router.get("/interviews/sessions/{session_id}", response_model=InterviewSessionResponse)
async def get_interview_session(
    session_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Retrieve interview session details by ID."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.get_interview_session(org_id, session_id)


@router.post("/interviews/sessions", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_interview_session(
    data: InterviewSessionCreate,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Schedule an interview session linked to an approved kit."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.create_interview_session(
        org_id=org_id,
        kit_id=data.interview_kit_id,
        candidate_id=data.candidate_id,
        scheduled_at=data.scheduled_at,
        interviewer_id=ctx.user.id,
        notes=data.notes,
    )


@router.post("/interviews/sessions/{session_id}/responses", response_model=InterviewResponseRecord)
async def record_interview_response(
    session_id: str,
    data: InterviewResponseRecordRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Record question response text and interviewer notes."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.record_interview_response(
        org_id=org_id,
        session_id=session_id,
        question_index=data.question_index,
        question_text=data.question_text,
        competency=data.competency,
        candidate_response_text=data.candidate_response_text,
        interviewer_notes=data.interviewer_notes,
    )


@router.post("/interviews/sessions/{session_id}/complete", response_model=InterviewInsightResponse)
async def complete_interview(
    session_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Interview Evidence Analyst: Complete session and synthesize rubric insights."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return await recruitment_service.complete_interview_and_generate_insights(
        org_id=org_id,
        session_id=session_id,
        actor_id=ctx.user.id,
    )


@router.get("/interviews/sessions/{session_id}/insights", response_model=InterviewInsightResponse)
async def get_interview_insights(
    session_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Retrieve synthesized rubric insights for an interview session."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.get_interview_insight(org_id, session_id)


# ====================================================================
# 5. Accountable Human Decision Gate
# ====================================================================

@router.post("/jobs/{job_id}/candidates/{candidate_id}/decision", response_model=RecruitmentDecisionResponse, status_code=status.HTTP_201_CREATED)
async def record_recruitment_decision(
    job_id: str,
    candidate_id: str,
    data: RecruitmentDecisionCreate,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Accountable human decision gate with mandatory override justification."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.record_recruitment_decision(
        org_id=org_id,
        job_opening_id=job_id,
        candidate_id=candidate_id,
        data=data,
        decided_by_profile_id=ctx.user.id,
    )


# ====================================================================
# 6. Candidate Privacy Shield (Candidate Self-Service)
# ====================================================================

@router.get("/candidates/me/applications", response_model=List[CandidateApplicationResponse])
async def get_my_applications(
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Candidate Privacy Shield: Candidate can only view sanitized status of their applications."""
    org_id = ctx.active_organization.id if ctx.active_organization else None
    return recruitment_service.get_candidate_facing_applications(
        org_id=org_id,
        profile_id=ctx.user.id,
        email=ctx.user.email,
    )


# ====================================================================
# 7. Multi-Brain Telemetry
# ====================================================================

@router.get("/telemetry/runs", response_model=List[MultiBrainRunResponse])
async def list_multi_brain_runs(
    ctx: AccessContext = Depends(get_current_access_context),
):
    """List multi-brain audit records for active organization."""
    org_id = _require_org(ctx)
    _require_recruitment_staff(ctx)
    return recruitment_service.list_multi_brain_runs(org_id)
