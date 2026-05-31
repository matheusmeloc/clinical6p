"""
Migração: Adiciona colunas phone, role_title e crp à tabela users.
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()

    columns = {
        "phone":      "ALTER TABLE users ADD COLUMN phone VARCHAR",
        "role_title": "ALTER TABLE users ADD COLUMN role_title VARCHAR",
        "crp":        "ALTER TABLE users ADD COLUMN crp VARCHAR",
    }

    for col, sql in columns.items():
        try:
            cursor.execute(sql)
            print(f"Coluna '{col}' adicionada com sucesso.")
        except sqlite3.OperationalError as e:
            print(f"Coluna '{col}': {e}")

    conn.commit()
    conn.close()
    print("Migração da tabela users concluída.")

if __name__ == "__main__":
    migrate()
