"""
test_appointments.py — Testes de CRUD de agendamentos.

Cenários cobertos:
- Criar agendamento válido → 200
- Criar agendamento com patient_id inexistente → 404
- Criar agendamento com professional_id inexistente → 404
- Deletar agendamento → 200
- Deletar agendamento inexistente → 404
- Listar agendamentos hoje → 200
- Listar todos os agendamentos → 200
- Atualizar agendamento → 200
"""

import pytest
from datetime import date, time, timedelta
from httpx import AsyncClient

from app.models import Professional, Patient, Appointment, User


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

APPTS_URL = "/api/appointments"
TODAY = str(date.today())
TOMORROW = str(date.today() + timedelta(days=1))


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _appt_payload(patient_id: int, professional_id: int, appt_date: str = TODAY) -> dict:
    return {
        "patient_id": patient_id,
        "professional_id": professional_id,
        "date": appt_date,
        "time": "10:00:00",
        "type": "Primeira Consulta",
        "status": "Aguardando",
    }


# ─────────────────────────────────────────────────────────────────────
# Testes de Criação
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_appointment_valid(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
    professional: Professional,
):
    """Criar agendamento com patient_id e professional_id válidos deve retornar 200."""
    payload = _appt_payload(patient.id, professional.id)
    response = await client.post(
        APPTS_URL,
        json=payload,
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == patient.id
    assert data["professional_id"] == professional.id
    assert "id" in data


@pytest.mark.asyncio
async def test_create_appointment_invalid_patient(
    client: AsyncClient,
    valid_token: str,
    professional: Professional,
):
    """Criar agendamento com patient_id inexistente deve retornar 404."""
    payload = _appt_payload(patient_id=999999, professional_id=professional.id)
    response = await client.post(
        APPTS_URL,
        json=payload,
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 404
    assert "Patient" in response.json()["detail"] or "patient" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_appointment_invalid_professional(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
):
    """Criar agendamento com professional_id inexistente deve retornar 404."""
    payload = _appt_payload(patient_id=patient.id, professional_id=999999)
    response = await client.post(
        APPTS_URL,
        json=payload,
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 404
    assert "Professional" in response.json()["detail"] or "professional" in response.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────
# Testes de Listagem
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_appointments(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
    professional: Professional,
):
    """Listar todos os agendamentos deve retornar 200 e uma lista."""
    # Cria um agendamento para garantir que há dados
    await client.post(
        APPTS_URL,
        json=_appt_payload(patient.id, professional.id, TOMORROW),
        headers=_auth_headers(valid_token),
    )
    response = await client.get(APPTS_URL, headers=_auth_headers(valid_token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_appointments_today(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
    professional: Professional,
):
    """Listar agendamentos de hoje deve retornar 200 e uma lista."""
    # Cria um agendamento para hoje
    await client.post(
        APPTS_URL,
        json=_appt_payload(patient.id, professional.id, TODAY),
        headers=_auth_headers(valid_token),
    )
    response = await client.get(
        f"{APPTS_URL}/today",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Todos os itens retornados devem ser da data de hoje
    for appt in data:
        assert appt["date"] == TODAY


# ─────────────────────────────────────────────────────────────────────
# Testes de Atualização
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_appointment(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
    professional: Professional,
):
    """Atualizar status de um agendamento deve retornar 200 com o novo valor."""
    # Cria agendamento
    create_resp = await client.post(
        APPTS_URL,
        json=_appt_payload(patient.id, professional.id, TOMORROW),
        headers=_auth_headers(valid_token),
    )
    assert create_resp.status_code == 200
    appt_id = create_resp.json()["id"]

    # Atualiza o status
    update_resp = await client.put(
        f"{APPTS_URL}/{appt_id}",
        json={"status": "Confirmado"},
        headers=_auth_headers(valid_token),
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "Confirmado"


# ─────────────────────────────────────────────────────────────────────
# Testes de Exclusão
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_appointment(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
    professional: Professional,
):
    """Deletar agendamento existente deve retornar 200 com mensagem de sucesso."""
    # Cria agendamento para depois deletar
    create_resp = await client.post(
        APPTS_URL,
        json=_appt_payload(patient.id, professional.id, TOMORROW),
        headers=_auth_headers(valid_token),
    )
    assert create_resp.status_code == 200
    appt_id = create_resp.json()["id"]

    # Deleta
    delete_resp = await client.delete(
        f"{APPTS_URL}/{appt_id}",
        headers=_auth_headers(valid_token),
    )
    assert delete_resp.status_code == 200
    assert "deleted" in delete_resp.json().get("message", "").lower()


@pytest.mark.asyncio
async def test_delete_appointment_not_found(client: AsyncClient, valid_token: str):
    """Deletar agendamento inexistente deve retornar 404."""
    response = await client.delete(
        f"{APPTS_URL}/999999",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 404


# ─────────────────────────────────────────────────────────────────────
# Testes de Busca por ID
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_appointment_not_found(client: AsyncClient, valid_token: str):
    """Buscar agendamento com ID inexistente deve retornar 404."""
    response = await client.get(
        f"{APPTS_URL}/999999",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 404
