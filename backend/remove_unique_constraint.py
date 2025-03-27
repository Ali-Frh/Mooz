import sqlite3
import os

# Database file path
db_file = "./app.db"

# Check if the database file exists
if not os.path.exists(db_file):
    print(f"Database file not found: {db_file}")
    exit(1)

print(f"Modifying database: {db_file}")

try:
    # Connect to the database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Create a new tracks table without the unique constraint
    print("Creating new tracks table without unique constraint...")
    cursor.execute("""
    CREATE TABLE tracks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        spotify_uid VARCHAR, 
        host VARCHAR, 
        link VARCHAR, 
        created_at DATETIME, 
        fails INTEGER, 
        name VARCHAR, 
        author VARCHAR, 
        result BOOLEAN
    )
    """)
    
    # Copy data from the old table to the new one
    print("Copying data from old table...")
    cursor.execute("INSERT INTO tracks_new SELECT * FROM tracks")
    
    # Drop the old table
    print("Dropping old table...")
    cursor.execute("DROP TABLE tracks")
    
    # Rename the new table to the original name
    print("Renaming new table...")
    cursor.execute("ALTER TABLE tracks_new RENAME TO tracks")
    
    # Create an index on spotify_uid (not unique)
    print("Creating index on spotify_uid...")
    cursor.execute("CREATE INDEX ix_tracks_spotify_uid ON tracks (spotify_uid)")
    
    # Commit the changes
    conn.commit()
    print("Changes committed successfully!")
    
    # Close the connection
    conn.close()
    
    print("Database modification completed successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    # Try to rollback if possible
    try:
        conn.rollback()
    except:
        pass
