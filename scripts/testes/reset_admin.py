"""
Script de Teste/Apoio: reset_admin.py

Redefine as credenciais do administrador para o padrão, facilitando
a automação dos fluxos de teste no login.
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
        result_users = await session.execute(select(User).where(User.email == "admin@admin.com"))
        user = result_users.scalars().first()
        
        if user:
            print("Found admin user! Resetting password to 'admin'")
            user.hashed_password = get_password_hash("admin")
            await session.commit()
            print("Password reset successful!")
        else:
            print("Admin user not found!")

if __name__ == "__main__":
    asyncio.run(main())
