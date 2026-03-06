"""
Script de Migração: fix_db.py

Corrige inconsistências ou erros estruturais no banco de dados.
Pode envolver reparações de relacionamentos ou inserção de dados obrigatórios ausentes.
"""
import sqlite3

# Conecta ao banco de dados
conn = sqlite3.connect('clinic.db')
cursor = conn.cursor()

# Remove a tabela de receitas se ela já existir
cursor.execute("DROP TABLE IF EXISTS prescriptions")
conn.commit()

print("Dropped prescriptions table.")
conn.close()
