import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'clinic.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE appointments ADD COLUMN alarm_sent BOOLEAN DEFAULT 0")
        conn.commit()
        print("Migration successful: added alarm_sent to appointments.")
    except Exception as e:
        if "duplicate column name" in str(e).lower():
            print("Migration already applied: alarm_sent exists.")
        else:
            print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
