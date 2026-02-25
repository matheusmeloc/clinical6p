"""Test the today/upcoming query logic directly."""
import asyncio
import sys
sys.path.insert(0, '.')

from datetime import date
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def main():
    from app.database import SessionLocal
    from app.models import Appointment

    today = date.today()
    print(f"Today: {today}")

    async with SessionLocal() as session:
        # Test today query
        result = await session.execute(
            select(Appointment).options(
                selectinload(Appointment.patient),
                selectinload(Appointment.professional)
            ).where(Appointment.date == today).order_by(Appointment.time)
        )
        appointments = result.scalars().all()
        print(f"\nToday's appointments ({len(appointments)}):")
        for a in appointments:
            print(f"  id={a.id} patient={a.patient.name if a.patient else None} time={a.time}")

    async with SessionLocal() as session:
        # Test upcoming query
        result = await session.execute(
            select(Appointment).options(
                selectinload(Appointment.patient),
                selectinload(Appointment.professional)
            ).where(Appointment.date > today).order_by(Appointment.date, Appointment.time).limit(10)
        )
        appointments = result.scalars().all()
        print(f"\nUpcoming appointments ({len(appointments)}):")
        for a in appointments:
            date_str = a.date.strftime("%d/%m") if hasattr(a.date, 'strftime') else str(a.date)[:5]
            time_str = str(a.time)[:5]
            print(f"  id={a.id} date={date_str} time={time_str} patient={a.patient.name if a.patient else None}")

asyncio.run(main())
