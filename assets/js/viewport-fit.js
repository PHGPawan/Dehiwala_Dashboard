/* Screen-aware primary-panel sizing for every dashboard tab. */
(function(){
  'use strict';
  const root=document.documentElement;
  let scheduled=0;
  let syntheticResize=false;

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const visible=el=>el&&el.offsetParent!==null&&el.getBoundingClientRect().width>0;

  function setAvailableHeight(selector,variable,{min,max,gap=22}={}){
    const el=document.querySelector(selector);
    if(!visible(el)) return false;
    const rect=el.getBoundingClientRect();
    const available=Math.floor(window.innerHeight-rect.top-gap);
    const height=clamp(available,min,max);
    root.style.setProperty(variable,height+'px');
    return true;
  }

  function fitActivePage(){
    scheduled=0;
    if(window.innerWidth<=1024) return;
    const active=document.querySelector('.page.active');
    if(!active) return;
    const id=active.id;
    let changed=false;

    if(id==='page-overview'){
      changed=setAvailableHeight('#leaflet-map','--overview-primary-h',{min:280,max:380,gap:28})||changed;
    }
    if(id==='page-centrality'){
      changed=setAvailableHeight('#centrality-real-map','--centrality-primary-h',{min:290,max:465,gap:24})||changed;
    }
    if(id==='page-density'){
      changed=setAvailableHeight('#density-real-map','--density-primary-h',{min:310,max:500,gap:24})||changed;
    }
    if(id==='page-maturation'){
      changed=setAvailableHeight('#maturation-real-map','--maturation-primary-h',{min:310,max:500,gap:24})||changed;
    }
    if(id==='page-environment'){
      changed=setAvailableHeight('#landuse-real-map','--landuse-primary-h',{min:310,max:500,gap:24})||changed;
    }
    if(id==='page-model3d'){
      changed=setAvailableHeight('#model3d-stage','--model3d-primary-h',{min:320,max:480,gap:24})||changed;
    }
    if(id==='page-synthesis'){
      changed=setAvailableHeight('#synth-canvas-panel','--synthesis-primary-h',{min:300,max:475,gap:24})||changed;
    }

    /* Leaflet, Chart.js, model-viewer and the synthesis canvas all listen to
       resize/ResizeObserver. Trigger one redraw after the CSS variables settle. */
    if(changed){
      requestAnimationFrame(()=>{
        syntheticResize=true;
        window.dispatchEvent(new Event('resize'));
        syntheticResize=false;
      });
    }
  }

  function schedule(delay=0){
    clearTimeout(scheduled);
    scheduled=setTimeout(()=>requestAnimationFrame(fitActivePage),delay);
  }

  window.addEventListener('resize',()=>{if(!syntheticResize)schedule(80)});
  window.addEventListener('orientationchange',()=>schedule(180));
  window.addEventListener('load',()=>{schedule(60);schedule(420)});
  document.addEventListener('click',event=>{
    if(event.target.closest('.nav-item')){
      schedule(130);
      schedule(430);
    }
    if(event.target.closest('.scale-tab,.real-layer-btn,.camera-preset')) schedule(180);
  },true);

  /* React when page visibility classes change, including keyboard/script navigation. */
  const pageWrap=document.querySelector('.page-wrap');
  if(pageWrap){
    new MutationObserver(()=>schedule(120)).observe(pageWrap,{subtree:true,attributes:true,attributeFilter:['class']});
  }
})();
