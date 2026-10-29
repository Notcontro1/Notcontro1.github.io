(() => {
  'use strict';
  const all = Array.isArray(window.PORTFOLIO_CERTIFICATES) ? window.PORTFOLIO_CERTIFICATES.filter(record => record && typeof record.title === 'string' && record.title.trim()) : [];
  const grid = document.querySelector('#certificate-grid'), controls = document.querySelector('#certificate-controls');
  const empty = document.querySelector('#certificates-empty'), noResults = document.querySelector('#certificate-no-results');
  const search = document.querySelector('#certificate-search'), filters = document.querySelector('#certificate-filters');
  const status = document.querySelector('#certificate-status'), dialog = document.querySelector('#certificate-dialog');
  let category = 'All', lastTrigger = null;
  function element(tag, text, className) {
    const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node;
  }
  function safeUrl(value, external = false) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value, location.href);
      if (!['http:', 'https:', 'file:'].includes(url.protocol)) return '';
      if (external && url.protocol !== 'https:') return '';
      if (!external && url.origin !== location.origin) return '';
      return url.href;
    } catch { return ''; }
  }
  function dateLabel(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return '';
    const [year, month] = value.split('-').map(Number);
    if (month < 1 || month > 12) return '';
    return new Intl.DateTimeFormat('en-SG', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  function openCertificate(record, trigger) {
    lastTrigger = trigger;
    document.querySelector('#certificate-title').textContent = record.title;
    document.querySelector('#certificate-issuer').textContent = record.issuer || '';
    const image = document.querySelector('#certificate-preview'), fallback = document.querySelector('#certificate-preview-fallback');
    image.hidden = true; image.removeAttribute('src'); image.alt = record.title;
    const imageUrl = safeUrl(record.image);
    fallback.hidden = false;
    fallback.textContent = imageUrl ? 'Loading certificate preview…' : 'A preview image has not been added.';
    image.onload = () => { image.hidden = false; fallback.hidden = true; };
    image.onerror = () => { image.hidden = true; fallback.hidden = false; fallback.textContent = 'The preview could not load. Use the document link if available.'; };
    if (imageUrl) image.src = imageUrl;
    const links = document.querySelector('#certificate-links'); links.replaceChildren();
    [[record.document, 'Open document', false], [record.credentialUrl, 'Verify credential', true]].forEach(([value, label, external]) => {
      const href = safeUrl(value, external); if (!href) return;
      const link = element('a', label + ' ↗', 'button'); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; links.append(link);
    });
    dialog.showModal(); document.body.style.overflow = 'hidden';
  }
  function render() {
    const query = search.value.trim().toLowerCase();
    const visible = all.filter(record => (category === 'All' || record.category === category) && `${record.title} ${record.issuer || ''} ${record.category || ''}`.toLowerCase().includes(query));
    grid.replaceChildren();
    visible.forEach(record => {
      const card = element('article', '', 'certificate-card');
      const cover = element('div', '', 'certificate-cover');
      const imageUrl = safeUrl(record.image);
      const fallback = element('span', 'Certificate', 'certificate-document-label');
      cover.append(fallback);
      if (imageUrl) {
        const image = element('img'); image.alt = ''; image.loading = 'lazy'; image.width = 560; image.height = 390;
        image.addEventListener('load', () => { fallback.hidden = true; });
        image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; });
        image.src = imageUrl; cover.append(image);
      }
      const body = element('div', '', 'certificate-card-body');
      body.append(element('p', record.issuer || 'Certificate', 'certificate-provider'), element('h2', record.title));
      const date = dateLabel(record.issued); if (date) body.append(element('p', date, 'certificate-date'));
      const button = element('button', 'View certificate ↗', 'text-link'); button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('click', () => openCertificate(record, button)); body.append(button); card.append(cover, body); grid.append(card);
    });
    noResults.hidden = visible.length > 0 || all.length === 0;
    status.textContent = all.length ? `${visible.length} ${visible.length === 1 ? 'certificate' : 'certificates'} shown.` : '';
  }
  controls.hidden = all.length === 0; empty.hidden = all.length > 0;
  if (all.length) {
    ['All', ...new Set(all.map(record => record.category).filter(value => typeof value === 'string' && value.trim() && value !== 'All'))].forEach(label => {
      const button = element('button', label, 'filter-button'); button.type = 'button'; button.setAttribute('aria-pressed', String(label === category));
      button.addEventListener('click', () => { category = label; filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button))); render(); }); filters.append(button);
    });
  }
  search.addEventListener('input', render);
  document.querySelector('#certificate-clear-search').addEventListener('click', () => {
    category = 'All'; search.value = ''; filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.textContent === 'All'))); render(); search.focus();
  });
  document.querySelector('#certificate-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastTrigger?.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  render();
})();
