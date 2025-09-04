from typing import List, Optional
from pydantic import BaseModel


class LobbyCreateRequest(BaseModel):
    host_name: str
    num_characters: int = 12
    is_private: bool = False
    password: Optional[str] = None
    time_limit_seconds: int = 0
    allow_spectators: bool = True
    max_players: int = 2
    game_mode: str = "text"  # or "voice"


class JoinLobbyRequest(BaseModel):
    player_name: str
    is_spectator: bool = False
    password: Optional[str] = None


class PlayerResponse(BaseModel):
    id: int
    name: str
    is_host: bool
    is_spectator: bool


class LobbyResponse(BaseModel):
    code: str
    status: str
    num_characters: int
    is_private: bool
    time_limit_seconds: int
    allow_spectators: bool
    max_players: int
    game_mode: str
    player_count: int
    players: List[PlayerResponse]