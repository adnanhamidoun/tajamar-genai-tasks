# Virtual Environment (.venv) - Guía de uso

## ¿Para qué sirve?

El **`.venv`** es un entorno virtual de Python que aísla las dependencias de este proyecto del resto de tu sistema. Así evitas conflictos de versiones y mantienes todo limpio.

## Requisitos previos

- Python 3.8 o superior instalado en tu máquina.

---

## Activación rápida (Windows PowerShell)

### Opción 1: Desde VS Code (RECOMENDADO)

1. Abre el workspace en VS Code
2. Press `Ctrl + Shift + P` → busca "Python: Select Interpreter"
3. Elige `.venv\Scripts\python.exe` (debería aparecer como opción con `.venv` o similar)
4. Abre un terminal en VS Code (Ctrl + `)
5. El terminal debería mostrar `(.venv)` al inicio, indicando que está activado

### Opción 2: Activación manual en PowerShell

```powershell
cd "c:\Users\adnan\Desktop\tajamar-genai-tasks\03 – Fine-Tuning of Models in Azure AI Foundry"
.\.venv\Scripts\Activate.ps1
```

Verás `(.venv)` al inicio del prompt si se activó correctamente.

---

## Uso con Jupyter Notebook

### En VS Code:

1. Abre el archivo `.ipynb`
2. Con el intérprete `.venv` seleccionado (ver "Opción 1" arriba), VS Code ejecutará las celdas usando el venv automáticamente

### En Jupyter Lab/Notebook clásico:

```powershell
# (Con .venv activado)
pip install jupyter jupyter-lab

# Lanzar el servidor
jupyter notebook
```

---

## Instalación de dependencias

Las dependencias principales ya están instaladas:

- **openai** (SDK de Azure OpenAI)
- **python-dotenv** (para cargar .env)
- **pandas** (análisis de datos)
- **openpyxl** (Excel)

Para instalar manualmente:

```powershell
python -m pip install -r requirements.txt
```

---

## Desactivación

```powershell
deactivate
```

---

## Notas importantes

- El archivo `.env` contiene credenciales sensibles. NO lo compartas en Git.
- Si obtienes error `unexpected argument 'store'` al correr el notebook, actualiza openai:
  ```powershell
  python -m pip install --upgrade openai
  ```

---

## Estructura de archivos

```
03 – Fine-Tuning of Models in Azure AI Foundry/
├── .venv/                       ← Virtual Environment (creado)
├── .env                         ← Variables de entorno (NO compartir)
├── requirements.txt             ← Dependencias del proyecto
├── Stored_Completions_Distillation_Entregable.ipynb  ← Notebook principal
├── Fine-Tuning_GPT4oMini_AzureAIFoundry_Gourmet.ipynb
├── generate_data.py
├── training_set.jsonl
├── validation_set.jsonl
└── imagen*.png                  ← Capturas del portal
```

---

**¿Preguntas?** Revisa que siempre uses el intérprete `.venv` (no el Python global) para ejecutar celdas.
