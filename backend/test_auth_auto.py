import requests
import sys
import time

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_register():
    print("Testing Registration...")
    unique_id = int(time.time())
    payload = {
        "email": f"auto_user_{unique_id}@example.com",
        "password": "validPassword123",
        "name": f"Auto Tester {unique_id}"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("\nSUCCESS: Registration worked!")
            return True
        elif response.status_code == 400:
            print("\nFAILED: Bad Request. Likely user already exists or validation error.")
            return False
        else:
            print("\nFAILED: Server Error.")
            return False
            
    except Exception as e:
        print(f"EXCEPTION: {e}")
        return False

if __name__ == "__main__":
    success = test_register()
    if not success:
        sys.exit(1)
