
const SidebarEngine = {
  render(patient, scores) {
    const initials = ClinicalUtils.initials(patient.name);
    const overall  = ScoreEngine.overall(scores);
    const rs       = Risk.styles(overall);
    const bmi      = ClinicalUtils.bmi(patient.weight, patient.height);
    const patientId = patient.id || 'PT-UNKNOWN';

    document.getElementById('sidebar').innerHTML = `

      <!-- Patient card -->
      <div class="sidebar-patient-card">
        <div class="patient-avatar">${initials}</div>
        <div class="patient-name-display">${patient.name || 'Unknown Patient'}</div>
        <div class="patient-id-display">${patientId}</div>

        <div class="info-row"><span class="info-label">Age</span>        <span class="info-value">${patient.age ? patient.age + ' yrs' : '—'}</span></div>
        <div class="info-row"><span class="info-label">Gender</span>     <span class="info-value">${patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : (patient.gender || '—')}</span></div>
        <div class="info-row"><span class="info-label">BMI</span>        <span class="info-value">${bmi || '—'}</span></div>
        <div class="info-row"><span class="info-label">HbA1c</span>      <span class="info-value">${patient.hba1c ? patient.hba1c + '%' : '—'}</span></div>
        <div class="info-row"><span class="info-label">Systolic BP</span><span class="info-value">${patient.sbp ? patient.sbp + ' mmHg' : '—'}</span></div>
        <div class="info-row"><span class="info-label">Smoking</span>    <span class="info-value">${patient.smoking || '—'}</span></div>
        <div class="info-row"><span class="info-label">Adherence</span>  <span class="info-value">${patient.adherence || '—'}</span></div>
        <div class="info-row"><span class="info-label">Assessed</span>   <span class="info-value">${patient.date ? ClinicalUtils.formatDate(patient.date) : '—'}</span></div>
      </div>

      <!-- Overall risk index -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">Overall Risk Index</div>
        <div class="overall-risk-wrap">
          <div class="overall-risk-value" style="color:${rs.color};">${overall}</div>
          <span class="risk-badge" style="color:${rs.color};background:${rs.bg};border:1px solid ${rs.border};">${rs.label} RISK</span>
          <div class="overall-bar-wrap" style="width:100%;">
            <div class="overall-bar-fill" id="overall-bar" style="background:${rs.color};"></div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <button class="btn btn-primary" style="width:100%;" onclick="window.location.href='${APP.routes.recommendations}?patient=${encodeURIComponent(patientId)}'">
        View Recommendations →
      </button>
      <button class="btn btn-secondary" style="width:100%;" onclick="window.location.href=APP.routes.records">
        ← Back to Records
      </button>
      <button class="btn btn-secondary" style="width:100%;" onclick="window.location.href=APP.routes.patientEntry">
        + New Patient
      </button>
    `;

    /* Animate overall bar */
    setTimeout(() => {
      const bar = document.getElementById('overall-bar');
      if (bar) bar.style.width = overall + '%';
    }, 400);
  },
};

const RiskEngine = {

  async renderAll(patient, scores) {
    const grid = document.getElementById('risk-cards-grid');
    grid.innerHTML = '';

    const scoreValues = [
      scores.hypoglycemia,
      scores.cardiovascular,
      scores.bloodpressure,
      scores.polypharmacy,
    ];

    RISK_CARDS.forEach((card, i) => {
      const score      = scoreValues[i];
      const confidence = ScoreEngine.confidence({
        fullName: patient.name,
      }, card.id);
      const rs         = Risk.styles(score);
      const circumference = 2 * Math.PI * 38; // radius=38
      const offset     = circumference - (score / 100) * circumference;

      const el = document.createElement('div');
      el.className = `risk-card${score >= 70 ? ' pulse' : ''}`;
      el.id = `card-${card.id}`;
      el.innerHTML = `
        <div class="risk-card-stripe" style="background:${rs.color};"></div>
        <div class="risk-card-body">

          <!-- Header -->
          <div class="risk-card-header">
            <div class="risk-card-icon-title">
              <div class="risk-card-icon" style="background:${rs.bg};border:1px solid ${rs.border};">${card.icon}</div>
              <div>
                <div class="risk-card-title">${card.title}</div>
                <div class="risk-card-subtitle">${card.subtitle}</div>
              </div>
            </div>
          </div>

          <!-- Gauge + meta -->
          <div class="gauge-wrap">
            <svg class="gauge-svg" width="90" height="90" viewBox="0 0 90 90">
              <circle class="gauge-track" cx="45" cy="45" r="38"
                stroke-dasharray="${circumference}" stroke-dashoffset="0"/>
              <circle class="gauge-fill" cx="45" cy="45" r="38"
                id="gauge-${card.id}"
                stroke="${rs.color}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${circumference}"
                transform="rotate(-90 45 45)"/>
              <text class="gauge-score-text" x="45" y="43" style="fill:${rs.color}">${score}</text>
              <text class="gauge-label-text" x="45" y="56">/100</text>
            </svg>

            <div class="gauge-meta">
              <div class="gauge-level-badge">
                <span class="risk-badge" style="color:${rs.color};background:${rs.bg};border:1px solid ${rs.border};">${rs.label}</span>
              </div>
              <div class="gauge-confidence-label">Confidence: ${confidence}%</div>
              <div class="confidence-bar-wrap">
                <div class="confidence-bar-fill" id="conf-${card.id}" style="background:${rs.color};width:0%;"></div>
              </div>
            </div>
          </div>

          <!-- SHAP feature bars -->
          <div class="shap-title">Top Contributing Factors</div>
          ${card.shapFeatures.map(f => `
            <div class="shap-row">
              <span class="shap-feature-name">${f.name}</span>
              <div class="shap-bar-wrap">
                <div class="shap-bar-fill" style="background:${rs.color};width:0%;"
                  data-target="${Math.round(f.weight * 100)}"></div>
              </div>
              <span class="shap-value">${(f.weight * score / 100).toFixed(1)}</span>
            </div>`).join('')}

          <!-- Clinical interpretation -->
          <button class="interp-toggle" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.interp-arrow').textContent=this.nextElementSibling.classList.contains('open')?'▲':'▼';">
            <span>Clinical Interpretation</span>
            <span class="interp-arrow">▼</span>
          </button>
          <div class="interp-body">${card.description}</div>

        </div>`;

      grid.appendChild(el);
    });

    for (let i = 0; i < RISK_CARDS.length; i++) {
      await this._delay(180);
      const card = document.getElementById(`card-${RISK_CARDS[i].id}`);
      if (card) card.classList.add('revealed');
    }

    await this._delay(200);
    RISK_CARDS.forEach((card, i) => {
      const score = scoreValues[i];
      const circumference = 2 * Math.PI * 38;
      const offset = circumference - (score / 100) * circumference;

      const gaugeEl = document.getElementById(`gauge-${card.id}`);
      const confEl  = document.getElementById(`conf-${card.id}`);
      if (gaugeEl) gaugeEl.style.strokeDashoffset = offset;
      if (confEl)  confEl.style.width = ScoreEngine.confidence({ fullName: patient.name || '' }, card.id) + '%';

      /* Animate SHAP bars */
      document.querySelectorAll(`#card-${card.id} .shap-bar-fill`).forEach(bar => {
        const target = bar.getAttribute('data-target');
        setTimeout(() => { bar.style.width = target + '%'; }, 300);
      });
    });
  },

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },
};

const ShapEngine = {
  render(patient, scores) {
    const features = [
      { name:'HbA1c Level',     value: patient.hba1c ? patient.hba1c + '%' : '—',      impact:'MED',   dir:'+' },
      { name:'Systolic BP',     value: patient.sbp ? patient.sbp + ' mmHg' : '—', impact:'MED',   dir:'+' },
      { name:'Medication Count',value: Array.isArray(patient.meds) ? patient.meds.length + ' drugs' : '—', impact:'MED', dir:'+' },
      { name:'Age',             value: patient.age ? patient.age + ' yrs' : '—',        impact:'MED',    dir:'+' },
      { name:'Med Adherence',   value: patient.adherence || '—',                             impact:'MED',    dir:'-' },
      { name:'Creatinine',      value: patient.creatinine ? patient.creatinine + ' mg/dL' : '—', impact:'MED', dir:'+' },
    ];

    const impactColor = { HIGH:'var(--risk-high)', MED:'var(--risk-med)', LOW:'var(--risk-low)' };
    const impactBg    = { HIGH:'var(--risk-high-bg)', MED:'var(--risk-med-bg)', LOW:'var(--risk-low-bg)' };
    const impactBorder= { HIGH:'var(--risk-high-border)', MED:'var(--risk-med-border)', LOW:'var(--risk-low-border)' };

    document.getElementById('shap-panel').innerHTML = features.map(f => `
      <div class="shap-global-item">
        <div class="shap-global-name">${f.name}</div>
        <div class="shap-global-value">${f.value}</div>
        <span class="shap-global-impact" style="color:${impactColor[f.impact]};background:${impactBg[f.impact]};border:1px solid ${impactBorder[f.impact]};">
          ${f.dir}${f.impact}
        </span>
      </div>`).join('');
  },
};

const AlertEngine = {
  render(scores) {
    const max    = Math.max(...Object.values(scores));
    const banner = document.getElementById('alert-banner');
    if (!banner) return;

    if (max >= 70) {
      banner.style.display = 'flex';
      banner.className     = 'alert-banner';
      banner.style.cssText = `display:flex;background:var(--risk-high-bg);border:1px solid var(--risk-high-border);border-radius:12px;padding:14px 18px;gap:12px;animation:fade-up 0.4s both;`;
      banner.innerHTML = `
        <div class="alert-icon">🚨</div>
        <div>
          <div class="alert-title" style="color:var(--risk-high);">High Risk Detected — Urgent Clinical Review Required</div>
          <div class="alert-body">One or more risk scores exceed the high-risk threshold (≥70). Immediate clinical assessment and intervention planning is recommended. Proceed to treatment recommendations.</div>
        </div>`;
    } else if (max >= 40) {
      banner.style.display = 'flex';
      banner.style.cssText = `display:flex;background:var(--risk-med-bg);border:1px solid var(--risk-med-border);border-radius:12px;padding:14px 18px;gap:12px;animation:fade-up 0.4s both;`;
      banner.innerHTML = `
        <div class="alert-icon">⚠️</div>
        <div>
          <div class="alert-title" style="color:var(--risk-med);">Medium Risk — Recommended Review</div>
          <div class="alert-body">Risk scores indicate moderate concern. A proactive clinical review and medication adjustment may be beneficial.</div>
        </div>`;
    }
  },
};

const DashboardAPI = {
  async loadPatient(patientId) {
    const response = await fetch(
      `${APP.api.patientRecordDetailBase}${encodeURIComponent(patientId)}/`,
      { headers: { Accept: 'application/json' } },
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load patient for dashboard');
    }
    return payload.patient;
  },

  async loadLatestPatient() {
    const response = await fetch(APP.api.patientLatestRecord, {
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load latest patient for dashboard');
    }
    return payload.patient;
  },
};

function _normalizeScores(risks = {}) {
  const asNum = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return {
    hypoglycemia: asNum(risks.hypoglycemia),
    cardiovascular: asNum(risks.cardiovascular),
    bloodpressure: asNum(risks.bloodpressure),
    polypharmacy: asNum(risks.polypharmacy),
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('risk-cards-grid') || !document.getElementById('sidebar')) return;
  Clock.start();

  /* Run loading animation */
  await LoadingOverlay.start([
    'Initialising Random Forest model...',
    'Loading patient feature vectors...',
    'Running ensemble prediction...',
    'Computing SHAP explanations...',
    'Calculating confidence intervals...',
    'Preparing dashboard...',
  ], 320);

  const params = new URLSearchParams(window.location.search);
  const patientId = params.get('patient');

  let patient = null;
  try {
    patient = patientId
      ? await DashboardAPI.loadPatient(patientId)
      : await DashboardAPI.loadLatestPatient();
  } catch (error) {
    console.error(error);
    const grid = document.getElementById('risk-cards-grid');
    const shap = document.getElementById('shap-panel');
    const banner = document.getElementById('alert-banner');
    if (banner) banner.style.display = 'none';
    if (grid) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div>${error.message}</div></div>`;
    }
    if (shap) shap.innerHTML = '';
    return;
  }

  const normalizedScores = _normalizeScores(patient.risks || {});
  patient.risks = normalizedScores;

  SidebarEngine.render(patient, normalizedScores);
  AlertEngine.render(normalizedScores);
  await RiskEngine.renderAll(patient, normalizedScores);
  ShapEngine.render(patient, normalizedScores);
});
