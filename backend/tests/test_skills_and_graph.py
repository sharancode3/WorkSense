"""Test suite for skills taxonomy, aliases, and relational skill graph."""

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
async def test_skills_taxonomy_and_alias_resolution(app):
    """Test skill taxonomy retrieval and alias-driven search."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token(client, "employee@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. List skills
        res = await client.get("/api/v1/workforce/skills", headers=headers)
        assert res.status_code == 200
        skills = res.json()
        assert len(skills) >= 8

        skill_names = [s["name"] for s in skills]
        assert "Python" in skill_names or "FastAPI" in skill_names
        assert "PostgreSQL" in skill_names

        # 2. Test alias-based search: searching 'Postgres' resolves to canonical 'PostgreSQL'
        res_alias = await client.get("/api/v1/workforce/skills?search=Postgres", headers=headers)
        assert res_alias.status_code == 200
        matched_skills = res_alias.json()
        assert len(matched_skills) >= 1
        assert matched_skills[0]["name"] == "PostgreSQL"
        assert "Postgres" in matched_skills[0]["aliases"]


@pytest.mark.asyncio
async def test_skill_graph_adjacency_and_prerequisites(app):
    """Test relational skill graph returns nodes and typed edges without Neo4j."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token(client, "recruiter@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/workforce/skills/graph", headers=headers)
        assert res.status_code == 200
        graph = res.json()

        assert "nodes" in graph
        assert "edges" in graph
        assert len(graph["nodes"]) >= 8
        assert len(graph["edges"]) >= 3

        # Verify edge relation types
        relation_types = {edge["relationship_type"] for edge in graph["edges"]}
        assert "PREREQUISITE_OF" in relation_types or "ADJACENT_TO" in relation_types

        # Verify weights are valid floats
        for edge in graph["edges"]:
            assert 0.0 <= edge["weight"] <= 1.0


@pytest.mark.asyncio
async def test_candidate_can_query_skills_but_cannot_mutate(app):
    """Candidate can browse skill catalog but cannot add skill edges."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        cand_token = await get_token(client, "candidate@worksense.local")
        headers = {"Authorization": f"Bearer {cand_token}"}

        # Query skills is allowed
        res_read = await client.get("/api/v1/workforce/skills", headers=headers)
        assert res_read.status_code == 200

        # Mutation is forbidden
        res_write = await client.post(
            "/api/v1/workforce/skills/62000000-0000-0000-0000-000000000001/relationships",
            headers=headers,
            json={
                "target_skill_id": "62000000-0000-0000-0000-000000000002",
                "relationship_type": "ADJACENT_TO",
                "similarity_weight": 0.8,
            },
        )
        assert res_write.status_code == 403
