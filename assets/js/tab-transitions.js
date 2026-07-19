/* Professional tab transition orchestrator */
(function(){
'use strict';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const navItems=[...document.querySelectorAll('.nav-item[data-page]')];
const indicator=document.getElementById('nav-indicator');
let cleanupTimer=0;

function clearStage(page){
  if(!page)return;
  page.classList.remove('tab-transition-in','tab-transition-out');
  page.querySelectorAll('.tab-stage-item').forEach(el=>{
    el.classList.remove('tab-stage-item');
    el.style.removeProperty('--tab-stage-order');
  });
}

function stageCandidates(page){
  const result=[];
  const expandable=['stat-grid','two-col','three-col','env-grid','ip-summary-strip','synth-stats-grid','model3d-stats'];
  [...page.children].forEach(child=>{
    if(child.matches('script,style'))return;
    const shouldExpand=expandable.some(cls=>child.classList.contains(cls));
    if(shouldExpand && child.children.length && child.children.length<=8){
      [...child.children].forEach(item=>result.push(item));
    }else{
      result.push(child);
    }
  });
  return result.filter(el=>{
    const style=getComputedStyle(el);
    return style.display!=='none' && style.visibility!=='hidden';
  }).slice(0,24);
}

function prepareEntry(page){
  clearStage(page);
  const items=stageCandidates(page);
  items.forEach((el,index)=>{
    el.classList.add('tab-stage-item');
    el.style.setProperty('--tab-stage-order',String(index));
  });
  // Restart CSS animations even when returning to a previously visited page.
  void page.offsetWidth;
  page.classList.add('tab-transition-in');

  window.clearTimeout(cleanupTimer);
  cleanupTimer=window.setTimeout(()=>{
    clearStage(page);
    window.dispatchEvent(new Event('resize'));
  },Math.min(1450,760+items.length*42));

  // Leaflet and canvas layouts sometimes need a second resize after transforms finish.
  [180,480,850].forEach(delay=>window.setTimeout(()=>window.dispatchEvent(new Event('resize')),delay));
}

function animateNav(item){
  item.classList.remove('tab-nav-press');
  void item.offsetWidth;
  item.classList.add('tab-nav-press');
  window.setTimeout(()=>item.classList.remove('tab-nav-press'),420);
  if(indicator){
    indicator.classList.add('tab-indicator-glow');
    window.setTimeout(()=>indicator.classList.remove('tab-indicator-glow'),520);
  }
}

navItems.forEach(item=>{
  item.addEventListener('click',()=>{
    const next=document.getElementById('page-'+item.dataset.page);
    const current=document.querySelector('.page.active');
    if(!next || next===current)return;
    animateNav(item);
    if(reduced.matches)return;

    if(current){
      clearStage(current);
      current.classList.add('tab-transition-out');
    }

    // dashboard_1.js activates the new page after 80 ms.
    window.setTimeout(()=>prepareEntry(next),92);
    window.setTimeout(()=>current&&current.classList.remove('tab-transition-out'),360);
  },true);
});

// Give the initially visible Overview tab a softer first-load entrance.
window.addEventListener('load',()=>{
  const active=document.querySelector('.page.active');
  if(active && !reduced.matches) window.setTimeout(()=>prepareEntry(active),100);
},{once:true});
})();
