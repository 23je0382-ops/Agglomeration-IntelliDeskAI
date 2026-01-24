import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

# MongoDB Configuration
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "Agglomeration2"

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        self.client = AsyncIOMotorClient(MONGODB_URL)
        self.db = self.client[DATABASE_NAME]
        print(f"Connected to MongoDB: {DATABASE_NAME}")

    def close(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

# Singleton instance
db = MongoDB()

def get_database():
    return db.db
