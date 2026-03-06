from sqlalchemy import text
import asyncio
from app.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Adicionando coluna 'photo' à tabela 'patients'...")
        try:
            await conn.execute(text("ALTER TABLE patients ADD COLUMN photo TEXT"))
            print("Sucesso!")
        except Exception as e:
            print(f"Erro ou coluna já existe: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
