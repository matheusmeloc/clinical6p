"""
Script de Depuração: dump_tables.py

Extrai e exibe o conteúdo das tabelas do banco de dados.
Utilizado para visualizar a estrutura e os registros salvos durante o desenvolvimento.
"""
import asyncio
from app.database import SessionLocal
from app.models import Professional, User
from sqlalchemy.future import select

async def run():
    async with SessionLocal() as db:
        print("=== USERS ===")
        r1 = await db.execute(select(User))
        for u in r1.scalars().all():
            print(u.id, u.email, u.role)
        
        print("\n=== PROFESSIONALS ===")
        r2 = await db.execute(select(Professional))
        for p in r2.scalars().all():
            print(p.id, p.name, p.email, p.status)

if __name__ == "__main__":
    asyncio.run(run())
