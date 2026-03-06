"""
Script de Depuração: check_prod_db.py

Este script verifica a conexão e o estado do banco de dados de produção.
Ele garante que o banco principal está acessível e operante.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.config import settings
from app.models import User, SystemSettings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        # Check settings
        result_settings = await session.execute(select(SystemSettings).order_by(SystemSettings.id))
        sys_settings = result_settings.scalars().first()
        if sys_settings:
            print(f"SystemSettings: SMTP={sys_settings.smtp_server}:{sys_settings.smtp_port} User={sys_settings.smtp_username}")
        else:
            print("SystemSettings is empty!")

        # Check users
        result_users = await session.execute(select(User))
        users = result_users.scalars().all()
        print("\nUSERS:")
        for u in users:
            print(f"- ID: {u.id}, Email: {u.email}, Role: {u.role}")
            print(f"  Hash: {u.hashed_password}")

if __name__ == "__main__":
    asyncio.run(main())
