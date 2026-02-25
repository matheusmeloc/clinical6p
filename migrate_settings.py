import asyncio
import logging
from app.database import engine, Base
from app.models import SystemSettings # Import to ensure it's registered with Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate():
    logger.info("Starting settings migration...")
    async with engine.begin() as conn:
        # Create all tables (will only create missing ones)
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Settings migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
