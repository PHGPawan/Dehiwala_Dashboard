(function(){
  'use strict';
  function setOpen(card,open){
    card.classList.toggle('open',open);
    const header=card.querySelector('.ip-card-header');
    if(header) header.setAttribute('aria-expanded',String(open));
  }
  function buildColumn(type,title,subtitle,icon,accordion){
    const column=document.createElement('section');
    column.className=`ip-compare-column ${type==='issues'?'is-issues':'is-potentials'}`;
    const count=accordion.querySelectorAll('.ip-card').length;
    column.innerHTML=`
      <div class="ip-compare-column-header">
        <div class="ip-column-heading">
          <div class="ip-column-icon">${icon}</div>
          <div><div class="ip-column-title">${title} <span class="ip-column-count">${count}</span></div><div class="ip-column-sub">${subtitle}</div></div>
        </div>
        <div class="ip-column-actions">
          <button class="ip-column-btn" data-action="expand" type="button">Expand all</button>
          <button class="ip-column-btn" data-action="collapse" type="button">Collapse</button>
        </div>
      </div>
      <div class="ip-column-scroll"></div>`;
    column.querySelector('.ip-column-scroll').appendChild(accordion);
    column.querySelector('[data-action="expand"]').addEventListener('click',()=>accordion.querySelectorAll('.ip-card').forEach(c=>setOpen(c,true)));
    column.querySelector('[data-action="collapse"]').addEventListener('click',()=>accordion.querySelectorAll('.ip-card').forEach(c=>setOpen(c,false)));
    return column;
  }
  function init(){
    const page=document.getElementById('page-issues');
    const issues=document.getElementById('issues-accordion');
    const potentials=document.getElementById('potentials-accordion');
    if(!page||!issues||!potentials||page.dataset.compareReady==='1') return;
    page.dataset.compareReady='1';

    const intro=document.createElement('div');
    intro.className='ip-compare-intro';
    intro.innerHTML=`
      <div>
        <div class="ip-compare-intro-title">Planning diagnosis and opportunity framework</div>
        <div class="ip-compare-intro-copy">Compare the main urban constraints with the assets that can be used to address them. Open a card to review evidence, linked analyses and planning actions.</div>
      </div>
      <div class="ip-compare-key">
        <span><i style="background:var(--issue-accent)"></i>Risk / constraint</span>
        <span><i style="background:var(--potential-accent)"></i>Asset / opportunity</span>
      </div>`;

    const grid=document.createElement('div');
    grid.className='ip-dual-grid';
    grid.append(
      buildColumn('issues','Issues','Priority constraints requiring intervention','⚠',issues),
      buildColumn('potentials','Potentials','Strategic assets and leverage opportunities','✦',potentials)
    );

    /* These accordions begin as direct page children and may have been marked
       for scroll reveal before being moved into the comparison columns. Clear
       that state so their complete data is always visible. */
    [issues,potentials].forEach(acc=>{
      acc.classList.remove('motion-reveal','motion-revealed','motion-settled','motion-new-item');
      acc.style.removeProperty('--motion-delay');
      acc.style.removeProperty('opacity');
      acc.style.removeProperty('transform');
    });

    const summary=page.querySelector('.ip-summary-strip');
    if(summary){ summary.insertAdjacentElement('afterend',intro); intro.insertAdjacentElement('afterend',grid); }
    else page.append(intro,grid);

    page.querySelectorAll(':scope > .ip-section-label').forEach(el=>el.remove());
    // Start fully collapsed so the comparison page is compact by default.
    [issues,potentials].forEach(acc=>{
      acc.querySelectorAll('.ip-card').forEach(card=>setOpen(card,false));
    });
  }
  document.addEventListener('DOMContentLoaded',init);
})();
