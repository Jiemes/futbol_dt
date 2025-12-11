@echo off
echo ==================================================
echo       CONFIGURANDO ENTORNO VIRTUAL - FUTBOL_DT
echo ==================================================

REM Verificamos si existe la carpeta venv
if exist venv (
    echo [INFO] El entorno virtual 'venv' ya existe.
) else (
    echo [CREATE] Creando entorno virtual...
    python -m venv venv
)

REM Activamos el entorno
echo [ACTIVATE] Activando entorno virtual...
call venv\Scripts\activate

REM Instalamos dependencias
echo [INSTALL] Instalando dependencias desde requirements.txt...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ==================================================
echo [SUCCESS] Todo listo!
echo Para trabajar, ejecuta: venv\Scripts\activate
echo Para iniciar la app: python main.py
echo ==================================================
pause
