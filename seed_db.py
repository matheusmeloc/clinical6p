import asyncio
import random
from datetime import date, datetime, timedelta
from sqlalchemy import func, select
from sqlalchemy.orm import sessionmaker
from app.database import engine, Base, AsyncSession
from app.models import Professional, Patient, Appointment

# Mock Data
PROFESSIONALS = [
    {"name": "Dra. Ana Silva", "role": "Psicóloga", "specialty": "TCC", "email": "ana@clinic.com"},
    {"name": "Dr. Carlos Oliveira", "role": "Psicólogo", "specialty": "Psicanálise", "email": "carlos@clinic.com"},
    {"name": "Dra. Juliana Santos", "role": "Psicóloga", "specialty": "Psicologia Infantil", "email": "juliana@clinic.com"},
]

PATIENTS = [
    {"name": "João Souza", "age": 32, "phone": "(11) 99999-1111", "gender": "Masculino"},
    {"name": "Maria Oliveira", "age": 28, "phone": "(11) 99999-2222", "gender": "Feminino"},
    {"name": "Pedro Santos", "age": 45, "phone": "(11) 99999-3333", "gender": "Masculino"},
    {"name": "Carla Lima", "age": 35, "phone": "(11) 99999-4444", "gender": "Feminino"},
    {"name": "Lucas Pereira", "age": 29, "phone": "(11) 99999-5555", "gender": "Masculino"},
    {"name": "Fernanda Costa", "age": 41, "phone": "(11) 99999-6666", "gender": "Feminino"},
    {"name": "Rafael Almeida", "age": 55, "phone": "(11) 99999-7777", "gender": "Masculino"},
    {"name": "Beatriz Rocha", "age": 22, "phone": "(11) 99999-8888", "gender": "Feminino"},
    {"name": "Gustavo Ferreira", "age": 38, "phone": "(11) 99999-9999", "gender": "Masculino"},
    {"name": "Camila Martins", "age": 27, "phone": "(11) 98888-1111", "gender": "Feminino"},
]

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with Session() as session:
        # Check if data exists
        result = await session.execute(select(func.count(Professional.id)))
        count = result.scalar()
        if count > 0:
            print("Data already seeded.")
            # return # Commented out to force seeding if desired, or better, just add if missing
            # For this task, let's just proceed or maybe clear? 
            # The user wants "fake numbers to fill". If it says "already seeded" they might not see anything if looking at a new DB. 
            # But likely the DB is empty.
            if count >= 3:
                print("Professionals exist. Skipping professional creation.")
        
        # Add Professionals if needed
        pro_objs = []
        result_pros = await session.execute(select(Professional))
        existing_pros = result_pros.scalars().all()
        
        if not existing_pros:
            for p in PROFESSIONALS:
                pro = Professional(
                    name=p["name"], 
                    role=p["role"], 
                    specialty=p["specialty"], 
                    email=p["email"],
                    status="Ativo"
                )
                session.add(pro)
                pro_objs.append(pro)
            await session.commit()
            print(f"Created {len(pro_objs)} professionals.")
        else:
            pro_objs = existing_pros

        # Refresh objects
        for p in pro_objs: await session.refresh(p)

        # Add Patients
        pat_objs = []
        result_pats = await session.execute(select(Patient))
        existing_pats = result_pats.scalars().all()

        if not existing_pats:
            for p in PATIENTS:
                pat = Patient(
                    # Aba 1
                    name=p["name"],
                    cpf=f"{random.randint(100,999)}.{random.randint(100,999)}.{random.randint(100,999)}-{random.randint(10,99)}",
                    birth_date=date.today() - timedelta(days=p["age"] * 365),
                    gender=p["gender"],
                    marital_status="Solteiro(a)",
                    profession="Desenvolvedor",
                    # Aba 2
                    phone=p["phone"],
                    email=f"{p['name'].lower().replace(' ', '.')}@email.com",
                    address_cep="00000-000",
                    address_street="Rua Exemplo",
                    address_number="123",
                    address_neighborhood="Centro",
                    address_city="São Paulo",
                    address_state="SP",
                    # Aba 3
                    attendance_type="Particular",
                    # Aba 4
                    emergency_contact_name="Contato de Emergência",
                    emergency_contact_phone="(11) 99999-0000",
                    emergency_contact_relation="Parente",
                    consent_terms_accepted=True,
                    # Outros
                    status="Ativo"
                )
                session.add(pat)
                pat_objs.append(pat)
            await session.commit()
            print(f"Created {len(pat_objs)} patients.")
        else:
            pat_objs = existing_pats
            
        for p in pat_objs: await session.refresh(p)

        # Add Appointments
        # Always add some new appointments for testing
        today = date.today()
        
        # Today's appointments
        times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
        for i in range(4): # 4 appointments today
            t = datetime.strptime(times[i], "%H:%M").time()
            # Check if exists
            exists = await session.execute(select(Appointment).where(
                Appointment.date == today, 
                Appointment.time == t
            ))
            if exists.scalars().first():
                continue

            appt = Appointment(
                patient_id=random.choice(pat_objs).id,
                professional_id=random.choice(pro_objs).id,
                date=today,
                time=t,
                status=random.choice(["Confirmado", "Pendente", "Confirmado"]),
                observations="Rotina"
            )
            session.add(appt)
        
        # Future appointments
        for i in range(5):
            days_ahead = random.randint(1, 7)
            future_date = today + timedelta(days=days_ahead)
            t = datetime.strptime(random.choice(times), "%H:%M").time()
            
            appt = Appointment(
                patient_id=random.choice(pat_objs).id,
                professional_id=random.choice(pro_objs).id,
                date=future_date,
                time=t,
                status="Agendado",
                observations="Retorno"
            )
            session.add(appt)

        await session.commit()
        print("Created appointments.")

if __name__ == "__main__":
    asyncio.run(seed_data())
