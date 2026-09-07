import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, avatar, usd0, shortDate, stat, num, modal, toast,
         textField, selectField, textareaField, requireFields, readForm } from '../ui.js';
import * as store from '../store.js';
import { ROLES_BY_PRIVILEGE } from '../policy.js';

export default function people(view) {
  const render = () => people(view);
  view.innerHTML = `
    ${pageHead({
      title: 'People',
      sub: 'Every account in the portal — staff, expedition members and donors. Search below or filter any column.',
      actions: `<button class="btn-mini" id="advBtn">${icon('search')} Advanced search</button>
                <button class="btn" id="inviteBtn">Invite person</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Total accounts', value: num(D.users.length), accent: 'var(--rain)' })}
      ${stat({ label: 'Staff', value: num(D.users.filter(u => u.type === 'Staff').length), accent: 'var(--flare)' })}
      ${stat({ label: 'Expedition members', value: num(D.users.filter(u => u.type === 'Expedition Member').length), accent: 'var(--sprout)' })}
      ${stat({ label: 'Two-factor enabled', value: Math.round(D.users.filter(u => u.twoFactor).length / D.users.length * 100) + '%', accent: 'var(--emerald-pine)' })}
    </div>

    <div id="adv" hidden style="margin-bottom:18px">
      ${card(`
        <p class="muted" style="margin-top:0">Complete as many or as few of the fields as you like. A blank search returns everyone; the result set can be filtered further in the table.</p>
        <div class="form-grid">
          ${['First Name','Last Name','Email','Phone','WhatsApp','Date of Birth','City','State/Province/Region','Postal/Zip Code','Expedition Name','Expedition Code','Reference Name','Church Name'].map(l =>
            `<div class="field"><label>${l}</label><input type="text" data-adv placeholder="${l}"></div>`).join('')}
        </div>
        <div class="row" style="margin-top:16px">
          <button class="btn" id="advRun">Search</button>
          <button class="btn-mini" id="advClear">Clear</button>
        </div>`, { title: 'Search site users', icon: 'search' })}
    </div>

    <div id="peopleTable"></div>`;

  const dt = new DataTable({
    title: 'People',
    rows: D.users,
    pageSize: 25,
    sortKey: 'name',
    onRowClick: u => { location.hash = '#/people/' + u.id; },
    columns: [
      { key: 'name', label: 'Name', render: u =>
        `<a href="#/people/${u.id}" style="display:flex;align-items:center;gap:9px">${avatar(u.name, 'avatar--sm')}<span>${esc(u.name)}</span></a>` },
      { key: 'email', label: 'Email', render: u => `<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>` },
      { key: 'type', label: 'Type' },
      { key: 'department', label: 'Department' },
      { key: 'location', label: 'Location', value: u => `${u.city}, ${u.region}`, render: u => esc(`${u.city}, ${u.region}`) },
      { key: 'country', label: 'Country' },
      { key: 'role', label: 'Portal role', render: u => `<span class="badge badge--role">${esc(u.role)}</span>` },
      { key: 'status', label: 'Status', render: u => badge(u.status) },
      { key: 'lastLogin', label: 'Last login', render: u => shortDate(u.lastLogin) }
    ]
  }).mount(view.querySelector('#peopleTable'));

  view.querySelector('#advBtn').addEventListener('click', () => {
    const p = view.querySelector('#adv');
    p.hidden = !p.hidden;
  });
  view.querySelector('#advClear').addEventListener('click', () => {
    view.querySelectorAll('[data-adv]').forEach(i => (i.value = ''));
    dt.q = ''; dt.colQ = {}; dt.paint();
  });
  view.querySelector('#advRun').addEventListener('click', () => {
    const terms = [...view.querySelectorAll('[data-adv]')].map(i => i.value.trim()).filter(Boolean);
    dt.q = terms.join(' ');
    dt.page = 1; dt.paint();
    toast(terms.length ? `Filtered by ${terms.length} field${terms.length > 1 ? 's' : ''}` : 'Showing all people');
  });
  view.querySelector('#inviteBtn').addEventListener('click', () => modal({
    title: 'Invite a person',
    confirm: 'Send invite',
    body: `<div class="form-grid form-grid--2">
      ${textField('First name', { placeholder: 'Jane' })}
      ${textField('Last name', { placeholder: 'Mwansa' })}
      ${textField('Email', { type: 'email', placeholder: 'name@example.org', span: 2 })}
      ${selectField('Account type', ['Staff', 'Expedition Member', 'Donor'])}
      ${selectField('Portal role', ROLES_BY_PRIVILEGE)}
      ${textareaField('Note to include', { placeholder: 'Optional message included in the invitation email.', span: 2 })}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['First name', 'Last name', 'Email']);
      if (v === false) return false;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v['Email'])) {
        return invalidEmail(scrim);
      }
      if (D.users.some(u => u.email.toLowerCase() === v['Email'].toLowerCase())) {
        return duplicate(scrim);
      }
      const row = store.create('users', {
        first: v['First name'], last: v['Last name'],
        name: `${v['First name']} ${v['Last name']}`,
        username: (v['Last name'] + v['First name'][0]).toLowerCase(),
        email: v['Email'], phone: '',
        city: '—', region: '—', country: '—',
        type: v['Account type'],
        department: v['Account type'] === 'Staff' ? 'Unassigned' : '—',
        base: '—', role: v['Portal role'], sector: 'Global',
        status: 'Invited', twoFactor: false, passportExpiry: null,
        insurance: 'Missing', balance: 0,
        lastLogin: '', joined: new Date().toISOString().slice(0, 10),
        onboarding: { invited: true }
      });
      toast(`Invitation sent to ${row.email}`);
      location.hash = '#/people/' + row.id;
    }
  }));

  function invalidEmail(scrim) {
    const host = scrim.querySelector('.modal__body');
    if (!host.querySelector('.notice--stop'))
      host.insertAdjacentHTML('afterbegin', '<div class="notice notice--stop">That email address is not valid.</div>');
    return false;
  }
  function duplicate(scrim) {
    const host = scrim.querySelector('.modal__body');
    if (!host.querySelector('.notice--stop'))
      host.insertAdjacentHTML('afterbegin', '<div class="notice notice--stop">Someone already has that email address.</div>');
    return false;
  }
  void render;
}
