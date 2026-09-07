import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, badge, esc, usd, usd0, dateTime, relative, deflist, modal, toast, avatar } from '../ui.js';

export default function request(view, { params }) {
  const r = D.findRequest(params[0]);
  if (!r) { view.innerHTML = `<div class="card">${esc('No such request: ' + params[0])}</div>`; return; }

  const u = D.findUser(r.requesterId);
  const type = D.REQUEST_TYPES.find(t => t.key === r.type);
  const available = u ? u.balance : 0;
  const covered = r.amount == null || available >= r.amount;
  const siblings = D.requests.filter(x => x.requesterId === r.requesterId && x.id !== r.id).slice(0, 5);

  view.innerHTML = `
    ${pageHead({
      crumbs: [{ label: 'Request Queue', href: '#/requests' },
               { label: type.label, href: '#/requests?type=' + r.type },
               { label: r.id }],
      title: r.summary,
      sub: `${esc(type.label)} · ${esc(r.queue)} queue · submitted ${dateTime(r.submitted)}`,
      actions: `<button class="btn-mini btn-mini--danger" id="deny">Deny</button>
                <button class="btn-mini" id="info">Request info</button>
                <button class="btn" id="approve">Approve</button>`
    })}

    <div class="grid grid--main">
      <div class="stack">
        ${card(`
          <div class="row" style="gap:24px;align-items:flex-start;margin-bottom:16px">
            ${r.amount != null ? `<div>
              <div class="eyebrow">Amount requested</div>
              <div style="font-family:var(--font-display);font-size:44px;line-height:1">${usd(r.amount)}</div>
              <div class="muted" style="font-size:12.5px">${esc(r.currency)}</div>
            </div>` : ''}
            <div style="flex:1;min-width:200px">
              <div class="eyebrow">Status</div>
              <div style="margin:4px 0 10px">${badge(r.status)} ${r.priority === 'Urgent' ? badge('Urgent') : ''}</div>
              <div class="muted" style="font-size:12.5px">
                ${r.assignee ? `Assigned to <strong>${esc(r.assignee)}</strong>` : 'Unassigned'}
                · ${relative(r.submitted)}
              </div>
            </div>
          </div>
          <p style="margin:0 0 16px">${esc(r.detail)}</p>
          ${deflist([
            ['Request ID', esc(r.id)],
            ['Type', esc(type.label)],
            ['Routing queue', esc(r.queue)],
            ['Requester', `<a href="#/people/${r.requesterId}">${esc(r.requester)}</a>`],
            ['Department', esc(r.department)],
            ['Related expedition', r.expedition ? esc(r.expedition) : '—'],
            ['Currency', esc(r.currency)],
            ['Submitted', dateTime(r.submitted)]
          ])}`, { title: 'Request', icon: type.icon })}

        ${r.amount != null ? card(`
          <div class="grid grid--3" style="text-align:center;margin-bottom:14px">
            <div><div class="eyebrow">Account balance</div>
              <div style="font-family:var(--font-display);font-size:30px;line-height:1.1">${usd0(available)}</div></div>
            <div><div class="eyebrow">This request</div>
              <div style="font-family:var(--font-display);font-size:30px;line-height:1.1">${usd0(r.amount)}</div></div>
            <div><div class="eyebrow">Balance after</div>
              <div style="font-family:var(--font-display);font-size:30px;line-height:1.1;color:${covered ? 'var(--emerald-pine)' : '#a32718'}">${usd0(available - r.amount)}</div></div>
          </div>
          <div style="padding:12px 14px;border-radius:3px;background:${covered ? '#eef6f3' : '#fdf1ef'};border:1px solid ${covered ? '#b4d3c8' : '#eec5be'};font-size:13px">
            ${covered
              ? '✓ The requester’s available balance covers this request.'
              : '⚠ This request exceeds the requester’s available balance. Approving it will put the account into deficit.'}
          </div>`, { title: 'Funding check', icon: 'dollar' }) : ''}

        ${card(`
          <ul class="timeline">
            ${r.thread.map(m => `<li>
              <span class="timeline__icon">${icon(m.who === 'System' ? 'settings' : 'person')}</span>
              <div class="timeline__body"><strong>${esc(m.who)}</strong>
                <div>${esc(m.text)}</div></div>
              <span class="timeline__when">${relative(m.when)}</span>
            </li>`).join('')}
          </ul>
          <div class="hr"></div>
          <div class="field"><label>Add a note</label><textarea placeholder="Visible to the requester and everyone in the ${esc(r.queue)} queue."></textarea></div>
          <div class="row" style="margin-top:10px"><button class="btn-mini" id="postNote">Post note</button></div>`,
          { title: 'Activity', icon: 'history' })}
      </div>

      <div class="stack">
        ${u ? card(`
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
            ${avatar(u.name, 'avatar--lg')}
            <div><div style="font-weight:600">${esc(u.name)}</div>
              <div class="muted" style="font-size:12.5px">${esc(u.department)}</div></div>
          </div>
          ${deflist([
            ['Email', `<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>`],
            ['Base', esc(u.base)],
            ['Balance', usd(u.balance)],
            ['Role', `<span class="badge badge--role">${esc(u.role)}</span>`]
          ])}
          <a class="btn-mini w-100" style="margin-top:12px;justify-content:center" href="#/people/${u.id}">Open full profile</a>`,
          { title: 'Requester', icon: 'person' }) : ''}

        ${card(`
          <div class="field"><label>Assign to</label>
            <select id="assignSel">
              <option value="">Unassigned</option>
              ${D.users.slice(0, 20).map(x => `<option${x.name === r.assignee ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}
            </select></div>
          <div class="field" style="margin-top:12px"><label>Priority</label>
            <select id="prioSel">${['Normal','High','Urgent'].map(p => `<option${p === r.priority ? ' selected' : ''}>${p}</option>`).join('')}</select></div>
          <button class="btn-mini w-100" style="margin-top:14px;justify-content:center" id="saveRouting">Save routing</button>`,
          { title: 'Routing', icon: 'inbox' })}

        ${siblings.length ? card(`<ul class="timeline">
          ${siblings.map(s => `<li>
            <span class="timeline__icon">${icon(D.REQUEST_TYPES.find(t => t.key === s.type).icon)}</span>
            <div class="timeline__body"><a href="#/requests/${s.id}">${esc(s.typeLabel)}</a>
              <div class="muted" style="font-size:12px">${esc(s.summary.slice(0, 40))}…</div></div>
            <span class="timeline__when">${badge(s.status)}</span>
          </li>`).join('')}
        </ul>`, { title: 'Other requests from ' + esc(r.requester.split(' ')[0]), icon: 'history' }) : ''}
      </div>
    </div>`;

  view.querySelector('#approve').addEventListener('click', () => modal({
    title: 'Approve ' + r.id, confirm: 'Approve request',
    body: `<p style="margin-top:0">${esc(r.summary)}${r.amount ? ` — <strong>${usd(r.amount)}</strong>` : ''}</p>
      ${!covered ? `<div style="padding:11px 13px;border-radius:3px;background:#fdf1ef;border:1px solid #eec5be;font-size:13px;margin-bottom:14px">
        ⚠ This exceeds the requester’s available balance by ${usd0(r.amount - available)}.</div>` : ''}
      <div class="field"><label>Approval note</label><textarea placeholder="Optional — recorded on the request."></textarea></div>`,
    onConfirm: () => toast(r.id + ' approved')
  }));
  view.querySelector('#deny').addEventListener('click', () => modal({
    title: 'Deny ' + r.id, confirm: 'Deny request',
    body: `<div class="field"><label>Reason (sent to the requester)</label>
      <textarea placeholder="Explain what needs to change before this can be resubmitted."></textarea></div>`,
    onConfirm: () => toast(r.id + ' denied — requester notified')
  }));
  view.querySelector('#info').addEventListener('click', () => toast('Information request sent to ' + r.requester));
  view.querySelector('#postNote').addEventListener('click', () => toast('Note posted to the request'));
  view.querySelector('#saveRouting').addEventListener('click', () => toast('Routing updated'));
}
