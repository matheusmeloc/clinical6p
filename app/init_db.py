"""
Script utilitário para forçar a criação das tabelas no banco de dados.
Geralmente rodado apenas uma vez, ou a cada vez que as estruturas de
modelos da pasta app/models.py sofrem mudança e optamos por não usar o Alembic.
"""

import asyncio
from app.database import engine, Base

import app.models  # Importa todos os modelos para que o SQLAlchemy os reconheça


async def init_models() -> None:
    """
    [EXPLICAÇÃO DIDÁTICA PARA INICIANTES]
    O que é esta 'função' (async def)? Pense nela como o "Mestre de Obras" do banco de dados.
    Esta função tem um único trabalho: olhar para as plantas do projeto (os arquivos na pasta Models) e construir as paredes e fundações reais no banco de dados (criar as tabelas).
    Se algo der errado ou for a primeira vez rodando o programa, chamamos o pedreiro 'init_models' para construir tudo com base no projeto.
    """
    async with engine.begin() as conn:
        # Remova ou comente a linha abaixo em PRODUÇÃO para não perder dados:
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    print("Sucesso: Tabelas verificadas e criadas no banco de dados.")


if __name__ == "__main__":
    asyncio.run(init_models())
