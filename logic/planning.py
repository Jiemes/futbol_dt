from sqlalchemy.orm import Session
from models.session import Session, SessionExercise, SessionType
from models.exercise import Exercise, ExerciseIntensity
from utils.crud import get_exercise_by_id
from datetime import date
from typing import List, Dict, Any

# --- Mapeo de Intensidad a Valor Numérico (Para el Cálculo de Carga) ---
# Este mapeo es un ejemplo; los valores se pueden ajustar según el criterio del PF
INTENSITY_TO_VALUE = {
    ExerciseIntensity.baja: 1.0,
    ExerciseIntensity.media: 2.5,
    ExerciseIntensity.alta: 5.0,
}

# ==============================================================================
# A. Lógica de Cálculo de Carga (Módulo 5 Integrado)
# ==============================================================================

def calculate_exercise_load(exercise: Exercise, duration_minutes: int) -> float:
    """
    Calcula la carga estimada de un ejercicio específico para una duración dada.
    
    Formula: Carga = Valor_Intensidad * Duración (minutos)
    """
    intensity_value = INTENSITY_TO_VALUE.get(exercise.intensidad_carga, 0.0)
    
    # Multiplica el valor fijo de la intensidad por la duración
    estimated_load = intensity_value * duration_minutes
    return round(estimated_load, 2)


def calculate_session_total_load(session_exercises: List[SessionExercise]) -> float:
    """
    Suma la carga calculada de todos los ejercicios de la sesión para obtener
    la Carga Total Estimada.
    """
    total_load = sum(ex.carga_ejercicio_calculada for ex in session_exercises)
    return round(total_load, 2)

# ==============================================================================
# B. Funciones de Gestión de Sesiones (CRUD)
# ==============================================================================

def create_session(db: Session, 
                   titulo: str, 
                   categoria: str, 
                   tipo_sesion: SessionType, 
                   fecha: date = date.today()) -> Session:
    """Crea la cabecera de una nueva sesión de entrenamiento."""
    db_session = Session(
        titulo=titulo,
        fecha=fecha,
        categoria=categoria,
        tipo_sesion=tipo_sesion
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def add_exercise_to_session(db: Session, 
                            session_id: int, 
                            exercise_id: int, 
                            duracion_minutos: int, 
                            num_jugadoras: int,
                            **kwargs: Any) -> SessionExercise:
    """
    Agrega un ejercicio a una sesión existente y calcula la carga de ese ejercicio.
    """
    exercise = get_exercise_by_id(db, exercise_id)
    if not exercise:
        raise ValueError(f"Ejercicio con ID {exercise_id} no encontrado.")
        
    # 1. Calcular la carga del ejercicio
    calculated_load = calculate_exercise_load(exercise, duracion_minutos)
    
    # 2. Crear la instancia de SessionExercise
    session_exercise_data = {
        "session_id": session_id,
        "exercise_id": exercise_id,
        "duracion_minutos": duracion_minutos,
        "num_jugadoras": num_jugadoras,
        "carga_ejercicio_calculada": calculated_load
    }
    session_exercise_data.update(kwargs)
    
    db_session_exercise = SessionExercise(**session_exercise_data)
    db.add(db_session_exercise)
    db.commit()
    
    # 3. Actualizar la Carga Total de la Sesión Padre
    db_session = db_session_exercise.session
    if db_session:
        db_session.carga_total_estimada = calculate_session_total_load(db_session.exercises)
        db.commit()
        db.refresh(db_session_exercise)
        return db_session_exercise
        
    raise Exception("Error al vincular el ejercicio a la sesión.")
    

# Nota: Otras funciones como get_session_by_id, get_session_by_date, 
# y delete_session serían necesarias en un crud.py extendido para las sesiones.