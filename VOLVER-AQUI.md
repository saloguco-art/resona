# «Tocar la resonancia» y «Volver aquí» · rama local `movimiento-suave` (sin publicar)

Trabajo del 25 de noviembre de 2026 sobre la app existente (un solo reproductor, la misma biblioteca, el mismo motor).

## Abrir y probar

```
sh src/build.sh                    # construye index.html
python3 -m http.server 8765        # y abrir http://localhost:8765/
node src/tests/run.js              # 84 comprobaciones del analizador y los renderizadores de producción
node src/tests/make-audio.js       # escribe en src/test-audio/ nueve WAV sintéticos para importarlos a mano
```

- **Oír la transformación**: graba o importa → en «Tu paisaje», junto a la cifra en Hz, «Escuchar la resonancia».
- **Guardar para después**: «Volver aquí» (en «Tu paisaje» o al terminar la sesión) → opcionalmente «Al terminar de trabajar» o «Antes de dormir».
- **Mañana**: abrir la app → «▶ Escuchar 5 min» en Inicio. Un toque y suena.

## 1 · Primera visita: tocar la resonancia

- **Durante la grabación** aparece la lectura en Hz cuando varias mediciones seguidas coinciden (dentro del 3 %); se mantiene un
  momento para que no parpadee y vuelve a «— Hz» si deja de ser fiable.
- **En la preescucha** la cifra es una medición de la toma, nunca redondeada a una nota (solo se redondea al mostrarla):
  - objeto: su resonancia más fuerte; si hay dos fiables, botones para oír cada una y «Juntas»;
  - tono sostenido: su altura (afinada sobre el pico del espectro; 230 y 234 Hz se leen 230,00 y 233,97);
  - tarareo: el rango de sus notas;
  - agua, golpe seco, ruido o entrada dudosa: «Sin tono estable».
- **La demostración** (solo al tocar el botón) dura unos 7 s y tiene tres tiempos con su rótulo:
  1. «Original»: el golpe o fragmento real.
  2. «Resonancia · filtrada de tu toma»: la cola del mismo golpe pasada por un filtro estrecho en la frecuencia medida. Si la cola
     dura menos de 0,3 s se recrea con su frecuencia, nivel y caída y el rótulo lo dice: «recreada con su frecuencia y su caída».
  3. «Paisaje · lo que oirás en la sesión»: el motor de sesión con los ajustes en pantalla, entrando con un fundido.
  Al acabar queda la preescucha lista. Tocar otra cosa, repetir, cambiar de fuente o empezar la sesión corta lo que sonara.
- Sin tono estable: «Escuchar el detalle» si hay un evento que destaca (original → paisaje con ese tramo), o «Comparar con su
  textura» si el sonido es homogéneo.
- En la sesión, bajo el título: «Calma · 520 Hz» (o «sin tono estable», o «solo el agua»). Ya no aparece «afinado a…» en este recorrido.
- Al cargar otra toma se borra todo lo medido en la anterior antes de analizar.

## 2 · Próxima visita: volver aquí

- «Volver aquí» actualiza el registro que ya existe en la biblioteca (nombre, intención, duración, presencia, movimiento, instante
  conservado, fragmento, semilla; las dos tomas del río si las hay). Dos toques no crean dos copias; la grabación no se toca.
- El momento es un atajo elegido: no hay recordatorios ni notificaciones.
- **Inicio**: sin sonidos, «Grabar un sonido» e «Importar». Con sonidos, la acción principal es «▶ Escuchar N min» con el nombre y el
  momento reales; va primero el paisaje con momento usado más recientemente y, si ninguno lo tiene, el último usado.
- **Un gesto**: el toque de Inicio arranca el audio sin pregunta previa. Nada suena al abrir la web.
- **Sueño**: se guarda igual, desde la preescucha, al terminar o en «···» de la biblioteca. Al acabar el temporizador no hay sonido,
  valoración ni aviso (ya era así).
- Guardados anteriores: siguen funcionando sin momento. Si falta la grabación de un guardado, se retira ese acceso y se explica.
  Si el dispositivo no deja guardar, se avisa, se puede escuchar igualmente y lo ya guardado no se toca.

## 3 · El mismo lugar, otro día

Para preparar las tres tomas:

1. Copia `lugar.ejemplo.json` como `lugar.json` junto a `index.html`.
2. Pon los tres audios en una carpeta `lugar/` al lado (m4a, mp3 o wav) y ajusta `file`, `title` y, si la sabes, `date`.
3. Recarga: aparece el enlace «El mismo lugar, otro día» en Inicio.

Máximo tres entradas; solo rutas de la misma carpeta. Sin `lugar.json` la colección no existe ni se enseña. Para probar el recorrido
sin tomas reales: `?lugar=dev` genera tres tomas rotuladas como sintéticas. No hay tomas reales del Pallars en el repositorio.

## 4 · Piloto local de siete días

En «Tu práctica» → «Piloto de 7 días» → «Participar» (apagado por defecto; la app funciona igual sin él). Anota solo en el dispositivo:

- **Descubrimiento**: fuentes distintas transformadas y si hubo una segunda. Los reintentos por silencio, permiso o importación
  fallida van aparte.
- **Utilidad**: días en que se escuchó al menos 120 s de reproducción efectiva de un paisaje creado en una fecha local anterior. Solo
  cuenta el tiempo en que la sesión suena: ni preescuchas, ni demostraciones, ni pausas, ni audio interrumpido. Días con capturas
  nuevas y días con reescucha se listan por separado.

«Copiar resumen del piloto» lo exporta a mano. Preguntas para la entrevista final:

- «La última vez que abriste la app, ¿qué estaba pasando justo antes y qué sonido fuiste a buscar?»
- Si probó un segundo sonido: ¿por curiosidad o porque el primero no sonó bien?

Resultados humanos: ninguno todavía.

## Criterios de aceptación

Navegador integrado de Claude (Chromium de escritorio, 375×812), archivos WAV sintéticos importados por el selector de la app, y `node src/tests/run.js`.

| | Comprobado | Resultado |
|---|---|---|
| A | 230 y 234 Hz; después ruido y silencio | «230 Hz» y «234 Hz»; el ruido muestra «Sin tono estable» sin rastro de la cifra anterior; el silencio ofrece reintentar |
| B | Tramo «Resonancia» de dos impactos, sin golpe ni original | picos en 521 / 1430 Hz y en 387 / 1125 Hz según toma y resonancia elegida; niveles a menos de 3 dB; el tramo «Paisaje» corre en el motor de sesión (análisis, no escucha) |
| C | Importar, preescuchar, «Al terminar de trabajar», recargar, un toque en Inicio | suena en 0,7 s sin pregunta; mismos ajustes y semilla; una sola copia. Primera visita y biblioteca anterior, correctas |
| D | Cancelar la demostración en cada uno de sus tres tiempos y empezar sesión, tres veces | queda una sola reproducción; pico 0,70 a volumen máximo. Micrófono denegado, archivo de 0,25 s y fallo de guardado, sin pérdida de datos |
| E | Tres tomas de desarrollo, cinco cambios seguidos, guardar la elegida | arranca una sola fuente; sin tomas reales el enlace no aparece |
| F | Reloj controlado: 119 s, 120 s, pausa, medianoche, misma fecha | cuenta a los 120 s, una vez por fecha; las pruebas usan datos temporales |
| G | Pruebas y build; recorrido a tamaño móvil | 84 en verde; botones reales con etiqueta accesible; no se probó con lector de pantalla ni con «reducir movimiento» activado |

## Sin validar

- **Nadie ha escuchado nada**: todo lo anterior es análisis de señal y estado de la app.
- **iPhone físico y Safari**: sin probar. Tampoco la lectura en vivo con micrófono (el entorno lo bloquea; se probó la función con bloques sintéticos).
- **Botella real, río real, participantes**: pendientes.
