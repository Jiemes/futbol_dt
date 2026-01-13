from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from database.db_setup import Base
from datetime import date
import enum

# --- Definiciones Enum (Listas Desplegables) ---

class StaffRole(enum.Enum):
    """Roles posibles a los que se puede asignar una tarea."""
    dt = "Director Técnico"
    ac = "Ayudante de Campo"
    pf = "Preparador Físico"

class TaskStatus(enum.Enum):
    """Estado de progresión de la tarea."""
    pendiente = "Pendiente"
    en_progreso = "En Progreso"
    bloqueada = "Bloqueada"
    completada = "Completada"

class TaskPriority(enum.Enum):
    """Nivel de urgencia."""
    baja = "Baja"
    media = "Media"
    alta = "Alta"

class Task(Base):
    """
    Modelo de la Base de Datos para la Tarea del Staff (Módulo 4).
    """
    __tablename__ = 'tasks'

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    descripcion = Column(String)
    
    # Asignación
    creada_por = Column(Enum(StaffRole), nullable=False)
    asignada_a = Column(Enum(StaffRole), nullable=False)
    
    # Tiempos
    fecha_limite = Column(Date)
    fecha_creacion = Column(Date, default=date.today)

    # Estado y Prioridad
    estado = Column(Enum(TaskStatus), default=TaskStatus.pendiente, nullable=False)
    prioridad = Column(Enum(TaskPriority), default=TaskPriority.media, nullable=False)
    
    # Vinculación (Permite enlazar la tarea a una jugadora específica)
    # player_id es una clave foránea que apunta a la tabla 'players'
    player_id = Column(Integer, ForeignKey('players.id'), nullable=True) 
    
    # Relación: Permite acceder a los datos de la jugadora desde la tarea
    # Esto requiere importar el modelo Player y Player necesita importar Task. 
    # Para evitar un "circular import" se usa 'Player' como string.
    player = relationship("Player", backref="tasks") 
    
    def __repr__(self):
        return (f"<Task(id={self.id}, title='{self.titulo}', "
                f"assigned_to='{self.asignada_a.value}', status='{self.estado.value}')>")