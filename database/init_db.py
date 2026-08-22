import sqlite3
import os

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "policy_agent.db")

def init_db():
    """
    Initializes the SQLite database.
    In Phase 1, we only create the database file and establish a connection.
    Business-rule tables will be added in later phases.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Example table just to prove initialization works
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_db()
