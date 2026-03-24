/* ============================================================
   HALO FRONTEND — SHARED UTILITIES
   assets/js/utils.js

   Contains:
   - Clock updater
   - Toast notification
   - Risk color / label helpers
   - Patient session loader
   - Mock risk score generator
   - Loading overlay controller
   - BMI calculator
============================================================ */

/* ============================================================
   CLOCK — Updates header clock every second
============================================================ */
const Clock = {
  elementId: 'header-clock',

  start() {
    this.update();
    setInterval(() => this.update(), 1000);
  },

  update() {
    const el = document.getElementById(this.elementId);
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('en-GB', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  },
};

/* ============================================================
   TOAST — Shows a brief notification message
   Usage: Toast.show('Message here')
          Toast.show('Error message', 'error')
============================================================ */
const Toast = {
  show(message, type = 'success') {
    let toast = document.getElementById('halo-toast');

    /* Create toast element if it doesn't exist */
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'halo-toast';
      toast.className = 'toast';
      toast.innerHTML = '<span id="halo-toast-icon">✓</span><span id="halo-toast-text"></span>';
      document.body.appendChild(toast);
    }

    /* Set content */
    document.getElementById('halo-toast-text').textContent = message;

    /* Style by type */
    toast.style.borderColor = type === 'error'
      ? 'var(--danger-border)'
      : 'var(--success-border)';
    toast.style.color = type === 'error'
      ? 'var(--danger)'
      : 'var(--success)';
    document.getElementById('halo-toast-icon').textContent = type === 'error' ? '✕' : '✓';

    /* Show then auto-hide */
    toast.classList.add('show');
    clearTimeout(this._timer);
    this._timer = setTimeout(() => toast.classList.remove('show'), 2800);
  },
};

const Http = {
  getCookie(name) {
    const cookie = document.cookie
      .split(';')
      .map(part => part.trim())
      .find(part => part.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
  },
};

/* ============================================================
   RISK HELPERS — Color, label, background, border
   Usage: Risk.color(75)   → 'var(--risk-high)'
          Risk.label(75)   → 'HIGH'
          Risk.level(75)   → 'high'
============================================================ */
const Risk = {
  level(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  },

  color(score) {
    const l = this.level(score);
    return l === 'high' ? 'var(--risk-high)' : l === 'medium' ? 'var(--risk-med)' : 'var(--risk-low)';
  },

  bg(score) {
    const l = this.level(score);
    return l === 'high' ? 'var(--risk-high-bg)' : l === 'medium' ? 'var(--risk-med-bg)' : 'var(--risk-low-bg)';
  },

  border(score) {
    const l = this.level(score);
    return l === 'high' ? 'var(--risk-high-border)' : l === 'medium' ? 'var(--risk-med-border)' : 'var(--risk-low-border)';
  },

  label(score) {
    const l = this.level(score);
    return l === 'high' ? 'HIGH' : l === 'medium' ? 'MEDIUM' : 'LOW';
  },

  /* Returns all style properties at once */
  styles(score) {
    return {
      color:  this.color(score),
      bg:     this.bg(score),
      border: this.border(score),
      label:  this.label(score),
      level:  this.level(score),
    };
  },
};

/* ============================================================
   PATIENT SESSION — Load & save patient data
   Reads from sessionStorage, falls back to demo data
============================================================ */
const PatientSession = {
  /* Save patient record to session */
  save(patientData, options = {}) {
    const record = {
      patientId:   options.patientId || 'PT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      submittedAt: options.submittedAt || new Date().toISOString(),
      data:        patientData,
    };
    sessionStorage.setItem(APP.storage.patient, JSON.stringify(record));
    return record;
  },

  /* Load patient record from session, fallback to demo */
  load() {
    try {
      const raw = sessionStorage.getItem(APP.storage.patient);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load patient session:', e);
    }
    return this._demoPatient();
  },

  currentId() {
    try {
      const raw = sessionStorage.getItem(APP.storage.patient);
      if (!raw) return null;
      return JSON.parse(raw).patientId || null;
    } catch (e) {
      return null;
    }
  },

  /* Demo fallback patient */
  _demoPatient() {
    return {
      patientId:   'PT-DEMO001',
      submittedAt: new Date().toISOString(),
      data: {
        fullName:        'James Okafor',
        age:             '74',
        gender:          'Male',
        weight:          '82',
        height:          '170',
        smokingStatus:   'Former',
        systolicBP:      '158',
        diastolicBP:     '94',
        heartRate:       '82',
        hba1c:           '8.6',
        fastingGlucose:  '162',
        totalCholesterol:'224',
        ldl:             '148',
        creatinine:      '1.3',
        currentMeds:     ['Metformin 500mg','Amlodipine 5mg','Lisinopril 10mg','Atorvastatin 20mg','Aspirin 75mg'],
        adherence:       'Moderate',
        mobilityStatus:  'Independent',
        cognitiveStatus: 'Mild Impairment',
        fallHistory:     '1–2 falls',
      },
    };
  },
};

/* ============================================================
   SCORE ENGINE — Generates deterministic mock risk scores
   Based on patient data; mirrors what the ML backend would return
   Usage: ScoreEngine.compute(patientData)
============================================================ */
const ScoreEngine = {
  compute(data) {
    const hba1c  = parseFloat(data.hba1c || 7.5);
    const sbp    = parseInt(data.systolicBP || 140);
    const age    = parseInt(data.age || 72);
    const meds   = Array.isArray(data.currentMeds)
      ? data.currentMeds.length
      : parseInt(data.medicationCount || 4);

    /* Seed for deterministic results per patient */
    const seed = (data.fullName || 'x').length + age + Math.round(hba1c * 10);
    const rng  = (min, max, offset) => {
      const val = ((seed + offset) * 9301 + 49297) % 233280;
      return min + (val / 233280) * (max - min);
    };

    return {
      hypoglycemia:   Math.min(95, Math.round(20 + (hba1c - 6) * 8  + rng(0, 15, 1))),
      cardiovascular: Math.min(95, Math.round(15 + (sbp - 120) * 0.4 + (age - 60) * 0.5 + rng(0, 12, 2))),
      bloodpressure:  Math.min(95, Math.round(20 + (sbp - 120) * 0.5 + rng(0, 18, 3))),
      polypharmacy:   Math.min(95, Math.round(10 + meds * 6          + rng(0, 14, 4))),
    };
  },

  /* Average score across all four risks */
  overall(scores) {
    const vals = Object.values(scores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  },

  /* Confidence score per risk (deterministic) */
  confidence(data, riskKey) {
    const seed = (data.fullName || 'x').length;
    const offsets = { hypoglycemia:10, cardiovascular:11, bloodpressure:12, polypharmacy:13 };
    const base    = { hypoglycemia:82, cardiovascular:79, bloodpressure:85, polypharmacy:81 };
    const rng = (min, max, o) => min + (((seed + o) * 9301 + 49297) % 233280) / 233280 * (max - min);
    return Math.min(99, Math.round(base[riskKey] + rng(0, 13, offsets[riskKey])));
  },
};

/* ============================================================
   LOADING OVERLAY — Controls the loading animation
   Usage:
     LoadingOverlay.start(steps, durationPerStep)
     LoadingOverlay.hide()
============================================================ */
const LoadingOverlay = {
  async start(steps = [], msPerStep = 300) {
    const stepEl = document.getElementById('loading-step-text') ||
                   document.querySelector('.loading-step-text');

    for (const step of steps) {
      if (stepEl) stepEl.textContent = step;
      await this._delay(msPerStep);
    }

    await this._delay(200);
    this.hide();
  },

  hide() {
    const overlay = document.getElementById('loading-overlay') ||
                    document.querySelector('.loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  },

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },
};

/* ============================================================
   CLINICAL UTILS — Small helpers used across pages
============================================================ */
const ClinicalUtils = {
  /* Calculate BMI */
  bmi(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    return (parseFloat(weightKg) / Math.pow(parseFloat(heightCm) / 100, 2)).toFixed(1);
  },

  /* Get initials from full name */
  initials(fullName) {
    return (fullName || 'P')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  },

  /* Format a date string nicely */
  formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    });
  },

  /* Simple markdown: **bold** → <strong> */
  parseMarkdown(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--accent-light)">$1</strong>');
  },
};
