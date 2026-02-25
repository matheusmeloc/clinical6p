import asyncio
from datetime import date
from app.database import engine, AsyncSession
from app.models import Prescription, Patient, Professional
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

async def test_insert():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as db:
        try:
            # Check dependencies
            pat = await db.execute(select(Patient).limit(1))
            patient = pat.scalars().first()
            
            prof = await db.execute(select(Professional).limit(1))
            professional = prof.scalars().first()
            
            if not patient or not professional:
                print("Error: Need at least 1 patient and 1 professional.")
                return

            print(f"Found Patient: {patient.name}, Professional: {professional.name}")

            # Insert Prescription
            new_presc = Prescription(
                date=date.today(),
                patient_id=patient.id,
                professional_id=professional.id,
                medication_name="Test Med from Script",
                dosage="1x daily",
                certificate_type="Sem Atestado"
            )
            db.add(new_presc)
            await db.commit()
            print("Successfully inserted prescription!")
            
        except Exception as e:
            print(f"Error inserting: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(test_insert())
