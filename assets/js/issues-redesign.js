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
    const impacts=$$('.ip-impact-item',card).map(x=>({
      label:clean($('.ip-impact-label',x)?.textContent),
      value:clean($('.ip-impact-val',x)?.textContent)
    }));
    return {
      id:card.dataset.id||'',
      type,
      title:clean($('.ip-card-title',card)?.textContent),
      priority:chips[0]||(type==='issue'?'Priority':'Opportunity'),
      theme:chips[1]||'Planning',
      evidence:$$('.ip-evidence-item',card).map(withoutPrefix).filter(Boolean),
      actions:$$('.ip-rec-item',card).map(withoutPrefix).filter(Boolean),
      tags:$$('.ip-ana-tag',card).map(x=>clean(x.textContent)).filter(Boolean),
      impacts
    };
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function summaryText(d){return d.evidence[0]||d.actions[0]||'Integrated contextual finding.'}
  function profileTags(d){
    const vals=d.impacts.map(x=>`${x.label}: ${x.value}`);
    return [...new Set([d.priority,d.theme,...vals].filter(Boolean))];
  }
  function detailList(items,fallback){
    const rows=(items.length?items:[fallback]);
    return rows.map(x=>`<div>${esc(x)}</div>`).join('');
  }
  function nodeHTML(d){
    if(!d)return '<div class="ip-tree-empty-slot" aria-hidden="true"></div>';
    const evidence=d.evidence[0]||'Evidence available in the integrated analysis.';
    const action=d.actions[0]||'Develop a coordinated planning response.';
    const side=d.type==='issue'?'left':'right';
    return `<article class="ip-tree-node is-${d.type}" data-type="${d.type}" data-theme="${esc(d.theme.toLowerCase())}">
      <button class="ip-tree-node-main" type="button" aria-expanded="false">
        <span class="ip-tree-node-top"><span class="ip-tree-code">${esc(d.id)}</span><span class="ip-tree-theme">${esc(d.theme)}</span><span class="ip-tree-state">${d.type==='issue'?'CONSTRAINT':'OPPORTUNITY'}</span></span>
        <span class="ip-tree-title">${esc(d.title)}</span>
        <span class="ip-tree-snapshot">${esc(evidence)}</span>
        <span class="ip-tree-direction"><b>${d.type==='issue'?'Planning response':'Planning leverage'}</b><span>${esc(action)}</span></span>
        <span class="ip-tree-open-icon" aria-hidden="true">+</span>
      </button>
      <div class="ip-tree-detail"><div class="ip-tree-detail-inner">
        <div class="ip-tree-detail-section"><h4>${d.type==='issue'?'Evidence':'Opportunity evidence'}</h4><div class="ip-tree-list">${detailList(d.evidence,'Evidence is synthesized from the dashboard analyses.')}</div></div>
        <div class="ip-tree-detail-section"><h4>${d.type==='issue'?'Recommended actions':'Ways to leverage'}</h4><div class="ip-tree-list">${detailList(d.actions,'Develop a coordinated planning response.')}</div></div>
        <div class="ip-tree-detail-section full"><h4>Linked analysis and profile</h4><div class="ip-tree-tags">${[...(d.tags.length?d.tags:[d.theme]),...profileTags(d)].map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>
      </div></div>
    </article>`;
  }
  function updateSummary(page,issues,potentials){
    const cards=$$('.ip-sum-card',page);
    const total=issues.length+potentials.length;
    const actions=[...issues,...potentials].reduce((n,x)=>n+x.actions.length,0);
    const vals=[issues.length,potentials.length,total,actions];
    const labels=['Priority Issues','Key Potentials','Total Findings','Planning Actions'];
    cards.forEach((c,i)=>{
      const n=$('.ip-sum-num',c),l=$('.ip-sum-label',c);
      if(n)n.textContent=vals[i];
      if(l)l.textContent=labels[i];
    });
  }
  function rowHTML(issue,potential,index){
    return `<div class="ip-tree-row${issue?' has-left':''}${potential?' has-right':''}" data-row="${index+1}">
      ${nodeHTML(issue)}
      <div class="ip-tree-junction" aria-hidden="true"><span>${String(index+1).padStart(2,'0')}</span></div>
      ${nodeHTML(potential)}
    </div>`;
  }
  function applyFilter(shell,filter){
    let visible=0;
    $$('.ip-tree-node',shell).forEach(node=>{
      const ok=filter==='all'||node.dataset.type===filter||(filter.startsWith('theme:')&&node.dataset.theme===filter.slice(6));
      node.hidden=!ok;
      if(ok)visible++;
    });
    $$('.ip-tree-row',shell).forEach(row=>{
      const left=$('.ip-tree-node.is-issue',row),right=$('.ip-tree-node.is-potential',row);
      row.classList.toggle('left-filtered',!left||left.hidden);
      row.classList.toggle('right-filtered',!right||right.hidden);
      row.hidden=(!left||left.hidden)&&(!right||right.hidden);
    });
    $('.ip-tree-empty',shell).classList.toggle('show',visible===0);
  }
  function init(){
    const page=$('#page-issues'),issueAcc=$('#issues-accordion'),potentialAcc=$('#potentials-accordion');
    if(!page||!issueAcc||!potentialAcc||page.dataset.treeReady==='1')return;
    page.dataset.treeReady='1';
    const issues=$$('.ip-card',issueAcc).map(c=>parseCard(c,'issue'));
    const potentials=$$('.ip-card',potentialAcc).map(c=>parseCard(c,'potential'));
    updateSummary(page,issues,potentials);
    const sub=$('.section-sub',page);
    if(sub)sub.textContent='A two-branch planning diagnosis: urban issues extend to the left and strategic potentials extend to the right.';

    const themes=[...new Set([...issues,...potentials].map(x=>x.theme).filter(Boolean))];
    const rowCount=Math.max(issues.length,potentials.length);
    const rows=Array.from({length:rowCount},(_,i)=>rowHTML(issues[i],potentials[i],i)).join('');
    const shell=document.createElement('section');
    shell.className='ip-tree-shell';
    shell.innerHTML=`
      <div class="ip-tree-toolbar">
        <div>
          <div class="ip-tree-eyebrow">Integrated planning diagnosis</div>
          <div class="ip-tree-heading">Issues–Potentials Branch Map</div>
          <div class="ip-tree-copy">The central trunk represents the Dehiwala planning context. Urban constraints branch to the left, while strategic assets and opportunities branch to the right.</div>
        </div>
        <div class="ip-tree-filters" aria-label="Filter planning findings">
          <button class="ip-tree-filter active" data-filter="all">All findings</button>
          <button class="ip-tree-filter" data-filter="issue">Issues</button>
          <button class="ip-tree-filter" data-filter="potential">Potentials</button>
          ${themes.map(t=>`<button class="ip-tree-filter" data-filter="theme:${esc(t.toLowerCase())}">${esc(t)}</button>`).join('')}
        </div>
      </div>
      <div class="ip-tree-branch-heads">
        <div class="ip-tree-branch-title is-issue"><span>−</span><div><b>Urban Issues</b><small>${issues.length} priority constraints</small></div></div>
        <div class="ip-tree-root"><span>DEHIWALA</span><b>Planning Diagnosis</b><i></i></div>
        <div class="ip-tree-branch-title is-potential"><span>+</span><div><b>Strategic Potentials</b><small>${potentials.length} planning opportunities</small></div></div>
      </div>
      <div class="ip-tree-body">${rows}</div>
      <div class="ip-tree-empty">No findings match this filter.</div>`;

    const summary=$('.ip-summary-strip',page);
    (summary||$('.section-header',page)).insertAdjacentElement('afterend',shell);
    issueAcc.hidden=true;
    potentialAcc.hidden=true;
    $$(':scope > .ip-section-label',page).forEach(x=>x.hidden=true);

    $$('.ip-tree-node-main',shell).forEach(btn=>btn.addEventListener('click',()=>{
      const node=btn.closest('.ip-tree-node');
      const open=!node.classList.contains('open');
      node.classList.toggle('open',open);
      btn.setAttribute('aria-expanded',String(open));
    }));
    $$('.ip-tree-filter',shell).forEach(btn=>btn.addEventListener('click',()=>{
      $$('.ip-tree-filter',shell).forEach(x=>x.classList.toggle('active',x===btn));
      applyFilter(shell,btn.dataset.filter);
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
