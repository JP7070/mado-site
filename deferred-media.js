/* Release media after the logo is seen or the first work approaches. */
(()=>{
 const stage=document.querySelector('.logo-stage');
 const still=stage?.querySelector('.logo-fallback');
 const video=stage?.querySelector('#mado-animation');
 const start=document.querySelector('.scroll-story')||document.querySelector('#works');
 const cards=[...document.querySelectorAll('.archive-work')];
 const scenes=[...document.querySelectorAll('.story-scene')];
 const layer=document.querySelector('.scroll-background');
 let ready=false,logoSeen=false;
 const api=window.madoDeferredMedia={ready:false,load};
 function load(node){
  if(!ready)return;
  node?.querySelectorAll('img[data-media-src]').forEach(img=>{
   if(img.closest('.archive-work')?.hidden)return;
   const src=img.dataset.mediaSrc,srcset=img.dataset.mediaSrcset;
   delete img.dataset.mediaSrc;delete img.dataset.mediaSrcset;
   img.loading='eager'; // IntersectionObserver, rather than native heuristics, sets the request boundary.
   if(srcset)img.srcset=srcset;
   img.src=src;
  });
 }
 function firstRow(){
  const visible=cards.filter(card=>!card.hidden);
  if(!visible.length)return;
  // Match the archive's 3/2/1 column layouts without changing its styles.
  const count=innerWidth<=600?1:scenes.length?2:innerWidth<=1000?2:3;
  visible.slice(0,count).forEach(load);
 }
 function nearby(){
  if(!ready)return;
  for(const card of cards){
   if(card.hidden)continue;
   const box=card.getBoundingClientRect();
   if(box.top<=innerHeight+400&&box.bottom>=-400)load(card);
  }
 }
 function release(){
  if(ready)return;
  ready=api.ready=true;
  if(layer)layer.style.backgroundImage="url('/assets/scroll-background-color2.jpg')";
  const backgroundVideo=document.querySelector('#scroll-background-video');
  if(backgroundVideo)backgroundVideo.poster='/assets/scroll-background-color2.jpg';
  scenes.forEach(load);
  firstRow();nearby();
  window.dispatchEvent(new Event('mado:media-ready'));
 }
 function checkStart(){
  if(start&&start.getBoundingClientRect().top<=innerHeight+200)release();
 }
 function seen(){
  if(logoSeen||!stage||!stage.getClientRects().length)return;
  if(!stage.classList.contains('is-playing')&&!stage.classList.contains('is-finished')&&!stage.classList.contains('show-fallback'))return;
  const r=stage.getBoundingClientRect();
  if(r.bottom<=0||r.top>=innerHeight||document.hidden)return;
  logoSeen=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(release,3000)));
 }
 if(still){still.addEventListener('load',seen,{once:true});if(still.complete&&still.naturalWidth)seen();}
 video?.addEventListener('playing',()=>{
  if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(seen);
  else requestAnimationFrame(seen);
 });
 window.addEventListener('mado:logo-visible',seen);
 if('IntersectionObserver' in window){
  if(stage)new IntersectionObserver(entries=>{if(entries[0].isIntersecting)seen()}).observe(stage);
  if(start)new IntersectionObserver(entries=>{if(entries[0].isIntersecting)release()},{rootMargin:'200px 0px 200px 0px'}).observe(start);
  const observer=new IntersectionObserver(entries=>{
   if(!ready)return;
   for(const entry of entries)if(entry.isIntersecting&&!entry.target.hidden)load(entry.target);
  },{rootMargin:'400px 0px 400px 0px'});
  cards.forEach(card=>observer.observe(card));
 }else{
  window.addEventListener('scroll',checkStart,{passive:true});
  window.addEventListener('scroll',nearby,{passive:true});
 }
 document.addEventListener('focusin',event=>{
  const card=event.target.closest('.archive-work');
  if(card){release();load(card)}
  if(event.target.closest('.story-categories')){release();scenes.forEach(load)}
 });
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  release();requestAnimationFrame(()=>{firstRow();nearby()});
 }));
 window.addEventListener('resize',()=>{checkStart();if(ready){firstRow();nearby()}});
 window.addEventListener('pageshow',()=>{checkStart();if(ready)nearby();if(still?.complete&&still.naturalWidth)seen()});
 window.addEventListener('scroll',checkStart,{passive:true});
 checkStart();
 if(still?.complete&&still.naturalWidth)seen();
})();
