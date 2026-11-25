# Laboratorio: ¿mejora una red neuronal el paisaje?

Rama de trabajo `lab-neuronal`. La versión publicada (`main`) no cambia. El laboratorio solo se activa con `?lab=1`; sin ese parámetro la app se comporta como la publicada.

## Probarlo

```bash
python3 -m http.server 8765
```

Abrir `http://localhost:8765/index.html?lab=1`. Para salir del laboratorio: `?lab=0`. Para simular que faltan los pesos: `?lab=1&nomodel=1`.

Reconstruir tras editar `src/app.html`:

```bash
sh src/build.sh
```

## Comparar con una grabación propia

1. Graba o importa un sonido. Tras «Reconociendo qué suena…» llegas a «Tu paisaje» y debajo del control de presencia aparece lo reconocido.
2. Pulsa **Comparar a ciegas**. Las versiones 1 y 2 usan la misma fuente, intención y duración; el orden es aleatorio y oculto. «Original» está aparte.
3. Escucha las dos (al menos unos segundos cada una), responde cuál prefieres y en cuál reconoces mejor tu sonido, y guarda. Entonces se revela cuál era cuál.
4. **Comparar sin la red** repite la prueba entre la síntesis nueva con red y la misma síntesis decidida solo por reglas.
5. **Diagnóstico** muestra si hubo inferencia real, tiempos, tamaño, puntuaciones por ventana, quién tomó cada decisión y las respuestas guardadas. «Copiar resultados» las exporta.
6. Si el perfil es voz, **Marcar lo que reaparece** abre la onda para corregir a mano la sílaba, risa o frase que vuelve intacta.

## Tres variantes

| | Qué es |
|---|---|
| A | Motor actual, sin tocar |
| B | Experimental: YAMNet + reglas eligen un perfil y cada perfil se sintetiza distinto |
| C | La misma síntesis nueva con el clasificador apagado (solo reglas) |

## Qué decide la red y qué deciden las reglas

**La red (YAMNet vía MediaPipe Tasks Audio, en el dispositivo, copia mono a 16 kHz):**
- Estima, cada ~0,49 s, la presencia de voz, de agua o ambiente continuo y de percusión breve (521 etiquetas de AudioSet agrupadas; el resto es «desconocido»).
- Decide que hay voz. Ninguna regla actual distingue una voz.
- Confirma agua o golpe cuando los reconoce, y veta que una regla trate una voz como agua.
- Sitúa el tramo donde la voz es más segura, que sirve de centro para la marca automática.

**Las reglas (analizador actual):**
- Suavizan las puntuaciones entre ventanas vecinas y las ponderan por lo que suena en cada una.
- Rebajan «agua» según la confianza tonal y «percusión» según el sostén.
- Cuando la red no reconoce el sonido y no oye voz, deciden golpe (breve, con ataque) o agua (continuo, sin altura estable).
- Localizan el ataque del golpe y los bordes exactos de la marca de voz.
- Con confianza insuficiente dejan el motor actual.

**Qué cambia de forma audible:**
- **Voz:** el tramo marcado reaparece intacto, a su altura, sin ecos y de uno en uno (el control «Presencia del original» lo gobierna; a cero no reaparece). El fondo se hace con el resto de la grabación.
- **Agua o ambiente:** fragmentos solapados de la propia grabación, sin máscara armónica, sin bajo fijo, sin campanas ni nota guía.
- **Golpe:** el ataque vuelve reconocible y el fondo se estira solo a partir de la resonancia posterior.
- **Voz con agua:** la voz reaparece y el fondo no se afina.

No es separación de fuentes y no reconoce personas ni emociones.

## Qué se ha aplicado del artículo DDSP (Engel et al., ICLR 2020)

Leído completo. Su tesis: no generar la onda muestra a muestra, sino dejar que unos pocos controles interpretables gobiernen un sintetizador clásico. Tres cosas se han llevado a la app, sin entrenar ninguna red:

- **Modelo armónico + ruido (§3.1–3.5).** Para una voz sola, el fondo ya no es un estirado espectral: se mide la altura de la voz cuadro a cuadro, el reparto de energía entre sus 30 primeros armónicos y el ruido que queda entre ellos, y se vuelve a sintetizar con un banco de osciladores más ruido filtrado. Altura, volumen y timbre quedan separados (ec. 3), así que la voz se sostiene medio minuto a su propia altura. Los controles cambian cada 64 muestras y se interpolan, como en §3.3, para que no haya escalones.
- **La altura como control libre (§5.2).** Una voz aguda se baja una octava, y otra más en Sueño, igual que el artículo transporta un violín fuera de su registro.
- **Medidas (§4.2.1 y B.1).** La comparación a ciegas iguala las dos versiones por sonoridad con ponderación A, no por RMS. El diagnóstico muestra una distancia espectral multi-escala al original (seis tamaños de ventana, lineal y logarítmica), adaptada a espectros medios porque un paisaje no está alineado en el tiempo con su fuente.

Lo que no se ha aplicado, y por qué: el decodificador neuronal que predice esos controles, la de-reverberación y la transferencia de timbre exigen entrenar con un conjunto de datos. Aquí los controles se miden de la propia grabación, que es justo el enfoque «análisis/síntesis» clásico que el artículo toma como punto de partida.

Hay una tercera comparación a ciegas, **armónico / estirado**: la misma voz y la misma marca, con el fondo nuevo y con el anterior. Si la voz no tiene altura estable en al menos un 20 % del tiempo, o va mezclada con agua, se usa el fondo anterior y el diagnóstico lo dice.

Probado con la voz sintetizada: altura mediana 180 Hz, 74 % sonoro, 0,5 s hasta poder escuchar, sin errores; distancia al original 0,96 frente a 1,04 del estirado. Esa cifra mide parecido de color, no si suena mejor.

## Pruebas ejecutadas

Todas en un único entorno: navegador integrado de la app de Claude (Chromium 156) en macOS, ventana a 375 × 812, servidor local. Ninguna en iPhone.

| Clip | Origen | Red | Decisión B | Sin la red (C) |
|---|---|---|---|---|
| Voz, 4,8 s | Síntesis de voz de macOS (`say`) | Speech en 9/9 ventanas, 0,97 | voz | agua (error de las reglas) |
| Voz sobre lluvia, 8 s | `say` + lluvia sintética | Speech 0,2–0,4 en el tramo hablado | voz con fondo sin afinar | agua |
| Lluvia, 12 s | Sintética | No la reconoce («Wild animals») | agua, por regla | agua |
| Golpe, 0,6 s útiles | Sintético | No lo reconoce («Music») | golpe, por regla | golpe |
| Pop | Sonido del sistema macOS | «Plop» | golpe, red + reglas | golpe |
| Tink | Sonido del sistema macOS | «Telephone» | motor actual | motor actual |
| Silencio, 3 s | Sintético | no llega a analizarse | vuelve al inicio con aviso para repetir | igual |
| Clip de 0,5 s | Sintético | 1 ventana | golpe, por regla | golpe |

También verificado:
- Modelo ausente (`nomodel=1`): el diagnóstico dice «ALTERNATIVA por reglas», el original se escucha y el paisaje se genera.
- Comparación a ciegas completa: orden aleatorio, respuesta guardada, revelado, y el paisaje sigue con la versión preferida.
- Comparación de diagnóstico (B contra C) disponible cuando difieren; cuando coinciden lo dice y no pide respuesta.
- Marca manual de voz: se abre, se corrige y el fondo se rehace.
- Dos sesiones seguidas: guardar, volver al inicio y reabrir desde la biblioteca recupera perfil, marca y semilla.

Mediciones en ese mismo entorno:
- Tamaño: runtime 21,3 MB + pesos 3,9 MB sin comprimir. Con gzip serían unos 7,0 MB + 3,2 MB (calculado sobre los ficheros; no medido en red real).
- Carga del modelo: 60–105 ms. Inferencia: 58 ms para 4,8 s, 118 ms para 12 s. Bloqueo más largo de la interfaz: 40 ms.
- Tiempo desde importar hasta poder escuchar: 400–930 ms.
- Carga caliente frente a fría: no medible con este servidor local, que no cachea.
- Sesión de 5 minutos (perfil agua, intención Calma): 313 s vigilados cada segundo; el audio no se detuvo ni se suspendió ninguna vez, sin valores inválidos, nivel entre 0,013 y 0,077 RMS siguiendo la respiración, y la sesión cerró sola en la pantalla final con 5,3 min anotados. Sin errores en consola.

## Pendiente (no ejecutado)

- **iPhone físico con Safari.** Pasos: servir esta rama por HTTPS bajo `/resona/` (el micrófono lo exige), abrir `…/resona/?lab=1`, grabar una voz, lluvia real y un golpe, y anotar del Diagnóstico: inferencia real o alternativa, carga del modelo en la primera visita y en la segunda, inferencia, bloqueo más largo y tiempo hasta escuchar. Después, una sesión de 5 minutos con la pantalla encendida comprobando que no hay cortes.
- **Grabación con micrófono** en el laboratorio: el camino de código es el mismo que el de importar a partir de las muestras, pero no se ha grabado nada real.
- **Lluvia y golpes reales.** Las muestras sintéticas no son reconocidas por YAMNet, así que la aportación de la red en agua y percusión está sin comprobar.
- **Calidad sonora.** Nadie ha escuchado todavía las variantes; para eso está la comparación a ciegas.

## Licencias

Ver `vendor/NOTICE.md`. MediaPipe Tasks Audio 1.2.3 y los pesos de YAMNet son Apache-2.0; las etiquetas de AudioSet, CC BY 4.0. Se sirven sin modificar desde el mismo origen.

## Siguiente experimento: un controlador pequeño

Con las comparaciones voluntarias guardadas (preferencia, reconocimiento, motivo, perfil, semilla y ajustes), entrenar un modelo pequeño —unos miles de parámetros sobre los embeddings de 1024 dimensiones de YAMNet más las medidas del analizador— que proponga tres números: cuánto estirar, cuánta presencia del original y cada cuánto reaparece. El objetivo sería predecir qué versión de un par prefiere quien escucha (pérdida por pares, tipo Bradley-Terry), no reconstruir audio. Como en DDSP, la red solo ajustaría controles interpretables de un sintetizador que ya existe, de modo que cada propuesta se puede leer, limitar y corregir a mano. La evaluación se haría con grabaciones separadas por fuente y por persona: ninguna persona ni ningún sonido de evaluación aparece en entrenamiento, y se compara contra los valores fijos actuales en escucha a ciegas. Los audios no salen del dispositivo; solo se compartirían, con consentimiento, los vectores y las respuestas.
