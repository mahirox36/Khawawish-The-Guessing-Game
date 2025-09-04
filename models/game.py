from tortoise.models import Model
from tortoise import fields
from enum import Enum
import random
import string

class GameStatus(str, Enum):
    WAITING = "waiting"
    CHARACTER_SELECTION = "character_selection"  # New state for character selection phase
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class GameMode(str, Enum):
    TEXT = "text"      # Players type questions and answers in-game
    VOICE = "voice"    # Players use external voice chat like Discord

class GameRoom(Model):
    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=10, unique=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    status = fields.CharEnumField(GameStatus, default=GameStatus.WAITING)
    
    # Game configuration
    num_characters = fields.IntField(default=12)
    is_private = fields.BooleanField(default=False)
    password = fields.CharField(max_length=20, null=True)
    time_limit_seconds = fields.IntField(default=0)  # 0 means no limit
    allow_spectators = fields.BooleanField(default=True)
    max_players = fields.IntField(default=2)
    game_mode = fields.CharEnumField(GameMode, default=GameMode.TEXT)
    
    # Relationships
    players: fields.ReverseRelation["Player"]
    selected_characters = fields.JSONField(default=list)  # List of character IDs
    
    @classmethod
    async def create_game_room(cls, **kwargs) -> "GameRoom":
        """Create a new game room with a unique code"""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not await cls.filter(code=code).exists():
                return await cls.create(code=code, **kwargs)
                
    class Meta:
        table = "game_rooms"

class Player(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50)
    is_host = fields.BooleanField(default=False)
    is_spectator = fields.BooleanField(default=False)
    selected_character = fields.CharField(max_length=100, null=True)  # ID of the character this player selected
    is_ready = fields.BooleanField(default=False)  # Added for player ready status
    room = fields.ForeignKeyField("models.GameRoom", related_name="players")
    
    class Meta:
        table = "players"
