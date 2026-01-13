from sqlalchemy.orm import Session
from models.player import Player, Category, Position
from models.activity import PlayerActivity
from models.exercise import Exercise, ExerciseCategory
from models.session import Session as TrainingSession
from models.task import Task, StaffRole, TaskStatus, TaskPriority # Asegúrate de tener models/task.py
from models.formation import Formation
from datetime import date
from typing import List, Optional, Any

# ==============================================================================
# 1. JUGADORAS (PLAYERS)
# ==============================================================================

def create_player(db: Session, 
                  nombre_completo: str, 
                  fecha_nacimiento: date, 
                  dni: str, 
                  categoria_actual: Category,
                  posicion_principal: Position,
                  apodo: str = "",
                  direccion: str = "",
                  telefono_personal: str = "",
                  telefono_emergencia: str = "",
                  **kwargs: Any) -> Player:
    
    player_data = {
        "nombre_completo": nombre_completo,
        "fecha_nacimiento": fecha_nacimiento,
        "dni": dni,
        "categoria_actual": categoria_actual,
        "posicion_principal": posicion_principal,
        "apodo": apodo,
        "direccion": direccion,
        "telefono_personal": telefono_personal,
        "telefono_emergencia": telefono_emergencia
    }
    # Añadir altura/peso si vienen en kwargs
    if "altura_cm" in kwargs: player_data["altura_cm"] = kwargs["altura_cm"]
    if "peso_kg" in kwargs: player_data["peso_kg"] = kwargs["peso_kg"]
    if "estado_salud_actual" in kwargs: player_data["estado_salud_actual"] = kwargs["estado_salud_actual"]
    if "posicion_secundaria" in kwargs: player_data["posicion_secundaria"] = kwargs["posicion_secundaria"]

    db_player = Player(**player_data)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

def get_player_by_id(db: Session, player_id: int) -> Optional[Player]:
    return db.query(Player).filter(Player.id == player_id).first()

def get_all_players(db: Session, category: Optional[Category] = None) -> List[Player]:
    query = db.query(Player)
    if category:
        query = query.filter(Player.categoria_actual == category)
    return query.order_by(Player.nombre_completo).all()

def update_player(db: Session, player_id: int, updates: dict) -> Optional[Player]:
    db_player = get_player_by_id(db, player_id)
    if db_player:
        for key, value in updates.items():
            if hasattr(db_player, key):
                setattr(db_player, key, value)
        db.commit()
        db.refresh(db_player)
        return db_player
    return None

def delete_player(db: Session, player_id: int) -> bool:
    db_player = get_player_by_id(db, player_id)
    if db_player:
        db.delete(db_player)
        db.commit()
        return True
    return False

# ==============================================================================
# 2. EJERCICIOS (EXERCISES)
# ==============================================================================

def create_exercise(db: Session, **kwargs):
    """Crea un ejercicio dinámicamente."""
    new_ex = Exercise(**kwargs)
    db.add(new_ex)
    db.commit()
    db.refresh(new_ex)
    return new_ex

def get_all_exercises(db: Session, category=None):
    query = db.query(Exercise)
    if category:
        query = query.filter(Exercise.categoria == category)
    return query.all()

def delete_exercise(db: Session, ex_id: int):
    ex = db.query(Exercise).get(ex_id)
    if ex:
        db.delete(ex)
        db.commit()

# ==============================================================================
# 3. SESIONES (SESSIONS)
# ==============================================================================

def remove_exercise_from_session(db: Session, session_id: int, exercise_id: int):
    """Quita un ejercicio específico de una sesión sin borrar el ejercicio de la biblioteca."""
    sess = db.query(TrainingSession).get(session_id)
    ex = db.query(Exercise).get(exercise_id)
    if sess and ex and ex in sess.exercises:
        sess.exercises.remove(ex)
        db.commit()

def create_session(db: Session, titulo: str, fecha: date, categoria: str, tipo: Any, grupo: str = "General"):
    new_sess = TrainingSession(
        titulo=titulo, 
        fecha=fecha, 
        categoria=categoria, 
        tipo_sesion=tipo,
        grupo=grupo
    )
    db.add(new_sess)
    db.commit()
    return new_sess

def add_exercise_to_session(db: Session, session_id: int, exercise_id: int):
    sess = db.query(TrainingSession).get(session_id)
    ex = db.query(Exercise).get(exercise_id)
    if sess and ex:
        if ex not in sess.exercises:
            sess.exercises.append(ex)
            db.commit()

def remove_exercise_from_session(db: Session, session_id: int, exercise_id: int):
    sess = db.query(TrainingSession).get(session_id)
    ex = db.query(Exercise).get(exercise_id)
    if sess and ex and ex in sess.exercises:
        sess.exercises.remove(ex)
        db.commit()

def get_all_sessions(db: Session):
    return db.query(TrainingSession).order_by(TrainingSession.fecha.desc()).all()

def delete_session(db: Session, session_id: int):
    sess = db.query(TrainingSession).get(session_id)
    if sess:
        db.delete(sess)
        db.commit()

# ==============================================================================
# 4. TAREAS (TASKS) - (Opcional, si usas task_screen.py)
# ==============================================================================

def create_task(db: Session, **kwargs):
    task = Task(**kwargs)
    db.add(task)
    db.commit()
    return task

    return db.query(Task).all() # Simplificado

# ==============================================================================
# 5. LESIONES (INJURIES)
# ==============================================================================
from models.injury import PlayerInjury

def create_injury(db: Session, player_id: int, tipo: str, fecha: date, obs: str = ""):
    inj = PlayerInjury(player_id=player_id, tipo_lesion=tipo, fecha_lesion=fecha, observacion=obs)
    db.add(inj)
    db.commit()
    return inj

def update_injury_alta(db: Session, injury_id: int, fecha_alta: date):
    inj = db.query(PlayerInjury).get(injury_id)
    if inj:
        inj.fecha_alta = fecha_alta
        db.commit()
        return inj
    return None

def get_player_injuries(db: Session, player_id: int):
    return db.query(PlayerInjury).filter(PlayerInjury.player_id == player_id).order_by(PlayerInjury.fecha_lesion.desc()).all()

# ==============================================================================
# 6. ACTIVIDADES (PLAYER ACTIVITY) - HISTORIAL Y EDICION
# ==============================================================================
def get_activities_by_date(db: Session, fecha: date, tipo: str = None) -> List[PlayerActivity]:
    query = db.query(PlayerActivity).filter(PlayerActivity.fecha == fecha)
    if tipo:
        query = query.filter(PlayerActivity.tipo == tipo)
    return query.all()

def update_activity(db: Session, act_id: int, updates: dict):
    act = db.query(PlayerActivity).get(act_id)
    if act:
        for key, value in updates.items():
            if hasattr(act, key):
                setattr(act, key, value)
        db.commit()
        return act
    return None

def delete_activity(db: Session, act_id: int):
    act = db.query(PlayerActivity).get(act_id)
    if act:
        db.delete(act)
        db.commit()
        return True
    return False

# ==============================================================================
# 7. EVALUACIONES (TEST RESULTS)
# ==============================================================================
from models.test_result import TestResult

def create_test_result(db: Session, player_id: int, exercise_id: int, valor: str, obs: str = ""):
    tr = TestResult(player_id=player_id, exercise_id=exercise_id, valor_resultado=valor, observaciones=obs)
    db.add(tr)
    db.commit()
    return tr

def get_player_test_results(db: Session, player_id: int):
    return db.query(TestResult).filter(TestResult.player_id == player_id).order_by(TestResult.fecha.desc()).all()

# ==============================================================================
# 8. FORMACIONES (FORMATIONS)
# ==============================================================================
def create_formation(db: Session, **kwargs):
    new_f = Formation(**kwargs)
    db.add(new_f)
    db.commit()
    db.refresh(new_f)
    return new_f

def get_all_formations(db: Session, categoria: str = None):
    query = db.query(Formation)
    if categoria:
        query = query.filter(Formation.categoria == categoria)
    return query.order_by(Formation.fecha_partido.desc()).all()

def get_formation_by_id(db: Session, f_id: int):
    return db.query(Formation).get(f_id)

def delete_formation(db: Session, f_id: int):
    f = db.query(Formation).get(f_id)
    if f:
        db.delete(f)
        db.commit()
        return True
    return False
