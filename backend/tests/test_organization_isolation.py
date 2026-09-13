"""Multi-tenant cross-organization isolation test suite."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app

TECHCORP_ORG_ID = "00000000-0000-0000-0000-000000000001"
ACMECORP_ORG_ID = "00000000-0000-0000-0000-000000000002"


@pytest.fixture
def app():
    return create_app()


async def get_token_for(client: AsyncClient, email: str) -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DemoPassword123!"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_organization_member_list_isolation(app):
    """Admin of TechCorp sees only TechCorp members; Admin of AcmeCorp sees only AcmeCorp members."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # TechCorp Admin
        tech_token = await get_token_for(client, "admin@techcorp.local")
        tech_res = await client.get("/api/v1/admin/members", headers={"Authorization": f"Bearer {tech_token}"})
        assert tech_res.status_code == 200
        tech_members = tech_res.json()["members"]
        tech_emails = [m["email"] for m in tech_members]

        assert "admin@techcorp.local" in tech_emails
        assert "employee@techcorp.local" in tech_emails
        assert "admin@acmecorp.local" not in tech_emails

        # AcmeCorp Admin
        acme_token = await get_token_for(client, "admin@acmecorp.local")
        acme_res = await client.get("/api/v1/admin/members", headers={"Authorization": f"Bearer {acme_token}"})
        assert acme_res.status_code == 200
        acme_members = acme_res.json()["members"]
        acme_emails = [m["email"] for m in acme_members]

        assert "admin@acmecorp.local" in acme_emails
        assert "admin@techcorp.local" not in acme_emails
        assert "employee@techcorp.local" not in acme_emails


@pytest.mark.asyncio
async def test_unauthorized_organization_switching_denied(app):
    """User cannot switch to an organization they do not belong to."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # TechCorp employee (not in AcmeCorp)
        token = await get_token_for(client, "employee@techcorp.local")
        res = await client.post(
            "/api/v1/auth/switch-organization",
            json={"organization_id": ACMECORP_ORG_ID},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403
        assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_authorized_multi_org_user_can_switch(app):
    """User with verified multi-organization memberships can switch between tenants."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # multiorg@techcorp.local is member of both TechCorp and AcmeCorp
        token = await get_token_for(client, "multiorg@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        # Initial context: default TechCorp
        me1 = await client.get("/api/v1/auth/me", headers=headers)
        assert me1.status_code == 200
        assert me1.json()["active_organization"]["id"] == TECHCORP_ORG_ID

        # Switch to AcmeCorp
        switch_res = await client.post(
            "/api/v1/auth/switch-organization",
            json={"organization_id": ACMECORP_ORG_ID},
            headers=headers,
        )
        assert switch_res.status_code == 200
        assert switch_res.json()["active_organization"]["id"] == ACMECORP_ORG_ID
        assert switch_res.json()["active_roles"] == ["recruiter"]
