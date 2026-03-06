"""
Script de Teste: test_endpoint_sim.py

Simula a chamada a diversos endpoints da API de forma isolada, gerando
cargas ou requisições sintéticas para avaliar resposta.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.config import settings
from app.models import User
from app.auth import get_password_hash
from app.email_utils import send_forgot_password_email

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        # 1. Fetch User
        result = await session.execute(select(User).where(User.email == "matheumelo@gmail.com"))
        user = result.scalars().first()
        
        if user:
            print("Found user! Saving fake temp password and committing...")
            user.hashed_password = get_password_hash("1234")
            await session.commit()
            print("Commit successful.")
            
            # 2. Call send_forgot_password_email exactly as main.py does
            print("Attempting to send email...")
            success = await send_forgot_password_email(session, "matheumelo@gmail.com", False, "matheumelo@gmail.com", "1234")
            print(f"Email Dispatch Returned: {success}")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(main())
