from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, select, and_
from app.database import get_db, AsyncSession, SessionLocal, engine, Base
from app.models import Patient, Appointment, Professional, Prescription, Certificate
from datetime import date, datetime, timedelta
from typing import List
import logging
import asyncio
from app.email_utils import send_appointment_alarm

logger = logging.getLogger(__name__)

app = FastAPI(title="Instituto de Psicologia - Sistema de Gestão")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

from fastapi.exceptions import RequestValidationError
from starlette.requests import Request

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc), "body": str(exc.body)},
    )

@app.get("/")
@app.get("/dashboard")
@app.get("/usuarios")
@app.get("/funcionarios")
@app.get("/pacientes")
@app.get("/agendamentos")
@app.get("/receitas")
@app.get("/atestados")
@app.get("/configuracoes")
async def read_root():
    return FileResponse('static/index.html')

@app.get("/login")
async def login_page():
    return FileResponse('static/login.html')

# API Endpoints


from app.auth import verify_password, get_password_hash
from app.models import User, PatientMessage
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Safely strip whitespace to prevent copy-paste errors
    clean_email_or_cpf = request.email.strip()
    clean_password = request.password.strip()
    
    # Check for Admin or Employee (User)
    result = await db.execute(select(User).where(User.email == clean_email_or_cpf))
    user = result.scalars().first()
    
    if user:
        if not verify_password(clean_password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Email ou senha incorretos")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Usuário inativo")
            
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
        
    # Check for Patient (login using CPF instead of email)
    # The frontend might send CPF in the "email" field of LoginRequest
    from app.models import Patient
    result_pat = await db.execute(select(Patient).where(Patient.cpf == clean_email_or_cpf))
    patient = result_pat.scalars().first()
    
    if patient and patient.hashed_password:
        if not verify_password(clean_password, patient.hashed_password):
            raise HTTPException(status_code=401, detail="CPF ou senha incorretos")
        if patient.status != "Ativo":
            raise HTTPException(status_code=403, detail="Paciente inativo")
            
        return {
            "id": patient.id,
            "email": patient.cpf, # Keep it as email so frontend saves it the same way
            "full_name": patient.name,
            "role": "patient"
        }
        
    raise HTTPException(status_code=401, detail="Conta não encontrada ou senha incorreta")

from app.schemas import ForgotPasswordRequest

@app.post("/api/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    from app.email_utils import send_forgot_password_email
    import secrets
    
    email = request.email.strip()
    
    # 1. Check User (Admin/Professional)
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if user:
        temp_pwd = secrets.token_urlsafe(8)
        user.hashed_password = get_password_hash(temp_pwd)
        await db.commit()
        await send_forgot_password_email(email, False, email, temp_pwd)
        return {"message": "Uma senha provisória foi enviada para o seu e-mail."}
        
    # 2. Check Patient
    result_pat = await db.execute(select(Patient).where(Patient.email == email))
    patient = result_pat.scalars().first()
    
    if patient:
        temp_pwd = secrets.token_urlsafe(8)
        patient.hashed_password = get_password_hash(temp_pwd)
        await db.commit()
        await send_forgot_password_email(email, True, patient.cpf or "Não cadastrado", temp_pwd)
        return {"message": "Uma senha provisória foi enviada para o seu e-mail."}
        
    raise HTTPException(status_code=404, detail="E-mail não encontrado no sistema.")

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Total Patients
    result_patients = await db.execute(select(func.count(Patient.id)))
    total_patients = result_patients.scalar()

    # Generic counts for demo purposes if DB is empty
    if total_patients == 0:
        return {
            "total_patients": 0,
            "appointments_today": 0,
            "appointments_week": 0,
            "next_appointment": "N/A"
        }

    # Appointments Today
    today = date.today()
    result_today = await db.execute(select(func.count(Appointment.id)).where(Appointment.date == today))
    appointments_today = result_today.scalar()

    # Appointments Week
    start_week = today - timedelta(days=today.weekday())
    end_week = start_week + timedelta(days=6)
    result_week = await db.execute(select(func.count(Appointment.id)).where(Appointment.date >= start_week, Appointment.date <= end_week))
    appointments_week = result_week.scalar()

    # Next Appointment (must be in the future)
    now = datetime.now()
    current_time = now.time()
    # First try today's appointments that haven't happened yet
    result_next = await db.execute(
        select(Appointment).where(
            Appointment.date == today,
            Appointment.time > current_time
        ).order_by(Appointment.time).limit(1)
    )
    next_appt = result_next.scalars().first()
    # If no more today, get the first appointment on a future date
    if not next_appt:
        result_next = await db.execute(
            select(Appointment).where(
                Appointment.date > today
            ).order_by(Appointment.date, Appointment.time).limit(1)
        )
        next_appt = result_next.scalars().first()
    next_appt_time = f"{next_appt.time.strftime('%H:%M')}" if next_appt else "N/A"

    return {
        "total_patients": total_patients,
        "appointments_today": appointments_today,
        "appointments_week": appointments_week,
        "next_appointment": next_appt_time
    }

@app.get("/api/dashboard/chart-data")
async def get_chart_data(period: str = "daily", db: AsyncSession = Depends(get_db)):
    today = date.today()
    labels = []
    data = []

    if period == "daily":
        # Show each day of the current week (Mon-Sun)
        start = today - timedelta(days=today.weekday())
        for i in range(7):
            d = start + timedelta(days=i)
            result = await db.execute(
                select(func.count(Appointment.id)).where(Appointment.date == d)
            )
            count = result.scalar() or 0
            labels.append(d.strftime("%d/%m"))
            data.append(count)

    elif period == "weekly":
        # Show last 4 weeks
        for i in range(3, -1, -1):
            week_start = today - timedelta(days=today.weekday() + 7 * i)
            week_end = week_start + timedelta(days=6)
            result = await db.execute(
                select(func.count(Appointment.id)).where(
                    Appointment.date >= week_start,
                    Appointment.date <= week_end
                )
            )
            count = result.scalar() or 0
            labels.append(f"{week_start.strftime('%d/%m')}-{week_end.strftime('%d/%m')}")
            data.append(count)

    elif period == "monthly":
        # Show last 6 months
        for i in range(5, -1, -1):
            m = today.month - i
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            # First and last day of the month
            first_day = date(y, m, 1)
            if m == 12:
                last_day = date(y + 1, 1, 1) - timedelta(days=1)
            else:
                last_day = date(y, m + 1, 1) - timedelta(days=1)
            result = await db.execute(
                select(func.count(Appointment.id)).where(
                    Appointment.date >= first_day,
                    Appointment.date <= last_day
                )
            )
            count = result.scalar() or 0
            month_names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                           "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
            labels.append(month_names[m - 1])
            data.append(count)

    return {"labels": labels, "data": data}

@app.get("/api/dashboard/calendar")
async def get_calendar_data(month: int = None, year: int = None, db: AsyncSession = Depends(get_db)):
    today = date.today()
    m = month or today.month
    y = year or today.year

    first_day = date(y, m, 1)
    if m == 12:
        last_day = date(y + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(y, m + 1, 1) - timedelta(days=1)

    result = await db.execute(
        select(Appointment).where(
            Appointment.date >= first_day,
            Appointment.date <= last_day
        ).order_by(Appointment.date, Appointment.time)
    )
    appointments = result.scalars().all()

    # Group by date
    calendar_data = {}
    for appt in appointments:
        day_str = appt.date.strftime("%Y-%m-%d")
        if day_str not in calendar_data:
            calendar_data[day_str] = []
        # Get patient name
        patient_result = await db.execute(select(Patient.name).where(Patient.id == appt.patient_id))
        patient_name = patient_result.scalar() or "Paciente"
        calendar_data[day_str].append({
            "time": appt.time.strftime("%H:%M"),
            "patient": patient_name,
            "status": appt.status or "Aguardando",
            "type": appt.type or ""
        })

    return {
        "month": m,
        "year": y,
        "days_in_month": last_day.day,
        "first_weekday": first_day.weekday(),  # 0=Mon, 6=Sun
        "appointments": calendar_data
    }

from app.schemas import (
    PatientCreate, PatientUpdate, PatientResponse,
    ProfessionalCreate, ProfessionalUpdate, ProfessionalResponse,
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse,
    CertificateCreate, CertificateUpdate, CertificateResponse,
    PatientMessageCreate, PatientMessageResponse,
    SystemSettingsCreate, SystemSettingsUpdate, SystemSettingsResponse
)
from sqlalchemy import desc
from sqlalchemy.orm import selectinload

# System Settings Endpoints
from app.models import SystemSettings, User
from app.schemas import UpdateUserPasswordRequest  # assuming we create this if not exist, or just use a generic update schema
from app.auth import get_password_hash

class UserUpdate(BaseModel):
    full_name: str | None = None
    password: str | None = None

@app.put("/api/users/{user_id}")
async def update_user(user_id: int, user_update: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
        
    if user_update.password:
        db_user.hashed_password = get_password_hash(user_update.password)
        
    await db.commit()
    await db.refresh(db_user)
    return {"message": "User updated successfully", "full_name": db_user.full_name}

@app.get("/api/system/settings", response_model=SystemSettingsResponse)
async def get_system_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SystemSettings).order_by(SystemSettings.id))
    settings = result.scalars().first()
    if not settings:
        settings = SystemSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings

@app.put("/api/system/settings", response_model=SystemSettingsResponse)
async def update_system_settings(settings_update: SystemSettingsUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SystemSettings).order_by(SystemSettings.id))
    settings = result.scalars().first()
    
    if not settings:
        settings = SystemSettings(**settings_update.dict())
        db.add(settings)
    else:
        for key, value in settings_update.dict(exclude_unset=True).items():
            setattr(settings, key, value)
            
    await db.commit()
    await db.refresh(settings)
    return settings

def _patient_to_dict(p):
    return {
        "id": p.id,
        "name": p.name,
        "cpf": p.cpf,
        "birth_date": p.birth_date,
        "gender": p.gender,
        "marital_status": p.marital_status,
        "profession": p.profession,
        
        "phone": p.phone,
        "email": p.email,
        "address_cep": p.address_cep,
        "address_street": p.address_street,
        "address_number": p.address_number,
        "address_complement": p.address_complement,
        "address_neighborhood": p.address_neighborhood,
        "address_city": p.address_city,
        "address_state": p.address_state,
        
        "care_modality": p.care_modality,
        "attendance_type": p.attendance_type,
        "insurance_plan": p.insurance_plan,
        "insurance_number": p.insurance_number,
        "insurance_expiration_date": p.insurance_expiration_date,
        
        "emergency_contact_name": p.emergency_contact_name,
        "emergency_contact_phone": p.emergency_contact_phone,
        "emergency_contact_relation": p.emergency_contact_relation,
        "consent_terms_accepted": p.consent_terms_accepted,
        
        "professional_id": p.professional_id,
        "professional_name": p.professional.name if p.professional else None,
        "status": p.status,
        "observations": p.observations,
        "created_at": p.created_at,
    }

import secrets
import string

@app.post("/api/patients")
async def create_patient(patient: PatientCreate, db: AsyncSession = Depends(get_db)):
    patient_data = patient.dict()
    raw_password = patient_data.get("password")
    
    # Auto-generate password if the user has an email and cpf but no password
    if not raw_password and patient_data.get("email") and patient_data.get("cpf"):
        alphabet = string.ascii_letters + string.digits
        raw_password = ''.join(secrets.choice(alphabet) for _ in range(8))
    
    if raw_password:
        patient_data["hashed_password"] = get_password_hash(raw_password)
        
    if "password" in patient_data:
        del patient_data["password"]
    
    db_patient = Patient(**patient_data)
    db.add(db_patient)
    await db.commit()
    await db.refresh(db_patient)

    # Send welcome email asynchronously if password was generated and email exists
    if raw_password and patient_data.get("email") and patient_data.get("cpf"):
        from app.email_utils import send_patient_welcome_email
        asyncio.create_task(send_patient_welcome_email(
            patient_email=patient_data["email"],
            patient_name=patient_data["name"],
            patient_cpf=patient_data["cpf"],
            patient_password=raw_password
        ))

    # Reload with relationship
    result = await db.execute(select(Patient).options(selectinload(Patient.professional)).where(Patient.id == db_patient.id))
    db_patient = result.scalars().first()
    return _patient_to_dict(db_patient)

@app.get("/api/patients")
async def get_patients(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Patient).options(selectinload(Patient.professional)).offset(skip).limit(limit).order_by(Patient.id)
    )
    patients = result.scalars().all()
    return [_patient_to_dict(p) for p in patients]

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).options(selectinload(Patient.professional)).where(Patient.id == patient_id))
    patient = result.scalars().first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patient_to_dict(patient)

@app.put("/api/patients/{patient_id}")
async def update_patient(patient_id: int, patient_update: PatientUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    db_patient = result.scalars().first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.dict(exclude_unset=True)
    if "password" in update_data:
        if update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]
        
    for key, value in update_data.items():
        setattr(db_patient, key, value)
    
    await db.commit()
    await db.refresh(db_patient)
    # Reload with relationship
    result = await db.execute(select(Patient).options(selectinload(Patient.professional)).where(Patient.id == db_patient.id))
    db_patient = result.scalars().first()
    return _patient_to_dict(db_patient)

from app.database import get_db, AsyncSession, engine, Base
from app.models import Patient, Appointment, Professional, Prescription
from datetime import date, datetime, timedelta
from typing import List

# ...

# Professional Endpoints
from app.schemas import ProfessionalResponse, ProfessionalCreate, ProfessionalUpdate, AppointmentCreate, AppointmentUpdate, AppointmentResponse, PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse
from sqlalchemy.exc import IntegrityError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def appointment_alarm_task():
    while True:
        try:
            now = datetime.now()
            lookahead_time = now + timedelta(minutes=30)
            
            async with SessionLocal() as session:
                stmt = select(Appointment).where(
                    and_(
                        Appointment.date == now.date(),
                        Appointment.alarm_sent == False,
                        Appointment.status != "Cancelado"
                    )
                )
                result = await session.execute(stmt)
                appointments = result.scalars().all()
                
                for appt in appointments:
                    appt_datetime = datetime.combine(appt.date, appt.time)
                    
                    if now <= appt_datetime <= lookahead_time:
                        patient = await session.get(Patient, appt.patient_id)
                        professional = await session.get(Professional, appt.professional_id)
                        
                        if professional and professional.email:
                            success = await send_appointment_alarm(
                                professional_email=professional.email,
                                professional_name=professional.name,
                                patient_name=patient.name if patient else "Desconhecido",
                                date_str=appt.date.strftime("%d/%m/%Y"),
                                time_str=appt.time.strftime("%H:%M")
                            )
                            if success:
                                appt.alarm_sent = True
                                session.add(appt)
                        else:
                            appt.alarm_sent = True
                            session.add(appt)
                            
                await session.commit()
        except Exception as e:
            logger.error(f"Error in appointment_alarm_task: {e}")
            
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    asyncio.create_task(appointment_alarm_task())

@app.get("/api/professionals", response_model=List[ProfessionalResponse])
async def get_professionals(db: AsyncSession = Depends(get_db)):
    # Return all for management, frontend can filter
    result = await db.execute(select(Professional).order_by(Professional.name))
    return result.scalars().all()

@app.post("/api/professionals", response_model=ProfessionalResponse)
async def create_professional(professional: ProfessionalCreate, db: AsyncSession = Depends(get_db)):
    try:
        prof_data = professional.dict()
        password = prof_data.pop("password", None)

        db_professional = Professional(**prof_data)
        db.add(db_professional)

        # Also create a User for login if email and password are provided
        if prof_data.get("email") and password:
            hashed_password = get_password_hash(password)
            db_user = User(
                email=prof_data["email"],
                hashed_password=hashed_password,
                full_name=prof_data["name"],
                role="user"
            )
            db.add(db_user)

        await db.commit()
        await db.refresh(db_professional)
        
        # Send welcome email
        if prof_data.get("email") and password:
            from app.email_utils import send_professional_welcome_email
            await send_professional_welcome_email(prof_data["email"], prof_data["name"], password)

        return db_professional
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Error creating professional: {e}")
        raise HTTPException(status_code=400, detail="Professional with this email already exists or other constraint violation.")
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.put("/api/professionals/{professional_id}", response_model=ProfessionalResponse)
async def update_professional(professional_id: int, professional_update: ProfessionalUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Professional).where(Professional.id == professional_id))
    db_professional = result.scalars().first()
    if not db_professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    old_email = db_professional.email
    update_data = professional_update.dict(exclude_unset=True)
    password = update_data.pop("password", None)
    
    # Check if email is being updated
    new_email = update_data.get("email")
    if new_email and old_email and new_email != old_email:
        # Check if the new email is already used by another User
        existing_user_result = await db.execute(select(User).where(User.email == new_email))
        if existing_user_result.scalars().first():
            raise HTTPException(status_code=400, detail="This email is already in use by another user.")
            
        # Find the corresponding User and update their email
        result_user = await db.execute(select(User).where(User.email == old_email))
        db_user = result_user.scalars().first()
        if db_user:
            db_user.email = new_email

    # Also check if password requires updating
    if password:
        user_email_to_search = new_email if (new_email and old_email and new_email != old_email) else old_email
        if user_email_to_search:
            result_user_pw = await db.execute(select(User).where(User.email == user_email_to_search))
            db_user_pw = result_user_pw.scalars().first()
            if db_user_pw:
                db_user_pw.hashed_password = get_password_hash(password)

    for key, value in update_data.items():
        setattr(db_professional, key, value)
    
    try:
        await db.commit()
        await db.refresh(db_professional)
        return db_professional
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already in use.")

@app.delete("/api/professionals/{professional_id}")
async def delete_professional(professional_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Professional).where(Professional.id == professional_id))
    professional = result.scalars().first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    try:
        await db.delete(professional)
        await db.commit()
        return {"message": "Professional deleted successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Appointment Endpoints
@app.post("/api/appointments", response_model=AppointmentResponse)
async def create_appointment(appointment: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    # Validate if patient and professional exist
    patient = await db.get(Patient, appointment.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    professional = await db.get(Professional, appointment.professional_id)
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")

    db_appointment = Appointment(**appointment.dict())
    db.add(db_appointment)
    await db.commit()
    await db.refresh(db_appointment)
    return db_appointment

@app.get("/api/appointments/today")
async def get_appointments_today(db: AsyncSession = Depends(get_db)):
    try:
        today = date.today()
        result = await db.execute(
            select(Appointment).options(
                selectinload(Appointment.patient),
                selectinload(Appointment.professional)
            ).where(Appointment.date == today).order_by(Appointment.time)
        )
        appointments = result.scalars().all()
        return [
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "professional_id": a.professional_id,
                "patient_name": a.patient.name if a.patient else None,
                "professional_name": a.professional.name if a.professional else None,
                "date": str(a.date) if a.date else None,
                "time": a.time.strftime("%H:%M") if a.time else None,
                "status": a.status,
                "observations": a.observations,
            }
            for a in appointments
        ]
    except Exception as e:
        logger.error(f"Error fetching today appointments: {e}")
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/appointments/upcoming")
async def get_appointments_upcoming(db: AsyncSession = Depends(get_db)):
    try:
        today = date.today()
        result = await db.execute(
            select(Appointment).options(
                selectinload(Appointment.patient),
                selectinload(Appointment.professional)
            ).where(Appointment.date > today).order_by(Appointment.date, Appointment.time).limit(10)
        )
        appointments = result.scalars().all()
        return [
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "professional_id": a.professional_id,
                "patient_name": a.patient.name if a.patient else None,
                "professional_name": a.professional.name if a.professional else None,
                "date": a.date.strftime("%d/%m") if hasattr(a.date, 'strftime') else (str(a.date)[:5] if a.date else None), # type: ignore
                "time": a.time.strftime("%H:%M") if a.time else None,
                "status": a.status,
            }
            for a in appointments
        ]
    except Exception as e:
        logger.error(f"Error fetching upcoming appointments: {e}")
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/appointments")
async def get_appointments(date_filter: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Appointment).options(
        selectinload(Appointment.patient),
        selectinload(Appointment.professional)
    )
    
    if date_filter:
        try:
            filter_date = date.fromisoformat(date_filter)
            query = query.where(Appointment.date == filter_date)
        except ValueError:
            pass

    query = query.order_by(Appointment.date, Appointment.time)
    result = await db.execute(query)
    appointments = result.scalars().all()

    return [
        {
            "id": a.id,
            "patient_id": a.patient_id,
            "professional_id": a.professional_id,
            "patient_name": a.patient.name if a.patient else None,
            "professional_name": a.professional.name if a.professional else None,
            "date": str(a.date),
            "time": str(a.time),
            "type": a.type,
            "status": a.status,
            "observations": a.observations,
            "created_at": a.created_at,
        }
        for a in appointments
    ]

@app.get("/api/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt

@app.put("/api/appointments/{appointment_id}")
async def update_appointment(appointment_id: int, appointment_update: AppointmentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    db_appointment = result.scalars().first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = appointment_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_appointment, key, value)
    
    await db.commit()

    # Re-fetch with relationships to build the response dict
    result2 = await db.execute(
        select(Appointment).options(
            selectinload(Appointment.patient),
            selectinload(Appointment.professional)
        ).where(Appointment.id == appointment_id)
    )
    a = result2.scalars().first()

    return {
        "id": a.id,
        "patient_id": a.patient_id,
        "professional_id": a.professional_id,
        "patient_name": a.patient.name if a.patient else None,
        "professional_name": a.professional.name if a.professional else None,
        "date": str(a.date),
        "time": str(a.time),
        "type": a.type,
        "status": a.status,
        "observations": a.observations,
        "created_at": a.created_at,
    }

@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    await db.delete(appt)
    await db.commit()
    return {"message": "Appointment deleted successfully"}

# Prescription Endpoints
@app.post("/api/prescriptions")
async def create_prescription(prescription: PrescriptionCreate, db: AsyncSession = Depends(get_db)):
    try:
        data = prescription.dict()
        if not data.get('date'):
            data['date'] = date.today()
            
        # Verify foreign keys
        patient = await db.get(Patient, data['patient_id'])
        professional = await db.get(Professional, data['professional_id'])
        
        if not patient or not professional:
             raise HTTPException(status_code=404, detail="Patient or Professional not found")

        db_prescription = Prescription(**data)
        db.add(db_prescription)
        await db.commit()
        await db.refresh(db_prescription)
        
        return {
            "id": db_prescription.id,
            "patient_id": db_prescription.patient_id,
            "professional_id": db_prescription.professional_id,
            "medication_name": db_prescription.medication_name,
            "dosage": db_prescription.dosage,
            "certificate_type": db_prescription.certificate_type,
            "date": str(db_prescription.date) if db_prescription.date else None,
            "status": db_prescription.status,
            "patient_name": patient.name,
            "professional_name": professional.name,
            "created_at": str(db_prescription.created_at) if db_prescription.created_at else None
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error creating prescription: {e}")
        import traceback
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prescriptions")
async def get_prescriptions(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Prescription).options(
                selectinload(Prescription.patient),
                selectinload(Prescription.professional)
            ).order_by(Prescription.date.desc())
        )
        prescriptions = result.scalars().all()

        return [
            {
                "id": p.id,
                "patient_id": p.patient_id,
                "professional_id": p.professional_id,
                "medication_name": p.medication_name,
                "dosage": p.dosage,
                "certificate_type": p.certificate_type,
                "date": str(p.date) if p.date else None,
                "status": p.status,
                "patient_name": p.patient.name if p.patient else None,
                "professional_name": p.professional.name if p.professional else None,
                "created_at": str(p.created_at) if p.created_at else None
            }
            for p in prescriptions
        ]
    except Exception as e:
        logger.error(f"Error fetching prescriptions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/prescriptions/{id}")
async def update_prescription(id: int, prescription: PrescriptionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prescription).where(Prescription.id == id))
    db_prescription = result.scalars().first()
    if not db_prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    update_data = prescription.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prescription, key, value)
    
    try:
        await db.commit()
        await db.refresh(db_prescription)
        
        # Get names for response
        patient = await db.get(Patient, db_prescription.patient_id)
        professional = await db.get(Professional, db_prescription.professional_id)
        
        return {
            "id": db_prescription.id,
            "patient_id": db_prescription.patient_id,
            "professional_id": db_prescription.professional_id,
            "medication_name": db_prescription.medication_name,
            "dosage": db_prescription.dosage,
            "certificate_type": db_prescription.certificate_type,
            "date": str(db_prescription.date) if db_prescription.date else None,
            "status": db_prescription.status,
            "patient_name": patient.name if patient else None,
            "professional_name": professional.name if professional else None,
            "created_at": str(db_prescription.created_at) if db_prescription.created_at else None
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/prescriptions/{id}")
async def delete_prescription(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prescription).where(Prescription.id == id))
    presc = result.scalars().first()
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    await db.delete(presc)
    await db.commit()
    return {"message": "Prescription deleted successfully"}

# Certificates Endpoints
@app.get("/api/certificates", response_model=List[CertificateResponse])
async def get_certificates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate))
    certificates = result.scalars().all()
    
    response = []
    for cert in certificates:
        # Fetch related names
        pat = await db.scalar(select(Patient).where(Patient.id == cert.patient_id))
        prof = await db.scalar(select(Professional).where(Professional.id == cert.professional_id))
        
        cert_dict = cert.__dict__.copy()
        cert_dict["patient_name"] = pat.name if pat else None
        cert_dict["professional_name"] = prof.name if prof else None
        response.append(cert_dict)
        
    return response

@app.post("/api/certificates", response_model=CertificateResponse)
async def create_certificate(cert: CertificateCreate, db: AsyncSession = Depends(get_db)):
    db_cert = Certificate(**cert.dict())
    if not db_cert.date:
        db_cert.date = datetime.now().date()
        
    db.add(db_cert)
    await db.commit()
    await db.refresh(db_cert)
    
    # Populate names for response
    pat = await db.scalar(select(Patient).where(Patient.id == db_cert.patient_id))
    prof = await db.scalar(select(Professional).where(Professional.id == db_cert.professional_id))
    
    response = db_cert.__dict__.copy()
    response["patient_name"] = pat.name if pat else None
    response["professional_name"] = prof.name if prof else None
    
    return response

@app.put("/api/certificates/{id}", response_model=CertificateResponse)
async def update_certificate(id: int, cert_update: CertificateUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.id == id))
    db_cert = result.scalars().first()
    if not db_cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    update_data = cert_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cert, key, value)
    
    await db.commit()
    await db.refresh(db_cert)
    
    pat = await db.scalar(select(Patient).where(Patient.id == db_cert.patient_id))
    prof = await db.scalar(select(Professional).where(Professional.id == db_cert.professional_id))
    
    response = db_cert.__dict__.copy()
    response["patient_name"] = pat.name if pat else None
    response["professional_name"] = prof.name if prof else None
    
    return response

@app.delete("/api/certificates/{id}")
async def delete_certificate(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.id == id))
    cert = result.scalars().first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    await db.delete(cert)
    await db.commit()
    return {"message": "Certificate deleted successfully"}

# Patient Messages Endpoints
from app.email_utils import send_patient_message_notification

@app.post("/api/patient-contact")
async def create_patient_contact(message_data: PatientMessageCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).options(selectinload(Patient.professional)).where(Patient.cpf == message_data.cpf))
    patient = result.scalars().first()
    
    if not patient or not patient.hashed_password or not verify_password(message_data.password, patient.hashed_password):
        raise HTTPException(status_code=401, detail="CPF ou senha inválidos")
        
    if not patient.professional_id:
        raise HTTPException(status_code=400, detail="Paciente não possui um profissional vinculado para receber mensagens")
        
    db_msg = PatientMessage(
        patient_id=patient.id,
        professional_id=patient.professional_id,
        message=message_data.message
    )
    db.add(db_msg)
    await db.commit()
    
    # Try sending email notification
    if patient.professional and patient.professional.email:
        asyncio.create_task(send_patient_message_notification(
            professional_email=patient.professional.email,
            professional_name=patient.professional.name,
            patient_name=patient.name
        ))
        
    return {"message": "Mensagem enviada com sucesso"}

@app.get("/api/patient-messages", response_model=List[PatientMessageResponse])
async def get_all_patient_messages(professional_id: int | None = None, db: AsyncSession = Depends(get_db)):
    query = select(PatientMessage).options(
        selectinload(PatientMessage.patient),
        selectinload(PatientMessage.professional)
    ).order_by(desc(PatientMessage.created_at))
    
    if professional_id:
        query = query.where(PatientMessage.professional_id == professional_id)

    result = await db.execute(query)
    messages = result.scalars().all()
    
    return [
        {
            "id": m.id,
            "patient_id": m.patient_id,
            "professional_id": m.professional_id,
            "message": m.message,
            "is_read": m.is_read,
            "patient_name": m.patient.name if m.patient else None,
            "professional_name": m.professional.name if m.professional else None,
            "created_at": m.created_at
        } for m in messages
    ]

@app.get("/api/patient-messages/unread")
async def get_unread_patient_messages_count(professional_id: int | None = None, db: AsyncSession = Depends(get_db)):
    query = select(func.count(PatientMessage.id)).where(PatientMessage.is_read == False)
    if professional_id:
        query = query.where(PatientMessage.professional_id == professional_id)

    result = await db.execute(query)
    count = result.scalar() or 0
    return {"count": count}

@app.put("/api/patient-messages/{id}/read")
async def mark_message_read(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PatientMessage).where(PatientMessage.id == id))
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    msg.is_read = True
    await db.commit()
    return {"message": "Marcado como lido"}
