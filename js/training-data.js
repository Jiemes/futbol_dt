/* Sesiones preparadas con el cuerpo técnico. uploadedAt nombra la entrada;
   date es el día previsto de práctica y puede ser distinto en futuras cargas. */
window.PALOMETAS_TRAININGS = [
    {
        id: '2026-11-04',
        uploadedAt: '2026-11-04',
        date: '2026-11-04',
        title: 'Apoyarnos para salir y atacar',
        start: '19:00', end: '21:00', goalkeeperFrom: '20:00',
        defaultFieldPlayers: 10,
        objective: 'Que quien tiene la pelota encuentre dos apoyos, pueda superar la presión y llegue al arco con compañeras en zonas distintas.',
        equipment: ['1 arco real', '8–10 pelotas', '24–28 conos bajos de dos colores', 'Pecheras de dos equipos + 2 comodines', 'Agua junto al campo'],
        preparation: 'Dejá armadas las tres estaciones antes de las 19. Reservá al lado un rectángulo con el arco real y dos puertas de conos: desde las 19:42 se usa ese espacio, primero sin arquera. Las medidas son referencias; ampliá si falta tiempo para decidir y reducí si sobra espacio.',
        coaching: 'Juan observa los apoyos y el primer control. Ángel observa los espacios ocupados y las transiciones. Una sola corrección breve por pausa; la siguiente tanda sirve para ponerla en práctica.',
        stages: [
            {
                id: 'activacion', title: 'Preparar el cuerpo y la pelota', shortTitle: 'Activación',
                start: '19:00', end: '19:18', minutes: 18, type: 'warmup', goalkeeper: false,
                focus: 'Subir la intensidad de a poco y llegar a los juegos con control de los apoyos, las frenadas y el primer toque.',
                organization: 'Un espacio de 20 × 15 m. Desplazamientos sin cruces y después parejas; si el número es impar, un trío con pases continuos. La arquera está con su entrenador.',
                timing: '3 min de desplazamientos + 4 de movilidad + 5 de fuerza y equilibrio + 3 con pelota + 3 de progresiones. Los cambios y las explicaciones están incluidos.',
                instructions: [
                    '19:00–19:03 · Trote suave, pasos laterales y cambios de frente. Preguntar cómo llegan y si hay alguna molestia.',
                    '19:03–19:07 · Movilidad dinámica: tobillo hacia delante con talón apoyado, abrir y cerrar cadera, rotar el tronco. Rango cómodo y sin rebotes.',
                    '19:07–19:12 · Dos vueltas: 6 sentadillas cortas, 4 zancadas cortas por lado, 8 elevaciones de talones y 15 segundos de equilibrio por pierna. Usar el tiempo restante para corregir y cambiar; no apurar repeticiones.',
                    '19:12–19:15 · Pases a 6–8 m. Mirar antes, recibir de costado y orientar el primer toque hacia la siguiente acción; pasar y moverse.',
                    '19:15–19:18 · Tres progresiones de 10–15 m, de moderado a vivo, regresando caminando. Frenar con pasos cortos y controlados; sin buscar la velocidad máxima.'
                ],
                cues: ['Rodilla orientada hacia el pie, sin colapsar hacia adentro.', 'Calidad de movimiento antes que cantidad.', 'Subir la intensidad cuando el grupo esté preparado.'],
                easier: 'Acortar las progresiones y el rango de las zancadas si cuesta controlar el movimiento.',
                harder: 'Aumentar gradualmente la velocidad de las últimas progresiones, manteniendo una frenada estable.',
                care: 'Es una entrada en calor progresiva propia, no el programa completo FIFA 11+. Si aparece dolor, detener o adaptar esa tarea; la movilidad sola no garantiza evitar lesiones.'
            },
            {
                id: 'estaciones', title: 'Tres estaciones, todas en acción', shortTitle: 'Estaciones',
                start: '19:18', end: '19:42', minutes: 24, type: 'stations', goalkeeper: false,
                focus: 'Mirar, decidir y ofrecer apoyo mediante retos cortos. Tres grupos pequeños recorren las tres estaciones.',
                organization: 'Armá A: 12 × 10 m, B: 12 × 12 m y C: 14 × 12 m. Dejá al menos 4 m libres entre estaciones. Los grupos rotan A → B → C → A; las pelotas se quedan en cada lugar.',
                timing: '3 vueltas de 8 min: 3 min de juego + 1 de pausa y devolución + 3 de revancha + 1 para agua y rotación. En la última rotación se pasa al campo de salida.',
                instructions: ['Mostrar una acción de cada estación antes de iniciar el reloj.', 'Mantener los grupos durante las tres vueltas; cambiar las funciones dentro de cada ejercicio.', 'Cada grupo intenta mejorar su propia marca en la segunda serie. Ninguna jugadora queda eliminada ni recibe ejercicios físicos como castigo.'],
                cues: ['Juan acompaña A y B; Ángel acompaña C.', 'Consignas cortas: mirá, perfilate y volvé a ofrecerte.', 'Una pelota en juego por tarea, salvo las dos parejas independientes de A.'],
                easier: 'Ampliar el espacio y dejar controles libres cuando la presión impida enlazar acciones.',
                harder: 'Reducir un poco el espacio o pedir que el pase encuentre a una compañera que se haya movido. Cambiar una sola condición por vez.',
                stations: [
                    {
                        id: 'pase', letter: 'A', title: 'Control hacia el color', dimension: '12 × 10 m',
                        gif: '01-control-color.gif', example: '4 jugadoras: dos parejas en carriles separados',
                        objective: 'Mirar antes de recibir y orientar el control hacia un espacio útil.',
                        steps: ['Con cuatro, formar dos parejas en carriles separados; con tres, pasadora, receptora y apoyo. Dos puertas de colores a los lados de la receptora.', 'La pasadora nombra un color mientras viaja la pelota. La receptora mira, controla hacia esa puerta y devuelve el pase. En el trío, pasa a la tercera, que reinicia con la pasadora.', 'Cambiar receptora y pasadora cada 45–60 segundos. En el trío, rotar los tres puestos.'],
                        score: 'Un punto por control hacia la puerta indicada y pase preciso. En la revancha, superar la propia marca.',
                        cue: 'Mirar antes de la llegada de la pelota; que el primer toque prepare el pase, sin alejarla de más.'
                    },
                    {
                        id: 'rondo', letter: 'B', title: 'Rondo y nuevo apoyo', dimension: '12 × 12 m',
                        gif: '02-rondo-apoyos.gif', example: '3 contra 1; con un grupo de tres, usar 2 contra 1',
                        objective: 'Crear otra línea de pase después de soltar la pelota.',
                        steps: ['Con cuatro, 3 contra 1; con tres, 2 contra 1 y ampliar el espacio si hace falta.', 'Cinco pases seguidos suman un punto; si la defensora recupera y sale controlando por un lado, también suma.', 'Cambiar defensora cada 45–60 segundos. Tras pasar, buscar un ángulo nuevo: no quedarse detrás de la rival.'],
                        score: 'Contar cadenas de cinco pases y recuperaciones. Todas pasan por defensa, sin usar ese rol como castigo.',
                        cue: 'Dos apoyos a distinta altura cuando el número lo permite; en 2 contra 1, moverse para salir de la sombra de la defensora.'
                    },
                    {
                        id: 'duelo', letter: 'C', title: '1 contra 1 con apoyos', dimension: '14 × 12 m',
                        gif: '03-duelo-apoyos.gif', example: '1 contra 1 + 1 apoyo neutral; con cuatro, sumar otro apoyo',
                        objective: 'Elegir entre superar conduciendo o combinar con una compañera.',
                        steps: ['Dos jugadoras adentro y una o dos neutrales por fuera de los laterales. Las neutrales ayudan a quien tiene la pelota y no pueden marcar.', 'Cada jugadora interior ataca una puerta y defiende la opuesta. Se marca atravesando la puerta rival con la pelota controlada.', 'Si recupera la defensora, ataca de inmediato la otra puerta. Rotar interior y apoyo cada minuto para repartir el esfuerzo.'],
                        score: 'Un punto por atravesar la puerta con control. Marcador a cero para la revancha.',
                        cue: 'La pared es una posibilidad: si se abre el camino, conducir. Las neutrales se mueven por su lateral para dar una línea de pase.'
                    }
                ]
            },
            {
                id: 'salida-sin-arquera', title: 'Salir de la presión sin arquera', shortTitle: 'Salida sin arquera',
                start: '19:42', end: '20:00', minutes: 18, type: 'build-no-gk', goalkeeper: false,
                focus: 'Dar apoyo por detrás y por los costados para progresar con control. Todas participan, sin esperar la llegada de la arquera.',
                organization: 'Rectángulo de 30 × 24 m con dos puertas de 3 m en cada fondo. Dos equipos y una o dos comodines interiores, que ayudan a quien tiene la pelota. Las comodines no marcan y cambian cada tanda.',
                timing: '2 min de explicación + 3 tandas de 4 min + 2 pausas de 2 min = 18 min. Cambiar comodines y sentido de ataque en las pausas.',
                instructions: ['Cada equipo ataca las dos puertas de enfrente. Reinicia una jugadora desde su propio fondo, con los pies y sin usar un arco real.', 'Un punto al atravesar una puerta con conducción controlada o con un pase recibido por una compañera al otro lado. No vale tirar la pelota sola por la puerta.', 'Si el rival cierra un lado, ofrecer un pase de seguridad y cambiar la orientación. Si se recupera, atacar el fondo opuesto.', 'Tras un punto o una salida, reiniciar enseguida desde el fondo correspondiente; dejar pelotas de reserva por fuera.'],
                cues: ['Preguntar: ¿a quién puede pasar la compañera si no puede avanzar?', 'Una se acerca, otra se aleja: no juntarse todas a pedir al pie.', 'Después del pase, salir de la sombra de la rival.'],
                easier: 'Ampliar el campo o permitir que la primera receptora controle sin presión durante el reinicio.',
                harder: 'Pedir que, tras reiniciar, una jugadora rompa una línea antes de puntuar. Sin imponer una secuencia fija de pases.',
                gif: '04-salida-sin-arquera.gif', example: '4 contra 4 + 2 comodines: 10 jugadoras de campo'
            },
            {
                id: 'integrar-arquera', title: 'Sumar a la arquera a la salida', shortTitle: 'Se suma la arquera',
                start: '20:00', end: '20:10', minutes: 10, type: 'build-gk', goalkeeper: true,
                focus: 'Conectar a la arquera con centrales, laterales y mediocampistas usando lo que el grupo acaba de practicar.',
                organization: 'Un arco real a un fondo y dos puertas de 4 m en el opuesto, en 32 × 28 m. La arquera se suma al equipo que construye; el otro presiona. Todas las jugadoras de campo están adentro.',
                timing: '1 min para organizar y conocer cómo llega la arquera + 4 min de juego + 1 min de pausa + 4 min cambiando los equipos que construyen y presionan.',
                instructions: ['Preguntar a la arquera cómo se siente después de su trabajo específico. Integrarla con pases de pies y comunicación, sin repetirle una preparación física.', 'La arquera inicia con pelota controlada. Centrales abren dos lados, laterales dan amplitud y una mediocampista ofrece pase interior.', 'El equipo constructor suma al salir controlando por una puerta. La presión suma si recupera y completa un pase: entonces se reinicia desde la arquera, sin remate.', 'Al cambiar equipos, mantener a la arquera en el arco. Puede devolver un pase y ayudar a cambiar de lado; avanzar más largo también es válido si la presión lo exige.'],
                cues: ['La arquera habla antes del pase: sola, vuelta, girá.', 'Ofrecer una opción corta y otra más alejada.', 'No obligar a salir corto cuando la rival cierra todas las líneas.'],
                easier: 'Alejar unos metros el inicio de la presión o dejar libre el primer pase.',
                harder: 'Acercar el inicio de la presión, conservando el espacio para que haya opciones reales.',
                care: 'La arquera ya lleva una hora de entrenamiento. Ajustar su participación con su entrenador si llega fatigada; en este bloque no recibe una serie de remates.',
                gif: '05-salida-con-arquera.gif', example: '5 que construyen contra 5 que presionan + arquera'
            },
            {
                id: 'ataque', title: 'Amplitud, llegada y pase atrás', shortTitle: 'Ataque al arco',
                start: '20:10', end: '20:32', minutes: 22, type: 'attack', goalkeeper: true,
                focus: 'Llegar al arco con anchura y con opciones de remate a distintas alturas, eligiendo según la defensa.',
                organization: 'Un arco con arquera, dos puertas de contraataque al fondo opuesto y dos apoyos neutrales por los laterales. Referencia: 36 × 30 m. Las neutrales ayudan al equipo con pelota, sin entrar ni rematar.',
                timing: '2 min de demostración + 3 tandas de 5 min + 2 pausas de 2 min + 1 min final para agua y cambio al partido = 22 min.',
                instructions: ['Atacantes inician desde el fondo opuesto al arco y pueden usar ambos apoyos de banda. Alternar el lado de inicio; mantener una sola pelota en juego.', 'Mostrar esta opción: pase a banda, progresión si hay espacio, una atacante al primer palo, otra al segundo y una tercera llegando de frente. Otra compañera ofrece seguridad por detrás.', 'La neutral de banda puede dar el pase atrás desde su lateral. Si la defensa cierra esa opción, jugar por dentro, cambiar de lado o asegurar: no obligar a copiar el GIF.', 'Tras pérdida, defender la transición. Las defensoras puntúan al salir controlando por una de las dos puertas; después se reinicia.', 'Cambiar ataque y defensa en cada tanda. Rotar los dos apoyos de afuera con compañeras de adentro cada 2 min, durante un reinicio; evitar puestos fijos.'],
                cues: ['Llegar a zonas distintas, sin quedar tres esperando la pelota en el mismo lugar.', 'El pase atrás busca a quien llega de frente, no a una zona vacía.', 'Si la pelota está bajo presión, preparar también el apoyo de seguridad.'],
                easier: 'Dar más ancho o permitir el primer pase sin oposición para iniciar con control.',
                harder: 'Liberar la presión desde el primer pase y reducir algo el espacio si la resolución es demasiado cómoda.',
                care: 'Remates dentro del juego y de una pelota por vez. Pelotas de reserva fuera de la trayectoria; recuperar las que quedan detrás del arco solo cuando la acción termina.',
                gif: '06-ataque-pase-atras.gif', example: '4 atacantes contra 4 defensoras + 2 apoyos neutrales + arquera'
            },
            {
                id: 'partido', title: 'Jugar y reconocer lo aprendido', shortTitle: 'Partido',
                start: '20:32', end: '20:55', minutes: 23, type: 'game', goalkeeper: true,
                focus: 'Comprobar si aparecen los apoyos y la ocupación de espacios cuando el juego es libre.',
                organization: 'Un arco real con arquera y dos puertas de 3 m en el fondo opuesto. Referencia: 40 × 30 m. Un equipo ataca el arco, el otro las puertas; la arquera juega con quienes defienden el arco.',
                timing: '1 min de organización + 3 tandas de 6 min + 2 pausas de 2 min = 23 min. En cada pausa cambiar qué equipo ataca el arco; la arquera permanece en él.',
                instructions: ['Un punto por gol en el arco o por cruzar una puerta con conducción o pase recibido con control. Si hay una comodín, ayuda al equipo con pelota y no marca.', 'En las dos primeras tandas, reconocer en voz alta las buenas decisiones de apoyo y ocupación de espacios. No imponer un número de pases antes de atacar.', 'En la última tanda, dejar jugar con el mismo valor para todos los goles y salidas. Observar si los comportamientos aparecen sin indicaciones.', 'Intervenir en las pausas: una pregunta y una corrección concreta. Cambiar la comodín en cada tanda si corresponde.'],
                cues: ['Juan: ¿quien recibe tiene al menos dos opciones reales?', 'Ángel: ¿las llegadas ocupan zonas distintas y queda seguridad por detrás?', 'Observar también la reacción tras perder la pelota.'],
                easier: 'Ampliar el espacio o ensanchar las puertas si casi no hay progresiones controladas.',
                harder: 'Reducir el espacio si las jugadoras pueden avanzar sin oposición. Mantener el juego libre, sin sumar varias reglas.'
            },
            {
                id: 'cierre', title: 'Bajar y llevarse una idea', shortTitle: 'Cierre',
                start: '20:55', end: '21:00', minutes: 5, type: 'cooldown', goalkeeper: true,
                focus: 'Recuperar la calma y hacer visible un aprendizaje para el próximo partido.',
                organization: 'Grupo completo cerca del agua, incluida la arquera. Sin otra tarea intensa al final.',
                timing: '2 min para caminar, bajar la actividad e hidratarse + 3 min de conversación breve.',
                instructions: ['Caminar y bajar progresivamente la actividad; preguntar cómo termina cada una.', 'Preguntar: ¿qué movimiento de una compañera te ayudó a salir de la presión?', 'Preguntar: ¿cuándo convino avanzar y cuándo asegurar o cambiar de lado?', 'Juan y Ángel nombran una mejora concreta que vieron y una idea para sostener en el próximo partido.'],
                cues: ['Escuchar dos o tres respuestas, sin convertir el cierre en una charla larga.', 'Valorar decisiones y colaboración, además de goles.'],
                easier: 'Si el grupo está muy fatigado, acortar antes las tandas; no usar el cierre para recuperar carga.',
                harder: 'Pedir a dos jugadoras que expliquen con un ejemplo dónde aparecieron los apoyos.'
            }
        ],
        references: [
            { title: 'Referencia 1', code: 'DadaHO9R8Jn' }, { title: 'Referencia 2', code: 'DcTDLswunId' },
            { title: 'Referencia 3', code: 'DdLkE7_oO5H' }, { title: 'Referencia 4', code: 'DZFy5zSN6xZ' },
            { title: 'Referencia 5', code: 'DeFSV0BISP5' }, { title: 'Referencia 6', code: 'Dd1oYOXOR4U' },
            { title: 'Referencia 7', code: 'Dcv1E1es5JS' }, { title: 'Referencia 8', code: 'DeB6GUIOWHv' },
            { title: 'Referencia 9', code: 'DYwsqYXjLbd' }
        ],
        sources: [
            { title: 'FIFA · Jacqueline Dünker: pases bajo presión', url: 'https://www.fifatrainingcentre.com/en/practice/elite-sessions/in-possession/duenker-passing-under-pressure.php' },
            { title: 'FIFA · Nils Nielsen: soluciones en el último tercio', url: 'https://www.fifatrainingcentre.com/en/practice/elite-sessions/in-possession/nils-nielsen-solutions-in-the-final-third.php' },
            { title: 'FIFA · Principios para un calentamiento progresivo (12–15 años)', url: 'https://www.fifatrainingcentre.com/es/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/optimising-warm-ups-u12-to-u15.php' }
        ]
    }
];
