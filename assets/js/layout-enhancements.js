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
  const mapWrap=page&&page.querySelector('.map-wrap');
  const mapTitle=[...page.querySelectorAll('.section-title')].find(el=>el.textContent.includes('Interactive Study Area Map'));
  const mapHeader=mapTitle&&mapTitle.closest('.section-header');
  const weatherTs=document.getElementById('weather-ts');
  const liveHeader=weatherTs&&weatherTs.closest('.section-header');
  if(!page||!mapWrap||!mapHeader||!liveHeader)return;

  const mapColumn=mapHeader.parentElement;
  const liveColumn=liveHeader.parentElement;
  let primary=[...page.querySelectorAll(':scope > .two-col')].find(el=>el.contains(mapHeader)||el.contains(liveHeader));
  if(!primary){
    primary=document.createElement('div');
    primary.className='two-col mb20';
    mapColumn.parentNode.insertBefore(primary,mapColumn);
    primary.append(mapColumn,liveColumn);
  }

  /* Undo any old cached map-left/details-right transformation on Overview. */
  const oldLayout=page.querySelector('.overview-map-layout');
  if(oldLayout){
    const oldMain=oldLayout.querySelector('.map-detail-main');
    const oldAside=oldLayout.querySelector('.map-detail-aside');
    if(mapWrap.parentNode!==mapColumn)mapColumn.insertBefore(mapWrap,mapHeader.nextSibling);
    const explanation=oldAside&&oldAside.querySelector('#overview-map-explanation');
    if(explanation)mapColumn.insertBefore(explanation,mapWrap.nextSibling);
    oldLayout.remove();
  }else if(mapWrap.parentNode!==mapColumn){
    mapColumn.insertBefore(mapWrap,mapHeader.nextSibling);
  }

  /* Restore Leaflet controls that an older cached script may have moved. */
  const explorer=document.querySelector('.overview-map-explorer');
  const leafletCorner=mapWrap.querySelector('.leaflet-top.leaflet-left');
  if(explorer&&leafletCorner&&explorer.parentNode!==leafletCorner)leafletCorner.appendChild(explorer);
  const selection=document.getElementById('overview-selection-card');
  if(selection&&selection.parentNode!==mapWrap)mapWrap.appendChild(selection);

  primary.classList.remove('overview-main-stack');
  primary.classList.add('overview-primary-grid');
  if(mapColumn.parentNode!==primary)primary.prepend(mapColumn);
  if(liveColumn.parentNode!==primary)primary.appendChild(liveColumn);

  setTimeout(()=>{
    window.dispatchEvent(new Event('resize'));
    if(window.__overviewMap){
      window.__overviewMap.invalidateSize({pan:false});
      if(window.__fitOverviewMap)window.__fitOverviewMap(0);
    }
  },180);
}


function addOverviewLiveSnapshot(){
  const page=document.getElementById('page-overview');
  const weatherTs=document.getElementById('weather-ts');
  const liveColumn=weatherTs&&weatherTs.closest('.section-header')&&weatherTs.closest('.section-header').parentElement;
  if(!page||!liveColumn||liveColumn.querySelector('.overview-live-snapshot'))return;

  liveColumn.classList.add('overview-live-column');
  const panel=document.createElement('section');
  panel.className='overview-live-snapshot panel';
  panel.innerHTML=`
    <div class="overview-live-snapshot-head">
      <div><div class="overview-live-kicker">LIVE PLANNING SNAPSHOT</div><div class="overview-live-title">Current urban-comfort signals</div></div>
      <span class="overview-live-status"><i></i> Auto-updated</span>
    </div>
    <div class="overview-live-insight-grid">
      <div class="overview-live-insight thermal"><span>Thermal comfort</span><b id="ov-live-thermal">Loading…</b><small id="ov-live-thermal-note">Reading apparent temperature</small></div>
      <div class="overview-live-insight air"><span>Air quality</span><b id="ov-live-air">Loading…</b><small id="ov-live-air-note">Reading AQI and PM2.5</small></div>
      <div class="overview-live-insight weather"><span>Outdoor conditions</span><b id="ov-live-weather">Loading…</b><small id="ov-live-weather-note">Reading rain, wind and humidity</small></div>
    </div>`;
  liveColumn.appendChild(panel);

  const number=id=>{const el=document.getElementById(id);const v=el&&parseFloat(el.textContent);return Number.isFinite(v)?v:null;};
  const update=()=>{
    const feels=number('w-feels'),aqi=number('w-aqi'),pm=number('w-pm25'),rain=number('w-rain'),wind=number('w-wind'),hum=number('w-hum');
    const thermal=document.getElementById('ov-live-thermal');
    const thermalNote=document.getElementById('ov-live-thermal-note');
    if(feels!==null){
      const label=feels>=38?'High heat stress':feels>=32?'Warm / caution':feels>=27?'Moderately warm':'Comfortable';
      thermal.textContent=`${label} · ${feels.toFixed(1)}°C`;
      thermalNote.textContent=feels>=32?'Prioritise shade, hydration and cooler walking routes.':'Conditions are comparatively manageable for outdoor activity.';
    }
    const air=document.getElementById('ov-live-air');
    const airNote=document.getElementById('ov-live-air-note');
    if(aqi!==null){
      const label=aqi<=20?'Good':aqi<=40?'Fair':aqi<=60?'Moderate':aqi<=80?'Poor':'Very poor';
      air.textContent=`${label} · AQI ${Math.round(aqi)}`;
      airNote.textContent=pm!==null?`PM2.5 currently ${pm.toFixed(1)} µg/m³.`:'Air-quality monitoring is active.';
    }
    const weather=document.getElementById('ov-live-weather');
    const weatherNote=document.getElementById('ov-live-weather-note');
    if(rain!==null&&wind!==null){
      weather.textContent=rain>0.2?`Rain ${rain.toFixed(1)} mm`:`Dry · wind ${wind.toFixed(1)} km/h`;
      weatherNote.textContent=hum!==null?`Humidity ${Math.round(hum)}%; consider pedestrian exposure and ventilation.`:'Outdoor conditions are being monitored.';
    }
  };
  update();
  ['w-feels','w-aqi','w-pm25','w-rain','w-wind','w-hum'].forEach(id=>{
    const el=document.getElementById(id);if(el)new MutationObserver(update).observe(el,{childList:true,characterData:true,subtree:true});
  });
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
  addOverviewLiveSnapshot();
  arrangeRealMaps();
  addPopulationDescriptions();
  refitMaps();
}

document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0));
})();
