from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Database Configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Relationship with playlists
    playlists = relationship("Playlist", back_populates="owner")

class Playlist(Base):
    __tablename__ = "playlists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    publicity = Column(String, default="private")  # 'public' or 'private'
    
    # Relationship with user
    owner = relationship("User", back_populates="playlists")
    # Relationship with tracks
    tracks = relationship("PlaylistTrack", back_populates="playlist", cascade="all, delete-orphan")

class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"
    
    id = Column(Integer, primary_key=True, index=True)
    spotify_uid = Column(String, index=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id"))
    added_at = Column(DateTime, default=datetime.utcnow)
    name = Column(String)
    author = Column(String)
    
    # Relationship with playlist
    playlist = relationship("Playlist", back_populates="tracks")

# Create tables
Base.metadata.create_all(bind=engine)
