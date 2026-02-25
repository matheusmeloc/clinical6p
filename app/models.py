from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="admin")  # admin, user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Professional(Base):
    __tablename__ = "professionals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    photo = Column(String, nullable=True) # URL or path to photo
    role = Column(String, nullable=False) # Psicólogo
    professional_register = Column(String, nullable=True) # CRP/CRO/CRN
    specialty = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="Ativo") # Ativo, Inativo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    appointments = relationship("Appointment", back_populates="professional")
    prescriptions = relationship("Prescription", back_populates="professional")
    certificates = relationship("Certificate", back_populates="professional")
    patient_messages = relationship("PatientMessage", back_populates="professional")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    # Aba 1: Identificação
    name = Column(String, index=True, nullable=False)
    cpf = Column(String, unique=True, index=True, nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    marital_status = Column(String, nullable=True)
    profession = Column(String, nullable=True)
    
    # Aba 2: Contato e Localização
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address_cep = Column(String, nullable=True)
    address_street = Column(String, nullable=True)
    address_number = Column(String, nullable=True)
    address_complement = Column(String, nullable=True)
    address_neighborhood = Column(String, nullable=True)
    address_city = Column(String, nullable=True)
    address_state = Column(String, nullable=True)

    # Aba 3: Convênio / Pagamento
    attendance_type = Column(String, nullable=True, default="Particular")
    insurance_plan = Column(String, nullable=True)
    insurance_number = Column(String, nullable=True)
    insurance_expiration_date = Column(Date, nullable=True)

    # Aba 4: Segurança e Emergência
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    emergency_contact_relation = Column(String, nullable=True)
    consent_terms_accepted = Column(Boolean, default=False)

    # Outros
    professional_id = Column(Integer, ForeignKey("professionals.id"), nullable=True)
    status = Column(String, default="Ativo")
    observations = Column(Text, nullable=True)
    hashed_password = Column(String, nullable=True)
    care_modality = Column(String, default="Presencial")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    professional = relationship("Professional", backref="patients")
    appointments = relationship("Appointment", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")
    certificates = relationship("Certificate", back_populates="patient")
    messages = relationship("PatientMessage", back_populates="patient")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    professional_id = Column(Integer, ForeignKey("professionals.id"))
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    type = Column(String, nullable=True) # Primeira Consulta, Retorno, Terapia Individual, etc.
    status = Column(String, default="Aguardando") # Confirmado, Aguardando, Cancelado, Concluído
    alarm_sent = Column(Boolean, default=False)
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="appointments")
    professional = relationship("Professional", back_populates="appointments")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=func.now())
    patient_id = Column(Integer, ForeignKey("patients.id"))
    professional_id = Column(Integer, ForeignKey("professionals.id"))
    medication_name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    certificate_type = Column(String, default="Sem Atestado") # Sem Atestado, Médico, Comparecimento
    status = Column(String, default="Ativo")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="prescriptions")
    professional = relationship("Professional", back_populates="prescriptions")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=func.now())
    patient_id = Column(Integer, ForeignKey("patients.id"))
    professional_id = Column(Integer, ForeignKey("professionals.id"))
    type = Column(String, nullable=False) # Médico, Comparecimento
    duration_days = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="certificates")
    professional = relationship("Professional", back_populates="certificates")

class ClinicSettings(Base):
    __tablename__ = "clinic_settings"

    id = Column(Integer, primary_key=True, index=True)
    clinic_name = Column(String, default="Instituto de Psicologia")
    cnpj = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    working_hours_week = Column(String, nullable=True) # e.g. "08:00 - 18:00"
    working_hours_saturday = Column(String, nullable=True) # e.g. "08:00 - 12:00"
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class PatientMessage(Base):
    __tablename__ = "patient_messages"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    professional_id = Column(Integer, ForeignKey("professionals.id"))
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="messages")
    professional = relationship("Professional", back_populates="patient_messages")
