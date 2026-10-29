(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.querySelector('#theme-toggle');
  const menu = document.querySelector('#menu-toggle');
  const navigation = document.querySelector('#navigation');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  function updateThemeLabel() {
    if (!toggle) return;
    const dark = root.dataset.theme === 'dark', next = dark ? 'light' : 'dark';
    toggle.setAttribute('aria-label', `Switch to ${next} mode`);
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.title = `Switch to ${next} mode`;
    const label = toggle.querySelector('.theme-label');
    if (label) label.textContent = `${dark ? 'Light' : 'Dark'} mode`;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#191719' : '#f7f9fe';
  }
  toggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('md-theme-v2', root.dataset.theme); } catch { /* Theme works without storage. */ }
    updateThemeLabel();
    // Fade only. The half-circle always stays upright, even while hovered.
    if (!reduce.matches) toggle.querySelector('.theme-symbol')?.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 220 });
  });
  updateThemeLabel();

  function closeMenu() {
    if (!menu || !navigation) return;
    navigation.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu';
  }
  window.closeMenu = closeMenu;
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open)); menu.textContent = open ? 'Close' : 'Menu';
  });
  navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.querySelector('.brand')?.addEventListener('click', closeMenu);
  document.addEventListener('click', event => { if (!event.target.closest('header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  matchMedia('(min-width: 768px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  const page = document.body.dataset.page;
  if (page) navigation?.querySelector(`[data-page-link="${page}"]`)?.setAttribute('aria-current', 'page');
  const year = document.querySelector('#year'); if (year) year.textContent = new Date().getFullYear();
})();
