# Palometas Sub 17: agenda, fixture y jugadas

La web publicada desde la raíz del repositorio concentra el uso cotidiano en Inicio, Plantel Sub 17, Fixture y Jugadas. Conserva la configuración de Firebase y el acceso existente del cuerpo técnico. Los módulos de escritorio y la copia `web_app/` no cambian.

## Uso

- **Plantel:** todas las altas y ediciones pertenecen a Sub 17. Las demás categorías no se muestran en el plantel, en los cumpleaños ni en el fixture.
- **Incorporaciones y limpieza:** el propietario puede revisar otras categorías, incorporar las Sub 15 elegidas y borrar registros individualmente seleccionados. Conservar es la opción inicial para Sub 15 y categorías desconocidas. Primera y Reserva quedan preseleccionadas para borrar, pero no se modifica ningún dato al abrir la página. La aplicación solicita revisar la selección y ofrece un respaldo JSON antes de ejecutar una única operación atómica. Los datos adicionales de una jugadora se conservan al editar los campos visibles.
- **Cumpleaños:** se muestran las próximas cinco fechas y se puede ampliar la lista. La agenda `.ics` incluye solo Sub 17, recurrencia anual, identificadores estables, zona horaria argentina y aviso a las 09:00. Los cumpleaños del 29 de febrero se recuerdan el último día de febrero. La importación del archivo se realiza en el calendario del entrenador y no constituye una sincronización: el calendario puede requerir activar avisos y una nueva importación puede duplicar eventos.
- **Fixture:** alcanza con indicar el rival. Día, hora, torneo, número de fecha, cancha, resultado y goleadoras son optativos. Los goles se cargan como Palometas/rival tanto de local como de visitante. El resultado requiere ambos valores; 0–0 es válido. Se pueden registrar goleadoras sin resultado y se permite que falten autoras de algunos goles.
- **Jugadas:** se crean en la conversación y se agrega el GIF por archivo o por enlace HTTPS. La carga directa acepta GIFs de hasta 600 KiB y comprueba su firma, además de la extensión. Se guardan como datos de imagen en la colección existente `tactical_gifs`, sin incorporar otro servicio de archivos ni credenciales en el cliente. Este límite deja espacio para los metadatos dentro del máximo de documento de Firestore. Los GIFs más grandes pueden agregarse mediante un enlace. Se conservan las jugadas existentes y los ejercicios que ya tienen imagen.

## Validación

Ejecutar `node --test tests/sub17-core.test.cjs` para comprobar filtros de categoría, fechas y cambio de año, zona horaria argentina, años bisiestos, escape y plegado UTF-8 de iCalendar, resultados optativos, goleadoras y validación de GIFs.

La revisión visual se realizó con datos ficticios y un adaptador de base de datos en memoria: 18 jugadoras (2 arqueras), categorías excluidas, partidos con y sin fecha, resultado con goleadoras parciales, incorporación desde Sub 15 y carga de un archivo GIF. El entorno de prueba y sus datos no forman parte de los archivos publicados.

La UI de exportación respondió al botón de descarga, pero el navegador de prueba no devolvió el archivo descargado. La estructura del archivo y sus alarmas se verifican en las pruebas unitarias; falta comprobar la importación y los avisos en la agenda real del entrenador. No se modificaron registros reales ni se probaron escrituras contra el Firebase de producción.

Antes de usar la limpieza con datos reales, identificar las Sub 15 que se incorporan y conservar el respaldo de los registros que se elijan borrar. La revisión prepara los cambios de código; no borra categorías automáticamente al publicar.
