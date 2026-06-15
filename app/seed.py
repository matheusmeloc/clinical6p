"""
Seed de dados mockados para desenvolvimento local e ambiente de demonstração.
Cria tabelas e insere dados de exemplo em todas as entidades.
"""

import logging
from datetime import date, time, datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    User, Professional, Patient, Appointment,
    Prescription, Certificate, PatientMessage,
    ClinicSettings,
)
from app.auth import get_password_hash

logger = logging.getLogger(__name__)

# ═════════════════════════════════════════════════════════════════════
# DADOS MOCKADOS
# ═════════════════════════════════════════════════════════════════════

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
        "status": "Ativo",
        "care_modality": "Presencial",
        "password": "paciente123",
        "prof_index": 0,
    }
]

today = date.today()

def days(n):
    return today + timedelta(days=n)


# ─────────────────────────────────────────────────────────────────────
# FUNÇÃO DE SEED
# ─────────────────────────────────────────────────────────────────────

async def seed_mock_data(session: AsyncSession):
    logger.info("-> Populando banco de dados com dados mock...")
    
    # 1. Criar profissionais
    logger.info("Criando profissionais...")
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

    # 2. Criar usuários (staff)
    logger.info("Criando usuários (staff)...")
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

    # 3. Criar pacientes
    logger.info("Criando pacientes...")
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

    # 4. Criar agendamentos
    logger.info("Criando agendamentos...")
    appointments_data = [
        (patients[0], professionals[0], days(0),  time(9, 0),  "Retorno",          "Confirmado"),
        (patients[1], professionals[0], days(0),  time(10, 30),"Primeira Consulta","Confirmado"),
        (patients[2], professionals[1], days(0),  time(14, 0), "Retorno",          "Aguardando"),
        (patients[3], professionals[1], days(1),  time(9, 0),  "Primeira Consulta","Aguardando"),
        (patients[0], professionals[0], days(-7), time(9, 0),  "Retorno",          "Confirmado"),
        (patients[2], professionals[1], days(-3), time(14, 0), "Retorno",          "Confirmado"),
        (patients[1], professionals[0], days(7),  time(10, 30),"Retorno",          "Aguardando"),
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

    # 5. Criar receitas
    logger.info("Criando receitas...")
    prescriptions_data = [
        (patients[0], professionals[0], "Sertralina 50mg",   "1 comprimido/dia",  "Receita Comum",  "Ativo"),
        (patients[1], professionals[0], "Fluoxetina 20mg",   "1 comprimido/manhã","Receita Comum",  "Ativo"),
        (patients[2], professionals[1], "Rivotril 0,5mg",    "0,5mg à noite",     "Receita Especial","Ativo"),
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

    # 6. Criar atestados
    logger.info("Criando atestados...")
    certificates_data = [
        (patients[0], professionals[0], "Médico",        3,    "Repouso por transtorno ansioso"),
        (patients[1], professionals[0], "Comparecimento",None, "Compareceu à consulta psicológica"),
        (patients[2], professionals[1], "Médico",        5,    "Afastamento por episódio depressivo"),
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

    # 7. Criar mensagens de pacientes
    logger.info("Criando mensagens de pacientes...")
    messages_data = [
        (patients[0], professionals[0], "Olá, queria avisar que estou me sentindo muito melhor esta semana. Os exercícios que você recomendou estão ajudando bastante.", False),
        (patients[1], professionals[0], "Tive um episódio de ansiedade ontem durante o trabalho. Precisei sair da sala. Quero conversar sobre isso na próxima sessão.", False),
        (patients[2], professionals[1], "Doutor, consegui dormir bem nos últimos 3 dias. Acho que a medicação está fazendo efeito.", True),
    ]
    for pat, prof, msg, is_read in messages_data:
        session.add(PatientMessage(
            patient_id=pat.id,
            professional_id=prof.id,
            message=msg,
            is_read=is_read,
        ))

    # 8. Criar configurações da clínica
    logger.info("Criando configurações da clínica...")
    session.add(ClinicSettings(
        clinic_name="Instituto de Psicologia",
        cnpj="12.345.678/0001-99",
        address="Av. Paulista, 1000, Sala 502 — Bela Vista, São Paulo/SP",
        phone="(11) 3333-4444",
        working_hours_week="08:00 - 18:00",
        working_hours_saturday="08:00 - 12:00",
    ))

    await session.commit()
    logger.info("OK! Banco populado com sucesso!")
