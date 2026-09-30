/* Fixed canvas, scroll-controlled time; never autoplay or decode while idle. */
(()=>{
 const layer=document.querySelector('.scroll-background'),video=document.querySelector('#scroll-background-video'),start=document.querySelector('.scroll-story,.opening-gallery')||document.querySelector('#works');
 if(!layer||!video||!start)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let target=0,scheduled=false,lastSeek=-Infinity,seekTimer=0;
 video.muted=true;video.defaultMuted=true;
 const source=innerWidth<=760?'/assets/scroll-background-mobile-seek.mp4':'/assets/scroll-background-seek.mp4';
 // Load into a local Blob: hosting returns 200 even for Range requests.
 // A Blob remains seekable without relying on server byte-range support.
 let loading=false;
 function loadBackground(){
  if(loading)return;
  loading=true;
  fetch(source).then(response=>{if(!response.ok)throw new Error('Background video unavailable');return response.blob()})
   .then(blob=>{video.src=URL.createObjectURL(new Blob([blob],{type:'video/mp4'}));video.load()})
   .catch(()=>{layer.dataset.videoState='unavailable'});
 }
 window.addEventListener('mado:media-ready',loadBackground,{once:true});
 if(window.madoDeferredMedia?.ready)loadBackground();
 function seek(){
  if(document.hidden||video.seeking||!Number.isFinite(video.duration)||reduced.matches)return;
  if(Math.abs(video.currentTime-target)<=1/48)return;
  const remaining=1000/15-(performance.now()-lastSeek);
  if(remaining>0){if(!seekTimer)seekTimer=setTimeout(()=>{seekTimer=0;seek()},remaining);return;}
  clearTimeout(seekTimer);seekTimer=0;lastSeek=performance.now();
  video.currentTime=target;video.dataset.scrollTime=target.toFixed(3);
 }
 function render(){
  scheduled=false;
  const top=start.getBoundingClientRect().top,viewport=innerHeight;
  const blend=innerWidth<=760?160:240;
  const blending=top<viewport&&top+blend>0;
  layer.classList.toggle('background-solid',top+blend<=0);
  layer.style.visibility=top>=viewport?'hidden':'visible';
  if(blending){
   layer.style.setProperty('--blend-start',`${top}px`);
   layer.style.setProperty('--blend-end',`${top+blend}px`);
  }
  const startY=top+scrollY;
  // Desktop restores the original page-length pace; mobile keeps the faster loop.
  const distance=Math.max(0,scrollY-startY);
  const loopDistance=innerWidth<=760?1800:Math.max(1,document.documentElement.scrollHeight-viewport-startY);
  const phase=(distance%loopDistance)/loopDistance;
  target=Number.isFinite(video.duration)&&video.duration>0
   ?Math.min(Math.floor(phase*video.duration*24)/24,Math.max(0,video.duration-1/24)):0;
  seek();
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render)}}
 video.addEventListener('loadedmetadata',schedule);
 video.addEventListener('loadeddata',schedule);
 video.addEventListener('seeked',()=>{video.dataset.renderedTime=video.currentTime.toFixed(3);seek()});
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule);
 window.addEventListener('pageshow',schedule);
 document.addEventListener('visibilitychange',schedule);
 new ResizeObserver(schedule).observe(document.body);
 reduced.addEventListener('change',()=>{if(reduced.matches){target=0;video.currentTime=0;}else schedule()});
 schedule();
})();
