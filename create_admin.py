import asyncio
from app.database import AsyncSession, get_db, engine, Base
from app.models import User
from app.auth import get_password_hash
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

async def create_admin():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("Checking for existing admin users...")
        result = await session.execute(select(User).where(User.email == "admin@example.com"))
        existing_user = result.scalars().first()

        if existing_user:
            print("Admin user 'admin@example.com' already exists.")
            return

        print("Creating new Admin user...")
        # In a real app, we might ask for input. For this setup, we'll use a default.
        email = "admin@example.com"
        password = "admin" # Simple for local dev
        hashed_password = get_password_hash(password)

        new_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name="Administrador do Sistema",
            role="admin",
            is_active=True
        )

        session.add(new_user)
        await session.commit()
        print(f"Admin created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")

if __name__ == "__main__":
    asyncio.run(create_admin())
