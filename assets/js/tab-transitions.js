/* Lightweight tab transition orchestrator */
(function(){
'use strict';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const navItems=[...document.querySelectorAll('.nav-item[data-page]')];
const indicator=document.getElementById('nav-indicator');
let cleanupTimer=0;

function clearClasses(page){
  if(!page)return;
  page.classList.remove('tab-transition-in','tab-transition-out');
}

function animateEntry(page){
  if(!page||reduced.matches)return;
  clearClasses(page);
  requestAnimationFrame(()=>{
    page.classList.add('tab-transition-in');
  });
  window.clearTimeout(cleanupTimer);
  cleanupTimer=window.setTimeout(()=>{
    page.classList.remove('tab-transition-in');
    /* One resize after the animation is enough for Leaflet, charts and the 3D viewer. */
    window.dispatchEvent(new Event('resize'));
  },330);
}

function animateNav(item){
  item.classList.remove('tab-nav-press');
  requestAnimationFrame(()=>item.classList.add('tab-nav-press'));
  window.setTimeout(()=>item.classList.remove('tab-nav-press'),180);
  if(indicator){
    indicator.classList.add('tab-indicator-glow');
    window.setTimeout(()=>indicator.classList.remove('tab-indicator-glow'),220);
  }
}

navItems.forEach(item=>{
  item.addEventListener('click',()=>{
    const next=document.getElementById('page-'+item.dataset.page);
    const current=document.querySelector('.page.active');
    if(!next||next===current)return;
    animateNav(item);
    if(reduced.matches)return;
    if(current){
      clearClasses(current);
      current.classList.add('tab-transition-out');
      window.setTimeout(()=>current.classList.remove('tab-transition-out'),160);
    }
    /* dashboard_1.js activates the destination page after 80 ms. */
    window.setTimeout(()=>animateEntry(next),84);
  },true);
});

window.addEventListener('load',()=>{
  const active=document.querySelector('.page.active');
  if(active&&!reduced.matches)window.setTimeout(()=>animateEntry(active),70);
},{once:true});
})();
