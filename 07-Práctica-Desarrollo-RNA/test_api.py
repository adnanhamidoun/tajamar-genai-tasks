import requests
import json

# URL estipulada para el contenedor Docker o endpoint local
API_URL = "http://127.0.0.1:5000/predict"

# Payload representativo de prueba (JSON).
# Contiene la parametrización simulada de una vivienda estándar
payload = {
    "area": 7420,
    "bedrooms": 4,
    "bathrooms": 2,
    "stories": 3,
    "mainroad": "yes",
    "guestroom": "no",
    "basement": "no",
    "hotwaterheating": "no",
    "airconditioning": "yes",
    "parking": 2,
    "prefarea": "yes",
    "furnishingstatus": "furnished"
}

if __name__ == "__main__":
    print("-" * 50)
    print(f"[TEST] Enviando Petición POST a: {API_URL}")
    print(f"[PAYLOAD] \n{json.dumps(payload, indent=2)}")
    print("-" * 50)
    
    try:
        response = requests.post(API_URL, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            precio_estimado = result.get('predicted_price', 0)
            print(f"[STATUS] 200 OK")
            print(f"[RESULTADO CRÍTICO] Precio de Inferencia de Mercado: ${precio_estimado:,.2f}")
        else:
            print(f"[STATUS] Fallo con código: {response.status_code}")
            print(f"[MENSAJE] {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("[ERROR CRÍTICO] La API no está corriendo. Verifique que app.py o el contenedor Docker se encuentren inicializados en el puerto 5000.")
