# Manual de Estudo: Projeto Clinical6P 🚀

Para entender como este sistema funciona, recomendo seguir esta ordem lógica de estudo. O projeto é dividido entre **Frontend** (o que o usuário vê) e **Backend** (a inteligência e o banco de dados).

---

## 1. Frontend: A Casca e a Estrutura (HTML/CSS)
Comece por aqui para entender a organização visual.

*   **`static/index.html`**: É o coração do frontend. Estude as seções de `<aside>` (menu lateral), `<main>` (onde o conteúdo muda) e os **Modais** no final do arquivo.
*   **`static/css/styles.css`**: Contém o design system global (cores, fontes, variáveis).
*   **`static/css/index.css`**: Estude aqui como os componentes modernos (como o novo Card do Paciente) são estilizados usando **Glassmorphism**.

## 2. Lógica do Navegador (JavaScript)
Aqui você entende como o site "ganha vida" e fala com o servidor.

*   **`static/js/app.js`**: Este é o arquivo mais importante do frontend.
    *   Veja a função `loadView()`: entenda como ela troca as telas sem recarregar a página.
    *   Procure por funções de `fetch()`: elas mostram como o JS pede dados para o Python.
    *   Veja as funções `openModal()` e a nova `openPatientInfo()`.

## 3. O "Cérebro" do Servidor (Python/FastAPI)
Agora vamos para o lado do servidor. O FastAPI é o que conecta o banco de dados ao site.

*   **`app/main.py`**: Ponto de entrada. Veja como ele "monta" as rotas e inicia as tarefas de fundo (como o alarme de e-mail).
*   **`app/database.py`**: Entenda como a conexão com o banco de dados (Postgres ou SQLite) é configurada.
*   **`app/config.py`**: Onde ficam as variáveis de ambiente e URLs secretas.

## 4. Modelagem de Dados (Banco de Dados)
Como as informações são salvas.

*   **`app/models.py`**: Define as tabelas. Estude a classe `Patient` e `Appointment`. Note como os campos (String, Integer) correspondem às colunas do banco.
*   **`app/schemas.py`**: Define como os dados devem "parecer" ao entrar e sair da API (validação com Pydantic).

## 5. Rotas Modulares (CRUDs)
Onde a mágica acontece. Estude a pasta `app/rotas/`. Cada arquivo é um "CRUD" (Create, Read, Update, Delete).

*   **`app/rotas/pacientes.py`**: Ótimo para começar. Veja como ele recebe um ID, busca no banco e retorna um JSON.
*   **`app/rotas/agendamentos.py`**: Veja a lógica de marcar consultas.

## 6. Scripts Auxiliares e Migrações
Ferramentas de manutenção.

*   **`scripts/migracao/`**: Veja o `add_photo_to_patients.py` para entender como alteramos o banco de dados sem apagar tudo.
*   **`scripts/seed/`**: Veja como criamos usuários de teste para o sistema não começar vazio.

---

### Resumo da Ordem SUGERIDA:
1.  **HTML** (Estrutura) -> 2. **CSS** (Beleza) -> 3. **JS** (Interação) -> 4. **Models/DB** (Dados) -> 5. **Routes** (Lógica de API).

> [!TIP]
> **Dica:** Sempre que ler uma função no Python em `rotas/`, tente achar onde ela é chamada no `app.js` usando o `fetch()`. Esse é o fio que une todo o projeto!
