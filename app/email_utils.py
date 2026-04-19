"""
Utilitários de E-mail
- Função genérica de envio (elimina duplicação)
- Templates específicos para cada tipo de e-mail:
  · Alarme de consulta (lembrete para profissional)
  · Notificação de mensagem de paciente
  · Boas-vindas para paciente (com credenciais)
  · Boas-vindas para profissional (com credenciais)
  · Recuperação de senha (senha provisória)
"""

import smtplib
import asyncio
import logging
import time
from email.message import EmailMessage
from sqlalchemy import select
from app.config import settings
from app.database import AsyncSession
from app.models import SystemSettings

logger = logging.getLogger(__name__)

# ─── Cache em memória das configurações SMTP ─────────────────────────
# Evita query ao banco a cada envio de e-mail. TTL de 5 minutos.
_smtp_cache: tuple[str, int, str, str, str | None] | None = None
_smtp_cache_ts: float = 0.0
_SMTP_CACHE_TTL: float = 300.0


def invalidate_smtp_cache() -> None:
    """Descarta o cache SMTP — deve ser chamado quando as configurações são salvas."""
    global _smtp_cache, _smtp_cache_ts
    _smtp_cache = None
    _smtp_cache_ts = 0.0


async def get_smtp_settings(db: AsyncSession) -> tuple[str, int, str, str, str | None]:
    """
    Retorna as configurações SMTP priorizando o banco de dados.
    O resultado é cacheado por 5 minutos para evitar queries repetidas.
    """
    global _smtp_cache, _smtp_cache_ts

    if _smtp_cache is not None and (time.monotonic() - _smtp_cache_ts) < _SMTP_CACHE_TTL:
        return _smtp_cache

    try:
        result = await db.execute(select(SystemSettings).order_by(SystemSettings.id))
        s = result.scalars().first()
        fetched: tuple[str, int, str, str, str | None] = (
            (s.smtp_server if s and s.smtp_server else settings.SMTP_SERVER),
            (s.smtp_port if s and s.smtp_port else settings.SMTP_PORT),
            (s.smtp_username if s and s.smtp_username else settings.SMTP_USERNAME),
            (s.smtp_password if s and s.smtp_password else settings.SMTP_PASSWORD),
            (s.smtp_from_email if s and s.smtp_from_email else (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME)),
        )
        _smtp_cache = fetched
        _smtp_cache_ts = time.monotonic()
        return fetched
    except Exception as e:
        logger.error(f"Erro ao buscar SMTP do banco: {e}")
        return (
            settings.SMTP_SERVER,
            settings.SMTP_PORT,
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
            (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME),
        )


async def _enviar_email(db: AsyncSession, destinatario: str, assunto: str, html: str, texto_plano: str = "") -> bool:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que faz esta 'função' (async def)? Ela é o nosso "Carteiro Eletrônico".
    O processo dela é:
    1. Pede as chaves do correio para a função 'get_smtp_settings' acima.
    2. Escreve a cartinha (quem é o remetente, qual é o assunto, a mensagem HTML colorida).
    3. Faz o login seguro (TLS) no provedor de e-mail e aperta "Enviar".
    Por que o nome começa com underline (_enviar_email)? O '_' indica para os outros programadores que ela é "secreta/interna", não devendo ser chamada diretamente por botões do site.
    """
    server, port, username, password, from_email = await get_smtp_settings(db)

    if not server or not username or not destinatario:
        logger.warning(f"SMTP não configurado ou sem destinatário. Pulando envio para {destinatario}")
        return False

    def _send() -> bool:
        msg = EmailMessage()
        msg["Subject"], msg["From"], msg["To"] = assunto, from_email, destinatario
        msg.set_content(texto_plano or assunto, subtype="plain")
        msg.add_alternative(html, subtype="html")
        try:
            with smtplib.SMTP(server, port, timeout=10) as smtp:
                smtp.ehlo()
                if settings.SMTP_TLS:
                    smtp.starttls()
                smtp.login(username, password)
                smtp.send_message(msg)
            logger.info(f"E-mail enviado para {destinatario}: {assunto}")
            return True
        except Exception as e:
            logger.error(f"Falha ao enviar e-mail para {destinatario}: {e}")
            return False

    # Executa _send() em um thread independente para não bloquear o loop assíncrono
    return await asyncio.get_running_loop().run_in_executor(None, _send)


def _template(titulo: str, corpo: str) -> str:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função' (def)? É como um "Carimbador de Papel Timbrado"!
    Em vez de escrevermos 40 linhas de código do visual colorido do e-mail (HTML) sempre que formos mandar uma notificação, nós usamos essa máquina.
    Ela recebe as variáveis 'titulo' e 'corpo', e simplesmente "gruda" essas mensagens dentro de um papel timbrado com rodapé da clínica ("Atenciosamente, Equipe...").
    Aí ela nos devolve o texto juntado (return), pronto para ser entregue ao Carteiro (função acima).
    """
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4A90E2;">{titulo}</h2>
            <div>{corpo}</div>
            <br>
            <p>Atenciosamente,<br><strong>Equipe do Instituto de Psicologia</strong></p>
        </body>
    </html>
    """


# ═════════════════════════════════════════════════════════════════════
# FUNÇÕES DE E-MAIL ESPECÍFICAS
# ═════════════════════════════════════════════════════════════════════


async def send_appointment_alarm(
    db: AsyncSession,
    professional_email: str,
    professional_name: str,
    patient_name: str,
    date_str: str,
    time_str: str
) -> bool:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' (async def) é uma montadora específica para "Alarmes de Consulta".
    Tudo que ela faz é: escrever o texto (usando a fábrica de Papel Timbrado '_template') com os dados do paciente, data e hora. 
    E no final, ela diz: "Ô Carteiro (_enviar_email), leva essa carta pra mim!".
    """
    html = _template(
        f"Olá, {professional_name}!",
        f"<p>Este é um lembrete automático de que você possui uma consulta em breve.</p>"
        f"<ul>"
        f"  <li><strong>Paciente:</strong> {patient_name}</li>"
        f"  <li><strong>Data:</strong> {date_str}</li>"
        f"  <li><strong>Horário:</strong> {time_str}</li>"
        f"</ul>"
    )
    return await _enviar_email(
        db,
        professional_email,
        f"Lembrete de Consulta: {patient_name} às {time_str}",
        html,
        "Lembrete de Consulta"
    )


async def send_patient_message_notification(
    db: AsyncSession,
    professional_email: str,
    professional_name: str,
    patient_name: str
) -> bool:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' monta o aviso de "Nova Mensagem" que o Psicólogo recebe no e-mail dele.
    Escreve a carta e repassa para a função carteiro (_enviar_email).
    """
    html = _template(
        f"Olá, {professional_name}!",
        f"<p>Você recebeu uma nova mensagem do paciente <strong>{patient_name}</strong>.</p>"
        f"<p>Acesse o painel do sistema para ler o que seu paciente escreveu sobre o dia dele.</p>"
    )
    return await _enviar_email(
        db,
        professional_email,
        f"Nova Mensagem de Paciente: {patient_name}",
        html,
        "Nova Mensagem de Paciente"
    )


async def send_patient_welcome_email(
    db: AsyncSession,
    patient_email: str,
    patient_name: str,
    patient_cpf: str,
    patient_password: str
) -> bool:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' monta o e-mail oficial de "Boas-Vindas" do Paciente.
    Recebe os dados como ingrediente (CPF, senha, nome) e monta a cartinha explicando como acessar o site, com a mesma lógica de chamar o carteiro no final.
    """
    html = _template(
        f"Olá, {patient_name}!",
        f"<p>Seu cadastro no sistema da clínica foi realizado com sucesso.</p>"
        f"<p>Agora você pode acessar o portal para enviar mensagens sobre o seu dia a dia para o seu psicólogo.</p><br>"
        f"<p><strong>Seus dados de acesso:</strong></p>"
        f"<ul>"
        f"  <li><strong>CPF (Login):</strong> {patient_cpf}</li>"
        f"  <li><strong>Senha Provisória:</strong> {patient_password}</li>"
        f"</ul>"
        f"<p>Recomendamos que guarde esta senha com segurança.</p>"
    )
    return await _enviar_email(
        db,
        patient_email,
        "Bem-vindo ao Sistema do Instituto de Psicologia",
        html,
        "Bem-vindo ao Sistema da Clínica"
    )


async def send_professional_welcome_email(
    db: AsyncSession,
    email: str,
    name: str,
    str_password: str
) -> bool:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' monta o e-mail de "Boas-Vindas" focado no Profissional.
    Escreve as instruções para a conta dele e envia para o carteiro.
    """
    html = _template(
        f"Olá, {name}!",
        f"<p>Seu cadastro como profissional no sistema da clínica foi realizado com sucesso.</p>"
        f"<p>Agora você pode acessar o portal para gerenciar seus pacientes, consultas e painel.</p><br>"
        f"<p><strong>Seus dados de acesso:</strong></p>"
        f"<ul>"
        f"  <li><strong>E-mail (Login):</strong> {email}</li>"
        f"  <li><strong>Senha Provisória:</strong> {str_password}</li>"
        f"</ul>"
        f"<p>Recomendamos que troque esta senha ou guarde-a com segurança.</p>"
    )
    return await _enviar_email(
        db,
        email,
        "Bem-vindo ao Sistema do Instituto de Psicologia",
        html,
        "Bem-vindo ao Sistema da Clínica"
    )


async def send_forgot_password_email(
    db: AsyncSession,
    email: str,
    is_patient: bool,
    login_id: str,
    temp_password: str
) -> bool:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta 'função' é disparada quando o usuário clica em "Esqueci minha senha!".
    Ela monta um e-mail especial contendo a nova senha temporária para resgatar a conta.
    """
    tipo_login = "CPF" if is_patient else "E-mail"
    html = _template(
        "Olá!",
        f"<p>Recebemos uma solicitação de recuperação de senha para a sua conta.</p>"
        f"<p>Por questões de segurança, geramos uma nova senha provisória para você acessar o sistema.</p><br>"
        f"<p><strong>Seus dados de acesso:</strong></p>"
        f"<ul>"
        f"  <li><strong>{tipo_login} (Login):</strong> {login_id}</li>"
        f"  <li><strong>Nova Senha Provisória:</strong> {temp_password}</li>"
        f"</ul>"
        f"<p>Recomendamos que altere esta senha no painel de configurações do sistema.</p>"
    )
    return await _enviar_email(
        db,
        email,
        "Recuperação de Senha - Instituto de Psicologia",
        html,
        "Recuperação de Senha"
    )


# ═════════════════════════════════════════════════════════════════════
# WRAPPERS PARA BACKGROUND TASKS (FastAPI BackgroundTasks)
# Criam sua própria sessão de banco — seguros para uso após o response.
# ═════════════════════════════════════════════════════════════════════

async def bg_send_patient_welcome_email(
    patient_email: str,
    patient_name: str,
    patient_cpf: str,
    patient_password: str,
) -> None:
    from app.database import SessionLocal
    async with SessionLocal() as db:
        await send_patient_welcome_email(db, patient_email, patient_name, patient_cpf, patient_password)


async def bg_send_professional_welcome_email(
    email: str,
    name: str,
    str_password: str,
) -> None:
    from app.database import SessionLocal
    async with SessionLocal() as db:
        await send_professional_welcome_email(db, email, name, str_password)


async def bg_send_patient_message_notification(
    professional_email: str,
    professional_name: str,
    patient_name: str,
) -> None:
    from app.database import SessionLocal
    async with SessionLocal() as db:
        await send_patient_message_notification(db, professional_email, professional_name, patient_name)
