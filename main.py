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
db_url = "sqlite://db.sqlite3"

JWT_SECRET = os.getenv("JWT_SECRET", "secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

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
    ):
        self.lobby_id = lobby_id
        self.max_characters = max_characters
        self.seed = seed
        self.players: dict[str, dict] = (
            {}
        )  # user_id -> {username, display_name, is_ready}
        self.password: str | None = password
        self.lobby_name = lobby_name
        self.creator_id = creator_id
        self.is_private = is_private
        self.state: dict = {}  # custom game state (characters, etc.)
        self.created_at = utcnow()
        self.game_started = False

    def add_player(self, user_id: str, username: str, display_name: str):
        if user_id not in self.players:
            self.players[user_id] = {
                "username": username,
                "display_name": display_name,
                "is_ready": False,
                "score": 0,
            }

    def remove_player(self, user_id: str):
        if user_id in self.players:
            self.players.pop(user_id, None)

    def is_empty(self) -> bool:
        return not self.players

    def set_player_ready(self, user_id: str, ready: bool = True):
        if user_id in self.players:
            self.players[user_id]["is_ready"] = ready

    def all_players_ready(self) -> bool:
        return len(self.players) > 0 and all(
            player["is_ready"] for player in self.players.values()
        )

    async def get_images(self):
        random.seed(self.seed)
        return random.sample(
            static_file_names, min(self.max_characters, len(static_file_names))
        )

    def to_dict(self):
        return {
            "lobby_id": self.lobby_id,
            "lobby_name": self.lobby_name,
            "max_images": self.max_characters,
            "seed": self.seed,
            "players": self.players,
            "has_password": self.password is not None,
            "is_private": self.is_private,
            "creator_id": self.creator_id,
            "created_at": self.created_at.isoformat(),
            "game_started": self.game_started,
            "player_count": len(self.players),
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
    ) -> GameLobby:
        lobby_id = str(uuid.uuid4())[:8]  # Shorter lobby IDs
        lobby = GameLobby(
            lobby_id, max_characters, seed, password, lobby_name, creator_id, is_private
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
                        data.get("max_images", 25),
                        str(uuid.uuid4()),
                        data.get("password", None),
                        data.get("lobby_name", "Game Lobby"),
                        self.user.user_id,
                        data.get("is_private", False),
                    )
                    lobby.add_player(
                        self.user.user_id, self.user.username, self.user.display_name
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
                    lobby.add_player(
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

                    images = await lobby.get_images()
                    lobby.state["images"] = images
                    lobby.game_started = True

                    # Create game session in database
                    game_session = await GameSession.create(
                        session_id=str(uuid.uuid4()),
                        lobby_id=lobby.lobby_id,
                        creator_id=lobby.creator_id,
                        max_players=len(lobby.players),
                        game_config={
                            "max_images": lobby.max_characters,
                            "seed": lobby.seed,
                        },
                    )

                    await self.connection.broadcast_lobby(
                        {
                            "type": "game_started",
                            "images": images,
                            "session_id": game_session.session_id,
                        },
                        self.lobby_id,
                    )

                elif msg_type == "select_character":
                    character = data.get("character")
                    lobby = LobbyManager.get(self.lobby_id)
                    if lobby and character:
                        await self.connection.broadcast_lobby(
                            {
                                "type": "character_selected",
                                "user_id": self.user.user_id,
                                "username": self.user.username,
                                "character": character,
                            },
                            self.lobby_id,
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
