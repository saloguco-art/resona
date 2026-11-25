# Movimiento suave · rama local `movimiento-suave` (sin publicar)

Versión de trabajo del 25 de noviembre de 2026. La web publicada (`main`) no se ha tocado.

## Cómo abrirla

- Página: `index.html` de esta rama (fuente en `src/app.html`, se construye con `sh src/build.sh`).
- En local: `python3 -m http.server 8765` en la carpeta y abrir `http://localhost:8765/`.
- `?prueba=1` muestra «Comparar a ciegas» en la pantalla «Tu paisaje». `?lab=1` carga además la red (YAMNet).
- Versión inicial para comparar: abrir `baseline/` (la app exacta de antes de estos cambios, fuente en `src/baseline/app-anterior.html`;
  `sh src/build.sh` no la toca). Dentro de la app, «Movimiento: Estable» es ese mismo motor.

## Qué hay nuevo

**Movimiento (solo en Calma), Estable / Suave.** Suave es un director lento sobre el mismo paisaje. Alterna, con el
reloj de audio y fundidos de 3–8 s, cuatro tramos de 14–34 s:

| Tramo | Qué se oye |
|---|---|
| sostener | el paisaje, con menos grave fijo |
| voz | entra una sola voz superior: una nota hecha con la resonancia del propio sonido (unísono, segunda, tercera o quinta de su nota) |
| color | sin nota añadida: cambian brillo y densidad |
| aire | el acompañamiento se retira y queda la grabación (o su ambiente) sola |

Reglas de la voz: una como máximo, pasos cortos o vuelta a la nota que el paisaje ya tiene, nunca más de dos subidas
seguidas, y cada frase empieza en una nota distinta de la anterior. La secuencia sale de la semilla del paisaje, así
que el mismo paisaje evoluciona igual al recuperarlo. Los primeros 60 s siempre incluyen un cambio y un tramo «aire».
No se acumulan nodos: cada voz se detiene tras su fundido. Es una decisión de composición por validar, no un efecto demostrado.

**Tratamiento por fuente** (reglas del motor; con `?lab=1` decide la red y las reglas quedan de reserva):

| Fuente | Fondo | Original | Nota añadida en Suave |
|---|---|---|---|
| golpe con cola (taza, madera) | estirado de la cola | el ataque vuelve intacto | sí, si la cola tiene altura fiable (confianza tonal ≥ 0,30) |
| agua, lluvia, viento, gotas | fragmentos solapados de la propia grabación, sin afinar | tramos largos tal cual | no |
| instante conservado (cualquier fuente) | se hace con el resto | el instante vuelve entero y el fondo baja a la mitad mientras suena | según la fuente |
| saturada o casi inaudible | motor estable | — | no; se propone volver a grabar |
| silencio | no se crea paisaje | — | — |

Qué decide la red y qué las reglas: sin `?lab=1` **todo** lo deciden reglas (sostén, ataques, confianza tonal). Las
reglas no reconocen una voz: para una voz, quien decide es la persona con «Conservar este instante». Con `?lab=1` la
red decide voz / agua / percusión y el Diagnóstico indica en cada línea quién decidió.

**Conservar este instante** (pantalla «Tu paisaje», opcional). Marca inicio y fin arrastrando o con los botones
Inicio −/+ y Fin −/+, escucha la selección, corrige o quita. Se guardan solo los límites (segundos) como metadato; la
grabación no se altera. Al restaurar se validan los rangos. Conserva el tramo entero: no separa voces.

**Modos.** Calma: indicación «Escucha un detalle de tu grabación. Cuando te distraigas, vuelve a él», ocultable y
recordada. Foco: el instante conservado no reaparece entero (solo trozos breves del resto) hasta que se recupere en
ajustes. Sueño: fundido ligado al temporizador (último 25 %, máximo 2 min), sin campana, sin valoración, la pantalla
queda oscura; «Orbe: Oscuro» la oscurece también durante la sesión. Sin límite no hay fundido.

**Registro local.** Cada sesión anota cómo acabó (`end`: `timer` o `manual`), cuántas veces se cortó el audio desde
fuera (`it`), si iba con Movimiento suave (`mv`) y con instante conservado (`mk`). Nada sale del dispositivo.

**Salida.** Limitador rápido tras el control de volumen: un golpe entero a volumen máximo ya no puede saturar.

## Comparación a ciegas (`?prueba=1`)

Tres condiciones con la misma grabación, nombres ocultos, orden que rota entre respuestas guardadas:
original en bucle con fundido discreto · motor anterior (Estable) · motor con Movimiento suave. Los dos motores
comparten síntesis, presencia del original e instante conservado: solo cambia el movimiento. El volumen se iguala por
sonoridad ponderada A (corrección máxima +5 dB). Respuestas: 1, 2, 3, «Sin preferencia», «Ninguna». Se guardan en este
dispositivo (`resona.ab`, `kind: "mov"`) y «Copiar resultados» las exporta sin grabaciones ni nombres.

Desajuste documentado: «motor anterior» es el motor sin movimiento **con el tratamiento por fuente nuevo**. La versión
publicada afinaba también el agua; para oír esa diferencia hay que abrir `baseline/`.

Ejemplos reproducibles (sintéticos, generados en la app): «madera» (tonal con golpe), «agua» (gotas, ambiente),
«voz» (vocal sostenida sintética, no es una voz real).

## Pruebas ejecutadas (25 nov 2026)

Navegador integrado de Claude (Chromium, macOS), 375×812, servidor local. Automatizadas: nadie ha escuchado.

| Prueba | Resultado |
|---|---|
| Sesión de 5 min, Suave, «madera», volumen máximo | 15 tramos; la voz sonó en 0,2,4,0,2,0,2 (grados); 3 tramos «aire»; pico de salida 0,61 (sin saturar); sin NaN; fin por temporizador anotado |
| «agua» | perfil agua por regla, sin nota; tramos sostener / color / aire |
| «voz» sintética + instante 1,0–2,2 s | vuelve intacta; fondo con el resto; persiste al reabrir desde la biblioteca junto con movimiento, presencia y semilla |
| Cambio Calma → Foco → Calma en reproducción | sin reinicio, el tiempo sigue; la voz superior se retira y vuelve |
| Estable ↔ Suave en reproducción | gradual |
| Paisaje anterior sin atributos nuevos | motor de entonces, Estable; datos originales intactos |
| Clip de 0,4 s | paisaje creado; instante válido de 0,15 s; límites acotados |
| Silencio y casi silencio | sin paisaje, aviso, nada guardado |
| Saturación | motor estable, sin nota, aviso para volver a grabar |
| Sueño con temporizador de 1 min | ganancia 0,9 → 0 en los últimos 15 s; acaba sola, sin valoración |
| Corte externo del audio (suspensión simulada) | anotado; el tiempo se congela y sigue al reanudar |
| Comparación a ciegas | flujo completo; original y motor quedaron a 2,4 dB tras igualar |
| Ruta `/resona/` | carga y red correctas; todas las peticiones al mismo origen |
| Tiempo hasta poder escuchar | 1,0–1,2 s con la voz superior (antes 0,4–0,9 s) |

## Sin verificar o limitado

- **Escucha humana**: ninguna. Niveles y estructura medidos; si el cambio musical tiene sentido lo dirá el oído.
- **iPhone físico y Safari**: no probado. Tampoco el bloqueo de pantalla: en Safari el audio web se detiene al bloquear;
  la app lo anota como corte al volver, pero ese camino solo se ha simulado.
- **Voz real, río real, taza real, micrófono**: no probados; los tres ejemplos son sintéticos.
- **Estéreo**: los archivos importados se mezclan a mono para analizar y para las reapariciones; el paisaje sí es estéreo.
- **Pestaña en segundo plano**: el navegador ralentiza los temporizadores y los tramos se alargan.
- No se añadió Signalsmith Stretch: la voz superior se transpone por velocidad de un colchón de una sola nota, sin dependencia nueva.
