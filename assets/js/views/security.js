import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, dateTime, stat, num, toast, modal, relative,
         selectField } from '../ui.js';
import * as store from '../store.js';

export default function security(view) {
  const render = () => security(view);
  const no2fa = D.users.filter(u => !u.twoFactor && u.type === 'Staff');
  const elevated = D.users.filter(u => ['Administrator', 'Finance'].includes(u.role));
  const elevatedNo2fa = elevated.filter(u => !u.twoFactor);

  view.innerHTML = `
    ${pageHead({
      title: 'Security & Devices',
      sub: 'Session control, two-factor coverage and the posture of privileged accounts.',
      actions: `<button class="btn-mini" id="enforce">${icon('shield')} Enforce 2FA for admins</button>
                <button class="btn" id="revokeAll">Revoke all sessions</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Active sessions', value: num(D.sessions.length), accent: 'var(--rain)' })}
      ${stat({ label: 'Two-factor coverage', value: Math.round(D.users.filter(u => u.twoFactor).length / D.users.length * 100) + '%', accent: 'var(--emerald-pine)' })}
      ${stat({ label: 'Staff without 2FA', value: num(no2fa.length), accent: 'var(--sap)' })}
      ${stat({ label: 'Privileged without 2FA', value: num(elevatedNo2fa.length), accent: 'var(--flare)',
               meta: elevatedNo2fa.length ? 'Fix this first' : 'All covered' })}
    </div>

    ${elevatedNo2fa.length ? card(`
      <p class="muted" style="margin-top:0">These accounts can approve money or change permissions and are not protected by a second factor.</p>
      <ul class="timeline">
        ${elevatedNo2fa.map(u => `<li>
          <span class="timeline__icon">${icon('alert')}</span>
          <div class="timeline__body"><a href="#/people/${u.id}"><strong>${esc(u.name)}</strong></a>
            <div class="muted" style="font-size:12px">${esc(u.role)} · ${esc(u.department)}</div></div>
          <button class="btn-mini" data-nudge="${u.id}">Require 2FA</button>
        </li>`).join('')}
      </ul>`, { title: 'Privileged accounts without two-factor', icon: 'shield' }) : ''}

    <div style="margin-top:18px" id="sessTable"></div>

    <div class="grid grid--2" style="margin-top:18px">
      ${card(`
        <div class="stack">
          ${[
            ['Session lifetime', '12 hours of inactivity'],
            ['Two-factor requirement', 'Required for Administrator and Finance'],
            ['Password policy', 'Minimum 12 characters, breach-checked'],
            ['New-device notification', 'Email the account holder'],
            ['Data export logging', 'Every CSV export written to the audit log']
          ].map(([k, v]) => `<div class="row row--between" style="padding:9px 0;border-bottom:1px solid var(--line)">
            <span>${esc(k)}</span><span class="muted">${esc(v)}</span></div>`).join('')}
        </div>`, { title: 'Security policy', icon: 'settings',
        actions: '<button class="btn-mini" id="editPolicy">Edit</button>' })}

      ${card(`<ul class="timeline">
        ${D.auditLog.filter(l => l.action.startsWith('session') || l.action.startsWith('user.login')).slice(0, 8).map(l => `<li>
          <span class="timeline__icon">${icon('device')}</span>
          <div class="timeline__body"><strong>${esc(l.actor)}</strong> — ${esc(l.label.toLowerCase())}
            <div class="muted" style="font-size:12px">${esc(l.ip)}</div></div>
          <span class="timeline__when">${relative(l.when)}</span>
        </li>`).join('')}
      </ul>`, { title: 'Recent sign-in activity', icon: 'history' })}
    </div>`;

  new DataTable({
    title: 'Active device sessions', rows: D.sessions, pageSize: 15, sortKey: 'lastSeen', sortDir: 'desc',
    columns: [
      { key: 'user', label: 'User', render: s => `<a href="#/people/${s.userId}">${esc(s.user)}</a>` },
      { key: 'device', label: 'Device' },
      { key: 'browser', label: 'Browser' },
      { key: 'location', label: 'Location' },
      { key: 'ip', label: 'IP address' },
      { key: 'lastSeen', label: 'Last seen', render: s => dateTime(s.lastSeen) },
      { key: 'trusted', label: 'Trusted', className: 'center', value: s => s.trusted ? 'Yes' : 'No',
        render: s => s.trusted ? badge('Active') : badge('Pending') },
      { key: 'act', label: '', sortable: false, filter: false,
        render: s => s.current ? '<span class="muted">This device</span>' : `<button class="btn-mini btn-mini--danger" data-revoke="${s.id}">Revoke</button>` }
    ]
  }).mount(view.querySelector('#sessTable'));

  view.addEventListener('click', e => {
    const rev = e.target.closest('[data-revoke]');
    if (rev) {
      store.remove('sessions', rev.dataset.revoke);
      toast('Session revoked — the device must sign in again');
      return render();
    }
    const nudge = e.target.closest('[data-nudge]');
    if (nudge) {
      store.update('users', nudge.dataset.nudge, { twoFactorRequired: true });
      toast('Two-factor enrolment required at next sign-in');
      return render();
    }
    if (e.target.id === 'editPolicy') editPolicy();
  });

  function editPolicy() {
    modal({
      title: 'Security policy', confirm: 'Save policy', wide: true,
      body: `<div class="form-grid form-grid--2">
          ${selectField('Session lifetime', ['4 hours of inactivity', '12 hours of inactivity', '7 days'], { value: '12 hours of inactivity' })}
          ${selectField('Two-factor requirement', ['Everyone', 'Administrator and Finance', 'Optional'], { value: 'Administrator and Finance' })}
          ${selectField('Minimum password length', ['8', '12', '16'], { value: '12' })}
          ${selectField('New-device notification', ['Email the account holder', 'Email security team', 'Off'], { value: 'Email the account holder' })}
        </div>
        <label class="check"><input type="checkbox" checked><span>Write every CSV export to the audit log</span></label>
        <label class="check"><input type="checkbox" checked><span>Breach-check passwords against known lists</span></label>
        <div class="notice notice--warn">These settings shape the interface. The server must enforce
          the same policy — see docs/SECURITY.md.</div>`,
      onConfirm: () => { toast('Security policy saved'); }
    });
  }
  view.querySelector('#enforce').addEventListener('click', () => modal({
    title: 'Enforce two-factor for privileged roles', confirm: 'Enforce',
    body: `<p style="margin-top:0">${elevated.length} accounts hold Administrator or Finance roles. ${elevatedNo2fa.length} of them have no second factor.</p>
      <p class="muted">Enforcing will require enrolment at their next sign-in. They will not be locked out.</p>`,
    onConfirm: () => {
      store.updateMany('users', elevatedNo2fa.map(u => u.id), { twoFactorRequired: true });
      toast(`${elevatedNo2fa.length} privileged accounts must enrol at next sign-in`);
      render();
    }
  }));
  view.querySelector('#revokeAll').addEventListener('click', () => modal({
    title: 'Revoke all sessions', confirm: 'Revoke everything',
    body: `<p style="margin-top:0">This signs out <strong>${D.sessions.length} devices</strong> across every account, including your own.</p>
      <p class="muted">Use this after a credential compromise. Everyone will need to sign in again.</p>`,
    onConfirm: () => {
      const n = D.sessions.length;
      [...D.sessions].forEach(s => store.remove('sessions', s.id));
      toast(`${n} sessions revoked`);
      render();
    }
  }));
}
