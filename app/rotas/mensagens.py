"""
Rotas de Mensagens de Pacientes
- Envio de mensagem (autenticado por CPF + senha do paciente)
- Listagem de mensagens (com filtro por profissional)
- Contagem de não lidas
- Marcar como lida
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.database import AsyncSession, get_db
from app.models import Patient, PatientMessage
from app.schemas import PatientMessageCreate, PatientMessageResponse
from app.auth import verify_password
from app.email_utils import send_patient_message_notification

router = APIRouter(prefix="/api", tags=["Mensagens de Pacientes"])


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DO PORTAL DO PACIENTE (ENVIO)
# ═════════════════════════════════════════════════════════════════════

@router.post("/patient-contact")
async def send_patient_message(message_data: PatientMessageCreate, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' (async def) de Caixa de Correio do Paciente.
    Como o paciente NÃO possui um sistema de login clássico, o computador atua como um Porteiro ranzinza: Ele exige obrigatoriamente que o paciente forneça seu "CPF" e sua "Senha" preenchidos no formulário da mensagem na hora do envio.
    O Porteiro vê se a senha está correta. Se estiver falso, barra (Erro 401).
    Se estiver tudo OK, guarda a mensagem no arquivo. De bônus, notifica o "Carteiro Interno" (sen_patient_message_notification) para mandar um e-mail pro Psicólogo com o recado: "Você tem nova mensagem lá no sistema!".
    """
    stmt = select(Patient).options(selectinload(Patient.professional)).where(Patient.cpf == message_data.cpf)
    result = await db.execute(stmt)
    patient = result.scalars().first()

    if not patient or not patient.hashed_password or not verify_password(message_data.password, patient.hashed_password):
        raise HTTPException(status_code=401, detail="CPF ou senha inválidos")
        
    if not patient.professional_id:
        raise HTTPException(status_code=400, detail="Paciente não possui um profissional vinculado para receber mensagens")

    db_msg = PatientMessage(
        patient_id=patient.id, 
        professional_id=patient.professional_id, 
        message=message_data.message
    )
    db.add(db_msg)
    await db.commit()

    # --- Notifica o profissional por e-mail (em background) ---
    if patient.professional and patient.professional.email:
        await send_patient_message_notification(
            db=db, 
            professional_email=patient.professional.email, 
            professional_name=patient.professional.name, 
            patient_name=patient.name
        )

    return {"message": "Mensagem enviada com sucesso"}


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DO DASHBOARD (LEITURA E GERENCIAMENTO)
# ═════════════════════════════════════════════════════════════════════

@router.get("/patient-messages", response_model=list[PatientMessageResponse])
async def list_messages(professional_id: int | None = None, db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' Carteiro Organizado (Para o Painel de Controle).
    O dono da clínica quer ver as mensagens. Ela busca todas!
    PORÉM, se passarmos um número de Filtro ('professional_id'), a chave mágica ali (query.where) tranca o sistema e devolve SÓ AS MENSAGENS daquele profissional específico, garantindo que profissionais diferentes não leiam mensagens alheias.
    Pausa: '.order_by(desc())' faz o quê? Bota as mensagens mais novas lá no alto do painel sempre (Ordem Decrescente)!
    """
    query = (
        select(PatientMessage)
        .options(selectinload(PatientMessage.patient), selectinload(PatientMessage.professional))
        .order_by(desc(PatientMessage.created_at))
    )

    if professional_id:
        query = query.where(PatientMessage.professional_id == professional_id)

    result = await db.execute(query)
    messages = result.scalars().all()
    
    return [
        {
            "id": m.id, 
            "patient_id": m.patient_id, 
            "professional_id": m.professional_id,
            "message": m.message, 
            "is_read": m.is_read,
            "patient_name": m.patient.name if m.patient else None,
            "professional_name": m.professional.name if m.professional else None,
            "created_at": m.created_at
        }
        for m in messages
    ]


@router.get("/patient-messages/unread")
async def count_unread_messages(professional_id: int | None = None, db: AsyncSession = Depends(get_db)) -> dict[str, int]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' Calculadora Rápida de Notificações.
    Sabe aquela bolinha vermelha irritante tipo no ícone do Whatsapp contendo o número de msgs não lidas? É esta função aqui que descobre ele!
    Ela faz um 'select(func.count)' perguntando ao banco: "Ei, me conta na ponta do lápis qual a quantidade onde o estado de leitura é FALSO (is_read == False)?". Retorna só o número isolado. É rapidíssimo.
    """
    query = select(func.count(PatientMessage.id)).where(PatientMessage.is_read == False)
    
    if professional_id:
        query = query.where(PatientMessage.professional_id == professional_id)
        
    count = await db.scalar(query) or 0
    return {"count": count}


@router.put("/patient-messages/{message_id}/read")
async def mark_message_as_read(message_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' Marca-Texto.
    Quando o profissional clica em "Marcar como Lido" perto daquela mensagem específica, a função simplesmente fisga a mensagem pelo seu ID no banco e altera o seu adesivo de "FALSO" para "VERDADEIRO" (msg.is_read = True).
    A bolinha vermelha da notificação da nossa função de cima apaga magicamente logo em seguida porque ele deixou de ser "Falso"!
    """
    stmt = select(PatientMessage).where(PatientMessage.id == message_id)
    result = await db.execute(stmt)
    msg = result.scalars().first()
    
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    msg.is_read = True
    await db.commit()
    
    return {"message": "Marcado como lido"}
