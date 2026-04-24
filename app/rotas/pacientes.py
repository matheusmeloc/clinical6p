"""
Rotas de Pacientes
- Listar, buscar, criar, atualizar pacientes
- Geração automática de senha + envio de e-mail de boas-vindas
"""

import secrets
from typing import Any
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.database import AsyncSession, get_db
from app.models import Patient
from app.schemas import PatientCreate, PatientUpdate
from app.auth import get_password_hash
from app.email_utils import bg_send_patient_welcome_email


router = APIRouter(prefix="/api/patients", tags=["Pacientes"])


# ═════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═════════════════════════════════════════════════════════════════════

def _patient_to_dict(p: Patient) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função' (def)? É um Tradutor Simples!
    O Banco de Dados nos devolve um objeto "Pesado" (uma Classe com superpoderes internos). 
    Mas a Internet (a tela do site) gosta de receber pacotes simples e organizados, os Dicionários (JSON).
    Então o tradutor tira cada pecinha do objeto gigante (ex: p.name) e coloca numa caixinha arrumada pra viajar pela rede.
    """
    return {
        "id": p.id, 
        "name": p.name, 
        "cpf": p.cpf, 
        "birth_date": p.birth_date,
        "gender": p.gender, 
        "marital_status": p.marital_status, 
        "profession": p.profession,
        "phone": p.phone, 
        "email": p.email,
        "address_cep": p.address_cep, 
        "address_street": p.address_street,
        "address_number": p.address_number, 
        "address_complement": p.address_complement,
        "address_neighborhood": p.address_neighborhood, 
        "address_city": p.address_city,
        "address_state": p.address_state,
        "care_modality": p.care_modality, 
        "attendance_type": p.attendance_type,
        "insurance_plan": p.insurance_plan, 
        "insurance_number": p.insurance_number,
        "insurance_expiration_date": p.insurance_expiration_date,
        "emergency_contact_name": p.emergency_contact_name,
        "emergency_contact_phone": p.emergency_contact_phone,
        "emergency_contact_relation": p.emergency_contact_relation,
        "consent_terms_accepted": p.consent_terms_accepted,
        "professional_id": p.professional_id,
        "professional_name": p.professional.name if getattr(p, 'professional', None) else None,
        "status": p.status, 
        "observations": p.observations, 
        "created_at": p.created_at,
    }


async def _reload_with_professional(db: AsyncSession, patient_id: int) -> Patient | None:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' (async def) busca um paciente, mas ela tem o poder de "Junção" (join).
    Sem ela, o banco ia dizer: "O João é paciente do profissional ID 3".
    Com ela, o banco entra na outra gaveta do arquivo e já devolve completo: "O João é paciente da Dra. Maria (ID 3)".
    """
    stmt = select(Patient).options(selectinload(Patient.professional)).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    return result.scalars().first()


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DE PACIENTES
# ═════════════════════════════════════════════════════════════════════

@router.get("")
async def list_patients(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que esta 'função' faz? É o "Atendente do Arquivo Médico".
    Quando a tela de Pacientes do site carrega, ela chama essa função.
    O atendente vai lá, pega os primeiros 100 pacientes na pasta (limit), passa eles pelo Tradutor (acima) e devolve a listona pronta pra ser desenhada na tabela da tela!
    """
    stmt = select(Patient).options(selectinload(Patient.professional)).offset(skip).limit(limit).order_by(Patient.id)
    result = await db.execute(stmt)
    patients = result.scalars().all()
    
    return [_patient_to_dict(p) for p in patients]


@router.get("/{patient_id}")
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' é chamada quando queremos abrir a "Ficha de Detalhes" de UM único paciente que já clicamos na tela.
    Pega o número dele (ID), busca a pasta correspondente. Se não existir, responde Erro 404 (Falha - Não encontrado).
    """
    patient = await _reload_with_professional(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return _patient_to_dict(patient)


@router.post("")
async def create_patient(
    patient_schema: PatientCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' atua como a "Recepcionista de Cadastro Inicial".
    A secretária preencheu o formulário e apertou Salvar.
    
    1. Se ela digitou um CPF e E-mail, mas não botou "Senha" pro paciente, o nosso computador inteligente cria uma senha secreta de 8 letras aleatórias.
    2. Logo em seguida, ele passa na criptografia (Hash) pra esconder isso, e guarda o paciente na gaveta (banco).
    3. Para finalizar, sussurra pro Carteiro Eletrônico mandar um e-mail de Boas-Vindas mostrando o CPF e a Senha que ele acabou de inventar! Assim o paciente já sabe como entrar no Portal dele (quando existir um no futuro).
    """
    patient_data = patient_schema.model_dump()
    raw_password = patient_data.get("password")

    # --- Gera senha automática se o paciente tem email e CPF mas não informou senha ---
    # token_urlsafe(16) gera ~128 bits de entropia — atende NIST SP 800-63B
    if not raw_password and patient_data.get("email") and patient_data.get("cpf"):
        raw_password = secrets.token_urlsafe(16)

    # --- Se a senha final existir, aplica o Hash ---
    if raw_password:
        patient_data["hashed_password"] = get_password_hash(raw_password)
        
    # Remove a senha em texto plano do dict antes de gravar
    patient_data.pop("password", None)

    # --- Salva no banco de dados ---
    db_patient = Patient(**patient_data)
    db.add(db_patient)
    try:
        await db.commit()
        await db.refresh(db_patient)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="CPF ou e-mail já cadastrado.")

    # Dispara e-mail de boas-vindas em background — response retorna imediatamente
    if raw_password and patient_data.get("email") and patient_data.get("cpf"):
        background_tasks.add_task(
            bg_send_patient_welcome_email,
            patient_data["email"],
            patient_data["name"],
            patient_data["cpf"],
            raw_password,
        )

    # Retorna os dados completos do paciente recarregados para conter eventuais relacionamentos default
    new_patient = await _reload_with_professional(db, int(str(db_patient.id)))
    # O novo paciente não deve ser None aqui
    if new_patient:
        return _patient_to_dict(new_patient)
    else:
        raise HTTPException(status_code=500, detail="Error fetching newly created patient")


@router.put("/{patient_id}")
async def update_patient(
    patient_id: int, 
    patient_update: PatientUpdate, 
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' é a "Central de Edição".
    Quando o paciente muda de telefone ou a secretária escolheu o convênio errado e quer corrigir, é essa máquina que pega a ficha nova e joga lá.
    Se a ficha nova contém um pedido para alterar a senha, ela primeiro criptografa a senha na engrenagem de Hash para não salvar desprotegida.
    """
    stmt = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    db_patient = result.scalars().first()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # exclude_unset=True previne que campos não enviados na requisição sobrescrevam os dados com None
    update_data = patient_update.model_dump(exclude_unset=True)

    # --- Atualização da senha (se enviada) ---
    if "password" in update_data:
        raw_pwd = update_data.pop("password")
        if raw_pwd:
            update_data["hashed_password"] = get_password_hash(raw_pwd)

    # --- Atualiza o objeto do SQLAlchemy ---
    for key, value in update_data.items():
        setattr(db_patient, key, value)

    await db.commit()
    await db.refresh(db_patient)
    
    updated_patient = await _reload_with_professional(db, patient_id)
    if updated_patient:
        return _patient_to_dict(updated_patient)
    else:
        raise HTTPException(status_code=500, detail="Error fetching updated patient")
