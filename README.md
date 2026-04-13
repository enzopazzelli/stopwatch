# Stopwatch & Countdown

Cronómetro y cuenta regresiva desarrollado con HTML, CSS y JavaScript puro — sin frameworks ni librerías.

Inspirado en [online-stopwatch.com](https://www.online-stopwatch.com/).

---

## Cómo ejecutar

1. Cloná el repositorio:
   ```bash
   git clone https://github.com/enzopazzelli/stopwatch.git
   ```
2. Abrí `index.html` en tu navegador.

No necesita servidor, npm, ni instalación de nada. Abrí el archivo y funciona.

---

## Estructura del proyecto

```
├── index.html      → Estructura y tabs de los dos modos
├── styles.css      → Estilos (tema oscuro, tipografía mono, responsive)
├── script.js       → Lógica del cronómetro y la cuenta regresiva
├── IA-USO.md       → Documentación del uso de IA durante el desarrollo
└── README.md       → Este archivo
```

---

## Funcionalidades

**Stopwatch (cronómetro)**
- Display en formato `MM:SS.cc` (centésimas de segundo)
- Botones Start, Stop, Lap y Reset
- Registro de laps (vueltas) con lista ordenada por más reciente
- Start se convierte en Resume al pausar

**Countdown (cuenta regresiva)**
- Input en segundos con preview en tiempo real (ej: `100` → `01:40.00`)
- Botones Start, Pause y Reset
- Alerta visual (parpadeo + cartel) y sonora (beep con Web Audio API) al terminar

---

## Decisiones técnicas

- **Precisión:** El tiempo se mide con `performance.now()` calculando el delta real entre timestamps. `setInterval` solo repinta el display cada ~10ms, nunca es la fuente de verdad del tiempo.
- **Estados:** Cada modo maneja tres estados (`idle`, `running`, `paused`) que controlan qué botones están habilitados.
- **Timer reutilizable:** La función `createTimer()` encapsula la lógica compartida entre Stopwatch y Countdown para evitar duplicación.
- **Sin dependencias:** Todo funciona con APIs nativas del navegador, incluyendo el sonido (Web Audio API).

---

## Uso de IA

Ver [`IA-USO.md`](./IA-USO.md) para el detalle completo de prompts, respuestas, y reflexión sobre el proceso.
