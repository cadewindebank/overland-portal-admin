import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, avatar, num, modal, toast } from '../ui.js';

const CAPABILITIES = [
  ['People', ['View people', 'Edit people', 'Invite & suspend accounts', 'View compliance documents']],
  ['Expeditions', ['View expeditions', 'Edit rosters', 'Lock & close expeditions', 'Review applications']],
  ['Giving', ['View donations', 'Issue refunds', 'Publish donation pages', 'Export donor data']],
  ['Workflow', ['View request queue', 'Approve requests', 'Disburse funds', 'Assign tasks']],
  ['System', ['View audit log', 'Manage roles', 'Revoke sessions', 'Edit system settings']]
];

const MATRIX = {
  'Administrator':      c => true,
  'Finance':            c => /donation|refund|export|request|disburs|audit|people|compliance/i.test(c),
  'Base Director':      c => /view|roster|assign|application|compliance/i.test(c),
  'Expedition Leader':  c => /view (people|expeditions)|roster|application|assign/i.test(c),
  'Donor Relations':    c => /donation|donor|people|page/i.test(c),
  'Media':              c => /^view/i.test(c),
  'Staff':              c => /^view (people|expeditions)$/i.test(c),
  'Read Only':          c => /^view (people|expeditions)$/i.test(c)
};

export default function roles(view) {
  const roleNames = Object.keys(MATRIX);
  const counts = Object.fromEntries(roleNames.map(r => [r, D.users.filter(u => u.role === r).length]));

  view.innerHTML = `
    ${pageHead({
      title: 'Roles & Access',
      sub: 'What each portal role can do. Changes here take effect on the user’s next request.',
      actions: `<button class="btn-mini" id="newRole">${icon('plus')} New role</button>
                <button class="btn" id="saveRoles">Save matrix</button>`
    })}

    <div class="stack">
      ${card(`
        <div class="dt__scroll">
          <table class="dt__table">
            <thead><tr><th style="min-width:250px">Capability</th>
              ${roleNames.map(r => `<th class="center">${esc(r)}<div class="muted" style="font-weight:400;font-size:11px">${counts[r]} users</div></th>`).join('')}</tr></thead>
            <tbody>
              ${CAPABILITIES.map(([group, caps]) => `
                <tr><td colspan="${roleNames.length + 1}" style="background:var(--shadow);color:var(--bone);font-family:var(--font-cond);text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:600">${esc(group)}</td></tr>
                ${caps.map(c => `<tr><td>${esc(c)}</td>${roleNames.map(r => `
                  <td class="center"><input type="checkbox" ${MATRIX[r](c) ? 'checked' : ''} aria-label="${esc(r)} — ${esc(c)}"></td>`).join('')}</tr>`).join('')}
              `).join('')}
            </tbody>
          </table>
        </div>`, { title: 'Permission matrix', icon: 'shield' })}

      ${card('<div id="adminTable"></div>', {
        title: 'Elevated accounts', icon: 'staff',
        actions: '<span class="muted" style="font-size:12.5px">Administrator and Finance roles</span>'
      })}
    </div>`;

  new DataTable({
    title: 'Elevated accounts',
    rows: D.users.filter(u => ['Administrator', 'Finance', 'Base Director'].includes(u.role)),
    pageSize: 10, columnFilters: false, sortKey: 'role',
    onRowClick: u => { location.hash = '#/people/' + u.id; },
    columns: [
      { key: 'name', label: 'Name', render: u =>
        `<a href="#/people/${u.id}" style="display:flex;align-items:center;gap:9px">${avatar(u.name, 'avatar--sm')}<span>${esc(u.name)}</span></a>` },
      { key: 'role', label: 'Role', render: u => `<span class="badge badge--role">${esc(u.role)}</span>` },
      { key: 'department', label: 'Department' },
      { key: 'base', label: 'Base' },
      { key: 'twoFactor', label: 'Two-factor', render: u => u.twoFactor ? badge('Active') : badge('Missing', 'denied') },
      { key: 'lastLogin', label: 'Last login' },
      { key: 'status', label: 'Status', render: u => badge(u.status) }
    ]
  }).mount(view.querySelector('#adminTable'));

  view.querySelector('#saveRoles').addEventListener('click', () => toast('Permission matrix saved — 0 users affected immediately'));
  view.querySelector('#newRole').addEventListener('click', () => modal({
    title: 'Create a role', confirm: 'Create role',
    body: `<div class="stack">
      <div class="field"><label>Role name</label><input placeholder="e.g. Regional Finance"></div>
      <div class="field"><label>Copy permissions from</label><select>${roleNames.map(r => `<option>${r}</option>`).join('')}</select></div>
      <div class="field"><label>Description</label><textarea placeholder="Who this role is for and what it should be able to do."></textarea></div>
    </div>`,
    onConfirm: () => toast('Role created')
  }));
}
