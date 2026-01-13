from database.db_setup import engine, Base
from models.player import Player
from models.activity import PlayerActivity
from models.injury import PlayerInjury
from models.exercise import Exercise
from models.session import Session
from models.test_result import TestResult
from models.formation import Formation
import sqlalchemy

def migrate():
    print("Iniciando migración manual...")
    Base.metadata.create_all(bind=engine)
    print("- Tablas sincronizadas (creadas si faltaban).")

    with engine.begin() as conn:
        # 2. Agregar columna performance_score a player_activities si no existe
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE player_activities ADD COLUMN performance_score INTEGER DEFAULT 0"))
            print("- Columna 'performance_score' agregada.")
        except Exception:
            pass # Ya existe

        try:
            conn.execute(sqlalchemy.text("UPDATE players SET categoria_actual = 'Sub-17' WHERE categoria_actual = 'Sub-16'"))
            print("- Migrado datos de categoría 'Sub-16' a 'Sub-17'.")
        except Exception:
            pass
            
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE sessions ADD COLUMN grupo TEXT DEFAULT 'General'"))
            print("- Columna 'grupo' agregada a sessions.")
        except Exception: pass

        try:
            conn.execute(sqlalchemy.text("ALTER TABLE formations ADD COLUMN suplentes TEXT DEFAULT ''"))
            print("- Columna 'suplentes' agregada.")
        except Exception: pass

        try:
            conn.execute(sqlalchemy.text("ALTER TABLE formations ADD COLUMN dibujos TEXT DEFAULT '[]'"))
            print("- Columna 'dibujos' agregada.")
        except Exception: pass

    print("Migración finalizada.")

if __name__ == "__main__":
    migrate()
