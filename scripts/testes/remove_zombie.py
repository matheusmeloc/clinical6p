"""
Script de Teste/Apoio: remove_zombie.py

Elimina processos ou registros zumbis (threads presas, conexões soltas) que
ficam ativos residuais após falhas em testes.
"""
import asyncio
from app.database import SessionLocal, engine
from app.models import User
from sqlalchemy.future import select

async def clean_zombie():
    async with SessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "matheumelo@gmail.com"))
        user = result.scalars().first()
        if user:
            print("Deleting zombie user:", user.email)
            await db.delete(user)
            await db.commit()
            print("Successfully deleted!")
        else:
            print("No zombie user found.")

if __name__ == "__main__":
    asyncio.run(clean_zombie())
