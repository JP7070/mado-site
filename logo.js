const logoVideo = document.querySelector('#mado-animation');
const logoStage = document.querySelector('.logo-stage');
const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
let motionPaused = reducedMotion.matches;
let visible = !('IntersectionObserver' in window);
let playbackPending = false;
async function playLogo() {
  if (motionPaused || !visible || document.hidden || playbackPending || logoVideo.ended) return;
  logoVideo.muted = true;
  logoVideo.defaultMuted = true;
  playbackPending = true;
  try { await logoVideo.play(); if(motionPaused || !visible || document.hidden) logoVideo.pause(); } catch { showFallback(); }
  finally { playbackPending = false; }
}
function showDecodedFrame() {
  if(motionPaused || !visible || document.hidden || logoVideo.paused) return;
  if(logoVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
  logoStage.classList.remove('show-fallback');
  logoStage.classList.add('is-playing');
  window.dispatchEvent(new Event('mado:logo-visible'));
}
function showFallback() {
  logoStage.classList.remove('is-playing');
  logoStage.classList.add('show-fallback');
  window.dispatchEvent(new Event('mado:logo-visible'));
}
logoVideo.addEventListener('playing', () => {
  if(motionPaused || !visible || document.hidden){logoVideo.pause();return;}
  // The first decoded frame is blank; reveal the video only when it can paint.
  if(logoVideo.requestVideoFrameCallback)logoVideo.requestVideoFrameCallback(showDecodedFrame);
  else if(logoVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)showDecodedFrame();
  else logoVideo.addEventListener('loadeddata',showDecodedFrame,{once:true});
});
logoVideo.addEventListener('ended', () => {
  logoStage.classList.remove('is-playing');
  logoStage.classList.add('is-finished');
  window.dispatchEvent(new Event('mado:logo-visible'));
});
logoVideo.addEventListener('error', showFallback);
logoVideo.addEventListener('emptied', () => logoStage.classList.remove('is-playing'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) logoVideo.pause(); else playLogo();
});
window.addEventListener('pageshow', () => { playbackPending = false; playLogo(); });
window.addEventListener('pagehide', () => { logoVideo.pause(); });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) playLogo(); else logoVideo.pause();
  }).observe(logoStage);
}
function motionChanged(event) {
  motionPaused = event.matches;
  if (motionPaused) { logoVideo.pause(); showFallback(); }
  else { logoStage.classList.remove('show-fallback'); playLogo(); }
}
if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', motionChanged);
else if (reducedMotion.addListener) reducedMotion.addListener(motionChanged);
if(motionPaused) showFallback();
else playLogo();
