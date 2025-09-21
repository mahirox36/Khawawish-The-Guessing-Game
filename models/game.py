from enum import StrEnum
from typing import Optional, overload, Union
from pydantic import BaseModel
from tortoise.models import Model
from tortoise import fields
from datetime import datetime


class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    bio: Optional[str] = None
    games_played: int = 0
    games_won: int = 0
    games_lose: int = 0
    total_score: int = 0
    best_streak: int = 0
    current_streak: int = 0
    in_game: bool = False
    is_active: bool = True
    is_verified: bool = False
    toast_user: bool = True
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    win_rate: float
    average_score: float

class Uploads(Model):
    id = fields.BigIntField(pk=True)
    public_url = fields.CharField(max_length=500, unique=True)
    dev_url = fields.CharField(max_length=500, unique=True)
    file_name = fields.CharField(max_length=500, unique=True)
    created_at = fields.DatetimeField(auto_now_add=True)

class User(Model):
    """User model for authentication and game statistics"""

    user_id = fields.CharField(max_length=50, pk=True)
    username = fields.CharField(max_length=50, unique=True)
    email = fields.CharField(max_length=100, unique=True)
    password_hash = fields.CharField(max_length=255)
    display_name = fields.CharField(max_length=100)

    # Profile info
    avatar_url = fields.CharField(max_length=500, null=True)
    banner_url = fields.CharField(max_length=500, null=True)
    bio = fields.TextField(null=True)

    # Game statistics
    games_played = fields.IntField(default=0)
    games_won = fields.IntField(default=0)
    games_lose = fields.IntField(default=0)
    total_score = fields.IntField(default=0)
    best_streak = fields.IntField(default=0)
    current_streak = fields.IntField(default=0)
    in_game = fields.BooleanField(default=False)

    # Account status
    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=False)
    toast_user = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    last_login = fields.DatetimeField(null=True)
    email_token = fields.CharField(max_length=250, null=True)

    class Meta:
        table = "users"

    def __str__(self):
        return f"User({self.username})"

    @overload
    def export_data(self, to_dict: bool = False) -> UserResponse: ...
    @overload
    def export_data(self, to_dict: bool = True) -> dict: ...

    def export_data(self, to_dict: bool = False) -> Union[UserResponse, dict]:
        data = UserResponse(
            user_id=self.user_id,
            username=self.username,
            email=self.email,
            display_name=self.display_name,
            avatar_url=self.avatar_url,
            banner_url=self.banner_url,
            bio=self.bio,
            games_played=self.games_played,
            games_won=self.games_won,
            games_lose=self.games_lose,
            total_score=self.total_score,
            best_streak=self.best_streak,
            current_streak=self.current_streak,
            in_game=self.in_game,
            is_active=self.is_active,
            is_verified=self.is_verified,
            toast_user=self.toast_user,
            created_at=self.created_at,
            updated_at=self.updated_at,
            last_login=self.last_login,
            win_rate=self.win_rate,
            average_score=self.average_score,
        )
        if to_dict:
            return data.model_dump()
        return data

    @property
    def win_rate(self) -> float:
        total_resolved = self.games_won + self.games_lose
        if self.games_played == 0 or total_resolved == 0:
            return 0.0
        return (self.games_won / total_resolved) * 100

    @property
    def average_score(self) -> float:
        total_resolved = self.games_won + self.games_lose
        if self.games_played == 0 or total_resolved == 0:
            return 0.0
        return self.total_score / total_resolved


class GameSessionStatus(StrEnum):
    """Enum for game session status"""
    
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GameSession(Model):
    """Model to track game sessions/lobbies"""

    session_id = fields.CharField(max_length=50, pk=True)
    lobby_id = fields.CharField(max_length=20)
    creator_id = fields.CharField(max_length=50)

    # Game configuration
    max_players = fields.IntField(default=8)
    game_config = fields.JSONField(
        default=dict
    )  # Store game settings like max_images, seed, etc.

    # Game state
    status = fields.CharEnumField(enum_type=GameSessionStatus, default="in_progress")
    started_at = fields.DatetimeField(null=True)
    ended_at = fields.DatetimeField(null=True)
    winner_id = fields.CharField(max_length=50, null=True)

    # Timestamps
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "game_sessions"

    def __str__(self):
        return f"GameSession({self.lobby_id} - {self.status})"
