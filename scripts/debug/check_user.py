"""
Script de Depuração: check_user.py

Este script permite inspecionar isoladamente as informações de um usuário
específico no banco de dados para fins de solução de problemas.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.config import settings
from app.models import User
from app.auth import get_password_hash, verify_password

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        result_users = await session.execute(select(User).where(User.email == "matheumelo@gmail.com"))
        user = result_users.scalars().first()
        
        if user:
            print(f"User: {user.email}")
            print(f"Is Active: {user.is_active}")
            print(f"Role: {user.role}")
            print(f"Hashed Password: {user.hashed_password}")
            print(f"Verifies against '1234'? {verify_password('1234', user.hashed_password)}")
            print(f"Verifies against 'admin'? {verify_password('admin', user.hashed_password)}")
        else:
            print("User not found!")

if __name__ == "__main__":
    asyncio.run(main())
