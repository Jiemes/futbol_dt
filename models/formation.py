from sqlalchemy import Column, Integer, String, Date, JSON
from database.db_setup import Base
from datetime import date

class Formation(Base):
    __tablename__ = 'formations'

    id = Column(Integer, primary_key=True, index=True)
    nombre_formacion = Column(String) # ej: "4-4-2"
    categoria = Column(String)
    rival = Column(String)
    fecha_partido = Column(Date, default=date.today)
    
    # JSON con las posiciones: [ {"pid": 1, "x": 0.5, "y": 0.2, "nickname": "Pau"}, ... ]
    data_posiciones = Column(JSON) 
    suplentes = Column(String, default="") 
    dibujos = Column(JSON) # Almacena trazos: [ {"type": "arrow", "points": [...]}, ... ]

    def __repr__(self):
        return f"<Formation(id={self.id}, rival='{self.rival}', fecha={self.fecha_partido})>"
