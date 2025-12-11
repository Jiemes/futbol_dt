from sqlalchemy import Column, Integer, String, Date, Float, Enum as SqlEnum, ForeignKey, Table
from sqlalchemy.orm import relationship
from database.db_setup import Base
from datetime import date
import enum


# Definimos los tipos de sesión válidos
class SessionType(enum.Enum):
    carga = "Carga"
    tactico = "Táctico"
    fisico = "Físico"
    pre_partido = "Pre-Partido"
    recuperacion = "Recuperación"
    partido = "Partido"
    entrenamiento = "Entrenamiento"

# Tabla intermedia para la relación Muchos-a-Muchos entre Sesión y Ejercicios
session_exercises_table = Table('session_exercises_link', Base.metadata,
    Column('session_id', Integer, ForeignKey('sessions.id')),
    Column('exercise_id', Integer, ForeignKey('exercises.id'))
)

class Session(Base):
    __tablename__ = 'sessions'

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    fecha = Column(Date, default=date.today, nullable=False)
    
    # CORRECCIÓN: Usamos 'categoria' a secas
    categoria = Column(String, nullable=False) 
    
    tipo_sesion = Column(SqlEnum(SessionType), nullable=False)
    carga_total_estimada = Column(Float, default=0.0)
    
    exercises = relationship("Exercise", secondary=session_exercises_table, backref="sessions")

    def __repr__(self):
        return f"<Session(id={self.id}, title='{self.titulo}')>"
    
    
# (Opcional) Si necesitamos guardar detalles específicos de la instancia del ejercicio
class SessionExercise(Base):
    __tablename__ = 'session_exercises'

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=False)
    exercise_id = Column(Integer, ForeignKey('exercises.id'), nullable=False)
    
    duracion_minutos = Column(Integer, nullable=False, default=0)
    
    # Relaciones
    # session = relationship("Session", back_populates="exercises") # Conflictivo con secondary, usar solo si es necesario