"""
test_auth.py — Testes de autenticação (POST /api/login e rotas protegidas).

Cenários cobertos:
- Login com credenciais corretas → 200 + access_token
- Login com senha errada → 401
- Login com e-mail inexistente → 404
- Login com usuário inativo → 403
- Acesso a rota protegida sem token → 401
- Acesso a rota protegida com token expirado → 401
- Acesso a rota protegida com token inválido → 401
"""

import pytest
from httpx import AsyncClient

from app.models import User


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

LOGIN_URL = "/api/login"
PROTECTED_URL = "/api/patients"  # qualquer rota que exija Bearer token


# ─────────────────────────────────────────────────────────────────────
# Testes de Login
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user: User):
    """Login com credenciais corretas deve retornar 200 e um access_token."""
    response = await client.post(LOGIN_URL, json={
        "email": admin_user.email,
        "password": "admin@1234",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == admin_user.email


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_user: User):
    """Login com senha incorreta deve retornar 401."""
    response = await client.post(LOGIN_URL, json={
        "email": admin_user.email,
        "password": "wrong-password",
    })
    assert response.status_code == 401
    assert "Senha incorreta" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    """Login com e-mail inexistente deve retornar 404."""
    response = await client.post(LOGIN_URL, json={
        "email": "nobody@nowhere.com",
        "password": "irrelevant",
    })
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, inactive_user: User):
    """Login com usuário inativo deve retornar 403."""
    response = await client.post(LOGIN_URL, json={
        "email": inactive_user.email,
        "password": "inactive@1234",
    })
    assert response.status_code == 403
    assert "inativo" in response.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────
# Testes de Acesso a Rotas Protegidas
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_protected_route_no_token(client: AsyncClient):
    """Acesso a rota protegida sem token deve retornar 401 (OAuth2PasswordBearer)."""
    response = await client.get(PROTECTED_URL)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_expired_token(client: AsyncClient, expired_token: str):
    """Acesso com token expirado deve retornar 401."""
    response = await client.get(
        PROTECTED_URL,
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert "expirado" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_protected_route_invalid_token(client: AsyncClient):
    """Acesso com token completamente inválido deve retornar 401."""
    response = await client.get(
        PROTECTED_URL,
        headers={"Authorization": "Bearer this.is.not.a.valid.jwt"},
    )
    assert response.status_code == 401
    assert "inválido" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_protected_route_valid_token(client: AsyncClient, valid_token: str):
    """Acesso com token válido deve retornar 200 (mesmo que a lista esteja vazia)."""
    response = await client.get(
        PROTECTED_URL,
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 200
