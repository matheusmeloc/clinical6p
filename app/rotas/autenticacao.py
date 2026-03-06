"""
Rotas de Autenticação
- Login (email para funcionários, CPF para pacientes)
- Recuperação de senha (esqueci minha senha)
"""

import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from pydantic import BaseModel

from app.database import AsyncSession, get_db
from app.models import User, Patient
from app.auth import verify_password, get_password_hash
from app.schemas import ForgotPasswordRequest
from app.email_utils import send_forgot_password_email


router = APIRouter(prefix="/api", tags=["Autenticação"])


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
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que esta 'função' (async def) faz? Pense nela como o "Segurança" na porta da clínica digital.
    Nós (a interface de login) entregamos a ele o bilhete da pessoa (o request) contendo o "e-mail/CPF" e a "Senha secreta".
    1. O segurança primeiro pega a prancheta de 'Funcionários' (Users) e tenta achar aquele e-mail. Se achar, testa a senha na roleta.
    2. Se não achar nos funcionários, ele pega a prancheta de 'Pacientes' e procura aquele CPF. Se achar, testa a senha na roleta.
    3. Se tudo bater e a pessoa estiver 'Ativa', ele permite a entrada e devolve o crachá de identificação virtual da pessoa (um dict com o nome, email, id e role). Se não, expulsa a pessoa avisando: erro 401 (Proibido a Entrada).
    """
    email_or_cpf = request.email.strip()
    password = request.password.strip()

    # --- Tenta login como funcionário (tabela Users) ---
    stmt_user = select(User).where(User.email == email_or_cpf)
    result_user = await db.execute(stmt_user)
    user = result_user.scalars().first()

    if user:
        if not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Usuário inativo")
        
        return {
            "id": user.id, 
            "email": user.email, 
            "full_name": user.full_name, 
            "role": user.role
        }

    # --- Tenta login como paciente (tabela Patients) ---
    stmt_patient = select(Patient).where(Patient.cpf == email_or_cpf)
    result_patient = await db.execute(stmt_patient)
    patient = result_patient.scalars().first()

    if patient and patient.hashed_password:
        if not verify_password(password, patient.hashed_password):
            raise HTTPException(status_code=401, detail="CPF ou senha incorretos")
        if patient.status != "Ativo":
            raise HTTPException(status_code=403, detail="Paciente inativo")
        
        return {
            "id": patient.id, 
            "email": patient.cpf, 
            "full_name": patient.name, 
            "role": "patient"
        }

    # Se não encontrou em nenhuma das tabelas ou a senha do paciente está vazia
    raise HTTPException(status_code=401, detail="Conta não encontrada ou senha incorreta")


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
        await db.commit()
        await send_forgot_password_email(
            db=db, 
            email=email, 
            is_patient=False, 
            login_id=email, 
            temp_password=temp_pwd
        )
        return {"message": "Uma senha provisória foi enviada para o seu e-mail."}

    # --- Verifica se o e-mail pertence a um paciente ---
    stmt_patient = select(Patient).where(Patient.email == email)
    result_patient = await db.execute(stmt_patient)
    patient = result_patient.scalars().first()
    
    if patient:
        temp_pwd = secrets.token_urlsafe(8)
        patient.hashed_password = get_password_hash(temp_pwd)
        await db.commit()
        await send_forgot_password_email(
            db=db, 
            email=email, 
            is_patient=True, 
            login_id=patient.cpf or "Não cadastrado", 
            temp_password=temp_pwd
        )
        return {"message": "Uma senha provisória foi enviada para o seu e-mail."}

    # Retorna erro genérico se o e-mail não foi achado para evitar vazamento de dados, 
    # mas informando que não existe no sistema.
    raise HTTPException(status_code=404, detail="E-mail não encontrado no sistema.")
