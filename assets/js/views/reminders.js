import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, shortDate, stat, num, modal, toast, tabs,
         textField, selectField, textareaField, requireFields, usd0 } from '../ui.js';
import * as store from '../store.js';
import { currentUser } from '../auth.js';

export default function reminders(view, { query }) {
  const render = () => reminders(view, { query });
  const me = currentUser();
  const open = D.reminders.filter(r => r.status === 'Open');
  const overdue = open.filter(r => r.past);
  const mine = D.reminders.filter(r => r.owner === me.name && r.status === 'Open');
  const upcoming = D.events.filter(e => !e.past);

  view.innerHTML = `
    ${pageHead({
      crumbs: [{ label: 'CRM', href: '#/crm' }, { label: 'Reminders & Events' }],
      title: 'Reminders & Events',
      sub: 'Everything you owe a contact, and every gathering on the calendar.',
      actions: `<button class="btn-mini" id="newEvent">${icon('compass')} Add event</button>
                <button class="btn" id="newReminder">Set reminder</button>`
    })}

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Open reminders', value: num(open.length), accent: 'var(--rain)' })}
      ${stat({ label: 'Overdue', value: num(overdue.length), accent: 'var(--flare)' })}
      ${stat({ label: 'Assigned to me', value: num(mine.length), accent: 'var(--sap)' })}
      ${stat({ label: 'Upcoming events', value: num(upcoming.length), accent: 'var(--emerald-pine)' })}
    </div>

    <div id="tabHost"></div>
    <div id="body"></div>`;

  const body = view.querySelector('#body');
  const views = {
    'Overdue': () => table(overdue),
    'All reminders': () => table(D.reminders),
    'Assigned to me': () => table(mine),
    'Events': () => eventTable()
  };
  const t = tabs(Object.keys(views), name => views[name](), query.get('tab'));
  view.querySelector('#tabHost').innerHTML = t.html;
  t.mount(view);
  views[t.active]();

  function table(rows) {
    body.innerHTML = '<div id="t"></div>';
    new DataTable({
      title: 'Reminders', rows, pageSize: 15, sortKey: 'due',
      onRowClick: r => { location.hash = '#/crm/' + r.contactId; },
      columns: [
        { key: 'title', label: 'Reminder' },
        { key: 'contact', label: 'Contact', render: r => `<a href="#/crm/${r.contactId}">${esc(r.contact)}</a>` },
        { key: 'owner', label: 'Owner' },
        { key: 'channel', label: 'Channel' },
        { key: 'due', label: 'Due', render: r =>
          `<span style="color:${r.past && r.status === 'Open' ? '#a32718' : 'inherit'}">${shortDate(r.due)}</span>` },
        { key: 'status', label: 'Status', render: r => badge(r.status === 'Done' ? 'Approved' : 'Open') },
        { key: 'act', label: '', sortable: false, filter: false, render: r => r.status === 'Done'
          ? '' : `<button class="btn-mini btn-mini--go" data-done="${r.id}">Mark done</button>` }
      ]
    }).mount(body.querySelector('#t'));
  }

  function eventTable() {
    body.innerHTML = '<div id="t"></div>';
    new DataTable({
      title: 'Events', rows: D.events, pageSize: 15, sortKey: 'date', sortDir: 'desc',
      columns: [
        { key: 'title', label: 'Event' },
        { key: 'date', label: 'Date', render: e => shortDate(e.date) },
        { key: 'location', label: 'Location' },
        { key: 'host', label: 'Host' },
        { key: 'invited', label: 'Invited', className: 'num' },
        { key: 'attended', label: 'Attended', className: 'num', render: e => e.past ? num(e.attended) : '—' },
        { key: 'raised', label: 'Raised', className: 'num', render: e => e.past ? usd0(e.raised) : '—' },
        { key: 'when', label: 'Status', value: e => e.past ? 'Past' : 'Upcoming',
          render: e => badge(e.past ? 'Draft' : 'Approved', e.past ? 'draft' : 'approved') }
      ]
    }).mount(body.querySelector('#t'));
  }

  body.addEventListener('click', e => {
    const d = e.target.closest('[data-done]');
    if (d) { store.update('reminders', d.dataset.done, { status: 'Done' }); toast('Reminder completed'); render(); }
  });

  view.querySelector('#newReminder').addEventListener('click', () => modal({
    title: 'Set a reminder', confirm: 'Set reminder',
    body: `${textField('What', { placeholder: 'Follow up on the partnership ask' })}
      ${textField('Contact', { list: 'contactList', placeholder: 'Search contacts' })}
      <datalist id="contactList">${D.contacts.slice(0, 120).map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>
      <div class="form-grid form-grid--2">
        ${textField('When', { type: 'date' })}
        ${selectField('Channel', ['Call', 'Email', 'Text', 'In person'])}
      </div>`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['What', 'Contact', 'When']);
      if (v === false) return false;
      const c = D.contacts.find(x => x.name === v['Contact']);
      store.create('reminders', {
        title: v['What'], contact: v['Contact'], contactId: c ? c.id : null,
        owner: me.name, due: v['When'], past: v['When'] < '2026-09-07',
        channel: v['Channel'], status: 'Open'
      });
      toast('Reminder set');
      render();
    }
  }));

  view.querySelector('#newEvent').addEventListener('click', () => modal({
    title: 'Add an event', confirm: 'Add event',
    body: `${textField('Event name', { placeholder: 'Support banquet' })}
      <div class="form-grid form-grid--2">
        ${textField('Date', { type: 'date' })}
        ${textField('Location', { placeholder: 'Lakeland, FL' })}
      </div>
      ${textField('Expected invitations', { type: 'number' })}
      ${textareaField('Notes', {})}`,
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Event name', 'Date']);
      if (v === false) return false;
      store.create('events', {
        title: v['Event name'], date: v['Date'], past: v['Date'] < '2026-09-07',
        location: v['Location'] || '—', host: me.name,
        invited: Number(v['Expected invitations']) || 0, attended: 0, raised: 0
      });
      toast('Event added');
      render();
    }
  }));
}
