"""
Ponto de entrada principal da aplicação (FastAPI)
Aqui configuramos:
- CORS (para permitir que o frontend faça requisições)
- Conexão e fechamento do banco de dados (lifespan)
- Registro de todas as rotas (endpoints)
- Montagem de arquivos estáticos (HTML, CSS, JS)
- Tarefas em segundo plano (como o envio de e-mails de lembrete)
"""

import asyncio
import logging
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import select

from app.database import engine, Base, SessionLocal
from app.models import Appointment, Professional, Patient
from app.email_utils import send_appointment_alarm
from app.auth import get_current_user
from app.config import settings

# ═════════════════════════════════════════════════════════════════════
# ROTAS (ENDPOINTS)
# ═════════════════════════════════════════════════════════════════════

from app.rotas.autenticacao import router as auth_router
from app.rotas.dashboard import router as dashboard_router
from app.rotas.pacientes import router as patients_router
from app.rotas.profissionais import router as professionals_router
from app.rotas.agendamentos import router as appointments_router
from app.rotas.receitas import router as prescriptions_router
from app.rotas.atestados import router as certificates_router
from app.rotas.mensagens import router as messages_router
from app.rotas.configuracoes import router as settings_router
from app.rotas.debug import router as debug_router


# Configuração básica de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constantes de configuração da tarefa de alarme
ALARM_INTERVAL_SECONDS = 60
ALARM_LOOKAHEAD_MINUTES = 30
ALARM_BATCH_LIMIT = 200  # Máximo de consultas carregadas por ciclo — evita uso excessivo de memória


async def appointment_alarm_task() -> None:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função' (async def)? Ela é como um robô que fica rodando eternamente (enquanto o servidor estiver ligado) para fazer o trabalho repetitivo de enviar e-mails de lembrete de consulta.
    
    A instrução 'while True:' (Enquanto for Verdadeiro) diz ao robô para trabalhar num ciclo infinito.
    Lógica Passo a Passo:
    1. Ele vê a hora atual ('now') e calcula até que momento deve olhar no futuro (hora de limite).
    2. Ele vai no banco de dados, busca todas as consultas de hoje que ainda não enviaram alarme ('alarm_sent == False') e estão com status 'Confirmado'.
    3. Em seguida, percorre uma por uma (num laço de repetição, o 'for').
    4. Se o momento da consulta estiver na janela limite, dispara o e-mail pro profissional.
    5. Por fim, 'asyncio.sleep' faz ele "dormir" por 60 segundos antes de verificar tudo de novo, para não sobrecarregar o painel.
    """
    while True:
        try:
            now = datetime.now()
            limit_time = now + timedelta(minutes=ALARM_LOOKAHEAD_MINUTES)
            
            async with SessionLocal() as db:
                # Busca consultas de hoje que ainda não enviaram alarme — com LIMIT para controlar memória
                stmt = (
                    select(Appointment)
                    .join(Professional)
                    .join(Patient)
                    .where(
                        Appointment.date == now.date(),
                        Appointment.alarm_sent == False,
                        Appointment.status == "Confirmado",
                    )
                    .limit(ALARM_BATCH_LIMIT)
                )
                result = await db.execute(stmt)
                appointments_today = result.scalars().all()

                for appointment in appointments_today:
                    # Combina data e hora para comparar com o momento atual
                    appointment_datetime = datetime.combine(appointment.date, appointment.time)
                    
                    if now <= appointment_datetime <= limit_time:
                        # Busca informações para o e-mail
                        professional = await db.get(Professional, appointment.professional_id)
                        patient = await db.get(Patient, appointment.patient_id)

                        if professional and patient and professional.email:
                            # Formatações amigáveis
                            date_str = appointment.date.strftime("%d/%m/%Y")
                            time_str = appointment.time.strftime("%H:%M")
                            
                            # Envia e-mail
                            success = await send_appointment_alarm(
                                db,
                                professional.email,
                                professional.name,
                                patient.name,
                                date_str,
                                time_str
                            )
                            
                            if success:
                                appointment.alarm_sent = True
                                db.add(appointment)
                                await db.commit()
                                logger.info(f"Alarme de consulta enviado: {patient.name} com {professional.name} às {time_str}")
        
        except Exception as e:
            logger.error(f"Erro na tarefa abstrata de alarme: {e}")
            
        await asyncio.sleep(ALARM_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função' (async def)? Pense em 'lifespan' (tempo de vida) como o interruptor de energia da sua loja (o site).
    
    - O trecho de código antes do 'yield' roda uma única vez no segundo que você liga a loja ("Abre a loja, arruma as cadeiras, e liga a máquina - o robô - de e-mails em segundo plano").
    - O 'yield' fala: "Pronto, a loja está aberta, podem entrar clientes (receber requisições)".
    - O trecho depois do 'yield' só será rodado se alguém desligar o servidor. Ou seja, ele avisa: "Cancelem o robô dos e-mails, fechem as portas em segurança."
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tabelas criadas/verificadas no banco de dados.")

    alarm_task = asyncio.create_task(appointment_alarm_task())
    logger.info("Tarefa de alarme de consultas iniciada.")

    yield
    
    alarm_task.cancel()
    logger.info("Shutdown finalizado.")


app = FastAPI(
    title="API do Instituto de Psicologia",
    description="Backend completo de gestão clínica",
    version="1.0.0",
    lifespan=lifespan
)



# ═════════════════════════════════════════════════════════════════════
# MIDDLEWARES
# ═════════════════════════════════════════════════════════════════════

_allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═════════════════════════════════════════════════════════════════════
# REGISTRO DE ROTAS
# ═════════════════════════════════════════════════════════════════════

# Rotas públicas — sem autenticação
app.include_router(auth_router)
app.include_router(messages_router)  # /api/patient-contact é público; staff routes protegidas individualmente

# Rotas protegidas — exigem Bearer token válido
_jwt = [Depends(get_current_user)]
app.include_router(dashboard_router, dependencies=_jwt)
app.include_router(patients_router, dependencies=_jwt)
app.include_router(professionals_router, dependencies=_jwt)
app.include_router(appointments_router, dependencies=_jwt)
app.include_router(prescriptions_router, dependencies=_jwt)
app.include_router(certificates_router, dependencies=_jwt)
app.include_router(settings_router, dependencies=_jwt)
app.include_router(debug_router, dependencies=_jwt)


# ═════════════════════════════════════════════════════════════════════
# ARQUIVOS ESTÁTICOS (FRONTEND)
# ═════════════════════════════════════════════════════════════════════

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função' (async def)? Chamámos ela de 'root' (raiz).
    Note que ela vem acompanhada de uma antena (@app.get("/")). Essa antena orienta o servidor.
    Se o cliente apertar Enter apenas no endereço do site, sem barra nada (ex: "meusite.com/"), 
    o servidor intercepta o pedido e executa essa função. Esta função só possui o trabalho 
    de enviar de retorno a página HTML do login do administrativo: "static/index.html".
    """
    return FileResponse("static/index.html")


@app.get("/login")
async def login():
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    Esta função entrega a tela de login unificada (Profissional e Paciente).
    Lembre-se: o paciente não tem um site separado, ele usa a aba "Sou Paciente" nesta mesma tela.
    """
    return FileResponse("static/login.html")
