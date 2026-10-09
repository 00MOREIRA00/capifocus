(function () {
  const assets = Object.freeze(Object.fromEntries(
    ['default', 'focus', 'break', 'completed', 'radio'].map(state =>
      [state, 'assets/mascot/capy-' + state + '.png'])
  ));

  function resolve({ running = false, mode = 'pomo', playing = false, completed = false } = {}) {
    if (completed) return 'completed';
    if (running) return mode === 'pomo' ? 'focus' : 'break';
    return playing ? 'radio' : 'default';
  }

  function create(host, { size = 'md', animated = true, className = '' } = {}) {
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'mascot mascot--' + (['sm', 'md', 'lg'].includes(size) ? size : 'md');
    if (className) view.classList.add(...className.split(/\s+/).filter(Boolean));
    view.setAttribute('aria-label', 'Animar a capivara');
    const fallback = host.querySelector('.capy');
    host.insertBefore(view, fallback);
    if (fallback) view.appendChild(fallback);
    if (fallback) fallback.setAttribute('aria-hidden', 'true');
    let current = 'default';
    let visible = null;
    let reaction;
    const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    view.addEventListener('click', () => {
      if (!animated || reducedMotion()) return;
      if (reaction) reaction.cancel();
      reaction = view.animate([
        { transform: 'translateY(0) rotate(0)' },
        { transform: 'translateY(-9px) rotate(-3deg)', offset: .4 },
        { transform: 'translateY(0) rotate(2deg)', offset: .75 },
        { transform: 'translateY(0) rotate(0)' }
      ], { duration: 650, easing: 'ease-out' });
    });
    const images = {};
    function show() {
      const ready = images[current].dataset.ready === 'true';
      // Keep the previous decoded pose visible while the requested one loads.
      if (ready && visible !== current) {
        const first = visible === null;
        visible = current;
        Object.entries(images).forEach(([state, img]) => {
          img.classList.toggle('is-visible', state === visible);
        });
        view.dataset.state = visible;
        if (first && animated && !reducedMotion()) {
          view.animate([
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 600, easing: 'ease-out' });
        }
      }
      view.dataset.animated = String(animated && ready);
      if (fallback) fallback.style.display = visible ? 'none' : '';
    }
    Object.entries(assets).forEach(([state, src]) => {
      const img = new Image(1254, 1254);
      img.alt = '';
      img.dataset.pose = state;
      images[state] = img;
      view.appendChild(img);
      img.onload = async () => {
        try { await img.decode(); } catch (_) { return; }
        img.dataset.ready = 'true';
        show();
      };
      img.onerror = () => { img.dataset.ready = 'false'; show(); };
      img.src = src;
    });
    let completionTimer;
    let context = {};
    let completed = false;
    function update(next = context) {
      context = next;
      const state = resolve({ ...context, completed });
      if (state !== current) { current = state; show(); }
    }
    show();
    return {
      update,
      complete() {
        completed = true;
        clearTimeout(completionTimer);
        update();
        completionTimer = setTimeout(() => { completed = false; update(); }, 1900);
      }
    };
  }
  window.CapiMascot = Object.freeze({ assets, resolve, create });
})();
