# Objetos, tarareo y río a dos tomas · rama local `movimiento-suave` (sin publicar)

Trabajo del 25 de noviembre de 2026. La web publicada (`main`) no se ha tocado; no hay push.

## Referencia del motor inicial

- Revisión: etiqueta git `motor-inicial-2026-11-25` (commit `e8edfcd`, la rama tal como estaba antes de este trabajo).
- Dentro de la app el motor inicial sigue vivo como variante `I`: la decisión que tomaba el motor antes de este trabajo, con su
  misma síntesis. La prueba de escucha lo renderiza con las mismas opciones que el nuevo (Calma, sesión de 5 min, semilla
  20261126, Movimiento estable, presencia 0 % o 45 %).

## Por qué dos grabaciones distintas acababan pareciéndose (comprobado en código y en audio renderizado)

Medido con dos impactos sintéticos de resonancias conocidas, en el tramo 0:55–1:16 de la salida del motor y sin reapariciones del original:

| Causa en el motor inicial | Evidencia |
|---|---|
| El análisis reduce la toma a **una nota** y afina todo el paisaje a ella | `analyze()` devuelve un solo `rootHz` |
| Una máscara de **grados fijos** (fundamental, 2ª, 3ª, 5ª, 6ª) deja pasar esas notas y atenúa lo demás 31 dB | los parciales superiores de la toma quedan 11–28 dB más bajos de lo que estaban; aparecen quintas que el objeto no tiene (715, 773, 1553 Hz) |
| Las octavas superiores se **pliegan hacia abajo** y hay un **bajo fijo** de senos en la fundamental | 47 % y 70 % de la energía por debajo de 300 Hz, donde las tomas no tienen nada |
| El equilibrio entre octavas se lleva a un **objetivo fijo** por intención | mismo reparto de graves y agudos para cualquier fuente |
| Un filtro paso bajo (900–3400 Hz; 380–1100 en Sueño) | los parciales por encima desaparecen |

No resultó ser la causa: la limpieza conserva la cola hasta que cae unos 30 dB bajo el máximo, más 0,24 s (las caídas sintéticas se recuperan enteras), y la mezcla no tapa el original.

## 1 · Objetos

- **Análisis** (`resAnalyze`): elige un golpe utilizable (el seguido del tramo limpio más largo; los ataques se buscan en el brillo de
  la señal, así que un segundo golpe se ve aunque el primero siga sonando), separa ataque y cola, y sigue los picos que persisten de
  una ventana a la siguiente. De cada resonancia guarda frecuencia (sin redondear a ninguna escala), nivel relativo, tiempo de caída y
  fiabilidad. Trabaja a la frecuencia de muestreo real. Acepta entre 0 y 6; no inventa ninguna.
- **Síntesis** (`renderObj`): el color de la cola real estirado tal cual (sin escala, sin plegar octavas, sin equilibrio prefijado)
  más una voz suave por resonancia, a su frecuencia medida. Cada voz crece y se retira a su ritmo, así que se turnan. Sin bajo fijo,
  sin campanas, sin doblar una octava por debajo, y el filtro nunca baja de 1,6 veces la resonancia más aguda.
- El ataque vuelve intacto de vez en cuando (depende de «Presencia del original»); el paisaje se distingue aunque se silencie.
- Golpe seco: ninguna resonancia → conserva su color percusivo, sin nota impuesta. Sin sonido: no se crea paisaje y se propone repetir.
- Se activa al elegir «Con guía: objeto» y también solo, cuando una toma normal tiene un golpe y al menos dos resonancias fiables.
  No adivina materiales ni si una botella está llena, y no mira el nombre del archivo.

## 2 · Tarareo

- **Análisis** (`humAnalyze`): altura cada 10 ms con su confianza (el mismo detector por autocorrelación del modelo armónico), notas
  por tramos estables, pausas, y corrección de saltos de octava aislados sin tocar los sostenidos. El vibrato queda dentro de la nota.
- **Motivo**: las notas con sus intervalos exactos (solo se traslada por octavas enteras a 196–392 Hz), sus duraciones y pausas, vez y
  media más lento. Se repite con 5–14 s de espacio según la semilla. Sin deducir escala.
- Suena por un canal propio: bajar a cero «Presencia del original» no lo apaga. El fondo es un colchón en la nota más sostenida.
- Nota única: conserva su contorno de intensidad. Habla, ruido o altura incierta: paisaje de textura y aviso para repetir.
- Solo se activa si la persona elige «Con guía: tarareo».

## 3 · Río a dos tomas

- «Con guía: río a dos tomas»: se importan «Orilla» y, si se tiene, «Bajo el agua». Con una sola se puede escuchar y añadir la otra después.
- Un control «Orilla ↔ Bajo el agua» (tacto y teclado) con fundido de potencia constante; en cada extremo queda exactamente una toma.
  La posición se guarda. «Recorrido lento» cruza solo cada 50 s y se detiene en cuanto se toca el control.
- Solo agua: sin colchón, campanas, bajo ni nota. Se conserva el estéreo; cada toma hace su propio bucle con fundido y se iguala de nivel.
- Admite distinta duración, nivel, frecuencia de muestreo y número de canales. Un archivo ilegible o mudo no cambia nada.
- Demostración: botón «Muestras sintéticas de prueba» (ruido generado en la app; no es ningún lugar real).

## Prueba de escucha

Abrir la app con `?eval=1` (o el enlace «Prueba de escucha» del inicio con `?prueba=1`).

1. Elige dos archivos y «Preparar las cuatro meditaciones»: A y B, cada una con motor inicial y motor nuevo.
2. Escucha las dos referencias. Después, en cada meditación sin nombre, pulsa «▶ 00:55» y responde A / B / No lo sé.
3. Responde «¿Con cuál te quedarías para meditar?» y pulsa «Ver el resultado»: correspondencias y aciertos por motor.

Cada meditación son 78 s renderizados por adelantado con el motor de la app, así que saltar a 00:55 da siempre lo mismo. La mezcla
por defecto no tiene reapariciones literales de la grabación; «Mezcla normal» las incluye. Las cuatro se igualan por sonoridad
ponderada A con pico ≤ 0,89. Sin nombres de archivo, formas de onda ni orbe.

No igualado: el motor nuevo usa otra síntesis y no dobla a la octava; ambos van con Movimiento estable (el motor nuevo usaría Suave por
defecto en una sesión normal). Cuatro respuestas de una persona no miden nada.

**Prueba física**: misma botella, mismo sitio, mismo móvil a un palmo, mismo gesto (un toque suave con el nudillo o una cuchara de
madera, y dejar que termine de sonar). Graba primero vacía y después llena hasta la mitad. Importa las dos tomas en la prueba.

## Pruebas ejecutadas

`node src/tests/run.js` — 58 comprobaciones sobre el analizador y los renderizadores de producción, **todas con señales sintéticas**:

- Objetos: dos impactos con parciales inarmónicos (520/1432/2790/4410 Hz y 388/1127/2415 Hz). Frecuencias recuperadas a menos de
  0,3 Hz (ventana de 4096 muestras, 11,7 Hz por banda; tolerancia fijada en un cuarto de banda), caídas a menos del 25 %, ninguna
  inventada. En el paisaje nuevo los picos más fuertes son las resonancias de su toma y ninguna de la otra; el balance entre parciales
  se aparta 3–4 dB del original (11–28 dB en el inicial). Golpe seco, silencio, golpe repetido (4 ataques) y una sola resonancia.
- Tarareo: dos contornos opuestos con silencio. Intervalos 0 +4 +7 +4 0 y 0 −3 −7 −3 0 a menos de 0,35 semitonos, una pausa. Con la
  misma semilla los silencios entre apariciones son idénticos. Nota sostenida, vibrato con salto de octava, ruido y remedo de habla.
- Río: extremos exactos, potencia constante, dos tomas de 2 y 1 canales a 44,1 y 48 kHz con 34 dB de diferencia igualadas, bucle sin salto.
- Saturación: un tono limpio no se toma por saturado.

En el navegador integrado de Claude (Chromium, macOS, 375×812), con archivos WAV sintéticos importados por el selector de la app:

| Prueba | Resultado |
|---|---|
| Objeto importado a 44,1 kHz | 4 resonancias; se reabre igual desde la biblioteca |
| Salida del motor, 0:55–1:16, sin reapariciones | distancia A–B 20 dB (inicial 13 dB); energía bajo 300 Hz 23–27 % antes de quitar el doblaje a la octava |
| Cinco minutos seguidos (render del motor real, Suave, presencia 45 %) | finito, pico 0,58, sonoridad estable minuto a minuto |
| Pausa y reanudación, dos sesiones seguidas | el tiempo se congela y sigue |
| Tarareo con presencia 0 %, salida del motor | entran 221→278→330→278→221 Hz y 330→278→221→278→330 Hz |
| Río | ganancias 1/0, 0,707/0,707, 0/1; posición guardada y restaurada; sustituir una toma sin perder la otra; archivo roto y mudo rechazados; una sola toma y añadir después |
| Prueba de escucha | 18 s en preparar; salto a 00:55 exacto; respuesta bloqueada hasta oír el tramo tardío; resultado por motor |
| Ruta `/resona/` | página, iconos, manifiesto y pesos responden (comprobado por HTTP) |

Fallos heredados corregidos de paso: una voz hablada se trataba como agua; un tono limpio y sostenido se daba por saturado al reabrirlo.

## Sin validar

- **Escucha humana**: ninguna. El resultado perceptivo está pendiente aunque las pruebas técnicas estén en verde.
- **Botellas, voz y río reales**: no hay tomas en el repositorio. Todo el material de prueba es sintético y generado aquí.
- **iPhone y Safari**: no probado. En particular el render adelantado (OfflineAudioContext) y la memoria de la prueba de escucha
  (unos 60 MB por mezcla) solo se han ejecutado en Chromium de escritorio.
- **Micrófono**: la captura con guía se ha probado importando archivos, no grabando.
- Los tiempos de caída medidos todavía no gobiernan la síntesis: las voces de cada resonancia siguen un vaivén propio, no su caída real.
- La página pide las tipografías a Google Fonts (ya lo hacía); ningún audio, nombre ni resultado sale del dispositivo.
