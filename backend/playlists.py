from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

# Import from our modules
from dependencies import get_db, get_current_active_user, get_optional_user
from database import User, Playlist, PlaylistTrack
from schemas import PlaylistCreate, PlaylistResponse, PlaylistUpdate, PlaylistDetailResponse, PlaylistTrackCreate, PlaylistTrackResponse

# Create router
router = APIRouter()

@router.get("/playlists", response_model=List[PlaylistResponse])
async def get_playlists(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Get all playlists owned by the current user.
    
    Args:
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
        
    Returns:
        List[PlaylistResponse]: List of playlists owned by the user
    """
    playlists = db.query(Playlist).filter(Playlist.owner_id == current_user.id).all()
    
    # Add track count to each playlist
    for playlist in playlists:
        playlist.track_count = db.query(PlaylistTrack).filter(PlaylistTrack.playlist_id == playlist.id).count()
    
    return playlists

@router.post("/playlists", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist(playlist: PlaylistCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Create a new playlist for the current user.
    
    Args:
        playlist: The playlist data
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
        
    Returns:
        PlaylistResponse: The created playlist
    """
    db_playlist = Playlist(
        name=playlist.name,
        owner_id=current_user.id,
        publicity=playlist.publicity
    )
    db.add(db_playlist)
    db.commit()
    db.refresh(db_playlist)
    return db_playlist

@router.get("/playlists/{playlist_id}", response_model=PlaylistDetailResponse)
async def get_playlist(playlist_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_optional_user)):
    """
    Get a specific playlist by ID with its tracks.
    Public playlists can be accessed without authentication.
    
    Args:
        playlist_id: The ID of the playlist to retrieve
        current_user: The authenticated user (optional)
        db: Database session (injected by dependency)
        
    Returns:
        PlaylistDetailResponse: The requested playlist with tracks
    """
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Playlist with ID {playlist_id} not found"
        )
    
    # Check if the playlist is public or if the user is the owner
    if playlist.publicity != "public" and (not current_user or playlist.owner_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this playlist"
        )
    
    # Add track count
    playlist.track_count = db.query(PlaylistTrack).filter(PlaylistTrack.playlist_id == playlist.id).count()
    
    return playlist

@router.put("/playlists/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: int, 
    playlist_update: PlaylistUpdate, 
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    """
    Update a playlist's name and/or publicity.
    
    Args:
        playlist_id: The ID of the playlist to update
        playlist_update: The updated playlist data
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
        
    Returns:
        PlaylistResponse: The updated playlist
    """
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Playlist with ID {playlist_id} not found"
        )
    
    # Check if the user is the owner of the playlist
    if playlist.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this playlist"
        )
    
    # Update fields if provided
    if playlist_update.name is not None:
        playlist.name = playlist_update.name
    if playlist_update.publicity is not None:
        playlist.publicity = playlist_update.publicity
    
    # Update modified_at timestamp
    playlist.modified_at = datetime.utcnow()
    
    db.commit()
    db.refresh(playlist)
    return playlist

@router.delete("/playlists/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(playlist_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Delete a playlist by ID.
    
    Args:
        playlist_id: The ID of the playlist to delete
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
    """
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Playlist with ID {playlist_id} not found"
        )
    
    # Check if the user is the owner of the playlist
    if playlist.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this playlist"
        )
    
    db.delete(playlist)
    db.commit()
    return None

@router.get("/public-playlists", response_model=List[PlaylistResponse], tags=["public"])
async def get_public_playlists(db: Session = Depends(get_db)):
    """
    Get all public playlists. This endpoint is accessible without authentication.
    
    Args:
        db: Database session (injected by dependency)
        
    Returns:
        List[PlaylistResponse]: List of public playlists
    """
    playlists = db.query(Playlist).filter(Playlist.publicity == "public").all()
    
    # Add track count to each playlist
    for playlist in playlists:
        playlist.track_count = db.query(PlaylistTrack).filter(PlaylistTrack.playlist_id == playlist.id).count()
    
    return playlists

# Playlist Track Endpoints
@router.post("/playlists/{playlist_id}/tracks", response_model=PlaylistTrackResponse, status_code=status.HTTP_201_CREATED)
async def add_track_to_playlist(
    playlist_id: int,
    track: PlaylistTrackCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add a track to a playlist.
    
    Args:
        playlist_id: The ID of the playlist to add the track to
        track: The track data
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
        
    Returns:
        PlaylistTrackResponse: The added track
    """
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Playlist with ID {playlist_id} not found"
        )
    
    # Check if the user is the owner of the playlist
    if playlist.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add tracks to this playlist"
        )
    
    # Check if track already exists in playlist
    existing_track = db.query(PlaylistTrack).filter(
        PlaylistTrack.playlist_id == playlist_id,
        PlaylistTrack.spotify_uid == track.spotify_uid
    ).first()
    
    if existing_track:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This track already exists in the playlist"
        )
    
    # Create new playlist track
    db_track = PlaylistTrack(
        spotify_uid=track.spotify_uid,
        playlist_id=playlist_id,
        name=track.name,
        author=track.author
    )
    
    db.add(db_track)
    db.commit()
    db.refresh(db_track)
    
    # Update playlist modified_at timestamp
    playlist.modified_at = datetime.utcnow()
    db.commit()
    
    return db_track

@router.delete("/playlists/{playlist_id}/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_track_from_playlist(
    playlist_id: int,
    track_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove a track from a playlist.
    
    Args:
        playlist_id: The ID of the playlist
        track_id: The ID of the track to remove
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
    """
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Playlist with ID {playlist_id} not found"
        )
    
    # Check if the user is the owner of the playlist
    if playlist.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to remove tracks from this playlist"
        )
    
    # Find the track
    track = db.query(PlaylistTrack).filter(
        PlaylistTrack.id == track_id,
        PlaylistTrack.playlist_id == playlist_id
    ).first()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Track with ID {track_id} not found in playlist"
        )
    
    db.delete(track)
    
    # Update playlist modified_at timestamp
    playlist.modified_at = datetime.utcnow()
    
    db.commit()
    return None