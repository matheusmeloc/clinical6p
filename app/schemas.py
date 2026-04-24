"""
Schemas Pydantic (validação de dados da API)
Define o formato de entrada e saída de cada endpoint.

- Base: campos comuns
- Create: campos obrigatórios para criação (pode incluir senha)
- Update: campos opcionais para alteração
- Response: campos adicionais gerados pelo backend (IDs, datas, nomes)

[EXPLICAÇÃO DIDÁTICA PARA INICIANTES DA ESTRUTURA]
Assim como o arquivo `models.py` (que ensina o banco de dados), este arquivo usa 'Classes' para ensinar a INTERNET (a API) como os dados devem ser recebidos.
Por exemplo, se um usuário tentar mandar um texto no lugar da idade, é o Schema que pisca uma sirene de erro e recusa.
Neste arquivo também temos duas pequenas "funções" atuando como inspetores, veja no final do documento as regras de SMTP.
"""

from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, Any
from datetime import date as dt_date, time as dt_time, datetime


# ═════════════════════════════════════════════════════════════════════
# PACIENTES
# ═════════════════════════════════════════════════════════════════════

class PatientBase(BaseModel):
    """
    Campos base com atributos comuns do paciente.
    """
    # --- Identificação ---
    name: str
    cpf: Optional[str] = None
    birth_date: Optional[dt_date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    profession: Optional[str] = None
    
    # --- Contato ---
    phone: Optional[str] = None
    email: Optional[str] = None
    address_cep: Optional[str] = None
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    
    # --- Convênio ---
    attendance_type: Optional[str] = "Particular"
    insurance_plan: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_expiration_date: Optional[dt_date] = None
    
    # --- Emergência ---
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    consent_terms_accepted: Optional[bool] = False
    
    # --- Tratamento ---
    professional_id: Optional[int] = None
    status: Optional[str] = "Ativo"
    observations: Optional[str] = None
    care_modality: Optional[str] = "Presencial"


class PatientCreate(PatientBase):
    """
    Schema para criação de um paciente (com senha opcional).
    """
    password: Optional[str] = None


class PatientUpdate(PatientBase):
    """
    Schema para atualização de um paciente (com senha opcional).
    """
    password: Optional[str] = None


class PatientResponse(PatientBase):
    """
    Schema de resposta que é devolvido pela API (com ID, etc).
    """
    id: int
    professional_name: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ═════════════════════════════════════════════════════════════════════
# PROFISSIONAIS
# ═════════════════════════════════════════════════════════════════════

class ProfessionalBase(BaseModel):
    """
    Campos base com atributos comuns de um profissional.
    """
    name: str
    role: str                                          # Psicólogo, etc.
    email: Optional[str] = None
    phone: Optional[str] = None
    professional_register: Optional[str] = None        # CRP, CRO
    specialty: Optional[str] = None
    status: Optional[str] = "Ativo"


class ProfessionalCreate(ProfessionalBase):
    """
    Schema para criação de um profissional.
    """
    password: Optional[str] = None


class ProfessionalUpdate(BaseModel):
    """
    Schema para atualização de um profissional.
    """
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    professional_register: Optional[str] = None
    specialty: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None


class ProfessionalResponse(ProfessionalBase):
    """
    Schema de retorno do profissional pela API.
    """
    id: int
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ═════════════════════════════════════════════════════════════════════
# AGENDAMENTOS
# ═════════════════════════════════════════════════════════════════════

class AppointmentBase(BaseModel):
    """
    Campos base com atributos comuns de agendamento de consultas.
    """
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
    patient_name: Optional[str] = None
    professional_name: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ═════════════════════════════════════════════════════════════════════
# RECEITAS (PRESCRIPTIONS)
# ═════════════════════════════════════════════════════════════════════

class PrescriptionBase(BaseModel):
    """
    Campos base com atributos comuns de receitas emitidas na consulta.
    """
    patient_id: int
    professional_id: int
    medication_name: str
    dosage: Optional[str] = None
    certificate_type: Optional[str] = "Sem Atestado"
    date: Optional[dt_date] = None
    status: Optional[str] = "Ativo"


class PrescriptionCreate(PrescriptionBase):
    date: Optional[dt_date] = None


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
    
    model_config = ConfigDict(from_attributes=True)


# ═════════════════════════════════════════════════════════════════════
# ATESTADOS (CERTIFICATES)
# ═════════════════════════════════════════════════════════════════════

class CertificateBase(BaseModel):
    """
    Campos base com atributos comuns de atestados médicos.
    """
    patient_id: int
    professional_id: int
    type: str                                    # Médico, Comparecimento
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
    
    model_config = ConfigDict(from_attributes=True)


# ═════════════════════════════════════════════════════════════════════
# MENSAGENS DE PACIENTES
# ═════════════════════════════════════════════════════════════════════

class PatientMessageBase(BaseModel):
    """
    Campos base (corpo e leitura) para uma mensagem de log do paciente.
    """
    patient_id: int
    professional_id: int
    message: str
    is_read: Optional[bool] = False


class PatientMessageCreate(BaseModel):
    """
    Criação de mensagem via portal do paciente, que exige CPF e senha para autenticar o ato.
    """
    cpf: str
    password: str
    message: str


class PatientMessageResponse(PatientMessageBase):
    id: int
    patient_name: Optional[str] = None
    professional_name: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ═════════════════════════════════════════════════════════════════════
# CONFIGURAÇÕES DO SISTEMA (SMTP)
# ═════════════════════════════════════════════════════════════════════

class SystemSettingsBase(BaseModel):
    """
    Configurações SMTP para envio automático de e-mail pela aplicação.
    """
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None

    @field_validator("smtp_server", "smtp_username", "smtp_password", "smtp_from_email", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        """
        [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
        O que é esta 'função' (def)? Ela atua como um INSPETOR NA ESTEIRA de produção!
        Como ela tem a placa '@field_validator' em cima, ela inspeciona o que o navegador da web mandou antes de aceitar.
        Se o usuário preencher nada no servidor de email e salvar, o navegador manda um texto vazio (""). 
        Esta função pega essa caixa vazia ("") e converte para "None" (O vazio absoluto do Python), evitando que o banco de dados quebre.
        """
        # Converte string vazia do frontend para None
        return None if v == "" else v

    @field_validator("smtp_port", mode="before")
    @classmethod
    def empty_port_to_default(cls, v: Any) -> Any:
        """
        [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
        Mais um "Inspetor". Ele vigia a esteira que traz a PORTA DO SERVIDOR (smtp_port).
        Se o usuário deixar a porta vazia (sem nada ou ""), ele não deixa o banco de dados quebrar com isso.
        Em vez disso, ele corta o campo vazio e coloca automaticamente "587" ali dentro (que é o padrão universal de porta).
        """
        # Porta padrão 587 se não informada
        return 587 if v == "" or v is None else int(v)


class SystemSettingsCreate(SystemSettingsBase):
    pass


class SystemSettingsUpdate(SystemSettingsBase):
    pass


class SystemSettingsResponse(SystemSettingsBase):
    id: int
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ═════════════════════════════════════════════════════════════════════
# OUTROS SCHEMAS AUXILIARES
# ═════════════════════════════════════════════════════════════════════

class ForgotPasswordRequest(BaseModel):
    """
    Requisição JSON do endpoint de recuperação de configuração ("Esqueci minha senha").
    """
    email: str


class ResetPasswordRequest(BaseModel):
    """
    Requisição JSON do endpoint de redefinição de senha via token.
    """
    token: str
    new_password: str


class UpdateUserPasswordRequest(BaseModel):
    """
    Requisição JSON para o endpoint de alteração manual de senha por usuário logado.
    """
    old_password: Optional[str] = None
    new_password: str


class UserUpdate(BaseModel):
    """
    Schema para atualização de perfil do usuário logado (nome, senha, telefone, cargo, CRP).
    """
    full_name: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    role_title: Optional[str] = None
    crp: Optional[str] = None
