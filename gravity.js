(() => {
  'use strict';
  const button = document.querySelector('#do-not-press');
  const dialog = document.querySelector('#chaos-dialog');
  if (!button || !dialog) return;
  const stage = dialog.querySelector('#chaos-stage');
  const rebuild = dialog.querySelector('#rebuild-site');
  const nudge = dialog.querySelector('#nudge-pieces');
  const status = dialog.querySelector('#chaos-status');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let world = null, pieces = [], frame = 0, previousTime = 0, accumulated = 0;
  let controller = null, active = false, rebuilding = false, pointer = null;
  let savedOverflow = '', savedScroll = { x: 0, y: 0 }, recoveryMotions = [];
  let z = 0;
  const random = (min, max) => min + Math.random() * (max - min);

  function clonePiece(source) {
    const clone = source.cloneNode(true);
    [clone, ...clone.querySelectorAll('[id]')].forEach(node => node.removeAttribute('id'));
    [clone, ...clone.querySelectorAll('.reveal,.will-reveal,.filter-enter,.is-typing,.is-charging,.is-charged')].forEach(node => {
      node.classList.remove('reveal', 'will-reveal', 'filter-enter', 'is-typing', 'is-charging', 'is-charged');
    });
    clone.removeAttribute('hidden');
    clone.classList.add('fall-piece');
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    return clone;
  }

  function render() {
    pieces.forEach(({ node, clone, body }) => {
      const size = body.portfolioSize;
      node.style.width = size.width + 'px';
      node.style.height = size.height + 'px';
      clone.style.transform = `scale(${size.scale})`;
      node.style.transform = `translate3d(${body.position.x - size.width / 2}px,${body.position.y - size.height / 2}px,0) rotate(${body.angle}rad)`;
    });
  }

  function tick(time) {
    frame = 0;
    if (!active || rebuilding || !world || reduce.matches) return;
    const delta = previousTime ? Math.min(80, time - previousTime) : 1000 / 60;
    previousTime = time;
    accumulated += delta;
    for (let steps = 0; accumulated >= 1000 / 60 && steps < 5; steps++) {
      world.step();
      accumulated -= 1000 / 60;
    }
    render();
    if (world.isMoving()) frame = requestAnimationFrame(tick);
    else {
      previousTime = 0;
      accumulated = 0;
      status.textContent = 'All settled. Pick one up and see what happens.';
    }
  }

  function wake() {
    if (!world || !active || rebuilding) return;
    if (reduce.matches) { world.settle(); render(); return; }
    if (!frame) { previousTime = 0; accumulated = 0; frame = requestAnimationFrame(tick); }
  }

  function point(event) {
    const rect = stage.getBoundingClientRect();
    return { x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)), y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)) };
  }

  function endDrag() {
    if (pointer !== null && stage.hasPointerCapture(pointer)) stage.releasePointerCapture(pointer);
    pointer = null;
    world?.endDrag();
    stage.classList.remove('is-dragging');
    pieces.forEach(piece => piece.node.classList.remove('is-picked-up'));
    if (active && !rebuilding) wake();
  }

  function bindPlayground() {
    const options = { signal: controller.signal };
    stage.addEventListener('pointerdown', event => {
      if (rebuilding || pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const body = world.beginDrag(point(event), reduce.matches);
      if (!body) return;
      event.preventDefault();
      pointer = event.pointerId;
      stage.setPointerCapture(pointer);
      stage.classList.add('is-dragging');
      const piece = pieces.find(item => item.body === body);
      piece.node.classList.add('is-picked-up'); piece.node.style.zIndex = String(++z);
      status.textContent = 'Let go to drop it. Gravity will take over.';
      if (!reduce.matches) wake();
    }, options);
    stage.addEventListener('pointermove', event => {
      if (event.pointerId !== pointer) return;
      event.preventDefault();
      world.moveDrag(point(event));
      if (reduce.matches) render();
      else wake();
    }, options);
    stage.addEventListener('pointerup', event => { if (event.pointerId === pointer) endDrag(); }, options);
    stage.addEventListener('pointercancel', event => { if (event.pointerId === pointer) endDrag(); }, options);
    stage.addEventListener('lostpointercapture', event => { if (event.pointerId === pointer) endDrag(); }, options);
    window.addEventListener('blur', endDrag, options);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { endDrag(); cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
      else wake();
    }, options);
    window.addEventListener('resize', () => {
      endDrag();
      world.resize(stage.clientWidth, stage.clientHeight);
      render(); wake();
    }, options);
  }

  function restore() {
    if (!active) return;
    active = false; rebuilding = false;
    controller?.abort(); controller = null;
    cancelAnimationFrame(frame); frame = 0; previousTime = 0; accumulated = 0;
    if (pointer !== null && stage.hasPointerCapture(pointer)) stage.releasePointerCapture(pointer);
    pointer = null;
    recoveryMotions.forEach(motion => motion.cancel()); recoveryMotions = [];
    world?.dispose(); world = null;
    pieces = []; stage.replaceChildren(); stage.classList.remove('is-dragging');
    document.body.classList.remove('site-fallen'); document.body.style.overflow = savedOverflow;
    if (dialog.open) dialog.close();
    button.textContent = 'Definitely do not press';
    button.focus({ preventScroll: true });
    if (Math.abs(scrollY - savedScroll.y) > 2) window.scrollTo({ left: savedScroll.x, top: savedScroll.y, behavior: 'instant' });
    if (typeof notify === 'function') notify('Portfolio rebuilt. Gravity is back where it belongs.');
  }

  async function putBack() {
    if (!active || rebuilding) return;
    rebuilding = true;
    endDrag(); cancelAnimationFrame(frame); frame = 0;
    controller?.abort();
    rebuild.disabled = true; nudge.disabled = true;
    status.textContent = 'Putting everything back in its place…';
    if (reduce.matches) { restore(); return; }
    recoveryMotions = pieces.map(({ node, origin }, index) => node.animate([
      { transform: node.style.transform, opacity: 1 },
      { transform: origin, opacity: 0 }
    ], { duration: 420, delay: (index % 5) * 24, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }));
    await Promise.allSettled(recoveryMotions.map(motion => motion.finished));
    restore();
  }

  function collapse() {
    if (active) return;
    if (!window.Matter || !window.PortfolioPhysics) {
      if (typeof notify === 'function') notify('The playground could not load. Refresh and try again.');
      return;
    }
    const selectors = '.hero-copy,.route,.project:not([hidden]),.skills-intro,.skill-group,.timeline-item,.training,.about-copy,.contact h2,.contact-actions,.toy';
    const snapshots = [...document.querySelectorAll(selectors)].map(source => ({ source, rect: source.getBoundingClientRect() })).filter(item => item.rect.width > 0).slice(0, innerWidth < 600 ? 18 : 24);
    savedOverflow = document.body.style.overflow; savedScroll = { x: scrollX, y: scrollY };
    active = true; rebuilding = false; z = 0;
    controller = new AbortController();
    stage.replaceChildren(); pieces = [];
    rebuild.disabled = false; nudge.disabled = false;
    status.textContent = reduce.matches ? 'Motion is reduced. You can still move and nudge the pieces.' : 'Gravity is on. Pick up a piece with your mouse or finger.';
    dialog.showModal(); document.body.style.overflow = 'hidden'; document.body.classList.add('site-fallen');
    const width = stage.clientWidth, height = stage.clientHeight;
    world = new window.PortfolioPhysics(window.Matter, width, height);
    snapshots.forEach(({ source, rect }, index) => {
      const clone = clonePiece(source), node = document.createElement('div');
      node.className = 'physics-piece'; node.setAttribute('aria-hidden', 'true');
      const baseWidth = Math.min(rect.width, 620);
      clone.style.width = baseWidth + 'px'; node.append(clone); stage.append(node);
      const baseHeight = Math.max(30, clone.offsetHeight);
      const scale = Math.min(width < 600 ? .5 : .58, (width * .56) / baseWidth, (height * .27) / baseHeight);
      const pieceWidth = baseWidth * scale, pieceHeight = baseHeight * scale;
      const visible = rect.bottom > 76 && rect.top < height;
      const x = visible ? Math.max(pieceWidth / 2 + 8, Math.min(width - pieceWidth / 2 - 8, rect.left + rect.width / 2)) : random(pieceWidth / 2 + 8, width - pieceWidth / 2 - 8);
      const y = visible ? Math.min(height - pieceHeight / 2 - 12, rect.top + pieceHeight / 2) : -pieceHeight / 2 - random(30, height * .8) - index * 8;
      const body = world.addPiece({ x, y, width: pieceWidth, height: pieceHeight, scale, angle: random(-.13, .13), velocityX: random(-1.5, 1.5), spin: random(-.025, .025) });
      const origin = `translate3d(${rect.left}px,${Math.max(-height, Math.min(height, rect.top))}px,0) rotate(0rad)`;
      node.style.zIndex = String(++z);
      pieces.push({ node, clone, body, origin });
    });
    bindPlayground(); render(); wake();
    rebuild.focus({ preventScroll: true });
  }

  button.addEventListener('click', collapse);
  rebuild.addEventListener('click', putBack);
  nudge.addEventListener('click', () => {
    if (!world || rebuilding) return;
    endDrag(); world.nudge(); wake();
    status.textContent = reduce.matches ? 'A new arrangement. Pick a piece to move it.' : 'A little nudge. Try catching a piece.';
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); putBack(); });
  dialog.addEventListener('close', restore);
  reduce.addEventListener('change', () => {
    if (!active || rebuilding) return;
    endDrag(); cancelAnimationFrame(frame); frame = 0;
    if (reduce.matches) { world.settle(); render(); }
    else wake();
  });
})();
