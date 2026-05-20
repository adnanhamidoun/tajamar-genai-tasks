# Contexto del proyecto: detección de anomalías en rayos X con Autoencoders

## Nombre del proyecto

**Customs X-ray Anomaly Detection with Convolutional Autoencoders**

## Objetivo

Crear una práctica académica reproducible sobre **Autoencoders aplicados a detección de anomalías en imágenes de equipaje por rayos X**.

El caso de uso se basa en el dataset **SIXray**, adaptado a un escenario de detección de anomalías:

- El modelo aprende únicamente a reconstruir equipaje normal.
- Las imágenes con objetos prohibidos se tratan como anomalías durante la evaluación.
- El resultado no debe interpretarse como detección definitiva de armas, sino como una señal de apoyo para priorizar inspección humana.

## Narrativa principal

La práctica debe explicar la diferencia entre clasificación supervisada y detección de anomalías:

- Una CNN supervisada pregunta: **¿qué objeto conocido aparece en la imagen?**
- Un autoencoder de anomalías pregunta: **¿esta imagen se parece a lo que aprendí como normal?**

Esto encaja con inspección de seguridad porque el entorno es abierto: pueden aparecer amenazas nuevas, modificadas o visualmente ambiguas.

## Dataset

Dataset objetivo: **SIXray**.

Categorías positivas:

- gun
- knife
- wrench
- pliers
- scissors
- hammer

Categoría normal:

- negative / normal baggage

Adaptación para anomalías:

- `train`: solo imágenes normales.
- `validation`: solo imágenes normales.
- `test`: mezcla de normales y positivas.

Las positivas se etiquetan como anomalías.

## Modelo

Usar un **Convolutional Autoencoder** en PyTorch:

```text
Imagen de entrada -> Encoder CNN -> Representación latente -> Decoder CNN -> Reconstrucción
```

Entrenamiento:

- Entrada: imagen normal.
- Salida esperada: la misma imagen.
- Pérdida: Mean Squared Error.

Inferencia:

- Error bajo: imagen probablemente normal.
- Error alto: imagen sospechosa o visualmente inusual.

## Requisitos técnicos

El notebook final debe incluir:

- Python y PyTorch.
- Semilla fija.
- Variables de configuración claras.
- Rutas explícitas.
- Carga del dataset.
- Separación train / validation / test.
- Definición del modelo.
- Training loop.
- Guardado del mejor modelo.
- Gráficas de pérdida de entrenamiento y validación.
- Cálculo de error de reconstrucción por imagen.
- Umbral calculado desde validación normal.
- Métricas cuantitativas.
- Visualizaciones interpretables.

## Decisión de resolución inicial

Resolución inicial:

- `128x128` para prototipo rápido, entrenamiento ágil y menor coste computacional.

Posible mejora:

- `224x224` si el entrenamiento es estable y hay capacidad suficiente de memoria y tiempo.

Esta decisión debe quedar centralizada en una variable de configuración para poder cambiarla sin reescribir el resto del notebook.

## Métricas

Usar:

- MSE como pérdida de reconstrucción.
- Score de anomalía basado en error por imagen.
- Umbral desde errores de validación normal.
- Matriz de confusión.
- Precision.
- Recall.
- F1-score.
- ROC-AUC si hay etiquetas disponibles.

## Visualizaciones prioritarias

La práctica debe ser muy visual. Priorizar:

- Muestras normales y anómalas del dataset.
- Comparación entre imagen original y reconstrucción.
- Mapa de error absoluto.
- Histograma de scores normales vs anómalos.
- Curva de pérdida.
- Matriz de confusión.
- ROC curve si aplica.

Panel visual recomendado:

```text
Original | Reconstrucción | Heatmap de error
Score: ...
Predicción: normal / sospechosa
Etiqueta real: normal / anomalía
```

## Enfoque de comunicación

Todo debe estar documentado en español con tono de tutorial.

Evitar afirmaciones fuertes como:

- “El modelo detecta armas”.
- “El modelo garantiza seguridad”.
- “El modelo identifica objetos prohibidos”.

Usar formulaciones correctas:

- “El modelo detecta desviaciones visuales respecto a equipaje normal”.
- “El sistema genera una señal de sospecha basada en reconstrucción”.
- “La decisión final corresponde a revisión humana”.

## Limitación clave

El autoencoder puede reconstruir también algunas anomalías si son visualmente parecidas al equipaje normal. Por eso el threshold y el análisis de falsos negativos son críticos.

## Divide y vencerás

El trabajo debe construirse por fases, no todo de golpe.

### Fase 1: Contexto y estructura

Objetivo:

- Definir narrativa.
- Definir estructura del notebook.
- Acordar cómo se organizarán rutas, datos y outputs.

Resultado esperado:

- Documento de contexto.
- Índice del notebook.
- Decisiones iniciales de configuración.

### Fase 0.5: Preparación y verificación del dataset

Objetivo:

- Preparar el notebook para trabajar con SIXray sin asumir que el dataset completo ya está perfectamente descargado.
- Verificar carpetas, anotaciones, listas de imágenes e imágenes disponibles antes de implementar la carga completa.
- Dejar todo preparado para que la Fase 2 pueda construir el DataFrame de rutas y etiquetas.

Markdown recomendado para el notebook:

```markdown
## Fase 0.5 — Preparación y verificación del dataset

SIXray es un dataset grande de inspección de equipaje por rayos X. En una primera iteración no conviene descargar ni procesar todo el dataset de golpe: es mejor validar primero la estructura local, trabajar con un subconjunto controlado y comprobar que el flujo de lectura funciona correctamente.

Para prototipar usaremos `USE_SUBSET = True`, limitando el número de imágenes normales y anómalas. Esto permite iterar rápido sobre la lógica del notebook antes de escalar a más datos.

SIXray tiene licencia de uso académico. Si se utiliza en una práctica, informe o presentación, debe citarse correctamente y respetar sus condiciones de uso.
```

Variables de configuración requeridas:

```python
from pathlib import Path

DATA_ROOT = Path("data/SIXray")
RAW_DIR = DATA_ROOT / "raw"
ANNOTATION_DIR = DATA_ROOT / "Annotation"
IMAGE_DIR = DATA_ROOT / "JPEGImage"
IMAGESET_DIR = DATA_ROOT / "ImageSet"
OUTPUT_DIR = Path("outputs")

USE_SUBSET = True
MAX_NORMAL_SAMPLES = 1000
MAX_ANOMALY_SAMPLES = 300

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
```

Código de verificación de estructura:

```python
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def list_directory_preview(path: Path, max_items: int = 10):
    if not path.exists():
        return []
    return sorted([p.name for p in path.iterdir()])[:max_items]


def find_images(data_root: Path):
    if not data_root.exists():
        return []
    return sorted([
        path
        for path in data_root.rglob("*")
        if path.suffix.lower() in IMAGE_EXTENSIONS
    ])


def check_dataset_structure(data_root: Path):
    annotation_dir = data_root / "Annotation"
    imageset_dir = data_root / "ImageSet"
    image_dir = data_root / "JPEGImage"
    image_paths = find_images(data_root)

    return {
        "data_root_exists": data_root.exists(),
        "num_images_found": len(image_paths),
        "annotation_exists": annotation_dir.exists(),
        "imageset_exists": imageset_dir.exists(),
        "image_dir_exists": image_dir.exists(),
        "sample_image_paths": [str(path) for path in image_paths[:10]],
    }


dataset_summary = check_dataset_structure(DATA_ROOT)
dataset_summary
```

Código para listar carpetas y archivos principales:

```python
print(f"DATA_ROOT: {DATA_ROOT.resolve()}")
print(f"Existe DATA_ROOT: {DATA_ROOT.exists()}")
print()

for name, path in {
    "RAW_DIR": RAW_DIR,
    "ANNOTATION_DIR": ANNOTATION_DIR,
    "IMAGE_DIR": IMAGE_DIR,
    "IMAGESET_DIR": IMAGESET_DIR,
    "OUTPUT_DIR": OUTPUT_DIR,
}.items():
    print(f"{name}: {path}")
    print(f"  Existe: {path.exists()}")
    print(f"  Archivos/carpetas principales: {list_directory_preview(path)}")
    print()

all_images = find_images(DATA_ROOT)
print(f"Imágenes encontradas bajo DATA_ROOT: {len(all_images)}")
print("Primeras imágenes encontradas:")
for image_path in all_images[:10]:
    print(f"- {image_path}")
```

Código para revisar `data_list.txt` si existe localmente:

```python
data_list_path = Path("data_list.txt")

if data_list_path.exists():
    links = [
        line.strip()
        for line in data_list_path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]

    print(f"Archivo data_list.txt encontrado: {data_list_path.resolve()}")
    print(f"Enlaces disponibles: {len(links)}")
    for link in links:
        print(f"- {link}")

    print()
    print("No se descargarán automáticamente archivos grandes desde el notebook.")
    print("Descarga manual recomendada:")
    print("1. Abre los enlaces anteriores en el navegador o usa el método indicado por el proveedor del dataset.")
    print("2. Coloca los archivos descargados dentro de data/SIXray o data/SIXray/raw.")
    print("3. Descomprime el contenido respetando carpetas como Annotation, ImageSet y JPEGImage.")
    print("4. Vuelve a ejecutar esta fase para verificar la estructura local.")
else:
    print("No se encontró data_list.txt local.")
    print("Si tienes enlaces de descarga, guárdalos en data_list.txt, un enlace por línea.")
```

Restricciones de esta fase:

- No implementar todavía `DataLoader`.
- No implementar todavía `transforms`.
- No implementar todavía el modelo.
- No implementar todavía entrenamiento.

Resultado esperado:

- Variables de rutas y subconjunto definidas.
- Resumen de estructura en forma de diccionario.
- Detección de `Annotation`, `ImageSet` y `JPEGImage`.
- Conteo de imágenes encontradas bajo `DATA_ROOT`.
- Instrucciones claras si existe `data_list.txt`.

### Fase 2: Dataset y exploración

Objetivo:

- Preparar carga de SIXray.
- Adaptar etiquetas a normal/anomalía.
- Visualizar ejemplos.

Resultado esperado:

- DataFrame con rutas y etiquetas.
- Grillas visuales de normales y anomalías.
- Conteo de clases.

### Fase 3: Splits y preprocessing

Objetivo:

- Crear particiones correctas para detección de anomalías.
- Definir transformaciones de imagen.
- Crear Dataset y DataLoader.

Resultado esperado:

- Train solo normal.
- Validation solo normal.
- Test mixto.
- DataLoaders reproducibles.

### Fase 4: Modelo

Objetivo:

- Implementar Autoencoder Convolucional.
- Verificar dimensiones de entrada y salida.

Resultado esperado:

- Clase PyTorch del modelo.
- Forward pass probado con un batch.

### Fase 5: Entrenamiento

Objetivo:

- Entrenar con MSE.
- Guardar mejor modelo.
- Visualizar pérdidas.

Resultado esperado:

- Training loop.
- Checkpoint.
- Curva train/validation loss.

### Fase 6: Scores y umbral

Objetivo:

- Calcular errores por imagen.
- Seleccionar umbral usando validación normal.

Resultado esperado:

- Distribución de scores.
- Umbral justificado.
- Predicciones normal/sospechosa.

### Fase 7: Evaluación

Objetivo:

- Evaluar el test mixto.
- Medir rendimiento cuantitativo.

Resultado esperado:

- Confusion matrix.
- Precision, recall, F1.
- ROC-AUC si procede.

### Fase 8: Explicabilidad visual

Objetivo:

- Mostrar casos representativos.
- Comparar original, reconstrucción y error.

Resultado esperado:

- Paneles visuales interpretables.
- Comentario sobre aciertos, falsos positivos y falsos negativos.

### Fase 9: Análisis crítico

Objetivo:

- Explicar limitaciones.
- Proponer mejoras.

Resultado esperado:

- Discusión académica final.
- Futuras líneas: VAE, GAN anomaly detection, SSIM, perceptual loss, mayor resolución, calibración de umbral, YOLO, human-in-the-loop.

## Estructura sugerida del notebook final

1. Introducción y framing del problema.
2. Setup y configuración.
3. Fase 0.5 — Preparación y verificación del dataset.
4. Carga del dataset.
5. Exploración visual.
6. Preprocessing y splits.
7. Dataset y DataLoader.
8. Autoencoder convolucional.
9. Entrenamiento.
10. Error de reconstrucción.
11. Selección de umbral.
12. Métricas.
13. Visualización de reconstrucciones y mapas de error.
14. Análisis crítico y mejoras futuras.

## Criterio de éxito

El notebook final debe poder ejecutarse de principio a fin, pero además debe leerse como un tutorial visual en español.

La prioridad no es obtener el mejor modelo posible, sino construir una línea base clara, reproducible, bien explicada y coherente con detección de anomalías.
