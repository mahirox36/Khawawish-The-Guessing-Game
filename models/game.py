from enum import StrEnum
from tortoise.models import Model
from tortoise import fields
from datetime import datetime


class User(Model):
    """User model for authentication and game statistics"""

    user_id = fields.CharField(max_length=50, pk=True)
    username = fields.CharField(max_length=50, unique=True)
    email = fields.CharField(max_length=100, unique=True)
    password_hash = fields.CharField(max_length=255)
    display_name = fields.CharField(max_length=100)

    # Profile info
    avatar_url = fields.CharField(max_length=500, null=True)
    bio = fields.TextField(null=True)

    # Game statistics
    games_played = fields.IntField(default=0)
    games_won = fields.IntField(default=0)
    total_score = fields.IntField(default=0)
    best_streak = fields.IntField(default=0)
    current_streak = fields.IntField(default=0)

    # Account status
    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    last_login = fields.DatetimeField(null=True)

    class Meta:
        table = "users"

    def __str__(self):
        return f"User({self.username})"

    @property
    def win_rate(self) -> float:
        if self.games_played == 0:
            return 0.0
        return (self.games_won / self.games_played) * 100

    @property
    def average_score(self) -> float:
        if self.games_played == 0:
            return 0.0
        return self.total_score / self.games_played


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
    status = fields.CharEnumField(enum_type=GameSessionStatus, default="waiting")
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