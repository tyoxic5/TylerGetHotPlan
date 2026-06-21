/* ============================================================
   TYLER'S BOARD — app logic
   Vanilla JS, localStorage-backed. No build step, no dependencies.
   ============================================================ */

// ---------- Helpers ----------

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function get(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    alert('Storage is full — try removing an old photo to free up space.');
    return false;
  }
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// ---------- Default data ----------

const DEFAULT_QUOTES = [
  "Discipline is the bridge between goals and accomplishment.",
  "Small, consistent reps build the body and the craft.",
  "Show up especially on the days you don't want to.",
  "Progress, not perfection.",
  "The stage rewards the work nobody saw.",
  "One rep, one verse, one page at a time."
];

const DAY_EXERCISES = {
  upper: [
    { name: 'Barbell Bench Press', sets: 4, type: 'weight' },
    { name: 'Dumbbell Overhead Press', sets: 3, type: 'weight' },
    { name: 'Lat Pulldown', sets: 4, type: 'weight' },
    { name: 'Dumbbell Curl', sets: 3, type: 'weight' },
    { name: 'Dumbbell Fly', sets: 3, type: 'weight' },
    { name: 'Plank', sets: 3, type: 'time' },
  ],
  lower: [
    { name: 'Barbell Back Squat', sets: 4, type: 'weight' },
    { name: 'Walking Lunges', sets: 3, type: 'weight' },
    { name: 'Standing Calf Raise', sets: 3, type: 'weight' },
    { name: 'Plank', sets: 3, type: 'time' },
  ],
  full: [
    { name: 'Conventional Deadlift', sets: 3, type: 'weight' },
    { name: 'Incline Barbell Bench Press', sets: 3, type: 'weight' },
    { name: 'Seated Cable Row', sets: 3, type: 'weight' },
    { name: 'Band Face Pull', sets: 3, type: 'weight' },
    { name: 'Plank', sets: 3, type: 'time' },
  ],
  rest: [],
};

const DAY_LABELS = { upper: 'Upper Body', lower: 'Lower Body', full: 'Full Body', rest: 'Rest / Stretch' };

const MEALS = {
  A: { desc: 'Meal A — Black Bean Rice Bowl', cal: 730, protein: 70, fat: 13, carbs: 70 },
  B: { desc: 'Meal B — Lemon Broccoli Chicken', cal: 700, protein: 70, fat: 21, carbs: 54 },
  S: { desc: 'Daily Smoothie', cal: 470, protein: 35, fat: 25, carbs: 33 },
};

const SKINCARE_AM = ['Cleanse', 'Vitamin C serum', 'Moisturizer', 'SPF 30+'];
const SKINCARE_PM = ['Cleanse', 'Treatment (retinoid/exfoliant)', 'Moisturizer'];

const TARGETS = { calories: 2000, protein: 190, fat: 60, carbs: 175, water: 100 };

// ---------- Navigation ----------

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  if (name === 'body') renderBody();
  if (name === 'nutrition') renderNutrition();
  if (name === 'training') renderTraining();
  if (name === 'habits') renderHabits();
  if (name === 'today') renderToday();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.tab));
});
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.goto));
});

// ---------- TODAY ----------

function renderToday() {
  document.getElementById('topbar-date').textContent = fmtDate(todayStr());

  // Motivation hero
  const quotes = get('tpw_quotes', DEFAULT_QUOTES);
  const photos = get('tpw_photos', []);
  const dayIndex = Math.floor(Date.now() / 86400000);
  const quote = quotes.length ? quotes[dayIndex % quotes.length] : DEFAULT_QUOTES[0];
  document.getElementById('hero-quote').textContent = '"' + quote + '"';
  const photoWrap = document.getElementById('hero-photo-wrap');
  if (photos.length) {
    const photo = photos[dayIndex % photos.length];
    photoWrap.style.backgroundImage = `url(${photo})`;
  } else {
    photoWrap.style.backgroundImage = '';
  }

  // Calories fader
  const nutLog = get('tpw_nutrition', {})[todayStr()] || [];
  const totalCal = nutLog.reduce((s, e) => s + Number(e.cal || 0), 0);
  const calPct = Math.min(100, (totalCal / TARGETS.calories) * 100);
  document.getElementById('fader-calories').style.width = calPct + '%';
  document.getElementById('fader-calories-cap').style.left = calPct + '%';
  document.getElementById('readout-calories').textContent = totalCal;
  document.getElementById('target-calories').textContent = TARGETS.calories;

  // Water fader
  const waterGoal = get('tpw_water_goal', TARGETS.water);
  const waterToday = (get('tpw_water', {})[todayStr()]) || 0;
  const waterPct = Math.min(100, (waterToday / waterGoal) * 100);
  document.getElementById('fader-water').style.width = waterPct + '%';
  document.getElementById('fader-water-cap').style.left = waterPct + '%';
  document.getElementById('readout-water').textContent = waterToday;
  document.getElementById('target-water').textContent = waterGoal;

  // Last weigh-in
  const bodyLog = get('tpw_body', []);
  if (bodyLog.length) {
    const last = bodyLog[bodyLog.length - 1];
    document.getElementById('stat-weight').textContent = last.weight;
    document.getElementById('stat-bf').textContent = last.bodyfat ? `BF ${last.bodyfat}% · ${fmtDate(last.date)}` : fmtDate(last.date);
  } else {
    document.getElementById('stat-weight').textContent = '—';
    document.getElementById('stat-bf').textContent = 'No entries yet';
  }

  // Today's training focus
  const training = get('tpw_training', {})[todayStr()];
  if (training) {
    document.getElementById('stat-day-focus').textContent = DAY_LABELS[training.dayType];
    document.getElementById('stat-day-sub').textContent = 'Logged for today';
  } else {
    document.getElementById('stat-day-focus').textContent = '— —';
    document.getElementById('stat-day-sub').textContent = 'Not logged yet';
  }
}

// ---------- BODY ----------

document.getElementById('body-date').value = todayStr();

document.getElementById('btn-save-body').addEventListener('click', () => {
  const date = document.getElementById('body-date').value || todayStr();
  const weight = parseFloat(document.getElementById('body-weight').value);
  const bodyfat = parseFloat(document.getElementById('body-bf').value) || null;
  if (!weight) { alert('Enter a weight to save.'); return; }
  let log = get('tpw_body', []);
  log = log.filter(e => e.date !== date); // overwrite same-day entry
  log.push({ date, weight, bodyfat });
  log.sort((a, b) => a.date.localeCompare(b.date));
  set('tpw_body', log);
  document.getElementById('body-weight').value = '';
  document.getElementById('body-bf').value = '';
  renderBody();
});

function renderBody() {
  const log = get('tpw_body', []);
  const listEl = document.getElementById('body-log-list');
  if (!log.length) {
    listEl.innerHTML = '<div class="log-empty">No entries yet — log your first weigh-in above.</div>';
  } else {
    listEl.innerHTML = log.slice().reverse().slice(0, 30).map(e => `
      <div class="log-item">
        <div class="log-item-main">
          <span class="log-item-title">${e.weight} lb${e.bodyfat ? ' · ' + e.bodyfat + '% BF' : ''}</span>
          <span class="log-item-sub">${fmtDate(e.date)}</span>
        </div>
        <button class="log-item-del" data-date="${e.date}" data-kind="body">✕</button>
      </div>
    `).join('');
  }
  drawBodyChart(log.slice(-30));
}

function drawBodyChart(entries) {
  const canvas = document.getElementById('chart-body');
  const ctx = canvas.getContext('2d');
  const w = canvas.parentElement.clientWidth - 32;
  canvas.width = w; canvas.height = 180;
  ctx.clearRect(0, 0, w, 180);
  if (entries.length < 2) {
    ctx.fillStyle = '#5C6470';
    ctx.font = '13px Inter';
    ctx.fillText('Log at least 2 entries to see a trend.', 10, 90);
    return;
  }
  const padding = 24;
  const chartW = w - padding * 2;
  const chartH = 180 - padding * 2;

  function plot(values, color) {
    const valid = values.filter(v => v !== null && v !== undefined);
    if (valid.length < 2) return;
    const min = Math.min(...valid), max = Math.max(...valid);
    const range = (max - min) || 1;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    let started = false;
    values.forEach((v, i) => {
      if (v === null || v === undefined) return;
      const x = padding + (i / (values.length - 1)) * chartW;
      const y = padding + chartH - ((v - min) / range) * chartH;
      if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
    });
    ctx.stroke();
    values.forEach((v, i) => {
      if (v === null || v === undefined) return;
      const x = padding + (i / (values.length - 1)) * chartW;
      const y = padding + chartH - ((v - min) / range) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  plot(entries.map(e => e.weight), '#E8A33D');
  plot(entries.map(e => e.bodyfat), '#3FA7A0');
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.log-item-del[data-kind="body"]')) {
    const date = e.target.dataset.date;
    let log = get('tpw_body', []);
    log = log.filter(en => en.date !== date);
    set('tpw_body', log);
    renderBody();
  }
});

// ---------- NUTRITION ----------

document.querySelectorAll('.quickadd-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const meal = MEALS[btn.dataset.meal];
    addNutritionEntry(meal.desc, meal.cal, meal.protein, meal.fat, meal.carbs);
  });
});

document.getElementById('btn-save-nutrition').addEventListener('click', () => {
  const desc = document.getElementById('nut-desc').value.trim() || 'Custom entry';
  const cal = Number(document.getElementById('nut-cal').value) || 0;
  const protein = Number(document.getElementById('nut-protein').value) || 0;
  const fat = Number(document.getElementById('nut-fat').value) || 0;
  const carbs = Number(document.getElementById('nut-carbs').value) || 0;
  addNutritionEntry(desc, cal, protein, fat, carbs);
  document.getElementById('nut-desc').value = '';
  document.getElementById('nut-cal').value = '';
  document.getElementById('nut-protein').value = '';
  document.getElementById('nut-fat').value = '';
  document.getElementById('nut-carbs').value = '';
});

function addNutritionEntry(desc, cal, protein, fat, carbs) {
  const all = get('tpw_nutrition', {});
  const day = all[todayStr()] || [];
  day.push({ id: uid(), desc, cal, protein, fat, carbs });
  all[todayStr()] = day;
  set('tpw_nutrition', all);
  renderNutrition();
}

function renderNutrition() {
  const all = get('tpw_nutrition', {});
  const day = all[todayStr()] || [];
  const totals = day.reduce((acc, e) => {
    acc.cal += Number(e.cal || 0); acc.protein += Number(e.protein || 0);
    acc.fat += Number(e.fat || 0); acc.carbs += Number(e.carbs || 0);
    return acc;
  }, { cal: 0, protein: 0, fat: 0, carbs: 0 });

  setVerticalFader('fader-cal-v', totals.cal, TARGETS.calories);
  setVerticalFader('fader-protein-v', totals.protein, TARGETS.protein);
  setVerticalFader('fader-fat-v', totals.fat, TARGETS.fat);
  setVerticalFader('fader-carbs-v', totals.carbs, TARGETS.carbs);
  document.getElementById('mf-cal').textContent = `${totals.cal}/${TARGETS.calories}`;
  document.getElementById('mf-protein').textContent = `${totals.protein}/${TARGETS.protein}`;
  document.getElementById('mf-fat').textContent = `${totals.fat}/${TARGETS.fat}`;
  document.getElementById('mf-carbs').textContent = `${totals.carbs}/${TARGETS.carbs}`;

  const listEl = document.getElementById('nutrition-log-list');
  if (!day.length) {
    listEl.innerHTML = '<div class="log-empty">Nothing logged yet today.</div>';
  } else {
    listEl.innerHTML = day.slice().reverse().map(e => `
      <div class="log-item">
        <div class="log-item-main">
          <span class="log-item-title">${e.desc}</span>
          <span class="log-item-sub">${e.cal} cal · ${e.protein}p / ${e.fat}f / ${e.carbs}c</span>
        </div>
        <button class="log-item-del" data-id="${e.id}" data-kind="nutrition">✕</button>
      </div>
    `).join('');
  }
}

function setVerticalFader(id, value, target) {
  const pct = Math.min(100, (value / target) * 100);
  document.getElementById(id).style.height = pct + '%';
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.log-item-del[data-kind="nutrition"]')) {
    const id = e.target.dataset.id;
    const all = get('tpw_nutrition', {});
    all[todayStr()] = (all[todayStr()] || []).filter(en => en.id !== id);
    set('tpw_nutrition', all);
    renderNutrition();
  }
});

// ---------- TRAINING ----------

document.getElementById('train-date').value = todayStr();

document.getElementById('train-daytype').addEventListener('change', renderExerciseList);
document.getElementById('train-date').addEventListener('change', () => {
  loadSessionForDate(document.getElementById('train-date').value);
});

function renderTraining() {
  loadSessionForDate(document.getElementById('train-date').value || todayStr());
  renderTrainingLog();
}

function loadSessionForDate(date) {
  const all = get('tpw_training', {});
  const session = all[date];
  if (session) {
    document.getElementById('train-daytype').value = session.dayType;
  }
  renderExerciseList();
}

function getLastSessionBefore(date, exerciseName) {
  const all = get('tpw_training', {});
  const dates = Object.keys(all).filter(d => d < date).sort().reverse();
  for (const d of dates) {
    const ex = all[d].exercises && all[d].exercises[exerciseName];
    if (ex && ex.length) return { date: d, sets: ex };
  }
  return null;
}

function renderExerciseList() {
  const dayType = document.getElementById('train-daytype').value;
  const date = document.getElementById('train-date').value || todayStr();
  const exercises = DAY_EXERCISES[dayType];
  const container = document.getElementById('exercise-list');
  const all = get('tpw_training', {});
  const existing = (all[date] && all[date].exercises) || {};

  if (!exercises.length) {
    container.innerHTML = '<div class="log-empty">Rest day — no lifts. Just the mobility flow + cardio.</div>';
    return;
  }

  container.innerHTML = exercises.map(ex => {
    const savedSets = existing[ex.name] || [];
    const last = getLastSessionBefore(date, ex.name);
    let lastHint = '';
    if (last) {
      if (ex.type === 'weight') {
        lastHint = 'Last (' + fmtDate(last.date) + '): ' + last.sets.map(s => `${s.weight || 0}x${s.reps || 0}`).join(', ');
      } else {
        lastHint = 'Last (' + fmtDate(last.date) + '): ' + last.sets.map(s => `${s.seconds || 0}s`).join(', ');
      }
    }
    let rows = '';
    if (ex.type === 'weight') {
      rows = '<div class="set-row-label"><span>#</span><span>Weight (lb)</span><span>Reps</span></div>';
      for (let i = 0; i < ex.sets; i++) {
        const s = savedSets[i] || {};
        rows += `
          <div class="set-row" data-exercise="${ex.name}" data-set="${i}">
            <span class="set-num">${i + 1}</span>
            <input type="number" class="ex-weight" value="${s.weight || ''}" placeholder="0">
            <input type="number" class="ex-reps" value="${s.reps || ''}" placeholder="0">
          </div>`;
      }
    } else {
      rows = '<div class="set-row-label"><span>#</span><span>Hold (sec)</span><span></span></div>';
      for (let i = 0; i < ex.sets; i++) {
        const s = savedSets[i] || {};
        rows += `
          <div class="set-row" data-exercise="${ex.name}" data-set="${i}">
            <span class="set-num">${i + 1}</span>
            <input type="number" class="ex-seconds" value="${s.seconds || ''}" placeholder="0">
            <span></span>
          </div>`;
      }
    }
    return `<div class="exercise-card" data-exercise-name="${ex.name}" data-exercise-type="${ex.type}">
      <div class="exercise-name">${ex.name}</div>
      ${rows}
      ${lastHint ? `<div class="last-session-hint">${lastHint}</div>` : ''}
    </div>`;
  }).join('');
}

document.getElementById('btn-save-training').addEventListener('click', () => {
  const date = document.getElementById('train-date').value || todayStr();
  const dayType = document.getElementById('train-daytype').value;
  const exercises = {};
  document.querySelectorAll('.exercise-card').forEach(card => {
    const name = card.dataset.exerciseName;
    const type = card.dataset.exerciseType;
    const sets = [];
    card.querySelectorAll('.set-row').forEach(row => {
      if (type === 'weight') {
        const weight = row.querySelector('.ex-weight').value;
        const reps = row.querySelector('.ex-reps').value;
        if (weight || reps) sets.push({ weight: Number(weight) || 0, reps: Number(reps) || 0 });
      } else {
        const seconds = row.querySelector('.ex-seconds').value;
        if (seconds) sets.push({ seconds: Number(seconds) || 0 });
      }
    });
    if (sets.length) exercises[name] = sets;
  });
  const all = get('tpw_training', {});
  all[date] = { dayType, exercises };
  set('tpw_training', all);
  renderTrainingLog();
  if (window.cloudSync && window.cloudSync.ready) {
    window.cloudSync.syncTraining(date, all[date]);
  }
  alert('Workout logged.');
});

function renderTrainingLog() {
  const all = get('tpw_training', {});
  const dates = Object.keys(all).sort().reverse().slice(0, 10);
  const listEl = document.getElementById('training-log-list');
  if (!dates.length) {
    listEl.innerHTML = '<div class="log-empty">No sessions logged yet.</div>';
    return;
  }
  listEl.innerHTML = dates.map(d => {
    const s = all[d];
    const exCount = Object.keys(s.exercises || {}).length;
    return `<div class="log-item">
      <div class="log-item-main">
        <span class="log-item-title">${DAY_LABELS[s.dayType]}</span>
        <span class="log-item-sub">${fmtDate(d)} · ${exCount} exercises logged</span>
      </div>
      <button class="log-item-del" data-date="${d}" data-kind="training">✕</button>
    </div>`;
  }).join('');
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.log-item-del[data-kind="training"]')) {
    const date = e.target.dataset.date;
    const all = get('tpw_training', {});
    delete all[date];
    set('tpw_training', all);
    renderTrainingLog();
  }
});

// ---------- HABITS: WATER ----------

document.querySelectorAll('.water-btn[data-oz]').forEach(btn => {
  btn.addEventListener('click', () => {
    const oz = Number(btn.dataset.oz);
    const all = get('tpw_water', {});
    all[todayStr()] = (all[todayStr()] || 0) + oz;
    set('tpw_water', all);
    renderHabits();
  });
});
document.getElementById('btn-water-reset').addEventListener('click', () => {
  const all = get('tpw_water', {});
  all[todayStr()] = 0;
  set('tpw_water', all);
  renderHabits();
});
document.getElementById('water-goal').addEventListener('change', (e) => {
  set('tpw_water_goal', Number(e.target.value) || TARGETS.water);
  renderHabits();
});

// ---------- HABITS: SKINCARE ----------

function renderSkincare() {
  const all = get('tpw_skincare', {});
  const today = all[todayStr()] || { am: [], pm: [] };
  document.getElementById('skincare-am').innerHTML = SKINCARE_AM.map((step, i) => `
    <div class="checklist-item">
      <input type="checkbox" id="am-${i}" data-period="am" data-idx="${i}" ${today.am[i] ? 'checked' : ''}>
      <label for="am-${i}">${step}</label>
    </div>`).join('');
  document.getElementById('skincare-pm').innerHTML = SKINCARE_PM.map((step, i) => `
    <div class="checklist-item">
      <input type="checkbox" id="pm-${i}" data-period="pm" data-idx="${i}" ${today.pm[i] ? 'checked' : ''}>
      <label for="pm-${i}">${step}</label>
    </div>`).join('');
}

document.addEventListener('change', (e) => {
  if (e.target.matches('[data-period]')) {
    const period = e.target.dataset.period;
    const idx = Number(e.target.dataset.idx);
    const all = get('tpw_skincare', {});
    const today = all[todayStr()] || { am: [], pm: [] };
    today[period][idx] = e.target.checked;
    all[todayStr()] = today;
    set('tpw_skincare', all);
  }
});

// ---------- HABITS: MEDITATION ----------

let timerSeconds = 5 * 60;
let timerInterval = null;
let timerRunning = false;

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const s = (timerSeconds % 60).toString().padStart(2, '0');
  document.getElementById('timer-display').textContent = `${m}:${s}`;
}

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    clearInterval(timerInterval); timerRunning = false;
    document.getElementById('btn-timer-start').textContent = 'Start';
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    timerSeconds = Number(btn.dataset.min) * 60;
    updateTimerDisplay();
  });
});

document.getElementById('btn-timer-start').addEventListener('click', () => {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('btn-timer-start').textContent = 'Start';
    return;
  }
  timerRunning = true;
  document.getElementById('btn-timer-start').textContent = 'Pause';
  const startMinutes = timerSeconds / 60;
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('btn-timer-start').textContent = 'Start';
      logMeditation(startMinutes);
      alert('Session complete.');
    }
  }, 1000);
});

document.getElementById('btn-timer-reset').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('btn-timer-start').textContent = 'Start';
  const active = document.querySelector('.preset-btn.active');
  timerSeconds = active ? Number(active.dataset.min) * 60 : 5 * 60;
  updateTimerDisplay();
});

function logMeditation(minutes) {
  const log = get('tpw_meditation', []);
  log.push({ date: todayStr(), minutes, id: uid() });
  set('tpw_meditation', log);
  renderMeditationLog();
}

function renderMeditationLog() {
  const log = get('tpw_meditation', []);
  const listEl = document.getElementById('meditation-log-list');
  if (!log.length) {
    listEl.innerHTML = '<div class="log-empty">No sessions logged yet.</div>';
    return;
  }
  listEl.innerHTML = log.slice().reverse().slice(0, 10).map(e => `
    <div class="log-item">
      <div class="log-item-main">
        <span class="log-item-title">${e.minutes} min</span>
        <span class="log-item-sub">${fmtDate(e.date)}</span>
      </div>
      <button class="log-item-del" data-id="${e.id}" data-kind="meditation">✕</button>
    </div>`).join('');
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.log-item-del[data-kind="meditation"]')) {
    const id = e.target.dataset.id;
    set('tpw_meditation', get('tpw_meditation', []).filter(en => en.id !== id));
    renderMeditationLog();
  }
});

// ---------- HABITS: JOURNAL ----------

document.getElementById('btn-save-journal').addEventListener('click', () => {
  const text = document.getElementById('journal-text').value.trim();
  if (!text) return;
  const log = get('tpw_journal', []);
  log.push({ date: todayStr(), text, id: uid() });
  set('tpw_journal', log);
  document.getElementById('journal-text').value = '';
  renderJournalLog();
});

function renderJournalLog() {
  const log = get('tpw_journal', []);
  const listEl = document.getElementById('journal-log-list');
  if (!log.length) {
    listEl.innerHTML = '<div class="log-empty">No entries yet.</div>';
    return;
  }
  listEl.innerHTML = log.slice().reverse().slice(0, 15).map(e => `
    <div class="log-item">
      <div class="log-item-main">
        <span class="log-item-title">${e.text.length > 60 ? e.text.slice(0, 60) + '…' : e.text}</span>
        <span class="log-item-sub">${fmtDate(e.date)}</span>
      </div>
      <button class="log-item-del" data-id="${e.id}" data-kind="journal">✕</button>
    </div>`).join('');
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.log-item-del[data-kind="journal"]')) {
    const id = e.target.dataset.id;
    set('tpw_journal', get('tpw_journal', []).filter(en => en.id !== id));
    renderJournalLog();
  }
});

// ---------- HABITS: master render ----------

function renderHabits() {
  const waterGoal = get('tpw_water_goal', TARGETS.water);
  const waterToday = (get('tpw_water', {})[todayStr()]) || 0;
  document.getElementById('water-goal').value = waterGoal;
  const pct = Math.min(100, (waterToday / waterGoal) * 100);
  document.getElementById('fader-water-2').style.width = pct + '%';
  document.getElementById('readout-water-2').textContent = waterToday;
  document.getElementById('target-water-2').textContent = waterGoal;

  renderSkincare();
  renderMeditationLog();
  renderJournalLog();
  updateTimerDisplay();
}

// ---------- MOTIVATION MODAL ----------

document.getElementById('btn-edit-motivation').addEventListener('click', () => {
  document.getElementById('modal-motivation').classList.add('active');
  renderQuoteManager();
  renderPhotoManager();
});
document.getElementById('modal-motivation-close').addEventListener('click', () => {
  document.getElementById('modal-motivation').classList.remove('active');
  renderToday();
});
document.getElementById('modal-motivation').addEventListener('click', (e) => {
  if (e.target.id === 'modal-motivation') {
    e.currentTarget.classList.remove('active');
    renderToday();
  }
});

document.getElementById('btn-add-quote').addEventListener('click', () => {
  const text = document.getElementById('new-quote-text').value.trim();
  if (!text) return;
  const quotes = get('tpw_quotes', DEFAULT_QUOTES);
  quotes.push(text);
  set('tpw_quotes', quotes);
  document.getElementById('new-quote-text').value = '';
  renderQuoteManager();
});

function renderQuoteManager() {
  const quotes = get('tpw_quotes', DEFAULT_QUOTES);
  const listEl = document.getElementById('quote-manage-list');
  listEl.innerHTML = quotes.map((q, i) => `
    <div class="log-item">
      <div class="log-item-main"><span class="log-item-title">"${q}"</span></div>
      <button class="log-item-del" data-idx="${i}" data-kind="quote">✕</button>
    </div>`).join('');
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.log-item-del[data-kind="quote"]')) {
    const idx = Number(e.target.dataset.idx);
    const quotes = get('tpw_quotes', DEFAULT_QUOTES);
    quotes.splice(idx, 1);
    set('tpw_quotes', quotes);
    renderQuoteManager();
  }
});

document.getElementById('photo-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  const reader = new FileReader();
  reader.onload = (ev) => {
    img.onload = () => {
      // Resize/compress so localStorage doesn't fill up fast
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const photos = get('tpw_photos', []);
      photos.push(dataUrl);
      const ok = set('tpw_photos', photos);
      if (ok) renderPhotoManager();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

function renderPhotoManager() {
  const photos = get('tpw_photos', []);
  const listEl = document.getElementById('photo-manage-list');
  listEl.innerHTML = photos.map((p, i) => `
    <div class="photo-thumb">
      <img src="${p}">
      <button class="photo-thumb-del" data-idx="${i}" data-kind="photo">✕</button>
    </div>`).join('');
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.photo-thumb-del[data-kind="photo"]')) {
    const idx = Number(e.target.dataset.idx);
    const photos = get('tpw_photos', []);
    photos.splice(idx, 1);
    set('tpw_photos', photos);
    renderPhotoManager();
  }
});

// ---------- END DAY (full sync) ----------

const ALL_KEYS = [
  'tpw_body', 'tpw_nutrition', 'tpw_training', 'tpw_water', 'tpw_water_goal',
  'tpw_skincare', 'tpw_meditation', 'tpw_journal', 'tpw_quotes'
];

function gatherFullState() {
  const state = {};
  ALL_KEYS.forEach(key => { state[key] = get(key, null); });
  return state;
}

function applyFullState(cloudState) {
  if (!cloudState) return;
  ALL_KEYS.forEach(key => {
    if (cloudState[key] !== undefined && cloudState[key] !== null) {
      set(key, cloudState[key]);
    }
  });
  renderToday();
}

document.getElementById('btn-end-day').addEventListener('click', () => {
  const state = gatherFullState();
  if (window.cloudSync && window.cloudSync.ready) {
    window.cloudSync.syncAll(state);
  } else {
    alert('Cloud sync isn\u2019t set up yet \u2014 your data is still safe locally. See README.md to enable cloud backup.');
  }
});

// ---------- INIT ----------

function initApp() {
  updateTimerDisplay();
  renderToday();
}

// Exposed for firebase-init.js (a module, so it can't see this
// script's top-level scope directly) to call into.
window.TPW = {
  get, set, todayStr, DEFAULT_QUOTES,
  initApp, gatherFullState, applyFullState,
};
