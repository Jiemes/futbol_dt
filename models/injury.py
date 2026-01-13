from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database.db_setup import Base
from datetime import date

class PlayerInjury(Base):
    __tablename__ = 'player_injuries'

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    
    tipo_lesion = Column(String, nullable=False)
    fecha_lesion = Column(Date, default=date.today, nullable=False)
    fecha_alta = Column(Date, nullable=True) # Si es null, sigue lesionada
    observacion = Column(String, nullable=True)

    player = relationship("Player", back_populates="injuries")

    def __repr__(self):
        return f"<Injury {self.tipo_lesion} ({self.fecha_lesion})>"
