import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, usd0, shortDate, stat, num, modal, toast,
         tabsUrl, textField, selectField, requireFields, readForm } from '../ui.js';
import * as store from '../store.js';
import { ROLES_BY_PRIVILEGE } from '../policy.js';

export default function generalAdmin(view, { query }) {
  const render = () => generalAdmin(view, { query });
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

    <div id="tabHost"></div>
    <div id="gaBody"></div>`;

  const body = view.querySelector('#gaBody');
  const mount = opts => { body.innerHTML = '<div id="t"></div>'; new DataTable(Object.assign({ pageSize: 15, columnFilters: false }, opts)).mount(body.querySelector('#t')); };

  const panels = {
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
        { key: 'act', label: '', sortable: false, filter: false,
          render: c => `<button class="btn-mini" data-edit="${c.id}" data-kind="countries">Edit</button>` }
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
        { key: 'act', label: '', sortable: false, filter: false,
          render: r => `<button class="btn-mini" data-edit="${r.id}" data-kind="regions">Edit</button>` }
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
        { key: 'act', label: '', sortable: false, filter: false,
          render: g => `<button class="btn-mini" data-manage="${g.id}">Manage</button>` }
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
  const strip = tabsUrl(Object.keys(panels), n => panels[n](), query.get('tab'));
  view.querySelector('#tabHost').innerHTML = strip.html;
  strip.mount(view);
  panels[strip.active]();

  // in-table actions were rendered with no handler at all
  body.addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]');
    if (ed) return editRow(ed.dataset.kind, ed.dataset.edit);
    const mg = e.target.closest('[data-manage]');
    if (mg) return manageGroup(mg.dataset.manage);
  });

  function editRow(kind, id) {
    const rows = { countries: D.countries, regions: D.regions }[kind] || [];
    const row = rows.find(r => String(r.id) === String(id));
    if (!row) return;
    const fields = kind === 'countries'
      ? `${textField('Country', { value: row.name })}
         ${selectField('Region', D.regions.map(r => r.name), { value: row.region })}
         ${textField('Currency', { value: row.currency })}
         ${selectField('Visa', ['On arrival', 'Pre-approval', 'eVisa', 'Not required'], { value: row.visa })}
         ${selectField('Travel status', ['Open', 'Restricted', 'Elevated Risk'], { value: row.travel })}
         ${textField('Bases', { type: 'number', value: row.bases })}`
      : `${textField('Region', { value: row.name })}
         ${selectField('Director', D.users.slice(0, 20).map(u => u.name), { value: row.director })}
         ${textField('Bases', { type: 'number', value: row.bases })}`;
    modal({
      title: 'Edit ' + row.name, confirm: 'Save changes',
      body: `<div class="form-grid form-grid--2">${fields}</div>`,
      onConfirm: scrim => {
        const v = readForm(scrim);
        const patch = kind === 'countries'
          ? { name: v['Country'], region: v['Region'], currency: v['Currency'],
              visa: v['Visa'], travel: v['Travel status'], bases: Number(v['Bases']) || 0 }
          : { name: v['Region'], director: v['Director'], bases: Number(v['Bases']) || 0 };
        store.update(kind, row.id, patch);
        toast(row.name + ' updated');
        render();
      }
    });
  }

  function manageGroup(id) {
    const g = D.groups.find(x => String(x.id) === String(id));
    if (!g) return;
    const members = D.users.filter(u => (u.groups || []).includes(g.name));
    modal({
      title: 'Manage ' + g.name, confirm: 'Save group', wide: true,
      body: `<div class="form-grid form-grid--2">
          ${textField('Group name', { value: g.name })}
          ${selectField('Type', ['Permission Group', 'Mailing List', 'Both'], { value: g.kind })}
        </div>
        <div class="hr"></div>
        <h3 class="section-title" style="margin-bottom:8px">Members (${members.length})</h3>
        <div style="max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:3px;padding:8px">
          ${D.users.filter(u => u.type === 'Staff').slice(0, 40).map(u => `
            <label class="check" style="padding:4px 2px">
              <input type="checkbox" data-member="${u.id}"${(u.groups || []).includes(g.name) ? ' checked' : ''}>
              <span>${esc(u.name)} <span class="muted">· ${esc(u.department)}</span></span></label>`).join('')}
        </div>`,
      onConfirm: scrim => {
        const v = readForm(scrim);
        let added = 0;
        scrim.querySelectorAll('[data-member]').forEach(box => {
          const u = D.findUser(box.dataset.member);
          if (!u) return;
          const has = (u.groups || []).includes(g.name);
          if (box.checked && !has) {
            store.update('users', u.id, { groups: [...(u.groups || []), g.name] }, { silent: true });
            added++;
          } else if (!box.checked && has) {
            store.update('users', u.id, { groups: (u.groups || []).filter(x => x !== g.name) }, { silent: true });
          }
        });
        const count = D.users.filter(u => (u.groups || []).includes(v['Group name'])).length;
        store.update('groups', g.id, { name: v['Group name'], kind: v['Type'], members: count });
        toast(`${v['Group name']} saved — ${count} members`);
        render();
      }
    });
  }

  view.querySelector('#createUser').addEventListener('click', () => modal({
    title: 'Create a user', confirm: 'Create user', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label>First name</label><input></div>
      <div class="field"><label>Last name</label><input></div>
      <div class="field"><label>Username</label><input></div>
      <div class="field span-2"><label>Email</label><input type="email"></div>
      <div class="field"><label>Account type</label><select><option>Staff</option><option>Expedition Member</option><option>Donor</option></select></div>
      <div class="field"><label>Region</label><select>${D.regions.map(r => `<option>${esc(r.name)}</option>`).join('')}</select></div>
      ${selectField('Portal role', ROLES_BY_PRIVILEGE)}
      <div class="field"><label>Groups</label><select>${D.groups.map(g => `<option>${esc(g.name)}</option>`).join('')}</select></div>
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['First name', 'Last name', 'Email']);
      if (v === false) return false;
      const row = store.create('users', {
        first: v['First name'], last: v['Last name'], name: `${v['First name']} ${v['Last name']}`,
        username: v['Username'] || (v['Last name'] + v['First name'][0]).toLowerCase(),
        email: v['Email'], phone: '', city: '—', region: v['Region'] || '—', country: '—',
        type: v['Account type'], department: 'Unassigned', base: '—',
        role: v['Portal role'], sector: v['Region'] || 'Global', status: 'Invited',
        twoFactor: false, passportExpiry: null, insurance: 'Missing', balance: 0,
        lastLogin: '', joined: new Date().toISOString().slice(0, 10),
        groups: v['Groups'] ? [v['Groups']] : []
      });
      toast('User created — invitation sent');
      location.hash = '#/people/' + row.id;
    }
  }));
  view.querySelector('#createExp').addEventListener('click', () => { location.hash = '#/expeditions'; });
  view.querySelector('#createGroup').addEventListener('click', () => modal({
    title: 'Create a group', confirm: 'Create group',
    body: `<div class="stack">
      <div class="field"><label>Group name</label><input placeholder="Regional Finance"></div>
      <div class="field"><label>Type</label><select><option>Permission Group</option><option>Mailing List</option><option>Both</option></select></div>
      <div class="field"><label>Owner</label><select>${D.users.slice(0, 20).map(u => `<option>${esc(u.name)}</option>`).join('')}</select></div>
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Group name']);
      if (v === false) return false;
      store.create('groups', { name: v['Group name'], kind: v['Type'], members: 0,
        owner: v['Owner'], created: new Date().toISOString().slice(0, 10) });
      toast('Group created');
      render();
    }
  }));
}
