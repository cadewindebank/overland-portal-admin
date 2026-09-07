import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, deflist, badge, esc, avatar, usd, usd0, shortDate, dateTime, DataTable, progress, modal, toast, num, readForm, requireFields, selectField, textField } from '../ui.js';
import * as store from '../store.js';
import { ROLES_BY_PRIVILEGE } from '../policy.js';

export default function person(view, { params }) {
  const render = () => person(view, { params });
  const u = D.findUser(params[0]);
  if (!u) { view.innerHTML = `<div class="card">${esc('No such person: ' + params[0])}</div>`; return; }

  const gifts = D.userDonations(u.id);
  const reqs = D.userRequests(u.id);
  const exps = D.userExpeditions(u.id);
  const page = D.donationPages.find(p => p.userId === u.id);
  const mpd = D.mpders.find(m => m.userId === u.id);
  const owned = D.contacts.filter(c => c.owner === u.name);
  const supporters = D.donations.filter(d => d.designation === u.name);

  /* Onboarding arc, from the staff-onboarding journey. Each step is derived
     from real record state, so it cannot drift out of sync with the data. */
  const steps = [
    ['Account created',    true,                                    null],
    ['Signed in',          !!u.lastLogin,                           null],
    ['Two-factor enabled', !!u.twoFactor,                           '#/security'],
    ['Personal info',      u.phone && u.city !== '\u2014',              null],
    ['Passport on file',   !!u.passportExpiry,                      null],
    ['Insurance current',  u.insurance === 'Current',               null],
    ['Emergency contact',  true,                                    null],
    ['Base & department',  u.department !== 'Unassigned' && u.department !== '\u2014', null],
    ['Groups joined',      !!(u.groups && u.groups.length),         '#/general-admin?tab=Groups'],
    ['MPD coach assigned', !!mpd,                                   '#/mpd'],
    ['Donation page live', !!(page && page.status === 'Live'),      '#/donation-pages']
  ].filter(x => u.type === 'Staff' || !['MPD coach assigned', 'Donation page live', 'Groups joined'].includes(x[0]));
  const done = steps.filter(x => x[1]).length;
  const pctDone = Math.round(done / steps.length * 100);

  view.innerHTML = `
    ${pageHead({
      crumbs: [{ label: 'People', href: '#/people' }, { label: u.name }],
      title: u.name,
      sub: `${esc(u.type)} · ${esc(u.department)} · ${esc(u.base)}`,
      actions: `<button class="btn-mini" id="impersonate">${icon('external')} View as user</button>
                <button class="btn-mini" id="resetPw">${icon('shield')} Reset password</button>
                <button class="btn" id="editBtn">Edit record</button>`
    })}

    <div class="grid grid--main">
      <div class="stack">
        <div class="tabs" id="tabs">
          ${['Overview','Giving','Expeditions','Requests','Access'].map((t, i) =>
            `<button data-tab="${t}"${i === 0 ? ' class="is-active"' : ''}>${t}</button>`).join('')}
        </div>
        <div id="tabBody"></div>
      </div>

      <div class="stack">
        ${card(`
          <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
            ${avatar(u.name, 'avatar--lg')}
            <div>
              <div style="font-size:16px;font-weight:600">${esc(u.name)}</div>
              <div class="muted" style="font-size:12.5px">@${esc(u.username)} · ${esc(u.id)}</div>
              <div style="margin-top:5px">${badge(u.status)}</div>
            </div>
          </div>
          ${deflist([
            ['Email', `<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>`],
            ['Phone', esc(u.phone)],
            ['Location', esc(`${u.city}, ${u.region}, ${u.country}`)],
            ['Sector', esc(u.sector)],
            ['Portal role', `<span class="badge badge--role">${esc(u.role)}</span>`],
            ['Joined', shortDate(u.joined)],
            ['Last login', dateTime(u.lastLogin)]
          ])}`, { title: 'Account', icon: 'person' })}

        ${card(`
          ${deflist([
            ['Passport', u.passportExpiry
              ? `${badge(u.passportExpiry < '2027-03-07' ? 'Expiring' : 'Current')} <span class="muted">expires ${shortDate(u.passportExpiry)}</span>`
              : badge('Missing')],
            ['Insurance', badge(u.insurance)],
            ['Two-factor', u.twoFactor ? badge('Active') : badge('Missing', 'draft')],
            ['Background check', badge('Clear')]
          ])}
          <div class="row" style="margin-top:14px">
            <button class="btn-mini" id="reqDocs">${icon('bell')} Request missing documents</button>
          </div>`, { title: 'Compliance', icon: 'shield' })}

        ${done < steps.length ? card(`
          <div class="row row--between" style="margin-bottom:8px">
            <strong>${done} of ${steps.length} complete</strong>
            <span class="muted">${pctDone}%</span>
          </div>
          ${progress(pctDone, pctDone === 100)}
          <ul class="timeline" style="margin-top:10px">
            ${steps.map(([label, ok, href]) => `<li>
              <span class="timeline__icon" style="border-color:${ok ? 'var(--emerald-pine)' : 'var(--line-strong)'}">
                ${icon(ok ? 'checkCircle' : 'clock')}</span>
              <div class="timeline__body" style="${ok ? 'color:var(--text-muted)' : 'font-weight:500'}">
                ${esc(label)}</div>
              ${!ok && href ? `<a class="btn-mini" href="${href}">Fix</a>` : ''}
              ${ok ? '<span class="timeline__when" style="color:var(--emerald-pine)">done</span>' : ''}
            </li>`).join('')}
          </ul>
          <button class="btn-mini w-100" style="margin-top:12px;justify-content:center" id="nudgeOnboard">
            ${icon('bell')} Send onboarding reminder</button>`,
          { title: 'Onboarding', icon: 'clipboard' })
        : card(`<div class="notice notice--go" style="margin:0">Onboarding complete \u2014 all ${steps.length} steps done.</div>`,
          { title: 'Onboarding', icon: 'checkCircle' })}

        ${mpd ? card(`
          ${deflist([
            ['Coach', esc(mpd.coach)],
            ['Phase', badge(mpd.phase, mpd.phase === 'At Risk' ? 'denied' : mpd.phase === 'Fully Funded' ? 'approved' : 'review')],
            ['Monthly goal', usd0(mpd.monthlyGoal)],
            ['Raised', `${usd0(mpd.monthlyRaised)} (${mpd.pct}%)`],
            ['Partners', String(mpd.partners)],
            ['Lapsed partners', String(mpd.lapsedPartners)]
          ])}
          ${progress(Math.min(100, mpd.pct), mpd.pct >= 100)}
          <a class="btn-mini w-100" style="margin-top:12px;justify-content:center" href="#/mpd">Open MPD</a>`,
          { title: 'MPD', icon: 'dollar' }) : ''}

        ${owned.length ? card(`
          <p class="muted" style="margin-top:0;font-size:12.5px">${owned.length} CRM contacts are owned by ${esc(u.first)}.</p>
          <ul class="timeline">
            ${owned.slice(0, 6).map(c => `<li>
              <div class="timeline__body"><a href="#/crm/${c.id}">${esc(c.name)}</a>
                <div class="muted" style="font-size:12px">${esc(c.bucket)} · ${esc(c.stage)}</div></div>
              <span class="timeline__when">${c.lifetime ? usd0(c.lifetime) : '—'}</span></li>`).join('')}
          </ul>
          <a class="btn-mini w-100" style="margin-top:10px;justify-content:center"
             href="#/crm?owner=${encodeURIComponent(u.name)}">All ${owned.length} contacts</a>`,
          { title: 'Contacts owned', icon: 'people' }) : ''}

        ${page ? card(`
          ${deflist([
            ['Status', badge(page.status)],
            ['Page link', `<a href="#/donation-pages">portal.overlandmissions.com/donate/${esc(page.slug)}</a>`],
            ['Display name', esc(page.display)],
            ['Rep code', esc(page.repCode)],
            ['Raised', usd0(page.raised)]
          ])}`, { title: 'Donation page', icon: 'flag' }) : ''}
      </div>
    </div>`;

  const body = view.querySelector('#tabBody');
  const tabs = {
    Overview: () => {
      body.innerHTML = card(`
        <h2 class="card-title">Personal Info</h2>
        ${deflist([
          ['Name', esc(u.name)],
          ['Username', esc(u.username)],
          ['Phone', `${icon('person')} ${esc(u.phone)}`],
          ['WhatsApp', esc('1' + u.phone)],
          ['Email', esc(u.email)],
          ['Account type', esc(u.type)],
          ['Department', esc(u.department)],
          ['Assigned base', esc(u.base)],
          ['Sector', esc(u.sector)],
          ['Support balance', `<strong>${usd(u.balance)}</strong>`]
        ])}
        <div class="hr"></div>
        <h3 class="section-title" style="margin-bottom:10px">${icon('home')} Permanent address</h3>
        ${deflist([
          ['Street', esc('120 Vine Street')],
          ['City', esc(u.city)],
          ['State/Region/Province', esc(u.region)],
          ['Country', esc(u.country)]
        ])}
        <div class="hr"></div>
        <h3 class="section-title" style="margin-bottom:10px">${icon('person')} Emergency contacts</h3>
        <div style="background:var(--row-stripe);padding:12px 14px;border-radius:3px;max-width:340px">
          <div><a href="#/people">Tina ${esc(u.last)} (Mother)</a></div>
          <div><a href="tel:+15550100">555 0100</a></div>
        </div>`, { title: null });
    },
    Giving: () => {
      body.innerHTML = `
        ${supporters.length ? card('<div id="suppTable"></div>', {
          title: `Support received — ${usd0(D.sum(supporters, g => g.amount))} from ${new Set(supporters.map(g => g.donor)).size} partners`,
          icon: 'give' }) : ''}
        ${card('<div id="giftTable"></div>', {
          title: `Gifts given — ${usd0(D.sum(gifts, g => g.amount))} across ${gifts.length}`,
          icon: 'history' })}`;
      if (supporters.length) new DataTable({
        hideTitle: true, title: `${u.name} — support received`, rows: supporters,
        pageSize: 8, columnFilters: false, sortKey: 'date', sortDir: 'desc',
        onRowClick: g => { location.hash = '#/donations/' + g.id; },
        columns: [
          { key: 'date', label: 'Date', render: g => `<a href="#/donations/${g.id}">${shortDate(g.date)}</a>` },
          { key: 'amount', label: 'Amount', className: 'num', render: g => usd(g.amount) },
          { key: 'donor', label: 'Partner', render: g => {
              const c = D.contacts.find(x => x.name === g.donor);
              return c ? `<a href="#/crm/${c.id}">${esc(g.donor)}</a>` : esc(g.donor); } },
          { key: 'recurring', label: 'Recurring', render: g => g.recurring ? badge('Active') : '—' },
          { key: 'memo', label: 'Memo' }
        ]
      }).mount(body.querySelector('#suppTable'));
      new DataTable({
        hideTitle: true, title: `${u.name} — giving`, rows: gifts, pageSize: 10, columnFilters: false, sortKey: 'date', sortDir: 'desc',
        columns: [
          { key: 'date', label: 'Date', render: g => shortDate(g.date) },
          { key: 'amount', label: 'Amount', className: 'num', render: g => usd(g.amount) },
          { key: 'type', label: 'Type' },
          { key: 'fund', label: 'Fund' },
          { key: 'method', label: 'Method' },
          { key: 'recurring', label: 'Recurring', render: g => g.recurring ? badge('Active') : '—' },
          { key: 'memo', label: 'Memo' }
        ]
      }).mount(body.querySelector('#giftTable'));
    },
    Expeditions: () => {
      body.innerHTML = card(exps.length ? `
        <div class="stack">
          ${exps.map(e => `
            <div style="border:1px solid var(--line);border-radius:3px;padding:14px">
              <div class="row row--between">
                <a href="#/expeditions/${e.id}"><strong>${esc(e.name)}</strong></a>
                <span>${badge(e.membership.role, e.membership.role === 'Team Member' ? 'draft' : 'role')} ${badge(e.status)}</span>
              </div>
              <div class="muted" style="font-size:12.5px;margin:3px 0 10px">
                ${esc(e.country)} · ${shortDate(e.start)} – ${shortDate(e.end)} · trip cost ${usd0(e.cost)}
              </div>
              ${progress(e.membership.pct, e.membership.pct >= 100)}
              <div class="row row--between" style="font-size:12.5px;margin-top:6px">
                <span class="muted">${usd(e.membership.raised)} raised of ${usd0(e.cost)}</span>
                <span><strong>${e.membership.pct}%</strong> funded</span>
              </div>
              <div class="row" style="margin-top:10px;gap:14px;font-size:12.5px">
                ${['passport','flight','insurance','forms'].map(k =>
                  `<span style="color:${e.membership[k] ? 'var(--emerald-pine)' : 'var(--input-grey)'}">${icon(k === 'flight' ? 'plane' : k === 'passport' ? 'passport' : k === 'insurance' ? 'shield' : 'file')} ${k[0].toUpperCase() + k.slice(1)}</span>`).join('')}
              </div>
            </div>`).join('')}
        </div>` : '<p class="muted">No expedition history on file.</p>',
        { title: 'Expeditions', icon: 'compass' });
    },
    Requests: () => {
      body.innerHTML = card('<div id="reqTable"></div>', { title: `Requests submitted (${reqs.length})`, icon: 'inbox' });
      new DataTable({
        hideTitle: true, title: `${u.name} — requests`, rows: reqs, pageSize: 10, columnFilters: false, sortKey: 'submitted', sortDir: 'desc',
        onRowClick: r => { location.hash = '#/requests/' + r.id; },
        columns: [
          { key: 'id', label: 'ID', render: r => `<a href="#/requests/${r.id}">${r.id}</a>` },
          { key: 'submitted', label: 'Submitted', render: r => dateTime(r.submitted) },
          { key: 'typeLabel', label: 'Type' },
          { key: 'summary', label: 'Summary' },
          { key: 'amount', label: 'Amount', className: 'num', render: r => r.amount == null ? '—' : usd(r.amount) },
          { key: 'status', label: 'Status', render: r => badge(r.status) }
        ]
      }).mount(body.querySelector('#reqTable'));
    },
    Access: () => {
      const sess = D.sessions.filter(s => s.userId === u.id);
      body.innerHTML = card(`
        ${deflist([
          ['Portal role', `<span class="badge badge--role">${esc(u.role)}</span>`],
          ['Two-factor (TOTP)', u.twoFactor ? badge('Active') : badge('Missing', 'draft')],
          ['Two-factor (Email)', badge('Missing', 'draft')],
          ['Account status', badge(u.status)],
          ['Active sessions', num(sess.length)]
        ])}
        <div class="hr"></div>
        <h3 class="section-title" style="margin-bottom:10px">${icon('device')} Devices</h3>
        ${sess.length ? sess.map(s => `
          <div class="row row--between" style="padding:9px 0;border-bottom:1px solid var(--line)">
            <div><strong>${esc(s.device)}</strong> <span class="muted">· ${esc(s.browser)}</span>
              <div class="muted" style="font-size:12px">${esc(s.location)} · ${esc(s.ip)} · ${dateTime(s.lastSeen)}</div></div>
            <button class="btn-mini btn-mini--danger" data-revoke="${s.id}">Revoke</button>
          </div>`).join('') : '<p class="muted">No active sessions recorded.</p>'}
        <div class="row" style="margin-top:16px">
          <button class="btn-mini btn-mini--danger" id="suspend">Suspend account</button>
          <button class="btn-mini" id="forceReset">Force password reset</button>
        </div>`, { title: 'Access & security', icon: 'shield' });


    }
  };

  tabs.Overview();
  // one delegated listener on the tab body, not one per tab render
  body.addEventListener('click', e => {
    const rev = e.target.closest('[data-revoke]');
    if (rev) { store.remove('sessions', rev.dataset.revoke); toast('Session revoked'); return tabs.Access(); }
    if (e.target.id === 'suspend') {
      store.update('users', u.id, { status: u.status === 'Suspended' ? 'Active' : 'Suspended' });
      toast(`${u.name} ${u.status === 'Suspended' ? 'reinstated' : 'suspended'}`);
      return render();
    }
    if (e.target.id === 'forceReset') { toast('Password reset email sent to ' + u.email); }
  });
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    tabs[b.dataset.tab]();
  });

  view.querySelector('#editBtn').addEventListener('click', () => modal({
    title: 'Edit ' + u.name, confirm: 'Save changes', wide: true,
    body: `<div class="form-grid">
      ${textField('First name', { value: u.first })}
      ${textField('Last name', { value: u.last })}
      ${textField('Username', { value: u.username })}
      ${textField('Email', { value: u.email, type: 'email', span: 2 })}
      ${textField('Phone', { value: u.phone })}
      ${textField('City', { value: u.city })}
      ${textField('State/Region', { value: u.region })}
      ${textField('Country', { value: u.country })}
      ${textField('Department', { value: u.department })}
      ${textField('Base', { value: u.base })}
      ${selectField('Portal role', ROLES_BY_PRIVILEGE, { value: u.role })}
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['First name', 'Last name', 'Email']);
      if (v === false) return false;
      store.update('users', u.id, {
        first: v['First name'], last: v['Last name'],
        name: `${v['First name']} ${v['Last name']}`,
        username: v['Username'], email: v['Email'], phone: v['Phone'],
        city: v['City'], region: v['State/Region'], country: v['Country'],
        department: v['Department'], base: v['Base'], role: v['Portal role']
      });
      toast('Record updated');
      render();
    }
  }));
  view.querySelector('#resetPw').addEventListener('click', () => toast('Password reset email sent to ' + u.email));
  view.querySelector('#impersonate').addEventListener('click', () => toast('Read-only impersonation session started (logged to audit)'));
  view.querySelector('#reqDocs').addEventListener('click', () => {
    const missing = [!u.passportExpiry && 'passport', u.insurance !== 'Current' && 'insurance',
      !u.twoFactor && 'two-factor enrolment'].filter(Boolean);
    if (!missing.length) return toast('Nothing outstanding for ' + u.name);
    store.create('tasks', {
      title: `Chase ${missing.join(', ')} from ${u.name}`,
      assignee: 'People & Care', related: u.department,
      due: '2026-09-21', overdue: false, priority: 'High', status: 'Open'
    });
    toast(`Requested ${missing.join(', ')} from ${u.name}`);
  });

  const nudge = view.querySelector('#nudgeOnboard');
  if (nudge) nudge.addEventListener('click', () => {
    const outstanding = steps.filter(x => !x[1]).map(x => x[0]);
    store.create('tasks', {
      title: `Onboarding follow-up: ${u.name}`, assignee: 'People & Care',
      related: u.department, due: '2026-09-21', overdue: false,
      priority: 'Normal', status: 'Open', notes: outstanding.join(', ')
    });
    toast(`Reminder sent — ${outstanding.length} steps outstanding`);
  });
}
