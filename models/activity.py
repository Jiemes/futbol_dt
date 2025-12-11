from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from database.db_setup import Base
from datetime import date
import enum

class ActivityType(enum.Enum):
    practica = "Práctica"
    partido = "Partido"

class PlayerActivity(Base):
    __tablename__ = 'player_activities'

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    fecha = Column(Date, default=date.today)
    tipo = Column(SqlEnum(ActivityType), nullable=False)
    
    # SIN MINUTOS - Solo goles y detalle
    goles = Column(Integer, default=0)
    detalle = Column(String, nullable=True)
    
    player = relationship("Player", back_populates="activities")