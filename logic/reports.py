from sqlalchemy.orm import Session
from models.player import Player, Category
from models.session import Session
from typing import List, Dict, Any, Tuple
from datetime import timedelta
from utils.crud import get_all_players

# --- Constantes para la Lógica de Riesgo (Ajustables por el PF) ---
# Se define un umbral basado en el concepto de "Carga Acumulada Semanal"
RISK_THRESHOLD = 1.8 # Factor de riesgo: si la carga es 1.8 veces la media, ALTO RIESGO.
SAFE_LOAD_FACTOR = 0.5 # Factor bajo: Carga menor al 50% de la media, riesgo de subcarga.

# ==============================================================================
# A. Funciones de Carga y Riesgo (Módulo 5 - PF)
# ==============================================================================

def get_player_session_loads(db: Session, player_id: int) -> List[Tuple[str, float]]:
    """
    Obtiene las cargas acumuladas de entrenamiento y competición de una jugadora
    en un período reciente (ej. últimas 4 semanas).
    
    NOTA: Para una implementación real, SessionExercise necesitaría un campo
    "Jugadoras_Presentes" para filtrar. Aquí simulamos la carga de las sesiones.
    """
    # En una implementación real, se sumarían Session.carga_total_estimada (Entrenamiento)
    # y Minutos_Jugados (Competición).
    
    # Simulación de datos recientes: (Fecha, Carga Estimada)
    return [
        ("Semana 1", 550.0),
        ("Semana 2", 700.0),
        ("Semana 3", 950.0),
        ("Semana 4 (Actual)", 100.0) # Baja al inicio de semana
    ]

def calculate_player_risk_semaphore(db: Session, player: Player) -> Dict[str, Any]:
    """
    Calcula el riesgo de sobrecarga (Semáforo) usando la Carga Acumulada.
    """
    # En un sistema real se usaría la ratio A:C (Carga Aguda:Carga Crónica)
    
    # --- SIMULACIÓN DE LA RATIO A:C (Aguda:Crónica) ---
    loads = get_player_session_loads(db, player.id)
    if len(loads) < 4:
        return {"riesgo": "Datos Insuficientes", "color": "blue"}

    # Carga Aguda (AC): Promedio de la última semana
    load_acute = loads[-1][1]
    
    # Carga Crónica (CR): Promedio de las últimas 4 semanas
    load_chronic = sum([l[1] for l in loads]) / 4
    
    if load_chronic == 0:
        return {"riesgo": "Carga Cero", "color": "green"}

    ratio_ac = load_acute / load_chronic

    if ratio_ac >= RISK_THRESHOLD:
        color = "red"
        risk_level = f"ALTO RIESGO ({ratio_ac:.2f}x) - Sobrecarga"
    elif ratio_ac < SAFE_LOAD_FACTOR:
        color = "yellow"
        risk_level = f"RIESGO BAJO ({ratio_ac:.2f}x) - Subcarga/Desentrenamiento"
    else:
        color = "green"
        risk_level = f"RIESGO NORMAL ({ratio_ac:.2f}x)"

    return {
        "riesgo": risk_level,
        "color": color,
        "ratio_ac": round(ratio_ac, 2),
        "carga_aguda": load_acute,
        "carga_cronica": load_chronic
    }

# ==============================================================================
# B. Informes Generales (Módulo 5 - DT/AC)
# ==============================================================================

def generate_risk_report(db: Session) -> List[Dict[str, Any]]:
    """
    Genera un informe que aplica el semáforo a todas las jugadoras activas.
    """
    all_players = get_all_players(db)
    report = []
    
    for player in all_players:
        risk_data = calculate_player_risk_semaphore(db, player)
        
        # Filtrar solo la información esencial para el informe
        report.append({
            "id": player.id,
            "nombre": player.nombre_completo,
            "categoria": player.categoria_actual.value,
            "color_semaforo": risk_data["color"],
            "nivel_riesgo": risk_data["riesgo"]
        })
        
    # Ordenar para que los riesgos altos aparezcan primero
    def sort_key(item):
        if item['color_semaforo'] == 'red': return 3
        if item['color_semaforo'] == 'yellow': return 2
        if item['color_semaforo'] == 'green': return 1
        return 0
        
    return sorted(report, key=sort_key, reverse=True)


def generate_player_evolution_report(db: Session, player_id: int) -> Dict[str, Any]:
    """
    Genera datos de evolución para graficar (ej. peso vs. tiempo).
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        return {"error": "Jugadora no encontrada."}
        
    # En un sistema real, necesitaríamos una tabla 'Mediciones' (peso, altura)
    # y 'PartidosJugados' (minutos) para el historial. Aquí usamos datos estáticos.
    
    # Simulación de Historial de Peso (Ejemplo)
    history = [
        {"date": "2024-09-01", "peso": 62.0, "minutos_jugados": 90},
        {"date": "2024-10-01", "peso": 61.5, "minutos_jugados": 180},
        {"date": "2024-11-01", "peso": 63.0, "minutos_jugados": 270},
    ]
    
    return {
        "nombre": player.nombre_completo,
        "historial_peso": [h["peso"] for h in history],
        "historial_minutos": [h["minutos_jugados"] for h in history],
        "fechas": [h["date"] for h in history]
    }