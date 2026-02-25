from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,  # Set to False in production
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session
