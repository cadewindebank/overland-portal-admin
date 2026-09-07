import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, avatar, usd0, shortDate, stat, num } from '../ui.js';

export default function staff(view) {
  const rows = D.users.filter(u => u.type === 'Staff');
  const byDept = {};
  rows.forEach(u => (byDept[u.department] = (byDept[u.department] || 0) + 1));

  view.innerHTML = `
    ${pageHead({
      title: 'Staff Directory',
      sub: 'Field and home-office staff, their assigned base, and the state of their support account.',
      actions: `<a class="btn-mini" href="#/roles">${icon('shield')} Roles & access</a>
                <button class="btn" id="exportAll">Export directory</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Staff on roll', value: num(rows.length), accent: 'var(--flare)' })}
      ${stat({ label: 'Bases', value: num(new Set(rows.map(u => u.base)).size), accent: 'var(--rain)' })}
      ${stat({ label: 'Combined support balance', value: usd0(D.sum(rows, u => u.balance)), accent: 'var(--emerald-pine)' })}
      ${stat({ label: 'Accounts under balance', value: num(rows.filter(u => u.balance < 0).length), accent: 'var(--sap)',
               meta: 'Negative support account' })}
    </div>

    <div class="grid grid--main">
      <div id="staffTable"></div>
      ${card(`<ul class="timeline">
        ${Object.entries(byDept).sort((a, b) => b[1] - a[1]).map(([d, n]) => `
          <li><div class="timeline__body"><strong>${esc(d)}</strong></div>
              <span class="timeline__when">${n}</span></li>`).join('')}
      </ul>`, { title: 'By department', icon: 'chart' })}
    </div>`;

  const dt = new DataTable({
    title: 'Staff Directory', rows, pageSize: 25, sortKey: 'name',
    onRowClick: u => { location.hash = '#/people/' + u.id; },
    columns: [
      { key: 'name', label: 'Name', render: u =>
        `<a href="#/people/${u.id}" style="display:flex;align-items:center;gap:9px">${avatar(u.name, 'avatar--sm')}<span>${esc(u.name)}</span></a>` },
      { key: 'department', label: 'Department' },
      { key: 'base', label: 'Assigned base' },
      { key: 'sector', label: 'Sector' },
      { key: 'email', label: 'Email', render: u => `<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>` },
      { key: 'phone', label: 'Phone' },
      { key: 'balance', label: 'Support balance', className: 'num',
        render: u => `<span style="color:${u.balance < 0 ? '#a32718' : 'inherit'}">${usd0(u.balance)}</span>` },
      { key: 'insurance', label: 'Insurance', render: u => badge(u.insurance) },
      { key: 'passportExpiry', label: 'Passport', render: u => u.passportExpiry ? shortDate(u.passportExpiry) : badge('Missing') }
    ]
  }).mount(view.querySelector('#staffTable'));

  view.querySelector('#exportAll').addEventListener('click', () => dt.exportCsv());
}
