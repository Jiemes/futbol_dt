from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float
from database.db_setup import Base
from datetime import date

class TestResult(Base):
    __tablename__ = 'test_results'

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    exercise_id = Column(Integer, ForeignKey('exercises.id'), nullable=False)
    fecha = Column(Date, default=date.today, nullable=False)
    
    # Datos de evaluación
    valor_resultado = Column(String, nullable=False) # ej: "Nivel 15.2", "45 seg", etc.
    observaciones = Column(String, nullable=True)

    def __repr__(self):
        return f"<TestResult(player_id={self.player_id}, exercise='{self.exercise_id}', val='{self.valor_resultado}')>"
