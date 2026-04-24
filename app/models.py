"""
Modelos do Banco de Dados (SQLAlchemy ORM)
Cada classe aqui representa uma tabela no banco de dados.

- User: funcionários e admins que fazem login por e-mail
- Professional: profissionais da clínica (psicólogos, médicos, etc.)
- Patient: pacientes cadastrados
- Appointment: agendamentos de consultas
- Prescription: receitas médicas
- Certificate: atestados médicos
- ClinicSettings: dados da clínica (nome, CNPJ, configuração de horários)
- PatientMessage: mensagens enviadas por pacientes via portal
- SystemSettings: configurações SMTP do sistema de e-mails

[EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
Note que neste arquivo NÃO TEMOS NENHUMA FUNÇÃO (def). Por que?
Nós só usamos 'Class' (Classes). Se a função é uma máquina que trabalha, a Classe é como um Molde de Gesso ou a Planta de uma Casa.
O nosso banco de dados não sabe sozinho quais informações salvar de um Paciente.
Então nós criamos a "Classe Patient" (molde) dizendo: "Olha banco de dados, todo paciente obrigatoriamente terá nome, cpf, data de nascimento...". 
É por isso que este arquivo se chama 'models': apenas cria as regras de como guardar as coisas.
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# ═════════════════════════════════════════════════════════════════════
# USUÁRIOS E FUNCIONÁRIOS (STAFF)
# ═════════════════════════════════════════════════════════════════════

class User(Base):
    """
    Funcionários e administradores do sistema.
    Fazem login usando o e-mail cadastrado.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    full_name = Column(String, nullable=True)
    role = Column(String, default="admin")              # admin, user
    phone = Column(String, nullable=True)
    role_title = Column(String, nullable=True)          # Cargo (ex: Psicólogo)
    crp = Column(String, nullable=True)                 # Registro profissional
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ═════════════════════════════════════════════════════════════════════
# PROFISSIONAIS DA SAÚDE
# ═════════════════════════════════════════════════════════════════════

class Professional(Base):
    """
    Profissionais da clínica que realizam atendimentos.
    Podem receber credenciais vinculadas na tabela de Users.
    """
    __tablename__ = "professionals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    
    photo = Column(String, nullable=True)               # Caminho da foto
    role = Column(String, nullable=False)               # Psicólogo, Médico, etc.
    professional_register = Column(String, nullable=True) # CRP / CRM / CRO
    specialty = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="Ativo")            # Ativo / Inativo
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relacionamentos ---
    appointments = relationship("Appointment", back_populates="professional")
    prescriptions = relationship("Prescription", back_populates="professional")
    certificates = relationship("Certificate", back_populates="professional")
    patient_messages = relationship("PatientMessage", back_populates="professional")


# ═════════════════════════════════════════════════════════════════════
# PACIENTES
# ═════════════════════════════════════════════════════════════════════

class Patient(Base):
    """
    Pacientes cadastrados na clínica.
    Possuem credenciais opcionais (CPF + Senha) para acessar o Portal do Paciente.
    """
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)

    # --- Identificação ---
    name = Column(String, index=True, nullable=False)
    cpf = Column(String, unique=True, index=True, nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    marital_status = Column(String, nullable=True)
    profession = Column(String, nullable=True)

    # --- Contato e Localização ---
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address_cep = Column(String, nullable=True)
    address_street = Column(String, nullable=True)
    address_number = Column(String, nullable=True)
    address_complement = Column(String, nullable=True)
    address_neighborhood = Column(String, nullable=True)
    address_city = Column(String, nullable=True)
    address_state = Column(String, nullable=True)

    # --- Convênio / Modalidade ---
    attendance_type = Column(String, nullable=True, default="Particular")
    insurance_plan = Column(String, nullable=True)
    insurance_number = Column(String, nullable=True)
    insurance_expiration_date = Column(Date, nullable=True)

    # --- Segurança e Emergência ---
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    emergency_contact_relation = Column(String, nullable=True)
    consent_terms_accepted = Column(Boolean, default=False)

    # --- Tratamento e Portal ---
    professional_id = Column(Integer, ForeignKey("professionals.id"), nullable=True)
    status = Column(String, default="Ativo")
    observations = Column(Text, nullable=True)
    care_modality = Column(String, default="Presencial")
    photo = Column(String, nullable=True) # Foto do paciente (URL ou base64)
    
    # Credenciais do portal do paciente
    hashed_password = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relacionamentos ---
    professional = relationship("Professional", backref="patients")
    appointments = relationship("Appointment", back_populates="patient")

    @property
    def professional_name(self) -> str | None:
        p = self.__dict__.get("professional")
        return p.name if p else None
    prescriptions = relationship("Prescription", back_populates="patient")
    certificates = relationship("Certificate", back_populates="patient")
    messages = relationship("PatientMessage", back_populates="patient")


# ═════════════════════════════════════════════════════════════════════
# CONSULTAS E DOCUMENTOS MEDICOS
# ═════════════════════════════════════════════════════════════════════

class Appointment(Base):
    """
    Agendamentos de consultas de pacientes com profissionais.
    """
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    professional_id = Column(Integer, ForeignKey("professionals.id"))
    
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    type = Column(String, nullable=True)                    # Primeira Consulta, Retorno, etc.
    status = Column(String, default="Aguardando")           # Confirmado, Aguardando, Cancelado
    alarm_sent = Column(Boolean, default=False)             # Status do lembrete por e-mail
    observations = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relacionamentos ---
    patient = relationship("Patient", back_populates="appointments")
    professional = relationship("Professional", back_populates="appointments")

    @property
    def patient_name(self) -> str | None:
        p = self.__dict__.get("patient")
        return p.name if p else None

    @property
    def professional_name(self) -> str | None:
        p = self.__dict__.get("professional")
        return p.name if p else None


class Prescription(Base):
    """
    Receituário médico emitido durante as consultas.
    """
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

    # --- Relacionamentos ---
    patient = relationship("Patient", back_populates="prescriptions")
    professional = relationship("Professional", back_populates="prescriptions")

    @property
    def patient_name(self) -> str | None:
        p = self.__dict__.get("patient")
        return p.name if p else None

    @property
    def professional_name(self) -> str | None:
        p = self.__dict__.get("professional")
        return p.name if p else None


class Certificate(Base):
    """
    Atestados médicos (saúde, comparecimento, etc.).
    """
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=func.now())
    patient_id = Column(Integer, ForeignKey("patients.id"))
    professional_id = Column(Integer, ForeignKey("professionals.id"))
    
    type = Column(String, nullable=False)                   # Médico, Comparecimento
    duration_days = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relacionamentos ---
    patient = relationship("Patient", back_populates="certificates")
    professional = relationship("Professional", back_populates="certificates")

    @property
    def patient_name(self) -> str | None:
        p = self.__dict__.get("patient")
        return p.name if p else None

    @property
    def professional_name(self) -> str | None:
        p = self.__dict__.get("professional")
        return p.name if p else None


class PatientMessage(Base):
    """
    Mensagens enviadas por pacientes logados no Portal do Paciente,
    direcionadas ao seu profissional responsável.
    """
    __tablename__ = "patient_messages"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    professional_id = Column(Integer, ForeignKey("professionals.id"))
    
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)                # Controle de leitura pelo profissional
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relacionamentos ---
    patient = relationship("Patient", back_populates="messages")
    professional = relationship("Professional", back_populates="patient_messages")

    @property
    def patient_name(self) -> str | None:
        p = self.__dict__.get("patient")
        return p.name if p else None

    @property
    def professional_name(self) -> str | None:
        p = self.__dict__.get("professional")
        return p.name if p else None


# ═════════════════════════════════════════════════════════════════════
# CONFIGURAÇÕES DO SISTEMA E CLÍNICA
# ═════════════════════════════════════════════════════════════════════

class ClinicSettings(Base):
    """
    Informações cadastrais da clínica exibidas em documentos e relatórios.
    """
    __tablename__ = "clinic_settings"

    id = Column(Integer, primary_key=True, index=True)
    clinic_name = Column(String, default="Instituto de Psicologia")
    cnpj = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    working_hours_week = Column(String, nullable=True)      # Ex: "08:00 - 18:00"
    working_hours_saturday = Column(String, nullable=True)  # Ex: "08:00 - 12:00"
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SystemSettings(Base):
    """
    Configurações de infraestrutura da aplicação,
    como os dados de SMTP usados para envio de e-mails do sistema.
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    smtp_server = Column(String, nullable=True)
    smtp_port = Column(Integer, nullable=True, default=587)
    smtp_username = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)
    smtp_from_email = Column(String, nullable=True)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
