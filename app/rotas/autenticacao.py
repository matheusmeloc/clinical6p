"""
Rotas de Autenticação
- Login (email para funcionários, CPF para pacientes)
- Recuperação de senha (esqueci minha senha)
"""

import secrets
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from pydantic import BaseModel

from app.database import AsyncSession, get_db
from app.models import User, Patient, PasswordResetToken
from app.auth import verify_password, get_password_hash, create_access_token
from app.config import settings
from app.schemas import ForgotPasswordRequest, ResetPasswordRequest
from app.email_utils import send_reset_password_link_email


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
    Inicia o fluxo de redefinição de senha por link com token de uso único.
    Sempre retorna a mesma mensagem para evitar enumeração de e-mails cadastrados.
    """
    email = request.email.strip()
    _GENERIC_RESPONSE = {"message": "Se esse e-mail estiver cadastrado, você receberá um link de redefinição em instantes."}

    # Verifica se pertence a um funcionário ou paciente
    result_user = await db.execute(select(User).where(User.email == email))
    user = result_user.scalars().first()

    result_patient = await db.execute(select(Patient).where(Patient.email == email))
    patient = result_patient.scalars().first()

    if not user and not patient:
        # Retorna a mesma resposta genérica — não revela se o e-mail existe
        return _GENERIC_RESPONSE

    # Gera token seguro e persiste com expiração de 1 hora
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    db.add(PasswordResetToken(token=token, email=email, expires_at=expires_at))
    await db.flush()  # persiste o token sem commit ainda

    reset_link = f"{settings.APP_BASE_URL}/reset-password?token={token}"

    email_status = await send_reset_password_link_email(db=db, email=email, reset_link=reset_link)
    if email_status == "not_configured":
        await db.rollback()
        raise HTTPException(
            status_code=503,
            detail="O sistema de e-mail não está configurado. Entre em contato com o administrador."
        )
    if email_status == "error":
        await db.rollback()
        raise HTTPException(
            status_code=502,
            detail="Falha ao enviar o e-mail. Verifique as configurações de SMTP no painel e tente novamente."
        )

    await db.commit()
    return _GENERIC_RESPONSE


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """
    Redefine a senha usando o token recebido por e-mail.
    O token é de uso único e expira em 1 hora.
    """
    if len(request.new_password) < 8:
        raise HTTPException(status_code=422, detail="A nova senha deve ter pelo menos 8 caracteres.")

    # Busca e valida o token
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == request.token)
    )
    reset_token = result.scalars().first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Link inválido ou já utilizado.")
    if reset_token.used:
        raise HTTPException(status_code=400, detail="Este link já foi utilizado. Solicite um novo.")
    if datetime.utcnow() > reset_token.expires_at:
        raise HTTPException(status_code=400, detail="Este link expirou. Solicite um novo.")

    email = reset_token.email
    new_hash = get_password_hash(request.new_password)

    # Atualiza a senha do usuário ou paciente correspondente
    result_user = await db.execute(select(User).where(User.email == email))
    user = result_user.scalars().first()
    if user:
        user.hashed_password = new_hash
    else:
        result_patient = await db.execute(select(Patient).where(Patient.email == email))
        patient = result_patient.scalars().first()
        if patient:
            patient.hashed_password = new_hash
        else:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Invalida o token para uso único
    reset_token.used = True
    await db.commit()

    return {"message": "Senha redefinida com sucesso. Você já pode fazer login."}

