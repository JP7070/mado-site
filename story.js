(() => {
  const story=document.querySelector('.scroll-story');
  if(!story)return;
  const stage=story.querySelector('.story-stage');
  const scenes=[...story.querySelectorAll('.story-scene')];
  const links=[...story.querySelectorAll('[data-story-link]')];
  const heading=document.querySelector('#story-name');
  const number=document.querySelector('#story-number');
  const bar=story.querySelector('.story-progress span');
  const names=['Animation','Commercial','Spatial'];
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  let scheduled=false,last=-1,previousProgress=-1;
  function render(){
    scheduled=false;
    if(motion.matches)return;
    const rect=story.getBoundingClientRect();
    const progress=clamp(-rect.top/Math.max(1,story.offsetHeight-stage.offsetHeight));
    if(progress===previousProgress)return;
    previousProgress=progress;
    const x=progress*3;
    const a=smooth((x-.7)/.6),b=smooth((x-1.7)/.6);
    const weights=[1-a,a-b,b];
    const current=weights.indexOf(Math.max(...weights));
    scenes.forEach((scene,i)=>{
      const amount=weights[i];
      window.madoPrism?.set(scene,amount>0?1-amount:0);
      scene.style.opacity=String(amount);
      scene.style.filter='none';
      scene.style.transform=`scale(${.96+.04*amount})`;
      scene.setAttribute('aria-hidden',String(i!==current));
    });
    if(current!==last){
      last=current;heading.textContent=names[current];number.textContent=`0${current+1} / 03`;
      links.forEach((link,i)=>{if(i===current)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current')});
    }
    bar.style.transform=`scaleX(${progress})`;
  }
  function schedule(){if(!scheduled&&!motion.matches){scheduled=true;requestAnimationFrame(render)}}
  function setup(){
    previousProgress=-1;
    story.classList.toggle('story-ready',!motion.matches);
    if(motion.matches){scenes.forEach(scene=>{scene.removeAttribute('style');scene.removeAttribute('aria-hidden');window.madoPrism?.set(scene,0)});}
    else render();
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',()=>{previousProgress=-1;schedule()});
  window.addEventListener('pageshow',schedule);
  if(motion.addEventListener)motion.addEventListener('change',setup);else motion.addListener(setup);
  setup();
  links.forEach((link,i)=>link.addEventListener('click',event=>{
    event.preventDefault();
    filterWorks(['anime','commercial','spatial'][i]);
    document.querySelector('#works').scrollIntoView({behavior:'instant'});
  }));
  // Restore deep links after the sticky section has established its height.
  window.addEventListener('load',()=>{
    if(location.hash==='#works')document.querySelector('#works').scrollIntoView({behavior:'instant'});
  },{once:true});
})();
