import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = "IntelliDeskAI"

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        self.client = AsyncIOMotorClient(MONGO_URI)
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
    client = MongoClient(MONGO_URI)
    return client[DATABASE_NAME]
