import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, stat, num, progress, modal, toast,
         textField, selectField, requireFields } from '../ui.js';
import * as store from '../store.js';

export default function budgets(view) {
  const render = () => budgets(view);
  const totals = {
    budget: D.sum(D.budgets, b => b.budget),
    spent: D.sum(D.budgets, b => b.spent),
    committed: D.sum(D.budgets, b => b.committed)
  };
  totals.remaining = totals.budget - totals.spent - totals.committed;
  const over = D.budgets.filter(b => b.remaining < 0);

  view.innerHTML = `
    ${pageHead({
      title: 'Budgets',
      sub: 'FY2026 departmental budgets — what is spent, what is committed, and what remains.',
      actions: `<button class="btn-mini" id="exportB">${icon('download')} Export</button>
                <button class="btn" id="newB">New budget line</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'FY2026 budget', value: usd0(totals.budget), accent: 'var(--rain)' })}
      ${stat({ label: 'Spent', value: usd0(totals.spent), accent: 'var(--flare)',
               meta: Math.round(totals.spent / totals.budget * 100) + '% of budget' })}
      ${stat({ label: 'Committed', value: usd0(totals.committed), accent: 'var(--sap)' })}
      ${stat({ label: 'Remaining', value: usd0(totals.remaining), accent: totals.remaining < 0 ? 'var(--flare)' : 'var(--emerald-pine)',
               meta: over.length ? `${over.length} line${over.length > 1 ? 's' : ''} over budget` : 'All lines within budget' })}
    </div>

    <div class="grid grid--2" style="margin-bottom:18px">
      ${D.budgets.slice(0, 6).map(b => `
        <div class="card">
          <div class="row row--between">
            <div><strong>${esc(b.name)}</strong>
              <div class="muted" style="font-size:12.5px">${esc(b.sector)} · owner ${esc(b.owner)}</div></div>
            ${badge(b.remaining < 0 ? 'Denied' : (b.pct > 85 ? 'Expiring' : 'Current'),
                    b.remaining < 0 ? 'denied' : (b.pct > 85 ? 'pending' : 'approved'))}
          </div>
          <div style="margin:12px 0 6px">${progress(b.pct, b.pct <= 85)}</div>
          <div class="row row--between" style="font-size:12.5px">
            <span class="muted">${usd0(b.spent)} spent of ${usd0(b.budget)}</span>
            <span><strong>${usd0(b.remaining)}</strong> left</span>
          </div>
        </div>`).join('')}
    </div>

    <div id="budgetTable"></div>`;

  const dt = new DataTable({
    title: 'FY2026 budgets', rows: D.budgets, pageSize: 15, sortKey: 'budget', sortDir: 'desc',
    columns: [
      { key: 'name', label: 'Budget line' },
      { key: 'sector', label: 'Sector' },
      { key: 'owner', label: 'Owner' },
      { key: 'budget', label: 'Budget', className: 'num', render: b => usd0(b.budget) },
      { key: 'spent', label: 'Spent', className: 'num', render: b => usd0(b.spent) },
      { key: 'committed', label: 'Committed', className: 'num', render: b => usd0(b.committed) },
      { key: 'remaining', label: 'Remaining', className: 'num',
        render: b => `<strong style="color:${b.remaining < 0 ? '#a32718' : 'inherit'}">${usd0(b.remaining)}</strong>` },
      { key: 'pct', label: 'Used', className: 'num', render: b => b.pct + '%' }
    ]
  }).mount(view.querySelector('#budgetTable'));

  view.querySelector('#exportB').addEventListener('click', () => dt.exportCsv());
  view.querySelector('#newB').addEventListener('click', () => modal({
    title: 'New budget line', confirm: 'Create line',
    body: `<div class="form-grid form-grid--2">
      ${textField('Name', { placeholder: 'East Africa Operations', span: 2 })}
      ${selectField('Sector', ['Southern Africa','East Africa','North Africa','Middle East','South America','Global'])}
      ${selectField('Fiscal year', ['FY2026', 'FY2027'])}
      ${textField('Amount (USD)', { type: 'number', placeholder: '180000' })}
      ${textField('Owner', { list: 'ownersB', placeholder: 'Search staff' })}
      <datalist id="ownersB">${D.users.slice(0, 40).map(u => `<option value="${esc(u.name)}">`).join('')}</datalist>
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Name', 'Amount (USD)']);
      if (v === false) return false;
      const amount = Number(v['Amount (USD)']) || 0;
      store.create('budgets', {
        name: v['Name'], sector: v['Sector'], fy: v['Fiscal year'],
        budget: amount, spent: 0, committed: 0, remaining: amount, pct: 0,
        owner: v['Owner'] || '\u2014'
      });
      toast('Budget line created');
      render();
    }
  }));
  void num;
}
