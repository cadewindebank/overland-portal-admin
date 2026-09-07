import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, shortDate, stat, num, modal, toast,
         field, textField, selectField, requireFields, readForm } from '../ui.js';
import * as store from '../store.js';

const GUIDES = [
  ['Brand Guide', 'Logos, colour, type and how the Overland mark may be used.', 'image', '#/media?collection=Brand%20Guide'],
  ['Writing Guide', 'Voice, tone, terminology and the words we use for our work.', 'file', '#/media?collection=Writing%20Guide'],
  ['Media Resources', 'Downloadable photography, video and templates for teams.', 'download', '#/media?collection=Expedition%20Media'],
  ['Email Signature', 'Generate a signature block that matches the brand.', 'edit', '#/settings'],
  ['Cybersecurity Policy', 'Policies, tips and how-to guides for staff devices.', 'shield', '#/security']
];

export default function media(view, { query } = {}) {
  const render = () => media(view, { query });
  view.innerHTML = `
    ${pageHead({
      title: 'Media Library',
      sub: 'Brand assets, field photography and the guides that govern how they are used.',
      actions: `<button class="btn-mini" id="newCol">${icon('plus')} New collection</button>
                <button class="btn" id="upload">Upload assets</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${GUIDES.map(([t, d, ic, href]) => `
        <a class="card" href="${href}" style="text-decoration:none;color:inherit">
          <span style="color:var(--flare);display:inline-flex">${icon(ic)}</span>
          <h3 style="margin:8px 0 4px;font-size:15px">${esc(t)}</h3>
          <p class="muted" style="margin:0;font-size:12.5px">${esc(d)}</p>
        </a>`).join('')}
    </div>

    <div class="grid grid--4" style="margin-bottom:18px">
      ${stat({ label: 'Assets', value: num(D.mediaAssets.length), accent: 'var(--rain)' })}
      ${stat({ label: 'Collections', value: num(new Set(D.mediaAssets.map(m => m.collection)).size), accent: 'var(--sap)' })}
      ${stat({ label: 'Public licence', value: num(D.mediaAssets.filter(m => m.license === 'Public').length), accent: 'var(--emerald-pine)' })}
      ${stat({ label: 'Restricted', value: num(D.mediaAssets.filter(m => m.license === 'Restricted').length), accent: 'var(--flare)',
               meta: 'Consent required before use' })}
    </div>

    <div id="mediaTable"></div>`;

  const wanted = query && query.get && query.get('collection');
  new DataTable({
    title: 'Media assets',
    rows: wanted ? D.mediaAssets.filter(m => m.collection === wanted) : D.mediaAssets,
    pageSize: 15, sortKey: 'uploaded', sortDir: 'desc',
    columns: [
      { key: 'name', label: 'Asset', render: m => `<span style="display:flex;align-items:center;gap:9px">${icon(m.kind === 'Video' ? 'camera' : m.kind === 'Document' ? 'file' : 'image')}<span>${esc(m.name)}</span></span>` },
      { key: 'kind', label: 'Type' },
      { key: 'collection', label: 'Collection' },
      { key: 'size', label: 'Size', className: 'num' },
      { key: 'license', label: 'Licence', render: m => badge(m.license === 'Restricted' ? 'Denied' : m.license === 'Public' ? 'Approved' : 'Draft', m.license === 'Restricted' ? 'denied' : m.license === 'Public' ? 'approved' : 'draft') },
      { key: 'by', label: 'Uploaded by' },
      { key: 'uploaded', label: 'Uploaded', render: m => shortDate(m.uploaded) },
      { key: 'act', label: '', sortable: false, filter: false,
        render: m => `<button class="btn-mini" data-get="${m.id}">Download</button>` }
    ]
  }).mount(view.querySelector('#mediaTable'));

  view.querySelector('#upload').addEventListener('click', () => modal({
    title: 'Upload assets', confirm: 'Upload',
    body: `<div class="stack">
      ${field('Files', id => `<input id="${id}" type="file" multiple>`)}
      ${selectField('Collection', [...new Set(D.mediaAssets.map(m => m.collection))])}
      ${selectField('Licence', ['Internal', 'Public', 'Restricted'])}
      ${textField('Caption / credit', { placeholder: 'Who took it and where' })}
      <label class="check"><input type="checkbox">
        <span>Photo consent on file for identifiable people</span></label>
    </div>`,
    onConfirm: scrim => {
      const v = readForm(scrim);
      store.create('mediaAssets', {
        name: (v['Caption / credit'] || 'Untitled asset').replace(/\s+/g, '_').slice(0, 40),
        kind: 'Photo', collection: v['Collection'], size: '\u2014',
        license: v['Licence'], uploaded: new Date().toISOString().slice(0, 10), by: 'You'
      });
      toast('Asset added to the library');
      render();
    }
  }));
  view.querySelector('#mediaTable').addEventListener('click', e => {
    const b = e.target.closest('[data-get]');
    if (!b) return;
    const m = D.mediaAssets.find(x => String(x.id) === b.dataset.get);
    if (m.license === 'Restricted') {
      return modal({
        title: 'Restricted asset', confirm: 'Download anyway',
        body: `<div class="notice notice--stop">${esc(m.name)} is marked <strong>Restricted</strong>.
          Confirm you have consent from everyone identifiable in it before using it.</div>
          <label class="check"><input type="checkbox" id="consent"><span>Consent is on file</span></label>`,
        onConfirm: scrim => {
          if (!scrim.querySelector('#consent').checked) {
            if (!scrim.querySelector('.field__error'))
              scrim.querySelector('.modal__body').insertAdjacentHTML('beforeend',
                '<div class="field__error">Tick the box to confirm consent.</div>');
            return false;
          }
          toast(`${m.name} downloaded — access logged`);
        }
      });
    }
    toast(`${m.name} downloaded`);
  });

  view.querySelector('#newCol').addEventListener('click', () => modal({
    title: 'New collection', confirm: 'Create collection',
    body: textField('Collection name', { placeholder: 'Zambia 2027' }),
    onConfirm: scrim => {
      const v = requireFields(scrim, ['Collection name']);
      if (v === false) return false;
      toast('Collection created: ' + v['Collection name']);
    }
  }));
}
