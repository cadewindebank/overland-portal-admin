/* Inline SVG icon set — stroke style matched to the portal's existing iconography. */
const P = 'stroke="currentColor" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

const paths = {
  dashboard: `<rect x="3" y="3" width="7" height="9" rx="1" ${P}/><rect x="14" y="3" width="7" height="5" rx="1" ${P}/><rect x="14" y="12" width="7" height="9" rx="1" ${P}/><rect x="3" y="16" width="7" height="5" rx="1" ${P}/>`,
  people: `<circle cx="9" cy="8" r="3.2" ${P}/><path d="M2.5 20a6.5 6.5 0 0 1 13 0" ${P}/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.2A6.5 6.5 0 0 1 21.5 20" ${P}/>`,
  person: `<circle cx="12" cy="8" r="3.5" ${P}/><path d="M5 20a7 7 0 0 1 14 0" ${P}/>`,
  staff: `<path d="M4 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" ${P}/><circle cx="10" cy="7" r="3.2" ${P}/><path d="M17.5 9.5l1.2 1.2 2.3-2.4" ${P}/>`,
  shield: `<path d="M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6z" ${P}/><path d="M9.2 12.2l2 2 3.6-3.9" ${P}/>`,
  compass: `<circle cx="12" cy="12" r="9" ${P}/><path d="M15.6 8.4l-1.9 5.2-5.3 1.9 1.9-5.2z" ${P}/>`,
  flag: `<path d="M5 21V4M5 5h11l-1.8 3.4L16 12H5" ${P}/>`,
  clipboard: `<rect x="5" y="4" width="14" height="17" rx="2" ${P}/><path d="M9 4V3h6v1" ${P}/><path d="M8.5 11.5l1.8 1.8 3.7-3.9M8.5 17h7" ${P}/>`,
  give: `<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z" ${P}/>`,
  dollar: `<circle cx="12" cy="12" r="9" ${P}/><path d="M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.5.8-2.5 1.9 0 2.8 5.4 1.4 5.4 4.3 0 1.2-1.1 2-2.7 2-1.3 0-2.4-.5-2.9-1.5M12 6.3v11.4" ${P}/>`,
  bank: `<path d="M3.5 9.5L12 4.5l8.5 5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18" ${P}/>`,
  wire: `<path d="M3 12h13M12.5 7.5L17 12l-4.5 4.5M19 5v14" ${P}/>`,
  transfer: `<path d="M4 8h12l-3-3M20 16H8l3 3" ${P}/>`,
  chart: `<path d="M4 20V5M4 20h16" ${P}/><rect x="7" y="12" width="3" height="5" ${P}/><rect x="12" y="8" width="3" height="9" ${P}/><rect x="17" y="14" width="3" height="3" ${P}/>`,
  inbox: `<path d="M3 13l2.6-7.2A2 2 0 0 1 7.5 4.5h9a2 2 0 0 1 1.9 1.3L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" ${P}/><path d="M3 13h4.5l1.2 2.4h6.6L16.5 13H21" ${P}/>`,
  bell: `<path d="M18 15V10a6 6 0 1 0-12 0v5l-1.6 2.4h15.2z" ${P}/><path d="M10 20a2 2 0 0 0 4 0" ${P}/>`,
  check: `<path d="M4.5 12.5l5 5 10-11" ${P}/>`,
  checkCircle: `<circle cx="12" cy="12" r="9" ${P}/><path d="M8 12.3l2.6 2.6L16 9.4" ${P}/>`,
  x: `<path d="M6 6l12 12M18 6L6 18" ${P}/>`,
  clock: `<circle cx="12" cy="12" r="9" ${P}/><path d="M12 7v5.3l3.4 2" ${P}/>`,
  alert: `<path d="M12 4.5l8.5 15h-17z" ${P}/><path d="M12 10v4M12 17h.01" ${P}/>`,
  camera: `<rect x="3" y="7" width="18" height="13" rx="2" ${P}/><path d="M8.5 7l1.4-2.5h4.2L15.5 7" ${P}/><circle cx="12" cy="13.5" r="3.2" ${P}/>`,
  image: `<rect x="3" y="4.5" width="18" height="15" rx="2" ${P}/><circle cx="8.5" cy="10" r="1.6" ${P}/><path d="M4 17l4.7-4.4 3.5 3.2 3-2.7L20 17" ${P}/>`,
  file: `<path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" ${P}/><path d="M13.5 3.5V9H19" ${P}/>`,
  book: `<path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 1-2-2z" ${P}/><path d="M20 5.5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 0 2-2z" ${P}/>`,
  settings: `<circle cx="12" cy="12" r="3" ${P}/><path d="M19.3 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" ${P}/>`,
  history: `<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 5v4h4" ${P}/><path d="M12 8v4.4l3 1.8" ${P}/>`,
  device: `<rect x="2.5" y="5" width="13" height="10.5" rx="1.6" ${P}/><rect x="17.5" y="8.5" width="4" height="10.5" rx="1.2" ${P}/><path d="M6 19h6" ${P}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${P}/><path d="M16 16l4.5 4.5" ${P}/>`,
  grid: `<rect x="3.5" y="3.5" width="6" height="6" rx="1" ${P}/><rect x="14.5" y="3.5" width="6" height="6" rx="1" ${P}/><rect x="3.5" y="14.5" width="6" height="6" rx="1" ${P}/><rect x="14.5" y="14.5" width="6" height="6" rx="1" ${P}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${P}/>`,
  download: `<path d="M12 3.5v11M7.5 10.5L12 15l4.5-4.5M4 19.5h16" ${P}/>`,
  edit: `<path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z" ${P}/>`,
  trash: `<path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13M10.5 10v6M13.5 10v6" ${P}/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16" ${P}/>`,
  chevron: `<path d="M9 5l7 7-7 7" ${P}/>`,
  external: `<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" ${P}/>`,
  plane: `<path d="M3 13.5l18-7-6 15-2.7-5.6z" ${P}/>`,
  passport: `<rect x="5" y="3" width="14" height="18" rx="2" ${P}/><circle cx="12" cy="10" r="3" ${P}/><path d="M9 16.5h6" ${P}/>`,
  home: `<path d="M4 11l8-6.5 8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" ${P}/>`,
  logout: `<path d="M14 6.5V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1.5" ${P}/><path d="M10 12h11M17.5 8.5L21 12l-3.5 3.5" ${P}/>`,
  qr: `<rect x="3.5" y="3.5" width="6.5" height="6.5" ${P}/><rect x="14" y="3.5" width="6.5" height="6.5" ${P}/><rect x="3.5" y="14" width="6.5" height="6.5" ${P}/><path d="M14 14h3v3h-3zM20.5 14v3M17.5 20.5h3" ${P}/>`
};

export function icon(name, cls = '') {
  const d = paths[name] || paths.file;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${d}</svg>`;
}
export const iconNames = Object.keys(paths);
