from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SearchQuery(BaseModel):
    search_query: str
    artist: Optional[str] = None
    song_title: Optional[str] = None
    intent: str = "play"
    source_preference: str = "bilibili"


class VideoResult(BaseModel):
    id: str
    title: str
    url: str
    duration: Optional[int] = None
    view_count: Optional[int] = None
    thumbnail: Optional[str] = None
    uploader: Optional[str] = None
    source: str = "bilibili"


class StreamInfo(BaseModel):
    url: str
    content_type: str = "audio/mp4"
    duration: Optional[int] = None
    title: str
    video_url: Optional[str] = None
    audio_url: Optional[str] = None


class ChatMessage(BaseModel):
    message: str


class PlayRequest(BaseModel):
    video_url: str
    mode: str = "audio"
    quality: str = "1080p"


class FavoriteItem(BaseModel):
    id: str
    title: str
    artist: Optional[str] = None
    url: str
    source: str = "bilibili"
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    favorited_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ConfigUpdate(BaseModel):
    llm_provider: Optional[str] = None
    llm_api_key: Optional[str] = None
    llm_model: Optional[str] = None
    llm_base_url: Optional[str] = None
    player_default_mode: Optional[str] = None
    player_bilibili_sessdata: Optional[str] = None
