/* ============================================================
   TRADE JOURNAL — Application Logic
   ============================================================ */

// ── Initial seed data (parsed from user input) ──────────────
const SEED_DATA = [];

// ── Month order for sorting ─────────────────────────────────
const MONTH_ORDER = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// ── State ───────────────────────────────────────────────────
let DATA = [];
let godMode = false;
let editingId = null;
let deletingId = null;
let pipsChart, tpSlChart, breakdownChart;

// ── LocalStorage helpers ────────────────────────────────────
let STORAGE_KEY = 'trade_journal_v2';

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      DATA = JSON.parse(stored);
    } else {
      DATA = JSON.parse(JSON.stringify(SEED_DATA));
      saveData();
    }
  } catch {
    DATA = JSON.parse(JSON.stringify(SEED_DATA));
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
}

function generateId(month, year) {
  return `${month.toLowerCase()}-${year}-${Date.now()}`;
}

// ── Sorting ─────────────────────────────────────────────────
function sortedData() {
  return [...DATA].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return MONTH_ORDER.indexOf(a.month.toUpperCase()) - MONTH_ORDER.indexOf(b.month.toUpperCase());
  });
}

// ── God Mode ────────────────────────────────────────────────
function toggleGodMode() {
  godMode = !godMode;
  document.body.classList.toggle('god-active', godMode);
  document.getElementById('godLabel').textContent = godMode ? '⚡ GOD MODE' : 'VIEW MODE';
  const addBtn = document.getElementById('addMonthBtn');
  addBtn.style.display = godMode ? 'inline-block' : 'none';
}

// ── Summary Statistics ───────────────────────────────────────
function calcSummary() {
  let totalPips = 0;
  let numericMonths = 0;
  let totalTP = 0, totalSL = 0, totalLA = 0, totalWA = 0;
  let bestPips = -Infinity, bestName = '—';

  DATA.forEach(m => {
    totalTP += m.TP || 0;
    totalSL += m.SL || 0;
    totalLA += m.LA || 0;
    totalWA += m.WA || 0;

    const res = m.result;
    if (res !== null && res !== 'BE' && res !== '') {
      const n = parseFloat(res);
      if (!isNaN(n)) {
        totalPips += n;
        numericMonths++;
        if (n > bestPips) { bestPips = n; bestName = m.month; }
      }
    }
  });

  const trades = totalTP + totalSL;
  const winRate = trades > 0 ? ((totalTP / trades) * 100).toFixed(1) : '—';

  document.getElementById('totalPips').textContent = totalPips >= 0 ? `+${totalPips}` : `${totalPips}`;
  document.getElementById('winRate').textContent = winRate !== '—' ? `${winRate}%` : '—';
  document.getElementById('bestMonth').textContent = bestName;
  document.getElementById('totalTrades').textContent = trades;
  document.getElementById('totalLA').textContent = totalLA;
  document.getElementById('totalWA').textContent = totalWA;
}

// ── Compute max for bar scaling ──────────────────────────────
function maxStat(months, key) {
  return Math.max(...months.map(m => m[key] || 0), 1);
}

// ── Render month cards ───────────────────────────────────────
function renderCards() {
  const grid = document.getElementById('monthGrid');
  grid.innerHTML = '';
  const months = sortedData();
  const maxTP  = maxStat(months, 'TP');
  const maxSL  = maxStat(months, 'SL');
  const maxLA  = maxStat(months, 'LA');
  const maxWA  = maxStat(months, 'WA');
  const maxPTP = maxStat(months, 'PTP');
  const maxPTPA= maxStat(months, 'PTPA');

  months.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'month-card ' + getCardClass(m.result);
    card.style.animationDelay = `${i * 60}ms`;
    card.id = `card-${m.id}`;

    const tp = m.TP || 0, sl = m.SL || 0;
    const trades = tp + sl;
    const wr = trades > 0 ? ((tp / trades) * 100).toFixed(0) : null;
    const wrClass = wr === null ? '' : wr >= 60 ? 'high' : wr >= 40 ? 'mid' : 'low';

    card.innerHTML = `
      <div class="card-actions">
        <button class="btn-edit-card" onclick="openEditMonth('${m.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Edit
        </button>
        <button class="btn-delete-card" onclick="openDeleteModal('${m.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
      </div>
      <div class="card-header">
        <div>
          <div class="card-month-name">${escHtml(m.month.toUpperCase())}</div>
          <div class="card-year">${m.year || ''}</div>
        </div>
        <div class="card-result">
          <span class="result-label">Result</span>
          <span class="result-value ${getResultClass(m.result)}">${formatResult(m.result)}</span>
        </div>
      </div>
      <div class="card-stats">
        ${statCell('TP',   'tp',   tp,   maxTP)}
        ${statCell('SL',   'sl',   sl,   maxSL)}
        ${statCell('PTP',  'ptp',  m.PTP||0, maxPTP)}
        ${statCell('PTPA', 'ptpa', m.PTPA||0, maxPTPA)}
        ${statCell('LA',   'la',   m.LA||0, maxLA)}
        ${statCell('WA',   'wa',   m.WA||0, maxWA)}
      </div>
      <div class="card-footer">
        <div class="win-rate-badge">
          <span>Win Rate</span>
          <span class="win-rate-num ${wrClass}">${wr !== null ? wr + '%' : '—'}</span>
        </div>
        <div class="card-notes" title="${escHtml(m.notes || '')}">${escHtml(m.notes || '&nbsp;')}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function statCell(label, cls, count, max) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return `
    <div class="stat-item">
      <span class="stat-label ${cls}">${label}</span>
      <span class="stat-count">${count}</span>
      <div class="stat-bar"><div class="stat-fill fill-${cls}" style="width:${pct}%"></div></div>
    </div>`;
}

function getCardClass(result) {
  if (result === null || result === '') return 'neutral';
  if (result === 'BE') return 'breakeven';
  const n = parseFloat(result);
  if (isNaN(n)) return 'neutral';
  return n >= 0 ? 'positive' : 'negative';
}

function getResultClass(result) {
  if (result === null || result === '') return 'na';
  if (result === 'BE') return 'be';
  const n = parseFloat(result);
  if (isNaN(n)) return 'na';
  return n >= 0 ? 'pos' : 'neg';
}

function formatResult(result) {
  if (result === null || result === '') return '—';
  if (result === 'BE') return 'BE';
  const n = parseFloat(result);
  if (isNaN(n)) return String(result);
  return n >= 0 ? `+${n}` : `${n}`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Charts ──────────────────────────────────────────────────
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#7986cb', font: { family: 'Inter', size: 11 }, boxWidth: 12 }
    },
    tooltip: {
      backgroundColor: '#1a1f35',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#e8eaf6',
      bodyColor: '#9fa8da'
    }
  },
  scales: {
    x: {
      ticks: { color: '#7986cb', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(255,255,255,0.04)' }
    },
    y: {
      ticks: { color: '#7986cb', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(255,255,255,0.04)' }
    }
  }
};

function initCharts() {
  if (pipsChart) pipsChart.destroy();
  if (tpSlChart) tpSlChart.destroy();
  if (breakdownChart) breakdownChart.destroy();

  const months = sortedData();
  const labels = months.map(m => `${m.month.toUpperCase()}'${String(m.year||'').slice(-2)}`);

  // Pips chart
  const pipsCtx = document.getElementById('pipsChart').getContext('2d');
  const pipsData = months.map(m => {
    if (!m.result || m.result === 'BE') return 0;
    const n = parseFloat(m.result);
    return isNaN(n) ? 0 : n;
  });

  pipsChart = new Chart(pipsCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pips',
        data: pipsData,
        backgroundColor: pipsData.map(v => v >= 0 ? 'rgba(0,230,118,0.5)' : 'rgba(255,82,82,0.5)'),
        borderColor:     pipsData.map(v => v >= 0 ? '#00e676' : '#ff5252'),
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: { ...CHART_DEFAULTS }
  });

  // TP vs SL chart
  const tpSlCtx = document.getElementById('tpSlChart').getContext('2d');
  tpSlChart = new Chart(tpSlCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'TP', data: months.map(m => m.TP||0),
          backgroundColor: 'rgba(0,230,118,0.5)', borderColor: '#00e676',
          borderWidth: 1.5, borderRadius: 4
        },
        {
          label: 'SL', data: months.map(m => m.SL||0),
          backgroundColor: 'rgba(255,82,82,0.5)', borderColor: '#ff5252',
          borderWidth: 1.5, borderRadius: 4
        },
        {
          label: 'PTP', data: months.map(m => m.PTP||0),
          backgroundColor: 'rgba(255,215,64,0.4)', borderColor: '#ffd740',
          borderWidth: 1.5, borderRadius: 4
        }
      ]
    },
    options: { ...CHART_DEFAULTS }
  });

  // Breakdown pie
  const bkCtx = document.getElementById('breakdownChart').getContext('2d');
  const totals = {
    TP: DATA.reduce((s,m)=>s+(m.TP||0),0),
    SL: DATA.reduce((s,m)=>s+(m.SL||0),0),
    PTP: DATA.reduce((s,m)=>s+(m.PTP||0),0),
    PTPA: DATA.reduce((s,m)=>s+(m.PTPA||0),0),
    LA: DATA.reduce((s,m)=>s+(m.LA||0),0),
    WA: DATA.reduce((s,m)=>s+(m.WA||0),0)
  };
  breakdownChart = new Chart(bkCtx, {
    type: 'doughnut',
    data: {
      labels: ['TP','SL','PTP','PTPA','LA','WA'],
      datasets: [{
        data: [totals.TP, totals.SL, totals.PTP, totals.PTPA, totals.LA, totals.WA],
        backgroundColor: [
          'rgba(0,230,118,0.75)','rgba(255,82,82,0.75)',
          'rgba(255,215,64,0.75)','rgba(255,171,64,0.75)',
          'rgba(24,255,255,0.75)','rgba(234,128,252,0.75)'
        ],
        borderColor: '#111827',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#7986cb', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 12 }
        },
        tooltip: CHART_DEFAULTS.plugins.tooltip
      },
      cutout: '60%'
    }
  });
}

function updateCharts() {
  const months = sortedData();
  const labels = months.map(m => `${m.month.toUpperCase()}'${String(m.year||'').slice(-2)}`);

  const pipsData = months.map(m => {
    if (!m.result || m.result === 'BE') return 0;
    const n = parseFloat(m.result);
    return isNaN(n) ? 0 : n;
  });

  pipsChart.data.labels = labels;
  pipsChart.data.datasets[0].data = pipsData;
  pipsChart.data.datasets[0].backgroundColor = pipsData.map(v => v >= 0 ? 'rgba(0,230,118,0.5)' : 'rgba(255,82,82,0.5)');
  pipsChart.data.datasets[0].borderColor     = pipsData.map(v => v >= 0 ? '#00e676' : '#ff5252');
  pipsChart.update();

  tpSlChart.data.labels = labels;
  tpSlChart.data.datasets[0].data = months.map(m => m.TP||0);
  tpSlChart.data.datasets[1].data = months.map(m => m.SL||0);
  tpSlChart.data.datasets[2].data = months.map(m => m.PTP||0);
  tpSlChart.update();

  const totals = {
    TP: DATA.reduce((s,m)=>s+(m.TP||0),0),
    SL: DATA.reduce((s,m)=>s+(m.SL||0),0),
    PTP: DATA.reduce((s,m)=>s+(m.PTP||0),0),
    PTPA: DATA.reduce((s,m)=>s+(m.PTPA||0),0),
    LA: DATA.reduce((s,m)=>s+(m.LA||0),0),
    WA: DATA.reduce((s,m)=>s+(m.WA||0),0)
  };
  breakdownChart.data.datasets[0].data = [totals.TP,totals.SL,totals.PTP,totals.PTPA,totals.LA,totals.WA];
  breakdownChart.update();
}

// ── Full re-render ───────────────────────────────────────────
function render() {
  calcSummary();
  renderCards();
  
  if (DATA.length === 0) {
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('dashboardContent').style.display = 'none';
  } else {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    updateCharts();
  }
}

// ── Modal: Add month ─────────────────────────────────────────
function openAddMonth() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Month';
  clearForm();
  openModal('modalOverlay');
}

// ── Modal: Edit month ────────────────────────────────────────
function openEditMonth(id) {
  if (!godMode) return;
  editingId = id;
  const m = DATA.find(x => x.id === id);
  if (!m) return;

  document.getElementById('modalTitle').textContent = `Edit — ${m.month.toUpperCase()} ${m.year || ''}`;
  document.getElementById('fMonth').value  = m.month || '';
  document.getElementById('fYear').value   = m.year  || '';
  document.getElementById('fTP').value     = m.TP    ?? '';
  document.getElementById('fSL').value     = m.SL    ?? '';
  document.getElementById('fPTP').value    = m.PTP   ?? '';
  document.getElementById('fPTPA').value   = m.PTPA  ?? '';
  document.getElementById('fLA').value     = m.LA    ?? '';
  document.getElementById('fWA').value     = m.WA    ?? '';
  document.getElementById('fResult').value = m.result !== null ? m.result : '';
  document.getElementById('fNotes').value  = m.notes || '';
  openModal('modalOverlay');
}

function clearForm() {
  ['fMonth','fYear','fTP','fSL','fPTP','fPTPA','fLA','fWA','fResult','fNotes']
    .forEach(id => { document.getElementById(id).value = ''; });
}

// ── Save (add or update) ─────────────────────────────────────
function saveMonth() {
  const month  = document.getElementById('fMonth').value.trim().toUpperCase();
  const year   = parseInt(document.getElementById('fYear').value) || new Date().getFullYear();
  const tp     = parseInt(document.getElementById('fTP').value)   || 0;
  const sl     = parseInt(document.getElementById('fSL').value)   || 0;
  const ptp    = parseInt(document.getElementById('fPTP').value)  || 0;
  const ptpa   = parseInt(document.getElementById('fPTPA').value) || 0;
  const la     = parseInt(document.getElementById('fLA').value)   || 0;
  const wa     = parseInt(document.getElementById('fWA').value)   || 0;
  const rawRes = document.getElementById('fResult').value.trim();
  const notes  = document.getElementById('fNotes').value.trim();

  if (!month) { alert('Month name is required.'); return; }

  let result;
  if (!rawRes) result = null;
  else if (rawRes.toUpperCase() === 'BE') result = 'BE';
  else {
    const n = parseFloat(rawRes);
    result = isNaN(n) ? rawRes : n;
  }

  if (editingId) {
    const idx = DATA.findIndex(x => x.id === editingId);
    if (idx !== -1) {
      DATA[idx] = { ...DATA[idx], month, year, TP:tp, SL:sl, PTP:ptp, PTPA:ptpa, LA:la, WA:wa, result, notes };
    }
  } else {
    DATA.push({ id: generateId(month, year), month, year, TP:tp, SL:sl, PTP:ptp, PTPA:ptpa, LA:la, WA:wa, result, notes });
  }

  saveData();
  render();
  closeModalDirect();
}

// ── Delete ───────────────────────────────────────────────────
function openDeleteModal(id) {
  if (!godMode) return;
  deletingId = id;
  const m = DATA.find(x => x.id === id);
  document.getElementById('deleteMonthName').textContent = m ? `${m.month.toUpperCase()} ${m.year || ''}` : id;
  openModal('deleteOverlay');
}

function confirmDelete() {
  DATA = DATA.filter(x => x.id !== deletingId);
  deletingId = null;
  saveData();
  render();
  closeDeleteDirect();
}

// ── Modal helpers ────────────────────────────────────────────
function openModal(overlayId) {
  document.getElementById(overlayId).classList.add('open');
}
function closeModal(e) {
  if (e.target === e.currentTarget) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}
function closeDeleteModal(e) {
  if (e.target === e.currentTarget) closeDeleteDirect();
}
function closeDeleteDirect() {
  document.getElementById('deleteOverlay').classList.remove('open');
  deletingId = null;
}

// ── Keyboard shortcuts ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModalDirect();
    closeDeleteDirect();
  }
  // Ctrl+G = toggle god mode
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
    e.preventDefault();
    toggleGodMode();
  }
});

// ── Auth UI Handlers ─────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  const msg = document.getElementById('authMsg');
  const btn = document.getElementById('loginBtn');
  const text = btn.querySelector('.auth-btn-text');
  const spin = btn.querySelector('.auth-btn-spinner');
  
  try {
    msg.style.display = 'none';
    text.style.display = 'none';
    spin.style.display = 'inline-block';
    
    await window.TJAuth.login(email, pass);
    checkAuth();
  } catch (err) {
    msg.textContent = err.message;
    msg.style.display = 'block';
    msg.style.color = '#ff5252';
  } finally {
    text.style.display = 'inline-block';
    spin.style.display = 'none';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPassword').value;
  const conf = document.getElementById('regConfirm').value;
  const msg = document.getElementById('authMsg');
  const btn = document.getElementById('registerBtn');
  const text = btn.querySelector('.auth-btn-text');
  const spin = btn.querySelector('.auth-btn-spinner');
  
  if (pass !== conf) {
    msg.textContent = 'Passwords do not match.';
    msg.style.display = 'block';
    msg.style.color = '#ff5252';
    return;
  }

  try {
    msg.style.display = 'none';
    text.style.display = 'none';
    spin.style.display = 'inline-block';
    
    await window.TJAuth.register(email, name, pass);
    checkAuth();
  } catch (err) {
    msg.textContent = err.message;
    msg.style.display = 'block';
    msg.style.color = '#ff5252';
  } finally {
    text.style.display = 'inline-block';
    spin.style.display = 'none';
  }
}

function switchTab(tab) {
  document.getElementById('authMsg').style.display = 'none';
  if (tab === 'login') {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('tabLogin').classList.add('active');
    document.getElementById('tabRegister').classList.remove('active');
  } else {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'flex';
    document.getElementById('tabRegister').classList.add('active');
    document.getElementById('tabLogin').classList.remove('active');
  }
}

function togglePwd(id, btn) {
  const input = document.getElementById(id);
  if (input.type === 'password') {
    input.type = 'text';
    btn.style.opacity = '1';
  } else {
    input.type = 'password';
    btn.style.opacity = '0.5';
  }
}

function handleLogout() {
  window.TJAuth.clearSession();
  DATA = [];
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('regName').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('regConfirm').value = '';
  switchTab('login');
}

function checkAuth() {
  const session = window.TJAuth.getSession();
  if (session) {
    document.getElementById('authOverlay').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
    STORAGE_KEY = window.TJAuth.userStorageKey(session.email);
    document.getElementById('userName').textContent = session.displayName;
    document.getElementById('userAvatar').textContent = session.displayName.charAt(0).toUpperCase();
    loadData();
    calcSummary();
    renderCards();
    initCharts();
  } else {
    document.getElementById('authOverlay').style.display = 'flex';
    document.getElementById('appShell').style.display = 'none';
  }
}

// ── Bootstrap ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});
