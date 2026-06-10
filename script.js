'use strict';

/* ══════════════════════════════════════════════════════
   STRETCH FILM CALCULATOR PRO — script.js
   ES6 Modular Architecture | Single Responsibility Principle
   ══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────
   UTILITY MODULE — pure helper functions, no side effects
   ───────────────────────────────────────────────────── */
const Utils = (() => {
  const $ = id => document.getElementById(id);

  const parseNum = val => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const getVal = id => {
    const el = $(id);
    return el ? parseNum(el.value) : 0;
  };

  const setResult = (id, value, decimals = 3) => {
    const el = $(id);
    if (!el) return;
    if (value > 0 && isFinite(value)) {
      el.textContent = value.toFixed(decimals);
      el.dataset.hasValue = 'true';
      el.style.color = '';
    } else {
      el.textContent = '—';
      el.dataset.hasValue = 'false';
    }
  };

  const clearResults = (...ids) => {
    ids.forEach(id => {
      const el = $(id);
      if (el) { el.textContent = '—'; el.dataset.hasValue = 'false'; }
    });
  };

  const clearInputs = (...ids) => {
    ids.forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
  };

  const bindInputs = (ids, handler) => {
    ids.forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('input', handler);
    });
  };

  const bindClick = (id, handler) => {
    const el = $(id);
    if (el) el.addEventListener('click', handler);
  };

  return { $, parseNum, getVal, setResult, clearResults, clearInputs, bindInputs, bindClick };
})();


/* ─────────────────────────────────────────────────────
   TAB MANAGER — handles tab switching only
   ───────────────────────────────────────────────────── */
class TabManager {
  constructor() {
    this.buttons = document.querySelectorAll('.tab-btn');
    this.panels  = document.querySelectorAll('.tab-panel');
    this._init();
  }

  _init() {
    this.buttons.forEach(btn =>
      btn.addEventListener('click', () => this._switchTo(btn.dataset.tab))
    );
  }

  _switchTo(tabId) {
    this.buttons.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
      b.setAttribute('aria-selected', b.dataset.tab === tabId ? 'true' : 'false');
    });
    this.panels.forEach(p =>
      p.classList.toggle('active', p.id === `panel-${tabId}`)
    );
  }
}


/* ─────────────────────────────────────────────────────
   MODULE 1 — WEIGHT CALCULATOR
   Formula:
     NETWEIGHT  = (T/1000) × (W/1000) × L × ρ
     GROSSWEIGHT = NETWEIGHT + COREWEIGHT
     UPPER/LOWER = WEIGHT × (1 ± TOL/100)
   Units: T→mm, W→mm, L→m, ρ→kg/m³, results→kg
   ───────────────────────────────────────────────────── */
class WeightCalculator {
  static #INPUTS  = ['w-thickness','w-width','w-length','w-coreweight','w-density','w-upper-tol','w-lower-tol'];
  static #RESULTS = ['w-netweight','w-grossweight','w-upper-netweight','w-lower-netweight','w-upper-grossweight','w-lower-grossweight'];

  constructor() {
    Utils.bindInputs(WeightCalculator.#INPUTS, () => this.calculate());
    Utils.bindClick('w-clear', () => this.clear());
  }

  calculate() {
    const t_um = Utils.getVal('w-thickness');   // µm
    const w_mm = Utils.getVal('w-width');       // mm
    const l_m  = Utils.getVal('w-length');      // m
    const cw = Utils.getVal('w-coreweight');  // kg
    const rho_gpm3 = Utils.getVal('w-density'); // g/m³
    const ut = Utils.getVal('w-upper-tol');   // %
    const lt = Utils.getVal('w-lower-tol');   // %

    if (t_um <= 0 || w_mm <= 0 || l_m <= 0 || rho_gpm3 <= 0) {
      Utils.clearResults(...WeightCalculator.#RESULTS);
      return;
    }

    const net = (t_um * w_mm * l_m * rho_gpm3) / 1_000_000; // kg
    const gross = net + cw;

    Utils.setResult('w-netweight',          net,                        3);
    Utils.setResult('w-grossweight',        gross,                      3);
    Utils.setResult('w-upper-netweight',    net   * (1 + ut / 100),     3);
    Utils.setResult('w-lower-netweight',    net   * (1 - lt / 100),     3);
    Utils.setResult('w-upper-grossweight',  gross * (1 + ut / 100),     3);
    Utils.setResult('w-lower-grossweight',  gross * (1 - lt / 100),     3);
  }

  clear() {
    Utils.clearInputs(...WeightCalculator.#INPUTS);
    Utils.clearResults(...WeightCalculator.#RESULTS);
  }
}


/* ─────────────────────────────────────────────────────
   MODULE 2 — ROLL DIAMETER CALCULATOR
   Formula:
     OD = 2 × √[ (T_mm × L_mm) / π  +  (coreID/2 + coreThick)² ]
   Units: T→mm, L→m (converted ×1000), coreID→mm, coreThick→mm
   Output: OD in mm
   ───────────────────────────────────────────────────── */
class RollDiameterCalculator {
  static #INPUTS = ['rd-thickness','rd-length','rd-coreid','rd-corethick'];

  constructor() {
    Utils.bindInputs(RollDiameterCalculator.#INPUTS, () => this.calculate());
    Utils.bindClick('rd-clear', () => this.clear());
  }

  calculate() {
    const t_um = Utils.getVal('rd-thickness');   // µm
    const l_m  = Utils.getVal('rd-length');      // m
    const ci   = Utils.getVal('rd-coreid');      // mm
    const ct   = Utils.getVal('rd-corethick');   // mm

    if (t_um <= 0 || l_m <= 0) {
      Utils.clearResults('rd-diameter');
      return;
    }

    const t_mm = t_um / 1000;                   // convert µm → mm
    const length_mm = l_m * 1000;
    const coreRadius = (ci / 2) + ct;
    const diameter = 2 * Math.sqrt((t_mm * length_mm) / Math.PI + Math.pow(coreRadius, 2));
    Utils.setResult('rd-diameter', diameter, 2);
  }

  clear() {
    Utils.clearInputs(...RollDiameterCalculator.#INPUTS);
    Utils.clearResults('rd-diameter');
  }
}


/* ─────────────────────────────────────────────────────
   MODULE 3 — FILM LENGTH FROM DIAMETER (Geometric)
   Formula:
     L_mm = (π / T_mm) × ( (OD/2)² − ((coreID + coreThick×2)/2)² )
     L_m  = L_mm / 1000
   Units: all in mm; output in both mm and m
   ───────────────────────────────────────────────────── */
class FilmLengthGeoCalculator {
  static #INPUTS = ['fg-thickness','fg-rolldiameter','fg-coreid','fg-corethick'];

  constructor() {
    Utils.bindInputs(FilmLengthGeoCalculator.#INPUTS, () => this.calculate());
    Utils.bindClick('fg-clear', () => this.clear());
  }

  calculate() {
    const t_um = Utils.getVal('fg-thickness');    // µm
    const od   = Utils.getVal('fg-rolldiameter'); // mm
    const ci   = Utils.getVal('fg-coreid');       // mm
    const ct   = Utils.getVal('fg-corethick');    // mm

    if (t_um <= 0 || od <= 0) {
      Utils.clearResults('fg-length-m', 'fg-length-mm');
      return;
    }

    const t_mm = t_um / 1000;
    const outerR = od / 2;
    const innerR = (ci + ct * 2) / 2;
    const lengthMm = (Math.PI / t_mm) * (Math.pow(outerR, 2) - Math.pow(innerR, 2));
    const lengthM = lengthMm / 1000;
    Utils.setResult('fg-length-m', lengthM, 2);
    Utils.setResult('fg-length-mm', lengthMm, 0);
  }

  clear() {
    Utils.clearInputs(...FilmLengthGeoCalculator.#INPUTS);
    Utils.clearResults('fg-length-m', 'fg-length-mm');
  }
}


/* ─────────────────────────────────────────────────────
   MODULE 4 — FILM LENGTH FROM WEIGHT
   Formula:
     FILMNETWEIGHT = ROLLWEIGHT − COREWEIGHT
     FILMLENGTH    = FILMNETWEIGHT / ((T/1000) × (W/1000) × ρ)
   Units: T→mm, W→mm, ρ→kg/m³, weights→kg; output→m
   ───────────────────────────────────────────────────── */
class FilmLengthWeightCalculator {
  static #INPUTS = ['fw-rollweight','fw-coreweight','fw-thickness','fw-width','fw-density'];

  constructor() {
    Utils.bindInputs(FilmLengthWeightCalculator.#INPUTS, () => this.calculate());
    Utils.bindClick('fw-clear', () => this.clear());
  }

  calculate() {
    const rw     = Utils.getVal('fw-rollweight');   // kg
    const cw     = Utils.getVal('fw-coreweight');   // kg
    const t_um   = Utils.getVal('fw-thickness');    // µm
    const w_mm   = Utils.getVal('fw-width');        // mm
    const rho_gpm3 = Utils.getVal('fw-density');    // g/m³

    const netWeight = rw - cw;
    if (rw > 0) Utils.setResult('fw-netweight', netWeight, 3);
    else Utils.clearResults('fw-netweight');

    if (t_um <= 0 || w_mm <= 0 || rho_gpm3 <= 0 || netWeight <= 0) {
      Utils.clearResults('fw-length');
      return;
    }

    const length = (netWeight * 1_000_000) / (t_um * w_mm * rho_gpm3);
    Utils.setResult('fw-length', length, 2);
  }

    clear() {
      Utils.clearInputs(...FilmLengthWeightCalculator.#INPUTS);
      Utils.clearResults('fw-netweight', 'fw-length');
    }
  }


/* ─────────────────────────────────────────────────────
   MODULE 5 — DECELERATION DISTANCE CALCULATOR
   Base formulas:
     v_ms  = v_kmh × 1000 / 3600
     dist  = v_ms² / (2 × G × 9.81)
     time  = v_ms / (G × 9.81)
   Velocity increase rows:
     newVel  = (1 + pct/100) × baseVel_kmh
     newDist = (1 + pct/100)² × baseDist
   ───────────────────────────────────────────────────── */
class DecelerationCalculator {
  #baseVelocityKmh = 0;
  #baseDistM       = 0;

  constructor() {
    Utils.bindInputs(['dc-velocity','dc-gvalue'], () => this.calculate());
    Utils.bindClick('dc-add-row', () => this.addRow());
    Utils.bindClick('dc-clear',   () => this.clear());
  }

  calculate() {
    const vKmh = Utils.getVal('dc-velocity');
    const G    = Utils.getVal('dc-gvalue');

    if (vKmh <= 0 || G <= 0) {
      Utils.clearResults('dc-velocity-ms','dc-dist','dc-time');
      this.#baseVelocityKmh = 0;
      this.#baseDistM = 0;
      this._updateAllRows();
      return;
    }

    const vMs = vKmh * 1000 / 3600;
    const dist = Math.pow(vMs, 2) / (2 * G * 9.81);
    const time = vMs / (G * 9.81);

    this.#baseVelocityKmh = vKmh;
    this.#baseDistM       = dist;

    Utils.setResult('dc-velocity-ms', vMs,  3);
    Utils.setResult('dc-dist',        dist, 2);
    Utils.setResult('dc-time',        time, 2);

    this._updateAllRows();
  }

  _updateAllRows() {
    document.querySelectorAll('.dc-row').forEach(row => this._calcRow(row));
  }

  _calcRow(row) {
    const pctInput = row.querySelector('.dc-pct');
    const velOut   = row.querySelector('.dc-vel-out');
    const distOut  = row.querySelector('.dc-dist-out');
    const pct      = Utils.parseNum(pctInput?.value);

    if (pct > 0 && this.#baseVelocityKmh > 0 && this.#baseDistM > 0) {
      const factor  = 1 + pct / 100;
      const newVel  = factor * this.#baseVelocityKmh;
      const newDist = Math.pow(factor, 2) * this.#baseDistM;
      if (velOut)  velOut.textContent  = newVel.toFixed(2);
      if (distOut) distOut.textContent = newDist.toFixed(2);
      velOut?.classList.add('has-value');
      distOut?.classList.add('has-value');
    } else {
      if (velOut)  velOut.textContent  = '—';
      if (distOut) distOut.textContent = '—';
    }
  }

  addRow() {
    const tbody = Utils.$('dc-table-body');
    const hint  = Utils.$('dc-table-hint');
    if (!tbody) return;

    const rowCount = tbody.querySelectorAll('.dc-row').length;
    if (rowCount >= 10) return;

    const row = document.createElement('tr');
    row.className = 'dc-row';
    row.innerHTML = `
      <td style="color:var(--text-muted);font-size:0.75rem;">${rowCount + 1}</td>
      <td><input type="number" class="dc-pct table-input" placeholder="%" min="0" max="500" step="1"></td>
      <td class="dc-vel-out result-cell">—</td>
      <td class="dc-dist-out result-cell">—</td>
      <td><button class="btn-remove-row" title="Remove row">✕</button></td>
    `;

    row.querySelector('.dc-pct').addEventListener('input', () => this._calcRow(row));
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      row.remove();
      this._renumber('dc-table-body');
      if (hint && !tbody.querySelector('.dc-row')) hint.classList.remove('hidden');
    });

    tbody.appendChild(row);
    if (hint) hint.classList.add('hidden');
  }

  _renumber(tbodyId) {
    const tbody = Utils.$(tbodyId);
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach((row, i) => {
      const cell = row.querySelector('td:first-child');
      if (cell) cell.textContent = i + 1;
    });
  }

  clear() {
    const vel = Utils.$('dc-velocity'), g = Utils.$('dc-gvalue');
    if (vel) vel.value = '';
    if (g)   g.value   = '';
    this.#baseVelocityKmh = 0;
    this.#baseDistM = 0;
    Utils.clearResults('dc-velocity-ms','dc-dist','dc-time');
    const tbody = Utils.$('dc-table-body');
    if (tbody) tbody.querySelectorAll('.dc-row').forEach(r => r.remove());
    const hint = Utils.$('dc-table-hint');
    if (hint) hint.classList.remove('hidden');
  }
}


/* ─────────────────────────────────────────────────────
   MODULE 6 — WRAPPING SPEED CALCULATOR
   Formula:
     ω (rad/s) = 2π × RPM / 60
     v (m/s)   = ω × radius
   ───────────────────────────────────────────────────── */
class WrappingSpeedCalculator {
  constructor() {
    Utils.bindInputs(['ws-rpm','ws-radius'], () => this.calculate());
    Utils.bindClick('ws-clear', () => this.clear());
  }

  calculate() {
    const rpm    = Utils.getVal('ws-rpm');    // rev/min
    const radius = Utils.getVal('ws-radius'); // m

    if (rpm <= 0) {
      Utils.clearResults('ws-angular','ws-velocity');
      return;
    }

    const omega = (2 * Math.PI * rpm) / 60;
    Utils.setResult('ws-angular', omega, 4);

    if (radius > 0) {
      Utils.setResult('ws-velocity', omega * radius, 3);
    } else {
      Utils.clearResults('ws-velocity');
    }
  }

  clear() {
    Utils.clearInputs('ws-rpm','ws-radius');
    Utils.clearResults('ws-angular','ws-velocity');
  }
}


/* ─────────────────────────────────────────────────────
   MODULE 7 — TESTING HEIGHT CALCULATOR
   Formula:
     h = L × sin( arctan(G) )
   Units: L→cm, G→dimensionless, h→cm
   ───────────────────────────────────────────────────── */
class TestingHeightCalculator {
  constructor() {
    Utils.bindInputs(['th-length','th-gforce'], () => this.calculate());
    Utils.bindClick('th-clear', () => this.clear());
  }

  calculate() {
    const L = Utils.getVal('th-length');  // cm
    const G = Utils.getVal('th-gforce'); // dimensionless

    if (L <= 0 || G <= 0) {
      Utils.clearResults('th-height');
      return;
    }

    const height = L * Math.sin(Math.atan(G));
    Utils.setResult('th-height', height, 2);
  }

  clear() {
    Utils.clearInputs('th-length','th-gforce');
    Utils.clearResults('th-height');
  }
}


/* ─────────────────────────────────────────────────────
   MODULE 8 — COEFFICIENT OF FRICTION CALCULATOR
   Formula:
     µ = tan( arcsin( h / L ) )
   Dynamic table: up to 8 test rows
   Statistics: count, average, min, max µ
   ───────────────────────────────────────────────────── */
class FrictionCalculator {
  constructor() {
    Utils.bindClick('cof-add-row', () => this.addRow());
    Utils.bindClick('cof-clear',   () => this.reset());
    // Start with 3 default rows
    this.addRow();
    this.addRow();
    this.addRow();
  }

  addRow() {
    const tbody = Utils.$('cof-table-body');
    if (!tbody) return;

    const rowCount = tbody.querySelectorAll('.cof-row').length;
    if (rowCount >= 8) return;

    const row = document.createElement('tr');
    row.className = 'cof-row';
    row.innerHTML = `
      <td style="color:var(--text-muted);font-size:0.75rem;">${rowCount + 1}</td>
      <td><input type="number" class="cof-length table-input" placeholder="cm" min="0" step="0.1"></td>
      <td><input type="number" class="cof-height table-input" placeholder="cm" min="0" step="0.1"></td>
      <td class="cof-result result-cell">—</td>
      <td><button class="btn-remove-row" title="Remove row">✕</button></td>
    `;

    row.querySelector('.cof-length').addEventListener('input', () => {
      this._calcRow(row);
      this._updateStats();
    });
    row.querySelector('.cof-height').addEventListener('input', () => {
      this._calcRow(row);
      this._updateStats();
    });
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      row.remove();
      this._renumberRows();
      this._updateStats();
    });

    tbody.appendChild(row);
  }

  _calcRow(row) {
    const L      = Utils.parseNum(row.querySelector('.cof-length')?.value);
    const h      = Utils.parseNum(row.querySelector('.cof-height')?.value);
    const cell   = row.querySelector('.cof-result');
    if (!cell) return;

    if (L > 0 && h > 0 && h <= L) {
      const mu = Math.tan(Math.asin(h / L));
      cell.textContent = mu.toFixed(4);
      row.dataset.mu = mu;
    } else {
      cell.textContent = '—';
      delete row.dataset.mu;
    }
  }

  _updateStats() {
    const rows  = document.querySelectorAll('.cof-row');
    const vals  = [];

    rows.forEach(row => {
      if (row.dataset.mu) vals.push(parseFloat(row.dataset.mu));
    });

    const countEl = Utils.$('cof-count');
    const avgEl   = Utils.$('cof-avg');
    const minEl   = Utils.$('cof-min');
    const maxEl   = Utils.$('cof-max');

    if (countEl) countEl.textContent = vals.length;

    if (vals.length === 0) {
      if (avgEl) avgEl.textContent = '—';
      if (minEl) minEl.textContent = '—';
      if (maxEl) maxEl.textContent = '—';
      return;
    }

    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    if (avgEl) avgEl.textContent = avg.toFixed(4);
    if (minEl) minEl.textContent = min.toFixed(4);
    if (maxEl) maxEl.textContent = max.toFixed(4);
  }

  _renumberRows() {
    document.querySelectorAll('.cof-row').forEach((row, i) => {
      const cell = row.querySelector('td:first-child');
      if (cell) cell.textContent = i + 1;
    });
  }

  reset() {
    const tbody = Utils.$('cof-table-body');
    if (tbody) tbody.querySelectorAll('.cof-row').forEach(r => r.remove());
    this._updateStats();
    // Restore 3 fresh rows
    this.addRow();
    this.addRow();
    this.addRow();
  }
}

/* ─────────────────────────────────────────────────────
   MODULE 9 — PRE‑STRETCH ANALYSIS (Comparison Table)
   ───────────────────────────────────────────────────── */
class PreStretchCalculator {
  constructor() {
    this.columnCount = 1;        // Start with only Reference column
    this.rows = this._defineRows();
    this.initTable();
    this.bindEvents();
  }

  _defineRows() {
    return [
      { param: 'Film Thickness', unit: 'µm', key: 'thickness', isInput: true, defaultVal: '' },
      { param: 'Film Width', unit: 'mm', key: 'width', isInput: true, defaultVal: '' },
      { param: 'Film Length (Roll)', unit: 'm', key: 'rollLength', isInput: true, defaultVal: '' },
      { param: 'Film Density', unit: 'g/cm³', key: 'density', isInput: true, defaultVal: '' },
      { param: 'Total Revolution', unit: '', key: 'revolution', isInput: true, defaultVal: '' },
      { param: 'Film Usage Weight per Pallet', unit: 'kg', key: 'usageWeight', isInput: true, defaultVal: '' },
      { param: 'Load Unit Length', unit: 'm', key: 'loadLength', isInput: true, defaultVal: '' },
      { param: 'Load Unit Width', unit: 'm', key: 'loadWidth', isInput: true, defaultVal: '' },
      { param: 'Price Per Roll', unit: '', key: 'priceRoll', isInput: true, defaultVal: '', isCurrency: true },
      { param: 'Total Perimeter', unit: 'm', key: 'perimeter', isInput: false },
      { param: 'Film Length (no pre-stretch)', unit: 'm', key: 'lenNoStretch', isInput: false },
      { param: 'Actual Film Length per Pallet', unit: 'm', key: 'actualLen', isInput: false },
      { param: 'Calculated Weight (no pre-stretch)', unit: 'kg', key: 'calcWeight', isInput: false },
      { param: 'Actual Pre-Stretch', unit: '%', key: 'preStretch', isInput: false },
      { param: 'Price of Film Usage (Per Pallet)', unit: '', key: 'pricePerPallet', isInput: false }
    ];
  }

  initTable() {
    const tbody = document.getElementById('ps-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    this.rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      // Parameter & Unit columns
      const tdParam = document.createElement('td');
      tdParam.textContent = row.param;
      const tdUnit = document.createElement('td');
      tdUnit.textContent = row.unit;
      tr.appendChild(tdParam);
      tr.appendChild(tdUnit);
      // Data columns (only Reference initially)
      for (let col = 0; col < this.columnCount; col++) {
        const td = this._createCell(row, col);
        tr.appendChild(td);
      }
      // Action column (empty)
      const tdAction = document.createElement('td');
      tr.appendChild(tdAction);
      tbody.appendChild(tr);
    });
    this.renderHeader();
    this.calculateAll();
  }

  _createCell(row, col) {
    const td = document.createElement('td');
    td.className = 'ps-col';
    if (row.isInput) {
      if (row.isCurrency) {
        // Dropdown for currency selection
        const select = document.createElement('select');
        select.className = 'ps-input-select';
        select.innerHTML = `<option value="USD">USD</option>
                            <option value="MYR">MYR</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>`;
        select.dataset.rowKey = row.key;
        select.dataset.col = col;
        select.addEventListener('change', () => this.calculateAll());
        td.appendChild(select);
        // Also store numeric value in a hidden input? We'll use a separate input for amount.
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.className = 'ps-input';
        amountInput.placeholder = 'Amount';
        amountInput.step = 'any';
        amountInput.value = '';
        amountInput.dataset.rowKey = row.key;
        amountInput.dataset.col = col;
        amountInput.addEventListener('input', () => this.calculateAll());
        td.appendChild(amountInput);
        // Store reference to both for later retrieval
        td.dataset.currencySelect = true;
      } else {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'ps-input';
        input.step = row.key === 'density' ? '0.001' : 'any';
        input.value = row.defaultVal;
        input.dataset.rowKey = row.key;
        input.dataset.col = col;
        input.addEventListener('input', () => this.calculateAll());
        // Tab index: we will manage via JS later – default DOM order is fine but we need to ensure within column.
        // To make Tab move within same column, we can add a custom handler, but simpler: rely on natural order if we put all inputs of column in the same DOM sequence.
        td.appendChild(input);
      }
    } else {
      const span = document.createElement('span');
      span.className = 'ps-result';
      span.id = `ps-${row.key}-${col}`;
      span.textContent = '—';
      td.appendChild(span);
    }
    return td;
  }

  renderHeader() {
    const headerRow = document.getElementById('ps-header-row');
    if (!headerRow) return;
    // Clear existing columns after the first two (Parameter, Unit)
    while (headerRow.children.length > 2) {
      headerRow.removeChild(headerRow.lastChild);
    }
    // Add column headers
    for (let i = 0; i < this.columnCount; i++) {
      const th = document.createElement('th');
      th.className = 'ps-col';
      th.textContent = i === 0 ? 'Reference' : `Compare ${i}`;
      if (i >= 1) {
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.className = 'ps-remove-col';
        removeBtn.style.marginLeft = '8px';
        removeBtn.dataset.col = i;
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeColumn(i);
        });
        th.appendChild(removeBtn);
      }
      headerRow.appendChild(th);
    }
    // Add empty header for action column
    const thAction = document.createElement('th');
    thAction.style.width = '40px';
    headerRow.appendChild(thAction);
  }

  addColumn() {
    if (this.columnCount >= 8) {
      alert('Maximum 8 comparison columns allowed.');
      return;
    }
    const newColIndex = this.columnCount;
    this.columnCount++;
    // Add new cells to each row
    const tbody = document.getElementById('ps-body');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, rowIdx) => {
      const rowDef = this.rows[rowIdx];
      const td = this._createCell(rowDef, newColIndex);
      // Insert before the last cell (action column)
      row.insertBefore(td, row.lastChild);
    });
    this.renderHeader();
    this.reindexInputs();
    this.calculateAll();
  }

  removeColumn(colIdx) {
    if (this.columnCount <= 1) {
      alert('Cannot remove the reference column.');
      return;
    }
    // Remove data cells from each row
    const tbody = document.getElementById('ps-body');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('.ps-col');
      if (cells[colIdx]) cells[colIdx].remove();
    });
    this.columnCount--;
    this.renderHeader();
    this.reindexInputs();
    this.calculateAll();
  }

  reindexInputs() {
    const tbody = document.getElementById('ps-body');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, rowIdx) => {
      const inputs = row.querySelectorAll('.ps-input');
      inputs.forEach((input, colIdx) => {
        input.dataset.col = colIdx;
      });
      const selectors = row.querySelectorAll('.ps-input-select');
      selectors.forEach((sel, colIdx) => {
        sel.dataset.col = colIdx;
      });
      const results = row.querySelectorAll('.ps-result');
      results.forEach((span, colIdx) => {
        const key = this.rows[rowIdx].key;
        span.id = `ps-${key}-${colIdx}`;
      });
    });
  }

  calculateAll() {
    for (let col = 0; col < this.columnCount; col++) {
      this.calculateColumn(col);
    }
  }

  calculateColumn(col) {
    // Helper to get numeric input value (including currency amount)
    const getNumeric = (key) => {
      const input = document.querySelector(`.ps-input[data-row-key="${key}"][data-col="${col}"]`);
      if (!input) return 0;
      let val = parseFloat(input.value);
      return isNaN(val) ? 0 : val;
    };
    // For price per roll, we need both currency and amount. For now, we only need numeric amount.
    const thickness_um = getNumeric('thickness');
    const width_mm = getNumeric('width');
    const rollLength_m = getNumeric('rollLength');
    const density_gcm3 = getNumeric('density');
    const revolution = getNumeric('revolution');
    const usageWeight_kg = getNumeric('usageWeight');
    const loadLength_m = getNumeric('loadLength');
    const loadWidth_m = getNumeric('loadWidth');
    const priceRoll = getNumeric('priceRoll');  // numeric amount

    // Total Perimeter
    const perimeter_m = 2 * (loadLength_m + loadWidth_m);
    this.setResult(col, 'perimeter', perimeter_m, 3);

    // Actual Film Length per Pallet
    const actualLen_m = revolution * perimeter_m;
    this.setResult(col, 'actualLen', actualLen_m, 3);

    // Film Length (no pre-stretch)
    let lenNoStretch_m = 0;
    if (density_gcm3 > 0 && thickness_um > 0 && width_mm > 0 && usageWeight_kg > 0) {
      lenNoStretch_m = (usageWeight_kg * 1e6) / (density_gcm3 * thickness_um * width_mm);
    }
    this.setResult(col, 'lenNoStretch', lenNoStretch_m, 2);

    // Calculated Weight (no pre-stretch)
    let calcWeight_kg = 0;
    if (thickness_um > 0 && width_mm > 0 && actualLen_m > 0 && density_gcm3 > 0) {
      calcWeight_kg = (thickness_um * width_mm * actualLen_m * density_gcm3) / 1e6;
    }
    this.setResult(col, 'calcWeight', calcWeight_kg, 3);

    // Actual Pre-Stretch %
    let preStretch = 0;
    if (usageWeight_kg > 0) {
      preStretch = ((calcWeight_kg - usageWeight_kg) / usageWeight_kg) * 100;
    }
    this.setResult(col, 'preStretch', preStretch, 2);

    // Price of Film Usage per Pallet (currency is displayed but not converted; just numeric)
    let pricePerPallet = 0;
    if (rollLength_m > 0 && priceRoll > 0 && lenNoStretch_m > 0) {
      pricePerPallet = (priceRoll / rollLength_m) * lenNoStretch_m;
    }
    this.setResult(col, 'pricePerPallet', pricePerPallet, 2);
  }

  setResult(col, key, value, decimals) {
    const span = document.getElementById(`ps-${key}-${col}`);
    if (!span) return;
    if (value > 0 && isFinite(value)) {
      span.textContent = value.toFixed(decimals);
    } else {
      span.textContent = '—';
    }
  }

  bindEvents() {
    const addBtn = document.getElementById('ps-add-column');
    if (addBtn) addBtn.addEventListener('click', () => this.addColumn());
    const clearBtn = document.getElementById('ps-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearAll());
  }

  clearAll() {
    const inputs = document.querySelectorAll('#ps-table .ps-input');
    inputs.forEach(input => { input.value = ''; });
    const selects = document.querySelectorAll('#ps-table .ps-input-select');
    selects.forEach(sel => { sel.selectedIndex = 0; });
    this.calculateAll();
  }
}

/* ─────────────────────────────────────────────────────
   MODULE 10 — UNIT CONVERSION
   ───────────────────────────────────────────────────── */
class ConversionCalculator {
  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    // Thickness
    const micronInput = document.getElementById('conv-micron');
    const gaugeInput = document.getElementById('conv-gauge');
    if (micronInput) micronInput.addEventListener('input', () => this.micronToGauge());
    if (gaugeInput) gaugeInput.addEventListener('input', () => this.gaugeToMicron());

    // Length
    const feetInput = document.getElementById('conv-feet');
    const metersInput = document.getElementById('conv-meters');
    if (feetInput) feetInput.addEventListener('input', () => this.feetToMeters());
    if (metersInput) metersInput.addEventListener('input', () => this.metersToFeet());

    // Weight
    const lbInput = document.getElementById('conv-lb');
    const kgInput = document.getElementById('conv-kg');
    if (lbInput) lbInput.addEventListener('input', () => this.lbToKg());
    if (kgInput) kgInput.addEventListener('input', () => this.kgToLb());
  }

  micronToGauge() {
    const micron = parseFloat(document.getElementById('conv-micron').value);
    const gaugeInput = document.getElementById('conv-gauge');
    if (isNaN(micron)) {
      if (gaugeInput) gaugeInput.value = '';
      return;
    }
    const gauge = micron * 3.937;
    if (gaugeInput) gaugeInput.value = gauge.toFixed(2);
  }

  gaugeToMicron() {
    const gauge = parseFloat(document.getElementById('conv-gauge').value);
    const micronInput = document.getElementById('conv-micron');
    if (isNaN(gauge)) {
      if (micronInput) micronInput.value = '';
      return;
    }
    const micron = gauge * 0.254;
    if (micronInput) micronInput.value = micron.toFixed(2);
  }

  feetToMeters() {
    const feet = parseFloat(document.getElementById('conv-feet').value);
    const metersInput = document.getElementById('conv-meters');
    if (isNaN(feet)) {
      if (metersInput) metersInput.value = '';
      return;
    }
    const meters = feet * 0.3048;
    if (metersInput) metersInput.value = meters.toFixed(4);
  }

  metersToFeet() {
    const meters = parseFloat(document.getElementById('conv-meters').value);
    const feetInput = document.getElementById('conv-feet');
    if (isNaN(meters)) {
      if (feetInput) feetInput.value = '';
      return;
    }
    const feet = meters * 3.28084;
    if (feetInput) feetInput.value = feet.toFixed(4);
  }

  lbToKg() {
    const lb = parseFloat(document.getElementById('conv-lb').value);
    const kgInput = document.getElementById('conv-kg');
    if (isNaN(lb)) {
      if (kgInput) kgInput.value = '';
      return;
    }
    const kg = lb * 0.45359237;
    if (kgInput) kgInput.value = kg.toFixed(4);
  }

  kgToLb() {
    const kg = parseFloat(document.getElementById('conv-kg').value);
    const lbInput = document.getElementById('conv-lb');
    if (isNaN(kg)) {
      if (lbInput) lbInput.value = '';
      return;
    }
    const lb = kg / 0.45359237;
    if (lbInput) lbInput.value = lb.toFixed(4);
  }
}


/* ─────────────────────────────────────────────────────
   APP — orchestrates all modules
   ───────────────────────────────────────────────────── */
class App {
  constructor() {
    this.tabManager         = new TabManager();
    this.weightCalc         = new WeightCalculator();
    this.rollDiamCalc       = new RollDiameterCalculator();
    this.filmLengthGeo      = new FilmLengthGeoCalculator();
    this.filmLengthWeight   = new FilmLengthWeightCalculator();
    this.decelCalc          = new DecelerationCalculator();
    this.wrappingSpeed      = new WrappingSpeedCalculator();
    this.testingHeight      = new TestingHeightCalculator();
    this.frictionCalc       = new FrictionCalculator();
    this.prestretchCalc     = new PreStretchCalculator();
    this.conversionCalc     = new ConversionCalculator(); 
  }
}

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => new App());
