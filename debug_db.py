import sqlite3
import os

db_path = 'backend/intellidesk.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

try:
    cursor.execute("SELECT id, title, created_at, type, priority, status FROM tickets")
    rows = cursor.fetchall()
    print(f"Total tickets: {len(rows)}")
    for row in rows:
        print(dict(row))
        if row['created_at'] is None or row['title'] is None:
            print(f"!!! CORRUPT ROW DETECTED: ID={row['id']} !!!")
except Exception as e:
    print(f"Error querying DB: {e}")
finally:
    conn.close()
