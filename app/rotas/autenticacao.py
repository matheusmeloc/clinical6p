"""
Rotas de Autenticação
- Login (email para funcionários, CPF para pacientes)
- Recuperação de senha (esqueci minha senha)
"""

import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from pydantic import BaseModel

from app.database import AsyncSession, get_db
from app.models import User, Patient
from app.auth import verify_password, get_password_hash, create_access_token
from app.schemas import ForgotPasswordRequest
from app.email_utils import send_forgot_password_email


router = APIRouter(prefix="/api", tags=["Autenticação"])
logger = logging.getLogger(__name__)


# ═════════════════════════════════════════════════════════════════════
# SCHEMAS LOCAIS
# ═════════════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    """
    Corpo JSON esperado para a requisição de login.
    """
    email: str
    password: str


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DE AUTENTICAÇÃO
# ═════════════════════════════════════════════════════════════════════

@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    try:
        email_or_cpf = body.email.strip()
        password = body.password.strip()

        # --- Tenta login como funcionário (tabela Users) ---
        stmt_user = select(User).where(User.email == email_or_cpf)
        result_user = await db.execute(stmt_user)
        user = result_user.scalars().first()

        if user:
            if not user.is_active:
                raise HTTPException(status_code=403, detail="Usuário inativo. Contate o administrador.")
            if not verify_password(password, user.hashed_password):
                raise HTTPException(status_code=401, detail="Senha incorreta.")
            token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
            return {
                "access_token": token,
                "token_type": "bearer",
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
            }

        # --- Tenta login como paciente (tabela Patients) ---
        stmt_patient = select(Patient).where(Patient.cpf == email_or_cpf)
        result_patient = await db.execute(stmt_patient)
        patient = result_patient.scalars().first()

        if patient and patient.hashed_password:
            if patient.status != "Ativo":
                raise HTTPException(status_code=403, detail="Paciente inativo. Contate a clínica.")
            if not verify_password(password, patient.hashed_password):
                raise HTTPException(status_code=401, detail="Senha incorreta.")
            token = create_access_token({"sub": str(patient.id), "email": patient.cpf, "role": "patient"})
            return {
                "access_token": token,
                "token_type": "bearer",
                "id": patient.id,
                "email": patient.cpf,
                "full_name": patient.name,
                "role": "patient",
            }

        raise HTTPException(status_code=404, detail="E-mail ou CPF não encontrado no sistema.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado no login: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Erro de conexão com o banco de dados: {type(e).__name__}: {e}")


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' atua como o Balcão de Recuperação de Senhas.
    A pessoa entrega apenas o e-mail dela.
    
    1. A função procura esse e-mail no Banco de Dados.
    2. Se a pessoa existir na lista, o computador inventa uma senha maluca e provisória (usando a função secrets), e em seguida criptografa ela pra ficar ilegível pra nós, e finalmente substitui a senha velha esquecida.
    3. Por último, ele pega o papelzinho da nova senha em texto legível, e entrega ao nosso carteiro eletrônico (função _enviar_email) para que despache para o correio de quem pediu!
    """
    email = request.email.strip()

    # --- Verifica se o e-mail pertence a um funcionário ---
    stmt_user = select(User).where(User.email == email)
    result_user = await db.execute(stmt_user)
    user = result_user.scalars().first()
    
    if user:
        temp_pwd = secrets.token_urlsafe(8)
        user.hashed_password = get_password_hash(temp_pwd)
        # Envia o e-mail ANTES de commitar: se o envio falhar, o banco não é alterado
        email_sent = await send_forgot_password_email(
            db=db,
            email=email,
            is_patient=False,
            login_id=email,
            temp_password=temp_pwd
        )
        if not email_sent:
            await db.rollback()
            raise HTTPException(
                status_code=502,
                detail="Falha ao enviar e-mail. A senha não foi alterada. Tente novamente."
            )
        await db.commit()
        return {"message": "Uma senha provisória foi enviada para o seu e-mail."}

    # --- Verifica se o e-mail pertence a um paciente ---
    stmt_patient = select(Patient).where(Patient.email == email)
    result_patient = await db.execute(stmt_patient)
    patient = result_patient.scalars().first()

    if patient:
        temp_pwd = secrets.token_urlsafe(8)
        patient.hashed_password = get_password_hash(temp_pwd)
        email_sent = await send_forgot_password_email(
            db=db,
            email=email,
            is_patient=True,
            login_id=patient.cpf or "Não cadastrado",
            temp_password=temp_pwd
        )
        if not email_sent:
            await db.rollback()
            raise HTTPException(
                status_code=502,
                detail="Falha ao enviar e-mail. A senha não foi alterada. Tente novamente."
            )
        await db.commit()
        return {"message": "Uma senha provisória foi enviada para o seu e-mail."}

    # Retorna erro genérico se o e-mail não foi achado para evitar vazamento de dados, 
    # mas informando que não existe no sistema.
    raise HTTPException(status_code=404, detail="E-mail não encontrado no sistema.")
