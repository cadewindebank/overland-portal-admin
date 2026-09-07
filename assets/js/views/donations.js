import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd, usd0, shortDate, stat, num, barChart, modal, toast } from '../ui.js';

export default function donations(view) {
  const ytd = D.donations.filter(d => d.date >= '2026-01-01');
  const recurring = D.donations.filter(d => d.recurring);
  const unreceipted = D.donations.filter(d => !d.receipted);
  const byFund = {};
  D.donations.forEach(d => (byFund[d.fund] = (byFund[d.fund] || 0) + d.amount));

  view.innerHTML = `
    ${pageHead({
      title: 'Donations',
      sub: 'All incoming funds — gifts, internal transactions, adjustments and refunds.',
      actions: `<button class="btn-mini" id="receiptBtn">${icon('file')} Issue receipts</button>
                <button class="btn" id="recordBtn">Record a gift</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${stat({ label: 'Giving YTD', value: usd0(D.sum(ytd, d => d.amount)), accent: 'var(--emerald-pine)', meta: `${num(ytd.length)} gifts` })}
      ${stat({ label: 'Average gift', value: usd0(D.sum(ytd, d => d.amount) / Math.max(1, ytd.length)), accent: 'var(--rain)' })}
      ${stat({ label: 'Recurring donors', value: num(new Set(recurring.map(d => d.donorId)).size), accent: 'var(--flare)',
               meta: `${usd0(D.sum(recurring, d => d.amount))} lifetime` })}
      ${stat({ label: 'Unreceipted', value: num(unreceipted.length), accent: 'var(--sap)', meta: usd0(D.sum(unreceipted, d => d.amount)) })}
      ${stat({ label: 'Refunds', value: num(D.donations.filter(d => d.type === 'Refund').length), accent: 'var(--bark)' })}
    </div>

    <div class="grid grid--main" style="margin-bottom:18px">
      ${card(barChart(D.givingByMonth), { title: 'Monthly giving', icon: 'chart' })}
      ${card(`<ul class="timeline">
        ${Object.entries(byFund).sort((a, b) => b[1] - a[1]).map(([f, v]) => `
          <li><div class="timeline__body"><strong>${esc(f)}</strong></div>
              <span class="timeline__when">${usd0(v)}</span></li>`).join('')}
      </ul>`, { title: 'By fund', icon: 'give' })}
    </div>

    <div id="donTable"></div>`;

  const dt = new DataTable({
    title: 'Incoming funds', rows: D.donations, pageSize: 25, sortKey: 'date', sortDir: 'desc',
    columns: [
      { key: 'date', label: 'Transaction date', render: d => shortDate(d.date) },
      { key: 'amount', label: 'Amount', className: 'num', render: d => usd(d.amount) },
      { key: 'type', label: 'Type' },
      { key: 'fund', label: 'Fund' },
      { key: 'method', label: 'Method' },
      { key: 'repCode', label: 'Rep' },
      { key: 'donor', label: 'Donor', render: d => `<a class="rowlink" href="#/people/${d.donorId}">${esc(d.donor)}</a>` },
      { key: 'designation', label: 'Designation' },
      { key: 'recurring', label: 'Recurring', className: 'center', value: d => d.recurring ? 'Yes' : 'No', render: d => d.recurring ? badge('Active') : '—' },
      { key: 'receipted', label: 'Receipt', className: 'center', value: d => d.receipted ? 'Sent' : 'Pending', render: d => badge(d.receipted ? 'Sent' : 'Pending') },
      { key: 'memo', label: 'Memo' }
    ]
  }).mount(view.querySelector('#donTable'));

  view.querySelector('#receiptBtn').addEventListener('click', () =>
    toast(`${unreceipted.length} receipts queued for delivery`));
  view.querySelector('#recordBtn').addEventListener('click', () => modal({
    title: 'Record a gift', confirm: 'Record gift', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label>Donor</label><input list="dl" placeholder="Search donors"><datalist id="dl">${D.users.slice(0, 50).map(u => `<option value="${esc(u.name)}">`).join('')}</datalist></div>
      <div class="field"><label>Amount (USD)</label><input type="number" step="0.01" placeholder="250.00"></div>
      <div class="field"><label>Date received</label><input type="date"></div>
      <div class="field"><label>Method</label><select>${['Check','ACH','Wire','Stock','DAF','MasterCard','Visa'].map(m => `<option>${m}</option>`).join('')}</select></div>
      <div class="field"><label>Fund</label><select>${['General Fund','Staff Support','Expedition Fund','Base Development','Medical Outreach','Aviation','Water Projects'].map(f => `<option>${f}</option>`).join('')}</select></div>
      <div class="field"><label>Designation</label><input placeholder="Staff name or project"></div>
      <div class="field span-3"><label>Memo</label><input placeholder="Appears on the donor's receipt"></div>
    </div>`,
    onConfirm: () => toast('Gift recorded and receipt queued')
  }));
  void dt;
}
