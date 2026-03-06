"""
Script de Depuração: list_all.py

Lista todos os registros de uma ou mais tabelas principais.
Script generalista para visão geral rápida dos dados (pacientes, usuários, consultas etc).
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.config import settings
from app.models import User, Patient

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        print("--- USERS ---")
        result_users = await session.execute(select(User))
        for u in result_users.scalars().all():
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}")
            
        print("\n--- PATIENTS ---")
        result_patients = await session.execute(select(Patient))
        for p in result_patients.scalars().all():
            print(f"ID: {p.id}, Name: {p.name}, CPF: {p.cpf}, Email: {p.email}")

if __name__ == "__main__":
    asyncio.run(main())
