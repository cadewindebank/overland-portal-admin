import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, shortDate, stat, num, modal, toast } from '../ui.js';

export default function generalAdmin(view) {
  view.innerHTML = `
    ${pageHead({
      title: 'General Admin',
      sub: 'The reference data the rest of the portal is built on — countries, regions, groups, expedition insurance and account creation.',
      actions: `<button class="btn-mini" id="createUser">${icon('person')} Create user</button>
                <button class="btn-mini" id="createExp">${icon('compass')} Create expedition</button>
                <button class="btn" id="createGroup">Create group</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Countries', value: num(D.countries.length), accent: 'var(--rain)',
               meta: `${D.countries.filter(c => c.travel !== 'Open').length} with travel restrictions` })}
      ${stat({ label: 'Regions', value: num(D.regions.length), accent: 'var(--sap)' })}
      ${stat({ label: 'Groups', value: num(D.groups.length), accent: 'var(--lagoon)',
               meta: `${num(D.sum(D.groups, g => g.members))} memberships` })}
      ${stat({ label: 'Insurance gaps', value: num(D.sum(D.expeditionInsurance, e => e.pending)), accent: 'var(--flare)',
               meta: 'Team members without cover' })}
    </div>

    <div class="tabs" id="tabs">
      ${['Countries','Regions','Groups','Expedition insurance','Stock photos'].map((t, i) =>
        `<button data-tab="${t}"${i === 0 ? ' class="is-active"' : ''}>${t}</button>`).join('')}
    </div>
    <div id="gaBody"></div>`;

  const body = view.querySelector('#gaBody');
  const mount = opts => { body.innerHTML = '<div id="t"></div>'; new DataTable(Object.assign({ pageSize: 15, columnFilters: false }, opts)).mount(body.querySelector('#t')); };

  const tabs = {
    Countries: () => mount({
      title: 'Countries', rows: D.countries, sortKey: 'name',
      columns: [
        { key: 'name', label: 'Country' },
        { key: 'region', label: 'Region' },
        { key: 'currency', label: 'Currency' },
        { key: 'visa', label: 'Visa' },
        { key: 'advisory', label: 'Advisory' },
        { key: 'travel', label: 'Travel status',
          render: c => badge(c.travel === 'Open' ? 'Approved' : c.travel === 'Restricted' ? 'Denied' : 'Pending',
                             c.travel === 'Open' ? 'approved' : c.travel === 'Restricted' ? 'denied' : 'pending') },
        { key: 'bases', label: 'Bases', className: 'num' },
        { key: 'staff', label: 'Staff', className: 'num' },
        { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Edit</button>` }
      ]
    }),
    Regions: () => mount({
      title: 'Regions', rows: D.regions, sortKey: 'name',
      columns: [
        { key: 'name', label: 'Region' },
        { key: 'director', label: 'Director' },
        { key: 'bases', label: 'Bases', className: 'num' },
        { key: 'staff', label: 'Staff', className: 'num' },
        { key: 'expeditions', label: 'Expeditions', className: 'num' },
        { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Edit</button>` }
      ]
    }),
    Groups: () => mount({
      title: 'Groups', rows: D.groups, sortKey: 'members', sortDir: 'desc',
      columns: [
        { key: 'name', label: 'Group' },
        { key: 'kind', label: 'Type' },
        { key: 'members', label: 'Members', className: 'num' },
        { key: 'owner', label: 'Owner' },
        { key: 'created', label: 'Created', render: g => shortDate(g.created) },
        { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Manage</button>` }
      ]
    }),
    'Expedition insurance': () => mount({
      title: 'Expedition insurance', rows: D.expeditionInsurance, sortKey: 'effective', sortDir: 'desc',
      onRowClick: e => { location.hash = '#/expeditions/' + e.expeditionId; },
      columns: [
        { key: 'expedition', label: 'Expedition', render: e => `<a href="#/expeditions/${e.expeditionId}">${esc(e.expedition)}</a>` },
        { key: 'policy', label: 'Policy' },
        { key: 'covered', label: 'Covered', className: 'num' },
        { key: 'pending', label: 'Outstanding', className: 'num',
          render: e => `<span style="color:${e.pending ? '#a32718' : 'inherit'}">${e.pending}</span>` },
        { key: 'premium', label: 'Premium', className: 'num', render: e => usd0(e.premium) },
        { key: 'effective', label: 'Effective', render: e => shortDate(e.effective) },
        { key: 'status', label: 'Status', render: e => badge(e.status === 'Complete' ? 'Approved' : 'Pending') }
      ]
    }),
    'Stock photos': () => {
      body.innerHTML = card(`
        <p class="muted" style="margin-top:0">Approved imagery teams may use in donation pages, decks and social posts. Restricted assets need consent before use.</p>
        <div class="grid grid--4" style="gap:12px">
          ${D.mediaAssets.filter(m => m.kind === 'Photo').slice(0, 12).map(m => `
            <div style="border:1px solid var(--line);border-radius:3px;overflow:hidden">
              <div style="aspect-ratio:4/3;background:linear-gradient(135deg,var(--sand),var(--clay));display:flex;align-items:center;justify-content:center;color:rgba(15,14,13,.35)">${icon('image')}</div>
              <div style="padding:9px 10px">
                <div style="font-size:12.5px;font-weight:500">${esc(m.name)}</div>
                <div class="row row--between" style="margin-top:4px">
                  <span class="muted" style="font-size:11px">${esc(m.size)}</span>
                  ${badge(m.license === 'Restricted' ? 'Denied' : m.license === 'Public' ? 'Approved' : 'Draft',
                          m.license === 'Restricted' ? 'denied' : m.license === 'Public' ? 'approved' : 'draft')}
                </div>
              </div>
            </div>`).join('')}
        </div>`, { title: 'Stock photos', icon: 'image',
          actions: '<a class="btn-mini" href="#/media">Open media library</a>' });
    }
  };
  tabs.Countries();
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    tabs[b.dataset.tab]();
  });

  view.querySelector('#createUser').addEventListener('click', () => modal({
    title: 'Create a user', confirm: 'Create user', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label>First name</label><input></div>
      <div class="field"><label>Last name</label><input></div>
      <div class="field"><label>Username</label><input></div>
      <div class="field span-2"><label>Email</label><input type="email"></div>
      <div class="field"><label>Account type</label><select><option>Staff</option><option>Expedition Member</option><option>Donor</option></select></div>
      <div class="field"><label>Region</label><select>${D.regions.map(r => `<option>${esc(r.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Portal role</label><select>${['Read Only','Staff','Expedition Leader','Finance','Base Director','Media','Donor Relations','Administrator'].map(r => `<option>${r}</option>`).join('')}</select></div>
      <div class="field"><label>Groups</label><select>${D.groups.map(g => `<option>${esc(g.name)}</option>`).join('')}</select></div>
    </div>`,
    onConfirm: () => toast('User created — invitation sent')
  }));
  view.querySelector('#createExp').addEventListener('click', () => { location.hash = '#/expeditions'; });
  view.querySelector('#createGroup').addEventListener('click', () => modal({
    title: 'Create a group', confirm: 'Create group',
    body: `<div class="stack">
      <div class="field"><label>Group name</label><input placeholder="Regional Finance"></div>
      <div class="field"><label>Type</label><select><option>Permission Group</option><option>Mailing List</option><option>Both</option></select></div>
      <div class="field"><label>Owner</label><select>${D.users.slice(0, 20).map(u => `<option>${esc(u.name)}</option>`).join('')}</select></div>
    </div>`,
    onConfirm: () => toast('Group created')
  }));
}
