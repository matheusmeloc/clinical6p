"""
Configuração do banco de dados (SQLAlchemy Async)
- Engine assíncrona (PostgreSQL em produção, SQLite em dev)
- Sessão (SessionLocal) para acesso ao banco
- Base para definição de modelos (tabelas)
"""

import ssl
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# URL de conexão com o banco de dados
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Argumentos extras para PostgreSQL
connect_args: dict = {}
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    connect_args["statement_cache_size"] = 0
    # Render PostgreSQL exige SSL mas não tem CA confiável — desabilita verificação de cert
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = _ssl_ctx

# Engine assíncrona com pool_pre_ping para rejeitar conexões fechadas pelo servidor
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
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
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função' (async def)? Pense nela como um "Porteiro" do banco de dados.
    Ela tem o prefixo "async", o que significa que é assíncrona. Ou seja, ela é inteligente: consegue abrir a porta do banco de dados e, se o banco demorar para responder, a máquina vai fazer outras coisas em vez de travar o site inteiro (como pedir uma pizza e ir assistir TV enquanto ela não chega).
    
    Sempre que uma parte do site (uma Rota) precisa buscar um paciente ou criar um usuário, ela chama o porteiro 'get_db()'.
    O porteiro empresta a "chave" (yield session) para que o sistema leia ou grave coisas. Depois que termina, a chave é devolvida com segurança.
    """
    async with SessionLocal() as session:
        yield session
