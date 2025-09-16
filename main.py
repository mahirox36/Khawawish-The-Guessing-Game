import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    Depends,
    status,
)
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import logging
from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from tortoise.exceptions import IntegrityError
import random
from typing import List, Union, Optional
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from models.game import User, GameSession

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Create static directories if they don't exist
os.makedirs("static/images", exist_ok=True)

app = FastAPI(
    title="Khawawish The Guessing Game API",
    description="API for the Khawawish character guessing game",
    version="1.0.0",
)

load_dotenv()
db_url = os.getenv("db_url", "sqlite://db.sqlite3")

JWT_SECRET = os.getenv("JWT_SECRET", "secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def utcnow():
    return datetime.now(timezone.utc)


# Register Tortoise ORM
register_tortoise(
    app,
    modules={"models": ["models.game", "aerich.models"]},
    db_url=db_url,
    generate_schemas=True,
    add_exception_handlers=True,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/api/static", StaticFiles(directory="static"), name="static")

api = APIRouter(prefix="/api")


# Pydantic models for API
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user_id: str
    username: str
    display_name: str
    email: str
    games_played: int
    games_won: int
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Utility functions
def get_static_file_names():
    static_dir = "static/images"
    return [
        f for f in os.listdir(static_dir) if os.path.isfile(os.path.join(static_dir, f))
    ]


static_file_names = get_static_file_names()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = await User.get_or_none(user_id=user_id)
    if user is None:
        raise credentials_exception
    return user


class ConnectionManager:
    def __init__(self):
        # maps userID -> GameWebSocket
        self.connections: dict[str, "GameWebSocket"] = {}

    def add(self, user_id: str, ws: "GameWebSocket"):
        self.connections[user_id] = ws

    def remove(self, user_id: str):
        self.connections.pop(user_id, None)

    def get(self, user_id: str) -> Union["GameWebSocket", None]:
        return self.connections.get(user_id)

    async def broadcast_lobby(self, message: dict, lobby: str, exclude: List[str] = []):
        """Send a message to all connections (optionally excluding some)"""
        for uid, conn in self.connections.items():
            if uid not in exclude and conn.lobby_id == lobby:
                try:
                    await conn.websocket.send_json(message)
                except Exception:
                    pass

    async def broadcast(self, message: dict, exclude: List[str] = []):
        """Send a message to all connections (optionally excluding some)"""
        for uid, conn in self.connections.items():
            if uid not in exclude:
                try:
                    await conn.websocket.send_json(message)
                except Exception:
                    pass


class Player:
    def __init__(self, user_id: str, username: str, display_name: str):
        self.user_id = user_id
        self.username = username
        self.display_name = display_name
        self.is_ready = False
        self.character: Optional[str] = None

    def to_dict(self):
        # Hidden the character field for privacy
        return {
            "user_id": self.user_id,
            "username": self.username,
            "display_name": self.display_name,
            "is_ready": self.is_ready,
        }


class GameLobby:
    def __init__(
        self,
        lobby_id: str,
        max_characters: int,
        seed: str,
        password: str | None = None,
        lobby_name: str = "Game Lobby",
        creator_id: str = "",
        is_private: bool = False,
        owner_id: str = "",
        owner_username: str = "",
        owner_display_name: str = "",
    ):
        self.lobby_id = lobby_id
        self.max_characters = max_characters
        self.seed = seed
        self.owner: Optional[Player] = Player(
            owner_id, owner_username, owner_display_name
        )
        self.second_player: Optional[Player] = None
        self.password: str | None = password
        self.lobby_name = lobby_name
        self.creator_id = creator_id
        self.is_private = is_private
        self.state: dict = {}  # custom game state (characters, etc.)
        self.created_at = utcnow()
        self.game_started = False
        self.user_turn = owner_id

    def switch_turn(self):
        if not self.owner or not self.second_player:
            return
        if self.user_turn == self.owner.user_id:
            self.user_turn = self.second_player.user_id
        else:
            self.user_turn = self.owner.user_id

    def add_second_player(self, user_id: str, username: str, display_name: str):
        if not self.second_player:
            self.second_player = Player(user_id, username, display_name)

    def remove_player(self, user_id: str):
        if self.owner and self.second_player and user_id == self.owner.user_id:
            self.owner = self.second_player
            self.second_player = None
        elif self.second_player and user_id == self.second_player.user_id:
            self.second_player = None
        elif self.owner and user_id == self.owner.user_id:
            self.owner = None

    def is_empty(self) -> bool:
        return self.second_player is None and self.owner is None

    def set_player_ready(self, user_id: str, ready: bool = True):
        if self.owner and self.owner.user_id == user_id:
            self.owner.is_ready = ready
        elif self.second_player and self.second_player.user_id == user_id:
            self.second_player.is_ready = ready

    def all_players_ready(self) -> bool:
        players = [p for p in [self.owner, self.second_player] if p]
        return len(players) > 0 and all(player.is_ready for player in players)

    def set_player_character(self, user_id: str, character: str):
        if self.owner and self.owner.user_id == user_id:
            self.owner.character = character
        elif self.second_player and self.second_player.user_id == user_id:
            self.second_player.character = character

    def all_players_selected(self) -> bool:
        players = [p for p in [self.owner, self.second_player] if p]
        return len(players) > 0 and all(
            player.character is not None for player in players
        )

    def guess_character(self, user_id: str, character: str) -> bool:
        player = None
        if self.owner and self.owner.user_id == user_id:
            player = self.second_player
        elif self.second_player and self.second_player.user_id == user_id:
            player = self.owner

        if player and player.character == character:
            return True
        return False

    async def get_images(self, isRematch: bool = False) -> List[str]:
        self.seed = str(uuid.uuid4()) if isRematch else self.seed
        if isRematch and self.owner and self.owner.character:
            self.owner.character = None
        if isRematch and self.second_player and self.second_player.character:
            self.second_player.character = None
        random.seed(self.seed)
        return random.sample(
            static_file_names, min(self.max_characters, len(static_file_names))
        )

    def player_counter(self):
        count = 0
        if self.owner:
            count += 1
        if self.second_player:
            count += 1
        return count

    def to_dict(self):
        return {
            "lobby_id": self.lobby_id,
            "lobby_name": self.lobby_name,
            "max_images": self.max_characters,
            "seed": self.seed,
            "owner": self.owner.to_dict() if self.owner else None,
            "second_player": (
                self.second_player.to_dict() if self.second_player else None
            ),
            "has_password": self.password is not None,
            "is_private": self.is_private,
            "creator_id": self.creator_id,
            "created_at": self.created_at.isoformat(),
            "game_started": self.game_started,
            "user_turn": self.user_turn,
            "player_count": self.player_counter(),
        }


class LobbyManager:
    lobbies: dict[str, GameLobby] = {}

    @classmethod
    def create_lobby(
        cls,
        max_characters: int,
        seed: str,
        password: str | None = None,
        lobby_name: str = "Game Lobby",
        creator_id: str = "",
        is_private: bool = False,
        owner_id: str = "",
        owner_username: str = "",
        owner_display_name: str = "",
    ) -> GameLobby:
        lobby_id = str(uuid.uuid4())[:8]  # Shorter lobby IDs
        lobby = GameLobby(
            lobby_id,
            max_characters,
            seed,
            password,
            lobby_name,
            creator_id,
            is_private,
            owner_id,
            owner_username,
            owner_display_name,
        )
        cls.lobbies[lobby_id] = lobby
        return lobby

    @classmethod
    def get(cls, lobby_id: str) -> GameLobby | None:
        return cls.lobbies.get(lobby_id)

    @classmethod
    def delete_if_empty(cls, lobby_id: str):
        lobby = cls.lobbies.get(lobby_id)
        if lobby and lobby.is_empty():
            cls.lobbies.pop(lobby_id, None)

    @classmethod
    def get_public_lobbies(cls):
        return [
            lobby.to_dict()
            for _, lobby in cls.lobbies.items()
            if not lobby.is_private and not lobby.game_started
        ]

    @classmethod
    def get_all_lobbies(cls):
        return [lobby.to_dict() for _, lobby in cls.lobbies.items()]


class GameWebSocket:
    HEARTBEAT_INTERVAL = 7
    connection = ConnectionManager()

    def __init__(self, websocket: WebSocket, user: User):
        self.websocket = websocket
        self.user = user
        self.heartbeat_task: asyncio.Task | None = None
        self.message_task: asyncio.Task | None = None
        self.lobby_id: str = ""
        self.signed_in = False
        self.game_session : Optional[GameSession] = None

    async def start(self):
        """Entry point to manage WebSocket lifecycle"""
        await self.websocket.accept()
        self.heartbeat_task = asyncio.create_task(self.send_heartbeat())
        self.message_task = asyncio.create_task(self.handle_messages())

        try:
            done, pending = await asyncio.wait(
                [self.heartbeat_task, self.message_task],
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        except Exception as e:
            logger.warning(f"WebSocket error: {e}")
        finally:
            await self.cleanup()

    async def send_heartbeat(self):
        while True:
            try:
                await self.websocket.send_json({"type": "ping"})
            except Exception:
                break
            await asyncio.sleep(self.HEARTBEAT_INTERVAL)

    async def handle_messages(self):
        """Handle incoming WebSocket messages"""
        try:
            while True:
                data: dict = await self.websocket.receive_json()
                msg_type = data.get("type", "")

                if msg_type == "pong":
                    continue
                elif msg_type == "sign":
                    self.connection.add(self.user.user_id, self)
                    self.signed_in = True
                elif msg_type == "create_lobby":
                    if not self.signed_in:
                        self.connection.add(self.user.user_id, self)
                    lobby = LobbyManager.create_lobby(
                        data.get("maxImages", 25),
                        str(uuid.uuid4()),
                        data.get("password", None),
                        data.get("lobbyName", "Game Lobby"),
                        self.user.user_id,
                        data.get("isPrivate", False),
                        self.user.user_id,
                        self.user.username,
                        self.user.display_name,
                    )
                    self.lobby_id = lobby.lobby_id
                    await self.websocket.send_json(
                        {"type": "lobby_created", "lobby": lobby.to_dict()}
                    )
                    await self.connection.broadcast(
                        {
                            "type": "new_lobby",
                            "public_lobbies": LobbyManager.get_public_lobbies(),
                            "total_lobbies": len(LobbyManager.lobbies),
                        }
                    )

                elif msg_type == "join_lobby":
                    lobby_id: str = data.get("lobby_id", "")
                    password: str = data.get("password", "")
                    lobby = LobbyManager.get(lobby_id)

                    if not lobby:
                        await self.websocket.send_json(
                            {"type": "join_failed", "reason": "Lobby not found"}
                        )
                        continue

                    if lobby.password and lobby.password != password:
                        await self.websocket.send_json(
                            {"type": "join_failed", "reason": "Incorrect password"}
                        )
                        continue

                    if lobby.game_started:
                        await self.websocket.send_json(
                            {"type": "join_failed", "reason": "Game already started"}
                        )
                        continue
                    if not self.signed_in:
                        self.connection.add(self.user.user_id, self)
                    lobby.add_second_player(
                        self.user.user_id, self.user.username, self.user.display_name
                    )
                    self.lobby_id = lobby_id

                    await self.connection.broadcast_lobby(
                        {
                            "type": "player_joined",
                            "player": {
                                "user_id": self.user.user_id,
                                "username": self.user.username,
                                "display_name": self.user.display_name,
                            },
                            "lobby": lobby.to_dict(),
                        },
                        self.lobby_id,
                    )

                    await self.websocket.send_json(
                        {"type": "lobby_joined", "lobby": lobby.to_dict()}
                    )

                elif msg_type == "ready":
                    lobby = LobbyManager.get(self.lobby_id)
                    if lobby:
                        is_ready = data.get("ready", True)
                        lobby.set_player_ready(self.user.user_id, is_ready)
                        await self.connection.broadcast_lobby(
                            {
                                "type": "player_ready_changed",
                                "lobby": lobby.to_dict(),
                                "user_id": self.user.user_id,
                                "ready": is_ready,
                                "all_ready": lobby.all_players_ready(),
                            },
                            self.lobby_id,
                        )

                elif msg_type == "start_game":
                    lobby = LobbyManager.get(self.lobby_id)
                    isRematch = data.get("isRematch", False)
                    if not lobby:
                        await self.websocket.send_json(
                            {"type": "start_failed", "reason": "Lobby not found"}
                        )
                        continue

                    if lobby.creator_id != self.user.user_id:
                        await self.websocket.send_json(
                            {
                                "type": "start_failed",
                                "reason": "Only lobby creator can start the game",
                            }
                        )
                        continue

                    if not lobby.all_players_ready():
                        await self.websocket.send_json(
                            {
                                "type": "start_failed",
                                "reason": "Not all players are ready",
                            }
                        )
                        continue

                    images = await lobby.get_images(isRematch)
                    lobby.state["images"] = images
                    lobby.game_started = True

                    # Create game session in database
                    self.game_session = await GameSession.create(
                        session_id=str(uuid.uuid4()),
                        lobby_id=lobby.lobby_id,
                        creator_id=lobby.creator_id,
                        max_players=2,
                        game_config={
                            "max_images": lobby.max_characters,
                            "seed": lobby.seed,
                        },
                    )

                    await self.connection.broadcast_lobby(
                        {
                            "type": "rematch_started" if isRematch else "game_started",
                            "images": images,
                            "session_id": self.game_session.session_id,
                        },
                        self.lobby_id,
                    )

                elif msg_type == "select_own_character":
                    character = data.get("character")
                    lobby = LobbyManager.get(self.lobby_id)
                    if lobby and character:
                        lobby.set_player_character(self.user.user_id, character)
                        if lobby.all_players_selected():
                            await self.connection.broadcast_lobby(
                                {
                                    "type": "selection_complete",
                                    "lobby": lobby.to_dict(),
                                },
                                self.lobby_id,
                            )
                elif msg_type == "guess":
                    guessed_character = data.get("character")
                    lobby = LobbyManager.get(self.lobby_id)
                    if lobby and guessed_character:
                        if lobby.guess_character(self.user.user_id, guessed_character):
                            lobby.switch_turn()
                            await self.websocket.send_json(
                                {
                                    "type": "correct_guess",
                                    "user_id": self.user.user_id,
                                    "username": self.user.username,
                                    "display_name": self.user.display_name,
                                    "character": guessed_character,
                                }
                            )
                            await self.connection.broadcast_lobby(
                                {
                                    "type": "player_scored",
                                    "user_id": self.user.user_id,
                                    "username": self.user.username,
                                    "display_name": self.user.display_name,
                                    "character": guessed_character,
                                    "lobby": lobby.to_dict(),
                                },
                                self.lobby_id,
                                [self.user.user_id],
                            )
                        else:
                            lobby.switch_turn()
                            await self.websocket.send_json(
                                {
                                    "type": "incorrect_guess",
                                    "character": guessed_character,
                                    "lobby": lobby.to_dict(),
                                }
                            )
                            await self.connection.broadcast_lobby(
                                {
                                    "type": "update_lobby",
                                    "lobby": lobby.to_dict(),
                                },
                                self.lobby_id,
                            )
                elif msg_type == "end_turn":
                    lobby = LobbyManager.get(self.lobby_id)
                    if lobby:
                        lobby.switch_turn()
                        await self.connection.broadcast_lobby(
                            {
                                "type": "end_turn",
                                "lobby": lobby.to_dict(),
                            },
                            self.lobby_id,
                        )
                elif msg_type == "kick_player":
                    lobby = LobbyManager.get(self.lobby_id)
                    if not lobby:
                        continue
                    if lobby.creator_id != self.user.user_id:
                        await self.websocket.send_json(
                            {
                                "type": "kick_failed",
                                "reason": "Only lobby creator can kick players",
                            }
                        )
                        continue
                    kick_user_id = data.get("user_id", "")
                    if kick_user_id == self.user.user_id:
                        continue  # Can't kick yourself
                    if (
                        lobby.second_player
                        and lobby.second_player.user_id == kick_user_id
                    ):
                        lobby.remove_player(kick_user_id)
                        await self.connection.broadcast_lobby(
                            {
                                "type": "player_kicked",
                                "lobby": lobby.to_dict(),
                            },
                            self.lobby_id,
                        )
                        kicked_conn = self.connection.get(kick_user_id)
                        if kicked_conn:
                            kicked_conn.lobby_id = ""
                            await kicked_conn.websocket.send_json(
                                {"type": "kicked", "reason": "You were kicked from the lobby"}
                            )
                elif msg_type == "chat_message":
                    message = data.get("message", "").strip()
                    if message and len(message) <= 500:  # Limit message length
                        lobby = LobbyManager.get(self.lobby_id)
                        if lobby:
                            await self.connection.broadcast_lobby(
                                {
                                    "type": "chat_message",
                                    "user_id": self.user.user_id,
                                    "username": self.user.username,
                                    "display_name": self.user.display_name,
                                    "message": message,
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                },
                                self.lobby_id,
                            )
                elif msg_type == "leave_lobby":
                    lobby = LobbyManager.get(self.lobby_id)
                    if lobby:
                        lobby.remove_player(self.user.user_id)
                        await self.connection.broadcast_lobby(
                            {
                                "type": "player_left_in_results",
                                "user_id": self.user.user_id,
                                "username": self.user.username,
                                "lobby": lobby.to_dict(),
                            },
                            self.lobby_id,
                            [self.user.user_id],
                        )

                        LobbyManager.delete_if_empty(self.lobby_id)
                        await self.connection.broadcast(
                            {
                                "type": "new_lobby",
                                "public_lobbies": LobbyManager.get_public_lobbies(),
                                "total_lobbies": len(LobbyManager.lobbies),
                            }
                        )
                        self.lobby_id = ""

                else:
                    logger.warning(f"Unknown message type: {msg_type}")

        except WebSocketDisconnect:
            logger.info(f"User {self.user.username} disconnected")
        except Exception as e:
            logger.warning(f"Message handling error: {e}")

    async def cleanup(self):
        """Cancel tasks and close WebSocket"""
        for task in [self.heartbeat_task, self.message_task]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        try:
            lobby = LobbyManager.get(self.lobby_id)
            if lobby:
                lobby.remove_player(self.user.user_id)
                await self.connection.broadcast_lobby(
                    {
                        "type": "player_left",
                        "user_id": self.user.user_id,
                        "username": self.user.username,
                        "lobby": lobby.to_dict(),
                    },
                    self.lobby_id,
                    [self.user.user_id],
                )

                LobbyManager.delete_if_empty(self.lobby_id)
                await self.connection.broadcast(
                    {
                        "type": "new_lobby",
                        "public_lobbies": LobbyManager.get_public_lobbies(),
                        "total_lobbies": len(LobbyManager.lobbies),
                    }
                )

            self.connection.remove(self.user.user_id)
            await self.websocket.close()
        except Exception as e:
            logger.warning(f"Cleanup error: {e}")


# Authentication endpoints
@api.post("/auth/register", response_model=TokenResponse)
async def register_user(user_data: UserRegister):
    try:
        # Check if username or email already exists
        existing_user = await User.get_or_none(username=user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )

        existing_email = await User.get_or_none(email=user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists"
            )

        # Create new user
        hashed_password = hash_password(user_data.password)
        user = await User.create(
            user_id=str(uuid.uuid4()),
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password,
            display_name=user_data.display_name or user_data.username,
        )

        # Create access token
        access_token = create_access_token(data={"sub": user.user_id})

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                user_id=user.user_id,
                username=user.username,
                display_name=user.display_name,
                email=user.email,
                games_played=user.games_played,
                games_won=user.games_won,
                created_at=user.created_at,
            ),
        )

    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
        )


@api.post("/auth/login", response_model=TokenResponse)
async def login_user(user_data: UserLogin):
    user = await User.get_or_none(username=user_data.username)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # Update last login
    user.last_login = utcnow()
    await user.save()

    access_token = create_access_token(data={"sub": user.user_id})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            user_id=user.user_id,
            username=user.username,
            display_name=user.display_name,
            email=user.email,
            games_played=user.games_played,
            games_won=user.games_won,
            created_at=user.created_at,
        ),
    )


@api.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        display_name=current_user.display_name,
        email=current_user.email,
        games_played=current_user.games_played,
        games_won=current_user.games_won,
        created_at=current_user.created_at,
    )


# Lobby endpoints
@api.get("/lobbies")
async def get_lobbies():
    return {
        "public_lobbies": LobbyManager.get_public_lobbies(),
        "total_lobbies": len(LobbyManager.lobbies),
    }


@api.get("/users/stats")
async def get_user_stats(current_user: User = Depends(get_current_user)):
    total_users = await User.all().count()
    recent_games = (
        await GameSession.filter(creator_id=current_user.user_id)
        .order_by("-created_at")
        .limit(5)
    )

    return {
        "user": UserResponse(
            user_id=current_user.user_id,
            username=current_user.username,
            display_name=current_user.display_name,
            email=current_user.email,
            games_played=current_user.games_played,
            games_won=current_user.games_won,
            created_at=current_user.created_at,
        ),
        "total_users": total_users,
        "recent_games": [
            {
                "session_id": game.session_id,
                "lobby_id": game.lobby_id,
                "created_at": game.created_at,
                "status": game.status,
            }
            for game in recent_games
        ],
    }


# WebSocket endpoint with authentication
@api.websocket("/ws/game")
async def websocket_game(websocket: WebSocket, token: str):
    try:
        # Verify JWT token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user = await User.get_or_none(user_id=user_id)
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        handler = GameWebSocket(websocket, user)
        await handler.start()

    except jwt.PyJWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)


app.include_router(api)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": utcnow().isoformat()}
