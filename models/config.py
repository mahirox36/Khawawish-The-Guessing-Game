import os
from tortoise import Tortoise
from dotenv import load_dotenv

load_dotenv()

# Default to SQLite if no DATABASE_URL is provided

async def init_db():
    db_url = os.getenv("DATABASE_URL")
    await Tortoise.init(
        db_url=db_url,
        modules={"models": ["models.game", "aerich.models"]},
    )
    await Tortoise.generate_schemas()

TORTOISE_ORM = {
    "connections": {
        "default": os.getenv("DATABASE_URL"),
    },
    "apps": {
        "models": {
            "models": ["models.game", "aerich.models"],
            "default_connection": "default",
        }
    },
}