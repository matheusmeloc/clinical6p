import asyncio
from sqlalchemy import select
from app.database import SessionLocal
from app.models import User, Patient

async def check():
    async with SessionLocal() as db:
        print("--- USERS (ADMIN/STAFF) ---")
        res = await db.execute(select(User))
        for u in res.scalars().all():
            print(f"Name: {u.full_name}, Email: {u.email}, Role: {u.role}")
        
        print("\n--- PATIENTS (CPF LOGIN) ---")
        res = await db.execute(select(Patient))
        for p in res.scalars().all():
            print(f"Name: {p.name}, CPF: {p.cpf}")

if __name__ == "__main__":
    asyncio.run(check())
