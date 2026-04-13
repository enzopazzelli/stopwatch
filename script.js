/*
 * CRONÓMETRO (Stopwatch) & CUENTA REGRESIVA (Countdown)
 *
 * PRECISIÓN: setInterval solo repinta el display cada ~10ms.
 * La fuente de verdad del tiempo es performance.now(), calculando
 * el delta real entre timestamps en cada tick.
 *
 * ESTADOS: ambos modos usan "idle" | "running" | "paused".
 * Los botones se habilitan/deshabilitan según el estado.
 */

// =============================================
//  DOM
// =============================================
const tabs = document.querySelectorAll('.tab');
const modes = document.querySelectorAll('.mode');

const swDisplay     = document.getElementById('sw-display');
const swStart       = document.getElementById('sw-start');
const swStop        = document.getElementById('sw-stop');
const swLap         = document.getElementById('sw-lap');
const swReset       = document.getElementById('sw-reset');
const lapsContainer = document.getElementById('laps-container');
const lapsList      = document.getElementById('laps-list');

const cdDisplay      = document.getElementById('cd-display');
const cdInput        = document.getElementById('cd-input');
const cdInputWrapper = document.getElementById('cd-input-wrapper');
const cdPreview      = document.getElementById('cd-preview');
const cdStart        = document.getElementById('cd-start');
const cdPause        = document.getElementById('cd-pause');
const cdReset        = document.getElementById('cd-reset');
const cdAlert        = document.getElementById('cd-alert');

// =============================================
//  UTILIDAD: formatear milisegundos → MM:SS.cc
//  "cc" son centésimas de segundo (2 dígitos de ms).
//  Usamos centésimas en vez de milésimas porque es más legible
//  y es el estándar en cronómetros deportivos y online-stopwatch.
// =============================================
function formatTime(ms) {
  // Evitar valores negativos en el display
  if (ms < 0) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  // Centésimas: tomamos los ms restantes y dividimos por 10
  const centiseconds = Math.floor((ms % 1000) / 10);

  return (
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0') + '.' +
    String(centiseconds).padStart(2, '0')
  );
}

// =============================================
//  createTimer(onTick)
//  Patrón reutilizable que encapsula el setInterval y el
//  timestamp de performance.now(). El callback onTick recibe
//  el delta en ms desde el último start().
//  Cada modo define qué hacer con ese delta (sumar para
//  stopwatch, restar para countdown).
// =============================================
function createTimer(onTick) {
  let intervalId = null;
  let startTime = 0;

  return {
    start() {
      startTime = performance.now();
      intervalId = setInterval(() => onTick(performance.now() - startTime), 10);
    },
    // Detiene el intervalo y devuelve el delta final (útil para acumular)
    pause() {
      clearInterval(intervalId);
      return performance.now() - startTime;
    },
    stop() {
      clearInterval(intervalId);
    },
    // Delta actual sin pausar (útil para laps mientras corre)
    currentDelta() {
      return performance.now() - startTime;
    }
  };
}

// =============================================
//  TABS
// =============================================
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    modes.forEach(m => m.classList.remove('active'));
    document.getElementById(tab.dataset.mode).classList.add('active');
  });
});

// =============================================
//  STOPWATCH
// =============================================
let swState    = 'idle';
let swElapsed  = 0;
let swLapCount = 0;

const swTimer = createTimer(delta => {
  swDisplay.textContent = formatTime(swElapsed + delta);
});

function updateSwButtons() {
  swStart.disabled = swState === 'running';
  swStop.disabled  = swState !== 'running';
  swLap.disabled   = swState === 'idle';
  swReset.disabled = swState === 'idle';
  swStart.textContent = swState === 'paused' ? 'Resume' : 'Start';
}

swStart.addEventListener('click', () => {
  swState = 'running';
  swTimer.start();
  updateSwButtons();
});

swStop.addEventListener('click', () => {
  // Acumular el delta transcurrido para no perderlo al reanudar
  swElapsed += swTimer.pause();
  swState = 'paused';
  updateSwButtons();
});

swLap.addEventListener('click', () => {
  swLapCount++;
  const total = swState === 'running'
    ? swElapsed + swTimer.currentDelta()
    : swElapsed;

  const li = document.createElement('li');
  li.innerHTML =
    `<span class="lap-number">Lap ${swLapCount}</span>` +
    `<span class="lap-time">${formatTime(total)}</span>`;
  // Más reciente arriba, como en online-stopwatch
  lapsList.prepend(li);
  lapsContainer.classList.remove('hidden');
});

swReset.addEventListener('click', () => {
  swTimer.stop();
  swState    = 'idle';
  swElapsed  = 0;
  swLapCount = 0;
  swDisplay.textContent = '00:00.00';
  lapsList.innerHTML = '';
  lapsContainer.classList.add('hidden');
  updateSwButtons();
});

// =============================================
//  COUNTDOWN
// =============================================
let cdState       = 'idle';
let cdTotalMs     = 0;
let cdRemainingMs = 0;

const cdTimer = createTimer(delta => {
  const remaining = cdRemainingMs - delta;

  if (remaining <= 0) {
    cdDisplay.textContent = '00:00.00';
    cdTimer.stop();
    cdState = 'idle';
    cdRemainingMs = 0;
    onCountdownFinished();
    return;
  }

  cdDisplay.textContent = formatTime(remaining);
});

// Preview en tiempo real mientras el usuario escribe
cdInput.addEventListener('input', () => {
  const secs = parseInt(cdInput.value, 10);
  cdPreview.textContent = '→ ' + formatTime((!isNaN(secs) && secs > 0) ? secs * 1000 : 0);
});

function updateCdButtons() {
  cdStart.disabled = cdState === 'running';
  cdPause.disabled = cdState !== 'running';
  // Reset habilitado también cuando terminó (alerta visible) para poder limpiar y volver al input
  cdReset.disabled = cdState === 'idle' && cdRemainingMs === 0 && cdAlert.classList.contains('hidden');
  cdStart.textContent = cdState === 'paused' ? 'Resume' : 'Start';
  // Input solo visible cuando no hay cuenta configurada
  cdInputWrapper.classList.toggle('hidden', !(cdState === 'idle' && cdRemainingMs === 0));
}

function onCountdownFinished() {
  cdAlert.classList.remove('hidden');
  cdDisplay.classList.add('finished');
  playBeep();
  updateCdButtons();
}

/*
 * playBeep(): tono de 800Hz con fade-out de 500ms via Web Audio API.
 * Sin archivos externos. Si el navegador bloquea autoplay,
 * falla silenciosamente (la alerta visual sigue activa).
 */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { /* autoplay bloqueado — solo alerta visual */ }
}

cdStart.addEventListener('click', () => {
  // Primer start: leer input y configurar el tiempo total
  if (cdState === 'idle' && cdRemainingMs === 0) {
    const secs = parseInt(cdInput.value, 10);
    if (isNaN(secs) || secs <= 0) return;
    cdTotalMs = secs * 1000;
    cdRemainingMs = cdTotalMs;
    cdAlert.classList.add('hidden');
    cdDisplay.classList.remove('finished');
  }

  cdState = 'running';
  cdTimer.start();
  updateCdButtons();
});

cdPause.addEventListener('click', () => {
  // Actualizar el restante real antes de pausar
  cdRemainingMs = Math.max(0, cdRemainingMs - cdTimer.pause());
  cdState = 'paused';
  updateCdButtons();
});

cdReset.addEventListener('click', () => {
  cdTimer.stop();
  cdState       = 'idle';
  cdTotalMs     = 0;
  cdRemainingMs = 0;
  cdDisplay.textContent = '00:00.00';
  cdDisplay.classList.remove('finished');
  cdAlert.classList.add('hidden');
  cdInput.value = '';
  cdPreview.textContent = '→ 00:00.00';
  updateCdButtons();
});

// =============================================
//  ESTADO INICIAL
// =============================================
updateSwButtons();
updateCdButtons();
