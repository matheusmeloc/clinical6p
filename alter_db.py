import sqlite3

def alter_db():
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE patients ADD COLUMN hashed_password VARCHAR")
    except sqlite3.OperationalError as e:
        print(f"Pat password error: {e}")
        
    try:
        cursor.execute("ALTER TABLE patients ADD COLUMN care_modality VARCHAR DEFAULT 'Presencial'")
    except sqlite3.OperationalError as e:
        print(f"Pat care modality error: {e}")
        
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patient_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            professional_id INTEGER,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(professional_id) REFERENCES professionals(id)
        )
    """)
    
    conn.commit()
    conn.close()
    print("Database altered successfully")

if __name__ == "__main__":
    alter_db()
