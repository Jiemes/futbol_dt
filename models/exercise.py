from sqlalchemy import Column, Integer, String, Enum as SqlEnum
from database.db_setup import Base
import enum

# --- 1. DEFINICIÓN DE ENUMS (Necesarios para que crud.py no de error) ---

class ExerciseObjective(enum.Enum):
    tactico = "Táctico"
    tecnico = "Técnico"
    fisico = "Físico"
    estrategico = "Estratégico"
    psicologico = "Psicológico"

class ExerciseIntensity(enum.Enum):
    alta = "Alta"
    media = "Media"
    baja = "Baja"

class ExerciseCategory(enum.Enum):
    entrada_calor = "Entrada en Calor"
    tecnico = "Técnico"
    tactico = "Táctico"
    fisico = "Físico"
    arqueras = "Arqueras"
    estrategia = "Estrategia (ABP)"
    recuperacion = "Recuperación"
    ambas_comun = "General"

# --- 2. MODELO DE BASE DE DATOS ---

class Exercise(Base):
    __tablename__ = 'exercises'

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    materiales = Column(String, nullable=True)
    tiempo_minutos = Column(Integer, default=0)
    
    # Multimedia
    foto_path = Column(String, nullable=True) 
    video_path = Column(String, nullable=True)
    
    # Clasificación Principal
    categoria = Column(SqlEnum(ExerciseCategory), default=ExerciseCategory.tecnico, nullable=False)
    
    # Clasificaciones Secundarias (Para filtros avanzados)
    objetivo_principal = Column(SqlEnum(ExerciseObjective), nullable=True)
    intensidad_carga = Column(SqlEnum(ExerciseIntensity), nullable=True)

    def __repr__(self):
        return f"<Exercise {self.titulo}>"