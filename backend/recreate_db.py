import os
import sqlite3
from database import Base, engine

# Check if database file exists and remove it
db_file = './app.db'
if os.path.exists(db_file):
    print(f"Removing existing database file: {db_file}")
    os.remove(db_file)

# Create all tables
print("Creating database tables with updated schema...")
Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")

# Verify the schema
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("\nTables in the database:")
for table in tables:
    print(f"- {table[0]}")

# Show schema for playlist_tracks table
cursor.execute("PRAGMA table_info(playlist_tracks);")
columns = cursor.fetchall()
print("\nColumns in playlist_tracks table:")
for col in columns:
    print(f"- {col[1]} ({col[2]})")

conn.close()
print("\nDatabase recreation completed!")
