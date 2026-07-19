(function(){
'use strict';

function card(label,title,copy,accent='var(--cyan)',extra=''){
  return `<article class="map-explain-card" style="--explain-accent:${accent}" ${extra}><div class="map-explain-label">${label}</div><div class="map-explain-title">${title}</div><div class="map-explain-copy">${copy}</div></article>`;
}
function placeAfter(anchor,element){
  if(!anchor||!anchor.parentNode)return;
  anchor.parentNode.insertBefore(element,anchor.nextSibling);
}
function createGrid(id,html){
  if(document.getElementById(id))return null;
  const grid=document.createElement('div');grid.id=id;grid.className='map-explain-grid';grid.innerHTML=html;return grid;
}

function buildDescriptions(){
  const overviewAnchor=document.querySelector('#page-overview .map-wrap');
  const overview=createGrid('overview-map-explanation',
    card('What the map shows','Street hierarchy and GN population context','Road colours distinguish <strong>trunk, secondary, tertiary and local streets</strong>. GN markers are classified by population density, helping compare settlement pressure with the movement network.','var(--cyan)')+
    card('How to interact','Search, select and inspect','Choose a GN division from the map finder, click a marker to pin its profile, hover over streets for road attributes, toggle layers, locate yourself, reset the extent or open fullscreen.','var(--green)')+
    card('Planning interpretation','Read access and development pressure together','Dense GN divisions beside higher-order roads may experience stronger development pressure, traffic conflict and service demand. Lower-density areas can indicate open-space, institutional or lower-intensity residential conditions.','var(--amber)')
  ); if(overview)placeAfter(overviewAnchor,overview);

  const centralityAnchor=document.querySelector('#page-centrality .real-map-note');
  const centrality=createGrid('centrality-map-explanation',
    card('Metric','Betweenness and closeness','<strong>Betweenness</strong> estimates route-choice or movement potential. <strong>Closeness</strong> represents how efficiently a street reaches the rest of the network.','var(--red)')+
    card('Scale','500 m, 2000 m and 5000 m','The 500 m radius reflects local walkable structure; 2000 m shows neighbourhood connections; 5000 m reveals regional corridor importance.','var(--cyan)')+
    card('Planning use','Prioritise streets by network role','High betweenness streets may require traffic management and public-realm protection. High closeness streets are strong candidates for accessible services, transit support and pedestrian investment.','var(--green)')
  ); if(centrality)placeAfter(centralityAnchor,centrality);

  const densityAnchor=document.querySelector('#page-density .real-map-note');
  const density=createGrid('density-map-explanation',
    card('FSI','Vertical development intensity','Floor Space Index compares total floor area with plot area. Higher values indicate more built floor space and potentially taller or more intensive development.','#35a6b4')+
    card('GSI and OSR','Footprint and open-space balance','Ground Space Index measures site coverage. Open Space Ratio indicates open space relative to floor space; low OSR alongside high FSI/GSI signals a compact built environment.','#78b963')+
    card('Planning use','Find pressure and redevelopment zones','Click any grid cell to inspect all indicators together. Prioritise cells with high intensity and low open-space provision for shade, permeability, public-space and infrastructure improvements.','#dc796f')
  ); if(density)placeAfter(densityAnchor,density);

  const maturationAnchor=document.querySelector('#page-maturation .real-map-note');
  const maturation=createGrid('maturation-map-explanation',
    card('UMI','Composite urban maturity','The Urban Maturation Index combines normalized morphology, density and land-use indicators. Higher values suggest a more consolidated urban structure.','#aa5b9b')+
    card('Entropy','Land-use diversity','Shannon entropy increases where land uses are more evenly mixed and falls where one use dominates. High diversity can support shorter trips and active street life.','#2d9488')+
    card('Planning use','Match intervention to maturity','Use UMI and entropy together: mature but low-diversity cells may need functional diversification, while mixed but low-maturity areas may require infrastructure and public-realm upgrades.','#e3b44c')
  ); if(maturation)placeAfter(maturationAnchor,maturation);

  const environmentAnchor=document.querySelector('#page-environment #environment-real-note');
  const environment=createGrid('environment-map-explanation',
    card('Urban Heat surface','Spatial thermal intensity','The uploaded UHI raster displays temperature values from approximately <strong>31.5°C to 42.6°C</strong>. Click the surface to query the value of an individual raster cell.','#e34a33','data-env-card="uhi"')+
    card('How to read heat','Near-black purple to amber','The scientific Inferno ramp moves from near-black purple through magenta and red to amber, producing strong thermal contrast without introducing misleading green tones. Compare these hotspots with dense built form, roads, land use and limited vegetation.','#f98e09','data-env-card="uhi"')+
    card('Planning use','Target heat-mitigation investment','Prioritise the hottest pedestrian routes and built-up areas for shade trees, cool roofs, reflective paving, ventilation corridors and connected green infrastructure.','#f7e225','data-env-card="uhi"')+
    card('Elevation surface','Terrain height and relief','The colourised DEM and hillshade reveal low-lying ground, local ridges and drainage gradients. Click the terrain to query elevation in metres.','#2c7fb8','data-env-card="elevation"')+
    card('How to read elevation','Cool lowlands to warm high ground','Lower elevations may be more sensitive to water accumulation and coastal or pluvial flooding. Relative high ground can influence runoff direction and evacuation planning.','#7fcdbb','data-env-card="elevation"')+
    card('Planning use','Support drainage and risk-sensitive design','Combine terrain with land use, built density and drainage information to identify retention areas, flow paths and locations needing resilient access.','#fdae61','data-env-card="elevation"')+
    card('Land-use polygons','Existing urban functions','Each polygon represents the mapped land-use category and its attributes. Click a parcel to inspect its main class, sub-class, domain and recorded area.','#7B2CBF','data-env-card="landuse"')+
    card('How to read land use','Distinct colours for urban functions','Residential, commercial, institutional, transport, public space, water and other uses use separate colours so concentrations and transitions are easy to identify.','#E76F51','data-env-card="landuse"')+
    card('Planning use','Identify compatibility and opportunity','Use the pattern to locate mixed-use nodes, public-space gaps, incompatible adjacencies, redevelopment areas and opportunities for connected green or civic infrastructure.','#2A9D8F','data-env-card="landuse"')
  ); if(environment){environment.dataset.mode='uhi';placeAfter(environmentAnchor,environment);}

  document.querySelectorAll('#environment-layer-tabs .real-layer-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const grid=document.getElementById('environment-map-explanation');if(grid)grid.dataset.mode=btn.dataset.metric;
  }));
}

function updateChartTheme(){
  if(typeof Chart==='undefined')return;
  const light=document.documentElement.classList.contains('light');
  const text=light?'#475569':'#8892a4';
  const muted=light?'#64748b':'#566070';
  const grid=light?'rgba(15,23,42,.08)':'rgba(255,255,255,.04)';
  Chart.defaults.color=text;
  Chart.defaults.borderColor=grid;
  const instances=Chart.instances ? Object.values(Chart.instances) : [];
  instances.forEach(chart=>{
    const opts=chart.options||{};
    if(opts.plugins&&opts.plugins.legend&&opts.plugins.legend.labels)opts.plugins.legend.labels.color=text;
    if(opts.scales){
      Object.values(opts.scales).forEach(scale=>{
        if(scale.ticks)scale.ticks.color=muted;
        if(scale.grid)scale.grid.color=grid;
        if(scale.title)scale.title.color=muted;
      });
    }
    try{chart.update('none');}catch(e){chart.update();}
  });
}

function updateThemeDependentMaps(){
  if(typeof window.__refreshRealMapThemes==='function')window.__refreshRealMapThemes();
  setTimeout(updateChartTheme,80);
}

document.addEventListener('DOMContentLoaded',()=>{
  buildDescriptions();
  updateChartTheme();
  const toggle=document.getElementById('theme-toggle');
  if(toggle)toggle.addEventListener('click',()=>setTimeout(updateThemeDependentMaps,120));
});
})();
