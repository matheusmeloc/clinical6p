"""
Script de Teste: test_hang_2.py

Variante do script test_hang.py. Explora outras condições de
concorrência que possam congelar a execução.
"""
import requests

def test_dashboard_routes():
    session = requests.Session()
    
    print("\nTesting Dashboard Stats...")
    try:
        stats_resp = session.get("https://clinicapsi.onrender.com/api/dashboard/stats", timeout=10)
        print(f"Stats Status: {stats_resp.status_code}")
    except Exception as e:
        print(f"Stats Error: {e}")

    print("\nTesting /api/professionals...")
    try:
        prof_resp = session.get("https://clinicapsi.onrender.com/api/professionals", timeout=10)
        print(f"Prof Status: {prof_resp.status_code}")
    except Exception as e:
        print(f"Prof Error: {e}")
        
    print("\nTesting /api/appointments...")
    try:
        apt_resp = session.get("https://clinicapsi.onrender.com/api/appointments", timeout=10)
        print(f"Apt Status: {apt_resp.status_code}")
    except Exception as e:
        print(f"Apt Error: {e}")

if __name__ == "__main__":
    test_dashboard_routes()
