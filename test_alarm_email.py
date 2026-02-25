import asyncio
from datetime import datetime, timedelta, date, time
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database import engine, Base, SessionLocal
from app.models import Appointment, Patient, Professional
from app.config import settings

async def main():
    async with SessionLocal() as session:
        # 1. Create a dummy professional with a valid email for testing
        prof = Professional(
            name="Test Psychologist",
            email="test_psychologist@example.com",
            role="Psicólogo",
            status="Ativo"
        )
        session.add(prof)
        await session.flush()

        # 2. Create a dummy patient
        pat = Patient(
            name="Test Patient",
            status="Ativo"
        )
        session.add(pat)
        await session.flush()

        # 3. Create an appointment exactly 15 minutes from now
        now = datetime.now()
        future_time = now + timedelta(minutes=15)
        
        appt = Appointment(
            patient_id=pat.id,
            professional_id=prof.id,
            date=future_time.date(),
            time=future_time.time(),
            type="Primeira Consulta",
            status="Confirmado",
            alarm_sent=False
        )
        session.add(appt)
        await session.commit()
        
        print(f"Created appointment ID {appt.id} for {future_time.date()} at {future_time.time()}")
        print("Starting the alarm task once manually to see if it processes this appointment...")
        
        # 4. Trigger the equivalent of the background task exactly once
        
        from app.main import appointment_alarm_task
        lookahead_time = datetime.now() + timedelta(minutes=30)
        
        stmt = select(Appointment).where(
            and_(
                Appointment.date == now.date(),
                Appointment.alarm_sent == False,
                Appointment.status != "Cancelado"
            )
        )
        result = await session.execute(stmt)
        appointments = result.scalars().all()
        
        processed = 0
        from app.email_utils import send_appointment_alarm
        for a in appointments:
            a_datetime = datetime.combine(a.date, a.time)
            if now <= a_datetime <= lookahead_time:
                patient = await session.get(Patient, a.patient_id)
                professional = await session.get(Professional, a.professional_id)
                
                print(f"Found appointment {a.id} for {patient.name} with {professional.name}.")
                if professional and professional.email:
                    print(f"Attempting to send email to: {professional.email}")
                    success = await send_appointment_alarm(
                        professional_email=professional.email,
                        professional_name=professional.name,
                        patient_name=patient.name if patient else "Desconhecido",
                        date_str=a.date.strftime("%d/%m/%Y"),
                        time_str=a.time.strftime("%H:%M")
                    )
                    print(f"Email success result: {success}")
                    if success:
                        a.alarm_sent = True
                        session.add(a)
                else:
                    print("Professional missing email.")
                processed += 1
                
        await session.commit()
        print(f"Manually processed {processed} appointments via test script.")

if __name__ == "__main__":
    asyncio.run(main())
