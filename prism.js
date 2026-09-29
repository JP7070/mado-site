/* Image pipeline: blur -> saturation -> separated RGB channels. */
(() => {
 const ns='http://www.w3.org/2000/svg',cache=new WeakMap();let serial=0;
 const make=(tag,attrs={})=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e};
 const svg=make('svg',{width:0,height:0,'aria-hidden':true});svg.style.position='absolute';const defs=make('defs');svg.append(defs);document.body.append(svg);
 function prepare(item){
  if(cache.has(item))return cache.get(item);
  const surface=item.querySelector('.work-image,.opening-image,.story-picture');if(!surface)return null;
  // Mobile keeps blur and saturation without RGB filters or duplicate images.
  if(innerWidth<=760){
   const result={surface,mobile:{base:surface}};
   cache.set(item,result);return result;
  }
  const id='mado-prism-'+serial++,f=make('filter',{id,x:'0%',y:'0%',width:'100%',height:'100%','color-interpolation-filters':'sRGB'});
  const blur=make('feGaussianBlur',{in:'SourceGraphic',stdDeviation:0,result:'soft'}),sat=make('feColorMatrix',{in:'soft',type:'saturate',values:1,result:'color'});f.append(blur,sat);
  const offsets=[];
  for(let i=0;i<3;i++){
   const matrix=make('feColorMatrix',{in:'color',type:'matrix',values:[0,1,2,3].map(r=>[0,1,2,3,4].map(c=>r===c&&(r===i||r===3)?1:0).join(' ')).join(' '),result:'c'+i});
   if(i===1){matrix.setAttribute('result','o1');offsets.push(null);f.append(matrix);}
   else{const offset=make('feOffset',{in:'c'+i,dx:0,dy:0,result:'o'+i});offsets.push(offset);f.append(matrix,offset);}
  }
  f.append(make('feBlend',{in:'o0',in2:'o1',mode:'screen',result:'rg'}),make('feBlend',{in:'rg',in2:'o2',mode:'screen',result:'split'}));
  // Native primitives avoid asynchronous feImage decoding during the reveal.
  f.append(make('feFlood',{'flood-color':'white',x:'8%',y:'8%',width:'84%',height:'84%',result:'maskCore'}),make('feGaussianBlur',{in:'maskCore',stdDeviation:18,result:'edgeMask'}),make('feComposite',{in:'split',in2:'edgeMask',operator:'in',result:'center'}),make('feComposite',{in:'color',in2:'edgeMask',operator:'out',result:'edge'}),make('feComposite',{in:'center',in2:'edge',operator:'arithmetic',k1:0,k2:1,k3:1,k4:0}));defs.append(f);
  const result={surface,id,blur,sat,offsets};
  cache.set(item,result);return result;
 }
 function set(item,strength){
  const s=Math.max(0,Math.min(1,strength)),e=s?prepare(item):cache.get(item);if(!e)return;
  const width=innerWidth<=600?600:1200;
  if(e.strength===s&&e.width===width)return;
  e.strength=s;e.width=width;
  if(e.mobile){
   e.mobile.base.style.filter=s?`blur(${3*s}px) saturate(${1-s})`:'none';
   return;
  }
  if(!s){if(e.enabled)e.surface.style.removeProperty('filter');e.enabled=false;return;}
  if(!e.enabled){e.surface.style.filter='url(#'+e.id+')';e.enabled=true;}
  e.blur.setAttribute('stdDeviation',String((width===600?6:10)*s));e.sat.setAttribute('values',String(1-s));
  e.offsets.forEach((o,i)=>{if(!o)return;o.setAttribute('dx',String((i-1)*(width===600?12:20)*s));o.setAttribute('dy',String((1-i)*3*s))});
 }
 function enter(item,animation){
  let frame,stopped=false;
  const duration=Number(animation.effect?.getTiming().duration)||(innerWidth<=760?500:750);
  const tick=()=>{if(stopped)return;const progress=Math.min(1,Number(animation.currentTime||0)/duration);set(item,1-progress);if(progress<1)frame=requestAnimationFrame(tick)};
  tick();return ()=>{stopped=true;cancelAnimationFrame(frame);set(item,0)};
 }
 window.madoPrism={set,enter};
})();
