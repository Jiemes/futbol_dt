import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Determinar la ruta de la base de datos de manera portátil
def get_db_path():
    db_name = 'palometas_femenino.db'
    try:
        from kivymd.app import MDApp
        app = MDApp.get_running_app()
        if app:
            return os.path.join(app.user_data_dir, db_name)
    except:
        pass
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(BASE_DIR, db_name)

DATABASE_PATH = get_db_path()

Base = declarative_base()

engine = create_engine(f'sqlite:///{DATABASE_PATH}')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # IMPORTAR TODOS LOS MODELOS PARA QUE SE CREEN LAS TABLAS
    from models.player import Player 
    from models.activity import PlayerActivity
    from models.regulation import Regulation
    from models.exercise import Exercise
    from models.session import Session, session_exercises_table # Importante la tabla intermedia
    
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()