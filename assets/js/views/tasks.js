import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, shortDate, stat, num, modal, toast } from '../ui.js';

export default function tasks(view) {
  const open = D.openTasks();
  const overdue = open.filter(t => t.overdue);
  const mine = D.tasks.filter(t => t.assignee === D.me.name);

  view.innerHTML = `
    ${pageHead({
      title: 'Tasks',
      sub: 'Work assigned across the portal — document chasing, approvals, close-outs and follow-ups.',
      actions: `<button class="btn" id="newTask">Assign a task</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Open tasks', value: num(open.length), accent: 'var(--rain)' })}
      ${stat({ label: 'Overdue', value: num(overdue.length), accent: 'var(--flare)' })}
      ${stat({ label: 'Assigned to me', value: num(mine.filter(t => t.status !== 'Done').length), accent: 'var(--sap)' })}
      ${stat({ label: 'Completed', value: num(D.tasks.filter(t => t.status === 'Done').length), accent: 'var(--emerald-pine)' })}
    </div>

    ${overdue.length ? card(`
      <ul class="timeline">
        ${overdue.slice(0, 6).map(t => `<li>
          <span class="timeline__icon">${icon('clock')}</span>
          <div class="timeline__body"><strong>${esc(t.title)}</strong>
            <div class="muted" style="font-size:12px">${esc(t.assignee)} · ${esc(t.related)}</div></div>
          <span class="timeline__when" style="color:#a32718">due ${shortDate(t.due)}</span>
        </li>`).join('')}
      </ul>`, { title: `Overdue (${overdue.length})`, icon: 'alert' }) : ''}

    <div class="tabs" id="tabs" style="margin-top:18px">
      ${['Open','Assigned to me','All'].map((t, i) => `<button data-tab="${t}"${i === 0 ? ' class="is-active"' : ''}>${t}</button>`).join('')}
    </div>
    <div id="taskTable"></div>`;

  const build = rows => new DataTable({
    title: 'Tasks', rows, pageSize: 15, sortKey: 'due',
    columns: [
      { key: 'title', label: 'Task' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'related', label: 'Related to' },
      { key: 'due', label: 'Due', render: t => `<span style="color:${t.overdue && t.status !== 'Done' ? '#a32718' : 'inherit'}">${shortDate(t.due)}</span>` },
      { key: 'priority', label: 'Priority', render: t => t.priority === 'Urgent' ? badge('Urgent') : esc(t.priority) },
      { key: 'status', label: 'Status', render: t => badge(t.status) },
      { key: 'act', label: '', sortable: false, filter: false,
        render: t => t.status === 'Done' ? '' : `<button class="btn-mini btn-mini--go" data-done="${t.id}">Mark done</button>` }
    ]
  }).mount(view.querySelector('#taskTable'));

  build(open);
  view.querySelector('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    view.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('is-active', x === b));
    build(b.dataset.tab === 'Open' ? open : b.dataset.tab === 'All' ? D.tasks : mine);
  });
  view.querySelector('#taskTable').addEventListener('click', e => {
    if (e.target.closest('[data-done]')) toast('Task marked complete');
  });
  view.querySelector('#newTask').addEventListener('click', () => modal({
    title: 'Assign a task', confirm: 'Assign task',
    body: `<div class="stack">
      <div class="field"><label>Task</label><input placeholder="Verify passport scan for the May team"></div>
      <div class="field"><label>Assign to</label><select>${D.users.slice(0, 25).map(u => `<option>${esc(u.name)}</option>`).join('')}</select></div>
      <div class="form-grid form-grid--2">
        <div class="field"><label>Due date</label><input type="date"></div>
        <div class="field"><label>Priority</label><select><option>Normal</option><option>High</option><option>Urgent</option></select></div>
      </div>
      <div class="field"><label>Notes</label><textarea placeholder="Context the assignee needs."></textarea></div>
    </div>`,
    onConfirm: () => toast('Task assigned')
  }));
}
