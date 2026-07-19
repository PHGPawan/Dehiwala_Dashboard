/* Real interactive spatial layers for GitHub Pages */
(function(){
'use strict';
const cache = new Map();
const maps = {};
const layers = {};
const palettes = {
  centrality:{
    // Movement potential: deep blue through gold to strong red.
    b:['#17365d','#2c6fa3','#66a9c9','#f0b44d','#b8323c'],
    // Accessibility: plum through indigo and teal to lime-gold.
    c:['#3b1f5f','#59489a','#437fa3','#45a889','#c3b83f']
  },
  indices:{
    // FSI: built-floor intensity, navy to luminous cyan.
    fsi:['#102a43','#174f78','#1f78a8','#35a6b4','#75d5c8'],
    // GSI: ground coverage, forest green to warm yellow-green.
    gsi:['#12372a','#1c6645','#37935d','#78b963','#c9d85a'],
    // OSR: constrained/open-space transition, brick red to emerald.
    osr:['#7f1d2d','#c04a2b','#e9a23b','#7eb852','#157347'],
    // UMI: maturity progression, midnight violet to coral.
    umi:['#25164d','#4b3484','#7454ad','#aa5b9b','#dc796f'],
    // Entropy: diversity progression, dark teal to warm gold.
    entropy:['#073b4c','#116b76','#2d9488','#8cbf72','#e3b44c']
  }
};
const landuseColors={
  'Residential':'#E76F51',
  'Commercial':'#C1121F',
  'Transport':'#3A506B',
  'Water':'#168AAD',
  'Institutional':'#7B2CBF',
  'Public':'#2A9D8F',
  'Public Space':'#2A9D8F',
  'Open Space':'#52B788',
  'Industrial':'#6D597A',
  'Agriculture':'#7CB342',
  'Barren Land':'#C2A878',
  'Cultural':'#F4A261',
  'Under Construction':'#FFB703',
  'Coastal area':'#00A6A6',
  'Other':'#94A3B8',
  'Mixed':'#D97706'
};
const formatNumber=(v,d=2)=>Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{maximumFractionDigits:d}):'—';
async function getJSON(url){
  if(cache.has(url)) return cache.get(url);
  const promise=fetch(url).then(r=>{if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);return r.json();});
  cache.set(url,promise); return promise;
}
function status(id,msg,error=false){
  const el=document.getElementById(id); if(!el)return;
  if(!msg){el.classList.add('done');return;}
  el.classList.remove('done'); el.classList.toggle('error',error);
  el.innerHTML=error?msg:`<span class="real-map-spinner"></span>${msg}`;
}
function attachMapUtilities(map,id){
  const canvas=document.getElementById(id);
  const panel=canvas && canvas.closest('.real-map-panel');
  if(!panel || panel.dataset.toolsReady==='1') return;
  panel.dataset.toolsReady='1';
  const legend=panel.querySelector('.real-map-legend');

  const tools=document.createElement('div');
  tools.className='real-map-utility';
  tools.setAttribute('aria-label','Map display controls');
  tools.innerHTML=`
    <button class="real-map-tool real-map-fit" type="button" title="Fit the complete layer"><span class="real-map-tool-icon">⌖</span><span class="real-map-tool-label">Fit</span></button>
    <button class="real-map-tool real-map-legend-toggle active" type="button" aria-expanded="true" title="Show or hide the legend"><span class="real-map-tool-icon">▤</span><span class="real-map-tool-label">Legend</span></button>
    <button class="real-map-tool real-map-wheel active" type="button" aria-pressed="true" title="Enable or disable mouse-wheel zoom"><span class="real-map-tool-icon">↕</span><span class="real-map-tool-label">Wheel</span></button>
    <button class="real-map-tool real-map-interact" type="button" title="Enable map pan and zoom on touch screens"><span class="real-map-tool-icon">☝</span><span class="real-map-tool-label">Interact</span></button>
    <button class="real-map-tool real-map-fullscreen" type="button" title="Open map in fullscreen"><span class="real-map-tool-icon">⛶</span><span class="real-map-tool-label">Full</span></button>`;
  panel.appendChild(tools);

  const hint=document.createElement('div');
  hint.className='real-map-scroll-hint';
  hint.textContent=window.matchMedia('(max-width:600px)').matches?'Legend visible · tap ☝ to interact':'Mouse-wheel zoom enabled · use Wheel to release page scrolling';
  panel.appendChild(hint);

  tools.querySelector('.real-map-fit').addEventListener('click',()=>{
    if(map.__analysisBounds && map.__analysisBounds.isValid()){
      const centrality=id==='centrality-real-map';
      stableFitBounds(map,map.__analysisBounds,{padding:centrality?44:30,maxZoom:centrality?13:15});
    }
  });
  const legendBtn=tools.querySelector('.real-map-legend-toggle');
  legendBtn.addEventListener('click',()=>{
    if(!legend)return;
    const opening=legend.classList.contains('is-collapsed');
    legend.classList.toggle('is-collapsed',!opening);
    legendBtn.classList.toggle('active',opening);
    legendBtn.setAttribute('aria-expanded',String(opening));
  });
  const wheelBtn=tools.querySelector('.real-map-wheel');
  wheelBtn.addEventListener('click',()=>{
    const enable=!map.scrollWheelZoom.enabled();
    enable?map.scrollWheelZoom.enable():map.scrollWheelZoom.disable();
    wheelBtn.classList.toggle('active',enable);
    wheelBtn.setAttribute('aria-pressed',String(enable));
    hint.textContent=enable?'Mouse-wheel zoom enabled · use Wheel to release page scrolling':'Mouse-wheel scrolls the page · click Wheel to enable zoom';
  });
  const interactBtn=tools.querySelector('.real-map-interact');
  interactBtn.addEventListener('click',()=>{
    const enable=!map.dragging.enabled();
    ['dragging','touchZoom','doubleClickZoom','boxZoom'].forEach(name=>{
      if(map[name]) enable?map[name].enable():map[name].disable();
    });
    interactBtn.classList.toggle('active',enable);
    hint.textContent=enable?'Map interaction enabled · tap ☝ again to release':'Page scroll enabled · tap ☝ to interact';
  });
  tools.querySelector('.real-map-fullscreen').addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement===panel) await document.exitFullscreen();
      else await panel.requestFullscreen();
    }catch(err){console.warn('Fullscreen unavailable',err);}
  });
  document.addEventListener('fullscreenchange',()=>setTimeout(()=>map.invalidateSize(),120));
}
function baseMap(id){
  const compact=window.matchMedia('(max-width:600px)').matches;
  const map=L.map(id,{preferCanvas:true,zoomControl:true,minZoom:9,maxZoom:20,scrollWheelZoom:true,dragging:!compact,touchZoom:!compact,doubleClickZoom:!compact,boxZoom:!compact,renderer:L.canvas({padding:.5})});
  const professionalBase=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:16,maxZoom:20,attribution:'Tiles © Esri'});
  const professionalLabels=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:16,maxZoom:20,attribution:'Labels © Esri'});
  const professional=L.layerGroup([professionalBase,professionalLabels]);
  const light=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'});
  const osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap contributors'});
  const dark=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'});
  const centralityDefault=id==='centrality-real-map';
  (centralityDefault?dark:professional).addTo(map);
  const canvas=document.getElementById(id);
  if(canvas)canvas.classList.toggle('real-map-dark-default',centralityDefault);
  L.control.layers({'Dark':dark,'Professional Gray':professional,'Professional Light':light,'Street':osm},null,{collapsed:true,position:'topleft'}).addTo(map);
  attachMapUtilities(map,id);
  return map;
}
function stableFitBounds(map,bounds,{maxZoom=15,padding=30}={}){
  if(!bounds||!bounds.isValid())return;
  map.__analysisBounds=bounds;
  const apply=()=>{
    map.invalidateSize({pan:false,animate:false});
    map.fitBounds(bounds,{padding:[padding,padding],maxZoom,animate:false});
  };
  requestAnimationFrame(()=>requestAnimationFrame(apply));
  setTimeout(apply,180);
}
function fit(map,layer,options={}){const b=layer.getBounds();if(b&&b.isValid())stableFitBounds(map,b,options);}
function popupRows(title,rows){return `<div class="real-popup-title">${title}</div>${rows.map(([a,b])=>`<div class="real-popup-row"><span>${a}</span><b>${b}</b></div>`).join('')}`;}
function makeLegend(id,title,rows){const el=document.getElementById(id);if(!el)return;el.innerHTML=`<div class="real-map-legend-title">${title}</div>${rows.map(r=>`<div class="real-map-legend-row"><span class="real-map-legend-swatch" style="background:${r.color}"></span><span>${r.label}</span></div>`).join('')}`;}
function classFor(v,breaks){for(let i=0;i<breaks.length-1;i++)if(v<=breaks[i+1])return i;return breaks.length-2;}

let centralityState={metric:'b',radius:'500',data:null,meta:null,map:null,layer:null};
const centralityNames={b:'Betweenness (movement potential)',c:'Closeness (network accessibility)'};
async function initCentrality(){
  if(centralityState.map){
    setTimeout(()=>{
      centralityState.map.invalidateSize({pan:false});
      if(centralityState.map.__analysisBounds) stableFitBounds(centralityState.map,centralityState.map.__analysisBounds,{maxZoom:13,padding:44});
    },120);
    return;
  }
  status('centrality-real-status','Loading 37,148 street segments…');
  try{
    const [data,meta]=await Promise.all([getJSON('assets/data/centrality_classes.geojson'),getJSON('assets/data/centrality_meta.json')]);
    centralityState.data=data; centralityState.meta=meta;
    centralityState.map=baseMap('centrality-real-map'); maps.centrality=centralityState.map;
    updateCentrality(true); status('centrality-real-status','');
  }catch(err){status('centrality-real-status',`Could not load the centrality layer. Open the dashboard through GitHub Pages rather than directly from the file system. (${err.message})`,true);}
}
function updateCentrality(first=false){
  const s=centralityState;if(!s.map||!s.data)return;
  const key=s.metric+s.radius; if(s.layer)s.map.removeLayer(s.layer);
  const selected={type:'FeatureCollection',features:s.data.features.filter(f=>f.properties.metric===key)};
  const metricPalette=palettes.centrality[s.metric];
  s.layer=L.geoJSON(selected,{renderer:L.canvas({padding:.5}),style:f=>({
    color:metricPalette[f.properties.class],
    weight:1.25+(f.properties.class*.48),
    opacity:.9,
    lineCap:'round',lineJoin:'round'
  }),onEachFeature:(f,l)=>{
    const p=f.properties;
    l.bindPopup(popupRows(`${centralityNames[s.metric]} · ${s.radius} m`,[['Class',`${p.class+1} of 5`],['Value range',`${formatNumber(p.min)} – ${formatNumber(p.max)}`],['Street segments',formatNumber(p.count,0)]]));
    l.on({
      mouseover:e=>e.target.setStyle({weight:Math.min(5.2,2.2+(p.class*.6)),opacity:1}),
      mouseout:e=>s.layer.resetStyle(e.target)
    });
  }}).addTo(s.map);
  const activeBounds=s.layer.getBounds();
  if(activeBounds&&activeBounds.isValid())stableFitBounds(s.map,activeBounds,{maxZoom:13,padding:44});
  const br=s.meta[key].breaks;
  makeLegend('centrality-real-legend',`${centralityNames[s.metric]} · ${s.radius} m`,metricPalette.map((c,i)=>({color:c,label:`${formatNumber(br[i])} – ${formatNumber(br[i+1])}`})));
  document.getElementById('centrality-active-layer').textContent=`${centralityNames[s.metric]} at ${s.radius} m radius`;
  setTimeout(()=>{
    s.map.invalidateSize({pan:false});
    if(s.map.__analysisBounds) stableFitBounds(s.map,s.map.__analysisBounds,{maxZoom:13,padding:44});
  },100);
}
window.buildCentralityGrid=function(scale){if(scale&&scale!=='all')centralityState.radius=scale;initCentrality().then(()=>updateCentrality(false));};
function bindCentralityControls(){
  document.querySelectorAll('#centrality-metric-tabs .real-layer-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('#centrality-metric-tabs .real-layer-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');centralityState.metric=btn.dataset.metric;updateCentrality(false);}));
  const scale=document.getElementById('scale-tabs');if(scale)scale.addEventListener('click',e=>{const btn=e.target.closest('.scale-tab');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();document.querySelectorAll('#scale-tabs .scale-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');centralityState.radius=btn.dataset.scale;initCentrality().then(()=>updateCentrality(false));},true);
}

const indicesState={data:null,meta:null};
async function loadIndices(){if(indicesState.data)return indicesState;const [data,meta]=await Promise.all([getJSON('assets/data/urban_indices.geojson'),getJSON('assets/data/indices_meta.json')]);indicesState.data=data;indicesState.meta=meta;return indicesState;}
function indexTitle(metric){return {fsi:'Floor Space Index',gsi:'Ground Space Index',osr:'Open Space Ratio',umi:'Urban Maturation Index',entropy:'Shannon Entropy'}[metric]||metric;}
async function initIndexMap(which){
  const cfg=which==='density'?{id:'density-real-map',status:'density-real-status',legend:'density-real-legend',metric:'fsi'}:{id:'maturation-real-map',status:'maturation-real-status',legend:'maturation-real-legend',metric:'umi'};
  if(maps[which]){setTimeout(()=>maps[which].invalidateSize(),100);return;}
  status(cfg.status,'Loading 1,617 analytical grid cells…');
  try{
    const {data,meta}=await loadIndices();
    const map=baseMap(cfg.id);maps[which]=map;
    const state={map,metric:cfg.metric,meta,layer:null,legend:cfg.legend};layers[which]=state;
    state.layer=L.geoJSON(data,{renderer:L.canvas({padding:.5}),style:f=>indexStyle(state,f),onEachFeature:(f,l)=>{
      l.bindPopup(popupRows(`Grid cell ${formatNumber(f.properties.id,0)}`,[['FSI',formatNumber(f.properties.fsi,3)],['GSI',formatNumber(f.properties.gsi,3)],['OSR',formatNumber(f.properties.osr,3)],['Entropy',formatNumber(f.properties.entropy,3)],['UMI',formatNumber(f.properties.umi,3)],['Dominant land use',f.properties.landuse||'—']]));
      l.on({
        mouseover:e=>e.target.setStyle({weight:1.4,color:'#ffffff',fillOpacity:.88}),
        mouseout:e=>state.layer.resetStyle(e.target)
      });
    }}).addTo(map);
    fit(map,state.layer,{maxZoom:15,padding:32});renderIndexLegend(state);status(cfg.status,'');
  }catch(err){status(cfg.status,`Could not load the analytical grid layer. (${err.message})`,true);}
}
function indexStyle(state,f){
  const br=state.meta[state.metric].breaks;
  const cls=classFor(Number(f.properties[state.metric]),br);
  const palette=palettes.indices[state.metric];
  return{fillColor:palette[cls],fillOpacity:.78,color:'rgba(255,255,255,.45)',weight:.42};
}
function renderIndexLegend(state){
  const br=state.meta[state.metric].breaks;
  const palette=palettes.indices[state.metric];
  makeLegend(state.legend,indexTitle(state.metric),palette.map((c,i)=>({color:c,label:`${formatNumber(br[i],3)} – ${formatNumber(br[i+1],3)}`})));
}
function switchIndex(which,metric){const state=layers[which];if(!state)return;state.metric=metric;state.layer.setStyle(f=>indexStyle(state,f));renderIndexLegend(state);document.getElementById(`${which}-active-layer`).textContent=indexTitle(metric);}
function bindIndexControls(){
  document.querySelectorAll('#density-layer-tabs .real-layer-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('#density-layer-tabs .real-layer-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');switchIndex('density',btn.dataset.metric);}));
  document.querySelectorAll('#maturation-layer-tabs .real-layer-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('#maturation-layer-tabs .real-layer-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');switchIndex('maturation',btn.dataset.metric);}));
}

async function initLanduse(){
  if(maps.landuse){setTimeout(()=>maps.landuse.invalidateSize(),100);return;}
  status('landuse-real-status','Loading 704 land-use polygons…');
  try{
    const data=await getJSON('assets/data/landuse.geojson');const map=baseMap('landuse-real-map');maps.landuse=map;
    const cats=[...new Set(data.features.map(f=>f.properties.main||'Other'))].sort();
    const layer=L.geoJSON(data,{renderer:L.canvas({padding:.5}),style:f=>({fillColor:landuseColors[f.properties.main]||landuseColors.Other,fillOpacity:.84,color:'rgba(15,23,42,.62)',weight:.7}),onEachFeature:(f,l)=>{
      l.bindPopup(popupRows(f.properties.main||'Land use',[['Sub-class',f.properties.sub||'—'],['Domain',f.properties.domain||'—'],['Recorded area',formatNumber(f.properties.area,2)]]));
      l.on({
        mouseover:e=>e.target.setStyle({weight:2,color:'#ffffff',fillOpacity:.96}),
        mouseout:e=>layer.resetStyle(e.target)
      });
    }}).addTo(map);
    fit(map,layer,{maxZoom:15,padding:32});makeLegend('landuse-real-legend','Land-use categories',cats.map(c=>({color:landuseColors[c]||landuseColors.Other,label:c})));status('landuse-real-status','');
  }catch(err){status('landuse-real-status',`Could not load the land-use layer. (${err.message})`,true);}
}

function initForPage(page){
  if(page==='centrality')initCentrality();
  if(page==='density')initIndexMap('density');
  if(page==='maturation')initIndexMap('maturation');
  if(page==='environment')initLanduse();
  setTimeout(()=>{
    Object.entries(maps).forEach(([name,m])=>{
      m.invalidateSize({pan:false});
      if(m.__analysisBounds){
        const centrality=name==='centrality';
        stableFitBounds(m,m.__analysisBounds,{maxZoom:centrality?13:15,padding:centrality?44:32});
      }
    });
  },360);
}
function bindNavigation(){document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click',()=>setTimeout(()=>initForPage(item.dataset.page),340)));window.addEventListener('resize',()=>Object.values(maps).forEach(m=>m.invalidateSize()));}

document.addEventListener('DOMContentLoaded',()=>{bindCentralityControls();bindIndexControls();bindNavigation();});
})();
