# Primera escucha, crear desde un vídeo, volver con un toque y postal sonora · rama local `movimiento-suave` (sin publicar)

Trabajo del 25 de noviembre de 2026. Todo sobre la app existente: el mismo motor, la misma biblioteca, la misma preescucha.

## Abrir

```
sh src/build.sh
python3 -m http.server 8765        # http://localhost:8765/
node src/tests/run.js              # 91 comprobaciones
```

## Recorrido

**Primera vez** (biblioteca vacía): «Vuelve a un lugar que te hace bien» y dos acciones.

- «Escuchar cómo funciona»: suena una toma de ejemplo tal cual y, a los pocos segundos, su paisaje. Es la preescucha de siempre con
  el motor de sesión, sobre una toma que no es tuya; no pide micrófono ni guarda nada. Alternas «Original / Paisaje», puedes parar,
  «Repetir la comparación» y oír la resonancia. Termina en «Crear con mi sonido».
- «Crear con mi sonido»: «Elegir un vídeo o audio» y «Grabar ahora», con el mismo tamaño. El micrófono solo se pide al grabar.

**Desde un vídeo**: el sonido se saca en el dispositivo y llegas a la preescucha con cinco minutos de Calma preparados.

| Archivo | Qué hace |
|---|---|
| hasta 48 MB y 5 minutos | se decodifica entero; si pasa de 30 s eliges el tramo, escuchándolo, antes de generar nada |
| más grande o más largo | no se carga en memoria: eliges desde dónde y la app escucha hasta 30 s a su velocidad |
| vídeo sin sonido | «Ese vídeo no tiene sonido…» y vuelve a las dos opciones |
| formato que el navegador no abre | lo dice y propone un vídeo de la cámara o m4a, mp3, wav |
| dos archivos seguidos | gana el último; el anterior se abandona aunque estuviera a medias |

**Segunda vez**: Inicio muestra «Al terminar de trabajar / Lluvia en la ventana / ▶ Escuchar 5 min». Un toque y suena. «Crear otro
paisaje» sigue debajo. «Volver aquí» (preescucha o final de sesión) guarda sin duplicar; el momento es opcional.

**Postal sonora** («Postal sonora» en la preescucha, «Crear postal sonora» al terminar): 15 s en un WAV estéreo.

- Unos 3 s de tu grabación (el instante conservado si lo hay; menos si la fuente es corta), 2 s en los que sigue oyéndose mientras
  entra el paisaje, y el resto de paisaje renderizado por el motor de sesión con los ajustes en pantalla. Entrada y salida suaves.
- Se genera una vez. El botón de escucha reproduce esos mismos bytes. Cambiar el título solo cambia el nombre del archivo.
- «Compartir» aparece solo si el sistema acepta ese archivo (`navigator.canShare`) y abre el menú nativo desde ese toque. «Guardar
  audio» está siempre. Cancelar el menú deja la postal donde estaba y no dice que se haya enviado.
- Solo sale ese audio: ni el vídeo, ni la grabación completa, ni rutas, ni ubicación; el archivo no lleva metadatos.
- No se ofrece para el río a dos tomas.

## Demo enlazable y tomas reales

- Enlace público: `…/resona/?demo=1` (también `#demo`). Abre la demo lista para sonar; nada suena hasta tocar. Solo enseña contenido
  público, nunca un paisaje de la biblioteca.
- **Para activar la edición del Pallars**: copia `demo.ejemplo.json` como `demo.json` junto a `index.html`, pon `demo/rio.m4a` y
  `demo/botella.m4a` (una o dos tomas) y escribe el nombre del lugar en `place`. Entonces la demo se titula con el lugar, alterna el
  original y su meditación y termina en «Crear con un vídeo de mi viaje».
- Sin `demo.json` la demo usa una resonancia de vidrio sintetizada en el dispositivo, rotulada así, y no menciona ningún lugar.
  No hay tomas reales en el repositorio.

## Qué se ha verificado

Navegador integrado de Claude (Chromium de escritorio, macOS), 375×812, bajo `/resona/`, con almacenamiento vacío y datos de prueba
borrados al acabar. Material: señales sintéticas y tres vídeos WebM (VP8 + Opus) generados en el propio navegador.

| Prueba | Resultado |
|---|---|
| Primera visita | demo sin petición de micrófono (0 llamadas), nada guardado; parar, repetir y saltar funcionan; original y paisaje nunca suenan a la vez y quedan a 3 dB |
| De la demo a mi toma | al elegir un vídeo desaparecen título, nota y cifra de la demo |
| Vídeo con pista conocida (300 Hz) | «lluvia en la ventana», lectura 300 Hz, «Empezar 5 min de Calma» |
| Vídeo sin audio | mensaje preciso, vuelve a las dos opciones, biblioteca intacta |
| Dos vídeos seguidos (300 y 440 Hz) | queda el segundo: 440 Hz; el primero no deja entrada |
| Ruta de archivo grande (forzada) | elige tramo → escucha en tiempo real → 300 Hz |
| Cancelar en «Elige el tramo» | vuelve a Inicio y conserva lo anterior |
| Audio de 42 s | propone sus 30 s más sonoros antes de generar |
| Después, grabar | el micrófono se pide solo entonces (el entorno lo bloquea y la app lo explica) |
| Entrada tonal / ruido | 230 y 234 Hz distintos; ruido «Sin tono estable» (de la entrega anterior, sigue en verde) |
| Retorno | guardar con momento, recargar, un toque: suena sin pregunta, mismos ajustes, sin duplicados |
| Postal desde el recorrido real | 15,00 s, estéreo 48 kHz, pico 0,89, sonido al inicio, en la transición y al final, últimos 50 ms en silencio; mismos bytes en preescucha y exportación (SHA-256 igual); solo partes `fmt` y `data`; nombre `postal-el-rio-de-la-avia-llavorsi.wav` |
| Compartir | éxito y cancelación simulados (la app no afirma envío al cancelar); sin Web Share solo queda «Guardar audio»; nada se envió a nadie |
| `?demo=1` | abre «Así funciona» sin sonar y sin mencionar el Pallars |

Postal de prueba (material sintético): `postal-de-prueba-sintetica.wav`, junto a la página en la copia local.

## Límites

- **Nadie ha escuchado nada**: todo es análisis de señal y estado de la app.
- **iPhone y Safari**: sin probar. En particular: vídeos MOV/MP4 (H.264 o HEVC con AAC) de la cámara, el selector nativo del carrete,
  la extracción en tiempo real de archivos grandes, el menú de compartir con un WAV y el arranque con un toque.
- **Pantalla bloqueada**: en Safari el audio web se detiene al bloquear; la app lo anota como corte al volver. Solo simulado.
- **Web Share**: este navegador de escritorio no lo tiene; el camino real del menú nativo no se ha ejecutado.
- **Pestaña en segundo plano**: el navegador ralentiza los temporizadores y preparar un paisaje pasa de 1 s a más de 30 s.
- **WAV**: 2,7 MB por postal; algunas apps de mensajería lo envían como documento y no como nota de audio.
- **Lector de pantalla y «reducir movimiento»**: botones reales con nombre; no probado con VoiceOver.
