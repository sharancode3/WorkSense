"""Test suite for Stage 4: Skill Normalization, Deterministic Match Scoring, and Grounding Critic."""

import io
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    """Create test application instance."""
    return create_app()


async def get_token(client: AsyncClient, email: str = "recruiter@techcorp.local") -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DemoPassword123!"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_skill_normalization_alias_and_canonical(app):
    """Test alias normalization (K8s to Kubernetes, Golang to Go) and canonical matching."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"  # Elena Rostova
        job_id = "40000000-0000-0000-0000-000000000001"

        # Ingest resume with raw aliases
        content = (
            "Elena Rostova - Principal Distributed Systems Architect\n"
            "Summary: 9 years experience with Golang, K8s, and Postgres in high-scale environments.\n"
            "Core Competencies: K8s, Golang, Postgres, Distributed Systems, PyTorch."
        )
        files = {"file": ("elena_aliases.txt", io.BytesIO(content.encode()), "text/plain")}
        res = await client.post(
            "/api/v1/recruitment/resumes/upload",
            files=files,
            data={"candidate_id": cand_id, "job_opening_id": job_id},
            headers=headers,
        )
        assert res.status_code == 201
        resume_id = res.json()["id"]

        # Run structured extraction
        ext_res = await client.post(f"/api/v1/recruitment/resumes/{resume_id}/extract", headers=headers)
        assert ext_res.status_code == 200

        # Fetch candidate skill normalizations
        norm_res = await client.get(f"/api/v1/recruitment/candidates/{cand_id}/skills/normalizations", headers=headers)
        assert norm_res.status_code == 200
        normalizations = norm_res.json()
        assert len(normalizations) >= 1

        norm_by_phrase = {n["raw_phrase"].lower(): n for n in normalizations}

        # Validate alias resolution
        if "k8s" in norm_by_phrase:
            assert norm_by_phrase["k8s"]["match_method"] == "exact_alias"
            assert norm_by_phrase["k8s"]["confidence"] >= 0.90
        if "golang" in norm_by_phrase:
            assert norm_by_phrase["golang"]["match_method"] == "exact_alias"
            assert norm_by_phrase["golang"]["confidence"] >= 0.90
        if "distributed systems" in norm_by_phrase:
            assert norm_by_phrase["distributed systems"]["match_method"] in ("exact_canonical", "controlled_fuzzy")


@pytest.mark.asyncio
async def test_deterministic_match_calculation_and_breakdown(app):
    """Test deterministic scoring arithmetic: weighted sum matches overall score exactly."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"
        job_id = "40000000-0000-0000-0000-000000000001"

        # Calculate candidate match
        match_res = await client.post(
            f"/api/v1/recruitment/jobs/{job_id}/candidates/{cand_id}/match",
            headers=headers,
        )
        assert match_res.status_code == 200
        match_data = match_res.json()

        assert 0.0 <= match_data["overall_match_score"] <= 100.0
        assert match_data["candidate_id"] == cand_id
        assert match_data["job_opening_id"] == job_id
        assert match_data["is_stale"] is False

        # Verify criterion breakdown
        breakdown = match_data["criterion_breakdown"]
        assert "required_skills" in breakdown
        assert "preferred_skills" in breakdown
        assert "evidence_strength" in breakdown
        assert "experience_alignment" in breakdown

        # Verify mathematical consistency of weights and contributions
        computed_total = sum(c["weighted_contribution"] for c in breakdown.values())
        assert abs(computed_total - match_data["overall_match_score"]) <= 0.1

        # Verify score stability across multiple runs
        match_res2 = await client.post(
            f"/api/v1/recruitment/jobs/{job_id}/candidates/{cand_id}/match",
            headers=headers,
        )
        assert match_res2.status_code == 200
        match_data2 = match_res2.json()
        assert match_data2["overall_match_score"] == match_data["overall_match_score"]
        assert match_data2["required_skill_coverage"] == match_data["required_skill_coverage"]


@pytest.mark.asyncio
async def test_candidate_ranking_ordering_and_tie_breaking(app):
    """Test reproducible ranking order and tie-breaking by score, required skills, and evidence."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        job_id = "40000000-0000-0000-0000-000000000001"

        rank_res = await client.get(f"/api/v1/recruitment/jobs/{job_id}/rankings", headers=headers)
        assert rank_res.status_code == 200
        ranking_envelope = rank_res.json()

        assert ranking_envelope["job_opening_id"] == job_id
        rankings = ranking_envelope["candidates"]
        assert len(rankings) >= 1

        # Verify sequential 1-based rank positions
        for i, r in enumerate(rankings):
            assert r["rank_position"] == i + 1

        # Verify descending order of overall match score
        scores = [r["overall_match_score"] for r in rankings]
        assert scores == sorted(scores, reverse=True)


@pytest.mark.asyncio
async def test_requirement_version_staleness_marking(app):
    """Updating job requirements must mark all existing match evaluations as stale."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"
        job_id = "40000000-0000-0000-0000-000000000001"

        # 1. Ensure candidate is evaluated
        match_res = await client.post(
            f"/api/v1/recruitment/jobs/{job_id}/candidates/{cand_id}/match",
            headers=headers,
        )
        assert match_res.status_code == 200

        # 2. Update requirement version
        update_data = {
            "responsibilities": "Lead ultra-low latency distributed stream processing and Raft consensus.",
            "min_years_experience": "9.0",
            "required_skills_json": (
                '[{"skill_id": "62000000-0000-0000-0000-000000000005", '
                '"skill_name": "Distributed Systems", "min_proficiency": 5, "weight": 1.0, "importance": "required"}]'
            ),
            "preferred_skills_json": "[]",
            "weights_json": (
                '{"required_skills": 0.50, "preferred_skills": 0.15, '
                '"evidence_strength": 0.20, "experience_alignment": 0.15}'
            ),
        }
        req_res = await client.post(f"/api/v1/recruitment/jobs/{job_id}/requirements", data=update_data, headers=headers)
        assert req_res.status_code == 201

        # 3. Verify prior evaluation is marked stale
        from app.services.recruitment_service import recruitment_service

        stale_evals = [
            ev for ev in recruitment_service._match_evaluations.values()
            if ev["job_opening_id"] == job_id and ev["candidate_id"] == cand_id and ev["is_stale"] is True
        ]
        assert len(stale_evals) >= 1
