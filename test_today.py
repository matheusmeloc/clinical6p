"""Quick test for the today/upcoming endpoints."""
import urllib.request
import urllib.error

for path in [
    '/api/appointments',
    '/api/appointments/today',
    '/api/appointments/upcoming',
]:
    try:
        r = urllib.request.urlopen(f'http://localhost:8000{path}', timeout=5)
        body = r.read().decode()
        print(f"{path}: {r.status} OK  body={body[:100]}")
    except urllib.error.HTTPError as e:
        body = e.read()
        ct = e.headers.get('Content-Type', 'unknown')
        print(f"{path}: HTTP {e.code}  ct={ct}  body={body[:300]}")
    except Exception as e:
        print(f"{path}: ERROR {type(e).__name__} - {e}")
