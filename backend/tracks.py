from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import asyncio
import os

# Import from our modules
from dependencies import get_db, get_current_active_user
from database import User, Track
from schemas import TrackCreate, TrackResponse, TrackUpdate
from scrapers.track_scrape import grab_song

# Create router
router = APIRouter()

# Queue to prevent duplicate scraping tasks
scrape_queue = set()

@router.get("/tracks", response_model=List[TrackResponse])
async def get_tracks(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Get all tracks in the database.
    
    Args:
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
        
    Returns:
        List[TrackResponse]: List of all tracks
    """
    tracks = db.query(Track).all()
    return tracks

@router.get("/tracks/{spotify_uid}", response_model=TrackResponse)
async def get_track(spotify_uid: str, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Get a specific track by Spotify UID.
    
    Args:
        spotify_uid: The Spotify UID of the track
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
        
    Returns:
        TrackResponse: The requested track
    """
    track = db.query(Track).filter(Track.spotify_uid == spotify_uid).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Track with Spotify UID {spotify_uid} not found"
        )
    
    return track

@router.post("/tracks/play/{spotify_uid}")
async def play_track(spotify_uid: str, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Play a track by Spotify UID. If the track is not in the database or doesn't have a link,
    it will be added to the scraping queue.
    
    Args:
        spotify_uid: The Spotify UID of the track
        background_tasks: FastAPI background tasks
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
        
    Returns:
        dict: Response containing track info and play status
    """
    # Check if track exists in database with a valid link
    track = db.query(Track).filter(Track.spotify_uid == spotify_uid, Track.result == True).order_by(Track.fails).first()
    
    # If track exists and has a valid link, return it
    if track and track.link:
        return {
            "status": "success",
            "message": "Track found",
            "track": {
                "id": track.id,
                "spotify_uid": track.spotify_uid,
                "name": track.name,
                "author": track.author,
                "link": track.link,
                "result": track.result
            }
        }
    
    # Get track info from playlist_tracks table if not in tracks table
    any_track = db.query(Track).filter(Track.spotify_uid == spotify_uid).first()
    if not any_track:
        # Query for the track in any playlist to get name and author
        from database import PlaylistTrack
        playlist_track = db.query(PlaylistTrack).filter(PlaylistTrack.spotify_uid == spotify_uid).first()
        
        if not playlist_track:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Track with Spotify UID {spotify_uid} not found in any playlist"
            )
        
        # Create new track entry
        track = Track(
            spotify_uid=spotify_uid,
            name=playlist_track.name,
            author=playlist_track.author,
            result=False
        )
        db.add(track)
        db.commit()
        db.refresh(track)
    else:
        track = any_track
    
    # Check if this track is already in the scraping queue
    if spotify_uid in scrape_queue:
        return {
            "status": "pending",
            "message": "Track is already being processed. Please try again in a minute.",
            "track": {
                "id": track.id,
                "spotify_uid": track.spotify_uid,
                "name": track.name,
                "author": track.author
            }
        }
    
    # Add to scraping queue and start background task
    scrape_queue.add(spotify_uid)
    background_tasks.add_task(scrape_track, spotify_uid, track.name, track.author, db)
    
    return {
        "status": "pending",
        "message": "We're grabbing this track for you. Please try again in a minute.",
        "track": {
            "id": track.id,
            "spotify_uid": track.spotify_uid,
            "name": track.name,
            "author": track.author
        }
    }

async def scrape_track(spotify_uid: str, name: str, author: str, db: Session):
    """
    Background task to scrape track information.
    
    Args:
        spotify_uid: The Spotify UID of the track
        name: The name of the track
        author: The author of the track
        db: Database session
    """
    try:
        # Check if we already have successful tracks for this spotify_uid
        existing_tracks = db.query(Track).filter(Track.spotify_uid == spotify_uid, Track.result == True).all()
        if existing_tracks:
            # We already have successful tracks for this spotify_uid, no need to scrape again
            print(f"Track {spotify_uid} already has {len(existing_tracks)} successful links, skipping scrape")
            return
            
        # Construct query for search
        query = f"{name} {author}"
        
        # Call the grab_song function
        result = grab_song(query)
        
        if not result or not isinstance(result, list) or len(result) == 0:
            # No results, update an existing track with failure
            track = db.query(Track).filter(Track.spotify_uid == spotify_uid).first()
            if track:
                track.fails += 1
                db.commit()
            return
        
        # Add each link as a separate track entry
        for i, link in enumerate(result):
            # Create a new track for each link
            new_track = Track(
                spotify_uid=spotify_uid,
                name=name,
                author=author,
                link=link,
                host=link.split('/')[2] if '/' in link else '',
                result=True,
                fails=0
            )
            db.add(new_track)
        
        db.commit()
        print(f"Added {len(result)} links for track {spotify_uid}")
        
    except Exception as e:
        # Log the error
        print(f"Error scraping track {spotify_uid}: {str(e)}")
        
        # Update track with failure
        track = db.query(Track).filter(Track.spotify_uid == spotify_uid).first()
        if track:
            track.fails += 1
            db.commit()
    finally:
        # Remove from queue
        if spotify_uid in scrape_queue:
            scrape_queue.remove(spotify_uid)

@router.delete("/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_track(track_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Delete a track by ID.
    
    Args:
        track_id: The ID of the track to delete
        current_user: The authenticated user (injected by dependency)
        db: Database session (injected by dependency)
    """
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Track with ID {track_id} not found"
        )
    
    db.delete(track)
    db.commit()
    return None
