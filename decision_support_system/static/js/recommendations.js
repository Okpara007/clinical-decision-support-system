/* ============================================================
   HALO — RECOMMENDATIONS PAGE LOGIC
============================================================ */

const FeedbackState = {
  approved: 0,
  modified: 0,
  pending: 0,
};

const RecommendationTheme = {
  for(priority) {
    if (priority === 'urgent') {
      return {
        color: 'var(--risk-high)',
        bg: 'var(--risk-high-bg)',
        border: 'var(--risk-high-border)',
      };
    }
    if (priority === 'high') {
      return {
        color: 'var(--risk-med)',
        bg: 'var(--risk-med-bg)',
        border: 'var(--risk-med-border)',
      };
    }
    if (priority === 'moderate') {
      return {
        color: 'var(--accent-light)',
        bg: 'rgba(45,125,210,0.08)',
        border: 'rgba(45,125,210,0.3)',
      };
    }
    return {
      color: 'var(--risk-low)',
      bg: 'var(--risk-low-bg)',
      border: 'var(--risk-low-border)',
    };
  },
};

const SidebarEngine = {
  render(patient) {
    const initials = ClinicalUtils.initials(patient.name);
    const scores = patient.risks;

    document.getElementById('sidebar').innerHTML = `
      <div class="patient-card">
        <div class="patient-avatar">${initials}</div>
        <div class="patient-name-display">${patient.name || '—'}</div>
        <div class="patient-id-display">${patient.id}</div>
        <div class="info-row"><span class="info-label">Age</span><span class="info-value">${patient.age ? patient.age + ' yrs' : '—'}</span></div>
        <div class="info-row"><span class="info-label">HbA1c</span><span class="info-value">${patient.hba1c ? patient.hba1c + '%' : '—'}</span></div>
        <div class="info-row"><span class="info-label">Systolic BP</span><span class="info-value">${patient.sbp ? patient.sbp + ' mmHg' : '—'}</span></div>
        <div class="info-row"><span class="info-label">Adherence</span><span class="info-value">${patient.adherence || '—'}</span></div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Risk Scores</div>
        ${[
          { label:'Hypoglycemia',   score: scores.hypoglycemia },
          { label:'Cardiovascular', score: scores.cardiovascular },
          { label:'Blood Pressure', score: scores.bloodpressure },
          { label:'Polypharmacy',   score: scores.polypharmacy },
        ].map(risk => {
          const styles = Risk.styles(risk.score);
          return `
            <div class="info-row" style="padding:7px 12px;">
              <span class="info-label">${risk.label}</span>
              <span class="risk-badge" style="color:${styles.color};background:${styles.bg};border:1px solid ${styles.border};">
                ${risk.score} · ${styles.label}
              </span>
            </div>`;
        }).join('')}
      </div>

      <div class="sidebar-section" id="feedback-summary" style="display:none;">
        <div class="sidebar-section-title">Clinician Feedback</div>
        <div class="info-row" style="padding:7px 12px;"><span class="info-label">Approved</span><span class="info-value" id="fb-approved" style="color:var(--risk-low);">0</span></div>
        <div class="info-row" style="padding:7px 12px;"><span class="info-label">Modified</span><span class="info-value" id="fb-modified" style="color:var(--risk-med);">0</span></div>
        <div class="info-row" style="padding:7px 12px;"><span class="info-label">Pending</span><span class="info-value" id="fb-pending" style="color:var(--text-muted);">${FeedbackState.pending}</span></div>
      </div>

      <button class="btn btn-primary" style="width:100%;" onclick="window.print()">Export PDF</button>
      <button class="btn btn-secondary" style="width:100%;" onclick="window.location.href=APP.routes.dashboard">← Risk Dashboard</button>
      <button class="btn btn-secondary" style="width:100%;" onclick="window.location.href=APP.routes.patientEntry">+ New Patient</button>
    `;
  },

  updateFeedback() {
    document.getElementById('feedback-summary').style.display = 'block';
    document.getElementById('fb-approved').textContent = FeedbackState.approved;
    document.getElementById('fb-modified').textContent = FeedbackState.modified;
    document.getElementById('fb-pending').textContent = FeedbackState.pending;
  },
};

const SummaryEngine = {
  render(summary, model) {
    const bannerEl = document.getElementById('summary-banner');
    bannerEl.className = 'summary-banner';
    bannerEl.style.display = 'block';
    bannerEl.innerHTML = `
      <div class="summary-banner-label">
        LLM Clinical Summary
        <span class="llm-badge">${model}</span>
      </div>
      <div class="summary-text">${summary}</div>
    `;
  },
};

const RiskSummaryEngine = {
  render(text) {
    const panel = document.getElementById('risk-summary-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="summary-banner">
        <div class="summary-banner-label">Predicted Risk Summary</div>
        <div class="summary-text">${text}</div>
      </div>
    `;
  },
};

const KeyFactorsEngine = {
  render(factors) {
    const panel = document.getElementById('key-factors-panel');
    if (!panel) return;
    if (!factors || factors.length === 0) {
      panel.innerHTML = '';
      return;
    }

    panel.innerHTML = `
      <div class="summary-banner">
        <div class="summary-banner-label">Top Factors</div>
        <div class="action-list">
          ${factors.map(item => `
            <div class="action-item">
              <div class="action-bullet" style="background:rgba(45,125,210,0.08);color:var(--accent-light);border:1px solid rgba(45,125,210,0.3);">
                ${item.impact}
              </div>
              <div class="action-text"><strong>${item.factor}</strong> ${item.reason}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
};

const SafetyFlagsEngine = {
  render(flags) {
    const panel = document.getElementById('safety-flags-panel');
    if (!panel) return;
    if (!flags || flags.length === 0) {
      panel.innerHTML = `
        <div class="summary-banner">
          <div class="summary-banner-label">Safety Layer</div>
          <div class="summary-text">No explicit safety flags were raised from the current structured data, but clinician review is still required before implementation.</div>
        </div>
      `;
      return;
    }

    panel.innerHTML = `
      <div class="summary-banner" style="border-color:var(--risk-high-border);">
        <div class="summary-banner-label" style="color:var(--risk-high);">Safety Flags</div>
        <div class="action-list">
          ${flags.map(flag => `
            <div class="action-item" style="border-color:var(--risk-high-border);">
              <div class="action-bullet" style="background:var(--risk-high-bg);color:var(--risk-high);border:1px solid var(--risk-high-border);">
                !
              </div>
              <div class="action-text">${flag}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
};

const RecsEngine = {
  async render(recommendations) {
    const container = document.getElementById('rec-cards');
    container.innerHTML = '';
    FeedbackState.pending = recommendations.length;

    recommendations.forEach(rec => {
      const theme = RecommendationTheme.for(rec.priority);
      const card = document.createElement('div');
      card.className = 'rec-card';
      card.id = `rec-card-${rec.id}`;

      card.innerHTML = `
        <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${theme.color};opacity:0.7;border-radius:14px 0 0 14px;"></div>
        <div class="rec-card-inner">
          <div class="rec-header">
            <div class="rec-icon-title">
              <div class="rec-icon" style="background:${theme.bg};color:${theme.color};">AI</div>
              <div>
                <div class="rec-title">${rec.title}</div>
                <div class="rec-subtitle">${rec.subtitle}</div>
              </div>
            </div>
            <div class="rec-priority" style="color:${theme.color};background:${theme.bg};border:1px solid ${theme.border};">
              ${(rec.priority || 'review').toUpperCase()}
            </div>
          </div>

          <div class="action-item" style="margin-bottom:12px;">
            <div class="action-text">${rec.rationale}</div>
          </div>

          <div class="action-list">
            ${(rec.actions || []).map((action, index) => `
              <div class="action-item">
                <div class="action-bullet" style="background:${theme.bg};color:${theme.color};border:1px solid ${theme.border};">
                  ${String(index + 1).padStart(2, '0')}
                </div>
                <div class="action-text">${action}</div>
              </div>`).join('')}
          </div>

          <div class="citations-section">
            <div class="citations-label">Guideline Citations</div>
            <div class="citations-list">
              ${(rec.citations || []).map(citation => `
                <div class="citation-tag" onclick="CitationEngine.open(${JSON.stringify(citation)})">
                  <div class="citation-dot"></div>
                  ${citation}
                </div>`).join('')}
            </div>
          </div>

          <div class="citations-section">
            <div class="citations-label">Guideline Basis</div>
            <div class="summary-text">${rec.guideline_basis || 'Clinician review required.'}</div>
          </div>

          <div class="feedback-section">
            <div>
              <div class="feedback-label">CLINICIAN REVIEW</div>
              <div class="star-rating" id="stars-${rec.id}">
                ${[1,2,3,4,5].map(value =>
                  `<span class="star" data-val="${value}" onclick="FeedbackEngine.rate('${rec.id}',${value})">★</span>`
                ).join('')}
              </div>
            </div>
            <div class="feedback-actions">
              <button class="feedback-btn btn-approve" id="approve-${rec.id}" onclick="FeedbackEngine.approve('${rec.id}')">✓ Approve</button>
              <button class="feedback-btn btn-modify" id="modify-${rec.id}" onclick="FeedbackEngine.modify('${rec.id}')">✎ Modify</button>
            </div>
          </div>

          <div class="feedback-comment" id="comment-${rec.id}">
            <textarea class="feedback-textarea" id="textarea-${rec.id}" placeholder="Describe your modification or clinical concern..."></textarea>
            <button class="feedback-submit" onclick="FeedbackEngine.submitComment('${rec.id}')">Submit Feedback</button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    for (let i = 0; i < recommendations.length; i++) {
      await this._delay(220);
      document.getElementById(`rec-card-${recommendations[i].id}`)?.classList.add('revealed');
    }
  },

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

const CitationEngine = {
  open(id) {
    const citation = CITATIONS[id];
    document.getElementById('citation-modal-title').textContent = citation ? citation.title : 'Guideline Reference';
    document.getElementById('citation-modal-body').innerHTML = citation ? citation.body : id;
    document.getElementById('citation-modal-source').textContent = citation ? citation.source : id;
    document.getElementById('citation-modal').classList.add('open');
  },

  close() {
    document.getElementById('citation-modal').classList.remove('open');
  },

  closeOnBackdrop(event) {
    if (event.target === document.getElementById('citation-modal')) {
      this.close();
    }
  },
};

const FeedbackEngine = {
  rate(recId, value) {
    document.querySelectorAll(`#stars-${recId} .star`).forEach((star, index) => {
      star.classList.toggle('active', index < value);
    });
    Toast.show(`Rating saved: ${value}/5`, 'success');
  },

  approve(recId) {
    const approveButton = document.getElementById(`approve-${recId}`);
    const modifyButton = document.getElementById(`modify-${recId}`);
    const commentBox = document.getElementById(`comment-${recId}`);
    const wasApproved = approveButton.classList.contains('selected');

    approveButton.classList.toggle('selected');
    modifyButton.classList.remove('selected');
    commentBox.classList.remove('open');

    if (!wasApproved) {
      FeedbackState.approved++;
      FeedbackState.pending = Math.max(0, FeedbackState.pending - 1);
      Toast.show('Recommendation approved', 'success');
    } else {
      FeedbackState.approved--;
      FeedbackState.pending++;
    }
    SidebarEngine.updateFeedback();
  },

  modify(recId) {
    const modifyButton = document.getElementById(`modify-${recId}`);
    const approveButton = document.getElementById(`approve-${recId}`);
    const commentBox = document.getElementById(`comment-${recId}`);

    modifyButton.classList.toggle('selected');
    approveButton.classList.remove('selected');
    const isOpen = commentBox.classList.toggle('open');
    if (isOpen) {
      document.getElementById(`textarea-${recId}`).focus();
    }
  },

  submitComment(recId) {
    const text = document.getElementById(`textarea-${recId}`).value.trim();
    if (!text) {
      Toast.show('Please enter your feedback first', 'error');
      return;
    }

    const modifyButton = document.getElementById(`modify-${recId}`);
    if (modifyButton.classList.contains('selected')) {
      FeedbackState.modified++;
      FeedbackState.pending = Math.max(0, FeedbackState.pending - 1);
    }

    document.getElementById(`comment-${recId}`).classList.remove('open');
    Toast.show('Modification feedback logged', 'success');
    SidebarEngine.updateFeedback();
  },
};

const RecommendationAPI = {
  async load(patientId) {
    const response = await fetch(`${APP.api.recommendations}${encodeURIComponent(patientId)}/`, {
      headers: { 'Accept': 'application/json' },
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load recommendations');
    }
    return payload;
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('rec-cards')) return;

  Clock.start();

  const params = new URLSearchParams(window.location.search);
  const patientId = params.get('patient') || PatientSession.currentId();

  if (!patientId) {
    document.getElementById('rec-cards').innerHTML =
      '<div class="empty-state"><div class="empty-icon">⚠️</div><div>No patient selected for recommendation generation.</div></div>';
    return;
  }

  try {
    const payload = await RecommendationAPI.load(patientId);
    SidebarEngine.render(payload.patient);
    SummaryEngine.render(payload.summary, payload.model);
    RiskSummaryEngine.render(payload.risk_summary);
    KeyFactorsEngine.render(payload.key_factors);
    SafetyFlagsEngine.render(payload.safety_flags);
    await RecsEngine.render(payload.recommendations);
  } catch (error) {
    console.error(error);
    document.getElementById('rec-cards').innerHTML =
      `<div class="empty-state"><div class="empty-icon">⚠️</div><div>${error.message}</div></div>`;
    Toast.show(error.message, 'error');
  }
});
