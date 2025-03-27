from pydantic import BaseModel
from typing import Optional, List

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
