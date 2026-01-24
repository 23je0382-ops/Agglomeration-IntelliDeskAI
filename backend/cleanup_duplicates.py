import sqlite3
import os

DATABASE_PATH = "intellidesk.db"

def clean_duplicates():
    if not os.path.exists(DATABASE_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    print("Checking for duplicates...")
    
    # Check count before
    cursor.execute("SELECT COUNT(*) FROM ticket_emails")
    count_before = cursor.fetchone()[0]
    
    # Delete duplicates, keeping the one with the lowest ID
    cursor.execute("""
        DELETE FROM ticket_emails 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM ticket_emails 
            GROUP BY message_id
        )
    """)
    deleted_count = cursor.rowcount
    
    conn.commit()
    
    # Check count after
    cursor.execute("SELECT COUNT(*) FROM ticket_emails")
    count_after = cursor.fetchone()[0]
    
    print(f"Cleanup Complete.")
    print(f"Total rows before: {count_before}")
    print(f"Duplicates removed: {deleted_count}")
    print(f"Total rows after: {count_after}")
    
    conn.close()

if __name__ == "__main__":
    clean_duplicates()
