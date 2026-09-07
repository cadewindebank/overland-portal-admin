import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, dateTime, stat, num, modal, toast, relative,
         textField, selectField, textareaField, requireFields } from '../ui.js';
import * as store from '../store.js';

export default function alerts(view) {
  const render = () => alerts(view);
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
      ${textField('Title', { placeholder: 'System maintenance window Saturday 02:00 UTC' })}
      <div class="form-grid">
        ${selectField('Audience', ['All Users','Staff','Leaders','Expedition Members','Donors'])}
        ${selectField('Channel', ['Portal', 'Portal + Email', 'Email'])}
        ${selectField('Send', ['Immediately', 'Schedule'])}
      </div>
      ${textareaField('Message', { style: 'min-height:150px', placeholder: 'Write the notice. Keep it short — this appears in the portal alert tray.' })}
      <label class="check"><input type="checkbox">
        <span>Mark as urgent (pins to the top of the tray)</span></label>
    </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Title', 'Message']);
      if (v === false) return false;
      const audienceSize = { 'All Users': D.users.length, Staff: D.users.filter(u => u.type === 'Staff').length,
        Leaders: 24, 'Expedition Members': D.users.filter(u => u.type === 'Expedition Member').length,
        Donors: D.users.filter(u => u.type === 'Donor').length }[v['Audience']] || 0;
      store.create('alerts', {
        title: v['Title'], audience: v['Audience'], channel: v['Channel'],
        status: v['Send'] === 'Immediately' ? 'Sent' : 'Scheduled',
        sent: new Date().toISOString().slice(0, 16).replace('T', ' '),
        reach: audienceSize, opened: 0, body: v['Message'],
        urgent: !!v['Mark as urgent (pins to the top of the tray)']
      });
      toast(v['Send'] === 'Immediately' ? `Alert sent to ${audienceSize} people` : 'Alert scheduled');
      render();
    }
  }));
}
