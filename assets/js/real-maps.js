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
const palettesLight={
  centrality:{
    b:['#1e3a5f','#2563a6','#38a3c7','#f59e42','#c93b4b'],
    c:['#5b2c83','#6b5db5','#4b8fb4','#38a889','#c5ad35']
  },
  indices:{
    fsi:['#dbeafe','#93c5fd','#3b82f6','#0ea5e9','#0f766e'],
    gsi:['#dcfce7','#86efac','#22c55e','#15803d','#14532d'],
    osr:['#fee2e2','#fca5a5','#fb923c','#84cc16','#15803d'],
    umi:['#ede9fe','#c4b5fd','#8b5cf6','#c026d3','#be123c'],
    entropy:['#cffafe','#67e8f9','#14b8a6','#84cc16','#d97706']
  }
};
const activePalette=(group,key)=>document.documentElement.classList.contains('light')?palettesLight[group][key]:palettes[group][key];
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

function formatScaleDistance(metres){
  return metres>=1000?`${Number((metres/1000).toFixed(metres>=10000?0:1))} km`:`${Math.round(metres)} m`;
}
function niceScaleDistance(value){
  const power=Math.pow(10,Math.floor(Math.log10(Math.max(value,1))));
  const fraction=value/power;
  const nice=fraction>=5?5:fraction>=2?2:1;
  return nice*power;
}
function addProfessionalScaleBar(map,position='bottomleft'){
  const ScaleControl=L.Control.extend({
    options:{position},
    onAdd(){
      const el=L.DomUtil.create('div','pro-map-scale-control premium-map-scale');
      el.innerHTML='<div class="premium-scale-kicker">GROUND DISTANCE</div><div class="premium-scale-ruler"><i class="premium-scale-cap left"></i><div class="premium-scale-segments"><span></span><span></span><span></span><span></span></div><i class="premium-scale-cap right"></i></div><div class="premium-scale-values"><span>0</span><span class="premium-scale-mid">—</span><span class="premium-scale-full">—</span></div>';
      const ruler=el.querySelector('.premium-scale-ruler');
      const mid=el.querySelector('.premium-scale-mid');
      const full=el.querySelector('.premium-scale-full');
      const update=()=>{
        const maxPixels=126;
        const y=Math.max(1,map.getSize().y/2);
        const metres=map.distance(map.containerPointToLatLng([0,y]),map.containerPointToLatLng([maxPixels,y]));
        const chosen=niceScaleDistance(metres);
        const px=Math.max(72,Math.min(maxPixels,maxPixels*(chosen/metres)));
        ruler.style.width=`${px}px`;
        mid.textContent=formatScaleDistance(chosen/2);
        full.textContent=formatScaleDistance(chosen);
      };
      map.on('zoomend moveend resize',update);
      setTimeout(update,0);
      L.DomEvent.disableClickPropagation(el);
      return el;
    }
  });
  return new ScaleControl().addTo(map);
}
function addProfessionalNorthArrow(map,position='topright'){
  const NorthControl=L.Control.extend({
    options:{position},
    onAdd(){
      const el=L.DomUtil.create('div','pro-north-control premium-north-control');
      el.setAttribute('aria-label','North arrow');
      el.innerHTML='<div class="premium-compass"><span class="premium-compass-n">N</span><svg viewBox="0 0 72 94" aria-hidden="true"><circle class="premium-ring-outer" cx="36" cy="51" r="27"></circle><circle class="premium-ring-inner" cx="36" cy="51" r="20"></circle><path class="premium-arrow-north" d="M36 6 L49 52 L36 43 L23 52 Z"></path><path class="premium-arrow-south" d="M36 88 L23 52 L36 59 L49 52 Z"></path><circle class="premium-compass-centre" cx="36" cy="52" r="4"></circle></svg><span class="premium-compass-caption">TRUE NORTH</span></div>';
      L.DomEvent.disableClickPropagation(el);
      return el;
    }
  });
  return new NorthControl().addTo(map);
}
async function getJSON(url){
  if(cache.has(url)) return cache.get(url);
  const promise=fetch(url).then(r=>{if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);return r.json();});
  cache.set(url,promise); return promise;
}
const binaryCache=new Map();
async function getBinary(url){
  if(binaryCache.has(url))return binaryCache.get(url);
  const promise=fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.arrayBuffer();});
  binaryCache.set(url,promise);return promise;
}
function parseCentralityBinary(buffer){
  const dv=new DataView(buffer);let o=0;
  if(dv.getUint8(o++)!==67||dv.getUint8(o++)!==69||dv.getUint8(o++)!==78||dv.getUint8(o++)!==49)throw new Error('Invalid centrality data');
  const scale=dv.getUint32(o,true);o+=4;
  const classCount=dv.getUint8(o++);const classes=[];
  let south=Infinity,west=Infinity,north=-Infinity,east=-Infinity;
  for(let ci=0;ci<classCount;ci++){
    const cls=dv.getUint8(o++);const min=dv.getFloat64(o,true);o+=8;const max=dv.getFloat64(o,true);o+=8;
    const count=dv.getUint32(o,true);o+=4;const lineCount=dv.getUint32(o,true);o+=4;
    const lines=new Array(lineCount);
    for(let li=0;li<lineCount;li++){
      const pointCount=dv.getUint16(o,true);o+=2;const line=new Array(pointCount);
      for(let pi=0;pi<pointCount;pi++){
        const lat=dv.getInt32(o,true)/scale;o+=4;const lng=dv.getInt32(o,true)/scale;o+=4;
        if(lat<south)south=lat;if(lat>north)north=lat;if(lng<west)west=lng;if(lng>east)east=lng;
        line[pi]=[lat,lng];
      }
      lines[li]=line;
    }
    classes.push({class:cls,min,max,count,lines});
  }
  return{classes,bounds:[[south,west],[north,east]]};
}
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const idleRun=(fn,timeout=1200)=>window.requestIdleCallback?requestIdleCallback(fn,{timeout}):setTimeout(fn,Math.min(timeout,350));
function allowBackgroundPreload(){
  if(window.matchMedia('(max-width:700px)').matches)return false;
  const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  return !(c&&(c.saveData||/2g/.test(c.effectiveType||'')));
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
    <button class="real-map-tool real-map-interact active" type="button" aria-pressed="true" title="Pause or resume map interaction"><span class="real-map-tool-icon">☝</span><span class="real-map-tool-label">Interact</span></button>
    <button class="real-map-tool real-map-fullscreen" type="button" title="Open map in fullscreen"><span class="real-map-tool-icon">⛶</span><span class="real-map-tool-label">Full</span></button>`;
  panel.appendChild(tools);

  tools.querySelector('.real-map-fit').addEventListener('click',()=>{
    if(map.__analysisBounds && map.__analysisBounds.isValid()){
      const centrality=id==='centrality-real-map';
      stableFitBounds(map,map.__analysisBounds,{padding:centrality?26:24,maxZoom:centrality?14:15,tightness:(centrality ? 0.08 : 0.04)});
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
  const interactBtn=tools.querySelector('.real-map-interact');
  interactBtn.addEventListener('click',()=>{
    const enable=!map.dragging.enabled();
    ['dragging','touchZoom','doubleClickZoom','boxZoom'].forEach(name=>{
      if(map[name]) enable?map[name].enable():map[name].disable();
    });
    interactBtn.classList.toggle('active',enable);
    interactBtn.setAttribute('aria-pressed',String(enable));
  });
  const refitAfterFullscreen=()=>{
    let selectorFull=false;
    if(panel.matches){
      try{ selectorFull=panel.matches(':fullscreen') || panel.matches(':-webkit-full-screen'); }
      catch(_err){ selectorFull=false; }
    }
    const isFull=document.fullscreenElement===panel ||
      document.webkitFullscreenElement===panel || selectorFull;
    const centrality=id==='centrality-real-map';

    /* Class and inline-size fallback make fullscreen reliable even when
       viewport-fit.css has higher-specificity ID rules with !important. */
    panel.classList.toggle('map-is-fullscreen',Boolean(isFull));
    if(isFull){
      canvas.style.setProperty('width','100dvw','important');
      canvas.style.setProperty('height','100dvh','important');
      canvas.style.setProperty('min-height','0','important');
      canvas.style.setProperty('max-height','none','important');
    }else{
      ['width','height','min-height','max-height'].forEach(prop=>canvas.style.removeProperty(prop));
    }

    const apply=()=>{
      map.invalidateSize({pan:false,animate:false});
      if(map.__analysisBounds && map.__analysisBounds.isValid()){
        stableFitBounds(map,map.__analysisBounds,{
          maxZoom:centrality?14:15,
          padding:isFull?(centrality?42:36):(centrality?26:24),
          tightness:centrality?0.08:0.04
        });
      }
    };
    requestAnimationFrame(()=>requestAnimationFrame(apply));
    [80,220,520,900].forEach(delay=>setTimeout(apply,delay));
  };
  tools.querySelector('.real-map-fullscreen').addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement===panel || document.webkitFullscreenElement===panel){
        if(document.exitFullscreen) await document.exitFullscreen();
        else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
      }else if(panel.requestFullscreen){
        await panel.requestFullscreen();
      }else if(panel.webkitRequestFullscreen){
        panel.webkitRequestFullscreen();
      }
    }catch(err){console.warn('Fullscreen unavailable',err);}
  });
  document.addEventListener('fullscreenchange',refitAfterFullscreen);
  document.addEventListener('webkitfullscreenchange',refitAfterFullscreen);
}
function baseMap(id){
  const compact=window.matchMedia('(max-width:600px)').matches;
  const sharedRenderer=L.canvas({padding:compact ? .16 : .32});
  const map=L.map(id,{preferCanvas:true,zoomControl:true,minZoom:9,maxZoom:20,scrollWheelZoom:true,dragging:true,touchZoom:true,doubleClickZoom:true,boxZoom:true,renderer:sharedRenderer});
  map.__analysisRenderer=sharedRenderer;
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
  addProfessionalNorthArrow(map,'topright');
  addProfessionalScaleBar(map,'bottomleft');
  attachMapUtilities(map,id);
  return map;
}
function stableFitBounds(map,bounds,{maxZoom=15,padding=30,tightness=0}={}){
  if(!bounds||!bounds.isValid())return;
  map.__analysisBounds=bounds;
  const targetBounds=(tightness>0&&typeof bounds.pad==='function')?bounds.pad(-tightness):bounds;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    map.invalidateSize({pan:false,animate:false});
    const size=map.getSize();
    if(size.x>0&&size.y>0)map.fitBounds(targetBounds,{padding:[padding,padding],maxZoom,animate:false});
  }));
}
function fit(map,layer,options={}){const b=layer.getBounds();if(b&&b.isValid())stableFitBounds(map,b,options);}
function popupRows(title,rows){return `<div class="real-popup-title">${title}</div>${rows.map(([a,b])=>`<div class="real-popup-row"><span>${a}</span><b>${b}</b></div>`).join('')}`;}
function makeLegend(id,title,rows){const el=document.getElementById(id);if(!el)return;el.innerHTML=`<div class="real-map-legend-title">${title}</div>${rows.map(r=>`<div class="real-map-legend-row"><span class="real-map-legend-swatch" style="background:${r.color}"></span><span>${r.label}</span></div>`).join('')}`;}
function classFor(v,breaks){for(let i=0;i<breaks.length-1;i++)if(v<=breaks[i+1])return i;return breaks.length-2;}

let centralityState={metric:'b',radius:'500',meta:null,map:null,layer:null,renderedKey:null,initPromise:null,updateToken:0,parsed:new Map()};
const centralityNames={b:'Betweenness (movement potential)',c:'Closeness (network accessibility)'};
const centralityKeys=['b500','b2000','b5000','c500','c2000','c5000'];
const centralityURL=key=>`assets/data/centrality/${key}.bin`;
async function loadCentralityDataset(key){
  if(centralityState.parsed.has(key))return centralityState.parsed.get(key);
  const parsed=parseCentralityBinary(await getBinary(centralityURL(key)));
  centralityState.parsed.set(key,parsed);
  while(centralityState.parsed.size>2){
    const oldest=centralityState.parsed.keys().next().value;
    if(oldest===key)break;
    centralityState.parsed.delete(oldest);
  }
  return parsed;
}
function preloadCentrality(key){return Promise.allSettled([getJSON('assets/data/centrality_meta.json'),getBinary(centralityURL(key))]);}
function scheduleCentralityPreload(activeKey){
  if(!allowBackgroundPreload())return;
  const queue=centralityKeys.filter(k=>k!==activeKey);let index=0;
  const step=()=>{if(index>=queue.length)return;getBinary(centralityURL(queue[index++])).finally(()=>idleRun(step,1800));};
  idleRun(step,1800);
}
function centralityLineStyle(cls,metric){
  const palette=activePalette('centrality',metric);
  return{color:palette[cls],weight:0.72+(cls*.24),opacity:.9,lineCap:'round',lineJoin:'round'};
}
async function initCentrality(){
  if(!centralityState.map){
    centralityState.map=baseMap('centrality-real-map');maps.centrality=centralityState.map;
    centralityState.map.setView([6.853,79.869],13);
  }
  const wanted=centralityState.metric+centralityState.radius;
  if(centralityState.layer&&centralityState.renderedKey===wanted){
    requestAnimationFrame(()=>centralityState.map.invalidateSize({pan:false}));
    return centralityState;
  }
  if(centralityState.initPromise){
    await centralityState.initPromise;
    if(centralityState.renderedKey===centralityState.metric+centralityState.radius)return centralityState;
  }
  centralityState.initPromise=(async()=>{
    if(!centralityState.meta)centralityState.meta=await getJSON('assets/data/centrality_meta.json');
    await updateCentrality(true);
    window._centralityBuilt=true;
    return centralityState;
  })().finally(()=>{centralityState.initPromise=null;});
  return centralityState.initPromise;
}
async function updateCentrality(first=false){
  const s=centralityState;if(!s.map)return;
  const key=s.metric+s.radius;const token=++s.updateToken;
  status('centrality-real-status',`Loading ${s.radius} m ${s.metric==='b'?'betweenness':'closeness'} network…`);
  try{
    if(!s.meta)s.meta=await getJSON('assets/data/centrality_meta.json');
    const dataset=await loadCentralityDataset(key);if(token!==s.updateToken)return;
    status('centrality-real-status','Rendering street network…');
    if(s.layer)s.map.removeLayer(s.layer);
    const group=L.featureGroup();const metric=s.metric;const radius=s.radius;
    const renderer=s.map.__analysisRenderer||s.map.options.renderer;
    for(const item of dataset.classes){
      await nextFrame();if(token!==s.updateToken)return;
      const layer=L.polyline(item.lines,{renderer,...centralityLineStyle(item.class,metric)});
      layer.__centralityClass=item.class;
      layer.bindPopup(popupRows(`${centralityNames[metric]} · ${radius} m`,[['Class',`${item.class+1} of 5`],['Value range',`${formatNumber(item.min)} – ${formatNumber(item.max)}`],['Street segments',formatNumber(item.count,0)]]));
      layer.on({mouseover:e=>e.target.setStyle({weight:Math.min(2.8,1.15+(item.class*.32)),opacity:1}),mouseout:e=>e.target.setStyle(centralityLineStyle(item.class,metric))});
      group.addLayer(layer);
    }
    if(token!==s.updateToken)return;
    group.addTo(s.map);s.layer=group;s.renderedKey=key;
    const bounds=L.latLngBounds(dataset.bounds[0],dataset.bounds[1]);
    stableFitBounds(s.map,bounds,{maxZoom:14,padding:26,tightness:0.08});
    const breaks=s.meta[key].breaks;const palette=activePalette('centrality',metric);
    makeLegend('centrality-real-legend',`${centralityNames[metric]} · ${radius} m`,palette.map((c,i)=>({color:c,label:`${formatNumber(breaks[i])} – ${formatNumber(breaks[i+1])}`})));
    const active=document.getElementById('centrality-active-layer');if(active)active.textContent=`${centralityNames[metric]} at ${radius} m radius`;
    status('centrality-real-status','');scheduleCentralityPreload(key);
  }catch(err){status('centrality-real-status',`Could not load the centrality layer. (${err.message})`,true);}
}
window.buildCentralityGrid=function(scale){if(scale&&scale!=='all')centralityState.radius=scale;return initCentrality();};
function bindCentralityControls(){
  document.querySelectorAll('#centrality-metric-tabs .real-layer-btn').forEach(btn=>btn.addEventListener('click',async()=>{
    document.querySelectorAll('#centrality-metric-tabs .real-layer-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');centralityState.metric=btn.dataset.metric;
    await initCentrality();
  }));
  const scaleTabs=document.getElementById('scale-tabs');
  if(scaleTabs)scaleTabs.addEventListener('click',async e=>{
    const btn=e.target.closest('.scale-tab');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();
    document.querySelectorAll('#scale-tabs .scale-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');centralityState.radius=btn.dataset.scale;
    await initCentrality();
  },true);
}

const indicesState={data:null,meta:null};
async function loadIndices(){if(indicesState.data)return indicesState;const [data,meta]=await Promise.all([getJSON('assets/data/urban_indices.geojson'),getJSON('assets/data/indices_meta.json')]);indicesState.data=data;indicesState.meta=meta;return indicesState;}
function indexTitle(metric){return {fsi:'Floor Space Index',gsi:'Ground Space Index',osr:'Open Space Ratio',umi:'Urban Maturation Index',entropy:'Shannon Entropy'}[metric]||metric;}
async function initIndexMap(which){
  const cfg=which==='density'?{id:'density-real-map',status:'density-real-status',legend:'density-real-legend',metric:'fsi'}:{id:'maturation-real-map',status:'maturation-real-status',legend:'maturation-real-legend',metric:'umi'};
  if(layers[which]&&layers[which].ready){requestAnimationFrame(()=>maps[which].invalidateSize({pan:false}));return layers[which];}
  if(layers[which]&&layers[which].loadPromise)return layers[which].loadPromise;
  const map=maps[which]||baseMap(cfg.id);maps[which]=map;if(!map.__analysisBounds)map.setView([6.853,79.869],13);
  const state=layers[which]||{map,metric:cfg.metric,meta:null,layer:null,legend:cfg.legend,ready:false,loadPromise:null};layers[which]=state;
  status(cfg.status,'Loading analytical grid…');
  state.loadPromise=(async()=>{
    try{
      const {data,meta}=await loadIndices();state.meta=meta;await nextFrame();
      state.layer=L.geoJSON(data,{renderer:map.__analysisRenderer||map.options.renderer,style:f=>indexStyle(state,f),onEachFeature:(f,l)=>{
        l.bindPopup(()=>popupRows(`Grid cell ${formatNumber(f.properties.id,0)}`,[['FSI',formatNumber(f.properties.fsi,3)],['GSI',formatNumber(f.properties.gsi,3)],['OSR',formatNumber(f.properties.osr,3)],['Entropy',formatNumber(f.properties.entropy,3)],['UMI',formatNumber(f.properties.umi,3)],['Dominant land use',f.properties.landuse||'—']]));
        l.on({mouseover:e=>e.target.setStyle({weight:1.4,color:'#ffffff',fillOpacity:.88}),mouseout:e=>state.layer.resetStyle(e.target)});
      }}).addTo(map);
      fit(map,state.layer,{maxZoom:15,padding:24,tightness:0.04});renderIndexLegend(state);state.ready=true;status(cfg.status,'');return state;
    }catch(err){status(cfg.status,`Could not load the analytical grid layer. (${err.message})`,true);throw err;}
    finally{state.loadPromise=null;}
  })();
  return state.loadPromise;
}
function indexStyle(state,f){
  const br=state.meta[state.metric].breaks;
  const cls=classFor(Number(f.properties[state.metric]),br);
  const palette=activePalette('indices',state.metric);
  const light=document.documentElement.classList.contains('light');
  return{fillColor:palette[cls],fillOpacity:(light ? 0.82 : 0.78),color:light?'rgba(30,41,59,.42)':'rgba(255,255,255,.45)',weight:(light ? 0.5 : 0.42)};
}
function renderIndexLegend(state){
  const br=state.meta[state.metric].breaks;
  const palette=activePalette('indices',state.metric);
  makeLegend(state.legend,indexTitle(state.metric),palette.map((c,i)=>({color:c,label:`${formatNumber(br[i],3)} – ${formatNumber(br[i+1],3)}`})));
}
function switchIndex(which,metric){const state=layers[which];if(!state)return;state.metric=metric;state.layer.setStyle(f=>indexStyle(state,f));renderIndexLegend(state);document.getElementById(`${which}-active-layer`).textContent=indexTitle(metric);}
function bindIndexControls(){
  document.querySelectorAll('#density-layer-tabs .real-layer-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('#density-layer-tabs .real-layer-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');switchIndex('density',btn.dataset.metric);}));
  document.querySelectorAll('#maturation-layer-tabs .real-layer-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('#maturation-layer-tabs .real-layer-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');switchIndex('maturation',btn.dataset.metric);}));
}

const environmentState={map:null,landuseData:null,elevationData:null,uhiData:null,landuseLayer:null,elevationLayer:null,uhiLayer:null,mode:'uhi',elevationBounds:null,uhiBounds:null,landuseBounds:null,initPromise:null,landusePromise:null,clickBound:false};
function rasterValueAt(data,latlng){
  if(!data)return null;
  const south=data.bounds[0][0],west=data.bounds[0][1],north=data.bounds[1][0],east=data.bounds[1][1];
  if(latlng.lat<south||latlng.lat>north||latlng.lng<west||latlng.lng>east)return null;
  const col=Math.min(data.width-1,Math.max(0,Math.floor((latlng.lng-west)/(east-west)*data.width)));
  const row=Math.min(data.height-1,Math.max(0,Math.floor((north-latlng.lat)/(north-south)*data.height)));
  const value=data.values[row*data.width+col];return value===null||value===undefined?null:Number(value);
}
function renderElevationLegend(){
  const legend=document.getElementById('landuse-real-legend');if(legend)legend.classList.remove('landuse-full-legend');
  const e=environmentState.elevationData;const rows=e.colors.map((color,i)=>({color,label:`${formatNumber(e.breaks[i],0)} – ${formatNumber(e.breaks[i+1],0)} m`}));
  makeLegend('landuse-real-legend','Elevation above mean sea level',rows);
}
function renderUhiLegend(){
  const legend=document.getElementById('landuse-real-legend');if(legend)legend.classList.remove('landuse-full-legend');
  const u=environmentState.uhiData;const rows=u.colors.map((color,i)=>({color,label:`${formatNumber(u.breaks[i],1)} – ${formatNumber(u.breaks[i+1],1)} °C`}));
  makeLegend('landuse-real-legend','Urban heat / surface temperature',rows);
}
function renderLanduseLegend(){
  const legend=document.getElementById('landuse-real-legend');if(legend)legend.classList.add('landuse-full-legend');
  const cats=[...new Set(environmentState.landuseData.features.map(f=>f.properties.main||'Other'))].sort();
  makeLegend('landuse-real-legend','Land-use categories',cats.map(c=>({color:landuseColors[c]||landuseColors.Other,label:c})));
}
function setEnvironmentSummary(mode){
  const summary=document.getElementById('environment-summary');if(!summary)return;
  if(mode==='landuse'){summary.style.display='none';return;}summary.style.display='grid';
  if(mode==='uhi'){
    const u=environmentState.uhiData;summary.innerHTML=`<div class="real-map-summary-card"><b>${formatNumber(u.min,1)}°C</b><span>Minimum heat value</span></div><div class="real-map-summary-card"><b>${formatNumber(u.mean,1)}°C</b><span>Mean heat value</span></div><div class="real-map-summary-card"><b>${formatNumber(u.max,1)}°C</b><span>Maximum heat value</span></div><div class="real-map-summary-card"><b>30 m</b><span>Source cell size</span></div>`;
  }else summary.innerHTML='<div class="real-map-summary-card"><b>−2 m</b><span>Minimum elevation</span></div><div class="real-map-summary-card"><b>12.7 m</b><span>Mean elevation</span></div><div class="real-map-summary-card"><b>36 m</b><span>Maximum elevation</span></div><div class="real-map-summary-card"><b>12.5 m</b><span>DEM cell size</span></div>';
}
async function ensureLanduseLayer(){
  const s=environmentState;if(s.landuseLayer)return s.landuseLayer;if(s.landusePromise)return s.landusePromise;
  s.landusePromise=(async()=>{
    const landuse=await getJSON('assets/data/landuse.geojson');s.landuseData=landuse;await nextFrame();
    let layer;
    layer=L.geoJSON(landuse,{renderer:s.map.__analysisRenderer||s.map.options.renderer,style:f=>{const light=document.documentElement.classList.contains('light');return{fillColor:landuseColors[f.properties.main]||landuseColors.Other,fillOpacity:light?.78:.84,color:light?'rgba(30,41,59,.55)':'rgba(15,23,42,.62)',weight:light?.85:.7}},onEachFeature:(f,l)=>{
      l.bindPopup(()=>popupRows(f.properties.main||'Land use',[['Sub-class',f.properties.sub||'—'],['Domain',f.properties.domain||'—'],['Recorded area',formatNumber(f.properties.area,2)]]));
      l.on({mouseover:e=>e.target.setStyle({weight:2,color:'#ffffff',fillOpacity:.96}),mouseout:e=>layer.resetStyle(e.target)});
    }});
    s.landuseLayer=layer;s.landuseBounds=layer.getBounds();return layer;
  })().finally(()=>{s.landusePromise=null;});
  return s.landusePromise;
}
async function switchEnvironmentLayer(mode,{fitLayer=true}={}){
  const s=environmentState;if(!s.map)return;s.mode=mode;
  if(mode==='landuse'&&!s.landuseLayer){status('landuse-real-status','Loading land-use polygons…');try{await ensureLanduseLayer();}catch(err){status('landuse-real-status',`Could not load land use. (${err.message})`,true);return;}}
  [s.landuseLayer,s.elevationLayer,s.uhiLayer].forEach(layer=>{if(layer&&s.map.hasLayer(layer))s.map.removeLayer(layer);});s.map.closePopup();
  const active=document.getElementById('environment-active-layer');const note=document.getElementById('environment-real-note');
  document.querySelectorAll('#environment-layer-tabs .real-layer-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.metric===mode));
  if(mode==='uhi'){
    s.uhiLayer.addTo(s.map);renderUhiLegend();if(active)active.textContent='Urban heat surface';if(note)note.innerHTML='<strong>Urban Heat layer:</strong> colourised from the uploaded Dehiwala UHI GeoTIFF. Click inside the raster to read temperature values in degrees Celsius.';setEnvironmentSummary('uhi');if(fitLayer)stableFitBounds(s.map,s.uhiBounds,{maxZoom:16,padding:24,tightness:.02});
  }else if(mode==='elevation'){
    s.elevationLayer.addTo(s.map);renderElevationLegend();if(active)active.textContent='Elevation & hillshade';if(note)note.innerHTML='<strong>Elevation layer:</strong> colourised and hillshaded from the uploaded Dehiwala DEM GeoTIFF. Click inside the terrain surface to read elevation in metres.';setEnvironmentSummary('elevation');if(fitLayer)stableFitBounds(s.map,s.elevationBounds,{maxZoom:15,padding:24,tightness:.02});
  }else{
    s.landuseLayer.addTo(s.map);renderLanduseLegend();if(active)active.textContent='Land-use polygons';if(note)note.innerHTML='<strong>Land-use layer:</strong> 704 original polygons and attributes loaded from the Landuse GeoPackage. Click a polygon to inspect its category and recorded area.';setEnvironmentSummary('landuse');if(fitLayer)stableFitBounds(s.map,s.landuseBounds,{maxZoom:15,padding:24,tightness:.04});
  }
  status('landuse-real-status','');
}
async function initEnvironment(){
  const s=environmentState;
  if(!s.map){s.map=baseMap('landuse-real-map');maps.landuse=s.map;s.map.setView([6.853,79.869],13);}
  if(s.uhiLayer){requestAnimationFrame(()=>{s.map.invalidateSize({pan:false});switchEnvironmentLayer(s.mode,{fitLayer:true});});return s;}
  if(s.initPromise)return s.initPromise;
  status('landuse-real-status','Loading environmental surfaces…');
  s.initPromise=(async()=>{
    const [elevation,uhi]=await Promise.all([getJSON('assets/data/elevation_grid.json'),getJSON('assets/data/uhi_grid.json')]);
    s.elevationData=elevation;s.uhiData=uhi;s.elevationBounds=L.latLngBounds(elevation.bounds[0],elevation.bounds[1]);s.uhiBounds=L.latLngBounds(uhi.bounds[0],uhi.bounds[1]);
    s.elevationLayer=L.imageOverlay('assets/images/dehiwala_elevation_hillshade.png',s.elevationBounds,{opacity:.9,interactive:false,crossOrigin:true});
    s.uhiLayer=L.imageOverlay('assets/images/dehiwala_uhi_surface.png?v=6',s.uhiBounds,{opacity:.94,interactive:false,crossOrigin:true,className:'uhi-raster-overlay'});
    if(!s.clickBound){
      s.map.on('click',e=>{
        if(s.mode==='elevation'){const value=rasterValueAt(s.elevationData,e.latlng);if(value===null)return;L.popup({maxWidth:230}).setLatLng(e.latlng).setContent(popupRows('DEM elevation',[['Elevation',`${formatNumber(value,1)} m`],['Latitude',formatNumber(e.latlng.lat,5)],['Longitude',formatNumber(e.latlng.lng,5)],['Cell size','12.5 m']])).openOn(s.map);}
        else if(s.mode==='uhi'){const value=rasterValueAt(s.uhiData,e.latlng);if(value===null)return;L.popup({maxWidth:240}).setLatLng(e.latlng).setContent(popupRows('Urban Heat raster',[['Temperature',`${formatNumber(value,1)} °C`],['Latitude',formatNumber(e.latlng.lat,5)],['Longitude',formatNumber(e.latlng.lng,5)],['Source resolution','30 m']])).openOn(s.map);}
      });s.clickBound=true;
    }
    await switchEnvironmentLayer(s.mode,{fitLayer:true});
    if(allowBackgroundPreload())idleRun(()=>ensureLanduseLayer().catch(()=>{}),1600);return s;
  })().catch(err=>{status('landuse-real-status',`Could not load the environmental layers. (${err.message})`,true);throw err;}).finally(()=>{s.initPromise=null;});
  return s.initPromise;
}
function bindEnvironmentControls(){
  document.querySelectorAll('#environment-layer-tabs .real-layer-btn').forEach(btn=>btn.addEventListener('click',()=>switchEnvironmentLayer(btn.dataset.metric,{fitLayer:true})));
}

function refreshThematicStyles(){
  if(centralityState.layer){
    centralityState.layer.eachLayer(layer=>layer.setStyle(centralityLineStyle(layer.__centralityClass,centralityState.metric)));
    const palette=activePalette('centrality',centralityState.metric);
    const key=centralityState.metric+centralityState.radius;
    const br=centralityState.meta&&centralityState.meta[key]&&centralityState.meta[key].breaks;
    if(br)makeLegend('centrality-real-legend',`${centralityNames[centralityState.metric]} · ${centralityState.radius} m`,palette.map((c,i)=>({color:c,label:`${formatNumber(br[i])} – ${formatNumber(br[i+1])}`})));
  }
  ['density','maturation'].forEach(name=>{
    const state=layers[name];
    if(state&&state.layer){state.layer.setStyle(f=>indexStyle(state,f));renderIndexLegend(state);}
  });
  if(environmentState.landuseLayer){
    environmentState.landuseLayer.setStyle(f=>{const light=document.documentElement.classList.contains('light');return{fillColor:landuseColors[f.properties.main]||landuseColors.Other,fillOpacity:(light ? 0.78 : 0.84),color:light?'rgba(30,41,59,.55)':'rgba(15,23,42,.62)',weight:(light ? 0.85 : 0.7)}});
    if(environmentState.mode==='landuse')renderLanduseLegend();
  }
}
window.__refreshRealMapThemes=refreshThematicStyles;

/* Global GN focus layer used by the professional cross-filter workspace. */
const gnFocusData={
  'Dehiwala East':[6.856035,79.869243,.52],'Dehiwala West':[6.858160,79.861970,.59],
  'Galwala':[6.863200,79.866500,.31],'Jayathilaka':[6.853500,79.864800,.22],
  'Karagampitiya':[6.849200,79.874500,.25],'Kawdana West':[6.845800,79.869000,.35],
  'Malwatta':[6.854200,79.873800,.38],'Mount Lavinia':[6.844500,79.865000,.80],
  'Udyanaya':[6.855963,79.875015,.53]
};
const gnFocusLayers={};
window.__focusGNOnRealMaps=function(name,{zoom=false}={}){
  Object.entries(maps).forEach(([key,map])=>{
    if(gnFocusLayers[key]){gnFocusLayers[key].forEach(l=>map.removeLayer(l));delete gnFocusLayers[key];}
    const d=gnFocusData[name];if(!d)return;
    const marker=L.circleMarker([d[0],d[1]],{radius:9,color:'#ffffff',weight:3,fillColor:'#00d8b4',fillOpacity:.95,pane:'markerPane'}).bindTooltip(`<b>${name}</b><br>Global GN focus`,{direction:'top'});
    const halo=L.circle([d[0],d[1]],{radius:Math.max(170,Math.sqrt(d[2])*430),color:'#00d8b4',weight:2,opacity:.9,fillColor:'#00d8b4',fillOpacity:.08,dashArray:'7,5',interactive:false});
    halo.addTo(map);marker.addTo(map);gnFocusLayers[key]=[halo,marker];
    if(zoom)map.flyTo([d[0],d[1]],Math.max(map.getZoom(),15),{duration:.55});
  });
};
window.__realMaps=maps;


function preloadForPage(page){
  if(page==='centrality')return preloadCentrality(centralityState.metric+centralityState.radius);
  if(page==='density'||page==='maturation')return loadIndices();
  if(page==='environment')return Promise.allSettled([getJSON('assets/data/elevation_grid.json'),getJSON('assets/data/uhi_grid.json')]);
  return Promise.resolve();
}
function initForPage(page){
  let job;
  if(page==='centrality')job=initCentrality();
  if(page==='density')job=initIndexMap('density');
  if(page==='maturation')job=initIndexMap('maturation');
  if(page==='environment')job=initEnvironment();
  Promise.resolve(job).catch(()=>{}).finally(()=>requestAnimationFrame(()=>{
    const name=page==='environment'?'landuse':page;const map=maps[name];
    if(map){
      map.invalidateSize({pan:false});
      if(map.__analysisBounds)stableFitBounds(map,map.__analysisBounds,{maxZoom:name==='centrality'?14:15,padding:name==='centrality'?26:24,tightness:name==='centrality'?0.08:0.04});
    }
  }));
}
function bindNavigation(){
  document.querySelectorAll('.nav-item').forEach(item=>{
    const page=item.dataset.page;
    const warm=()=>{preloadForPage(page).catch(()=>{});};
    if(allowBackgroundPreload()){
      item.addEventListener('pointerenter',warm,{passive:true});
      item.addEventListener('focusin',warm);
    }
    item.addEventListener('click',()=>requestAnimationFrame(()=>initForPage(page)));
  });
  const resizeVisibleMaps=()=>Object.values(maps).forEach(map=>{
    const container=map.getContainer();
    if(container&&container.offsetParent!==null)map.invalidateSize({pan:false});
  });
  window.__resizeActiveRealMap=()=>requestAnimationFrame(resizeVisibleMaps);
  window.addEventListener('resize',()=>requestAnimationFrame(resizeVisibleMaps));
  if(allowBackgroundPreload()){idleRun(()=>preloadCentrality('b500').catch(()=>{}),700);idleRun(()=>loadIndices().catch(()=>{}),1500);idleRun(()=>Promise.allSettled([getJSON('assets/data/elevation_grid.json'),getJSON('assets/data/uhi_grid.json')]),2200);}
}

document.addEventListener('DOMContentLoaded',()=>{bindCentralityControls();bindIndexControls();bindEnvironmentControls();bindNavigation();});
})();
