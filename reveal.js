/* Head bootstrap hides pending images before first paint; reveal only on entry. */
(() => {
  const motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  const root = document.documentElement;
  if (!('IntersectionObserver' in window) || !Element.prototype.animate || motion.matches) {
    root.classList.remove('reveal-ready');
    return;
  }
  const items = [...document.querySelectorAll('.opening-work, .archive-work, .case-hero, .frame-gallery-grid figure, .stills figure')];
  const active = new Map();
  let observer;
  const inside = new Set();
  const waiting = new Set();
  function finishAll() {
    for (const [item, animation] of active) { item.classList.add('is-revealed'); animation.cancel(); }
    active.clear();
  }
  function show(item) {
    if (!inside.has(item) || item.hidden || item.classList.contains('is-revealed')) return;
    const picture = item.querySelector('.thumbnail-original, .opening-original, img');
    // Start a deferred image when its card enters, including after a filter change.
    if(picture?.dataset.mediaSrc) {
      window.madoDeferredMedia?.load(item);
      if(picture.dataset.mediaSrc) return; // The media gate has not opened yet.
    }
    // Lazy images must arrive before their entrance is spent on an empty frame.
    if (picture && !picture.complete) {
      if (!waiting.has(item)) {
        waiting.add(item);
        const loaded = () => {
          picture.removeEventListener('load', loaded);
          picture.removeEventListener('error', loaded);
          waiting.delete(item);
          show(item);
        };
        picture.addEventListener('load', loaded);
        picture.addEventListener('error', loaded);
      }
      return;
    }
    inside.delete(item);
    if (motion.matches || document.hidden) { item.classList.add('is-revealed'); return; }
    try {
      // Keep the work title and its reserved frame visible while media waits.
      const work = item.classList.contains('archive-work');
      const surface = work ? picture : item;
      const animation = surface.animate(work ? [
        {opacity:0, filter:'blur(10px) saturate(.85)', transform:'scale(0.94)'},
        {opacity:1, filter:'none', transform:'scale(1)'}
      ] : [
        {opacity:0, transform:'scale(0.94)'},
        {opacity:1, transform:'scale(1)'}
      ], {duration:window.innerWidth<=760?500:750, easing:'linear', fill:'none'});
      active.set(item,animation);
      const stopPrism = work ? null : window.madoPrism?.enter(item,animation);
      // The animation now owns opacity; its final underlying state is visible.
      item.classList.add('is-revealed');
      animation.onfinish = animation.oncancel = () => { stopPrism?.(); active.delete(item); };
    } catch { item.classList.add('is-revealed'); }
  }
  function observeCenter() {
    if(observer) observer.disconnect();
    const inset = Math.round(window.innerHeight * 0.25);
    observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !entry.target.hidden) {
        inside.add(entry.target); show(entry.target);
      } else inside.delete(entry.target);
    }
    }, {threshold:0, rootMargin:`-${inset}px 0px -${inset}px 0px`});
    items.forEach(item => observer.observe(item));
  }
  // Re-arm only after a work has left the screen completely, in either direction.
  const viewportObserver = new IntersectionObserver(entries => {
    for(const entry of entries) {
      if(!entry.isIntersecting && !entry.target.contains(document.activeElement)) {
        inside.delete(entry.target);
        active.get(entry.target)?.cancel();
        entry.target.classList.remove('is-revealed');
      }
    }
  }, {threshold:0});
  root.dataset.revealInitialized = 'true';
  observeCenter();
  window.addEventListener('mado:media-ready', () => { for(const item of inside) show(item); });
  items.forEach(item => viewportObserver.observe(item));
  window.addEventListener('resize', () => { if(!motion.matches) observeCenter(); });
  document.addEventListener('focusin', event => {
    const item = event.target.closest('.opening-work, .archive-work, .case-hero, .frame-gallery-grid figure, .stills figure');
    if(item) {item.classList.add('is-revealed');inside.delete(item);active.get(item)?.cancel();}
  });
  function changed() {
    if(motion.matches) {root.classList.remove('reveal-ready');inside.clear();observer.disconnect();viewportObserver.disconnect();finishAll();}
  }
  if(motion.addEventListener) motion.addEventListener('change',changed);
  else if(motion.addListener) motion.addListener(changed);
  document.addEventListener('visibilitychange', () => {if(document.hidden) finishAll();});
  window.addEventListener('pageshow', event => {if(event.persisted) finishAll();});
})();
