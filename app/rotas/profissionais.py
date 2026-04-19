"""
Rotas de Profissionais
- Listar, criar, atualizar, deletar profissionais
- Cria um User associado para login ao criar um profissional
"""

import logging
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database import AsyncSession, get_db
from app.models import Professional, User
from app.schemas import ProfessionalCreate, ProfessionalUpdate, ProfessionalResponse
from app.auth import get_password_hash
from app.email_utils import bg_send_professional_welcome_email

router = APIRouter(prefix="/api/professionals", tags=["Profissionais"])
logger = logging.getLogger(__name__)


# ═════════════════════════════════════════════════════════════════════
# ENDPOINTS DE PROFISSIONAIS
# ═════════════════════════════════════════════════════════════════════

@router.get("", response_model=list[ProfessionalResponse])
async def list_professionals(db: AsyncSession = Depends(get_db)) -> list[Professional]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que esta 'função' faz? Ela simplesmente abre a "Lista Telefônica" da clínica.
    Filtra todos os profissionais, organiza em ordem alfabética de A a Z e entrega para o painel desenhar a tabela.
    """
    stmt = select(Professional).order_by(Professional.name)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=ProfessionalResponse)
async def create_professional(
    professional: ProfessionalCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Professional:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' atua como o "RH da Clínica" contratando alguém novo.
    1. Ela assina os papéis do Psicólogo e guarda na gaveta principal (Profissionais).
    2. Se o RH escolheu uma "senha" já na contratação, quer dizer que esse funcionário vai precisar acessar o sistema. Então ela também abre a gaveta de Crachás (Tabela Users), e cria um login "User" pra ele.
    3. Tudo certo? Chama o Carteiro Eletrônico pra mandar o e-mail pro cara com o e-mail dele e a senha inventada!
    """
    try:
        prof_data = professional.model_dump()
        raw_password = prof_data.pop("password", None)

        db_prof = Professional(**prof_data)
        db.add(db_prof)

        # --- Cria conta de login (User) se email e senha foram preenchidos ---
        if prof_data.get("email") and raw_password:
            new_user = User(
                email=prof_data["email"], 
                hashed_password=get_password_hash(raw_password), 
                full_name=prof_data["name"], 
                role="user"
            )
            db.add(new_user)

        await db.commit()
        await db.refresh(db_prof)

        # Dispara e-mail de boas-vindas em background — response retorna imediatamente
        if prof_data.get("email") and raw_password:
            background_tasks.add_task(
                bg_send_professional_welcome_email,
                prof_data["email"],
                prof_data["name"],
                raw_password,
            )

        return db_prof
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Professional with this email already exists or other constraint violation."
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro ao criar profissional: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.put("/{professional_id}", response_model=ProfessionalResponse)
async def update_professional(
    professional_id: int, 
    professional_update: ProfessionalUpdate, 
    db: AsyncSession = Depends(get_db)
) -> Professional:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' funciona como a "Central de Atualização Cadastral".
    Se o profissional casar e mudar de nome, ou quiser trocar o e-mail ou a própria senha:
    1. A secretária edita e manda salvar. 
    2. O computador atualiza na gaveta normal (Profissionais).
    3. Mas o espertinho aqui também corre lá na outra gaveta do sistema de segurança (Tabela Users), acha o "Crachá" antigo dele, e atualiza o e-mail/senha lá também! Assim ninguém perde a conta!
    """
    stmt = select(Professional).where(Professional.id == professional_id)
    result = await db.execute(stmt)
    db_prof = result.scalars().first()
    
    if not db_prof:
        raise HTTPException(status_code=404, detail="Professional not found")

    old_email = db_prof.email
    update_data = professional_update.model_dump(exclude_unset=True)

    raw_password = update_data.pop("password", None)
    new_email = update_data.get("email")

    # Carrega o User associado uma única vez para evitar lookups duplicados
    db_user: Optional[User] = None
    email_changing = bool(new_email and old_email and new_email != old_email)

    if email_changing:
        # Verifica se o novo e-mail já pertence a outro usuário
        stmt_check = select(User).where(User.email == new_email)
        if (await db.execute(stmt_check)).scalars().first():
            raise HTTPException(status_code=400, detail="This email is already in use by another user.")

        stmt_find = select(User).where(User.email == old_email)
        db_user = (await db.execute(stmt_find)).scalars().first()
        if db_user:
            db_user.email = new_email

    # --- Se uma nova senha foi enviada, atualiza na tabela User ---
    if raw_password:
        if db_user is None:
            # Ainda não buscamos o user — buscar agora usando o e-mail correto
            email_to_search = new_email if email_changing else old_email
            if email_to_search:
                stmt_find = select(User).where(User.email == email_to_search)
                db_user = (await db.execute(stmt_find)).scalars().first()
        if db_user:
            db_user.hashed_password = get_password_hash(raw_password)

    # --- Aplica as atualizações no lado Professional ---
    for key, value in update_data.items():
        setattr(db_prof, key, value)

    try:
        await db.commit()
        await db.refresh(db_prof)
        return db_prof
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already in use.")


@router.delete("/{professional_id}")
async def delete_professional(professional_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' é a "Tesoura de Demissão ou Cancelamento".
    Ela apaga (Delete) o registro desse profissional do sistema. Mas atenção: essa ação pode gerar erros se o cara já tiver milhares de consultas atreladas ao nome dele, pois o banco diz "Ei, ainda tem rastro do cara!".
    Por isso englobamos numa caixa de Try/Except (Tente/Capture erro) para não explodir o computador da atendente.
    """
    stmt = select(Professional).where(Professional.id == professional_id)
    result = await db.execute(stmt)
    prof = result.scalars().first()
    
    if not prof:
        raise HTTPException(status_code=404, detail="Professional not found")
        
    try:
        await db.delete(prof)
        await db.commit()
        return {"message": "Professional deleted successfully"}

    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Não é possível remover este profissional pois ele possui registros associados (consultas, receitas ou atestados)."
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Erro inesperado ao deletar profissional {professional_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao tentar remover o profissional.")
