import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, badge, esc, usd, usd0, dateTime, relative, deflist, modal, toast, avatar, readForm, textareaField, selectField, requireFields } from '../ui.js';
import * as store from '../store.js';
import { APPROVAL_LIMIT, needsDualAuth, DUAL_AUTH_THRESHOLD } from '../policy.js';
import { currentUser, can } from '../auth.js';

export default function request(view, { params }) {
  const render = () => request(view, { params });
  const r = D.findRequest(params[0]);
  if (!r) { view.innerHTML = `<div class="card">${esc('No such request: ' + params[0])}</div>`; return; }

  const u = D.findUser(r.requesterId);
  const type = D.REQUEST_TYPES.find(t => t.key === r.type);
  /* Committed = approved-but-unpaid requests from the same person. The old
     check ignored these and so disagreed with Accounts & Balances. */
  const committed = D.sum(
    D.requests.filter(x => x.requesterId === r.requesterId && x.id !== r.id &&
      x.amount != null && ['Approved', 'Awaiting 2nd approval'].includes(x.status)),
    x => x.amount);
  const balance = u ? u.balance : 0;
  const available = balance - committed;
  const covered = r.amount == null || available >= r.amount;
  const me = currentUser();
  const limit = APPROVAL_LIMIT[me.role] ?? 0;
  const overLimit = r.amount != null && r.amount > limit;
  const dual = needsDualAuth(r.amount);
  const alreadyApprovedByMe = r.approvedBy === me.name;
  const decided = ['Approved', 'Paid', 'Denied'].includes(r.status);
  const siblings = D.requests.filter(x => x.requesterId === r.requesterId && x.id !== r.id).slice(0, 5);

  view.innerHTML = `
    ${pageHead({
      crumbs: [{ label: 'Request Queue', href: '#/requests' },
               { label: type.label, href: '#/requests?type=' + r.type },
               { label: r.id }],
      title: r.summary,
      sub: `${esc(type.label)} · ${esc(r.queue)} queue · submitted ${dateTime(r.submitted)}`,
      actions: `${decided ? `<span class="muted" style="font-size:12.5px">Decided · ${esc(r.status)}</span>
                   <button class="btn-mini" id="reopen">Reopen</button>`
                : `<button class="btn-mini btn-mini--danger" id="deny">Deny</button>
                   <button class="btn-mini" id="info">Request info</button>
                   <button class="btn" id="approve"${!can('requests.approve') || overLimit ? ' disabled' : ''}>${
                     r.status === 'Awaiting 2nd approval' ? 'Give 2nd approval' : 'Approve'}</button>`}`
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
            ['Related expedition', r.expedition
              ? (() => { const e = D.expeditions.find(x => x.name === r.expedition);
                  return e ? `<a href="#/expeditions/${e.id}">${esc(r.expedition)}</a>` : esc(r.expedition); })()
              : '—'],
            ['Currency', esc(r.currency)],
            ['Submitted', dateTime(r.submitted)]
          ])}`, { title: 'Request', icon: type.icon })}

        ${r.amount != null ? card(`
          <div class="grid grid--4" style="text-align:center;margin-bottom:14px">
            <div><div class="eyebrow">Balance</div>
              <div style="font-family:var(--font-display);font-size:28px;line-height:1.1">${usd0(balance)}</div></div>
            <div><div class="eyebrow">Committed</div>
              <div style="font-family:var(--font-display);font-size:28px;line-height:1.1;color:var(--sap)">−${usd0(committed)}</div>
              <div class="muted" style="font-size:11px">Approved, not yet paid</div></div>
            <div><div class="eyebrow">This request</div>
              <div style="font-family:var(--font-display);font-size:28px;line-height:1.1">−${usd0(r.amount)}</div></div>
            <div><div class="eyebrow">Available after</div>
              <div style="font-family:var(--font-display);font-size:28px;line-height:1.1;color:${covered ? 'var(--emerald-pine)' : '#a32718'}">${usd0(available - r.amount)}</div></div>
          </div>
          <div class="notice ${covered ? 'notice--go' : 'notice--stop'}">
            ${covered
              ? 'The requester’s available balance covers this request after money already committed.'
              : `This exceeds the available balance by ${usd0(r.amount - available)} once ${usd0(committed)} of already-approved requests is taken into account. Approving it will put the account into deficit.`}
          </div>
          ${overLimit ? `<div class="notice notice--warn">This amount is above your approval limit of
            ${limit === Infinity ? 'unlimited' : usd0(limit)} as ${esc(me.role)}. It must go to a higher approver.</div>` : ''}
          ${dual ? `<div class="notice notice--warn">Amounts of ${usd0(DUAL_AUTH_THRESHOLD)} or more require two
            different approvers.${r.approvedBy ? ` First approval by <strong>${esc(r.approvedBy)}</strong>.` : ''}</div>` : ''}
          <a class="btn-mini" href="#/accounts">Open Accounts &amp; Balances</a>`,
          { title: 'Funding check', icon: 'dollar' }) : ''}

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
          <div class="field"><label for="noteBox">Add a note</label>
            <textarea id="noteBox" placeholder="Visible to the requester and everyone in the ${esc(r.queue)} queue."></textarea></div>
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

  const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const note = (who, text) => ({ who, when: stamp(), text });

  const $ = sel => view.querySelector(sel);

  if ($('#approve')) $('#approve').addEventListener('click', () => modal({
    title: (r.status === 'Awaiting 2nd approval' ? 'Second approval for ' : 'Approve ') + r.id,
    confirm: 'Approve request',
    body: `<p style="margin-top:0">${esc(r.summary)}${r.amount ? ` — <strong>${usd(r.amount)}</strong>` : ''}</p>
      ${!covered ? `<div class="notice notice--stop">This exceeds the requester’s available balance by
        ${usd0(r.amount - available)} once committed funds are counted.</div>` : ''}
      ${dual && !r.approvedBy ? `<div class="notice notice--warn">This will record your approval and hold the
        request for a second, different approver.</div>` : ''}
      ${textareaField('Approval note', { placeholder: 'Recorded on the request and visible to the requester.' })}`,
    onConfirm: scrim => {
      const text = readForm(scrim)['Approval note'] || '';
      const secondNeeded = dual && !r.approvedBy;
      const next = secondNeeded ? 'Awaiting 2nd approval' : 'Approved';
      store.update('requests', r.id, {
        status: next,
        approvedBy: r.approvedBy || me.name,
        secondApprovedBy: secondNeeded ? null : (r.approvedBy && r.approvedBy !== me.name ? me.name : null),
        thread: [...r.thread, note(me.name, text || (secondNeeded
          ? 'Approved — held for a second authoriser.'
          : 'Approved.'))]
      });
      toast(secondNeeded ? `${r.id} approved — awaiting a second approver` : `${r.id} approved`);
      render();
    }
  }));

  if ($('#deny')) $('#deny').addEventListener('click', () => modal({
    title: 'Deny ' + r.id, confirm: 'Deny request',
    body: textareaField('Reason', {
      placeholder: 'Explain what needs to change before this can be resubmitted.', hint: 'Sent to the requester.' }),
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Reason']);
      if (v === false) return false;
      store.update('requests', r.id, {
        status: 'Denied',
        thread: [...r.thread, note(me.name, v['Reason'])]
      });
      toast(`${r.id} denied — requester notified`);
      render();
    }
  }));

  if ($('#reopen')) $('#reopen').addEventListener('click', () => modal({
    title: 'Reopen ' + r.id, confirm: 'Reopen request',
    body: `<p style="margin-top:0">This returns the request to the queue for another decision.</p>
      ${textareaField('Why is this being reopened?', {})}`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Why is this being reopened?']);
      if (v === false) return false;
      store.update('requests', r.id, {
        status: 'In Review', approvedBy: null, secondApprovedBy: null,
        thread: [...r.thread, note(me.name, 'Reopened: ' + v['Why is this being reopened?'])]
      });
      toast(`${r.id} reopened`);
      render();
    }
  }));

  if ($('#info')) $('#info').addEventListener('click', () => modal({
    title: 'Request more information', confirm: 'Send request',
    body: textareaField('What do you need from ' + r.requester + '?', {}),
    onConfirm: scrim => {
      const key = 'What do you need from ' + r.requester + '?';
      const v = requireFields(scrim, [key]);
      if (v === false) return false;
      store.update('requests', r.id, {
        status: 'Info requested',
        thread: [...r.thread, note(me.name, 'Information requested: ' + v[key])]
      });
      toast('Information request sent to ' + r.requester);
      render();
    }
  }));

  $('#postNote').addEventListener('click', () => {
    const box = view.querySelector('#noteBox');
    const text = box.value.trim();
    if (!text) { box.focus(); return toast('Write a note first'); }
    store.update('requests', r.id, { thread: [...r.thread, note(me.name, text)] });
    toast('Note posted');
    render();
  });

  $('#saveRouting').addEventListener('click', () => {
    store.update('requests', r.id, {
      assignee: view.querySelector('#assignSel').value || null,
      priority: view.querySelector('#prioSel').value
    });
    toast('Routing updated');
    render();
  });
}
