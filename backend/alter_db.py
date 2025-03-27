import sqlite3

# Connect to the database
db_file = './app.db'
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Check if the columns already exist
cursor.execute("PRAGMA table_info(playlist_tracks);")
columns = cursor.fetchall()
column_names = [col[1] for col in columns]

print("Current columns in playlist_tracks table:")
for col in columns:
    print(f"- {col[1]} ({col[2]})")

# Add the new columns if they don't exist
if 'name' not in column_names:
    print("\nAdding 'name' column to playlist_tracks table...")
    cursor.execute("ALTER TABLE playlist_tracks ADD COLUMN name TEXT;")

if 'author' not in column_names:
    print("Adding 'author' column to playlist_tracks table...")
    cursor.execute("ALTER TABLE playlist_tracks ADD COLUMN author TEXT;")

# Commit the changes
conn.commit()

# Verify the schema after changes
cursor.execute("PRAGMA table_info(playlist_tracks);")
columns = cursor.fetchall()
print("\nUpdated columns in playlist_tracks table:")
for col in columns:
    print(f"- {col[1]} ({col[2]})")

conn.close()
print("\nDatabase alteration completed!")
