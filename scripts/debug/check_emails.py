"""
Script de Depuração: check_emails.py

Este script conecta-se ao banco de dados e lista todos os e-mails cadastrados
no sistema, separando por Usuários e Pacientes.
Útil para verificar rapidamente os dados de e-mail no banco de dados.
"""
import asyncio
from app.database import SessionLocal
from app.models import User, Patient
from sqlalchemy.future import select

async def get_all_emails():
    async with SessionLocal() as db:
        print("=== USERS ===")
        result = await db.execute(select(User))
        for u in result.scalars().all():
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Hash: {u.hashed_password}")
            
        print("\n=== PATIENTS ===")
        result = await db.execute(select(Patient))
        for p in result.scalars().all():
            print(f"ID: {p.id}, Email: {p.email}")

if __name__ == "__main__":
    asyncio.run(get_all_emails())
