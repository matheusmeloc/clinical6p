from app.auth import get_password_hash

try:
    print("Attempting to hash password...")
    hash = get_password_hash("test")
    print(f"Success: {hash}")
except Exception as e:
    print(f"Error: {e}")
