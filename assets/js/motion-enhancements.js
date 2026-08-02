/* =========================================================
   Dashboard Motion System
   - Direction-aware tab transitions
   - IntersectionObserver scroll reveals
   - Scroll progress and return-to-top control
   - Lightweight click/ripple feedback
   ========================================================= */
(function(){
  'use strict';

  const pageWrap = document.querySelector('.page-wrap');
  const main = document.querySelector('.main');
  const topbar = document.querySelector('.topbar');
  if (!pageWrap || !main) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pages = Array.from(document.querySelectorAll('.page'));
  const navItems = Array.from(document.querySelectorAll('.nav-item[data-page]'));
  const navOrder = navItems.map(item => item.dataset.page);
  let currentId = (document.querySelector('.page.active') || {}).id || 'page-overview';
  let pendingDirection = 'forward';
  let revealObserver = null;
  let settleTimers = [];

  /* Add motion classes before enabling the global hidden state. */
  function decoratePage(page){
    if (!page) return [];
    const children = Array.from(page.children).filter(el => {
      if (!(el instanceof HTMLElement)) return false;
      return !el.matches('script,style,.lightbox');
    });
    children.forEach((el,index) => {
      el.classList.add('motion-reveal');
      el.style.setProperty('--motion-delay', `${Math.min(index % 4,3) * 62}ms`);
    });
    return children;
  }

  pages.forEach(decoratePage);
  navItems.forEach((item,index) => item.style.setProperty('--motion-nav-index',index));
  document.documentElement.classList.add('motion-ready');

  if (!reduceMotion && 'IntersectionObserver' in window){
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('motion-revealed');
        revealObserver.unobserve(el);
        const timer = window.setTimeout(() => el.classList.add('motion-settled'), 820);
        settleTimers.push(timer);
      });
    },{
      root: pageWrap,
      threshold: 0.08,
      rootMargin: '0px 0px -7% 0px'
    });
  }

  function revealActivePage(page,reset){
    const targets = decoratePage(page);
    targets.forEach(el => {
      if (reset){
        el.classList.remove('motion-revealed','motion-settled');
      }
      if (reduceMotion || !revealObserver){
        el.classList.add('motion-revealed','motion-settled');
      } else {
        revealObserver.unobserve(el);
        revealObserver.observe(el);
      }
    });
  }

  function animateHeading(){
    if (!topbar || reduceMotion) return;
    topbar.classList.remove('motion-heading-in');
    void topbar.offsetWidth;
    topbar.classList.add('motion-heading-in');
    window.setTimeout(() => topbar.classList.remove('motion-heading-in'), 820);
  }

  function runPageEntrance(page,direction){
    if (!page) return;
    pages.forEach(p => p.classList.remove('motion-page-enter','motion-forward','motion-backward'));
    page.classList.add('motion-page-enter',direction === 'backward' ? 'motion-backward' : 'motion-forward');
    revealActivePage(page,true);
    animateHeading();
    updateScrollUI();
    window.setTimeout(() => page.classList.remove('motion-page-enter','motion-forward','motion-backward'), 650);
  }

  /* Determine whether the user moves forward or backward through the tabs.
     Capture phase runs before the dashboard's original navigation listener. */
  document.addEventListener('click',event => {
    const item = event.target.closest('.nav-item[data-page]');
    if (!item) return;
    const activePage = document.querySelector('.page.active');
    const fromName = activePage ? activePage.id.replace(/^page-/,'') : 'overview';
    const toName = item.dataset.page;
    const fromIndex = navOrder.indexOf(fromName);
    const toIndex = navOrder.indexOf(toName);
    pendingDirection = (toIndex >= fromIndex) ? 'forward' : 'backward';

    item.classList.remove('motion-nav-fired');
    void item.offsetWidth;
    item.classList.add('motion-nav-fired');
    window.setTimeout(() => item.classList.remove('motion-nav-fired'), 560);
  },true);

  const pageClassObserver = new MutationObserver(() => {
    const active = document.querySelector('.page.active');
    if (!active || active.id === currentId) return;
    currentId = active.id;
    requestAnimationFrame(() => runPageEntrance(active,pendingDirection));
  });
  pages.forEach(page => pageClassObserver.observe(page,{attributes:true,attributeFilter:['class']}));

  /* Re-decorate dynamic content produced by lazy-built analysis tabs. */
  const contentObserver = new MutationObserver(mutations => {
    let activePageChanged = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        const page = node.closest('.page');
        if (!page || !page.classList.contains('active')) return;
        activePageChanged = true;
        const isDirectSection = node.parentElement === page;
        const isVisualCard = node.matches('.stat-card,.panel,.map-card,.real-map-panel,.dl-card,.finding-item,.synth-kpi,.ip-card,.model3d-control-card');
        if (isDirectSection || isVisualCard){
          node.classList.add('motion-new-item');
          window.setTimeout(() => node.classList.remove('motion-new-item'), 620);
        }
      });
    });
    if (activePageChanged){
      const active = document.querySelector('.page.active');
      requestAnimationFrame(() => revealActivePage(active,false));
    }
  });
  contentObserver.observe(pageWrap,{childList:true,subtree:true});

  /* Scroll progress and page elevation. */
  const progress = document.createElement('div');
  progress.className = 'motion-scroll-progress';
  progress.setAttribute('aria-hidden','true');
  progress.innerHTML = '<span></span>';
  main.appendChild(progress);
  const progressFill = progress.firstElementChild;

  const topButton = document.createElement('button');
  topButton.className = 'motion-top-button';
  topButton.type = 'button';
  topButton.setAttribute('aria-label','Back to top');
  topButton.title = 'Back to top';
  topButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/><path d="M12 9v10"/></svg>';
  main.appendChild(topButton);
  topButton.addEventListener('click',() => {
    pageWrap.scrollTo({top:0,behavior:reduceMotion ? 'auto' : 'smooth'});
  });

  let scrollFrame = 0;
  function updateScrollUI(){
    scrollFrame = 0;
    const max = Math.max(0,pageWrap.scrollHeight - pageWrap.clientHeight);
    const ratio = max ? Math.min(1,pageWrap.scrollTop / max) : 0;
    progressFill.style.transform = `scaleX(${ratio})`;
    topButton.classList.toggle('visible',pageWrap.scrollTop > Math.min(420,max * 0.34));
    if (topbar) topbar.classList.toggle('motion-scrolled',pageWrap.scrollTop > 10);
  }
  pageWrap.addEventListener('scroll',() => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateScrollUI);
  },{passive:true});
  window.addEventListener('resize',updateScrollUI,{passive:true});

  /* Ripple/press feedback for frequently used dashboard controls. */
  const pressableSelector = [
    '.nav-item','.scale-tab','.real-layer-btn','.synth-btn','.synth-filter',
    '.cld-loop-btn','.model3d-btn','.dl-btn','.camera-preset',
    '.analysis-toolbar-pill','.theme-toggle'
  ].join(',');

  document.addEventListener('pointerdown',event => {
    const target = event.target.closest(pressableSelector);
    if (!target || reduceMotion) return;
    target.classList.add('motion-pressable','motion-pressed');

    const rect = target.getBoundingClientRect();
    const wave = document.createElement('span');
    wave.className = 'motion-ripple-wave';
    wave.style.left = `${event.clientX - rect.left}px`;
    wave.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(wave);
    window.setTimeout(() => wave.remove(),680);
  },{passive:true});

  function clearPressed(){
    document.querySelectorAll('.motion-pressed').forEach(el => el.classList.remove('motion-pressed'));
  }
  document.addEventListener('pointerup',clearPressed,{passive:true});
  document.addEventListener('pointercancel',clearPressed,{passive:true});

  /* Initial entrance after the first frame so the overview animates too. */
  requestAnimationFrame(() => {
    const active = document.querySelector('.page.active');
    revealActivePage(active,false);
    animateHeading();
    updateScrollUI();
  });
})();
