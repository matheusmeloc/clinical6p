"""
conftest.py — Fixtures compartilhadas para toda a suite de testes.

Usa SQLite :memory: via aiosqlite para isolamento total do banco de dados de produção.
O override de get_db é aplicado no app FastAPI antes de cada teste.

Estratégia de isolamento:
1. As variáveis de ambiente são sobrescritas ANTES de qualquer import do app.
2. O lifespan original (que conecta ao banco de produção e inicia a task de alarme)
   é substituído por um lifespan no-op durante os testes.
3. O diretório "static/" é criado temporariamente se não existir, pois main.py
   monta StaticFiles no nível de módulo.
4. O get_db é substituído via dependency_overrides para apontar ao banco de testes.
"""

import os
import sys
import pytest
import pytest_asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncGenerator

# ─────────────────────────────────────────────────────────────────────
# Variáveis de ambiente ANTES de qualquer import do app
# ─────────────────────────────────────────────────────────────────────
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "480"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:8000"
os.environ["ENABLE_DEBUG"] = "false"
os.environ["SMTP_SERVER"] = ""
os.environ["SMTP_PORT"] = "587"
os.environ["SMTP_USERNAME"] = ""
os.environ["SMTP_PASSWORD"] = ""
os.environ["SMTP_FROM_EMAIL"] = ""

# ─────────────────────────────────────────────────────────────────────
# Garante que o diretório "static/" existe (main.py monta StaticFiles nele)
# ─────────────────────────────────────────────────────────────────────
_PROJECT_ROOT = Path(__file__).parent.parent
_STATIC_DIR = _PROJECT_ROOT / "static"
_STATIC_CREATED_BY_TEST = False

if not _STATIC_DIR.exists():
    _STATIC_DIR.mkdir(parents=True)
    _STATIC_CREATED_BY_TEST = True

import jwt
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.database import Base, get_db
from app.models import User, Professional, Patient, Appointment
from app.auth import get_password_hash

# ─────────────────────────────────────────────────────────────────────
# Engine e SessionFactory dedicados aos testes (SQLite :memory:)
# ─────────────────────────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# StaticPool força a reutilização da mesma conexão em todos os testes,
# garantindo que o banco :memory: seja compartilhado e que o padrão de
# savepoints funcione corretamente.
from sqlalchemy.pool import StaticPool

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


# ─────────────────────────────────────────────────────────────────────
# Lifespan substituto (no-op): evita conexão ao banco de produção
# e a criação da task de alarme de e-mails.
# ─────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def _test_lifespan(app):
    """Lifespan mínimo para testes — não conecta ao banco de produção."""
    yield


# ─────────────────────────────────────────────────────────────────────
# Setup / Teardown do schema por função de teste
# ─────────────────────────────────────────────────────────────────────

TestSessionFactory = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(autouse=True)
async def reset_tables():
    """Recria todas as tabelas antes de cada teste para isolamento total."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    if _STATIC_CREATED_BY_TEST and _STATIC_DIR.exists():
        try:
            _STATIC_DIR.rmdir()
        except OSError:
            pass


# ─────────────────────────────────────────────────────────────────────
# Sessão de banco por teste
# ─────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Fornece uma AsyncSession com banco limpo (recriado pelo reset_tables)."""
    async with TestSessionFactory() as session:
        yield session
        await session.rollback()


# ─────────────────────────────────────────────────────────────────────
# AsyncClient com override de get_db e lifespan no-op
# ─────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    AsyncClient com:
    - get_db substituído para usar o banco SQLite de teste
    - lifespan substituído para evitar conexão ao banco de produção
      e a task de alarme em background
    """
    from app.main import app

    original_router_lifespan = app.router.lifespan_context
    app.router.lifespan_context = _test_lifespan

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
    app.router.lifespan_context = original_router_lifespan


# ─────────────────────────────────────────────────────────────────────
# Fixtures de dados
# ─────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def admin_user(db_session: AsyncSession) -> User:
    """Cria e persiste um usuário administrador ativo."""
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("admin@1234"),
        full_name="Admin Teste",
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture()
async def inactive_user(db_session: AsyncSession) -> User:
    """Cria e persiste um usuário inativo."""
    user = User(
        email="inactive@test.com",
        hashed_password=get_password_hash("inactive@1234"),
        full_name="Inativo Teste",
        role="user",
        is_active=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture()
async def professional(db_session: AsyncSession) -> Professional:
    """Cria e persiste um profissional ativo."""
    prof = Professional(
        name="Dr. Teste",
        email="drtest@clinic.com",
        role="Psicólogo",
        status="Ativo",
    )
    db_session.add(prof)
    await db_session.commit()
    await db_session.refresh(prof)
    return prof


@pytest_asyncio.fixture()
async def patient(db_session: AsyncSession, professional: Professional) -> Patient:
    """Cria e persiste um paciente vinculado ao profissional de teste."""
    pat = Patient(
        name="Paciente Teste",
        cpf="11122233344",
        email="patient@test.com",
        hashed_password=get_password_hash("patient@1234"),
        professional_id=professional.id,
        status="Ativo",
    )
    db_session.add(pat)
    await db_session.commit()
    await db_session.refresh(pat)
    return pat


@pytest_asyncio.fixture()
async def valid_token(admin_user: User) -> str:
    """Gera um JWT válido para o usuário admin."""
    from app.auth import create_access_token
    return create_access_token(
        {"sub": str(admin_user.id), "email": admin_user.email, "role": admin_user.role}
    )


@pytest_asyncio.fixture()
async def expired_token(admin_user: User) -> str:
    """Gera um JWT já expirado."""
    payload = {
        "sub": str(admin_user.id),
        "email": admin_user.email,
        "role": admin_user.role,
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    from app.config import settings
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
