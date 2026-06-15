"""
Seed de dados mockados para desenvolvimento local.
Cria tabelas e insere dados de exemplo em todas as entidades.

Uso: python -m scripts.seed.seed_mock
"""

import asyncio
from datetime import date, time, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, Base, SessionLocal
from app.models import (
    User, Professional, Patient, Appointment,
    Prescription, Certificate, PatientMessage,
    ClinicSettings, SystemSettings,
)
from app.auth import get_password_hash

import app.models  # garante que todos os modelos são registrados


# ─────────────────────────────────────────────────────────────────────
# DADOS MOCKADOS
# ─────────────────────────────────────────────────────────────────────

USERS = [
    {
        "email": "admin@example.com",
        "password": "senhaadmin",
        "full_name": "Administrador",
        "role": "admin",
        "role_title": "Administrador do Sistema",
        "is_active": True,
    },
    {
        "email": "ana.lima@psicologia.com",
        "password": "senha123",
        "full_name": "Ana Lima",
        "role": "user",
        "role_title": "Psicóloga",
        "crp": "CRP 06/12345",
        "is_active": True,
    },
    {
        "email": "carlos.souza@psicologia.com",
        "password": "senha123",
        "full_name": "Carlos Souza",
        "role": "user",
        "role_title": "Psicólogo",
        "crp": "CRP 06/54321",
        "is_active": True,
    },
]

PROFESSIONALS = [
    {
        "name": "Dra. Ana Lima",
        "email": "ana.lima@psicologia.com",
        "role": "Psicóloga",
        "professional_register": "CRP 06/12345",
        "specialty": "Terapia Cognitivo-Comportamental",
        "phone": "(11) 98765-0001",
        "status": "Ativo",
    },
    {
        "name": "Dr. Carlos Souza",
        "email": "carlos.souza@psicologia.com",
        "role": "Psicólogo",
        "professional_register": "CRP 06/54321",
        "specialty": "Psicanálise",
        "phone": "(11) 98765-0002",
        "status": "Ativo",
    },
    {
        "name": "Dra. Mariana Torres",
        "email": "mariana.torres@psicologia.com",
        "role": "Neuropsicóloga",
        "professional_register": "CRP 06/99887",
        "specialty": "Neuropsicologia",
        "phone": "(11) 98765-0003",
        "status": "Ativo",
    },
    {
        "name": "Dr. Felipe Mendes",
        "email": "felipe.mendes@psicologia.com",
        "role": "Psiquiatra",
        "professional_register": "CRM 12345/SP",
        "specialty": "Psiquiatria Clínica",
        "phone": "(11) 98765-0004",
        "status": "Inativo",
    },
]

PATIENTS = [
    {
        "name": "João Pedro Alves",
        "cpf": "123.456.789-00",
        "birth_date": date(1990, 3, 15),
        "gender": "Masculino",
        "phone": "(11) 91234-5001",
        "email": "joao.alves@email.com",
        "address_city": "São Paulo",
        "address_state": "SP",
        "attendance_type": "Particular",
        "status": "Ativo",
        "care_modality": "Presencial",
        "password": "paciente123",
        "prof_index": 0,
    },
    {
        "name": "Maria Clara Ferreira",
        "cpf": "234.567.890-11",
        "birth_date": date(1985, 7, 22),
        "gender": "Feminino",
        "phone": "(11) 91234-5002",
        "email": "maria.ferreira@email.com",
        "address_city": "São Paulo",
        "address_state": "SP",
        "attendance_type": "Convênio",
        "insurance_plan": "Unimed",
        "insurance_number": "UNI-00123",
        "status": "Ativo",
        "care_modality": "Online",
        "password": "paciente123",
        "prof_index": 0,
    },
    {
        "name": "Roberto Silva",
        "cpf": "345.678.901-22",
        "birth_date": date(1978, 11, 5),
        "gender": "Masculino",
        "phone": "(11) 91234-5003",
        "email": "roberto.silva@email.com",
        "address_city": "Guarulhos",
        "address_state": "SP",
        "attendance_type": "Particular",
        "status": "Ativo",
        "care_modality": "Presencial",
        "password": "paciente123",
        "prof_index": 1,
    },
    {
        "name": "Fernanda Costa",
        "cpf": "456.789.012-33",
        "birth_date": date(1995, 5, 30),
        "gender": "Feminino",
        "phone": "(11) 91234-5004",
        "email": "fernanda.costa@email.com",
        "address_city": "São Paulo",
        "address_state": "SP",
        "attendance_type": "Particular",
        "status": "Aguardando",
        "care_modality": "Presencial",
        "password": "paciente123",
        "prof_index": 1,
    },
    {
        "name": "Lucas Rodrigues",
        "cpf": "567.890.123-44",
        "birth_date": date(2000, 9, 10),
        "gender": "Masculino",
        "phone": "(11) 91234-5005",
        "email": "lucas.rodrigues@email.com",
        "address_city": "Osasco",
        "address_state": "SP",
        "attendance_type": "Convênio",
        "insurance_plan": "Amil",
        "status": "Ativo",
        "care_modality": "Online",
        "password": "paciente123",
        "prof_index": 2,
    },
    {
        "name": "Camila Nunes",
        "cpf": "678.901.234-55",
        "birth_date": date(1992, 2, 18),
        "gender": "Feminino",
        "phone": "(11) 91234-5006",
        "email": "camila.nunes@email.com",
        "address_city": "São Paulo",
        "address_state": "SP",
        "attendance_type": "Particular",
        "status": "Ativo",
        "care_modality": "Presencial",
        "password": "paciente123",
        "prof_index": 0,
    },
]

today = date.today()

def days(n):
    return today + timedelta(days=n)


# ─────────────────────────────────────────────────────────────────────
# FUNÇÕES DE INSERÇÃO
# ─────────────────────────────────────────────────────────────────────

async def seed(session: AsyncSession):
    print("-> Criando profissionais...")
    professionals = []
    for p in PROFESSIONALS:
        obj = Professional(
            name=p["name"],
            email=p["email"],
            role=p["role"],
            professional_register=p["professional_register"],
            specialty=p["specialty"],
            phone=p["phone"],
            status=p["status"],
        )
        session.add(obj)
        professionals.append(obj)
    await session.flush()

    print("-> Criando usuários (staff)...")
    for u in USERS:
        obj = User(
            email=u["email"],
            hashed_password=get_password_hash(u["password"]),
            full_name=u["full_name"],
            role=u["role"],
            role_title=u.get("role_title"),
            crp=u.get("crp"),
            is_active=u["is_active"],
        )
        session.add(obj)
    await session.flush()

    print("-> Criando pacientes...")
    patients = []
    for p in PATIENTS:
        obj = Patient(
            name=p["name"],
            cpf=p["cpf"],
            birth_date=p["birth_date"],
            gender=p["gender"],
            phone=p["phone"],
            email=p["email"],
            address_city=p.get("address_city"),
            address_state=p.get("address_state"),
            attendance_type=p.get("attendance_type", "Particular"),
            insurance_plan=p.get("insurance_plan"),
            insurance_number=p.get("insurance_number"),
            status=p["status"],
            care_modality=p.get("care_modality", "Presencial"),
            hashed_password=get_password_hash(p["password"]),
            professional_id=professionals[p["prof_index"]].id,
        )
        session.add(obj)
        patients.append(obj)
    await session.flush()

    print("-> Criando agendamentos...")
    appointments_data = [
        (patients[0], professionals[0], days(0),  time(9, 0),  "Retorno",          "Confirmado"),
        (patients[1], professionals[0], days(0),  time(10, 30),"Primeira Consulta","Confirmado"),
        (patients[2], professionals[1], days(0),  time(14, 0), "Retorno",          "Aguardando"),
        (patients[3], professionals[1], days(1),  time(9, 0),  "Primeira Consulta","Aguardando"),
        (patients[4], professionals[2], days(1),  time(11, 0), "Retorno",          "Confirmado"),
        (patients[5], professionals[0], days(2),  time(15, 0), "Retorno",          "Confirmado"),
        (patients[0], professionals[0], days(-7), time(9, 0),  "Retorno",          "Confirmado"),
        (patients[2], professionals[1], days(-3), time(14, 0), "Retorno",          "Confirmado"),
        (patients[1], professionals[0], days(7),  time(10, 30),"Retorno",          "Aguardando"),
        (patients[3], professionals[1], days(14), time(9, 0),  "Retorno",          "Aguardando"),
    ]
    for pat, prof, dt, tm, typ, st in appointments_data:
        session.add(Appointment(
            patient_id=pat.id,
            professional_id=prof.id,
            date=dt,
            time=tm,
            type=typ,
            status=st,
        ))
    await session.flush()

    print("-> Criando receitas...")
    prescriptions_data = [
        (patients[0], professionals[0], "Sertralina 50mg",   "1 comprimido/dia",  "Receita Comum",  "Ativo"),
        (patients[1], professionals[0], "Fluoxetina 20mg",   "1 comprimido/manhã","Receita Comum",  "Ativo"),
        (patients[2], professionals[1], "Rivotril 0,5mg",    "0,5mg à noite",     "Receita Especial","Ativo"),
        (patients[4], professionals[2], "Ritalina 10mg",     "1 comprimido/dia",  "Receita Especial","Ativo"),
        (patients[5], professionals[0], "Escitalopram 10mg", "1 comprimido/dia",  "Receita Comum",  "Expirado"),
    ]
    for pat, prof, med, dos, typ, st in prescriptions_data:
        session.add(Prescription(
            patient_id=pat.id,
            professional_id=prof.id,
            medication_name=med,
            dosage=dos,
            certificate_type=typ,
            date=days(-10),
            status=st,
        ))
    await session.flush()

    print("-> Criando atestados...")
    certificates_data = [
        (patients[0], professionals[0], "Médico",        3,    "Repouso por transtorno ansioso"),
        (patients[1], professionals[0], "Comparecimento",None, "Compareceu à consulta psicológica"),
        (patients[2], professionals[1], "Médico",        5,    "Afastamento por episódio depressivo"),
        (patients[5], professionals[0], "Comparecimento",None, "Compareceu à sessão de psicoterapia"),
    ]
    for pat, prof, typ, dur, desc in certificates_data:
        session.add(Certificate(
            patient_id=pat.id,
            professional_id=prof.id,
            type=typ,
            duration_days=dur,
            description=desc,
            date=days(-5),
        ))
    await session.flush()

    print("-> Criando mensagens de pacientes...")
    messages_data = [
        (patients[0], professionals[0], "Olá, queria avisar que estou me sentindo muito melhor esta semana. Os exercícios que você recomendou estão ajudando bastante.", False),
        (patients[1], professionals[0], "Tive um episódio de ansiedade ontem durante o trabalho. Precisei sair da sala. Quero conversar sobre isso na próxima sessão.", False),
        (patients[2], professionals[1], "Doutor, consegui dormir bem nos últimos 3 dias. Acho que a medicação está fazendo efeito.", True),
        (patients[4], professionals[2], "Dra. Mariana, minha filha teve dificuldades na escola essa semana. Ela ficou muito agitada durante as provas.", False),
        (patients[5], professionals[0], "Estou conseguindo aplicar as técnicas de respiração. Ainda é difícil mas está ficando mais fácil.", True),
    ]
    for pat, prof, msg, is_read in messages_data:
        session.add(PatientMessage(
            patient_id=pat.id,
            professional_id=prof.id,
            message=msg,
            is_read=is_read,
        ))

    print("-> Criando configurações da clínica...")
    session.add(ClinicSettings(
        clinic_name="Instituto de Psicologia",
        cnpj="12.345.678/0001-99",
        address="Av. Paulista, 1000, Sala 502 — Bela Vista, São Paulo/SP",
        phone="(11) 3333-4444",
        working_hours_week="08:00 - 18:00",
        working_hours_saturday="08:00 - 12:00",
    ))

    await session.commit()
    print("\nOK Seed concluído com sucesso!")
    print(f"  Usuários criados : {len(USERS)}")
    print(f"  Profissionais    : {len(PROFESSIONALS)}")
    print(f"  Pacientes        : {len(PATIENTS)}")
    print(f"  Agendamentos     : {len(appointments_data)}")
    print(f"  Receitas         : {len(prescriptions_data)}")
    print(f"  Atestados        : {len(certificates_data)}")
    print(f"  Mensagens        : {len(messages_data)}")
    print()
    print("  Login admin      : admin@example.com / senhaadmin")
    print("  Login staff      : ana.lima@psicologia.com / senha123")
    print("  Login paciente   : CPF 123.456.789-00 / paciente123")


async def main():
    print("-> Resetando banco de dados...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(main())
