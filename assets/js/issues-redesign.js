(function(){
  'use strict';
  const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
  const clean=s=>(s||'').replace(/\s+/g,' ').trim();
  function withoutPrefix(node){
    if(!node)return '';
    const clone=node.cloneNode(true);
    clone.querySelectorAll('.ip-rec-num,.ip-ev-dot').forEach(x=>x.remove());
    return clean(clone.textContent);
  }
  function parseCard(card,type){
    const chips=$$('.ip-chip',card).map(x=>clean(x.textContent));
    const impacts=$$('.ip-impact-item',card).map(x=>({label:clean($('.ip-impact-label',x)?.textContent),value:clean($('.ip-impact-val',x)?.textContent)}));
    return {
      id:card.dataset.id||'', type,
      title:clean($('.ip-card-title',card)?.textContent),
      priority:chips[0]|| (type==='issue'?'Priority':'Opportunity'),
      theme:chips[1]||'Planning',
      evidence:$$('.ip-evidence-item',card).map(withoutPrefix),
      actions:$$('.ip-rec-item',card).map(withoutPrefix),
      tags:$$('.ip-ana-tag',card).map(x=>clean(x.textContent)),
      impacts
    };
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function emphasis(s){
    const parts=String(s||'').split(/(—|:)/);
    if(parts.length>1)return `<strong>${esc(parts[0].trim())}</strong>${esc(parts.slice(1).join('').trim()? ' '+parts.slice(1).join('').trim():'')}`;
    return esc(s);
  }
  function itemHTML(d){
    const impactMap=Object.fromEntries(d.impacts.map(x=>[x.label,x.value]));
    const meta=[impactMap.Severity||d.priority,impactMap.Scale||d.theme].filter(Boolean);
    return `<article class="ip-matrix-item is-${d.type}" data-type="${d.type}" data-theme="${esc(d.theme.toLowerCase())}">
      <button class="ip-matrix-row-main" type="button" aria-expanded="false">
        <span class="ip-matrix-code">${esc(d.id)}</span>
        <span class="ip-matrix-finding"><b>${esc(d.title)}</b><span>${d.type==='issue'?'Urban constraint':'Strategic asset'} · ${esc(d.theme)}</span></span>
        <span class="ip-matrix-evidence">${esc(d.evidence[0]||'Open for supporting evidence.')}</span>
        <span class="ip-matrix-action">${emphasis(d.actions[0]||'Open for planning response.')}</span>
        <span class="ip-matrix-meta">${meta.map(x=>`<span>${esc(x)}</span>`).join('')}</span>
        <span class="ip-matrix-chevron">⌄</span>
      </button>
      <div class="ip-matrix-detail"><div class="ip-matrix-detail-inner"><div class="ip-matrix-detail-grid">
        <div><h4>${d.type==='issue'?'Full evidence':'Evidence base'}</h4><div class="ip-matrix-list">${d.evidence.map(x=>`<div>${esc(x)}</div>`).join('')}</div></div>
        <div><h4>Linked analyses</h4><div class="ip-matrix-tags">${(d.tags.length?d.tags:[d.theme]).map(x=>`<span>${esc(x)}</span>`).join('')}</div>${d.impacts.length?`<h4 style="margin-top:13px">Planning profile</h4><div class="ip-matrix-tags">${d.impacts.map(x=>`<span>${esc(x.label)} · ${esc(x.value)}</span>`).join('')}</div>`:''}</div>
        <div><h4>${d.type==='issue'?'Recommended responses':'How to leverage'}</h4><div class="ip-matrix-list">${d.actions.map(x=>`<div>${esc(x)}</div>`).join('')}</div></div>
      </div></div></div>
    </article>`;
  }
  function groupHTML(type,title,copy,items){
    return `<section class="ip-matrix-group is-${type}" data-group="${type}"><div class="ip-matrix-group-title"><i style="background:currentColor"></i>${title}<span>${items.length} ${copy}</span></div>${items.map(itemHTML).join('')}</section>`;
  }
  function updateSummary(page,issues,potentials){
    const cards=$$('.ip-sum-card',page), total=issues.length+potentials.length, actions=[...issues,...potentials].reduce((n,x)=>n+x.actions.length,0);
    const vals=[issues.length,potentials.length,total,actions];
    const labels=['Priority Issues','Key Potentials','Total Findings','Planning Actions'];
    cards.forEach((c,i)=>{const n=$('.ip-sum-num',c),l=$('.ip-sum-label',c);if(n)n.textContent=vals[i];if(l)l.textContent=labels[i]});
  }
  function init(){
    const page=$('#page-issues'), issueAcc=$('#issues-accordion'), potentialAcc=$('#potentials-accordion');
    if(!page||!issueAcc||!potentialAcc||page.dataset.matrixReady==='1')return;
    page.dataset.matrixReady='1';
    const issues=$$('.ip-card',issueAcc).map(c=>parseCard(c,'issue'));
    const potentials=$$('.ip-card',potentialAcc).map(c=>parseCard(c,'potential'));
    updateSummary(page,issues,potentials);
    const sub=$('.section-sub',page);if(sub)sub.textContent='Use the evidence matrix to compare urban constraints, strategic assets and the planning actions linked to each finding.';
    const themes=[...new Set([...issues,...potentials].map(x=>x.theme))];
    const shell=document.createElement('div');shell.className='ip-matrix-shell';
    shell.innerHTML=`<div class="ip-matrix-toolbar"><div><div class="ip-matrix-eyebrow">Integrated planning diagnosis</div><div class="ip-matrix-title">Issue–Potential Evidence Matrix</div><div class="ip-matrix-copy">The branching spine separates constraints from opportunities while each row links a finding to evidence, action and implementation scale. Select a row to inspect the complete analysis.</div></div><div class="ip-matrix-filters"><button class="ip-matrix-filter active" data-filter="all">All</button><button class="ip-matrix-filter" data-filter="issue">Issues</button><button class="ip-matrix-filter" data-filter="potential">Potentials</button>${themes.map(t=>`<button class="ip-matrix-filter" data-filter="theme:${esc(t.toLowerCase())}">${esc(t)}</button>`).join('')}</div></div>
      <div class="ip-matrix-head"><span>Branch</span><span>Finding</span><span>Evidence snapshot</span><span>Planning direction</span><span>Profile</span><span></span></div>
      ${groupHTML('issue','Urban constraints','priority findings',issues)}
      ${groupHTML('potential','Strategic opportunities','planning assets',potentials)}
      <div class="ip-matrix-empty">No findings match this filter.</div>`;
    const summary=$('.ip-summary-strip',page);(summary||$('.section-header',page)).insertAdjacentElement('afterend',shell);
    issueAcc.hidden=true;potentialAcc.hidden=true;$$(':scope > .ip-section-label',page).forEach(x=>x.hidden=true);
    $$('.ip-matrix-row-main',shell).forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.ip-matrix-item'),open=!item.classList.contains('open');item.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open))}));
    $$('.ip-matrix-filter',shell).forEach(btn=>btn.addEventListener('click',()=>{
      $$('.ip-matrix-filter',shell).forEach(x=>x.classList.toggle('active',x===btn));
      const f=btn.dataset.filter;let shown=0;
      $$('.ip-matrix-item',shell).forEach(item=>{const ok=f==='all'||item.dataset.type===f||(f.startsWith('theme:')&&item.dataset.theme===f.slice(6));item.hidden=!ok;if(ok)shown++});
      $$('.ip-matrix-group',shell).forEach(g=>{g.hidden=!$$('.ip-matrix-item',g).some(x=>!x.hidden)});
      $('.ip-matrix-empty',shell).classList.toggle('show',shown===0);
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
