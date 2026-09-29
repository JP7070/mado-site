const logoVideo = document.querySelector('#mado-animation');
const logoStage = document.querySelector('.logo-stage');
const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
let motionPaused = reducedMotion.matches;
let visible = !('IntersectionObserver' in window);
let playbackPending = false;
async function playLogo() {
  if (motionPaused || !visible || document.hidden || playbackPending) return;
  logoVideo.muted = true;
  logoVideo.defaultMuted = true;
  playbackPending = true;
  try { await logoVideo.play(); if(motionPaused || !visible || document.hidden) logoVideo.pause(); } catch { if(!logoVideo.paused) logoStage.classList.remove('is-playing'); }
  finally { playbackPending = false; }
}
logoVideo.addEventListener('playing', () => {
  if(motionPaused || !visible || document.hidden){logoVideo.pause();return;}
  logoStage.classList.add('is-playing');
});
logoVideo.addEventListener('error', () => logoStage.classList.remove('is-playing'));
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
  if (motionPaused) { logoVideo.pause(); logoStage.classList.remove('is-playing'); }
  else playLogo();
}
if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', motionChanged);
else if (reducedMotion.addListener) reducedMotion.addListener(motionChanged);
playLogo();
