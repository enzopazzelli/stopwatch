# IA-USO.md

## Modelo utilizado

**Claude (Anthropic)** para todo el desarrollo.

---

## Cómo usé la IA

Trabajé con **dos chats de Claude en paralelo**:

1. **Chat de planificación:** Donde analicé los requisitos de la prueba técnica, revisé la página de referencia (online-stopwatch.com), y fui armando los prompts antes de mandarlos. Básicamente lo usé para pensar en voz alta, definir qué pedirle a la IA y cómo pedirlo bien.
2. **Chat de desarrollo:** Donde mandé los prompts finales y la IA generó el código. Acá es donde se hicieron las iteraciones que documento abajo.

El proceso fue iterativo: arranqué con un prompt grande que definía todo lo que necesitaba, probé el resultado, y fui pidiendo ajustes puntuales. No copié y pegué a ciegas — revisé cada respuesta, la probé en el navegador, y cuando algo no me convencía lo pedí de otra forma o lo corregí yo.

---

## Prompts y respuestas

### Prompt 1 — La base del proyecto

> Necesito crear un cronómetro (stopwatch) en HTML, CSS y JavaScript puro, sin frameworks ni librerías. Tiene que funcionar parecido al de online-stopwatch.com — no busco una copia exacta del diseño, sino que tenga la misma lógica y funcionalidad.
>
> Necesito que tenga dos modos:
>
> **Stopwatch (cronómetro hacia arriba):**
> - Display del tiempo con formato MM:SS.ms (o similar, que se vean los milisegundos)
> - Botones de Start, Stop y Reset con un flujo lógico (que no puedas darle Start si ya está corriendo, que Reset limpie todo, etc.)
> - Función de Lap/vuelta: que al apretar un botón se guarde el tiempo parcial y se muestre en una lista abajo
>
> **Countdown (cuenta regresiva):**
> - Un input donde pueda escribir el tiempo en segundos (por ejemplo, si pongo 100 se tiene que formatear y mostrar como 01:40.00)
> - Botones de Start, Pause y Reset
> - Cuando llegue a 00:00.00 que muestre alguna alerta visual o sonido, algo que avise que terminó
>
> Quiero que se pueda cambiar entre los dos modos con tabs o botones bien claros, tipo el diseño de la página original que tiene la flecha verde para arriba (Stopwatch) y la flecha roja para abajo (Countdown).
>
> Quiero tres archivos separados: `index.html`, `styles.css` y `script.js`. Que el HTML linkee al CSS y al JS correctamente, y que pueda abrir el `index.html` directo en el navegador sin necesidad de servidor ni instalación.
>
> Para el diseño, pensá en algo moderno y minimalista: fondo oscuro, tipografía mono para el display del tiempo, botones con buen contraste y alguna transición suave en hover/click. Que se sienta prolijo.
>
> Una cosa importante: el timer tiene que ser preciso. Usá `performance.now()` o `Date.now()` para calcular el tiempo real transcurrido, no confíes solo en el intervalo de setInterval porque se desfasa.
>
> Explicame brevemente en comentarios dentro del código las decisiones que tomaste, especialmente en la lógica del cronómetro, el countdown y el manejo de estados (corriendo, pausado, reseteado).

**¿Qué me dio?** Los tres archivos funcionando: HTML con tabs para los dos modos, CSS oscuro con tipografía mono, y un JS con toda la lógica. El stopwatch tenía Start/Stop/Lap/Reset con estados (`idle` → `running` → `paused`), y el countdown tenía preview en tiempo real del input (escribís `100` y ves `→ 01:40.00`), alerta visual con parpadeo, y un beep hecho con Web Audio API — eso último estuvo bueno, yo habría puesto un `alert()`.

---

### Prompt 2 — Limpiar el código

> El código funciona bien, pero quiero simplificarlo un poco sin perder funcionalidad ni precisión. Algunas cosas puntuales:
>
> - Unificá la lógica del Stopwatch y el Countdown en lo que se pueda. Por ejemplo, ambos usan el mismo patrón de start/pause/reset con `performance.now()` y `setInterval`. Se podría hacer una función reutilizable tipo `createTimer()` que maneje eso y evite repetir código.
> - El `formatTime()` está bien, no lo toques.
> - Sacá comentarios que sean obvios (tipo `// Crear elemento de lap`) y dejá solo los que explican decisiones o lógica no evidente.
> - Los nombres de variables como `swState`, `cdState`, `swElapsed`, `cdRemainingMs` están bien, no los cambies por nombres genéricos.
> - Que siga funcionando exactamente igual, solo quiero que el código sea más limpio y fácil de leer.

**¿Qué me dio?** Creó `createTimer(onTick)` que encapsula todo el patrón de `performance.now()` + `setInterval` y expone `start()`, `pause()`, `stop()` y `currentDelta()`. Ahora cada modo solo define qué hacer con el delta: el stopwatch suma (`swElapsed + delta`) y el countdown resta (`cdRemainingMs - delta`). Sacó los comentarios obvios y los banners decorativos. El archivo pasó de **368 a 230 líneas** — mismo resultado, menos ruido.

---

### Prompt 3 — Bug del Reset en Countdown

> Necesito poder reiniciar una vez que termine el contador.

**¿Qué me dio?** Un fix de una sola línea. El problema era que después de terminar el countdown, el botón Reset quedaba deshabilitado porque la condición `cdState === 'idle' && cdRemainingMs === 0` coincidía con el estado "limpio" inicial. Agregó un chequeo extra: si la alerta está visible (o sea, el countdown terminó), el Reset sigue habilitado.

---

## Respuesta que acepté tal cual

**El manejo de precisión con `performance.now()`.**

La IA propuso medir el tiempo con `performance.now()` calculando el delta real entre timestamps, en vez de acumular milisegundos dentro del `setInterval`. Lo acepté porque es la forma correcta — `setInterval` no garantiza ejecución exacta cada 10ms, se desfasa con la carga del sistema o en tabs inactivas. El intervalo solo sirve para repintar el display.

```javascript
const now = performance.now();
const total = swElapsed + (now - swStartTime);
```

---

## Respuesta que corregí

**La lógica duplicada entre Stopwatch y Countdown.**

La primera versión funcionaba, pero el Stopwatch y el Countdown repetían el mismo patrón de timer: guardar timestamp, calcular delta, limpiar intervalo al pausar, acumular tiempo. Eran básicamente el mismo código duplicado con nombres distintos. Le pedí que lo unifique en `createTimer()` pero que no toque los nombres de variables ni `formatTime()`. También le marqué que sacara los comentarios que sobraban — cosas como `// Crear elemento de lap` arriba de `document.createElement('li')` no aportan nada.

---

## Reflexión

Lo que me sirvió: La base salió rápido y funcionando, y me enseñó cosas que no conocía, como performance.now() para precisión real y Web Audio API para generar sonido sin archivos externos.
Lo que tuve que corregir: La IA no piensa en calidad de código si uno no se lo pide. Me entregó lógica duplicada entre Stopwatch y Countdown que tuve que pedir que unifique, y un bug en el Reset que solo encontré probando la app — no leyendo el código.
Lo que haría distinto: Pedir reutilización de lógica y tipo de comentarios desde el primer prompt, así me ahorro una iteración entera.