import urllib.request
import json

url = "http://localhost:8000/api/patients"
data = json.dumps({
    "name": "Test Patient",
    "cpf": "333.333.333-33",
    "password": "",
    "care_modality": "Presencial"
}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as f:
        print(f.status, f.read().decode("utf-8"))
except Exception as e:
    print(e.code, e.read().decode("utf-8"))
