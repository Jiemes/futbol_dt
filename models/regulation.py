from sqlalchemy import Column, Integer, String, Text
from database.db_setup import Base

class Regulation(Base):
    __tablename__ = 'regulations'

    id = Column(Integer, primary_key=True)
    categoria = Column(String) # "Sub-16" o "Primera"
    titulo = Column(String) # Ej: "Regla del Offside" o "Reglamento General"
    contenido = Column(Text) # El texto completo del PDF