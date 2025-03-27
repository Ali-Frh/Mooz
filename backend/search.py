from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

# Import from our new modules
from dependencies import get_db, get_current_active_user
from database import User
from schemas import SearchResponse, TrackItem
from spotifysearch.client import Client

# Load environment variables
load_dotenv()

# Initialize Spotify client
spotify_client = Client(
    client_id=os.getenv("SPOTIFY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIFY_CLIENT_SECRET")
)

# Create router
router = APIRouter()

@router.get("/search", response_model=SearchResponse)
async def search(q: str, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Search endpoint that requires authentication.
    Uses Spotify API to search for tracks based on the query.
    
    Args:
        q: The search query string
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
        
    Returns:
        SearchResponse: Object containing search results and the original query
    """
    try:
        # Search Spotify using the client
        search_results = spotify_client.search(q)
        tracks = search_results.get_tracks()
        
        # Format results
        results = []
        for track in tracks:
            if track and hasattr(track, 'artists') and track.artists:
                artist_name = track.artists[0].name if track.artists[0] else "Unknown Artist"
                results.append(TrackItem(id=track.id, track=track.name, artist=artist_name))
        
        return SearchResponse(results=results, query=q)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching Spotify: {str(e)}"
        )
