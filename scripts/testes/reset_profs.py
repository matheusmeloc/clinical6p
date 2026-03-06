"""
Script de Teste/Apoio: reset_profs.py

Limpa e reseta os perfis de profissionais no banco, preparando o
ambiente para uma nova bateria de testes de apontamento.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.config import settings
from app.models import User
from app.auth import get_password_hash

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        result_users = await session.execute(select(User).where(User.role != "admin"))
        users = result_users.scalars().all()
        
        default_pwd = "1234"
        hashed = get_password_hash(default_pwd)
        
        if not users:
            print("No professional accounts found.")
            return

        print("Resetting passwords for the following accounts:")
        for user in users:
            print(f"- {user.email}")
            user.hashed_password = hashed
            
        await session.commit()
        print(f"\nAll professional passwords have been reset to: {default_pwd}")

if __name__ == "__main__":
    asyncio.run(main())
