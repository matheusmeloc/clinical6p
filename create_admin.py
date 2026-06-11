#!/usr/bin/env python
"""
Script para verificar se o admin existe e criá-lo se necessário.
"""
import asyncio
from app.database import SessionLocal, engine, Base
from app.models import User
from app.auth import get_password_hash
from app.config import settings
from sqlalchemy import select
import app.models  # Carrega os modelos

async def create_admin():
    # Cria as tabelas se não existirem
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with SessionLocal() as db:
        # Verifica se o admin já existe
        result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
        admin = result.scalars().first()
        
        if admin:
            print(f"✓ Admin já existe: {admin.email}")
            return
        
        # Cria o admin
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            full_name="Administrador",
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        await db.commit()
        print(f"✓ Admin criado com sucesso: {settings.ADMIN_EMAIL}")
        print("  Senha definida conforme ADMIN_PASSWORD no .env")

if __name__ == "__main__":
    asyncio.run(create_admin())
