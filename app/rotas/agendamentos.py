"""
Rotas de Agendamentos (Appointments)
- CRUD completo
- Consultas de hoje e próximas consultas (para o dashboard)
"""

import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import date

from app.database import AsyncSession, get_db
from app.models import Patient, Professional, Appointment
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter(prefix="/api/appointments", tags=["Agendamentos"])
logger = logging.getLogger(__name__)


# ═════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═════════════════════════════════════════════════════════════════════

def _appointment_to_dict(a: Appointment) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função'? O Tradutor do Calendário.
    A mesma lógica de sempre: Pega do Banco de Dados um formato pesado (Classe), traduz pra um pacote leve (Dicionário) e no meio do processo já "gruda" os nomes certos de quem vai (paciente) e quem atende (profissional) na consulta!
    """
    return {
        "id": a.id, 
        "patient_id": a.patient_id, 
        "professional_id": a.professional_id,
        "patient_name": a.patient.name if getattr(a, 'patient', None) else None,
        "professional_name": a.professional.name if getattr(a, 'professional', None) else None,
        "date": str(a.date), 
        "time": str(a.time),
        "type": a.type, 
        "status": a.status,
        "observations": a.observations, 
        "created_at": a.created_at,
    }


def _query_with_relations():
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' é como um Truque de Mágica (ou atalho para preguiçosos).
    A consulta (Appointment) guarda apenas o "Número" das pessoas (ex: Paciente 5, Psicólogo 2) na sua tabela de dados. 
    Toda vez que pesquisarmos uma consulta, queremos exibir o "João", e não o "ID 5".
    Então em vez de colar esse mesmo código grande para colar as tabelas (o selectinload) em todas as outras funções, a gente guarda o código aqui e só chama a magia: _query_with_relations(). Menos digitação!
    """
    return select(Appointment).options(
        selectinload(Appointment.patient), 
        selectinload(Appointment.professional)
    )


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS ESPECIAIS (DASHBOARD)
# ═════════════════════════════════════════════════════════════════════

@router.get("/today")
async def today_appointments(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' atua como a "Secretária que Olha a Agenda de Hoje".
    Ela usa o truque mágico acima para puxar os nomes, mas bota um filtro: "Traga apenas os registros ONDE (Where) a data for igualzinha ao dia exato de Hoje (date.today)".
    Aí embala tudo, recorta os segundos do relógio pra ficar elegante (deixa só HH:MM) e manda pro Quadro-Resumo verde lá do site.
    """
    try:
        stmt = _query_with_relations().where(Appointment.date == date.today()).order_by(Appointment.time)
        result = await db.execute(stmt)
        
        appointments = []
        for a in result.scalars().all():
            appt_dict = _appointment_to_dict(a)
            appt_dict["date"] = str(a.date) if a.date else None
            appt_dict["time"] = a.time.strftime("%H:%M") if a.time else None
            appointments.append(appt_dict)
            
        return appointments
        
    except Exception as e:
        logger.error(f"Erro ao buscar consultas de hoje: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming")
async def upcoming_appointments(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta é a "Secretária das Próximas Consultas".
    Filtro dela: "Onde (Where) a data for DE AMANHÃ EM DIANTE (> today)".
    Como em um mês a clínica pode ter mil consultas no futuro, ela coloca um limite (limit(10)) para não travar o computador. E formata a data bem curtinha (só mês e dia, strftime("%d/%m")) para caber bonitinho no painel lá da tela.
    """
    try:
        stmt = (
            _query_with_relations()
            .where(Appointment.date > date.today())
            .order_by(Appointment.date, Appointment.time)
            .limit(10)
        )
        result = await db.execute(stmt)
        
        appointments = []
        for a in result.scalars().all():
            appt_dict = _appointment_to_dict(a)
            # Formata a data de forma curta: dd/mm
            appt_dict["date"] = a.date.strftime("%d/%m") if hasattr(a.date, "strftime") else (str(a.date)[:5] if a.date else None)
            appt_dict["time"] = a.time.strftime("%H:%M") if a.time else None
            appointments.append(appt_dict)
            
        return appointments
        
    except Exception as e:
        logger.error(f"Erro ao buscar próximas consultas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═════════════════════════════════════════════════════════════════════
# CRUD PADRÃO
# ═════════════════════════════════════════════════════════════════════

@router.get("")
async def list_appointments(
    date_filter: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' é o Livro do Calendário completo dos agendamentos. Mostra tudo e qualquer coisa.
    Você pode passar pra ela uma data específica (o date_filter) para "Filtrar". Se você jogar uma palavra totalmente aleatória que não é uma data válida pra ela (tipo "Batata"), ela não dá "Tela Azul". Ela percebe no bloco "try/except", diz "Opa, não entendi, então vou ignorar" (pass) e varre toda a agenda do mesmo jeito!
    """
    query = _query_with_relations()
    
    if date_filter:
        try:
            filter_date = date.fromisoformat(date_filter)
            query = query.where(Appointment.date == filter_date)
        except ValueError:
            pass # Ignora filtros mal formatados
            
    result = await db.execute(query.order_by(Appointment.date, Appointment.time).offset(skip).limit(limit))
    return [_appointment_to_dict(a) for a in result.scalars().all()]


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)) -> Appointment:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' busca os dados completões de UM ÚNICO agendamento quando você clica em "Ver Detalhes" na tela.
    Se você inventar o ID número 9999 e a consulta não existir, ela joga a toalha e grita: Erro 404 (Falha - Não encontrado).
    """
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    appt = result.scalars().first()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    return appt


@router.post("", response_model=AppointmentResponse)
async def create_appointment(appointment: AppointmentCreate, db: AsyncSession = Depends(get_db)) -> Appointment:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' entra em cena quando a secretária clica no botão verde gigantesco de "Marcar Nova Consulta".
    O computador não confia em ninguém. Antes de carimbar o papel e salvar na pasta (banco de dados), ele checa pra ver se tudo faz sentido: 
    "Espera aí, o Paciente de ID 5 realmente existe na minha clínica? E esse Profissional ID 2, é falso?".
    Se não existirem, bloqueia o agendamento! Só salva (commit) com tudo verificado.
    """
    patient = await db.get(Patient, appointment.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    professional = await db.get(Professional, appointment.professional_id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")

    db_appt = Appointment(**appointment.model_dump())
    db.add(db_appt)
    await db.commit()
    await db.refresh(db_appt)
    
    return db_appt


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: int, 
    appointment_update: AppointmentUpdate, 
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta é a "Borracha Mágica do Agendamento". Se erraram o dia e quiserem reagendar ou trocar o psiquiatra, usam isso aqui para Atualizar os dados.
    No final, ela devolve a cópia atualizada já usando o nosso tradutor de dicionário pra mostrar as novas infos na tela pro usuário na mesma hora, assim ele sente que o sistema respondeu instantaneamente.
    """
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    db_appt = result.scalars().first()
    
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # exclude_unset=True previne a sobrescrita por campos Nulos não preenchidos no form do frontend
    for key, value in appointment_update.model_dump(exclude_unset=True).items():
        setattr(db_appt, key, value)
        
    await db.commit()

    # Recarrega com os relacionamentos para que a resposta contenha os nomes associados
    stmt2 = _query_with_relations().where(Appointment.id == appointment_id)
    result2 = await db.execute(stmt2)
    updated_appt = result2.scalars().first()

    if not updated_appt:
        raise HTTPException(status_code=500, detail="Erro interno ao recarregar agendamento.")
    return _appointment_to_dict(updated_appt)


@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta é a "Função Detonadora".
    Cedeu ao paciente? Cancelou tudo para vida toda? Ela pega o agendamento lá no fundo da gaveta e manda pra lixeira permanentemente (delete). 
    Se o agendamento já não tava nem lá, ela avisa com o clássico Erro 404.
    """
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    appt = result.scalars().first()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    await db.delete(appt)
    await db.commit()
    
    return {"message": "Appointment deleted successfully"}
