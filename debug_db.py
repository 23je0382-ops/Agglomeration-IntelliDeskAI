from pymongo import MongoClient
import json

client = MongoClient("mongodb://localhost:27017")
db = client["IntelliuDeskAI"]

print("--- Users in IntelliuDeskAI ---")
for user in db.users.find():
    del user["hashed_password"]
    if "_id" in user:
        user["_id"] = str(user["_id"])
    print(json.dumps(user, indent=2))

client.close()
