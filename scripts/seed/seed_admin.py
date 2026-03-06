"""
Script de População (Seed): seed_admin.py

Versão alternativa ou complementar para popular o sistema com as credenciais
de administrador.
"""
import asyncio
from app.database import SessionLocal, engine, Base
from app.models import User
from app.auth import get_password_hash
from sqlalchemy.future import select

async def seed_admin():
    async with engine.begin() as conn:
        # Garante que as tabelas sejam criadas no banco remoto caso ainda não existam
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@admin.com"))
        user = result.scalars().first()
        if not user:
            print("Creating default admin account: admin@admin.com / admin")
            admin_user = User(
                email="admin@admin.com",
                hashed_password=get_password_hash("admin"),
                full_name="Administrador do Sistema",
                role="admin"
            )
            db.add(admin_user)
            await db.commit()
            print("Admin created successfully!")
        else:
            print("Admin already exists!")

if __name__ == "__main__":
    asyncio.run(seed_admin())
