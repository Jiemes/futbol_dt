import os
import sys

# Ajustar PYTHONPATH para que Python encuentre los módulos internos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from kivy_ui.app_manager import PalometasApp

if __name__ == '__main__':
    # Ejecuta la aplicación KivyMD
    PalometasApp().run()