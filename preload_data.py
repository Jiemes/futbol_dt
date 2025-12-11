from database.db_setup import init_db, SessionLocal
from utils import crud
from models.exercise import ExerciseObjective, ExerciseIntensity, ExerciseCategory

def load_initial_data():
    print("Inicializando Base de Datos...")
    init_db()
    db = SessionLocal()
    
    # Lista de ejercicios inspirada en sitios de entrenamiento profesional
    # Formato: (Título, Objetivo, Intensidad, Descripción)
    exercises = [
        # TÁCTICOS
        ("Rondo 4vs2 con Transición", ExerciseObjective.tactico, ExerciseIntensity.media, 
         "Espacio 10x10m. 4 jugadores mantienen posesión, 2 presionan. Al recuperar, deben conducir fuera del cuadro."),
        ("Salida de Balón - Bloque Bajo", ExerciseObjective.tactico, ExerciseIntensity.alta, 
         "Defensa + 5 vs 4 Atacantes. Objetivo: Salir jugando hasta medio campo pasando por carriles laterales."),
        ("Ataque Posicional 7vs7", ExerciseObjective.tactico, ExerciseIntensity.alta, 
         "Partido en medio campo con porterías reglamentarias. Énfasis en amplitud y profundidad."),
        
        # TÉCNICOS
        ("Rueda de Pases en 'Y'", ExerciseObjective.tecnico, ExerciseIntensity.baja, 
         "Mejora de perfilamiento, control orientado y pase raso firme. Rotación continua de posiciones."),
        ("Definición 1vs1 + Portero", ExerciseObjective.tecnico, ExerciseIntensity.alta, 
         "Delantero recibe de espaldas, gira y define ante defensa pasiva que se activa a los 2 segundos."),
        ("Centros y Remates (Bandas)", ExerciseObjective.tecnico, ExerciseIntensity.media, 
         "Desborde por banda, centro al área para llegada de 2 delanteros + 1 volante opuesto."),

        # FÍSICOS
        ("Circuito Fuerza Explosiva", ExerciseObjective.fisico, ExerciseIntensity.alta, 
         "4 estaciones: 1. Salto vallas, 2. Slalom picas, 3. Saltos cajón, 4. Sprint 10m."),
        ("Intermitente Metabólico", ExerciseObjective.fisico, ExerciseIntensity.alta, 
         "Carreras de 15 segundos al 90% con 15 segundos de pausa pasiva. Bloques de 6 minutos."),
        ("Juegos de Reacción", ExerciseObjective.fisico, ExerciseIntensity.media, 
         "Parejas enfrentadas, a la orden (color/número) reaccionar para atrapar cono o salir en velocidad."),

        # ESTRATÉGICOS (BALÓN PARADO)
        ("Corner Defensivo - Zona", ExerciseObjective.estrategico, ExerciseIntensity.baja, 
         "Posicionamiento en zona para defender saques de esquina. Repetición de despejes."),
        ("Tiro Libre Ofensivo - Barrera Falsa", ExerciseObjective.estrategico, ExerciseIntensity.baja, 
         "Jugada preparada con bloqueo a la barrera y pase filtrado."),
    ]
    
    print(f"Cargando {len(exercises)} ejercicios...")
    
    count = 0
    # Obtenemos los ejercicios existentes para no duplicar
    existing_exercises = crud.get_all_exercises(db)
    
    for ex_data in exercises:
        # Verificar si ya existe por título
        is_duplicate = False
        for existing in existing_exercises:
            if existing.titulo == ex_data[0]:  # Usamos .titulo (nuevo nombre de campo)
                is_duplicate = True
                break
        
        if not is_duplicate:
            # Usamos los nombres de argumentos correctos del modelo actualizado
            crud.create_exercise(
                db, 
                titulo=ex_data[0],              # Antes: nombre
                objetivo_principal=ex_data[1],  # Antes: objetivo
                intensidad_carga=ex_data[2],    # Antes: intensidad
                categoria=ExerciseCategory.ambas_comun, 
                descripcion=ex_data[3]
            )
            count += 1
    
    print(f"¡Listo! Se cargaron {count} ejercicios nuevos.")
    db.close()

if __name__ == "__main__":
    load_initial_data()