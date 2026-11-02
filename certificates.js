(() => {
  'use strict';
  const all = Array.isArray(window.PORTFOLIO_CERTIFICATES) ? window.PORTFOLIO_CERTIFICATES.filter(record => record && typeof record.title === 'string' && record.title.trim()) : [];
  const grid = document.querySelector('#certificate-grid'), controls = document.querySelector('#certificate-controls');
  const empty = document.querySelector('#certificates-empty'), noResults = document.querySelector('#certificate-no-results');
  const search = document.querySelector('#certificate-search'), filters = document.querySelector('#certificate-filters');
  const status = document.querySelector('#certificate-status'), dialog = document.querySelector('#certificate-dialog');
  let category = 'All', lastTrigger = null;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
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
    if (typeof value !== 'string') return '';
    if (/^\d{4}$/.test(value)) return value;
    if (!/^\d{4}-\d{2}$/.test(value)) return '';
    const [year, month] = value.split('-').map(Number);
    if (month < 1 || month > 12) return '';
    return new Intl.DateTimeFormat('en-SG', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  function openCertificate(record, trigger) {
    lastTrigger = trigger;
    document.querySelector('#certificate-title').textContent = record.title;
    document.querySelector('#certificate-issuer').textContent = record.issuer || '';
    document.querySelector('#certificate-kind').textContent = record.kind || 'Certificate';
    document.querySelector('#certificate-description').textContent = record.description || '';
    const image = document.querySelector('#certificate-preview'), fallback = document.querySelector('#certificate-preview-fallback');
    image.hidden = true;
    image.removeAttribute('src');
    image.alt = record.title;
    const imageUrl = safeUrl(record.image);
    fallback.hidden = false;
    fallback.textContent = imageUrl ? 'Loading preview.' : 'This is a portfolio record. A certificate image has not been supplied.';
    image.onload = () => { image.hidden = false; fallback.hidden = true; };
    image.onerror = () => { image.hidden = true; fallback.hidden = false; fallback.textContent = 'The preview could not load. Use the document or image link if available.'; };
    if (imageUrl) image.src = imageUrl;
    const links = document.querySelector('#certificate-links');
    links.replaceChildren();
    const destinations = [
      [record.document || record.image, record.document ? 'Open document' : 'Open image', false],
      [record.credentialUrl, 'Verify credential', true],
      [record.relatedUrl, record.relatedLabel || 'Related website', true]
    ];
    destinations.forEach(([value, label, external]) => {
      const href = safeUrl(value, external);
      if (!href) return;
      const link = element('a', label + ' \u2197', 'button');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      links.append(link);
    });
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const visible = all.filter(record => (category === 'All' || record.category === category) && `${record.title} ${record.issuer || ''} ${record.category || ''} ${record.issued || ''} ${record.kind || ''}`.toLowerCase().includes(query));
    grid.replaceChildren();
    visible.forEach((record, index) => {
      const card = element('article', '', 'certificate-card');
      card.style.setProperty('--card-index', Math.min(index, 5));
      card.dataset.category = record.category || '';
      const cover = element('div', '', 'certificate-cover');
      const imageUrl = safeUrl(record.image);
      const fallback = element('div', '', 'certificate-document-label');
      fallback.append(element('span', record.category || 'Learning', 'record-category'), element('strong', record.title), element('span', imageUrl ? 'Loading preview' : 'Portfolio record'));
      cover.append(fallback);
      if (imageUrl) {
        const image = element('img');
        image.alt = '';
        image.loading = 'lazy';
        image.width = 560;
        image.height = 390;
        image.addEventListener('load', () => { fallback.hidden = true; });
        image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; fallback.lastElementChild.textContent = 'Preview unavailable'; });
        image.src = imageUrl;
        cover.append(image);
      }
      const body = element('div', '', 'certificate-card-body');
      body.append(element('p', record.issuer || 'Certificate', 'certificate-provider'), element('h2', record.title));
      if (record.kind) body.append(element('p', record.kind, 'certificate-evidence'));
      const date = dateLabel(record.issued);
      if (date) body.append(element('p', date, 'certificate-date'));
      const button = element('button', (record.kind && !/certificate/i.test(record.kind) ? 'View record' : 'View certificate') + ' \u2197', 'text-link');
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-label', 'View ' + record.title);
      button.addEventListener('click', () => openCertificate(record, button));
      body.append(button);
      card.append(cover, body);
      grid.append(card);
    });
    noResults.hidden = visible.length > 0 || all.length === 0;
    status.textContent = all.length ? `${visible.length} of ${all.length} records shown` : '';
  }

  controls.hidden = all.length === 0;
  empty.hidden = all.length > 0;
  if (all.length) {
    ['All', ...new Set(all.map(record => record.category).filter(value => typeof value === 'string' && value.trim() && value !== 'All'))].forEach(label => {
      const button = element('button', label, 'filter-button');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(label === category));
      button.addEventListener('click', () => {
        category = label;
        filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        render();
      });
      filters.append(button);
    });
  }
  search.addEventListener('input', render);
  document.querySelector('#certificate-clear-search').addEventListener('click', () => {
    category = 'All';
    search.value = '';
    filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.textContent === 'All')));
    render();
    search.focus();
  });
  document.querySelector('#certificate-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastTrigger?.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  render();
})();
