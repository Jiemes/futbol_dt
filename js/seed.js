const exercises = [
    { "title": "Rondo de Presión Alta", "category": "Físico", "description": "Cuadrado de 10x10m. 4 vs 2. Los 2 del medio deben recuperar. Si recuperan, cambian con quien perdió el balón. Alta intensidad, toques rápidos.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0008.gif" },
    { "title": "Circuito de Velocidad y Agilidad", "category": "Físico", "description": "Estaciones: 1) Escalera de coordinación. 2) Slalom entre picas. 3) Salto de vallas. 4) Sprint 10m. Recuperación trotando al inicio.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif" },
    { "title": "Fartlek con Balón", "category": "Físico", "description": "Conducción alrededor de la cancha. Lados largos: 70% velocidad. Lados cortos: 30% trote suave / recuperación activa.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif" },
    { "title": "Rueda de Pases en Y", "category": "Técnico", "description": "Formación en Y. Pase profundidad, descarga de cara, pase a banda y centro. Rotación de posiciones continua.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" },
    { "title": "Control Orientado y Definición", "category": "Técnico", "description": "Jugadora recibe pase fuerte desde banda, realiza control orientado evitando pica (rival) y remata a puerta.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" },
    { "title": "Conducción y Regate 1vs1", "category": "Técnico", "description": "Canal de 15x5m. Atacante debe superar a defensora y cruzar la línea final. Si defensora roba, puede atacar a pica opuesta.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif" },
    { "title": "Juego de Posición 4vs4 + 3 Comodines", "category": "Táctico", "description": "Espacio reducido. Objetivo: Mantener posesión usando comodínes (bandas y centro). Búsqueda de tercer hombre.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif" },
    { "title": "Salida de balón ante presión", "category": "Táctico", "description": "Portera + Línea de 4 vs 3 Delanteras. Objetivo: Conectar con mediocentros en zonas marcadas. Si delanteras roban, finalizan rápido.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" },
    { "title": "Basculación Defensiva en Bloque", "category": "Táctico", "description": "Línea de 4 defensoras + 3 medios. El entrenador mueve el balón con la mano, el equipo debe bascular en bloque manteniendo distancias.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif" },
    { "title": "Transiciones Rápidas (Ataque-Defensa)", "category": "Táctico", "description": "3vs2 en una portería. Al finalizar, el equipo que defendió recibe balón y ataca a la otra portería (2vs1 o 3vs2).", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0008.gif" },
    { "title": "Córner Ofensivo - Bloqueos", "category": "Técnico", "description": "Rutina de córner: 2 jugadoras bloquean marcas al primer palo para liberar a la rematadora principal en punto penal.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" },
    { "title": "Tiro Libre Frontal - Amague y Pase", "category": "Técnico", "description": "Jugadora A amaga tiro, pasa por encima del balón. Jugadora B filtra pase a Jugadora A que se desmarca detrás de la barrera.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" },
    { "title": "Yo-Yo Test", "category": "Físico", "description": "Carreras de ida y vuelta de 20m a velocidades crecientes marcadas por bips. Sirve para medir la recuperación y capacidad aeróbica máxima.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif" },
    { "title": "Fútbol 4vs4 (Evaluación)", "category": "Táctico", "description": "Espacio 30x20m. Juego libre para observar toma de decisiones, posicionamiento natural y nivel futbolístico de cada jugadora.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif" },
    { "title": "Saltos de vallas y finalización", "category": "Físico", "description": "Serie de saltos bipodales sobre vallas bajas seguidos de un sprint explosivo y remate a portería.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(delantero)-0001.gif" },
    { "title": "Finalización desde fuera del área", "category": "Técnico", "description": "Jugadoras reciben en zona de 3/4, perfilan y disparan buscando precisión y potencia.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0007.gif" },
    { "title": "Remate de cabeza y finalización", "category": "Técnico", "description": "Centros desde banda para remate de cabeza en carrera. Enfoque en el tiempo de salto y dirección del remate.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(delantero)-0002.gif" },
    { "title": "Posesión libre 3 equipos", "category": "Táctico", "description": "Dos equipos mantienen posesión mientras uno intenta robar. Al robar, el equipo que perdió el balón pasa a defender.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Tac-0056.gif" },
    { "title": "Fútbol Reducido 5vs5", "category": "Táctico", "description": "Espacio 40x30m con porterías. Juego a 2 toques máximo para fomentar la velocidad de pensamiento.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Tac-0056.gif" }
];

async function seedExercises() {
    console.log("Iniciando carga masiva de ejercicios...");
    for (const ex of exercises) {
        const { error } = await supabase.from('exercises').upsert(ex, { onConflict: 'title' });
        if (error) console.error(`Error en ${ex.title}:`, error);
        else console.log(`Cargado: ${ex.title}`);
    }
    alert("¡Ejercicios cargados con éxito!");
}

seedExercises();
