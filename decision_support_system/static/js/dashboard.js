/* ============================================================
   HALO — DASHBOARD PAGE LOGIC
   assets/js/dashboard.js

   Modules:
   - SidebarEngine  — Patient summary card + overall risk
   - RiskEngine     — 4 animated risk score cards with SHAP
   - ShapEngine     — Global feature importance panel
   - AlertEngine    — Top alert banner based on risk level
   - LoadingEngine  — Loading steps animation
============================================================ */

/* ============================================================
   SIDEBAR ENGINE
============================================================ */
const SidebarEngine = {
  render(patient, scores) {
    const d        = patient.data;
    const initials = ClinicalUtils.initials(d.fullName);
    const overall  = ScoreEngine.overall(scores);
    const rs       = Risk.styles(overall);
    const bmi      = ClinicalUtils.bmi(d.weight, d.height);

    document.getElementById('sidebar').innerHTML = `

      <!-- Patient card -->
      <div class="sidebar-patient-card">
        <div class="patient-avatar">${initials}</div>
        <div class="patient-name-display">${d.fullName || 'Unknown Patient'}</div>
        <div class="patient-id-display">${patient.patientId}</div>

        <div class="info-row"><span class="info-label">Age</span>        <span class="info-value">${d.age ? d.age + ' yrs' : '—'}</span></div>
        <div class="info-row"><span class="info-label">Gender</span>     <span class="info-value">${d.gender || '—'}</span></div>
        <div class="info-row"><span class="info-label">BMI</span>        <span class="info-value">${bmi || '—'}</span></div>
        <div class="info-row"><span class="info-label">HbA1c</span>      <span class="info-value">${d.hba1c ? d.hba1c + '%' : '—'}</span></div>
        <div class="info-row"><span class="info-label">Systolic BP</span><span class="info-value">${d.systolicBP ? d.systolicBP + ' mmHg' : '—'}</span></div>
        <div class="info-row"><span class="info-label">Smoking</span>    <span class="info-value">${d.smokingStatus || '—'}</span></div>
        <div class="info-row"><span class="info-label">Adherence</span>  <span class="info-value">${d.adherence || '—'}</span></div>
        <div class="info-row"><span class="info-label">Assessed</span>   <span class="info-value">${ClinicalUtils.formatDate(patient.submittedAt)}</span></div>
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
      <button class="btn btn-primary" style="width:100%;" onclick="window.location.href=APP.routes.recommendations">
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

/* ============================================================
   RISK ENGINE — Renders all 4 risk cards with gauges + SHAP
============================================================ */
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
      const confidence = ScoreEngine.confidence(patient.data, card.id);
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

    /* Staggered reveal + animate gauges */
    for (let i = 0; i < RISK_CARDS.length; i++) {
      await this._delay(180);
      const card = document.getElementById(`card-${RISK_CARDS[i].id}`);
      if (card) card.classList.add('revealed');
    }

    /* Animate gauges after cards reveal */
    await this._delay(200);
    RISK_CARDS.forEach((card, i) => {
      const score = scoreValues[i];
      const circumference = 2 * Math.PI * 38;
      const offset = circumference - (score / 100) * circumference;

      const gaugeEl = document.getElementById(`gauge-${card.id}`);
      const confEl  = document.getElementById(`conf-${card.id}`);
      const confidence = ScoreEngine.confidence({ fullName: 'x' }, card.id);

      if (gaugeEl) gaugeEl.style.strokeDashoffset = offset;
      if (confEl)  confEl.style.width = ScoreEngine.confidence({ fullName: '' }, card.id) + '%';

      /* Animate SHAP bars */
      document.querySelectorAll(`#card-${card.id} .shap-bar-fill`).forEach(bar => {
        const target = bar.getAttribute('data-target');
        setTimeout(() => { bar.style.width = target + '%'; }, 300);
      });
    });
  },

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },
};

/* ============================================================
   SHAP ENGINE — Global feature importance panel
============================================================ */
const ShapEngine = {
  render(patient, scores) {
    const overall = ScoreEngine.overall(scores);

    const features = [
      { name:'HbA1c Level',     value: patient.data.hba1c ? patient.data.hba1c + '%' : '—',      impact:'HIGH',   dir:'+' },
      { name:'Systolic BP',     value: patient.data.systolicBP ? patient.data.systolicBP + ' mmHg' : '—', impact:'HIGH',   dir:'+' },
      { name:'Medication Count',value: Array.isArray(patient.data.currentMeds) ? patient.data.currentMeds.length + ' drugs' : '—', impact:'MED', dir:'+' },
      { name:'Age',             value: patient.data.age ? patient.data.age + ' yrs' : '—',        impact:'MED',    dir:'+' },
      { name:'Med Adherence',   value: patient.data.adherence || '—',                             impact:'MED',    dir:'-' },
      { name:'Creatinine',      value: patient.data.creatinine ? patient.data.creatinine + ' mg/dL' : '—', impact:'LOW', dir:'+' },
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

/* ============================================================
   ALERT ENGINE — Top banner based on highest risk score
============================================================ */
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

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
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

  /* Load patient data and compute scores */
  const patient = PatientSession.load();
  const scores  = ScoreEngine.compute(patient.data);

  /* Render all sections */
  SidebarEngine.render(patient, scores);
  AlertEngine.render(scores);
  await RiskEngine.renderAll(patient, scores);
  ShapEngine.render(patient, scores);
});
