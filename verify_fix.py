import requests
import sys

try:
    # 1. Create Ticket
    print("Creating ticket...")
    res = requests.post('http://127.0.0.1:8000/api/tickets/', json={
        'title': 'Schema Test', 
        'description': 'Testing Integer ID', 
        'customer_email': 'admin@test.com'
    })
    
    if res.status_code != 200:
        print(f"FAILED to create: {res.status_code} {res.text}")
        sys.exit(1)
        
    data = res.json()
    ticket_id = data.get("id")
    print(f"Ticket Created. ID: {ticket_id} (Type: {type(ticket_id)})")
    
    if not isinstance(ticket_id, int):
        print("FAIL: ID is not an integer!")
        sys.exit(1)

    # 2. List Tickets
    print("Listing tickets...")
    res2 = requests.get('http://127.0.0.1:8000/api/tickets/')
    if res2.status_code != 200:
         print(f"FAILED to list: {res2.status_code} {res2.text}")
         sys.exit(1)
         
    tickets = res2.json()
    print(f"List success. Count: {len(tickets)}")
    print("VERIFICATION PASSED")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
