"""
Configuração do banco de dados (SQLAlchemy Async)
- Engine assíncrona (PostgreSQL em produção, SQLite em dev)
- Sessão (SessionLocal) para acesso ao banco
- Base para definição de modelos (tabelas)
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from app.config import settings

# URL de conexão com o banco de dados
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Argumentos extras para PostgreSQL (desabilita cache de statements)
connect_args: dict = {}
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    connect_args["statement_cache_size"] = 0
    connect_args["ssl"] = True

# NullPool: cria uma conexão nova por requisição e fecha imediatamente.
# Evita o ConnectionDoesNotExistError causado por conexões obsoletas no pool.
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    poolclass=NullPool,
)

# Fábrica de sessões — cada requisição cria uma sessão isolada
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base para todos os modelos (tabelas) do sistema
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
