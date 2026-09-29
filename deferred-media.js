/* Give the logo a head start; scrolling always takes priority over the delay. */
(() => {
  const root = document.documentElement;
  const section = document.querySelector('.scroll-story,.opening-gallery') || document.querySelector('#works');
  const logo = document.querySelector('#mado-animation');
  const fallback = document.querySelector('.logo-fallback');
  let released = false, timer = 0;
  const images = [...document.querySelectorAll('img[data-media-src]')];
  function load(image) {
    if (!image.dataset.mediaSrc) return;
    image.loading = 'eager';
    if (image.dataset.mediaSrcset) image.srcset = image.dataset.mediaSrcset;
    image.src = image.dataset.mediaSrc;
    delete image.dataset.mediaSrc;
    delete image.dataset.mediaSrcset;
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (!released) return;
    entries.forEach(entry => { if (entry.isIntersecting) { load(entry.target); observer.unobserve(entry.target); } });
  }, {rootMargin:'400px 0px'}) : null;
  function release() {
    if (released) return;
    released = true;
    clearTimeout(timer);
    root.dataset.mediaReady = 'true';
    const video = document.querySelector('#scroll-background-video');
    if (video?.dataset.mediaPoster) video.poster = video.dataset.mediaPoster;
    images.forEach(image => {
      if (observer) observer.observe(image); else load(image);
    });
    // Warm the first row even when a large logo keeps Works below the viewport.
    images.slice(0, innerWidth > 1000 ? 3 : innerWidth > 600 ? 2 : 1).forEach(load);
    window.dispatchEvent(new Event('mado:media-ready'));
    window.removeEventListener('scroll', near);
    window.removeEventListener('resize', near);
  }
  function near() {
    if (!section || section.getBoundingClientRect().top <= innerHeight + 200) release();
  }
  function displayed() {
    if (!timer && !released) timer = setTimeout(release, 3000);
  }
  logo?.addEventListener('playing', displayed, {once:true});
  fallback?.addEventListener('load', displayed, {once:true});
  fallback?.addEventListener('error', displayed, {once:true});
  if (!fallback || (fallback.complete && fallback.naturalWidth)) requestAnimationFrame(displayed);
  document.addEventListener('focusin', event => {
    const image = event.target.closest('.archive-work,.opening-work')?.querySelector('img[data-media-src]');
    if (image) { release(); load(image); }
  });
  window.addEventListener('scroll', near, {passive:true});
  window.addEventListener('resize', near);
  window.addEventListener('pageshow', near);
  near();
})();
