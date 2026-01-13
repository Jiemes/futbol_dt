const extraExercises = [
    { "title": "Charla Motivacional Pre-Cancha", "category": "Psicológico", "description": "Dinámica de grupo de 5 minutos. Foco en la cohesión, el esfuerzo compartido y el objetivo del entrenamiento.", "gif_url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHF4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxP5O9iPzoc/giphy.gif" },
    { "title": "Visualización de Jugadas", "category": "Psicológico", "description": "Las jugadoras cierran los ojos y repasan mentalmente sus movimientos tácticos específicos ante una situación de juego real.", "gif_url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHF4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfuxU56WbHOf6/giphy.gif" },
    { "title": "Concentración bajo Fatiga", "category": "Psicológico", "description": "Ejercicio de toma de decisiones rápidas (ej: resolver problemas matemáticos simples) inmediatamente después de un sprint explosivo.", "gif_url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHF4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif" },
    { "title": "Entrada en Calor Dinámica", "category": "Calor", "description": "Movilidad articular, desplazamientos laterales, skipping y breves piques para activar el flujo sanguíneo.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif" },
    { "title": "Estiramiento Dinámico", "category": "Calor", "description": "Estiramientos activos controlados para preparar los músculos sin perder la temperatura corporal alcanzada.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(portero)-0030.gif" },
    { "title": "Estrategia: Córner en Zona", "category": "ABP", "description": "Posicionamiento defensivo por zonas en tiros de esquina. Cada jugadora es responsable de un sector del área.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" },
    { "title": "Estrategia: Presión en Salida", "category": "ABP", "description": "Diagrama de presión coordinada cuando el rival intenta salir jugando con el portero.", "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0005.gif" }
];

async function seedExtraExercises() {
    console.log("Cargando ejercicios adicionales...");
    const supabase = typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabase;
    for (const ex of extraExercises) {
        await supabase.from('exercises').upsert(ex, { onConflict: 'title' });
    }
    if (typeof libraryManager !== 'undefined' && libraryManager.loadExercises) {
        await libraryManager.loadExercises();
    }
    alert("¡Ejercicios adicionales cargados!");
}

seedExtraExercises();
