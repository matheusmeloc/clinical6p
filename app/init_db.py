import asyncio
from app.database import engine, Base
from app.models import User, Professional, Patient, Appointment, Prescription, Certificate, ClinicSettings

async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
