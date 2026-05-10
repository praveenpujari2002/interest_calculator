// =====================================================
//  INTEREST CALCULATOR – Core Logic
// =====================================================

/* ── Helpers ────────────────────────────────────────── */

/** Format number as Indian currency string */
function fmt(n) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format plain number with 2 decimals */
function fmtN(n, decimals = 4) {
  return Number(n).toFixed(decimals);
}

/**
 * Compute EXACT months between two dates as a decimal.
 * Counts complete months + fractional days.
 */
function exactMonthsBetween(start, end) {
  // Whole months
  let y1 = start.getFullYear(), m1 = start.getMonth(), d1 = start.getDate();
  let y2 = end.getFullYear(),   m2 = end.getMonth(),   d2 = end.getDate();

  let totalMonths = (y2 - y1) * 12 + (m2 - m1);

  // Fractional days: days past d1 in the final partial month
  let dayFraction = 0;
  if (d2 >= d1) {
    dayFraction = (d2 - d1) / daysInMonth(y2, m2);
  } else {
    // We overshot by one month
    totalMonths -= 1;
    const prevMonthDate = new Date(y2, m2 - 1, 1);
    const daysInPrev = daysInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
    dayFraction = (daysInPrev - d1 + d2) / daysInPrev;
  }

  return totalMonths + dayFraction;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/** Format duration nicely */
function formatDuration(exactMonths) {
  const totalDays = Math.round(exactMonths * 30.4375);
  const years = Math.floor(exactMonths / 12);
  const remMonths = exactMonths % 12;
  const wholeM = Math.floor(remMonths);
  const days = Math.round((remMonths - wholeM) * 30.4375);

  let parts = [];
  if (years > 0) parts.push(`${years}y`);
  if (wholeM > 0) parts.push(`${wholeM}m`);
  if (days > 0 && years === 0) parts.push(`${days}d`);
  return parts.join(' ') || '0 days';
}

/* ── Duration badge update on date change ───────────── */

['startDate', 'endDate'].forEach(id => {
  document.getElementById(id).addEventListener('change', updateDurationBadge);
});

function updateDurationBadge() {
  const s = document.getElementById('startDate').value;
  const e = document.getElementById('endDate').value;
  const badge = document.getElementById('durationBadge');
  const text  = document.getElementById('durationText');

  if (!s || !e) { badge.classList.add('hidden'); return; }

  const start = new Date(s), end = new Date(e);
  if (end <= start) { badge.classList.add('hidden'); return; }

  const exact = exactMonthsBetween(start, end);
  const floorM = Math.floor(exact);
  const ceilM  = Math.ceil(exact);
  text.textContent = `${formatDuration(exact)} · Exact ${fmtN(exact,4)} months · Floor ${floorM}m · Ceil ${ceilM}m`;
  badge.classList.remove('hidden');
}

/* ── Main Calculate ─────────────────────────────────── */

function calculate() {
  const errorEl = document.getElementById('errorMsg');
  const resultsEl = document.getElementById('resultsSection');
  errorEl.classList.add('hidden');
  resultsEl.classList.add('hidden');

  // --- Read inputs ---
  const P = parseFloat(document.getElementById('principal').value);
  const annualRate = parseFloat(document.getElementById('rate').value);
  const startVal = document.getElementById('startDate').value;
  const endVal   = document.getElementById('endDate').value;

  // --- Validate ---
  if (!P || P <= 0)          return showError('Please enter a valid principal amount.');
  if (!annualRate || annualRate <= 0) return showError('Please enter a valid interest rate.');
  if (!startVal)             return showError('Please select a start date.');
  if (!endVal)               return showError('Please select an end date.');

  const start = new Date(startVal);
  const end   = new Date(endVal);
  if (end <= start)          return showError('End date must be after start date.');

  // --- Core calculations ---
  const monthlyRate = annualRate / 100;   // input IS monthly rate as decimal
  const exactMonths = exactMonthsBetween(start, end);
  const floorMonths = Math.floor(exactMonths);
  const ceilMonths  = Math.ceil(exactMonths);

  // --- Populate summary ---
  document.getElementById('summaryPrincipal').textContent = fmt(P);
  document.getElementById('summaryRate').textContent = `${annualRate}% /mo`;
  document.getElementById('summaryDuration').textContent = formatDuration(exactMonths);
  document.getElementById('summaryMonthlyRate').textContent = `${fmtN(annualRate * 12, 2)}% /yr`;

  // --- 1. SI Floor ---
  buildSI('si-floor', P, monthlyRate, annualRate, floorMonths, start);

  // --- 2. CI Floor ---
  buildCI('ci-floor', P, monthlyRate, annualRate, floorMonths, start);

  // --- 3. SI Ceil ---
  buildSI('si-ceil', P, monthlyRate, annualRate, ceilMonths, start);

  // --- 4. CI Ceil ---
  buildCI('ci-ceil', P, monthlyRate, annualRate, ceilMonths, start);

  // Show results with animation
  resultsEl.classList.remove('hidden');
  resultsEl.style.animation = 'none';
  void resultsEl.offsetWidth; // reflow
  resultsEl.style.animation = '';
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

/* ── Simple Interest Builder ────────────────────────── */

function buildSI(prefix, P, monthlyRate, annualRate, months, start) {
  const interest = P * monthlyRate * months;
  const total    = P + interest;

  document.getElementById(`pill-${prefix}`).textContent = `${months} months`;
  document.getElementById(`${prefix}-interest`).textContent = fmt(interest);
  document.getElementById(`${prefix}-total`).textContent = fmt(total);

  // Yearly breakdown
  buildSIBreakdown(prefix, P, monthlyRate, annualRate, months);
}

function buildSIBreakdown(prefix, P, monthlyRate, annualRate, months) {
  const container = document.getElementById(`breakdown-${prefix}`);
  container.innerHTML = '';

  if (months === 0) {
    container.innerHTML = '<p style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:12px;">0 months – no interest accrues</p>';
    return;
  }

  const header = document.createElement('div');
  header.className = 'breakdown-header';
  header.textContent = 'Year-by-Year Breakdown  ·  Interest always calculated on original principal';
  container.appendChild(header);

  // 5-column header
  container.appendChild(buildRow(
    ['Period', 'Opening Balance', `Rate × Months`, 'Interest Added', 'Running Total'], true
  ));

  let remainingMonths = months;
  let cumulativeInterest = 0;
  let yearNum = 1;
  let startMonth = 1;

  while (remainingMonths > 0) {
    const periodMonths = Math.min(12, remainingMonths);
    const periodInterest = P * monthlyRate * periodMonths; // SI: always on original principal
    cumulativeInterest += periodInterest;

    const endMonth = startMonth + periodMonths - 1;
    const periodLabel = periodMonths === 12
      ? `Year ${yearNum}`
      : `Year ${yearNum}  (Mo ${startMonth}–${endMonth})`;

    container.appendChild(buildRow([
      periodLabel,
      fmt(P),
      `${fmtN(annualRate, 2)}% × ${periodMonths} mo`,
      `+${fmt(periodInterest)}`,
      fmt(P + cumulativeInterest)
    ], false, false, remainingMonths <= 12));

    remainingMonths -= periodMonths;
    startMonth += periodMonths;
    yearNum++;
  }

  // Grand total
  container.appendChild(buildRow([
    'TOTAL', fmt(P), `${fmtN(annualRate,2)}% × ${months} mo`,
    fmt(P * monthlyRate * months),
    fmt(P + P * monthlyRate * months)
  ], false, true));
}


/* ── Compound Interest Builder (Yearly SI Compounding) ── */
// Logic: each year, compute SI on the CURRENT balance; add it to the balance.
// This repeats annually. Partial year at end uses remaining months.

function buildCI(prefix, P, monthlyRate, annualRate, months, start) {
  // Calculate total by simulating year-by-year
  let balance = P;
  let rem = months;
  while (rem > 0) {
    const periodMonths = Math.min(12, rem);
    const interest = balance * monthlyRate * periodMonths;
    balance += interest;
    rem -= periodMonths;
  }
  const total    = balance;
  const interest = total - P;

  document.getElementById(`pill-${prefix}`).textContent = `${months} months`;
  document.getElementById(`${prefix}-interest`).textContent = fmt(interest);
  document.getElementById(`${prefix}-total`).textContent = fmt(total);

  buildCIBreakdown(prefix, P, monthlyRate, annualRate, months);
}

function buildCIBreakdown(prefix, P, monthlyRate, annualRate, months) {
  const container = document.getElementById(`breakdown-${prefix}`);
  container.innerHTML = '';

  if (months === 0) {
    container.innerHTML = '<p style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:12px;">0 months – no interest accrues</p>';
    return;
  }

  const header = document.createElement('div');
  header.className = 'breakdown-header';
  header.textContent = 'Year-by-Year Breakdown  ·  Interest added to principal every year';
  container.appendChild(header);

  // 5-column header
  container.appendChild(buildRow(
    ['Period', 'Opening Balance', `Rate × Months`, 'Interest Added', 'Closing Balance'], true
  ));

  let balance = P;
  let remainingMonths = months;
  let yearNum = 1;
  let startMonth = 1;

  while (remainingMonths > 0) {
    const periodMonths = Math.min(12, remainingMonths);
    const openingBalance = balance;
    const periodInterest = openingBalance * monthlyRate * periodMonths; // SI on current balance
    const closingBalance = openingBalance + periodInterest;             // interest becomes new principal

    const endMonth = startMonth + periodMonths - 1;
    const periodLabel = periodMonths === 12
      ? `Year ${yearNum}`
      : `Year ${yearNum}  (Mo ${startMonth}–${endMonth})`;

    container.appendChild(buildRow([
      periodLabel,
      fmt(openingBalance),
      `${fmtN(annualRate, 2)}% × ${periodMonths} mo`,
      `+${fmt(periodInterest)}`,
      fmt(closingBalance)
    ], false, false, remainingMonths <= 12));

    balance = closingBalance; // updated principal for next period
    remainingMonths -= periodMonths;
    startMonth += periodMonths;
    yearNum++;
  }

  // Grand total
  container.appendChild(buildRow([
    'TOTAL', fmt(P), `—`, fmt(balance - P), fmt(balance)
  ], false, true));
}

/* ── DOM Helpers ────────────────────────────────────── */

function buildRow(cells, isHeader = false, isLast = false, isTotal = false) {
  const row = document.createElement('div');
  row.className = 'breakdown-row';
  if (isHeader) row.classList.add('header-row');
  if (isTotal)  row.classList.add('total-row');

  cells.forEach((val, i) => {
    const cell = document.createElement('div');
    cell.className = 'breakdown-cell';
    const v = document.createElement('span');
    v.className = 'breakdown-cell-value';
    v.textContent = val;
    cell.appendChild(v);
    row.appendChild(cell);
  });

  return row;
}

/* ── Set default dates (today & +1 year) ───────────── */

(function initDates() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);

  const fmt = d => d.toISOString().split('T')[0];
  document.getElementById('startDate').value = fmt(today);
  document.getElementById('endDate').value   = fmt(nextYear);
  updateDurationBadge();
})();
