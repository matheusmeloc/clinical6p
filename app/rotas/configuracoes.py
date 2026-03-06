"""
Rotas de Configurações do Sistema
- Configurações SMTP (para envio de e-mails)
- Atualização de perfil do usuário logado
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.database import AsyncSession, get_db
from app.models import SystemSettings, User
from app.schemas import SystemSettingsUpdate, SystemSettingsResponse, UserUpdate
from app.auth import get_password_hash

router = APIRouter(prefix="/api", tags=["Configurações"])


# ═════════════════════════════════════════════════════════════════════
# PERFIL DO USUÁRIO
# ═════════════════════════════════════════════════════════════════════

@router.put("/users/{user_id}")
async def update_user_profile(user_id: int, user_update: UserUpdate, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função'? O "Alterador de Crachá".
    Quando um gerente logado clica em "Meu Perfil" e quer mudar seu nome ou senha, essa função entra em cena.
    Ela acha o funcionário no banco de dados e só substitui aquilo que o usuário enviou no formulário (por isso tem vários 'if' checando se "is not None"). Se enviou uma senha nova, a função mascara (hash) a senha na hora para ninguém mais descobrir. E, no fim, cola as informações novas no painel.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    db_user = result.scalars().first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
        
    if user_update.password:
        db_user.hashed_password = get_password_hash(user_update.password)
        
    if user_update.phone is not None:
        db_user.phone = user_update.phone
        
    if user_update.role_title is not None:
        db_user.role_title = user_update.role_title
        
    if user_update.crp is not None:
        db_user.crp = user_update.crp

    await db.commit()
    await db.refresh(db_user)
    
    return {
        "message": "User updated successfully", 
        "full_name": db_user.full_name,
        "phone": db_user.phone, 
        "role_title": db_user.role_title, 
        "crp": db_user.crp
    }


# ═════════════════════════════════════════════════════════════════════
# CONFIGURAÇÕES SMTP
# ═════════════════════════════════════════════════════════════════════

@router.get("/system/settings", response_model=SystemSettingsResponse)
async def get_system_settings(db: AsyncSession = Depends(get_db)) -> SystemSettings:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' (async def) Leitor do Quadro de Avisos.
    O sistema inteiro usa e-mails. Este pedaço de código busca as "Chaves do Carteiro" (email e senha) globais. 
    Detalhe interessante: Se não houver configuração salva ainda (o banco está limpo), ele não dá erro (Crash), ele inteligentemente "Cria" uma linha em branco zerada no banco (SystemSettings()) e devolve pra tela, para o administrador preencher pela primeira vez.
    """
    stmt = select(SystemSettings).order_by(SystemSettings.id)
    result = await db.execute(stmt)
    settings = result.scalars().first()
    
    if not settings:
        settings = SystemSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return settings


@router.put("/system/settings", response_model=SystemSettingsResponse)
async def update_system_settings(settings_update: SystemSettingsUpdate, db: AsyncSession = Depends(get_db)) -> SystemSettings:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    A 'função' Gravadora do Quadro de Avisos.
    O administrador trocou a senha do E-mail GMail da clínica na tela de sistema. Aqui, nós pegamos essa alteração e salvamos em definitivo.
    Se não tinha configurações anteriores, ele cria uma do zero preenchida (`SystemSettings(**...)`). Se já existia, ele usa a mágica do Python 'exclude_unset' num loop FOR para atualizar somente os campos modificados e preservar os campos intocados do banco.
    """
    stmt = select(SystemSettings).order_by(SystemSettings.id)
    result = await db.execute(stmt)
    settings = result.scalars().first()

    if not settings:
        settings = SystemSettings(**settings_update.model_dump())
        db.add(settings)
    else:
        for key, value in settings_update.model_dump(exclude_unset=True).items():
            setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    
    return settings
