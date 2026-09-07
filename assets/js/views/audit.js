import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, dateTime, stat, num, relative } from '../ui.js';

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
      { key: 'target', label: 'Target' },
      { key: 'ip', label: 'IP address' },
      { key: 'result', label: 'Result', render: l => badge(l.result === 'Success' ? 'Success' : 'Denied') }
    ]
  }).mount(view.querySelector('#auditTable'));

  view.querySelector('#exportLog').addEventListener('click', () => dt.exportCsv());
}
