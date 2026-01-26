from pymongo import MongoClient

# Config from mongodb.py
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "IntelliuDeskAI"

def check_users():
    print(f"Connecting to {MONGODB_URL}...")
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # List collections
    collections = db.list_collection_names()
    print(f"Collections in '{DATABASE_NAME}': {collections}")
    
    if "users" in collections:
        print("\nSUCCESS: 'users' collection found.")
        count = db.users.count_documents({})
        print(f"Document count: {count}")
        for user in db.users.find({}, {"hashed_password": 0}):
            print(f" - User: {user.get('email', 'No Email')}")
    else:
        print("\nNOTE: 'users' collection NOT found.")
        print("MongoDB creates collections lazily. The 'users' collection will only appear AFTER you successfully register the first user through the web application.")

    client.close()

if __name__ == "__main__":
    check_users()
