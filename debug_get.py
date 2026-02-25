import asyncio
from app.database import engine, AsyncSession
from app.models import Prescription, Patient, Professional
from app.schemas import PrescriptionResponse
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

async def debug_get():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as db:
        print("Executing Query...")
        try:
            result = await db.execute(select(Prescription, Patient, Professional).join(Patient).join(Professional).order_by(Prescription.date.desc()))
            
            rows = result.all()
            print(f"Found {len(rows)} rows.")

            for i, (presc, patient, professional) in enumerate(rows):
                print(f"Processing row {i}: ID={presc.id}")
                try:
                    resp = PrescriptionResponse(
                        id=presc.id,
                        patient_id=presc.patient_id,
                        professional_id=presc.professional_id,
                        medication_name=presc.medication_name,
                        dosage=presc.dosage,
                        certificate_type=presc.certificate_type,
                        date=presc.date,
                        status=presc.status,
                        patient_name=patient.name,
                        professional_name=professional.name,
                        created_at=presc.created_at
                    )
                    print("  -> Validated OK")
                except Exception as e:
                    print(f"  -> VALIDATION ERROR: {e}")
                    import traceback
                    traceback.print_exc()

        except Exception as e:
            print(f"Query/DB Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_get())
