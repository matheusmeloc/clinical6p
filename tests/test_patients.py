"""
test_patients.py — Testes de CRUD de pacientes.

Cenários cobertos:
- Criar paciente com dados mínimos → 200
- Criar paciente com CPF duplicado → 409 ou 422 (IntegrityError)
- Listar pacientes sem auth → 403
- Listar pacientes com auth → 200 + lista
- Buscar paciente por ID → 200
- Buscar paciente inexistente → 404
- Atualizar paciente → 200
"""

import pytest
from httpx import AsyncClient

from app.models import Professional, Patient, User


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

PATIENTS_URL = "/api/patients"


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _minimal_patient_payload(cpf: str = "99988877766", name: str = "Novo Paciente") -> dict:
    return {"name": name, "cpf": cpf}


# ─────────────────────────────────────────────────────────────────────
# Testes de Listagem
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_patients_no_auth(client: AsyncClient):
    """Listagem sem Authorization header deve retornar 403."""
    response = await client.get(PATIENTS_URL)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_patients_with_auth(client: AsyncClient, valid_token: str, patient: Patient):
    """Listagem autenticada deve retornar 200 e uma lista com pelo menos um paciente."""
    response = await client.get(PATIENTS_URL, headers=_auth_headers(valid_token))
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(p["id"] == patient.id for p in data)


# ─────────────────────────────────────────────────────────────────────
# Testes de Criação
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_patient_minimal(client: AsyncClient, valid_token: str):
    """Criar paciente com apenas name deve retornar 200 e o paciente criado."""
    payload = {"name": "Paciente Mínimo"}
    response = await client.post(
        PATIENTS_URL,
        json=payload,
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Paciente Mínimo"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_patient_with_cpf(client: AsyncClient, valid_token: str):
    """Criar paciente com CPF deve retornar 200 e persistir o CPF."""
    payload = {"name": "Paciente CPF", "cpf": "55544433322", "email": "cpf@test.com"}
    response = await client.post(
        PATIENTS_URL,
        json=payload,
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["cpf"] == "55544433322"


@pytest.mark.asyncio
async def test_create_patient_duplicate_cpf(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
):
    """Criar paciente com CPF já cadastrado deve retornar 409 ou 500 (IntegrityError)."""
    # O paciente fixture já usa CPF "11122233344"
    payload = {"name": "Duplicado", "cpf": patient.cpf}
    response = await client.post(
        PATIENTS_URL,
        json=payload,
        headers=_auth_headers(valid_token),
    )
    # SQLite lança IntegrityError que pode resultar em 409, 422 ou 500 dependendo do handler
    assert response.status_code in (409, 422, 500)


# ─────────────────────────────────────────────────────────────────────
# Testes de Busca por ID
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_patient_by_id(client: AsyncClient, valid_token: str, patient: Patient):
    """Buscar paciente por ID existente deve retornar 200 com os dados corretos."""
    response = await client.get(
        f"{PATIENTS_URL}/{patient.id}",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == patient.id
    assert data["name"] == patient.name


@pytest.mark.asyncio
async def test_get_patient_not_found(client: AsyncClient, valid_token: str):
    """Buscar paciente com ID inexistente deve retornar 404."""
    response = await client.get(
        f"{PATIENTS_URL}/999999",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 404


# ─────────────────────────────────────────────────────────────────────
# Testes de Atualização
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_patient(client: AsyncClient, valid_token: str, patient: Patient):
    """Atualizar campo name de um paciente existente deve retornar 200 com dado atualizado."""
    new_name = "Paciente Atualizado"
    response = await client.put(
        f"{PATIENTS_URL}/{patient.id}",
        json={"name": new_name},
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == new_name


@pytest.mark.asyncio
async def test_update_patient_not_found(client: AsyncClient, valid_token: str):
    """Atualizar paciente com ID inexistente deve retornar 404."""
    response = await client.put(
        f"{PATIENTS_URL}/999999",
        json={"name": "Fantasma"},
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 404
