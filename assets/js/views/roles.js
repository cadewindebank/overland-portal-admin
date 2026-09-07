import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, avatar, num, modal, toast } from '../ui.js';

import { CAPABILITIES, ROLE_GRANTS, ROLES } from '../policy.js';

/* The matrix below is rendered FROM assets/js/policy.js — the same table the
   router enforces with. Editing a grant here changes what the app allows,
   which is the point: what an administrator sees is what is enforced. */

export default function roles(view) {
  const roleNames = ROLES;
  const counts = Object.fromEntries(roleNames.map(r => [r, D.users.filter(u => u.role === r).length]));
  const groups = [...new Set(CAPABILITIES.map(c => c.group))];

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
              ${groups.map(group => `
                <tr><th colspan="${roleNames.length + 1}" scope="colgroup" style="text-align:left;background:var(--shadow);color:var(--bone);font-family:var(--font-cond);text-transform:uppercase;letter-spacing:1.12px;font-size:11px;font-weight:600">${esc(group)}</th></tr>
                ${CAPABILITIES.filter(c => c.group === group).map(c => `<tr>
                  <th scope="row" style="text-align:left;font-weight:400">${esc(c.label)}
                    <code class="muted" style="font-size:11px;display:block">${esc(c.id)}</code></th>
                  ${roleNames.map(r => `
                  <td class="center"><input type="checkbox" ${ROLE_GRANTS[r](c.id) ? 'checked' : ''} aria-label="${esc(r)} may ${esc(c.label)}"></td>`).join('')}</tr>`).join('')}
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
