"""
Script de Depuração: inspect_data.py

Realiza uma inspeção detalhada de dados específicos no sistema, facilitando
a verificação de integridade e a busca por anomalias.
"""
import sqlite3

conn = sqlite3.connect('clinic.db')
cursor = conn.cursor()

print("--- Prescriptions ---")
try:
    cursor.execute("SELECT id, date, created_at FROM prescriptions")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
except Exception as e:
    print(f"Error reading prescriptions: {e}")

print("\n--- Appointments ---")
try:
    cursor.execute("SELECT id, date, time FROM appointments")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
except Exception as e:
    print(f"Error reading appointments: {e}")

conn.close()
