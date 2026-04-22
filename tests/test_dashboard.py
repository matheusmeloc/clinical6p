"""
test_dashboard.py — Testes dos endpoints do dashboard.

Cenários cobertos:
- GET /api/dashboard/stats com banco vazio → 200 com zeros
- GET /api/dashboard/stats com dados → 200 com contagens corretas
- GET /api/dashboard/chart-data?period=daily → 200 + labels/data
- GET /api/dashboard/chart-data?period=weekly → 200 + labels/data
- GET /api/dashboard/chart-data?period=monthly → 200 + labels/data
- GET /api/dashboard/calendar → 200 + estrutura de dias
"""

import pytest
from datetime import date, timedelta
from httpx import AsyncClient

from app.models import Professional, Patient, Appointment, User


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

STATS_URL = "/api/dashboard/stats"
CHART_URL = "/api/dashboard/chart-data"
CALENDAR_URL = "/api/dashboard/calendar"
TODAY = str(date.today())


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─────────────────────────────────────────────────────────────────────
# Testes de Stats
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dashboard_stats_empty_db(client: AsyncClient, valid_token: str):
    """
    Banco sem pacientes deve retornar 200 com todos os contadores zerados
    e next_appointment == 'N/A'.
    """
    response = await client.get(STATS_URL, headers=_auth_headers(valid_token))
    assert response.status_code == 200
    data = response.json()
    assert "total_patients" in data
    assert "appointments_today" in data
    assert "appointments_week" in data
    assert "next_appointment" in data
    # Com banco vazio (sem pacientes), o endpoint retorna zeros
    assert data["total_patients"] == 0
    assert data["appointments_today"] == 0
    assert data["appointments_week"] == 0
    assert data["next_appointment"] == "N/A"


@pytest.mark.asyncio
async def test_dashboard_stats_with_data(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
    professional: Professional,
):
    """
    Com pelo menos um paciente no banco, deve retornar total_patients >= 1.
    """
    # Cria agendamento para hoje
    await client.post(
        "/api/appointments",
        json={
            "patient_id": patient.id,
            "professional_id": professional.id,
            "date": TODAY,
            "time": "14:00:00",
            "status": "Confirmado",
        },
        headers=_auth_headers(valid_token),
    )

    response = await client.get(STATS_URL, headers=_auth_headers(valid_token))
    assert response.status_code == 200
    data = response.json()
    assert data["total_patients"] >= 1
    assert data["appointments_today"] >= 1
    assert data["appointments_week"] >= 1


# ─────────────────────────────────────────────────────────────────────
# Testes de Chart Data
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_chart_data_daily(client: AsyncClient, valid_token: str):
    """GET /api/dashboard/chart-data?period=daily deve retornar 200 com 7 labels (seg-dom)."""
    response = await client.get(
        f"{CHART_URL}?period=daily",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "labels" in data
    assert "data" in data
    assert len(data["labels"]) == 7
    assert len(data["data"]) == 7
    # Todos os valores devem ser inteiros não-negativos
    assert all(isinstance(v, int) and v >= 0 for v in data["data"])


@pytest.mark.asyncio
async def test_chart_data_weekly(client: AsyncClient, valid_token: str):
    """GET /api/dashboard/chart-data?period=weekly deve retornar 200 com 4 labels (últimas 4 semanas)."""
    response = await client.get(
        f"{CHART_URL}?period=weekly",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "labels" in data
    assert "data" in data
    assert len(data["labels"]) == 4
    assert len(data["data"]) == 4
    assert all(isinstance(v, int) and v >= 0 for v in data["data"])


@pytest.mark.asyncio
async def test_chart_data_monthly(client: AsyncClient, valid_token: str):
    """GET /api/dashboard/chart-data?period=monthly deve retornar 200 com 6 labels (últimos 6 meses)."""
    response = await client.get(
        f"{CHART_URL}?period=monthly",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "labels" in data
    assert "data" in data
    assert len(data["labels"]) == 6
    assert len(data["data"]) == 6
    assert all(isinstance(v, int) and v >= 0 for v in data["data"])


@pytest.mark.asyncio
async def test_chart_data_default_period(client: AsyncClient, valid_token: str):
    """GET /api/dashboard/chart-data sem parâmetro deve usar period=daily (7 labels)."""
    response = await client.get(CHART_URL, headers=_auth_headers(valid_token))
    assert response.status_code == 200
    data = response.json()
    assert len(data["labels"]) == 7


# ─────────────────────────────────────────────────────────────────────
# Testes de Calendar
# ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_calendar_current_month(client: AsyncClient, valid_token: str):
    """GET /api/dashboard/calendar deve retornar 200 com estrutura válida do mês atual."""
    today = date.today()
    response = await client.get(
        f"{CALENDAR_URL}?month={today.month}&year={today.year}",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == today.month
    assert data["year"] == today.year
    assert "days_in_month" in data
    assert "first_weekday" in data
    assert "appointments" in data
    assert isinstance(data["appointments"], dict)


@pytest.mark.asyncio
async def test_calendar_invalid_month(client: AsyncClient, valid_token: str):
    """GET /api/dashboard/calendar com mês inválido deve retornar 422."""
    response = await client.get(
        f"{CALENDAR_URL}?month=13&year=2025",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_calendar_with_appointment(
    client: AsyncClient,
    valid_token: str,
    patient: Patient,
    professional: Professional,
):
    """Calendar deve incluir o agendamento criado no dia correto."""
    today = date.today()
    # Cria agendamento para hoje
    create_resp = await client.post(
        "/api/appointments",
        json={
            "patient_id": patient.id,
            "professional_id": professional.id,
            "date": TODAY,
            "time": "09:00:00",
            "status": "Confirmado",
        },
        headers=_auth_headers(valid_token),
    )
    assert create_resp.status_code == 200

    response = await client.get(
        f"{CALENDAR_URL}?month={today.month}&year={today.year}",
        headers=_auth_headers(valid_token),
    )
    assert response.status_code == 200
    data = response.json()
    # O dia de hoje deve aparecer no dicionário de agendamentos
    assert TODAY in data["appointments"]
    today_appts = data["appointments"][TODAY]
    assert len(today_appts) >= 1
    assert any(a["time"] == "09:00" for a in today_appts)
