import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, dateTime, stat, num, modal, toast, relative } from '../ui.js';

export default function alerts(view) {
  const sent = D.alerts.filter(a => a.status === 'Sent');
  const openRate = sent.length ? Math.round(D.sum(sent, a => a.opened) / D.sum(sent, a => a.reach) * 100) : 0;

  view.innerHTML = `
    ${pageHead({
      title: 'Alerts & Communications',
      sub: 'Portal notices and email sent to staff, leaders, expedition members and donors.',
      actions: `<button class="btn" id="compose">Compose alert</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Sent', value: num(sent.length), accent: 'var(--rain)' })}
      ${stat({ label: 'Scheduled', value: num(D.alerts.filter(a => a.status === 'Scheduled').length), accent: 'var(--flare)' })}
      ${stat({ label: 'Total reach', value: num(D.sum(sent, a => a.reach)), accent: 'var(--lagoon)' })}
      ${stat({ label: 'Open rate', value: openRate + '%', accent: 'var(--emerald-pine)' })}
    </div>

    <div class="grid grid--main">
      <div id="alertTable"></div>
      ${card(`<ul class="timeline">
        ${D.alerts.slice(0, 7).map(a => `<li>
          <span class="timeline__icon">${icon('bell')}</span>
          <div class="timeline__body"><strong>${esc(a.title)}</strong>
            <div class="muted" style="font-size:12px">${esc(a.audience)} · ${esc(a.channel)}</div></div>
          <span class="timeline__when">${relative(a.sent)}</span>
        </li>`).join('')}
      </ul>`, { title: 'Recent notices', icon: 'history' })}
    </div>`;

  new DataTable({
    title: 'Alerts', rows: D.alerts, pageSize: 15, sortKey: 'sent', sortDir: 'desc',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'audience', label: 'Audience' },
      { key: 'channel', label: 'Channel' },
      { key: 'sent', label: 'Sent', render: a => dateTime(a.sent) },
      { key: 'reach', label: 'Reach', className: 'num', render: a => num(a.reach) },
      { key: 'opened', label: 'Opened', className: 'num',
        render: a => `${num(a.opened)} <span class="muted">(${Math.round(a.opened / a.reach * 100)}%)</span>` },
      { key: 'status', label: 'Status', render: a => badge(a.status) }
    ]
  }).mount(view.querySelector('#alertTable'));

  view.querySelector('#compose').addEventListener('click', () => modal({
    title: 'Compose an alert', confirm: 'Send alert', wide: true,
    body: `<div class="stack">
      <div class="field"><label>Title</label><input placeholder="System maintenance window Saturday 02:00 UTC"></div>
      <div class="form-grid">
        <div class="field"><label>Audience</label><select>${['All Users','Staff','Leaders','Expedition Members','Donors'].map(a => `<option>${a}</option>`).join('')}</select></div>
        <div class="field"><label>Channel</label><select><option>Portal</option><option>Portal + Email</option><option>Email</option></select></div>
        <div class="field"><label>Send</label><select><option>Immediately</option><option>Schedule…</option></select></div>
      </div>
      <div class="field"><label>Message</label><textarea style="min-height:150px" placeholder="Write the notice. Keep it short — this appears in the portal alert tray."></textarea></div>
      <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox"> Mark as urgent (pins to the top of the tray)</label>
    </div>`,
    onConfirm: () => toast('Alert queued for delivery')
  }));
}
