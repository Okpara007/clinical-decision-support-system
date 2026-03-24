/* ============================================================
   HALO — PATIENT ENTRY PAGE LOGIC
   assets/js/patient-entry.js

   Modules:
   - State         — Centralised app state
   - ChatEngine    — Message rendering, conversation flow, validation
   - FormEngine    — Form building, live field updates, section tabs
   - ProgressEngine— Progress bar tracking
   - Global        — submitForm(), resetApp()
============================================================ */

/* ============================================================
   STATE — Single source of truth for conversation progress
============================================================ */
const State = {
  currentQuestionIndex: 0,
  answers:              {},
  tagBuffer:            [],   /* For medication tag collection */
  isTagMode:            false,
  patientId:            'PT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
  isSubmitted:          false,
};

/* ============================================================
   CHAT ENGINE — Drives the conversational interface
============================================================ */
const ChatEngine = {

  /* Boot — show first message */
  init() {
    document.getElementById('form-patient-id').textContent = `ID: ${State.patientId}`;
    this._updateTimestamp();
    this._askQuestion(0);
  },

  /* Render a bot message bubble */
  addBotMessage(text, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        const container = document.getElementById('chat-messages');

        /* Remove any existing typing indicator */
        const typing = container.querySelector('.typing-indicator');
        if (typing) typing.remove();

        const msg = document.createElement('div');
        msg.className = 'msg msg-bot';
        msg.innerHTML = `<div class="msg-bubble">${ClinicalUtils.parseMarkdown(text)}</div>`;
        container.appendChild(msg);
        this._scrollToBottom();
        resolve();
      }, delay);
    });
  },

  /* Render a user message bubble */
  addUserMessage(text) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'msg msg-user';
    msg.innerHTML = `<div class="msg-bubble">${text}</div>`;
    container.appendChild(msg);
    this._scrollToBottom();
  },

  /* Show typing indicator while bot "thinks" */
  showTyping() {
    const container = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'msg msg-bot';
    indicator.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    container.appendChild(indicator);
    this._scrollToBottom();
  },

  /* Ask a specific question by index */
  async _askQuestion(index) {
    if (index >= CHAT_QUESTIONS.length) {
      this._onComplete();
      return;
    }

    const q = CHAT_QUESTIONS[index];
    State.currentQuestionIndex = index;

    /* Show typing then message */
    this.showTyping();
    await this._delay(600);
    await this.addBotMessage(q.message);

    /* Set up input based on type */
    if (q.inputType === 'quick') {
      this._showQuickReplies(q.options);
      this._disableTextInput();
    } else if (q.inputType === 'tags') {
      State.isTagMode = true;
      State.tagBuffer = [];
      this._renderTagDisplay();
      this._enableTextInput(q.placeholder);
    } else {
      State.isTagMode = false;
      this._clearQuickReplies();
      this._enableTextInput(q.placeholder, q.inputType);
    }
  },

  /* Handle text/number input submission */
  async handleSubmit() {
    const input = document.getElementById('chat-input');
    const value = input.value.trim();
    if (!value) return;

    const q = CHAT_QUESTIONS[State.currentQuestionIndex];

    /* Tag mode — collecting medication list */
    if (State.isTagMode) {
      if (value.toLowerCase() === 'done') {
        input.value = '';
        const meds = [...State.tagBuffer];
        this.addUserMessage(`Done — ${meds.length} medication${meds.length !== 1 ? 's' : ''} added`);
        State.answers[q.fieldId] = meds;
        FormEngine.setField(q.fieldId, meds.join(', '));
        State.isTagMode = false;
        State.tagBuffer = [];
        this._renderTagDisplay();
        ProgressEngine.update();
        input.value = '';
        await this._delay(400);
        this._askQuestion(State.currentQuestionIndex + 1);
      } else {
        State.tagBuffer.push(value);
        this._renderTagDisplay();
        input.value = '';
      }
      return;
    }

    /* Skip for optional fields */
    if (value.toLowerCase() === 'skip' && !q.required) {
      input.value = '';
      this.addUserMessage('Skipped');
      await this._delay(400);
      this._askQuestion(State.currentQuestionIndex + 1);
      return;
    }

    /* Validate */
    if (q.validate) {
      const result = q.validate(value);
      if (result !== true) {
        await this.addBotMessage(`⚠ ${result}`);
        input.value = '';
        return;
      }
    }

    /* Accept answer */
    input.value = '';
    this.addUserMessage(value);
    State.answers[q.fieldId] = value;
    FormEngine.setField(q.fieldId, value);
    ProgressEngine.update();

    await this._delay(300);
    this._askQuestion(State.currentQuestionIndex + 1);
  },

  /* Handle quick-reply button click */
  async handleQuickReply(value) {
    const q = CHAT_QUESTIONS[State.currentQuestionIndex];
    this._clearQuickReplies();
    this.addUserMessage(value);
    State.answers[q.fieldId] = value;
    FormEngine.setField(q.fieldId, value);
    ProgressEngine.update();
    await this._delay(300);
    this._askQuestion(State.currentQuestionIndex + 1);
  },

  /* Called when all questions are answered */
  async _onComplete() {
    this._disableTextInput();
    this._clearQuickReplies();
    await this.addBotMessage('✓ All data collected! Please review the form on the right and click **Run Risk Assessment** when ready.');
    document.getElementById('submit-btn').disabled = false;
  },

  /* ── UI helpers ── */
  _showQuickReplies(options) {
    const el = document.getElementById('quick-replies');
    el.innerHTML = '';
    options.forEach(opt => {
      const button = document.createElement('button');
      button.className = 'quick-reply-btn';
      button.type = 'button';
      button.textContent = opt;
      button.addEventListener('click', () => this.handleQuickReply(opt));
      el.appendChild(button);
    });
  },

  _clearQuickReplies() {
    document.getElementById('quick-replies').innerHTML = '';
  },

  _enableTextInput(placeholder = 'Type your answer...', type = 'text') {
    const input = document.getElementById('chat-input');
    const btn   = document.getElementById('send-btn');
    input.placeholder = placeholder;
    input.type        = type;
    input.disabled    = false;
    btn.disabled      = false;
    input.focus();
  },

  _disableTextInput() {
    document.getElementById('chat-input').disabled = true;
    document.getElementById('send-btn').disabled   = true;
  },

  _renderTagDisplay() {
    const el = document.getElementById('tag-display');
    el.innerHTML = State.tagBuffer.map((tag, i) => `
      <div class="tag-item">
        ${tag}
        <span class="tag-remove" onclick="ChatEngine.removeTag(${i})">✕</span>
      </div>`).join('');
  },

  removeTag(index) {
    State.tagBuffer.splice(index, 1);
    this._renderTagDisplay();
  },

  _scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
  },

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },

  _updateTimestamp() {
    const el = document.getElementById('form-timestamp');
    if (el) el.textContent = new Date().toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' });
  },
};

/* ============================================================
   FORM ENGINE — Builds and updates the live form panel
============================================================ */
const FormEngine = {

  /* Build all section tabs and field grids */
  init() {
    this._buildTabs();
    this._buildSections();
    this._activateSection(0);
  },

  _buildTabs() {
    const tabsEl = document.getElementById('form-tabs');
    tabsEl.innerHTML = FORM_SECTIONS.map((section, i) => `
      <button
        class="form-tab${i === 0 ? ' active' : ''}"
        id="tab-${section.id}"
        onclick="FormEngine._activateSection(${i})"
      >
        ${section.icon} ${section.label}
      </button>`).join('');
  },

  _buildSections() {
    const content = document.getElementById('form-content');
    content.innerHTML = FORM_SECTIONS.map((section, i) => `
      <div class="form-section${i === 0 ? ' active' : ''}" id="section-${section.id}">
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-card-title">
              ${section.icon} ${section.label}
              <span class="section-badge" id="badge-${section.id}" style="display:none;"></span>
            </div>
          </div>
          <div class="form-grid">
            ${section.fields.map(field => `
              <div class="form-field${field.span === 2 ? ' span-2' : ''}">
                <label>${field.label}${field.required ? ' *' : ''}</label>
                <div class="form-field-value" id="field-${field.id}">—</div>
              </div>`).join('')}
          </div>
        </div>
      </div>`).join('');
  },

  _activateSection(index) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));

    const section = FORM_SECTIONS[index];
    document.getElementById(`section-${section.id}`)?.classList.add('active');
    document.getElementById(`tab-${section.id}`)?.classList.add('active');
  },

  /* Update a field value in the live form */
  setField(fieldId, value) {
    const el = document.getElementById(`field-${fieldId}`);
    if (!el) return;

    el.textContent = Array.isArray(value)
      ? value.join(', ')
      : value;

    el.classList.add('filled');

    /* Auto-switch to the section containing this field */
    FORM_SECTIONS.forEach((section, i) => {
      const hasField = section.fields.some(f => f.id === fieldId);
      if (hasField) {
        this._activateSection(i);
        this._updateSectionBadge(section.id);
      }
    });
  },

  _updateSectionBadge(sectionId) {
    const section   = FORM_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;
    const filled    = section.fields.filter(f => {
      const el = document.getElementById(`field-${f.id}`);
      return el && el.classList.contains('filled');
    }).length;
    const total     = section.fields.length;
    const badgeEl   = document.getElementById(`badge-${sectionId}`);
    const tabEl     = document.getElementById(`tab-${sectionId}`);

    if (badgeEl) {
      badgeEl.style.display = 'inline-block';
      badgeEl.textContent   = `${filled}/${total}`;
      badgeEl.style.cssText = filled === total
        ? 'background:var(--risk-low-bg);color:var(--risk-low);border:1px solid var(--risk-low-border);'
        : 'background:rgba(45,125,210,0.1);color:var(--accent-light);border:1px solid rgba(45,125,210,0.25);';
    }

    if (tabEl && filled === total) tabEl.classList.add('completed');
  },
};

/* ============================================================
   PROGRESS ENGINE — Updates the top progress bar
============================================================ */
const ProgressEngine = {
  update() {
    const answered  = Object.keys(State.answers).length;
    const total     = CHAT_QUESTIONS.length;
    const pct       = Math.round((answered / total) * 100);

    document.getElementById('progress-bar').style.width   = pct + '%';
    document.getElementById('progress-label').textContent = pct + '% Complete';
  },
};

/* ============================================================
   GLOBAL ACTIONS
============================================================ */
function submitForm() {
  if (State.isSubmitted) return;
  State.isSubmitted = true;
  const submitButton = document.getElementById('submit-btn');
  submitButton.disabled = true;
  submitButton.textContent = 'Saving Patient...';

  const payload = {
    ...State.answers,
    currentMeds: Array.isArray(State.answers.currentMeds) ? State.answers.currentMeds : [],
  };

  fetch(APP.api.patientRecords, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': Http.getCookie('csrftoken') || '',
    },
    body: JSON.stringify(payload),
  })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save patient');
      }
      return data;
    })
    .then(({ patient }) => {
      PatientSession.save({
        fullName: patient.name,
        age: String(patient.age ?? ''),
        gender: patient.gender === 'M' ? 'Male' : 'Female',
        weight: String(patient.weight ?? ''),
        height: String(patient.height ?? ''),
        smokingStatus: patient.smoking || '',
        systolicBP: String(patient.sbp ?? ''),
        diastolicBP: String(patient.dbp ?? ''),
        heartRate: String(patient.hr ?? ''),
        hba1c: String(patient.hba1c ?? ''),
        fastingGlucose: String(patient.fasting ?? ''),
        ldl: patient.ldl != null ? String(patient.ldl) : '',
        creatinine: patient.creatinine != null ? String(patient.creatinine) : '',
        currentMeds: patient.meds || [],
        adherence: patient.adherence || '',
        mobilityStatus: patient.mobility || '',
        cognitiveStatus: patient.cognitive || '',
        fallHistory: patient.falls || '',
      }, {
        patientId: patient.id,
        submittedAt: new Date().toISOString(),
      });

      const modal = document.getElementById('success-modal');
      document.getElementById('success-id').textContent = `Patient ID: ${patient.id}`;
      const redirectButton = modal.querySelector('button');
      if (redirectButton) {
        redirectButton.onclick = () => {
          window.location.href = `${APP.routes.dashboard}?patient=${encodeURIComponent(patient.id)}`;
        };
      }
      modal.classList.add('open');

      setTimeout(() => {
        window.location.href = `${APP.routes.dashboard}?patient=${encodeURIComponent(patient.id)}`;
      }, 2800);
    })
    .catch(error => {
      console.error(error);
      State.isSubmitted = false;
      submitButton.disabled = false;
      submitButton.textContent = 'Run Risk Assessment →';
      Toast.show(error.message || 'Unable to save patient record', 'error');
    });
}

function resetApp() {
  if (!confirm('Reset and start a new patient entry?')) return;
  State.currentQuestionIndex = 0;
  State.answers              = {};
  State.tagBuffer            = [];
  State.isTagMode            = false;
  State.isSubmitted          = false;
  State.patientId            = 'PT-' + Math.random().toString(36).substr(2, 8).toUpperCase();

  document.getElementById('chat-messages').innerHTML = '';
  document.getElementById('tag-display').innerHTML   = '';
  document.getElementById('quick-replies').innerHTML = '';
  document.getElementById('submit-btn').disabled     = true;
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('progress-label').textContent = '0% Complete';

  FormEngine.init();
  ChatEngine.init();
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('chat-panel') || !document.getElementById('form-content')) return;
  window.ChatEngine = ChatEngine;
  window.submitForm = submitForm;
  window.resetApp = resetApp;
  Clock.start();
  FormEngine.init();
  ChatEngine.init();

  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-btn');
  if (chatInput) {
    chatInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        ChatEngine.handleSubmit();
      }
    });
  }
  if (sendButton) {
    sendButton.addEventListener('click', event => {
      event.preventDefault();
      ChatEngine.handleSubmit();
    });
  }
});
