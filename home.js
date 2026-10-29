/* EDIT HERE: project copy and verified links. Empty URLs produce a source
       availability note. This file contains all CSS and JavaScript; no setup needed. */
    const PROJECTS = {
      aeris: {
        title: 'Aeris Transport Visibility & ePOD', context: '2026 / Year 2 Semester 1 team project',
        intro: 'A team-built module for following shipments from dispatch until receipt by freight forwarders or airport staff.',
        contributions: ['Helped develop shipment visibility and electronic proof of delivery.', 'Worked on shipment dashboards, alerts and proof of delivery screens, focusing on clear statuses and consistent interfaces.', 'Collaborated using GitHub and resolved integration, styling and build issues.'],
        stack: ['React', 'Vite', 'Node.js', 'Express', 'MySQL', 'Sequelize'],
        repo: '', demo: '', note: 'The repository is private. Project code and a walkthrough can be discussed on request.'
      },
      tracker: {
        title: 'Assignment Deadline Tracker', context: '2026 / AWS x NYP Hackathon',
        intro: 'An assignment planning system to help students organise work by deadline and workload.',
        contributions: ['Contributed to the development of the assignment planning system.', 'Worked on deadline-conflict scoring to support prioritisation.', 'Added a “Why this priority?” breakdown to make task recommendations easier to understand.'],
        stack: ['React', 'JavaScript'], repo: '', demo: '', note: 'A public demo or repository link has not been added. Contact me to discuss the project.'
      },
      inventory: {
        title: 'Inventory Forecasting & Reorder Prototype', context: '2025 / Year 1 Semester 2 team project',
        intro: 'A prototype that processes Excel sales data and uses linear regression to forecast product-level demand.',
        contributions: ['Worked on the Excel sales data processing and forecasting prototype.', 'Used Python data libraries and linear regression for product-level forecasts.', 'Included product and status filters, alert levels and CSV reorder lists.'],
        stack: ['Python', 'Flask', 'pandas', 'NumPy', 'scikit-learn'], repo: '', demo: '', note: 'A public demo or repository link has not been added. Contact me to discuss the prototype.'
      },
      heartcode: {
        title: 'Project Heartcode', context: '2023 / SMU & CDAC web development programme',
        intro: 'A cyberbullying awareness website created through a web development programme organised by SMU and CDAC.',
        contributions: ['Created a cyberbullying awareness website using HTML, CSS and JavaScript.', 'Built early experience in structuring and presenting information for the web.'],
        stack: ['HTML', 'CSS', 'JavaScript'], repo: '', demo: 'https://ttinten.github.io/Project-Heartcode/index.html', note: 'An early web development project from 2023.'
      }
    };
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const storage = {
      get(key) { try { return localStorage.getItem(key); } catch { return null; } },
      set(key, value) { try { localStorage.setItem(key, value); } catch { /* Session still works. */ } }
    };
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let toastTimer;
    function notify(message) {
      const toast = $('#toast'); clearTimeout(toastTimer);
      toast.textContent = message; toast.classList.add('show');
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
    }
    // Header, theme and mobile menu are shared through site.js.
    // A transform-only shared indicator follows the selected filter.
    let indicatorMotion;
    function moveFilterIndicator(animate = true) {
      const bar = $('.filter-bar'), active = $('.filter-button[aria-pressed="true"]');
      if (!bar || !active) return;
      const indicator = $('.filter-indicator'), target = { x:active.offsetLeft, y:active.offsetTop, w:active.offsetWidth, h:active.offsetHeight };
      const old = indicator.getBoundingClientRect(), parent = bar.getBoundingClientRect();
      indicatorMotion?.cancel();
      indicator.style.width = target.w + 'px'; indicator.style.height = target.h + 'px';
      indicator.style.transform = `translate(${target.x}px,${target.y}px)`;
      if (animate && !reducedMotion.matches && old.width > 1) {
        indicatorMotion = indicator.animate([
          { transform:`translate(${old.left-parent.left-bar.clientLeft}px,${old.top-parent.top-bar.clientTop}px) scale(${old.width/target.w},${old.height/target.h})` },
          { transform:`translate(${target.x}px,${target.y}px) scale(1,1)` }
        ], {duration:340,easing:'cubic-bezier(.2,.8,.2,1)'});
      }
    }
    moveFilterIndicator(false);
    if ('ResizeObserver' in window) new ResizeObserver(() => moveFilterIndicator(false)).observe($('.filter-bar'));
    // Filter buttons update one shared grid and announce the number of results.
    $$('.filter-button').forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      $$('.filter-button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      moveFilterIndicator();
      let count = 0;
      $$('.project').forEach(project => {
        const visible = filter === 'all' || project.dataset.category === filter;
        project.hidden = !visible; project.classList.remove('filter-enter');
        if (visible) { project.style.setProperty('--filter-order', count++); project.classList.add('is-visible'); if (!reducedMotion.matches) { void project.offsetWidth; project.classList.add('filter-enter'); } }
      });
      $('#filter-status').textContent = `${count} ${count === 1 ? 'project' : 'projects'} shown.`;
    }));
    // Native dialogs supply focus trapping, Escape dismissal and focus restoration.
    function openDialog(dialog) { closeMenu(); dialog.showModal(); document.body.style.overflow = 'hidden'; }
    $$('dialog:not(#chaos-dialog)').forEach(dialog => {
      $('[data-close]', dialog).addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
      dialog.addEventListener('click', event => {
        const box = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
      });
    });
    // textContent keeps edits to project descriptions from injecting HTML.
    function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }
    $$('[data-project]').forEach(button => button.addEventListener('click', () => {
      const project = PROJECTS[button.dataset.project]; if (!project) return;
      $('#dialog-context').textContent = project.context;
      const body = $('#project-body'); body.replaceChildren();
      const title = element('h2', project.title); title.id = 'dialog-title';
      body.append(title, element('p', project.intro), element('h3', 'My contribution'));
      const list = element('ul'); project.contributions.forEach(text => list.append(element('li', text))); body.append(list, element('h3', 'Built with'));
      const tags = element('ul', null, 'tags'); tags.setAttribute('aria-label', 'Technologies'); project.stack.forEach(text => tags.append(element('li', text))); body.append(tags);
      const actions = element('div', null, 'dialog-actions');
      [['repo', 'Source code'], ['demo', 'Live website']].forEach(([key, label]) => {
        if (!project[key]) return;
        try { const url = new URL(project[key]); if (url.protocol !== 'https:') return; const link = element('a', label + ' ↗', 'button'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', label + ' (opens in a new tab)'); actions.append(link); }
        catch { /* Omit invalid edited links. */ }
      });
      if (!project.repo && !project.demo) { const link = element('a', 'Email me', 'button primary'); link.href = 'mailto:masyhurdeo@gmail.com'; actions.append(link); }
      body.append(element('p', project.note, 'source-note'), actions); openDialog($('#project-dialog'));
    }));
    $('#resume-open').addEventListener('click', () => openDialog($('#resume-dialog')));
    $('#print-resume').addEventListener('click', () => { $('#resume-dialog').close(); window.print(); });
    $('#copy-email').addEventListener('click', async () => {
      try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText('masyhurdeo@gmail.com'); notify('Email copied. Thanks for stopping by.'); }
      catch { const range = document.createRange(); range.selectNodeContents($('.contact-email')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); notify('Email selected. Press Ctrl+C or use your device’s Copy command.'); }
    });
    // Exploration belongs to the visitor. It never measures professional proficiency.
    const stopIds = ['projects', 'skills', 'experience', 'contact'];
    let visited;
    try { const saved = JSON.parse(storage.get('md-explored') || '[]'); visited = new Set(Array.isArray(saved) ? saved.filter(id => stopIds.includes(id)) : []); }
    catch { visited = new Set(); }
    const stopLabels = { projects: 'Project explorer', skills: 'Loadout inspected', experience: 'Journey discovered', contact: 'Connection ready' };
    function renderProgress() {
      $('.route').classList.toggle('is-complete', visited.size === 4);
      $('#route-count').textContent = `${visited.size} / 4 explored`;
      $('#route-message').textContent = visited.size === 4 ? 'Portfolio explored. Thanks for visiting.' : 'A little curiosity goes a long way.';
      $$('.map-stop').forEach(stop => { const done = visited.has(stop.dataset.stop); stop.classList.toggle('visited', done); stop.setAttribute('aria-label', stop.dataset.stop[0].toUpperCase() + stop.dataset.stop.slice(1) + (done ? ', explored' : '')); });
    }
    function markExplored(id) { if (visited.has(id)) return; visited.add(id); storage.set('md-explored', JSON.stringify([...visited])); renderProgress(); notify(visited.size === 4 ? 'All four stops explored. Nice to meet you.' : `${stopLabels[id]} · ${visited.size} of 4 stops`); }
    $('#reset-progress').addEventListener('click', () => { visited.clear(); storage.set('md-explored', '[]'); renderProgress(); notify('Exploration reset. Take another look around.'); });
    renderProgress();
    // Short tactile ripples acknowledge a click without introducing constant motion.
    $$('.button.primary').forEach(button => button.addEventListener('click', event => {
      if (reducedMotion.matches) return;
      const bounds = button.getBoundingClientRect(), wave = element('span', null, 'click-wave');
      wave.setAttribute('aria-hidden','true');
      wave.style.left = (event.detail ? event.clientX - bounds.left : bounds.width / 2) + 'px';
      wave.style.top = (event.detail ? event.clientY - bounds.top : bounds.height / 2) + 'px';
      button.append(wave);
      const motion = wave.animate([{ transform:'scale(.2)', opacity:.24 }, { transform:'scale(12)', opacity:0 }], { duration:550, easing:'cubic-bezier(.2,.8,.2,1)' });
      motion.finished.then(() => wave.remove(), () => wave.remove());
    }));
    $$('.map-stop').forEach(stop => stop.addEventListener('click', () => {
      if (!reducedMotion.matches) $('.stop-icon', stop).animate([{ transform:'scale(1)' }, { transform:'scale(.88) rotate(-8deg)', offset:.35 }, { transform:'scale(1.12) rotate(3deg)', offset:.7 }, { transform:'scale(1)' }], { duration:420, easing:'cubic-bezier(.2,.8,.2,1)' });
    }));
    $$('.project').forEach((card,index) => {
      card.style.setProperty('--reveal-order', index % 2);
      card.addEventListener('animationend', event => { if (event.target === card && event.animationName === 'filter-slide') card.classList.remove('filter-enter'); });
    });
    if ('IntersectionObserver' in window) {
      // Headings must stay visible for 700ms, avoiding badges during quick scrolling.
      const dwellTimers = new Map();
      const explorationObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        const id = entry.target.closest('[data-explore]').id;
        if (entry.isIntersecting && !visited.has(id) && !dwellTimers.has(id)) dwellTimers.set(id, setTimeout(() => { markExplored(id); dwellTimers.delete(id); }, 700));
        else if (!entry.isIntersecting) { clearTimeout(dwellTimers.get(id)); dwellTimers.delete(id); }
      }), { rootMargin: '-76px 0px -10% 0px', threshold: 1 });
      $$('[data-explore]').forEach(section => explorationObserver.observe($('h2', section)));
      const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }), { threshold: .08 });
      $$('.reveal').forEach(node => { node.classList.add('will-reveal'); revealObserver.observe(node); });
      const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) $$('#navigation a').forEach(link => { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      }), { rootMargin: '-12% 0px -60% 0px', threshold: 0 });
      $$('main section[id]').forEach(section => navObserver.observe(section));
    } else { $$('.map-stop').forEach(stop => stop.addEventListener('click', () => markExplored(stop.dataset.stop))); }
    $('#year').textContent = new Date().getFullYear();
