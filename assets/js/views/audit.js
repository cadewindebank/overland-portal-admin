import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, dateTime, stat, num, relative,
         modal, toast, textField, selectField, readForm } from '../ui.js';

export default function audit(view) {
  const denied = D.auditLog.filter(l => l.result === 'Denied');
  const byAction = {};
  D.auditLog.forEach(l => (byAction[l.label] = (byAction[l.label] || 0) + 1));

  view.innerHTML = `
    ${pageHead({
      title: 'Audit Log',
      sub: 'Immutable record of every consequential action taken in the portal. Retained for seven years.',
      actions: `<button class="btn" id="exportLog">${icon('download')} Export range</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Events (45 days)', value: num(D.auditLog.length), accent: 'var(--rain)' })}
      ${stat({ label: 'Denied actions', value: num(denied.length), accent: 'var(--flare)', meta: 'Permission refused' })}
      ${stat({ label: 'Distinct actors', value: num(new Set(D.auditLog.map(l => l.actorId)).size), accent: 'var(--sap)' })}
      ${stat({ label: 'Exports', value: num(D.auditLog.filter(l => l.action === 'export.csv').length), accent: 'var(--bark)',
               meta: 'Data leaving the portal' })}
    </div>

    <div class="grid grid--main">
      <div id="auditTable"></div>
      <div class="stack">
        ${card(`<ul class="timeline">
          ${Object.entries(byAction).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([a, n]) => `
            <li><div class="timeline__body">${esc(a)}</div><span class="timeline__when">${n}</span></li>`).join('')}
        </ul>`, { title: 'Most frequent actions', icon: 'chart' })}
        ${denied.length ? card(`<ul class="timeline">
          ${denied.slice(0, 6).map(l => `<li>
            <span class="timeline__icon">${icon('alert')}</span>
            <div class="timeline__body"><strong>${esc(l.actor)}</strong>
              <div class="muted" style="font-size:12px">${esc(l.label)} · ${esc(l.ip)}</div></div>
            <span class="timeline__when">${relative(l.when)}</span>
          </li>`).join('')}
        </ul>`, { title: 'Refused actions', icon: 'shield' }) : ''}
      </div>
    </div>`;

  const dt = new DataTable({
    title: 'Audit log', rows: D.auditLog, pageSize: 25, sortKey: 'when', sortDir: 'desc',
    columns: [
      { key: 'when', label: 'Timestamp', render: l => dateTime(l.when) },
      { key: 'actor', label: 'Actor', render: l => `<a href="#/people/${l.actorId}">${esc(l.actor)}</a>` },
      { key: 'action', label: 'Action', render: l => `<code style="font-size:12px">${esc(l.action)}</code>` },
      { key: 'label', label: 'Description' },
      { key: 'target', label: 'Target', render: l => {
          const t = String(l.target || '');
          const href = t.startsWith('R') ? '#/requests/' + t
            : t.startsWith('U') ? '#/people/' + t
            : t.startsWith('E') ? '#/expeditions/' + t
            : t.startsWith('C') ? '#/crm/' + t
            : t.startsWith('D') ? '#/donations/' + t
            : null;
          return href ? `<a href="${href}">${esc(t)}</a>` : esc(t);
        } },
      { key: 'ip', label: 'IP address' },
      { key: 'result', label: 'Result', render: l => badge(l.result === 'Success' ? 'Success' : 'Denied') }
    ]
  }).mount(view.querySelector('#auditTable'));

  view.querySelector('#exportLog').addEventListener('click', () => modal({
    title: 'Export the audit log', confirm: 'Export',
    body: `<div class="form-grid form-grid--2">
        ${textField('From', { type: 'date', value: '2026-07-24' })}
        ${textField('To', { type: 'date', value: '2026-09-07' })}
      </div>
      ${selectField('Result', ['All', 'Success only', 'Denied only'])}
      <div class="notice notice--warn">Exporting the audit log is itself recorded in the audit log.</div>`,
    onConfirm: scrim => {
      const v = readForm(scrim);
      const rows = D.auditLog.filter(l => {
        const day = String(l.when).slice(0, 10);
        if (v['From'] && day < v['From']) return false;
        if (v['To'] && day > v['To']) return false;
        if (v['Result'] === 'Success only' && l.result !== 'Success') return false;
        if (v['Result'] === 'Denied only' && l.result === 'Success') return false;
        return true;
      });
      if (!rows.length) {
        scrim.querySelector('.modal__body').insertAdjacentHTML('afterbegin',
          '<div class="notice notice--stop">No events in that range.</div>');
        return false;
      }
      const head = ['Timestamp', 'Actor', 'Action', 'Description', 'Target', 'IP', 'Result'];
      const csv = [head].concat(rows.map(l => [l.when, l.actor, l.action, l.label, l.target, l.ip, l.result]))
        .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `audit-${v['From']}-to-${v['To']}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      toast(`${rows.length} audit events exported`);
    }
  }));
  void dt;
}
