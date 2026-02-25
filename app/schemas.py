from pydantic import BaseModel
from typing import Optional, List
from datetime import date as dt_date, time as dt_time, datetime

# Patient Schemas
class PatientBase(BaseModel):
    # Aba 1
    name: str
    cpf: Optional[str] = None
    birth_date: Optional[dt_date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    profession: Optional[str] = None

    # Aba 2
    phone: Optional[str] = None
    email: Optional[str] = None
    address_cep: Optional[str] = None
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None

    # Aba 3
    attendance_type: Optional[str] = "Particular"
    insurance_plan: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_expiration_date: Optional[dt_date] = None

    # Aba 4
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    consent_terms_accepted: Optional[bool] = False

    # Outros
    professional_id: Optional[int] = None
    status: Optional[str] = "Ativo"
    observations: Optional[str] = None
    care_modality: Optional[str] = "Presencial"

class PatientCreate(PatientBase):
    password: Optional[str] = None

class PatientUpdate(PatientBase):
    password: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    professional_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Professional Schemas
class ProfessionalBase(BaseModel):
    name: str
    role: str # Psicólogo
    email: Optional[str] = None
    phone: Optional[str] = None
    professional_register: Optional[str] = None # CRP, CRO
    specialty: Optional[str] = None
    status: Optional[str] = "Ativo"

class ProfessionalCreate(ProfessionalBase):
    password: Optional[str] = None

class ProfessionalUpdate(ProfessionalBase):
    pass

class ProfessionalResponse(ProfessionalBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentBase(BaseModel):
    patient_id: int
    professional_id: int
    date: dt_date
    time: dt_time
    type: Optional[str] = None
    status: Optional[str] = "Aguardando"
    observations: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    patient_id: Optional[int] = None
    professional_id: Optional[int] = None
    date: Optional[dt_date] = None
    time: Optional[dt_time] = None
    type: Optional[str] = None
    status: Optional[str] = None
    observations: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: int
    patient_name: Optional[str] = None # Calculated field
    professional_name: Optional[str] = None # Calculated field
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Prescription Schemas
class PrescriptionBase(BaseModel):
    patient_id: int
    professional_id: int
    medication_name: str
    dosage: Optional[str] = None
    certificate_type: Optional[str] = "Sem Atestado"
    date: Optional[dt_date] = None
    status: Optional[str] = "Ativo"

class PrescriptionCreate(PrescriptionBase):
    date: Optional[dt_date] = None # Optional, backend can set defaults

class PrescriptionUpdate(BaseModel):
    patient_id: Optional[int] = None
    professional_id: Optional[int] = None
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    certificate_type: Optional[str] = None
    date: Optional[dt_date] = None
    status: Optional[str] = None

class PrescriptionResponse(PrescriptionBase):
    id: int
    patient_name: Optional[str] = None
    professional_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Certificate Schemas
class CertificateBase(BaseModel):
    patient_id: int
    professional_id: int
    type: str # Médico, Comparecimento
    duration_days: Optional[int] = None
    description: Optional[str] = None
    date: Optional[dt_date] = None

class CertificateCreate(CertificateBase):
    date: Optional[dt_date] = None

class CertificateUpdate(BaseModel):
    patient_id: Optional[int] = None
    professional_id: Optional[int] = None
    type: Optional[str] = None
    duration_days: Optional[int] = None
    description: Optional[str] = None
    date: Optional[dt_date] = None

class CertificateResponse(CertificateBase):
    id: int
    patient_name: Optional[str] = None
    professional_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# PatientMessage Schemas
class PatientMessageBase(BaseModel):
    patient_id: int
    professional_id: int
    message: str
    is_read: Optional[bool] = False

class PatientMessageCreate(BaseModel):
    cpf: str
    password: str
    message: str

class PatientMessageResponse(PatientMessageBase):
    id: int
    patient_name: Optional[str] = None
    professional_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# System Settings Schemas
class SystemSettingsBase(BaseModel):
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None

class SystemSettingsCreate(SystemSettingsBase):
    pass

class SystemSettingsUpdate(SystemSettingsBase):
    pass

class SystemSettingsResponse(SystemSettingsBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
