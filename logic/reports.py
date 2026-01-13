from sqlalchemy.orm import Session
from models.player import Player, Category
from models.activity import PlayerActivity
from typing import List, Dict, Any, Tuple
from datetime import timedelta, date
from utils.crud import get_all_players

# --- Constantes para la Lógica de Riesgo (Ajustables por el PF) ---
RISK_THRESHOLD = 1.6 # Ajustado un poco más bajo para ser precavido
SAFE_LOAD_FACTOR = 0.5 

# ==============================================================================
# A. Funciones de Carga y Riesgo (Módulo 5 - PF)
# ==============================================================================

def get_weekly_load(db: Session, player_id: int, start_date: date, end_date: date) -> float:
    """Calcula la carga arbitraria (Minutos * Intensidad) en un rango de fechas."""
    activities = db.query(PlayerActivity).filter(
        PlayerActivity.player_id == player_id,
        PlayerActivity.fecha >= start_date,
        PlayerActivity.fecha <= end_date
    ).all()
    
    total_load = 0.0
    for act in activities:
        # Carga = Minutos * Intensidad (RPE)
        load = (act.minutos or 0) * (act.intensidad or 0)
        total_load += load
    return total_load

def calculate_player_risk_semaphore(db: Session, player: Player) -> Dict[str, Any]:
    """
    Calcula el riesgo de sobrecarga (Semáforo) usando la Ratio A:C REAL.
    """
    today = date.today()
    
    # 1. Carga Aguda (AC): Últimos 7 días
    acute_start = today - timedelta(days=6)
    acute_load = get_weekly_load(db, player.id, acute_start, today)
    
    # 2. Carga Crónica (CR): Últimos 28 días (Promedio semanal)
    chronic_start = today - timedelta(days=27)
    chronic_total_load = get_weekly_load(db, player.id, chronic_start, today)
    chronic_load = chronic_total_load / 4.0 # Promedio de 4 semanas
    
    if chronic_load == 0:
        return {
            "riesgo": "Datos Insuficientes (Sin Historial)", 
            "color": "blue",
            "ratio_ac": 0.0,
            "carga_aguda": acute_load,
            "carga_cronica": 0.0
        }

    ratio_ac = acute_load / chronic_load

    if ratio_ac >= RISK_THRESHOLD:
        color = "red"
        risk_level = f"ALTO RIESGO ({ratio_ac:.2f}x) - Sobrecarga"
    elif ratio_ac < SAFE_LOAD_FACTOR:
        color = "yellow"
        risk_level = f"BAJO RIESGO ({ratio_ac:.2f}x) - Desentrenamiento"
    else:
        color = "green"
        risk_level = f"ÓPTIMO ({ratio_ac:.2f}x)"

    return {
        "riesgo": risk_level,
        "color": color,
        "ratio_ac": round(ratio_ac, 2),
        "carga_aguda": acute_load,
        "carga_cronica": chronic_load
    }

def calculate_player_value(db: Session, player: Player) -> Dict[str, Any]:
    """
    Calcula el VALOR JUGADORA basado en:
    1. Promedio Puntaje (Performance)
    2. Goles
    3. Asistencia
    """
    activities = db.query(PlayerActivity).filter(PlayerActivity.player_id == player.id).all()
    
    total_score = 0
    total_goals = 0
    count_score = 0
    
    for act in activities:
        if act.performance_score:
            total_score += act.performance_score
            count_score += 1
        total_goals += (act.goles or 0)
        
    avg_score = (total_score / count_score) if count_score > 0 else 0
    
    # Formula Simple de Valor (Ajustable)
    # Valor = (Promedio Puntaje * 10) + (Goles * 5)
    # Rango esperado: 0 - 100+
    value_metric = (avg_score * 10) + (total_goals * 5)
    
    return {
        "valor": round(value_metric, 1),
        "promedio_puntaje": round(avg_score, 1),
        "total_goles": total_goals
    }

# ==============================================================================
# B. Informes Generales (Módulo 5 - DT/AC)
# ==============================================================================

def generate_risk_report(db: Session) -> List[Dict[str, Any]]:
    """
    Genera informe consolidado: Riesgo + Valor
    """
    all_players = get_all_players(db)
    report = []
    
    for player in all_players:
        risk_data = calculate_player_risk_semaphore(db, player)
        value_data = calculate_player_value(db, player)
        
        report.append({
            "id": player.id,
            "nombre": player.nombre_completo,
            "categoria": player.categoria_actual.value,
            "color_semaforo": risk_data["color"],
            "nivel_riesgo": risk_data["riesgo"],
            "valor_jugadora": value_data["valor"],
            "stats_detalle": f"Avg: {value_data['promedio_puntaje']} | Goles: {value_data['total_goles']}"
        })
        
    # Ordenar por VALOR descendente (Ranking)
    return sorted(report, key=lambda x: x['valor_jugadora'], reverse=True)


def generate_player_evolution_report(db: Session, player_id: int) -> Dict[str, Any]:
    """
    Genera datos de evolución para graficar.
    """
    # Mantenemos esto simulado por ahora o lo conectamos si se desea después
    return {
        "nombre": "Demo",
        "historial_peso": [],
        "historial_minutos": [],
        "fechas": []
    }