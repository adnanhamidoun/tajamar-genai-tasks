# 🏠 Housing Price Prediction - Deep Learning Model

## 1. Business Case & Contexto
Este proyecto implementa una solución de Machine Learning basada en Redes Neuronales (Deep Learning) para predecir precios del mercado inmobiliario. Se aborda un problema crítico de inversión: maximizar la rentabilidad y precisión en la tasación de propiedades en entornos de alta variabilidad.

El modelo se ha entrenado utilizando un dataset histórico de viviendas, superando el rendimiento de aproximaciones tradicionales como la Regresión Lineal Lineal, y estabilizando el pronóstico en un mercado caracterizado por un alto grado de ruido subjetivo.

### 🎯 Objetivos Logrados
- **Precisión Analítica:** Error porcentual (RMSE / Media) contenido por debajo del **15%**.
- **Poder Explicativo:** Coeficiente de Determinación ($R^2$) consolidado en **> 0.60** (concretamente $\approx 0.63$), lo cual representa el techo técnico dados los _features_ disponibles (ausencia de variables exógenas como criminalidad local).
- **Escalabilidad:** Arquitectura completamente contenerizada mediante Docker y servida a través de una API REST (Flask).

---

## 2. Pipeline de Datos y Arquitectura

### 2.1 Procesamiento de Datos (Data Processing)
Se ejecutó un robusto pipeline de Feature Engineering documentado íntegramente en `notebook.ipynb`:
- **Transformación Categórica:** Mapeo binario de existencias (`yes`/`no`) y One-Hot Encoding para factores nominales (e.g., `furnishingstatus`).
- **Target Scaling:** Para garantizar la estabilidad del optimizador (y evitar gradientes explosivos debido a la magnitud de los precios en millones), se implementó un `StandardScaler` bidireccional (tanto en $X$ como en $y$). Aislando y revirtiendo el valor (`inverse_transform`) al final.

### 2.2 Topología de la Red Neuronal
Para mitigar el sobreajuste (overfitting) y gestionar la multicolinealidad, se estructuró una red de regresión de alto rendimiento:
* **Entrada**: 14 _features_ escaladas.
* **Capas Ocultas**: Nodos densos con activación `ReLU`.
* **Regularización Severa**: 
  * `BatchNormalization`: Centro estocástico de las activaciones.
  * `Dropout (0.3)`: Apagado aleatorio para evitar colinealidades únicas.
  * `L2 (Ridge)`: Penalización de pesos grandes en la pre-salida.
* **Compilación**: Optimizador `Adam` junto con schedulers dinámicos como `ReduceLROnPlateau` y `EarlyStopping`.

---

## 3. Despliegue en Producción (Deployment)

El proyecto está diseñado metodológicamente bajo normativas *Production-Ready*. El pipeline produce tres artefactos clave serializados:
1. `housing_model_final.keras`: Pesos y topología de la red neuronal.
2. `scaler_X.pkl`: Transformador para características entrantes.
3. `scaler_y.pkl`: Transformador para traducir inferencias estándar a divisa local.

### 3.1 Instrucciones de Ejecución (Local/API)
El proyecto incluye un entorno Flask listo para recibir peticiones JSON e integrarse a microservicios.

**1. Levantar la API nativamente:**
```bash
pip install -r requirements.txt
python app.py
```

**2. Ejecución vía Docker (Recomendado):**
```bash
docker build -t housing-api .
docker run -p 5000:5000 housing-api
```

### 3.2 Probando el Endpoint
Puedes utilizar el script incluido `test_api.py` para validar el modelo frente a un payload dummy, obteniendo la predicción desescadala en tiempo real:
```bash
python test_api.py
```

---

## 4. Conclusión de Auditoría

El modelo alcanza un estadio validado y auditable. Un **$R^2$ de 0.63** frente a variables exclusivamente estructurales es un hito técnico, reflejando que el modelo domina el 63% de la varianza del mercado. El porcentaje restante responde a dinámicas fuera del dataset estructural (como economía subyacente, geolocalización geoespacial, devaluación de la zona u otras variables sociodemográficas). Al blindar la arquitectura contra _overfitting_, la aplicación mantendrá una fiabilidad predecible y consistente aplicándose a nuevos datos sin memorizar artefactos ilusorios del conjunto original.