/* ============================================================
   TYLER'S BOARD — app logic
   Vanilla JS, localStorage-backed. No build step, no dependencies.
   ============================================================ */

// ---------- Helpers ----------

function dateToStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayStr() {
  return dateToStr(new Date());
}

function isActiveDay(dateStr) {
  const water = (get('tpw_water', {})[dateStr]) || 0;
  const nutritionCount = (get('tpw_nutrition', {})[dateStr] || []).length;
  const hasTraining = !!(get('tpw_training', {})[dateStr]);
  const skincare = (get('tpw_skincare', {})[dateStr]) || {};
  const skincareActive = (skincare.am || []).some(Boolean) || (skincare.pm || []).some(Boolean);
  const journalActive = get('tpw_journal', []).some(j => j.date === dateStr);
  const meditationActive = get('tpw_meditation', []).some(m => m.date === dateStr);
  const bodyActive = get('tpw_body', []).some(b => b.date === dateStr);
  return water > 0 || nutritionCount > 0 || hasTraining || skincareActive || journalActive || meditationActive || bodyActive;
}

function computeStreak() {
  let streak = 0;
  let d = new Date();
  // Don't zero out the streak just because today hasn't been logged yet \u2014
  // the day isn't over. Start counting from yesterday in that case.
  if (!isActiveDay(dateToStr(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (isActiveDay(dateToStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
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
    { name: '90/90 Diaphragmatic Breathing', sets: 1, type: 'info' },
  ],
  lower: [
    { name: 'Barbell Back Squat', sets: 4, type: 'weight' },
    { name: 'Walking Lunges', sets: 3, type: 'weight' },
    { name: 'Standing Calf Raise', sets: 3, type: 'weight' },
    { name: 'Plank', sets: 3, type: 'time' },
    { name: '90/90 Diaphragmatic Breathing', sets: 1, type: 'info' },
  ],
  full: [
    { name: 'Conventional Deadlift', sets: 3, type: 'weight' },
    { name: 'Incline Barbell Bench Press', sets: 3, type: 'weight' },
    { name: 'Seated Cable Row', sets: 3, type: 'weight' },
    { name: 'Band Face Pull', sets: 3, type: 'weight' },
    { name: 'Plank', sets: 3, type: 'time' },
    { name: 'Thoracic Open Book Stretch', sets: 1, type: 'info' },
    { name: '90/90 Diaphragmatic Breathing', sets: 1, type: 'info' },
  ],
  home: [
    { name: 'Dumbbell Bench Press', sets: 3, type: 'weight' },
    { name: 'Pull-ups', sets: 3, type: 'weight' },
    { name: 'Goblet Squat', sets: 3, type: 'weight' },
    { name: 'Dumbbell Romanian Deadlift', sets: 3, type: 'weight' },
    { name: 'Band Row', sets: 3, type: 'weight' },
    { name: 'Plank', sets: 3, type: 'time' },
    { name: '90/90 Diaphragmatic Breathing', sets: 1, type: 'info' },
  ],
  rest: [],
};

const DAY_LABELS = { upper: 'Upper Body', lower: 'Lower Body', full: 'Full Body', home: 'Home Workout', rest: 'Rest / Stretch' };

// Short how-to + the counterbalance stretch that follows each lift.
const EXERCISE_INFO = {
  'Barbell Bench Press': { desc: 'Lie on a flat bench, bar over your chest, lower to mid-chest with elbows ~45°, press back up.', stretch: { name: 'Doorway Pec Stretch', desc: 'Forearm on a doorframe at shoulder height, step through until you feel it across your chest.' } },
  'Dumbbell Overhead Press': { desc: 'Standing or seated, press dumbbells from shoulder height straight overhead.', stretch: { name: 'Standing Lat Reach', desc: 'Reach one arm overhead and lean to the opposite side.' } },
  'Lat Pulldown': { desc: 'Seated at the cable, pull the bar to your upper chest, leading with your elbows.', stretch: { name: 'Cross-Body Lat Stretch', desc: 'Pull one straight arm across your chest with the opposite hand.' } },
  'Dumbbell Curl': { desc: 'Standing, curl dumbbells up to your shoulders, elbows pinned to your sides.', stretch: { name: 'Forearm Flexor Stretch', desc: 'Arm out, palm up, gently pull fingers back with the other hand.' } },
  'Dumbbell Fly': { desc: 'On a bench, arms slightly bent, lower dumbbells out to the sides in an arc, bring back together.', stretch: { name: 'Doorway Pec Stretch', desc: 'Forearm on a doorframe at shoulder height, step through to stretch the chest.' } },
  'Plank': { desc: 'Forearms down, body in a straight line head to heels. Exhale fully on each breath \u2014 this is the core stability that anchors good breath support for both singing and horn.', stretch: { name: '\u2014', desc: 'Core/breath work \u2014 no counterbalance stretch needed.' } },
  '90/90 Diaphragmatic Breathing': { desc: 'Lie on your back, legs up on a box or chair (hips and knees at 90°). Breathe deep into your belly and ribs, expanding 360° around your torso, not just your chest. 3-5 min. This is direct training for the breath capacity and control both singing and horn playing depend on.', stretch: { name: '\u2014', desc: 'A breath drill, not a lift \u2014 no logging needed, just do it.' } },
  'Thoracic Open Book Stretch': { desc: 'Lying on your side, knees bent, sweep your top arm open across your body like opening a book, rotating through your upper back. 8/side. Opens the rib cage and improves the thoracic rotation needed for full breath capacity \u2014 directly supports deeper inhales for sustained notes and phrases.', stretch: { name: '\u2014', desc: 'This IS the mobility work \u2014 no separate stretch needed.' } },
  'Barbell Back Squat': { desc: 'Bar on your upper back, feet shoulder-width, sit back like sitting in a chair, drive back up.', stretch: { name: 'Couch Stretch', desc: 'Back knee down (or up on a bench), front foot forward, push hips forward.' } },
  'Walking Lunges': { desc: 'Step forward into a lunge, back knee toward the floor, step through into the next rep.', stretch: { name: 'Kneeling Hip Flexor Stretch', desc: 'Kneeling lunge position, push hips forward gently.' } },
  'Standing Calf Raise': { desc: 'Rise onto your toes as high as possible, lower with control.', stretch: { name: 'Wall Calf Stretch', desc: 'Hands on a wall, one leg back with heel flat, lean forward.' } },
  'Conventional Deadlift': { desc: 'Hinge at the hips to grip the bar, stand up by driving through your heels, bar close to your shins.', stretch: { name: "Child's Pose", desc: 'Kneel and sit back over your heels, arms extended forward.' } },
  'Incline Barbell Bench Press': { desc: 'Same as bench press, on a ~30-45° incline \u2014 shifts emphasis to upper chest.', stretch: { name: 'Doorway Pec Stretch', desc: 'Forearm on a doorframe at shoulder height, step through.' } },
  'Seated Cable Row': { desc: 'Seated, pull the handle to your stomach, squeezing your shoulder blades together.', stretch: { name: 'Kneeling Thoracic Extension', desc: 'Kneel in front of a bench, drape your chest over it, arms extended.' } },
  'Band Face Pull': { desc: 'Anchor a band at chest height, pull toward your face, elbows flaring wide.', stretch: { name: '\u2014', desc: 'This IS the postural fix \u2014 no extra stretch needed.' } },
  'Dumbbell Bench Press': { desc: 'Press dumbbells from chest height straight up, one in each hand.', stretch: { name: 'Doorway Pec Stretch', desc: 'Forearm on a doorframe at shoulder height, step through.' } },
  'Pull-ups': { desc: 'Hang from a bar, palms facing away, pull your chin above the bar, lower with control.', stretch: { name: 'Cross-Body Lat Stretch', desc: 'Pull one straight arm across your chest with the opposite hand.' } },
  'Goblet Squat': { desc: 'Hold a dumbbell vertically at your chest, squat between your knees, drive back up.', stretch: { name: 'Couch Stretch', desc: 'Back knee down, front foot forward, push hips forward.' } },
  'Dumbbell Romanian Deadlift': { desc: 'Dumbbells in front of your thighs, hinge forward with a slight knee bend until you feel your hamstrings, drive hips forward to stand.', stretch: { name: 'Standing Hamstring Stretch', desc: 'Heel on an elevated surface, leg straight, hinge forward at the hips.' } },
  'Band Row': { desc: 'Anchor a band low, pull the handles to your ribs, squeezing your back.', stretch: { name: 'Kneeling Thoracic Extension', desc: 'Kneel in front of a bench, drape your chest over it.' } },
};

// Cardio guidance shown on the Training tab, per day type.
const CARDIO_INFO = {
  upper: [
    { label: 'Easy Finisher (15-20 min)', text: 'Bike or incline treadmill walk at recovery pace right after lifting \u2014 won\u2019t eat into recovery.' },
  ],
  lower: [
    { label: 'If this is your interval day', text: 'Stairmaster or bike intervals \u2014 1 min hard / 1 min easy, duration scales up with your current training phase.' },
    { label: 'If this is your long day', text: 'Long steady-state run or bike, building toward the October 10k. Duration scales with your current phase.' },
  ],
  full: [
    { label: 'Easy Finisher (15-20 min)', text: 'Bike or incline treadmill walk at recovery pace right after lifting.' },
  ],
  home: [
    { label: 'Intervals (no gym cardio)', text: 'Outdoor sprint intervals \u2014 30s hard / 90s walk/jog, x8-10. Or jump rope, same ratio.' },
    { label: 'Easy/Long alternative', text: 'Brisk 15-20 min walk, or a simple bodyweight circuit \u2014 jumping jacks, mountain climbers, high knees, 30s on/30s off.' },
  ],
  rest: [
    { label: 'Steady Cardio (20-30 min)', text: 'Incline walk, bike, or easy outdoor run. No lifting today, so this is the cardio-focused day \u2014 still easy effort, not all-out.' },
  ],
};

function renderCardioInfo() {
  const dayType = document.getElementById('train-daytype').value;
  const blocks = CARDIO_INFO[dayType] || [];
  document.getElementById('cardio-info').innerHTML = blocks.map(b => `
    <div class="cardio-block">
      <div class="cardio-label">${b.label}</div>
      <p class="cardio-text">${b.text}</p>
    </div>
  `).join('');
}

const MEALS = {
  A: { desc: 'Black Bean Bowl', cal: 730, protein: 70, fat: 13, carbs: 70 },
  B: { desc: 'Lemon Broccoli Chicken', cal: 700, protein: 70, fat: 21, carbs: 54 },
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

  // Streak
  const streak = computeStreak();
  document.getElementById('streak-badge').textContent = `\u{1F525} ${streak} day streak`;

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
  renderMeasurements();
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

  plot(entries.map(e => e.weight), '#ff007f');
  plot(entries.map(e => e.bodyfat), '#295d66');
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

// ---------- BODY MEASUREMENTS ----------

document.getElementById('btn-save-measure').addEventListener('click', () => {
  const date = document.getElementById('body-date').value || todayStr();
  const entry = {
    date,
    neck: Number(document.getElementById('m-neck').value) || null,
    waist: Number(document.getElementById('m-waist').value) || null,
    chest: Number(document.getElementById('m-chest').value) || null,
    hips: Number(document.getElementById('m-hips').value) || null,
    bicep: Number(document.getElementById('m-bicep').value) || null,
    thigh: Number(document.getElementById('m-thigh').value) || null,
  };
  const hasAny = ['neck', 'waist', 'chest', 'hips', 'bicep', 'thigh'].some(k => entry[k]);
  if (!hasAny) { alert('Enter at least one measurement to save.'); return; }
  let log = get('tpw_measurements', []);
  log = log.filter(e2 => e2.date !== date);
  log.push(entry);
  log.sort((a, b) => a.date.localeCompare(b.date));
  set('tpw_measurements', log);
  ['m-neck', 'm-waist', 'm-chest', 'm-hips', 'm-bicep', 'm-thigh'].forEach(id => document.getElementById(id).value = '');
  renderMeasurements();
});

function renderMeasurements() {
  const log = get('tpw_measurements', []);
  const listEl = document.getElementById('measure-log-list');
  if (!log.length) {
    listEl.innerHTML = '<div class="log-empty">No measurements logged yet.</div>';
  } else {
    listEl.innerHTML = log.slice().reverse().slice(0, 10).map(e2 => {
      const parts = [];
      if (e2.neck) parts.push(`Neck ${e2.neck}"`);
      if (e2.waist) parts.push(`Waist ${e2.waist}"`);
      if (e2.chest) parts.push(`Chest ${e2.chest}"`);
      if (e2.hips) parts.push(`Hips ${e2.hips}"`);
      if (e2.bicep) parts.push(`Bicep ${e2.bicep}"`);
      if (e2.thigh) parts.push(`Thigh ${e2.thigh}"`);
      return `<div class="log-item">
        <div class="log-item-main">
          <span class="log-item-title">${parts.join(' · ')}</span>
          <span class="log-item-sub">${fmtDate(e2.date)}</span>
        </div>
        <button class="log-item-del" data-date="${e2.date}" data-kind="measure">✕</button>
      </div>`;
    }).join('');
  }
  drawMeasurementsChart(log.slice(-30));
}

function drawMeasurementsChart(entries) {
  const canvas = document.getElementById('chart-measure');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.parentElement.clientWidth - 32;
  canvas.width = w; canvas.height = 180;
  ctx.clearRect(0, 0, w, 180);

  const series = [
    { key: 'neck', color: '#ff007f' },
    { key: 'waist', color: '#ff7d00' },
    { key: 'chest', color: '#295d66' },
    { key: 'hips', color: '#efe9f4' },
    { key: 'bicep', color: '#9c9aa1' },
    { key: 'thigh', color: '#829ca6' },
  ];

  const anyData = entries.some(e => series.some(s => e[s.key]));
  if (entries.length < 2 || !anyData) {
    ctx.fillStyle = '#7c7c81';
    ctx.font = '13px Inter';
    ctx.fillText('Log at least 2 measurement entries to see a trend.', 10, 90);
    return;
  }

  const padding = 24;
  const chartW = w - padding * 2;
  const chartH = 180 - padding * 2;

  // Shared scale across all series so they're comparable on one chart
  const allVals = [];
  entries.forEach(e => series.forEach(s => { if (e[s.key]) allVals.push(e[s.key]); }));
  const min = Math.min(...allVals), max = Math.max(...allVals);
  const range = (max - min) || 1;

  series.forEach(s => {
    const values = entries.map(e => e[s.key] || null);
    const valid = values.filter(v => v !== null);
    if (valid.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    let started = false;
    values.forEach((v, i) => {
      if (v === null) return;
      const x = padding + (i / (values.length - 1)) * chartW;
      const y = padding + chartH - ((v - min) / range) * chartH;
      if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
    });
    ctx.stroke();
    values.forEach((v, i) => {
      if (v === null) return;
      const x = padding + (i / (values.length - 1)) * chartW;
      const y = padding + chartH - ((v - min) / range) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    });
  });
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.log-item-del[data-kind="measure"]')) {
    const date = e.target.dataset.date;
    let log = get('tpw_measurements', []);
    log = log.filter(en => en.date !== date);
    set('tpw_measurements', log);
    renderMeasurements();
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
  renderToday();
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

document.getElementById('train-daytype').addEventListener('change', () => {
  renderExerciseList();
  renderCardioInfo();
});
document.getElementById('train-date').addEventListener('change', () => {
  loadSessionForDate(document.getElementById('train-date').value);
});

function renderTraining() {
  loadSessionForDate(document.getElementById('train-date').value || todayStr());
  renderTrainingLog();
  renderCardioInfo();
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
    const info = EXERCISE_INFO[ex.name];

    if (ex.type === 'info') {
      return `<div class="exercise-card" data-exercise-name="${ex.name}" data-exercise-type="${ex.type}">
        <div class="exercise-name">${ex.name}</div>
        ${info ? `<p class="exercise-desc">${info.desc}</p>` : ''}
      </div>`;
    }

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
      ${info ? `<p class="exercise-desc">${info.desc}</p>` : ''}
      ${rows}
      ${lastHint ? `<div class="last-session-hint">${lastHint}</div>` : ''}
      ${info && info.stretch.name !== '\u2014' ? `<div class="stretch-note"><span class="stretch-note-name">↳ ${info.stretch.name}</span><span class="stretch-note-desc">${info.stretch.desc}</span></div>` : ''}
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

// ---------- TRAINING: PACING STOPWATCH ----------

let swSeconds = 0;
let swInterval = null;
let swRunning = false;

function updateStopwatchDisplay() {
  const m = Math.floor(swSeconds / 60).toString().padStart(2, '0');
  const s = (swSeconds % 60).toString().padStart(2, '0');
  const el = document.getElementById('stopwatch-display');
  if (el) el.textContent = `${m}:${s}`;
}

document.getElementById('btn-stopwatch-start').addEventListener('click', () => {
  const btn = document.getElementById('btn-stopwatch-start');
  if (swRunning) {
    clearInterval(swInterval);
    swRunning = false;
    btn.textContent = 'Start';
    return;
  }
  swRunning = true;
  btn.textContent = 'Pause';
  swInterval = setInterval(() => {
    swSeconds++;
    updateStopwatchDisplay();
  }, 1000);
});

document.getElementById('btn-stopwatch-reset').addEventListener('click', () => {
  clearInterval(swInterval);
  swRunning = false;
  swSeconds = 0;
  document.getElementById('btn-stopwatch-start').textContent = 'Start';
  updateStopwatchDisplay();
});

// ---------- HABITS: WATER ----------

document.querySelectorAll('.water-btn[data-oz]').forEach(btn => {
  btn.addEventListener('click', () => {
    const oz = Number(btn.dataset.oz);
    const all = get('tpw_water', {});
    all[todayStr()] = (all[todayStr()] || 0) + oz;
    set('tpw_water', all);
    renderHabits();
    renderToday();
  });
});
document.getElementById('btn-water-reset').addEventListener('click', () => {
  const all = get('tpw_water', {});
  all[todayStr()] = 0;
  set('tpw_water', all);
  renderHabits();
  renderToday();
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
  'tpw_body', 'tpw_measurements', 'tpw_nutrition', 'tpw_training', 'tpw_water', 'tpw_water_goal',
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
