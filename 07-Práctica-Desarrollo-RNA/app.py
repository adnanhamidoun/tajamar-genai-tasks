from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
import joblib

# Inicialización de la aplicación Flask
app = Flask(__name__)

# -------------------------------------------------------------------
# CARGA DE ARTEFACTOS SERIALIZADOS
# -------------------------------------------------------------------
try:
    model = tf.keras.models.load_model('housing_model_final.keras')
    scaler_X = joblib.load('scaler_X.pkl')
    scaler_y = joblib.load('scaler_y.pkl')
    print("[INFO] Artefactos cargados exitosamente.")
except Exception as e:
    print(f"[ERROR CRÍTICO] Fallo al cargar artefactos predictivos. Error: {e}")

# -------------------------------------------------------------------
# FUNCIONES DE PREPROCESAMIENTO
# -------------------------------------------------------------------
def preprocess_input(data):
    """
    Convierte el diccionario JSON JSON entrante al vector numérico
    estandarizado y ordenado que la matriz neuronal requiere.
    """
    # Mapeo binario
    binary_mapping = {'yes': 1, 'no': 0}
    
    # Mapeo posicional explícito que usó el modelo 
    # (El array debe respetar la estructura de X_train en la fase 3)
    # Suponiendo el orden habitual: area, bedrooms, bathrooms, stories, mainroad,
    # guestroom, basement, hotwaterheating, airconditioning, parking, prefarea,
    # furnishingstatus_furnished, furnishingstatus_semi-furnished, furnishingstatus_unfurnished
    
    area = float(data.get('area', 0))
    bedrooms = float(data.get('bedrooms', 0))
    bathrooms = float(data.get('bathrooms', 0))
    stories = float(data.get('stories', 0))
    
    mainroad = binary_mapping.get(data.get('mainroad', 'no').lower(), 0)
    guestroom = binary_mapping.get(data.get('guestroom', 'no').lower(), 0)
    basement = binary_mapping.get(data.get('basement', 'no').lower(), 0)
    hotwaterheating = binary_mapping.get(data.get('hotwaterheating', 'no').lower(), 0)
    airconditioning = binary_mapping.get(data.get('airconditioning', 'no').lower(), 0)
    parking = float(data.get('parking', 0))
    prefarea = binary_mapping.get(data.get('prefarea', 'no').lower(), 0)
    
    # One-Hot Encoding para furnishingstatus
    status = data.get('furnishingstatus', '').lower()
    furnished = 1.0 if status == 'furnished' else 0.0
    semi_furnished = 1.0 if status == 'semi-furnished' else 0.0
    unfurnished = 1.0 if status == 'unfurnished' else 0.0
    
    # Vectorización en el orden correcto
    feature_vector = np.array([[
        area, bedrooms, bathrooms, stories, mainroad,
        guestroom, basement, hotwaterheating, airconditioning, parking, prefarea,
        furnished, semi_furnished, unfurnished
    ]])
    
    return feature_vector

# -------------------------------------------------------------------
# ENDPOINT DE PREDICCIÓN
# -------------------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict_price():
    try:
        # Obtener los datos JSON interactivos
        data = request.get_json()
        
        # 1. Preprocesar las características a su vector base
        processed_data = preprocess_input(data)
        
        # 2. Escalar características usando scaler_X (estandarización)
        scaled_input = scaler_X.transform(processed_data)
        
        # 3. Predicción con la Red Neuronal Keras
        prediction_scaled = model.predict(scaled_input)
        
        # 4. Des-escalar la predicción para recuperar la divisa (inverse_transform)
        prediction_real = scaler_y.inverse_transform(prediction_scaled)
        final_price = float(prediction_real[0][0])
        
        return jsonify({
            'status': 'success',
            'predicted_price': final_price,
            'input_data_received': data
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

# -------------------------------------------------------------------
# MAIN SERVER
# -------------------------------------------------------------------
if __name__ == '__main__':
    # Entorno productivo simulado. Desactivado degub en producción estándar.
    app.run(host='0.0.0.0', port=5000, debug=False)
