from database.db_setup import SessionLocal
from models.session import Session, SessionType
from models.exercise import Exercise
from datetime import date, timedelta

def get_session_dates(start_date, count):
    dates = []
    curr = start_date
    while len(dates) < count:
        if curr.weekday() in [0, 2]: # 0=Lunes, 2=Miércoles
            dates.append(curr)
        curr += timedelta(days=1)
    return dates

def create_preseason_plan():
    db = SessionLocal()
    
    # Limpiamos sesiones previas de pretemporada para no duplicar/confundir
    db.query(Session).filter(Session.grupo == "Pretemporada").delete()
    db.commit()

    def get_ex(title):
        ex = db.query(Exercise).filter(Exercise.titulo == title).first()
        if not ex: print(f"ERROR: {title} no encontrado")
        return ex

    start_date = date(2026, 2, 2)
    session_dates = get_session_dates(start_date, 12)

    plan_data = [
        # SEMANA 1
        {
            "titulo": "Pretemporada S1-D1: Test Inicial y Adaptación",
            "tipo": SessionType.fisico,
            "ejercicios": [
                "Movilidad Articular y Activación", # 10m
                "Yo-Yo Test / Test de Recuperación Intermitente", # 30m (incluyendo setup)
                "Rueda de Pases en Y", # 20m
                "Rondo de Presión Alta", # 20m
                "Fútbol Reducido 5vs5 (Transiciones)" # 40m
            ] # Total ~120m
        },
        {
            "titulo": "Pretemporada S1-D2: Base Aeróbica y Técnica",
            "tipo": SessionType.carga,
            "ejercicios": [
                "Rondo Loco (Activación)", # 15m
                "Fartlek con Balón", # 30m
                "Control Orientado y Definición", # 25m
                "Juego de Posición 4vs4 + 3 Comodines", # 20m
                "Fútbol Reducido 8vs8 (Modelo de Juego)" # 30m
            ]
        },
        # SEMANA 2
        {
            "titulo": "Pretemporada S2-D1: Velocidad y Potencia",
            "tipo": SessionType.fisico,
            "ejercicios": [
                 "Movilidad Articular y Activación", # 15m
                 "Circuito de Velocidad y Agilidad", # 25m
                 "Saltos de vallas y finalización", # 25m
                 "Conducción y Regate 1vs1", # 20m
                 "Fútbol Reducido 5vs5 (Transiciones)" # 35m
            ]
        },
        {
            "titulo": "Pretemporada S2-D2: Táctica de Salida",
            "tipo": SessionType.tactico,
            "ejercicios": [
                "Rondo de Presión Alta", # 20m
                "Salida de balón ante presión", # 30m
                "Rueda de Pases en Y", # 20m
                "Basculación Defensiva en Bloque", # 20m
                "Fútbol Reducido 8vs8 (Modelo de Juego)" # 30m
            ]
        },
        # SEMANA 3
        {
            "titulo": "Pretemporada S3-D1: Resistencia Intermitente",
            "tipo": SessionType.carga,
            "ejercicios": [
                "Rondo Loco (Activación)", # 15m
                "Trabajo Intermitente 15x15", # 30m
                "Finalización desde fuera del área", # 20m
                "Posesión libre 3 equipos (Transición)", # 25m
                "Fútbol Reducido 5vs5 (Transiciones)" # 30m
            ]
        },
        {
            "titulo": "Pretemporada S3-D2: Test Intermedio",
            "tipo": SessionType.tactico,
            "ejercicios": [
                "Movilidad Articular y Activación",
                "Yo-Yo Test / Test de Recuperación Intermitente", # Evaluación mitad
                "Circuito de Habilidades Integradas (Evaluación)",
                "Fútbol 4vs4 + Porteras (Evaluación Táctica)",
                "Partido Formal / Simulación 11vs11"
            ]
        },
        # SEMANA 4
        {
            "titulo": "Pretemporada S4-D1: Agilidad Reactiva",
            "tipo": SessionType.fisico,
            "ejercicios": [
                "Movilidad Articular y Activación",
                "Circuito de Agilidad-Regate 4",
                "Conducción y Regate 1vs1",
                "Transiciones Rápidas (Ataque-Defensa)",
                "Fútbol Reducido 5vs5 (Transiciones)"
            ]
        },
        {
            "titulo": "Pretemporada S4-D2: Finalización y Juego Aéreo",
            "tipo": SessionType.tactico,
            "ejercicios": [
                "Rondo de Presión Alta",
                "Remate de cabeza y finalización",
                "Finalización desde fuera del área",
                "Córner Ofensivo - Bloqueos",
                "Fútbol Reducido 8vs8 (Modelo de Juego)"
            ]
        },
        # SEMANA 5
        {
            "titulo": "Pretemporada S5-D1: Táctica Avanzada",
            "tipo": SessionType.tactico,
            "ejercicios": [
                "Rondo Loco (Activación)",
                "Basculación Defensiva en Bloque",
                "Salida de balón ante presión",
                "Tiro Libre Frontal - Amague y Pase",
                "Partido Formal / Simulación 11vs11"
            ]
        },
        {
            "titulo": "Pretemporada S5-D2: HIIT y Potencia",
            "tipo": SessionType.fisico,
            "ejercicios": [
                "Movilidad Articular y Activación",
                "Trabajo Intermitente 15x15",
                "Saltos de vallas y finalización",
                "Posesión libre 3 equipos (Transición)",
                "Fútbol Reducido 8vs8 (Modelo de Juego)"
            ]
        },
        # SEMANA 6
        {
            "titulo": "Pretemporada S6-D1: Velocidad y ABP",
            "tipo": SessionType.fisico,
            "ejercicios": [
                "Movilidad Articular y Activación",
                "Circuito de Velocidad y Agilidad",
                "Córner Ofensivo - Bloqueos",
                "Tiro Libre Frontal - Amague y Pase",
                "Fútbol Reducido 5vs5 (Transiciones)"
            ]
        },
        {
            "titulo": "Pretemporada S6-D2: Test Final y Cierre",
            "tipo": SessionType.partido,
            "ejercicios": [
                "Movilidad Articular y Activación",
                "Yo-Yo Test / Test de Recuperación Intermitente", # Evaluación final
                "Fútbol 4vs4 + Porteras (Evaluación Táctica)",
                "Partido Formal / Simulación 11vs11"
            ]
        }
    ]

    print(f"--- Generando {len(plan_data)} Sesiones de 120m ---")
    for i, data in enumerate(plan_data):
        sess = Session(
            titulo = data["titulo"],
            fecha = session_dates[i],
            categoria = "1ra y Sub-17",
            tipo_sesion = data["tipo"],
            grupo = "Pretemporada"
        )
        for ex_title in data["ejercicios"]:
            ex = get_ex(ex_title)
            if ex: sess.exercises.append(ex)
        db.add(sess)
        print(f"[{session_dates[i]}] {data['titulo']}")

    db.commit()
    db.close()
    print("--- Proceso Completado ---")

if __name__ == "__main__":
    create_preseason_plan()
