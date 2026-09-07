import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, deflist, badge, esc, avatar, usd, usd0, shortDate, dateTime, DataTable, progress, modal, toast, num } from '../ui.js';

export default function person(view, { params }) {
  const u = D.findUser(params[0]);
  if (!u) { view.innerHTML = `<div class="card">${esc('No such person: ' + params[0])}</div>`; return; }

  const gifts = D.userDonations(u.id);
  const reqs = D.userRequests(u.id);
  const exps = D.userExpeditions(u.id);
  const page = D.donationPages.find(p => p.userId === u.id);

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
          <div><a href="tel:5550101">719 761 3823</a></div>
        </div>`, { title: null });
    },
    Giving: () => {
      body.innerHTML = card('<div id="giftTable"></div>', {
        title: `Giving history — ${usd0(D.sum(gifts, g => g.amount))} across ${gifts.length} gifts`,
        icon: 'give'
      });
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

      body.addEventListener('click', e => {
        if (e.target.closest('[data-revoke]')) toast('Session revoked');
        if (e.target.id === 'suspend') toast(`${u.name} suspended`);
        if (e.target.id === 'forceReset') toast('Password reset email sent');
      });
    }
  };

  tabs.Overview();
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    tabs[b.dataset.tab]();
  });

  view.querySelector('#editBtn').addEventListener('click', () => modal({
    title: 'Edit ' + u.name, confirm: 'Save changes', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label>First name</label><input value="${esc(u.first)}"></div>
      <div class="field"><label>Last name</label><input value="${esc(u.last)}"></div>
      <div class="field"><label>Username</label><input value="${esc(u.username)}"></div>
      <div class="field span-2"><label>Email</label><input value="${esc(u.email)}"></div>
      <div class="field"><label>Phone</label><input value="${esc(u.phone)}"></div>
      <div class="field"><label>City</label><input value="${esc(u.city)}"></div>
      <div class="field"><label>State/Region</label><input value="${esc(u.region)}"></div>
      <div class="field"><label>Country</label><input value="${esc(u.country)}"></div>
      <div class="field"><label>Department</label><input value="${esc(u.department)}"></div>
      <div class="field"><label>Base</label><input value="${esc(u.base)}"></div>
      <div class="field"><label>Portal role</label><select>${['Read Only','Staff','Expedition Leader','Finance','Base Director','Media','Donor Relations','Administrator'].map(r => `<option${r === u.role ? ' selected' : ''}>${r}</option>`).join('')}</select></div>
    </div>`,
    onConfirm: () => toast('Record updated')
  }));
  view.querySelector('#resetPw').addEventListener('click', () => toast('Password reset email sent to ' + u.email));
  view.querySelector('#impersonate').addEventListener('click', () => toast('Read-only impersonation session started (logged to audit)'));
  view.querySelector('#reqDocs').addEventListener('click', () => toast('Document request sent to ' + u.name));
}
