import * as D from '../data.js';
import { icon } from '../icons.js';
import { pageHead, card, DataTable, badge, esc, shortDate, stat, num, modal, toast } from '../ui.js';

const GUIDES = [
  ['Brand Guide', 'Logos, colour, type and how the Overland mark may be used.', 'image'],
  ['Writing Guide', 'Voice, tone, terminology and the words we use for our work.', 'file'],
  ['Media Resources', 'Downloadable photography, video and templates for teams.', 'download'],
  ['Email Signature', 'Generate a signature block that matches the brand.', 'edit'],
  ['Cybersecurity Policy', 'Policies, tips and how-to guides for staff devices.', 'shield']
];

export default function media(view) {
  view.innerHTML = `
    ${pageHead({
      title: 'Media Library',
      sub: 'Brand assets, field photography and the guides that govern how they are used.',
      actions: `<button class="btn-mini" id="newCol">${icon('plus')} New collection</button>
                <button class="btn" id="upload">Upload assets</button>`
    })}

    <div class="grid grid--5" style="margin-bottom:18px">
      ${GUIDES.map(([t, d, ic]) => `
        <a class="card" href="#/media" style="text-decoration:none;color:inherit">
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

  new DataTable({
    title: 'Media assets', rows: D.mediaAssets, pageSize: 15, sortKey: 'uploaded', sortDir: 'desc',
    columns: [
      { key: 'name', label: 'Asset', render: m => `<span style="display:flex;align-items:center;gap:9px">${icon(m.kind === 'Video' ? 'camera' : m.kind === 'Document' ? 'file' : 'image')}<span>${esc(m.name)}</span></span>` },
      { key: 'kind', label: 'Type' },
      { key: 'collection', label: 'Collection' },
      { key: 'size', label: 'Size', className: 'num' },
      { key: 'license', label: 'Licence', render: m => badge(m.license === 'Restricted' ? 'Denied' : m.license === 'Public' ? 'Approved' : 'Draft', m.license === 'Restricted' ? 'denied' : m.license === 'Public' ? 'approved' : 'draft') },
      { key: 'by', label: 'Uploaded by' },
      { key: 'uploaded', label: 'Uploaded', render: m => shortDate(m.uploaded) },
      { key: 'act', label: '', sortable: false, filter: false, render: () => `<button class="btn-mini">Download</button>` }
    ]
  }).mount(view.querySelector('#mediaTable'));

  view.querySelector('#upload').addEventListener('click', () => modal({
    title: 'Upload assets', confirm: 'Upload',
    body: `<div class="stack">
      <div class="field"><label>Files</label><input type="file" multiple></div>
      <div class="field"><label>Collection</label><select>${[...new Set(D.mediaAssets.map(m => m.collection))].map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
      <div class="field"><label>Licence</label><select><option>Internal</option><option>Public</option><option>Restricted</option></select></div>
      <div class="field"><label>Caption / credit</label><input placeholder="Who took it and where"></div>
      <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox"> Photo consent on file for identifiable people</label>
    </div>`,
    onConfirm: () => toast('Assets queued for upload')
  }));
  view.querySelector('#newCol').addEventListener('click', () => toast('Collection created'));
}
