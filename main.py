import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
import random

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("app.log")],
)
logger = logging.getLogger(__name__)

# Create static directories if they don't exist
os.makedirs("static/images", exist_ok=True)

# Configure CORS to allow frontend connections
# origins = [
#     "http://localhost:5173",  # Vite dev server default port
#     "http://localhost:8000",  # FastAPI server
#     "http://127.0.0.1:5173",
#     "http://127.0.0.1:8000",
#     # Add production domains here when deploying
# ]

app = FastAPI(
    title="Khawawish The Guessing Game API",
    description="API for the Khawawish character guessing game",
    version="1.0.0",
)
load_dotenv()
db_url = os.getenv("DATABASE_URL")

# register_tortoise(
#     app,
#     modules={"models": ["models.game", "aerich.models"]},
#     db_url=db_url,
#     generate_schemas=True,
#     add_exception_handlers=True,
# )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

games = []

api = APIRouter(prefix="api/")


def get_static_file_names():
    static_dir = "static/images"
    return [
        f for f in os.listdir(static_dir) if os.path.isfile(os.path.join(static_dir, f))
    ]


static_file_names = get_static_file_names()


@api.get("/images")
async def get_images(seed: int, max_images: int):
    random.seed(seed)
    selected = random.sample(static_file_names, min(max_images, len(static_file_names)))
    return {"files": selected}


@api.websocket("/ws/game")
async def websocket_download(websocket: WebSocket):
    """WebSocket endpoint for real-time download progress with multiple download support"""
    await websocket.accept()
    HEARTBEAT_INTERVAL = 7

    async def send_heartbeat():
        while True:
            try:
                await websocket.send_json({"type": "ping"})
            except Exception:
                break
            await asyncio.sleep(HEARTBEAT_INTERVAL)

    async def handle_messages():
        """Handle incoming WebSocket messages"""
        try:
            while True:
                data = await websocket.receive_json()

                if data.get("type", "") == "pong":
                    continue
                elif data.get("type", "") == "start":
                    ...
                else:

                    asyncio.create_task(process_game())

        except WebSocketDisconnect:
            logger.info("Client disconnected")
        except Exception as e:
            logger.warning(f"Message handling error: {e}")

    async def process_game():
        """Process download in background while allowing message handling"""
        ...

    # Start all background tasks
    heartbeat_task = asyncio.create_task(send_heartbeat())
    message_task = asyncio.create_task(handle_messages())

    try:
        done, pending = await asyncio.wait(
            [heartbeat_task, message_task],
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
        # Cancel all background tasks
        for task in [heartbeat_task, message_task]:
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        try:
            await websocket.close()
        except Exception:
            pass


app.include_router(api)
