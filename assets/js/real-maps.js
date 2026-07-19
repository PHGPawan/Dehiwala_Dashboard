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
  'Residential':'#d77991','Commercial':'#c7445d','Transport':'#566573','Water':'#2878b5',
  'Institutional':'#6558c7','Public':'#3d9853','Public Space':'#3d9853','Open Space':'#6aae45',
  'Industrial':'#87479d','Agriculture':'#91b847','Barren Land':'#b68b52','Cultural':'#9a68bd',
  'Under Construction':'#d88732','Coastal area':'#269b9a','Other':'#94a3b8','Mixed':'#d99a32'
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
function baseMap(id){
  const map=L.map(id,{preferCanvas:true,zoomControl:true,minZoom:11,maxZoom:20,renderer:L.canvas({padding:.5})});
  const light=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'});
  const osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap contributors'});
  const dark=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'});
  light.addTo(map);
  L.control.layers({'Professional Light':light,'Street':osm,'Dark':dark},null,{collapsed:true,position:'topleft'}).addTo(map);
  return map;
}
function fit(map,layer){const b=layer.getBounds();if(b&&b.isValid())map.fitBounds(b,{padding:[18,18]});}
function popupRows(title,rows){return `<div class="real-popup-title">${title}</div>${rows.map(([a,b])=>`<div class="real-popup-row"><span>${a}</span><b>${b}</b></div>`).join('')}`;}
function makeLegend(id,title,rows){const el=document.getElementById(id);if(!el)return;el.innerHTML=`<div class="real-map-legend-title">${title}</div>${rows.map(r=>`<div class="real-map-legend-row"><span class="real-map-legend-swatch" style="background:${r.color}"></span><span>${r.label}</span></div>`).join('')}`;}
function classFor(v,breaks){for(let i=0;i<breaks.length-1;i++)if(v<=breaks[i+1])return i;return breaks.length-2;}

let centralityState={metric:'b',radius:'500',data:null,meta:null,map:null,layer:null};
const centralityNames={b:'Betweenness (movement potential)',c:'Closeness (network accessibility)'};
async function initCentrality(){
  if(centralityState.map){setTimeout(()=>centralityState.map.invalidateSize(),120);return;}
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
  if(first)fit(s.map,s.layer);
  const br=s.meta[key].breaks;
  makeLegend('centrality-real-legend',`${centralityNames[s.metric]} · ${s.radius} m`,metricPalette.map((c,i)=>({color:c,label:`${formatNumber(br[i])} – ${formatNumber(br[i+1])}`})));
  document.getElementById('centrality-active-layer').textContent=`${centralityNames[s.metric]} at ${s.radius} m radius`;
  setTimeout(()=>s.map.invalidateSize(),80);
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
    fit(map,state.layer);renderIndexLegend(state);status(cfg.status,'');
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
    const layer=L.geoJSON(data,{renderer:L.canvas({padding:.5}),style:f=>({fillColor:landuseColors[f.properties.main]||landuseColors.Other,fillOpacity:.78,color:'rgba(255,255,255,.52)',weight:.55}),onEachFeature:(f,l)=>{
      l.bindPopup(popupRows(f.properties.main||'Land use',[['Sub-class',f.properties.sub||'—'],['Domain',f.properties.domain||'—'],['Recorded area',formatNumber(f.properties.area,2)]]));
      l.on({
        mouseover:e=>e.target.setStyle({weight:1.7,color:'#ffffff',fillOpacity:.92}),
        mouseout:e=>layer.resetStyle(e.target)
      });
    }}).addTo(map);
    fit(map,layer);makeLegend('landuse-real-legend','Land-use categories',cats.map(c=>({color:landuseColors[c]||landuseColors.Other,label:c})));status('landuse-real-status','');
  }catch(err){status('landuse-real-status',`Could not load the land-use layer. (${err.message})`,true);}
}

function initForPage(page){
  if(page==='centrality')initCentrality();
  if(page==='density')initIndexMap('density');
  if(page==='maturation')initIndexMap('maturation');
  if(page==='environment')initLanduse();
  setTimeout(()=>Object.values(maps).forEach(m=>m.invalidateSize()),260);
}
function bindNavigation(){document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click',()=>setTimeout(()=>initForPage(item.dataset.page),340)));window.addEventListener('resize',()=>Object.values(maps).forEach(m=>m.invalidateSize()));}

document.addEventListener('DOMContentLoaded',()=>{bindCentralityControls();bindIndexControls();bindNavigation();});
})();
