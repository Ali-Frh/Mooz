from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

# Pydantic Models for Request/Response
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Search models
class TrackItem(BaseModel):
    id: str
    track: str
    artist: str

class SearchResponse(BaseModel):
    results: List[TrackItem]
    query: str
    
    class Config:
        orm_mode = True

# Track models
class TrackBase(BaseModel):
    spotify_uid: str
    host: Optional[str] = None
    link: Optional[str] = None
    name: str
    author: str
    fails: Optional[int] = 0
    result: Optional[bool] = False

class TrackCreate(TrackBase):
    pass

class TrackUpdate(BaseModel):
    host: Optional[str] = None
    link: Optional[str] = None
    fails: Optional[int] = None
    result: Optional[bool] = None

class TrackResponse(TrackBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Playlist Track models
class PlaylistTrackBase(BaseModel):
    spotify_uid: str
    name: str
    author: str

class PlaylistTrackCreate(PlaylistTrackBase):
    pass

class PlaylistTrackResponse(PlaylistTrackBase):
    id: int
    playlist_id: int
    added_at: datetime
    
    class Config:
        orm_mode = True

# Playlist models
class PlaylistBase(BaseModel):
    name: str
    publicity: str = "private"  # Default to private

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    publicity: Optional[str] = None

class PlaylistResponse(PlaylistBase):
    id: int
    owner_id: int
    created_at: datetime
    modified_at: datetime
    track_count: Optional[int] = 0
    
    class Config:
        orm_mode = True

class PlaylistDetailResponse(PlaylistResponse):
    tracks: List[PlaylistTrackResponse] = []
    
    class Config:
        orm_mode = True
