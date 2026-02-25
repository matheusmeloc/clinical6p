import sqlite3

def migrate():
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='certificates'")
    if not cursor.fetchone():
        print("Table 'certificates' does not exist. It will be created by the app.")
        conn.close()
        return

    # Check columns
    cursor.execute("PRAGMA table_info(certificates)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'description' not in columns:
        print("Adding 'description' column to 'certificates' table...")
        try:
            cursor.execute("ALTER TABLE certificates ADD COLUMN description TEXT")
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print("'description' column already exists.")
        
    conn.close()

if __name__ == "__main__":
    migrate()
