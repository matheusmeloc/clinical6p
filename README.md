# Instituto de Psicologia — Sistema de Gestão Clínica

Sistema web completo para gestão de clínicas de psicologia, com controle de pacientes, agendamentos, receitas, atestados e mensagens.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| **Backend** | Python · FastAPI · SQLAlchemy (async) · Argon2 · PyJWT |
| **Banco de dados** | SQLite (dev) · PostgreSQL (produção) |
| **Frontend** | React 19 · Vite · Tailwind CSS v4 · Framer Motion |
| **Autenticação** | JWT (Bearer Token) |

---

## Pré-requisitos

- **Python** 3.11+
- **Node.js** 18+
- **Git**

---

## Instalação e execução

### 1. Clonar o repositório

```bash
git clone https://github.com/EduardoFelipo/clinical6p.git
cd clinical6p
```

### 2. Backend

#### Criar e ativar o ambiente virtual

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

#### Instalar dependências

```bash
pip install -r requirements.txt
```

#### Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=sqlite+aiosqlite:///./clinical.db
SECRET_KEY=sua_chave_secreta_aqui
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=senhaadmin
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

> **Produção (PostgreSQL):** substitua `DATABASE_URL` por:
> ```
> DATABASE_URL=postgresql+psycopg://usuario:senha@host:5432/banco
> ```

#### Popular o banco com dados de exemplo (opcional)

```bash
python -m scripts.seed.seed_mock
```

Isso cria dados mockados com:
- 3 usuários (admin + 2 profissionais)
- 4 profissionais, 6 pacientes
- 10 agendamentos, 5 receitas, 4 atestados, 5 mensagens

#### Iniciar o servidor

```bash
uvicorn app.main:app --reload --port 8000
```

O backend estará disponível em: **http://localhost:8000**  
Documentação da API: **http://localhost:8000/docs**

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em: **http://localhost:5175**

---

## Credenciais padrão (após seed)

| Perfil | Login | Senha |
|---|---|---|
| Administrador | `admin@example.com` | `senhaadmin` |
| Profissional | `ana.lima@psicologia.com` | `senha123` |
| Profissional | `carlos.souza@psicologia.com` | `senha123` |
| Paciente (CPF) | `123.456.789-00` | `paciente123` |

---

## Estrutura do projeto

```
clinical6p/
├── app/                    # Backend FastAPI
│   ├── main.py             # Ponto de entrada, CORS, rotas
│   ├── models.py           # Modelos SQLAlchemy (tabelas)
│   ├── schemas.py          # Schemas Pydantic (validação)
│   ├── auth.py             # JWT + hash de senhas (Argon2)
│   ├── config.py           # Variáveis de ambiente
│   ├── database.py         # Engine e sessão async
│   └── rotas/              # Endpoints da API
│       ├── autenticacao.py # POST /api/login, /forgot-password
│       ├── pacientes.py    # CRUD /api/patients
│       ├── profissionais.py# CRUD /api/professionals
│       ├── agendamentos.py # CRUD /api/appointments
│       ├── receitas.py     # CRUD /api/prescriptions
│       ├── atestados.py    # CRUD /api/certificates
│       ├── mensagens.py    # /api/patient-messages
│       ├── dashboard.py    # /api/dashboard/stats
│       └── configuracoes.py# /api/users, /api/system/settings
├── frontend/               # Frontend React + Vite
│   └── src/
│       ├── pages/          # Páginas da aplicação
│       ├── components/     # Componentes reutilizáveis
│       └── lib/            # api.js (axios), utils, masks
├── scripts/
│   └── seed/seed_mock.py   # Script de dados de exemplo
├── tests/                  # Testes automatizados
├── requirements.txt
└── .env                    # Variáveis de ambiente (não versionado)
```

---

## Funcionalidades

- **Autenticação** — Login JWT para profissionais e admin
- **Dashboard** — Estatísticas em tempo real (consultas, pacientes, mensagens)
- **Pacientes** — Cadastro completo com endereço, convênio e portal de acesso
- **Funcionários** — Cadastro de profissionais com criação automática de login
- **Agendamentos** — Agenda de consultas com filtros e busca
- **Receitas** — Emissão e histórico de prescrições médicas
- **Atestados** — Atestados médicos e de comparecimento
- **Mensagens** — Caixa de entrada de mensagens dos pacientes
- **Configurações** — Perfil, foto, senha e SMTP (admin)
- **Responsivo** — Funciona em mobile, tablet e desktop

---

## Executar os testes

```bash
pytest
```

---

## Deploy (Render)

O projeto está configurado para deploy no Render via `Procfile`:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Configure as variáveis de ambiente no painel do Render conforme o arquivo `.env`.
