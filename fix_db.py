import sqlite3

# Connect to the database
conn = sqlite3.connect('clinic.db')
cursor = conn.cursor()

# Drop the prescriptions table if it exists
cursor.execute("DROP TABLE IF EXISTS prescriptions")
conn.commit()

print("Dropped prescriptions table.")
conn.close()
