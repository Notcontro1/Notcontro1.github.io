(() => {
  'use strict';
  const one = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const activeTyping = new Set();
  const chargeControls = [];

  // A card charges as feedback only. Its links always work immediately.
  all('.project').forEach(card => {
    const track = document.createElement('span'); track.className = 'charge-track'; track.setAttribute('aria-hidden','true');
    const fill = document.createElement('span'); fill.className = 'charge-fill'; track.append(fill);
    const readout = document.createElement('span'); readout.className = 'charge-readout'; readout.setAttribute('aria-hidden','true'); readout.textContent = 'Charging · 0%';
    card.append(track, readout);
    let frame = 0, hovering = false, started = false;
    function stop() {
      cancelAnimationFrame(frame); frame = 0; started = false;
      card.classList.remove('is-charging','is-charged'); card.style.setProperty('--charge', '0'); readout.textContent = 'Charging · 0%';
    }
    function start() {
      if (started) return;
      started = true; const began = performance.now(); card.classList.add('is-charging');
      function tick(now) {
        const progress = reduce.matches ? 1 : Math.min(1, (now - began) / 1050);
        card.style.setProperty('--charge', String(progress));
        readout.textContent = progress === 1 ? 'Charged. Explore away.' : `Charging · ${Math.round(progress * 100)}%`;
        if (progress < 1) frame = requestAnimationFrame(tick);
        else { card.classList.remove('is-charging'); card.classList.add('is-charged'); frame = 0; }
      }
      frame = requestAnimationFrame(tick);
    }
    card.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovering = true; start(); } });
    card.addEventListener('pointerleave', () => { hovering = false; if (!card.contains(document.activeElement)) stop(); });
    card.addEventListener('focusin', start);
    card.addEventListener('focusout', () => { queueMicrotask(() => { if (!hovering && !card.contains(document.activeElement)) stop(); }); });
    chargeControls.push({ stop, start, card });
  });

  // Keep the full text in the accessibility tree and reserve its final geometry.
  const typingTargets = all('[data-typewriter]');
  typingTargets.forEach(target => {
    const text = target.textContent;
    const line = document.createElement('span'); line.className = 'type-line';
    const accessible = document.createElement('span'); accessible.className = 'sr-only'; accessible.textContent = text;
    const layout = document.createElement('span'); layout.className = 'type-layout'; layout.setAttribute('aria-hidden','true'); layout.textContent = text;
    const ink = document.createElement('span'); ink.className = 'type-ink'; ink.setAttribute('aria-hidden','true'); ink.textContent = text;
    line.append(accessible,layout,ink); target.replaceChildren(line);
    let timer = 0, done = false; target.dataset.typingState = 'pending';
    function finish() { clearTimeout(timer); ink.textContent = text; target.classList.remove('is-typing'); target.dataset.typingState = 'complete'; activeTyping.delete(finish); }
    function type() {
      if (done) return; done = true;
      if (reduce.matches) { finish(); return; }
      let index = 0; const characters = Array.from(text); ink.textContent = ''; target.classList.add('is-typing'); target.dataset.typingState = 'typing'; activeTyping.add(finish);
      function next() {
        index = Math.min(index + 1, characters.length); ink.textContent = characters.slice(0,index).join('');
        if (index < characters.length) timer = setTimeout(next, /[,.]/.test(characters[index-1]) ? 100 : 32);
        else finish();
      }
      next();
    }
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { type(); observer.disconnect(); } }, { threshold:.45, rootMargin:'-90px 0px -8% 0px' });
      observer.observe(target);
    }
  });

  const marks = all('.scroll-highlight,.draw-underline');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-marked'); observer.unobserve(entry.target); } }), { threshold:.5, rootMargin:'0px 0px -8% 0px' });
    marks.forEach(mark => observer.observe(mark));
  } else marks.forEach(mark => mark.classList.add('is-marked'));

  // Small physical toys work with click, touch, Enter and Space.
  const toyMotions = new Map();
  all('[data-toy]').forEach((toy,index) => toy.addEventListener('click', () => {
    toyMotions.get(toy)?.cancel();
    if (reduce.matches) { toy.style.background = 'var(--tint)'; return; }
    const rotation = [0,8,-7][index];
    const motion = toy.animate([
      { transform:`translateY(0) rotate(${rotation}deg) scale(1)` },
      { transform:`translateY(-24px) rotate(${rotation+200}deg) scale(1.13)`, offset:.5 },
      { transform:`translateY(0) rotate(${rotation+360}deg) scale(1)` }
    ], {duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});
    toyMotions.set(toy,motion); motion.finished.then(() => toyMotions.delete(toy),() => {});
  }));

  reduce.addEventListener('change', event => {
    if (!event.matches) return;
    activeTyping.forEach(finish => finish());
    chargeControls.forEach(({ stop }) => stop());
    toyMotions.forEach(motion => motion.cancel()); toyMotions.clear();
  });
})();
