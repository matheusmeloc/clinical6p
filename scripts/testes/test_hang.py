"""
Script de Teste: test_hang.py

Reproduz cenários de travamento deliberado (hang) na aplicação 
para verificar timeouts e a resiliência dos serviços.
"""
import requests

def test_login_and_dashboard():
    session = requests.Session()
    print("Logging in as matheumelo@gmail.com...")
    login_resp = session.post("https://clinicapsi.onrender.com/api/login", json={
        "email": "matheumelo@gmail.com",
        "password": "1234"
    })
    print(f"Login Status: {login_resp.status_code}")
    print(f"Login Response: {login_resp.text}")
    
    if login_resp.status_code == 200:
        print("\nTesting Dashboard Stats...")
        stats_resp = session.get("https://clinicapsi.onrender.com/api/dashboard/stats")
        print(f"Stats Status: {stats_resp.status_code}")
        print(f"Stats Response: {stats_resp.text}")

        # O frontend usa o ID do Usuário para buscar o perfil do Profissional.
        # O ID do Usuário aqui é 3, como mostrado anteriormente.
        # But wait, frontend fetches from `/api/professionals` probably.
        print("\nTesting /api/professionals...")
        prof_resp = session.get("https://clinicapsi.onrender.com/api/professionals")
        print(f"Prof Status: {prof_resp.status_code}")
        # print(f"Prof Response: {prof_resp.text}") # might be large
        
        print("\nTesting /api/appointments...")
        apt_resp = session.get("https://clinicapsi.onrender.com/api/appointments")
        print(f"Apt Status: {apt_resp.status_code}")

if __name__ == "__main__":
    test_login_and_dashboard()
