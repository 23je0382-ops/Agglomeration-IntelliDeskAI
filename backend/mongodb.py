import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import certifi

from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = "IntelliuDeskAI"

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        # Use certifi for proper SSL certificate validation on Render
        self.client = AsyncIOMotorClient(MONGODB_URL, tlsCAFile=certifi.where())
        self.db = self.client[DATABASE_NAME]
        print(f"Connected to MongoDB: {DATABASE_NAME}")

    def close(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

# Singleton instance
db = MongoDB()

def get_database():
    """Get Async Database (for FastAPI)"""
    return db.db

def get_sync_db():
    """Get Sync Database (for Background Threads)"""
    client = MongoClient(MONGODB_URL, tlsCAFile=certifi.where())
    return client[DATABASE_NAME]
