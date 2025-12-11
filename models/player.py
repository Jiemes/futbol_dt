from sqlalchemy import Column, Integer, String, Float, Date, Enum as SqlEnum
from sqlalchemy.orm import relationship
from database.db_setup import Base
from datetime import date
import enum

class Category(enum.Enum):
    sub_16 = "Sub-16"
    primera = "Primera"
    mixta = "Mixta"

class Position(enum.Enum):
    arquera = "Arquera"
    def_central_izq = "Defensa Central Izquierda"
    def_central_der = "Defensa Central Derecha"
    def_lateral_izq = "Defensa Lateral Izquierda"
    def_lateral_der = "Defensa Lateral Derecha"
    central = "Central"
    central_izq = "Central Izquierda"
    central_der = "Central Derecha"
    extrema_izq = "Extrema Izquierda"
    extrema_der = "Extrema Derecha"
    delantera_izq = "Delantera Izquierda"
    delantera_der = "Delantera Derecha"

class Player(Base):
    __tablename__ = 'players'

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String, index=True, nullable=False)
    apodo = Column(String, nullable=True)
    dni = Column(String, unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    
    # NUEVOS DATOS DE CONTACTO
    direccion = Column(String, nullable=True)
    telefono_personal = Column(String, nullable=True)
    telefono_emergencia = Column(String, nullable=True)
    
    # Datos Ficha Médica/Técnica
    fecha_alta_club = Column(Date, default=date.today)
    altura_cm = Column(Float, default=0.0)
    peso_kg = Column(Float, default=0.0)
    estado_salud_actual = Column(String, default="Apto")
    
    # Datos Deportivos
    categoria_actual = Column(SqlEnum(Category), default=Category.sub_16, nullable=False)
    posicion_principal = Column(SqlEnum(Position), nullable=False)
    posicion_secundaria = Column(SqlEnum(Position), nullable=True)
    
    # Relación
    activities = relationship("PlayerActivity", back_populates="player", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Player {self.nombre_completo}>"