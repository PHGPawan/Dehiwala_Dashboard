(function(){
'use strict';

function makeLayout(mainNodes, explanation, className=''){
  if(!mainNodes || !mainNodes.length || !explanation || explanation.closest('.map-detail-layout')) return null;
  const first=mainNodes[0];
  const parent=first.parentNode;
  if(!parent) return null;
  const layout=document.createElement('div');
  layout.className=`map-detail-layout ${className}`.trim();
  const main=document.createElement('div'); main.className='map-detail-main';
  const aside=document.createElement('aside'); aside.className='map-detail-aside';
  parent.insertBefore(layout,first);
  layout.append(main,aside);
  mainNodes.forEach(node=>{if(node&&node.parentNode)main.appendChild(node);});
  aside.appendChild(explanation);
  return {layout,main,aside};
}

function arrangeOverview(){
  const page=document.getElementById('page-overview');
  const mapWrap=page && page.querySelector('.map-wrap');
  const explanation=document.getElementById('overview-map-explanation');
  if(!page||!mapWrap||!explanation)return;

  const firstTwoCol=[...page.querySelectorAll(':scope > .two-col')].find(el=>el.contains(mapWrap));
  if(firstTwoCol)firstTwoCol.classList.add('overview-main-stack');

  const result=makeLayout([mapWrap],explanation,'overview-map-layout');
  if(!result)return;

  // Move Leaflet finder and selected profile into the information column.
  const moveControls=()=>{
    const explorer=document.querySelector('.overview-map-explorer');
    const selection=document.getElementById('overview-selection-card');
    if(explorer && explorer.parentNode!==result.aside)result.aside.insertBefore(explorer,result.aside.firstChild);
    if(selection && selection.parentNode!==result.aside){
      const reference=result.aside.querySelector('#overview-map-explanation');
      result.aside.insertBefore(selection,reference||null);
    }
  };
  moveControls();
  setTimeout(moveControls,250);
}

function arrangeRealMaps(){
  const configs=[
    {page:'page-centrality',panel:'#centrality-grid .real-map-panel',explain:'centrality-map-explanation',extras:['#centrality-grid .real-map-summary','#centrality-grid .real-map-note']},
    {page:'page-density',panel:'.real-map-panel',explain:'density-map-explanation',extras:['.real-map-note']},
    {page:'page-maturation',panel:'.real-map-panel',explain:'maturation-map-explanation',extras:['.real-map-note']},
    {page:'page-environment',panel:'.real-map-panel',explain:'environment-map-explanation',extras:['#environment-real-note']}
  ];
  configs.forEach(cfg=>{
    const page=document.getElementById(cfg.page);
    const explanation=document.getElementById(cfg.explain);
    const panel=page&&page.querySelector(cfg.panel);
    if(!page||!panel||!explanation)return;
    const nodes=[panel];
    (cfg.extras||[]).forEach(sel=>{const n=page.querySelector(sel);if(n&&!nodes.includes(n))nodes.push(n);});
    makeLayout(nodes,explanation,`${cfg.page.replace('page-','')}-map-layout`);
  });
}

const populationNotes={
  popChart:{title:'Compare the size of each GN division',copy:'The bar chart ranks GN divisions by total residents. <strong>Dehiwala East is the largest</strong>, while Malwatta has the smallest total population.'},
  popDonutChart:{title:'Read each division’s share of the study population',copy:'The donut chart shows proportional contribution rather than absolute size. Larger slices indicate divisions carrying a greater share of Dehiwala’s service and infrastructure demand.'},
  genderGroupChart:{title:'Compare male and female totals directly',copy:'Paired bars reveal the absolute gender difference in every GN division. The overall population has a <strong>slight female majority</strong>.'},
  genderPctChart:{title:'Compare gender balance independent of GN size',copy:'Percentages make small and large GN divisions comparable. Values close to 50% indicate a balanced composition; wider differences may affect targeted community services.'},
  genderPieChart:{title:'Understand the overall gender composition',copy:'Across all nine GN divisions, females account for approximately <strong>51.4%</strong> and males 48.6% of the total population.'},
  ageGroupChart:{title:'Identify the dominant life-stage groups',copy:'Switch between total, male and female views to understand the combined age structure. This supports planning for schools, employment, healthcare and elderly services.'},
  popPyramidChart:{title:'Read population ageing and cohort balance',copy:'The pyramid compares male and female populations by age. Broad working-age bands indicate labour-force strength, while the upper bands show future ageing and care requirements.'},
  ageStructureChart:{title:'Compare dependency and working-age structure by GN',copy:'This chart separates youth, working-age and elderly residents. GN divisions with higher dependent-age shares may require stronger education, health and social-support provision.'},
  popDensityChart:{title:'Compare relative settlement concentration',copy:'Higher values indicate more people concentrated within a GN division. Density should be interpreted together with roads, land use, open space and infrastructure capacity.'}
};
function addPopulationDescriptions(){
  Object.entries(populationNotes).forEach(([id,note])=>{
    const canvas=document.getElementById(id); if(!canvas)return;
    const panel=canvas.closest('.panel'); if(!panel||panel.querySelector('.population-chart-description'))return;
    const desc=document.createElement('div');
    desc.className='population-chart-description';
    desc.innerHTML=`<div class="pcd-block"><div class="pcd-label">What this chart shows</div><div class="pcd-title">${note.title}</div></div><div class="pcd-block"><div class="pcd-label">Interpretation</div><div class="pcd-copy">${note.copy}</div></div>`;
    panel.appendChild(desc);
  });
}

function refitMaps(){
  setTimeout(()=>{
    ['centrality-real-map','density-real-map','maturation-real-map','environment-real-map','landuse-real-map','leaflet-map'].forEach(id=>{
      const el=document.getElementById(id);
      if(el && el._leaflet_id && window.L){
        // Leaflet maps are already managed by their page scripts; resize event triggers invalidateSize hooks.
        window.dispatchEvent(new Event('resize'));
      }
    });
  },180);
}

function run(){
  arrangeOverview();
  arrangeRealMaps();
  addPopulationDescriptions();
  refitMaps();
}

document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0));
})();
