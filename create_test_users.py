import asyncio
from app.database import SessionLocal
from app.models import User, Professional, Patient
from app.auth import get_password_hash
from sqlalchemy import select

async def create_users():
    async with SessionLocal() as db:
        prof_pass = get_password_hash("psico123")
        pat_pass = get_password_hash("paciente123")

        # 1. Check/Create User First
        res = await db.execute(select(User).where(User.email == "psico@teste.com"))
        user = res.scalars().first()
        if not user:
            user = User(
                email="psico@teste.com",
                hashed_password=prof_pass,
                full_name="Dra. Psicóloga Teste",
                role="user"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # 2. Check/Create Professional with SAME ID
        res = await db.execute(select(Professional).where(Professional.id == user.id))
        prof = res.scalars().first()
        if not prof:
            prof = Professional(
                id=user.id,
                name="Dra. Psicóloga Teste",
                email="psico@teste.com",
                role="Psicólogo",
                professional_register="CRP 12/3456",
                specialty="TCC",
            )
            db.add(prof)
            await db.commit()
            await db.refresh(prof)

        # 3. Create Patients
        pat1_cpf = "111.111.111-11"
        res = await db.execute(select(Patient).where(Patient.cpf == pat1_cpf))
        if not res.scalars().first():
            pat1 = Patient(
                name="Paciente João (Online)",
                cpf=pat1_cpf,
                professional_id=prof.id,
                hashed_password=pat_pass,
                care_modality="Online"
            )
            db.add(pat1)

        pat2_cpf = "222.222.222-22"
        res = await db.execute(select(Patient).where(Patient.cpf == pat2_cpf))
        if not res.scalars().first():
            pat2 = Patient(
                name="Paciente Maria (Presencial)",
                cpf=pat2_cpf,
                professional_id=prof.id,
                hashed_password=pat_pass,
                care_modality="Presencial"
            )
            db.add(pat2)

        await db.commit()
        print(f"Users created! Prof ID: {prof.id}, User ID: {user.id}")

if __name__ == "__main__":
    asyncio.run(create_users())
