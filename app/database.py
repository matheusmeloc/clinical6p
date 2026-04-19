"""
Configuração do banco de dados (SQLAlchemy Async)
- Engine assíncrona (PostgreSQL em produção, SQLite em dev)
- Sessão (SessionLocal) para acesso ao banco
- Base para definição de modelos (tabelas)
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

connect_args: dict = {}
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Troca asyncpg por psycopg (psycopg3) — melhor suporte a SSL no Render
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("+asyncpg", "+psycopg")
    # sslmode=require funciona via libpq (padrão do psycopg3)
    connect_args["sslmode"] = "require"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
