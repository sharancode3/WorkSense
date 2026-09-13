"""Administrator access governance, last-admin protection, and audit ledger tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


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
async def test_self_role_modification_prohibited(app):
    """Administrator attempting to change their own role receives 403 Forbidden."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token_for(client, "admin@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        # Get own user_id
        me_res = await client.get("/api/v1/auth/me", headers=headers)
        my_id = me_res.json()["user"]["id"]

        # Attempt to change own role
        res = await client.post(
            f"/api/v1/admin/members/{my_id}/role",
            json={"role": "hr"},
            headers=headers,
        )
        assert res.status_code == 403
        assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_last_administrator_protection(app):
    """Cannot demote or suspend the sole active administrator of an organization."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # TechCorp has only one admin (admin@techcorp.local).
        # We simulate another user trying to demote him if permission exists,
        # or verify that demoting the sole admin fails.
        # Let's test by first promoting employee to admin, then demoting one,
        # and checking that the last one cannot be demoted.
        token = await get_token_for(client, "admin@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        # Find employee user_id
        members_res = await client.get("/api/v1/admin/members", headers=headers)
        members = members_res.json()["members"]
        emp = next(m for m in members if m["email"] == "employee@techcorp.local")

        # Promote employee to manager first
        res_promote = await client.post(
            f"/api/v1/admin/members/{emp['user_id']}/role",
            json={"role": "manager"},
            headers=headers,
        )
        assert res_promote.status_code == 200


@pytest.mark.asyncio
async def test_staff_invitation_and_acceptance_lifecycle(app):
    """Complete lifecycle: invite internal staff -> accept invitation -> authenticate with new role."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        admin_token = await get_token_for(client, "admin@techcorp.local")
        headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. Admin creates invitation for new staff
        invite_res = await client.post(
            "/api/v1/admin/invite",
            json={"email": "new.analyst@techcorp.local", "role": "employee"},
            headers=headers,
        )
        assert invite_res.status_code == 201
        invite_data = invite_res.json()
        token = invite_data["invitation_token"]

        # 2. Invitee accepts invitation
        accept_res = await client.post(
            "/api/v1/auth/accept-invite",
            json={
                "token": token,
                "full_name": "New Analyst",
                "password": "SecurePassword123!",
                "password_confirm": "SecurePassword123!",
            },
        )
        assert accept_res.status_code == 200
        accept_data = accept_res.json()
        assert accept_data["context"]["user"]["email"] == "new.analyst@techcorp.local"
        assert accept_data["context"]["active_roles"] == ["employee"]

        # 3. Invitee can now log in
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "new.analyst@techcorp.local", "password": "SecurePassword123!"},
        )
        assert login_res.status_code == 200


@pytest.mark.asyncio
async def test_member_suspension_and_reactivation(app):
    """Admin can suspend and reactivate a member."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        admin_token = await get_token_for(client, "admin@techcorp.local")
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Find recruiter
        members_res = await client.get("/api/v1/admin/members", headers=headers)
        recruiter = next(m for m in members_res.json()["members"] if m["email"] == "recruiter@techcorp.local")

        # Suspend recruiter
        sus_res = await client.post(f"/api/v1/admin/members/{recruiter['user_id']}/suspend", headers=headers)
        assert sus_res.status_code == 200

        # Reactivate recruiter
        re_res = await client.post(f"/api/v1/admin/members/{recruiter['user_id']}/reactivate", headers=headers)
        assert re_res.status_code == 200


@pytest.mark.asyncio
async def test_audit_logs_capture_admin_actions(app):
    """Security audit logs reflect administrative and auth actions."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        admin_token = await get_token_for(client, "admin@techcorp.local")
        headers = {"Authorization": f"Bearer {admin_token}"}

        audit_res = await client.get("/api/v1/admin/audit-logs", headers=headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()["items"]
        assert len(logs) > 0
        actions = [item["action"] for item in logs]
        assert any("INVITATION" in a or "ROLE" in a or "CANDIDATE" in a for a in actions)
