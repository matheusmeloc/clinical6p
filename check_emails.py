import asyncio
from app.database import SessionLocal
from app.models import User, Patient
from sqlalchemy.future import select

async def get_all_emails():
    async with SessionLocal() as db:
        print("=== USERS ===")
        result = await db.execute(select(User))
        for u in result.scalars().all():
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}")
            
        print("\n=== PATIENTS ===")
        result = await db.execute(select(Patient))
        for p in result.scalars().all():
            print(f"ID: {p.id}, Email: {p.email}")

if __name__ == "__main__":
    asyncio.run(get_all_emails())
