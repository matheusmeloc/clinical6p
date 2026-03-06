"""
Script de Migração: migrate_settings.py

Migração de sistema focada em configurações.
Transfere definições globais ou preferências de usuários para o novo padrão adotado.
"""
import asyncio
import logging
from app.database import engine, Base
from app.models import SystemSettings # Importa para garantir o registro no SQLAlchemy Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate():
    logger.info("Starting settings migration...")
    async with engine.begin() as conn:
        # Create all tables (will only create missing ones)
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Settings migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
