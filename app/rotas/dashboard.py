"""
Rotas do Dashboard
- Estatísticas gerais (total pacientes, consultas hoje/semana)
- Dados para gráficos numéricos (diário, semanal, mensal)
- Dados estruturados do calendário mensal (consultas por dia)
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from datetime import date, datetime, timedelta

from app.database import AsyncSession, get_db
from app.models import Patient, Appointment, Professional
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


async def _get_prof_id(current_user: dict, db: AsyncSession) -> int | None:
    """Retorna o professional_id do usuário logado, ou None se for admin."""
    if current_user.get("role") == "admin":
        return None
    stmt = select(Professional.id).where(Professional.email == current_user.get("email", ""))
    return (await db.execute(stmt)).scalar()


def _appt_filter(prof_id: int | None):
    """Retorna filtros adicionais de agendamento baseados no perfil."""
    if prof_id is None:
        return []
    return [Appointment.professional_id == prof_id]


def _patient_filter(prof_id: int | None):
    """Retorna filtros adicionais de paciente baseados no perfil."""
    if prof_id is None:
        return []
    return [Patient.professional_id == prof_id]


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DO DASHBOARD
# ═════════════════════════════════════════════════════════════════════

@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict[str, Any]:
    prof_id = await _get_prof_id(current_user, db)

    total_patients = await db.scalar(
        select(func.count(Patient.id)).where(*_patient_filter(prof_id))
    ) or 0

    if total_patients == 0:
        return {
            "total_patients": 0,
            "appointments_today": 0,
            "appointments_week": 0,
            "next_appointment": "N/A",
        }

    today = date.today()

    appointments_today = await db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.date == today,
            *_appt_filter(prof_id),
        )
    ) or 0

    start_week = today - timedelta(days=today.weekday())
    end_week = start_week + timedelta(days=6)
    appointments_week = await db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.date >= start_week,
            Appointment.date <= end_week,
            *_appt_filter(prof_id),
        )
    ) or 0

    now = datetime.now()
    next_app_stmt = (
        select(Appointment)
        .where(Appointment.date == today, Appointment.time > now.time(), *_appt_filter(prof_id))
        .order_by(Appointment.time)
        .limit(1)
    )
    next_app = (await db.execute(next_app_stmt)).scalars().first()

    if not next_app:
        future_app_stmt = (
            select(Appointment)
            .where(Appointment.date > today, *_appt_filter(prof_id))
            .order_by(Appointment.date, Appointment.time)
            .limit(1)
        )
        next_app = (await db.execute(future_app_stmt)).scalars().first()

    next_time_str = next_app.time.strftime("%H:%M") if next_app else "N/A"

    return {
        "total_patients": total_patients,
        "appointments_today": appointments_today,
        "appointments_week": appointments_week,
        "next_appointment": next_time_str,
    }


@router.get("/chart-data")
async def get_chart_data(
    period: str = "daily",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict[str, Any]:
    prof_id = await _get_prof_id(current_user, db)
    today = date.today()
    labels: list[str] = []
    data_points: list[int] = []

    if period == "daily":
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
        rows = (await db.execute(
            select(Appointment.date, func.count(Appointment.id))
            .where(Appointment.date >= start_date, Appointment.date <= end_date, *_appt_filter(prof_id))
            .group_by(Appointment.date)
        )).all()
        counts = {row[0]: row[1] for row in rows}
        for i in range(7):
            day = start_date + timedelta(days=i)
            labels.append(day.strftime("%d/%m"))
            data_points.append(counts.get(day, 0))

    elif period == "weekly":
        current_monday = today - timedelta(days=today.weekday())
        start_date = current_monday - timedelta(weeks=3)
        end_date = current_monday + timedelta(days=6)
        rows = (await db.execute(
            select(Appointment.date, func.count(Appointment.id))
            .where(Appointment.date >= start_date, Appointment.date <= end_date, *_appt_filter(prof_id))
            .group_by(Appointment.date)
        )).all()
        counts = {row[0]: row[1] for row in rows}
        for i in range(3, -1, -1):
            ws = current_monday - timedelta(weeks=i)
            we = ws + timedelta(days=6)
            week_total = sum(counts.get(ws + timedelta(days=d), 0) for d in range(7))
            labels.append(f"{ws.strftime('%d/%m')}-{we.strftime('%d/%m')}")
            data_points.append(week_total)

    elif period == "monthly":
        start_m, start_y = today.month - 5, today.year
        while start_m <= 0:
            start_m += 12
            start_y -= 1
        start_date = date(start_y, start_m, 1)
        end_date = (
            date(today.year + 1, 1, 1) - timedelta(days=1) if today.month == 12
            else date(today.year, today.month + 1, 1) - timedelta(days=1)
        )
        rows = (await db.execute(
            select(Appointment.date, func.count(Appointment.id))
            .where(Appointment.date >= start_date, Appointment.date <= end_date, *_appt_filter(prof_id))
            .group_by(Appointment.date)
        )).all()
        counts = {row[0]: row[1] for row in rows}
        for i in range(5, -1, -1):
            m, y = today.month - i, today.year
            while m <= 0:
                m += 12
                y -= 1
            first_day = date(y, m, 1)
            last_day = (
                date(y + 1, 1, 1) - timedelta(days=1) if m == 12
                else date(y, m + 1, 1) - timedelta(days=1)
            )
            month_total = sum(
                counts.get(first_day + timedelta(days=d), 0)
                for d in range((last_day - first_day).days + 1)
            )
            labels.append(MONTHS_PT[m - 1])
            data_points.append(month_total)

    return {"labels": labels, "data": data_points}


@router.get("/calendar")
async def get_calendar_data(
    month: int | None = None,
    year: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict[str, Any]:
    prof_id = await _get_prof_id(current_user, db)

    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    if not (1 <= target_month <= 12):
        raise HTTPException(status_code=422, detail="O mês deve estar entre 1 e 12.")

    try:
        first_day = date(target_year, target_month, 1)
    except ValueError:
        raise HTTPException(status_code=422, detail="Ano ou mês inválido.")

    last_day = (
        date(target_year + 1, 1, 1) - timedelta(days=1) if target_month == 12
        else date(target_year, target_month + 1, 1) - timedelta(days=1)
    )

    appointments_stmt = (
        select(Appointment)
        .options(selectinload(Appointment.patient))
        .where(
            Appointment.date >= first_day,
            Appointment.date <= last_day,
            *_appt_filter(prof_id),
        )
        .order_by(Appointment.date, Appointment.time)
    )
    appointments = (await db.execute(appointments_stmt)).scalars().all()

    calendar_dict: dict[str, list[dict[str, str]]] = {}
    for appt in appointments:
        day_str = appt.date.strftime("%Y-%m-%d")
        if day_str not in calendar_dict:
            calendar_dict[day_str] = []
        patient_name = appt.patient.name if appt.patient else "Paciente Removido"
        calendar_dict[day_str].append({
            "time": appt.time.strftime("%H:%M"),
            "patient": patient_name,
            "status": appt.status or "Aguardando",
            "type": appt.type or "",
        })

    return {
        "month": target_month,
        "year": target_year,
        "days_in_month": last_day.day,
        "first_weekday": first_day.weekday(),
        "appointments": calendar_dict,
    }
