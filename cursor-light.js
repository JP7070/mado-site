/* No background effects and no continuous animation loop. */
(()=>{
 const enabled=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
 const sheen=document.createElement('span');sheen.className='cursor-sheen';sheen.setAttribute('aria-hidden','true');
 let active=null,frame=0,x=0,y=0;
 function stop(){cancelAnimationFrame(frame);frame=0;if(active)active.classList.remove('is-reflecting');active=null;sheen.classList.remove('is-active')}
 function draw(){
  frame=0;if(!active)return;
  const r=active.getBoundingClientRect();
  const px=Math.max(0,Math.min(1,(x-r.left)/r.width)),py=Math.max(0,Math.min(1,(y-r.top)/r.height));
  sheen.style.transform='translate3d('+((px-.5)*r.width*.85)+'px,'+((py-.5)*r.height*.3)+'px,0)';
 }
 function move(e){
  if(!enabled.matches||e.pointerType!=='mouse'||document.hidden){stop();return}
  const surface=e.target.closest('.archive-work .work-image');
  if(!surface){stop();return}
  if(active!==surface){stop();active=surface;active.append(sheen);active.classList.add('is-reflecting')}
  x=e.clientX;y=e.clientY;sheen.classList.add('is-active');
  if(!frame)frame=requestAnimationFrame(draw);
 }
 document.addEventListener('pointermove',move,{passive:true});
 document.documentElement.addEventListener('pointerleave',stop);
 window.addEventListener('blur',stop);
 window.addEventListener('scroll',stop,{passive:true});
 document.addEventListener('visibilitychange',stop);
 enabled.addEventListener('change',stop);
})();
