from database.db_setup import SessionLocal, engine, Base
from models.exercise import Exercise, ExerciseCategory, ExerciseObjective, ExerciseIntensity

# Lista de ejercicios predefinidos (Inspiración en entrenamientosdefutbol.es y conocimiento general)
import os
import requests

# Lista de ejercicios predefinidos (Inspiración en entrenamientosdefutbol.es y conocimiento general)
EXERCISES_DATA = [
    # --- FISICO (RESISTENCIA / VELOCIDAD) ---
    {
        "titulo": "Rondo de Presión Alta",
        "categoria": ExerciseCategory.fisico,
        "objetivo_principal": ExerciseObjective.fisico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 15,
        "descripcion": "Cuadrado de 10x10m. 4 vs 2. Los 2 del medio deben recuperar. Si recuperan, cambian con quien perdió el balón. Alta intensidad, toques rápidos.",
        "materiales": "Conos, Petos, Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0008.gif" # VERIFIED
    },
    {
        "titulo": "Circuito de Velocidad y Agilidad",
        "categoria": ExerciseCategory.fisico,
        "objetivo_principal": ExerciseObjective.fisico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 20,
        "descripcion": "Estaciones: 1) Escalera de coordinación. 2) Slalom entre picas. 3) Salto de vallas. 4) Sprint 10m. Recuperación trotando al inicio.",
        "materiales": "Escalera, Picas, Vallas",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif" # VERIFIED
    },
    {
        "titulo": "Fartlek con Balón",
        "categoria": ExerciseCategory.fisico,
        "objetivo_principal": ExerciseObjective.fisico,
        "intensidad_carga": ExerciseIntensity.media,
        "tiempo_minutos": 25,
        "descripcion": "Conducción alrededor de la cancha. Lados largos: 70% velocidad. Lados cortos: 30% trote suave / recuperación activa.",
        "materiales": "Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif" # Reuse Circuito (Running)
    },

    # --- TÉCNICO (CONTROLES / PASES) ---
    {
        "titulo": "Rueda de Pases en Y",
        "categoria": ExerciseCategory.tecnico,
        "objetivo_principal": ExerciseObjective.tecnico,
        "intensidad_carga": ExerciseIntensity.media,
        "tiempo_minutos": 15,
        "descripcion": "Formación en Y. Pase profundidad, descarga de cara, pase a banda y centro. Rotación de posiciones continua.",
        "materiales": "Conos, Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" # VERIFIED
    },
    {
        "titulo": "Control Orientado y Definición",
        "categoria": ExerciseCategory.tecnico,
        "objetivo_principal": ExerciseObjective.tecnico,
        "intensidad_carga": ExerciseIntensity.media,
        "tiempo_minutos": 20,
        "descripcion": "Jugadora recibe pase fuerte desde banda, realiza control orientado evitando pica (rival) y remata a puerta.",
        "materiales": "Portería, Balones, Picas",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" # Reuse Pases
    },
    {
        "titulo": "Conducción y Regate 1vs1",
        "categoria": ExerciseCategory.tecnico,
        "objetivo_principal": ExerciseObjective.tecnico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 15,
        "descripcion": "Canal de 15x5m. Atacante debe superar a defensora y cruzar la línea final. Si defensora roba, puede atacar a pica opuesta.",
        "materiales": "Conos",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif" # Reuse Possession (Duels)
    },

    # --- TÁCTICO (POSICIONAMIENTO / JUEGO) ---
    {
        "titulo": "Juego de Posición 4vs4 + 3 Comodines",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.baja, # Cognitivo alto
        "tiempo_minutos": 20,
        "descripcion": "Espacio reducido. Objetivo: Mantener posesión usando comodínes (bandas y centro). Búsqueda de tercer hombre.",
        "materiales": "Petos de 3 colores, Conos",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif" # VERIFIED
    },
    {
        "titulo": "Salida de balón ante presión",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.media,
        "tiempo_minutos": 25,
        "descripcion": "Portera + Línea de 4 vs 3 Delanteras. Objetivo: Conectar con mediocentros en zonas marcadas. Si delanteras roban, finalizan rápido.",
        "materiales": "Portería, Petos",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" # Reuse Pases (Building up)
    },
    {
        "titulo": "Basculación Defensiva en Bloque",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.media,
        "tiempo_minutos": 20,
        "descripcion": "Línea de 4 defensoras + 3 medios. El entrenador mueve el balón con la mano, el equipo debe bascular en bloque manteniendo distancias.",
        "materiales": "Ninguno",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif" # Reuse Possession (Group movement)
    },
    {
        "titulo": "Transiciones Rápidas (Ataque-Defensa)",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 15,
        "descripcion": "3vs2 en una portería. Al finalizar, el equipo que defendió recibe balón y ataca a la otra portería (2vs1 o 3vs2).",
        "materiales": "2 Porterías, Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0008.gif" # Reuse Rondo (High tempo)
    },

    # --- ESTRATEGIA (ABP) ---
    {
        "titulo": "Córner Ofensivo - Bloqueos",
        "categoria": ExerciseCategory.estrategia,
        "objetivo_principal": ExerciseObjective.estrategico,
        "intensidad_carga": ExerciseIntensity.baja,
        "tiempo_minutos": 15,
        "descripcion": "Rutina de córner: 2 jugadoras bloquean marcas al primer palo para liberar a la rematadora principal en punto penal.",
        "materiales": "Balón parado",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" # Reuse Pases (Ball striking)
    },
    {
        "titulo": "Tiro Libre Frontal - Amague y Pase",
        "categoria": ExerciseCategory.estrategia,
        "objetivo_principal": ExerciseObjective.estrategico,
        "intensidad_carga": ExerciseIntensity.baja,
        "tiempo_minutos": 10,
        "descripcion": "Jugadora A amaga tiro, pasa por encima del balón. Jugadora B filtra pase a Jugadora A que se desmarca detrás de la barrera.",
        "materiales": "Barrera, Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" # Reuse Pases
    },

    # --- ENTRADA EN CALOR / RECUPERACIÓN ---
    {
        "titulo": "Movilidad Articular y Activación",
        "categoria": ExerciseCategory.entrada_calor,
        "objetivo_principal": ExerciseObjective.fisico,
        "intensidad_carga": ExerciseIntensity.baja,
        "tiempo_minutos": 10,
        "descripcion": "Movimientos articulares tren superior e inferior + Skipping, talones, desplazamientos laterales.",
        "materiales": "Ninguno",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif" # Reuse Circuito
    },
    {
        "titulo": "Rondo Loco (Activación)",
        "categoria": ExerciseCategory.entrada_calor,
        "objetivo_principal": ExerciseObjective.tecnico,
        "intensidad_carga": ExerciseIntensity.baja,
        "tiempo_minutos": 10,
        "descripcion": "Todos en círculo dándose pases con 2 balones. 2 jugadoras en el medio intentan tocar cualquier balón.",
        "materiales": "Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0008.gif" # Reuse Rondo
    },
    # --- EVALUACIÓN Y PRETEMPORADA ---
    {
        "titulo": "Yo-Yo Test / Test de Recuperación Intermitente",
        "categoria": ExerciseCategory.fisico,
        "objetivo_principal": ExerciseObjective.fisico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 20,
        "descripcion": "Carreras de ida y vuelta de 20m a velocidades crecientes marcadas por bips. Sirve para medir la recuperación y capacidad aeróbica máxima.",
        "materiales": "Conos, Audio del Test",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif"
    },
    {
        "titulo": "Circuito de Habilidades Integradas (Evaluación)",
        "categoria": ExerciseCategory.tecnico,
        "objetivo_principal": ExerciseObjective.tecnico,
        "intensidad_carga": ExerciseIntensity.media,
        "tiempo_minutos": 15,
        "descripcion": "1) Slalom 2) Salto 3) Control 4) Pase 5) Remate. Se cronometra para evaluar virtudes y falencias técnicas bajo presión de tiempo.",
        "materiales": "Picas, Vallas, Balones, Cronómetro",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif"
    },
    {
        "titulo": "Fútbol 4vs4 + Porteras (Evaluación Táctica)",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 25,
        "descripcion": "Espacio 30x20m. Juego libre para observar toma de decisiones, posicionamiento natural y nivel futbolístico de cada jugadora.",
        "materiales": "Petos, Porterías",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif"
    },
    # --- ESPECIALES PRETEMPORADA ---
    {
        "titulo": "Saltos de vallas y finalización",
        "categoria": ExerciseCategory.fisico,
        "objetivo_principal": ExerciseObjective.fisico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 20,
        "descripcion": "Serie de saltos bipodales sobre vallas bajas seguidos de un sprint explosivo y remate a portería. Fomenta la potencia y la transferencia al gesto técnico.",
        "materiales": "Vallas, Balones, Portería",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(delantero)-0001.gif"
    },
    {
        "titulo": "Finalización desde fuera del área",
        "categoria": ExerciseCategory.tecnico,
        "objetivo_principal": ExerciseObjective.tecnico,
        "intensidad_carga": ExerciseIntensity.media,
        "tiempo_minutos": 15,
        "descripcion": "Jugadoras reciben en zona de 3/4, perfilan y disparan buscando precisión y potencia. Rotación de perfiles (derecha/izquierda).",
        "materiales": "Balones, Portería",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0007.gif"
    },
    {
        "titulo": "Remate de cabeza y finalización",
        "categoria": ExerciseCategory.tecnico,
        "objetivo_principal": ExerciseObjective.tecnico,
        "intensidad_carga": ExerciseIntensity.media,
        "tiempo_minutos": 15,
        "descripcion": "Centros desde banda para remate de cabeza en carrera. Enfoque en el tiempo de salto y dirección del remate.",
        "materiales": "Balones, Portería",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(delantero)-0002.gif"
    },
    {
        "titulo": "Posesión libre 3 equipos (Transición)",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 25,
        "descripcion": "Dos equipos mantienen posesión mientras uno intenta robar. Al robar, el equipo que perdió el balón pasa a defender. Alta exigencia en transiciones.",
        "materiales": "Petos de 3 colores, Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Tac-0056.gif"
    },
    {
        "titulo": "Circuito de Agilidad-Regate 4",
        "categoria": ExerciseCategory.fisico,
        "objetivo_principal": ExerciseObjective.fisico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 20,
        "descripcion": "Circuito con cambios de dirección bruscos, fintas y regates entre picas. Trabaja la agilidad reactiva coordinada con el balón.",
        "materiales": "Picas, Conos, Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Pfi-0096.gif"
    },
    {
        "titulo": "Trabajo Intermitente 15x15",
        "categoria": ExerciseCategory.fisico,
        "objetivo_principal": ExerciseObjective.fisico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 25,
        "descripcion": "15 segundos de carrera intensa (85-90% vAM) seguidos de 15 segundos de recuperación pasiva o trote muy suave. Bloques de 8 minutos.",
        "materiales": "Conos, Silbato",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif"
    },
    {
        "titulo": "Fútbol Reducido 5vs5 (Transiciones)",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 25,
        "descripcion": "Espacio 40x30m con porterías. Juego a 2 toques máximo para fomentar la velocidad de pensamiento y transiciones rápidas.",
        "materiales": "Porterías, Balones, Petos",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Tac-0056.gif"
    },
    {
        "titulo": "Fútbol Reducido 8vs8 (Modelo de Juego)",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 30,
        "descripcion": "Espacio área a área. Se trabajan conceptos específicos del modelo de juego (amplitud, basculación, presión tras pérdida).",
        "materiales": "Porterías, Balones, Petos",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Tac-0056.gif"
    },
    {
        "titulo": "Partido Formal / Simulación 11vs11",
        "categoria": ExerciseCategory.tactico,
        "objetivo_principal": ExerciseObjective.tactico,
        "intensidad_carga": ExerciseIntensity.alta,
        "tiempo_minutos": 40,
        "descripcion": "Partido a campo completo con reglas reales. Se dividen equipos mezclando Primera y Sub-17 para evaluar integración.",
        "materiales": "Campo completo, Balones",
        "media_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Tac-0056.gif"
    },
]

def download_media(url, filename):
    folder = os.path.join(os.getcwd(), "assets", "exercises")
    if not os.path.exists(folder):
        os.makedirs(folder)
    
    filepath = os.path.join(folder, filename)
    if os.path.exists(filepath):
        return filepath
    
    try:
        print(f"Descargando: {url}...")
        r = requests.get(url, stream=True)
        if r.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in r.iter_content(1024):
                    f.write(chunk)
            print("OK")
            return filepath
        else:
            print(f"Error {r.status_code}")
    except Exception as e:
        print(f"Excepcion: {e}")
    return None

def load_data():
    session = SessionLocal()
    print("--- Cargando Biblioteca de Ejercicios ---")
    created_count = 0
    updated_count = 0
    
    for ex_data in EXERCISES_DATA:
        # Separar URL antes de crear objeto
        m_url = ex_data.pop("media_url", None)
        local_path = None
        
        if m_url:
            fname = f"{ex_data['titulo'].replace(' ', '_')}.gif"
            local_path = download_media(m_url, fname)

        # Verificar si ya existe por título
        exists = session.query(Exercise).filter(Exercise.titulo == ex_data["titulo"]).first()
        
        if not exists:
            # Crear nuevo
            if local_path: ex_data["foto_path"] = local_path
            new_ex = Exercise(**ex_data)
            session.add(new_ex)
            created_count += 1
            print(f"Agregado: {ex_data['titulo']}")
        else:
            # Actualizar siempre si tenemos un path local nuevo (para corregir rotos)
            if local_path:
                exists.foto_path = local_path
                updated_count += 1
                print(f"Actualizado con Media: {ex_data['titulo']}")
            else:
                print(f"Ya existe (sin cambios): {ex_data['titulo']}")
            
    session.commit()
    print(f"--- Carga Finalizada. {created_count} nuevos, {updated_count} actualizados. ---")
    session.close()

if __name__ == "__main__":
    load_data()