/* ============================================================
   HALO — RECORDS PAGE LOGIC
   assets/js/records.js

   Modules:
   - StatsEngine   — Renders top 4 stat cards
   - TableEngine   — Render, sort, filter, paginate table
   - DrawerEngine  — Slide-in patient detail drawer
============================================================ */

/* ============================================================
   STATS ENGINE
============================================================ */
const StatsEngine = {
  render(patients) {
    const total = patients.length;
    const urgent = patients.filter(p => p.status === 'Urgent').length;
    const pending = patients.filter(p => p.status === 'Pending').length;
    const avgHba1c = total
      ? (patients.reduce((sum, p) => sum + parseFloat(p.hba1c || 0), 0) / total).toFixed(1)
      : '0.0';

    const stats = [
      { icon:'👥', iconBg:'rgba(45,125,210,0.1)',  value:total,        label:'Total Patients',     delta:'↑ 3 this week',      deltaColor:'var(--risk-low)'  },
      { icon:'🚨', iconBg:'rgba(239,68,68,0.1)',   value:urgent,       label:'Urgent Reviews',     delta:'Requires attention', deltaColor:'var(--risk-high)' },
      { icon:'⏳', iconBg:'rgba(245,158,11,0.1)',  value:pending,      label:'Pending Reviews',    delta:'Awaiting clinician', deltaColor:'var(--risk-med)'  },
      { icon:'🧪', iconBg:'rgba(16,185,129,0.1)',  value:avgHba1c+'%', label:'Avg HbA1c',          delta:'Target: <7.5%',      deltaColor:'var(--text-muted)'},
    ];

    document.getElementById('stats-bar').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${s.iconBg};">${s.icon}</div>
        <div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
          <div class="stat-delta" style="color:${s.deltaColor};">${s.delta}</div>
        </div>
      </div>`).join('');
  },
};

/* ============================================================
   TABLE ENGINE — render, sort, filter, paginate
============================================================ */
const TableEngine = {
  allData:       [],
  currentFilter: 'all',
  currentSort:   { col:'date', dir:'desc' },
  currentPage:   1,
  pageSize:      8,
  filteredData:  [],

  /* Apply search + risk filter then re-render */
  applyFilters() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();

    this.filteredData = this.allData.filter(p => {
      const matchSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query);

      const level = p.overallRisk || 'low';
      const matchFilter = this.currentFilter === 'all' || this.currentFilter === level;

      return matchSearch && matchFilter;
    });

    this._sortData();
    this.currentPage = 1;
    this.renderTable();
  },

  /* Sort filtered data by column */
  sort(col) {
    if (this.currentSort.col === col) {
      this.currentSort.dir = this.currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = { col, dir:'asc' };
    }

    /* Update arrow indicators */
    document.querySelectorAll('.sort-arrow').forEach(el => el.textContent = '');
    document.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));
    const arrowEl = document.getElementById(`arrow-${col}`);
    if (arrowEl) {
      arrowEl.textContent = this.currentSort.dir === 'asc' ? '↑' : '↓';
      arrowEl.closest('th').classList.add('sorted');
    }

    this._sortData();
    this.renderTable();
  },

  _sortData() {
    const { col, dir } = this.currentSort;
    const mult = dir === 'asc' ? 1 : -1;
    this.filteredData.sort((a, b) => {
      const map = { name:a.name, age:a.age, hba1c:a.hba1c, sbp:a.sbp, date:a.date, status:a.status };
      const av = map[col] ?? a[col];
      const bv = { name:b.name, age:b.age, hba1c:b.hba1c, sbp:b.sbp, date:b.date, status:b.status }[col] ?? b[col];
      return av < bv ? -mult : av > bv ? mult : 0;
    });
  },

  /* Set active risk filter */
  setFilter(level, btn) {
    this.currentFilter = level;
    document.querySelectorAll('.filter-btn').forEach(b => b.className = 'filter-btn');
    btn.classList.add(`active-${level}`);
    this.applyFilters();
  },

  /* Render the current page of rows */
  renderTable() {
    const tbody = document.getElementById('table-body');
    const start = (this.currentPage - 1) * this.pageSize;
    const slice = this.filteredData.slice(start, start + this.pageSize);

    document.getElementById('results-count').textContent =
      `${this.filteredData.length} patient${this.filteredData.length !== 1 ? 's' : ''}`;

    if (slice.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🔍</div><div>No patients match your search</div></div></td></tr>`;
      this._renderPagination();
      return;
    }

    tbody.innerHTML = slice.map((p, i) => {
      const risks    = p.risks;
      const initials = ClinicalUtils.initials(p.name);
      const date     = ClinicalUtils.formatDate(p.date);

      /* Risk mini-badges */
      const badges = [
        { label:'HG', score:risks.hypoglycemia },
        { label:'CV', score:risks.cardiovascular },
        { label:'BP', score:risks.bloodpressure },
        { label:'PH', score:risks.polypharmacy },
      ].map(r => {
        const s = Risk.styles(r.score);
        return `<span class="risk-mini" style="color:${s.color};background:${s.bg};border:1px solid ${s.border};">${r.label} ${r.score}</span>`;
      }).join('');

      /* Status badge */
      const sc  = Risk.styles(p.status === 'Urgent' ? 75 : p.status === 'Pending' ? 50 : 20);
      const statusStyle = `color:${sc.color};background:${sc.bg};border:1px solid ${sc.border};`;

      return `
        <tr class="row-animate" style="animation-delay:${i*0.04}s;"
            onclick="DrawerEngine.open('${p.id}')" id="row-${p.id}">
          <td>
            <div class="patient-cell">
              <div class="patient-mini-avatar">${initials}</div>
              <div>
                <div class="patient-name-cell">${p.name}</div>
                <div class="patient-id-cell">${p.id}</div>
              </div>
            </div>
          </td>
          <td><div class="mono-val">${p.age}</div><div class="mono-sub">${p.gender==='M'?'Male':'Female'}</div></td>
          <td><div class="risk-row-badges">${badges}</div></td>
          <td><div class="mono-val">${p.hba1c}%</div><div class="mono-sub">FG: ${p.fasting} mg/dL</div></td>
          <td><div class="mono-val">${p.sbp} mmHg</div><div class="mono-sub">DBP: ${p.dbp}</div></td>
          <td><div class="mono-val" style="font-size:11px;">${date}</div></td>
          <td><span class="status-badge" style="${statusStyle}">${p.status}</span></td>
          <td onclick="event.stopPropagation()">
            <button class="table-action-btn btn-view-dash" onclick="window.location.href=APP.routes.dashboard">Dashboard →</button>
          </td>
        </tr>`;
    }).join('');

    this._renderPagination();
  },

  /* Render pagination controls */
  _renderPagination() {
    const total      = this.filteredData.length;
    const totalPages = Math.ceil(total / this.pageSize);
    const start      = Math.min((this.currentPage - 1) * this.pageSize + 1, total);
    const end        = Math.min(this.currentPage * this.pageSize, total);

    document.getElementById('page-info').textContent =
      total === 0 ? 'No results' : `Showing ${start}–${end} of ${total}`;

    const btnsEl = document.getElementById('page-btns');
    btnsEl.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.textContent = '‹';
    prev.disabled = this.currentPage === 1;
    prev.onclick = () => this.goToPage(this.currentPage - 1);
    btnsEl.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `page-btn${i === this.currentPage ? ' active' : ''}`;
      btn.textContent = i;
      btn.onclick = () => this.goToPage(i);
      btnsEl.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'page-btn';
    next.textContent = '›';
    next.disabled = this.currentPage === totalPages || totalPages === 0;
    next.onclick = () => this.goToPage(this.currentPage + 1);
    btnsEl.appendChild(next);
  },

  goToPage(n) {
    this.currentPage = n;
    this.renderTable();
    document.getElementById('records-table').scrollIntoView({ behavior:'smooth', block:'start' });
  },
};

/* ============================================================
   DRAWER ENGINE — Slide-in patient detail panel
============================================================ */
const DrawerEngine = {
  open(patientId) {
    const p = TableEngine.allData.find(x => x.id === patientId);
    if (!p) return;

    document.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
    const row = document.getElementById(`row-${patientId}`);
    if (row) row.classList.add('selected');

    document.getElementById('drawer-title').textContent = p.name;
    this._populate(p);
    document.getElementById('drawer-overlay').classList.add('open');
    document.getElementById('drawer').classList.add('open');
  },

  close() {
    document.getElementById('drawer-overlay').classList.remove('open');
    document.getElementById('drawer').classList.remove('open');
    document.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
  },

  _populate(p) {
    const risks    = p.risks;
    const level    = p.overallRisk;
    const rs       = Risk.styles(level === 'high' ? 75 : level === 'medium' ? 50 : 20);
    const initials = ClinicalUtils.initials(p.name);
    const bmi      = ClinicalUtils.bmi(p.weight, p.height);

    document.getElementById('drawer-body').innerHTML = `
      <div class="drawer-patient-hero">
        <div class="drawer-avatar">${initials}</div>
        <div>
          <div class="drawer-patient-name">${p.name}</div>
          <div class="drawer-patient-id">${p.id}</div>
          <div style="margin-top:6px;">
            <span class="risk-badge" style="color:${rs.color};background:${rs.bg};border:1px solid ${rs.border};">
              ${level.toUpperCase()} OVERALL RISK
            </span>
          </div>
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Demographics</div>
        <div class="drawer-row"><span class="drawer-key">Age</span><span class="drawer-value">${p.age} years</span></div>
        <div class="drawer-row"><span class="drawer-key">Gender</span><span class="drawer-value">${p.gender==='M'?'Male':'Female'}</span></div>
        <div class="drawer-row"><span class="drawer-key">Weight</span><span class="drawer-value">${p.weight} kg</span></div>
        <div class="drawer-row"><span class="drawer-key">Height</span><span class="drawer-value">${p.height} cm</span></div>
        <div class="drawer-row"><span class="drawer-key">BMI</span><span class="drawer-value">${bmi}</span></div>
        <div class="drawer-row"><span class="drawer-key">Smoking</span><span class="drawer-value">${p.smoking}</span></div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Clinical Values</div>
        <div class="drawer-row"><span class="drawer-key">HbA1c</span><span class="drawer-value">${p.hba1c}%</span></div>
        <div class="drawer-row"><span class="drawer-key">Fasting Glucose</span><span class="drawer-value">${p.fasting} mg/dL</span></div>
        <div class="drawer-row"><span class="drawer-key">Systolic BP</span><span class="drawer-value">${p.sbp} mmHg</span></div>
        <div class="drawer-row"><span class="drawer-key">Diastolic BP</span><span class="drawer-value">${p.dbp} mmHg</span></div>
        <div class="drawer-row"><span class="drawer-key">Heart Rate</span><span class="drawer-value">${p.hr} bpm</span></div>
        <div class="drawer-row"><span class="drawer-key">LDL</span><span class="drawer-value">${p.ldl} mg/dL</span></div>
        <div class="drawer-row"><span class="drawer-key">Creatinine</span><span class="drawer-value">${p.creatinine} mg/dL</span></div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Risk Scores</div>
        <div class="drawer-risks">
          ${[
            { label:'Hypoglycemia',   score:risks.hypoglycemia   },
            { label:'Cardiovascular', score:risks.cardiovascular },
            { label:'Blood Pressure', score:risks.bloodpressure  },
            { label:'Polypharmacy',   score:risks.polypharmacy   },
          ].map(r => {
            const c = Risk.color(r.score);
            return `
              <div class="drawer-risk-item">
                <div class="drawer-risk-label">${r.label}</div>
                <div class="drawer-risk-score" style="color:${c};">${r.score}</div>
                <div class="drawer-risk-bar">
                  <div class="drawer-risk-fill" style="width:${r.score}%;background:${c};"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Medications (${p.meds.length})</div>
        <div style="padding:12px;display:flex;flex-wrap:wrap;gap:5px;">
          ${p.meds.map(m => `<span style="padding:3px 9px;border-radius:20px;background:rgba(45,125,210,0.1);border:1px solid rgba(45,125,210,0.25);font-family:var(--font-mono);font-size:10px;color:var(--accent-light);">${m}</span>`).join('')}
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Functional Status</div>
        <div class="drawer-row"><span class="drawer-key">Mobility</span><span class="drawer-value">${p.mobility}</span></div>
        <div class="drawer-row"><span class="drawer-key">Cognitive</span><span class="drawer-value">${p.cognitive}</span></div>
        <div class="drawer-row"><span class="drawer-key">Falls (12 mo)</span><span class="drawer-value">${p.falls}</span></div>
        <div class="drawer-row"><span class="drawer-key">Adherence</span><span class="drawer-value">${p.adherence}</span></div>
      </div>

      <div class="drawer-actions">
        <button class="drawer-action-btn dab-primary" onclick="window.location.href=APP.routes.dashboard">
          Open Risk Dashboard →
        </button>
        <button class="drawer-action-btn dab-secondary" onclick="window.location.href=APP.routes.recommendations">
          View Recommendations
        </button>
      </div>
    `;
  },
};

const RecordsAPI = {
  async loadPatients() {
    const response = await fetch(APP.api.patientRecords, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load patient records (${response.status})`);
    }

    const payload = await response.json();
    return payload.patients || [];
  },
};

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  Clock.start();

  try {
    const patients = await RecordsAPI.loadPatients();
    TableEngine.allData = patients;
    TableEngine.filteredData = [...patients];
    TableEngine._sortData();
    StatsEngine.render(patients);
    TableEngine.renderTable();
  } catch (error) {
    console.error(error);
    StatsEngine.render([]);
    document.getElementById('table-body').innerHTML =
      '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚠️</div><div>Unable to load patient records right now</div></div></td></tr>';
    Toast.show('Failed to load patient records', 'error');
  }

  /* Set default sort arrow */
  const arrow = document.getElementById('arrow-date');
  if (arrow) { arrow.textContent = '↓'; arrow.closest('th').classList.add('sorted'); }
});
