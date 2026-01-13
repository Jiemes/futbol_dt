const finalExercises = [
    // --- PSICOLÓGICOS (Nuevos o corregidos) ---
    {
        "title": "Manejo de Frustración (Árbitro Injusto)",
        "category": "Psicológico",
        "description": "Partido reducido donde el entrenador pita faltas inexistentes o no cobra penales claros. Objetivo: Mantener la concentración y el respeto a pesar de la adversidad externa.",
        "gif_url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHF4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26ufcVAp3AiJJsrEk/giphy.gif"
    },
    {
        "title": "Atención Selectiva (Rondo del Caos)",
        "category": "Psicológico",
        "description": "Dos rondos 4x2 cruzados en el mismo espacio. Las jugadoras deben ignorar el otro rondo y enfocarse solo en su balón. Mejora la visión periférica y foco.",
        "gif_url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHF4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif"
    },
    {
        "title": "Liderazgo Rotativo",
        "category": "Psicológico",
        "description": "En un juego táctico, cada 5 minutos se cambia a la jugadora que da las órdenes. Todas deben pasar por el rol de mando para desarrollar comunicación.",
        "gif_url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHF4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlS3p1G9lK62gN2/giphy.gif"
    },
    {
        "title": "Resiliencia ante el Marcador",
        "category": "Psicológico",
        "description": "Situación de partido que comienza 0-2 abajo faltando 10 minutos. Se trabaja la mentalidad ganadora y la gestión del tiempo bajo presión.",
        "gif_url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHF4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eXJydWp4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxP5O9iPzoc/giphy.gif"
    },
    // --- TÁCTICOS (Corrección de GIFs duplicados si es posible) ---
    {
        "title": "Transiciones Veloces 3vs2",
        "category": "Táctico",
        "description": "Ataque rápido en superioridad numérica tras robo en mitad de cancha. Máximo 10 segundos para finalizar.",
        "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Tac-0056.gif"
    },
    {
        "title": "Basculación Defensiva (Línea de 4)",
        "category": "Táctico",
        "description": "Movimiento coordinado del bloque defensivo según la posición del balón en banda. Mantener distancias entre central y lateral.",
        "gif_url": "https://entrenamientosdefutbol.es/Ejercicios/Futbol_Castellano/Esp(centrocamp)-0006.gif"
    }
];

async function seedFinalExercises() {
    console.log("Actualizando biblioteca con ejercicios psicológicos finales...");
    const supabase = typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabase;
    for (const ex of finalExercises) {
        // Upsert para corregir si ya existen o agregar nuevos
        await supabase.from('exercises').upsert(ex, { onConflict: 'title' });
    }
    if (typeof libraryManager !== 'undefined' && libraryManager.loadExercises) {
        await libraryManager.loadExercises();
    }
    alert("¡Biblioteca actualizada y ejercicios psicológicos sumados!");
}

seedFinalExercises();
