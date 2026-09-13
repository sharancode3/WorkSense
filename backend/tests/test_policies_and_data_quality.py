"""Test suite for policy governance, version supersession, and data quality audit engine."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    return create_app()


async def get_token(client: AsyncClient, email: str) -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DemoPassword123!"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_policy_document_catalog_and_versioning(app):
    """Test policy catalog listing, version history, and new version creation with supersession."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {hr_token}"}

        # 1. List policies
        res = await client.get("/api/v1/workforce/policies", headers=headers)
        assert res.status_code == 200
        policies = res.json()
        assert len(policies) >= 1

        remote_policy = next(p for p in policies if "Remote" in p["title"])
        policy_id = remote_policy["id"]

        # 2. Get policy detail with version history
        res_detail = await client.get(f"/api/v1/workforce/policies/{policy_id}", headers=headers)
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert "all_versions" in detail
        assert len(detail["all_versions"]) >= 1

        # 3. Create a new superseded version (v4.2)
        res_new_ver = await client.post(
            f"/api/v1/workforce/policies/{policy_id}/versions",
            headers=headers,
            json={
                "version_number": "4.2",
                "effective_date": "2026-11-01",
                "file_name": "remote-work-v4.2.pdf",
                "file_size_bytes": 1024,
                "storage_path": "policies/remote-work-v4.2.pdf",
                "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "supersede_previous": True,
            },
        )
        assert res_new_ver.status_code == 201
        new_ver = res_new_ver.json()
        assert new_ver["version_number"] == "4.2"
        assert new_ver["status"] == "active"


@pytest.mark.asyncio
async def test_data_quality_audit_engine_and_resolution(app):
    """Test data quality rules engine, issue detection, and 1-click issue resolution."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {hr_token}"}

        # 1. Trigger audit scan / get summary
        res_scan = await client.get("/api/v1/workforce/data-quality", headers=headers)
        assert res_scan.status_code == 200
        scan_results = res_scan.json()
        assert "issues" in scan_results
        assert scan_results["total_issues"] >= 1

        # Check an issue format
        issue = scan_results["issues"][0]
        issue_id = issue["id"]
        assert issue["issue_type"] is not None
        assert issue["severity"] in ("critical", "warning", "info")
        assert issue["is_resolved"] is False

        # 2. Resolve the issue
        res_resolve = await client.post(
            f"/api/v1/workforce/data-quality/{issue_id}/resolve",
            headers=headers,
        )
        assert res_resolve.status_code == 200
        resolved_issue = res_resolve.json()
        assert resolved_issue["success"] is True


@pytest.mark.asyncio
async def test_candidate_forbidden_from_data_quality(app):
    """Candidates cannot run data quality audits or resolve governance issues."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        cand_token = await get_token(client, "candidate@worksense.local")
        headers = {"Authorization": f"Bearer {cand_token}"}

        res = await client.get("/api/v1/workforce/data-quality", headers=headers)
        assert res.status_code == 403
