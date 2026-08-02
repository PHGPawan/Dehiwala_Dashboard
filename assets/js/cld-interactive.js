
(function(){
'use strict';
const nodeData={
  pop:{label:'Population Growth',type:'Urbanisation driver',loops:['drivers'],copy:'Population growth increases demand for land and development pressure within the Dehiwala urban system.',effect:'More people and activities increase demand for buildings, infrastructure and serviced land.',planning:'Coordinate growth with density controls, public transport capacity and minimum open-space requirements.'},
  demand:{label:'Demand for Land',type:'Urbanisation driver',loops:['drivers'],copy:'Rising land demand encourages redevelopment, infill and conversion to more intensive urban uses.',effect:'Higher land demand tends to expand or intensify the built-up area.',planning:'Direct growth toward suitable centres while protecting cooling corridors, public space and sensitive land.'},
  built:{label:'Built-up Area',type:'Urban morphology',loops:['drivers'],copy:'A larger built-up footprint increases hard surfaces and directly strengthens urban heat intensity.',effect:'Dense development can store heat, reduce airflow and reduce opportunities for vegetation.',planning:'Use plot controls, setbacks, connected open space and climate-sensitive redevelopment standards.'},
  impervious:{label:'Impervious Surfaces',type:'Leverage point 01',loops:['drivers'],copy:'Concrete, asphalt, roofs and paved surfaces absorb and store solar heat while limiting infiltration and evaporative cooling.',effect:'More impervious cover increases surface temperature and contributes to urban heat.',planning:'Replace selected hard surfaces with reflective, permeable or shaded alternatives; prioritise the hottest built-up locations.'},
  surface:{label:'Surface Temperature',type:'Thermal condition',loops:['drivers','b2'],copy:'Surface temperature is the immediate thermal expression of solar absorption, urban materials and shading conditions.',effect:'Higher surface temperatures increase the intensity of the urban heat problem.',planning:'Combine cool materials, shade, canopy and lower heat-storage surfaces.'},
  uhi:{label:'Urban Heat Intensity',type:'Core system problem',loops:['r1','r2','b1','b2','drivers'],copy:'Urban heat intensity is the central outcome produced by development form, surface materials, mobility emissions and limited natural cooling.',effect:'It triggers thermal discomfort and behavioural responses while also attracting public and policy attention.',planning:'Act on several loops together: reduce heat storage, strengthen tree canopy, improve walking comfort and apply heat-responsive design.'},
  thermal:{label:'Thermal Discomfort',type:'R1 reinforcing loop',loops:['r1'],copy:'As urban heat rises, indoor and outdoor thermal discomfort increases.',effect:'Discomfort motivates greater use of mechanical cooling.',planning:'Improve passive cooling, shading, ventilation and cool public spaces to reduce reliance on air conditioning.'},
  ac:{label:'Air Conditioning Use',type:'R1 reinforcing loop',loops:['r1'],copy:'People respond to thermal discomfort by using more air conditioning.',effect:'Greater AC use raises electricity demand and transfers heat to the outdoor environment.',planning:'Promote passive design, efficient equipment and district-scale cooling strategies where appropriate.'},
  energy:{label:'Energy Consumption',type:'R1 reinforcing loop',loops:['r1'],copy:'Cooling demand increases electricity consumption during hot periods.',effect:'Energy use supports more waste heat and can increase peak-system pressure.',planning:'Reduce cooling loads through building retrofits, shade, insulation and efficient systems.'},
  waste:{label:'Waste Heat Emissions',type:'R1 reinforcing loop',loops:['r1'],copy:'Air-conditioning condensers, vehicles and other equipment release heat into surrounding streets and courtyards.',effect:'Additional waste heat feeds back into urban heat intensity.',planning:'Control equipment placement, improve ventilation and reduce avoidable cooling demand.'},
  walking:{label:'Walking Comfort',type:'R2 reinforcing loop',loops:['r2'],copy:'Hot streets reduce the physical comfort of walking and waiting outdoors.',effect:'Lower walking comfort discourages active travel.',planning:'Create shaded footpaths, tree-lined routes, sheltered crossings and cooler transit waiting areas.'},
  walkability:{label:'Walkability',type:'R2 reinforcing loop',loops:['r2'],copy:'Walkability depends on thermal comfort as well as continuity, safety and access.',effect:'When walkability falls, residents are more likely to rely on private vehicles.',planning:'Link shade and thermal-comfort improvements with pedestrian-network upgrades.'},
  vehicle:{label:'Private Vehicle Use',type:'R2 reinforcing loop',loops:['r2'],copy:'Lower walkability increases dependence on private motorised travel.',effect:'More vehicles add traffic volume, road heat and emissions.',planning:'Improve public transport access, walking conditions and demand management along the Galle Road corridor.'},
  congestion:{label:'Traffic Congestion',type:'R2 reinforcing loop',loops:['r2'],copy:'Concentrated vehicle movement creates congestion and longer idling times.',effect:'Congestion increases local heat and exhaust emissions in already constrained streets.',planning:'Prioritise public transport, junction management, safe walking and reduced through-traffic pressure.'},
  emissions:{label:'Vehicle Heat & Emissions',type:'R2 reinforcing loop',loops:['r2'],copy:'Engines, exhaust and heat-absorbing road surfaces add heat to the street environment.',effect:'Vehicle-related heat feeds back into urban heat intensity.',planning:'Reduce vehicle kilometres, support cleaner fleets and expand shaded low-traffic public space.'},
  awareness:{label:'Public Awareness & Concern',type:'B1 balancing loop',loops:['b1'],copy:'Increasing heat can raise awareness of health, comfort and environmental risks.',effect:'Concern creates support for urban greening and cooling programmes.',planning:'Use local heat evidence, community engagement and visible pilot projects to maintain support.'},
  greening:{label:'Urban Greening Programs',type:'B1 balancing loop',loops:['b1'],copy:'Tree planting, green-space improvement and maintenance programmes convert concern into physical action.',effect:'Greening programmes increase canopy and strengthen natural cooling.',planning:'Target major roads, schools, commercial areas and public spaces; protect existing vegetation.'},
  vegetation:{label:'Vegetation Cover',type:'Natural cooling asset',loops:['b1'],copy:'Vegetation reduces exposed hard surface and supports shade and evapotranspiration.',effect:'Heat pressure can reduce vegetation, while protected cover supports the balancing loop.',planning:'Prevent vegetation loss and connect fragmented green spaces into cooling corridors.'},
  canopy:{label:'Tree Canopy',type:'Leverage point 02',loops:['b1'],copy:'Tree canopy provides shade and supports evapotranspiration, directly improving thermal comfort.',effect:'More canopy strengthens natural cooling and lowers urban heat intensity.',planning:'Implement a connected urban tree planting and shaded streets programme with species and maintenance standards.'},
  evap:{label:'Evapotranspiration',type:'B1 balancing loop',loops:['b1'],copy:'Plants convert available water into latent cooling through evapotranspiration.',effect:'Stronger evapotranspiration reduces urban heat intensity.',planning:'Pair canopy expansion with healthy soil, infiltration and adequate water availability.'},
  policy:{label:'Policy Attention & Action',type:'B2 balancing loop',loops:['b2'],copy:'Visible heat impacts create pressure for local planning, design and investment responses.',effect:'Policy attention enables heat-responsive standards and implementation programmes.',planning:'Embed measurable heat mitigation requirements in plans, development controls and public projects.'},
  design:{label:'Heat-responsive Design',type:'B2 balancing loop',loops:['b2'],copy:'Heat-responsive design combines orientation, shade, ventilation, materials and landscape.',effect:'Better design increases adoption of cool roofs and lower-absorption surfaces.',planning:'Create design guidance and approval criteria tailored to dense mixed-use corridors.'},
  cool:{label:'Cool Materials & Roofs',type:'B2 balancing loop',loops:['b2'],copy:'Reflective roofs and lower-heat-storage materials absorb less solar energy.',effect:'Cool materials reduce heat absorption and surface-temperature pressure.',planning:'Prioritise municipal buildings, large roofs, parking areas and redevelopment sites for early implementation.'},
  absorption:{label:'Heat Absorption',type:'B2 balancing loop',loops:['b2'],copy:'Heat absorption is controlled by material colour, reflectance, thermal mass and exposure.',effect:'Reduced absorption lowers surface temperature, weakening the urban heat pathway.',planning:'Use material performance standards and shade to reduce absorbed heat at source.'}
};
const loopData={
  all:{title:'Complete urban heat system',type:'SYSTEM OVERVIEW',copy:'The complete CLD combines urbanisation pressure with two reinforcing loops and two balancing loops.',effect:'Built form, cooling demand and traffic can intensify heat; greening and policy responses can counteract it.',planning:'Use multiple coordinated interventions rather than treating urban heat as a single land-cover problem.'},
  drivers:{title:'Urbanisation pressure chain',type:'EXTERNAL DRIVER CHAIN',copy:'Population growth and land demand expand the built-up area and impervious surface cover.',effect:'This chain increases surface temperature and directly raises urban heat intensity.',planning:'Manage the location, form and material performance of new development.'},
  r1:{title:'R1 · Heat Trap Loop',type:'REINFORCING LOOP',copy:'Urban heat increases thermal discomfort, which increases air-conditioning use, energy consumption and waste heat.',effect:'The additional waste heat increases urban heat again, causing the loop to strengthen itself over time.',planning:'Reduce cooling demand through passive design, shade, efficient systems and cooler surroundings.'},
  r2:{title:'R2 · Traffic Heat Loop',type:'REINFORCING LOOP',copy:'Urban heat reduces walking comfort. Lower walkability increases private vehicle use, congestion and vehicle heat emissions.',effect:'Vehicle heat and emissions feed back into urban heat, creating another reinforcing cycle.',planning:'Improve shaded walking routes, transit access and traffic management together.'},
  b1:{title:'B1 · Greening Response Loop',type:'BALANCING LOOP',copy:'Heat increases public concern and supports urban greening programmes, vegetation protection and tree-canopy growth.',effect:'Tree canopy strengthens evapotranspiration and natural cooling, reducing urban heat intensity.',planning:'Prioritise an Urban Tree Planting and Shaded Streets Program.'},
  b2:{title:'B2 · Policy Response Loop',type:'BALANCING LOOP',copy:'Heat impacts increase policy attention, leading to heat-responsive design and wider use of cool materials and roofs.',effect:'Lower heat absorption reduces surface temperature and counteracts the urban heat problem.',planning:'Integrate heat-performance requirements into plans, design guidance and public investment.'}
};
const svg=document.getElementById('cld-svg');
if(!svg)return;
const viewport=document.getElementById('cld-viewport');
const canvasPanel=svg.closest('.cld-canvas-panel');
const nodes=[...svg.querySelectorAll('.cld-node')];
const edgeGroups=[...svg.querySelectorAll('.cld-edge-group')];
const zoneLabels=[...svg.querySelectorAll('.cld-zone-label')];
const select=document.getElementById('cld-variable-select');
const loopBtns=[...document.querySelectorAll('.cld-loop-btn')];
let activeLoop='all',selectedNode=null,scale=1,tx=0,ty=0,dragging=false,startX=0,startY=0,startTx=0,startTy=0;

/* Moving causal arrows: lightweight SVG animateMotion markers travel along each relationship. */
function buildFlowArrows(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ns='http://www.w3.org/2000/svg';
  edgeGroups.forEach((group,index)=>{
    const edge=group.querySelector('.cld-edge');if(!edge)return;
    let length=150;try{length=edge.getTotalLength();}catch(_){ }
    const loops=(group.dataset.loops||'').split(/\s+/);
    const color=loops.some(l=>l==='r1'||l==='r2')?'#ff6b6b':loops.some(l=>l==='b1'||l==='b2')?'#53d49b':loops.includes('drivers')?'#f5bd55':'#69c7ff';
    group.style.setProperty('--cld-flow-color',color);
    const duration=Math.max(1.35,Math.min(3.4,length/78));
    const count=length>290?2:1;
    for(let n=0;n<count;n++){
      const arrow=document.createElementNS(ns,'path');
      arrow.setAttribute('d','M -7 -4 L 7 0 L -7 4 L -3 0 Z');
      arrow.setAttribute('class','cld-flow-arrow');
      arrow.setAttribute('aria-hidden','true');
      const motion=document.createElementNS(ns,'animateMotion');
      motion.setAttribute('path',edge.getAttribute('d'));
      motion.setAttribute('dur',duration.toFixed(2)+'s');
      motion.setAttribute('begin',(-(index*.09+n*duration/count)).toFixed(2)+'s');
      motion.setAttribute('repeatCount','indefinite');
      motion.setAttribute('rotate','auto');
      arrow.appendChild(motion);
      group.insertBefore(arrow,group.querySelector('.cld-polarity'));
    }
  });
}
buildFlowArrows();
Object.entries(nodeData).sort((a,b)=>a[1].label.localeCompare(b[1].label)).forEach(([id,n])=>{const o=document.createElement('option');o.value=id;o.textContent=n.label;select.appendChild(o);});
function matchesLoop(el,loop){return loop==='all'||(el.dataset.loops||'').split(/\s+/).includes(loop);}
function updateTransform(){viewport.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);}
function setDetail(data,connections=[]){
  document.getElementById('cld-detail-type').textContent=data.type;
  document.getElementById('cld-detail-title').textContent=data.label||data.title;
  document.getElementById('cld-detail-copy').textContent=data.copy;
  document.getElementById('cld-detail-effect').textContent=data.effect;
  document.getElementById('cld-detail-planning').textContent=data.planning;
  const list=document.getElementById('cld-connection-list');list.innerHTML='';
  if(connections.length){connections.forEach(id=>{const b=document.createElement('button');b.type='button';b.textContent=nodeData[id].label;b.addEventListener('click',()=>selectVariable(id));list.appendChild(b);});}
  else{const s=document.createElement('span');s.className='cld-empty-chip';s.textContent=selectedNode?'No direct connections':'Select a variable to inspect its connections';list.appendChild(s);}
}
function setLoop(loop){
  activeLoop=loop;selectedNode=null;select.value='';
  loopBtns.forEach(b=>b.classList.toggle('active',b.dataset.loop===loop));
  nodes.forEach(n=>{n.classList.remove('is-selected','is-neighbour');n.classList.toggle('is-muted',!matchesLoop(n,loop));});
  edgeGroups.forEach(e=>{e.classList.remove('is-connected');const active=matchesLoop(e,loop);e.classList.toggle('is-active',loop!=='all'&&active);e.classList.toggle('is-muted',!active);});
  zoneLabels.forEach(z=>z.classList.toggle('is-muted',!matchesLoop(z,loop)));
  document.getElementById('cld-active-loop-badge').textContent=loopData[loop].title;
  setDetail(loopData[loop]);
}
function connectedIds(id){const out=new Set();edgeGroups.forEach(e=>{if(e.dataset.from===id)out.add(e.dataset.to);if(e.dataset.to===id)out.add(e.dataset.from);});return [...out];}
function selectVariable(id){
  const data=nodeData[id];if(!data)return;
  selectedNode=id;select.value=id;
  const connected=connectedIds(id);
  nodes.forEach(n=>{const nid=n.dataset.node;n.classList.toggle('is-selected',nid===id);n.classList.toggle('is-neighbour',connected.includes(nid));n.classList.toggle('is-muted',nid!==id&&!connected.includes(nid));});
  edgeGroups.forEach(e=>{const conn=e.dataset.from===id||e.dataset.to===id;e.classList.toggle('is-connected',conn);e.classList.toggle('is-active',false);e.classList.toggle('is-muted',!conn);});
  zoneLabels.forEach(z=>z.classList.add('is-muted'));
  setDetail(data,connected);
  const node=svg.querySelector(`[data-node="${id}"]`);if(node){const box=node.getBBox();const tr=node.transform.baseVal.consolidate();const nx=tr?tr.matrix.e:0,ny=tr?tr.matrix.f:0;const cx=nx+box.x+box.width/2,cy=ny+box.y+box.height/2;scale=Math.max(scale,1.12);tx=690-cx*scale;ty=390-cy*scale;updateTransform();}
}
loopBtns.forEach(b=>b.addEventListener('click',()=>setLoop(b.dataset.loop)));
document.querySelectorAll('[data-open-loop]').forEach(b=>b.addEventListener('click',()=>{setLoop(b.dataset.openLoop);document.getElementById('cld-section').scrollIntoView({behavior:'smooth',block:'start'});}));
document.querySelectorAll('.cld-jump-node').forEach(b=>b.addEventListener('click',()=>{selectVariable(b.dataset.nodeTarget);document.getElementById('cld-section').scrollIntoView({behavior:'smooth',block:'start'});}));
nodes.forEach(n=>{n.addEventListener('click',e=>{e.stopPropagation();selectVariable(n.dataset.node);});n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectVariable(n.dataset.node);}});});
select.addEventListener('change',()=>select.value?selectVariable(select.value):setLoop(activeLoop));
document.getElementById('cld-clear-node').addEventListener('click',()=>setLoop(activeLoop));
document.getElementById('cld-show-all').addEventListener('click',()=>{scale=1;tx=0;ty=0;updateTransform();setLoop('all');});
document.getElementById('cld-fit').addEventListener('click',()=>{scale=1;tx=0;ty=0;updateTransform();});
document.getElementById('cld-zoom-in').addEventListener('click',()=>{scale=Math.min(2.2,scale*1.15);updateTransform();});
document.getElementById('cld-zoom-out').addEventListener('click',()=>{scale=Math.max(.65,scale/1.15);updateTransform();});
const flowBtn=document.getElementById('cld-flow-toggle');canvasPanel.classList.add('flow-on');
try{svg.unpauseAnimations?.();}catch(_){ }
flowBtn.addEventListener('click',()=>{
  const on=!canvasPanel.classList.contains('flow-on');
  canvasPanel.classList.toggle('flow-on',on);flowBtn.classList.toggle('active',on);flowBtn.setAttribute('aria-pressed',String(on));
  try{on?svg.unpauseAnimations?.():svg.pauseAnimations?.();}catch(_){ }
});
svg.addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();const rect=svg.getBoundingClientRect();const mx=(e.clientX-rect.left)/rect.width*1380,my=(e.clientY-rect.top)/rect.height*780;const beforeX=(mx-tx)/scale,beforeY=(my-ty)/scale;const factor=e.deltaY<0?1.1:.91;scale=Math.max(.65,Math.min(2.3,scale*factor));tx=mx-beforeX*scale;ty=my-beforeY*scale;updateTransform();},{passive:false});
svg.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('.cld-node'))return;dragging=true;svg.classList.add('is-panning');svg.setPointerCapture(e.pointerId);startX=e.clientX;startY=e.clientY;startTx=tx;startTy=ty;});
svg.addEventListener('pointermove',e=>{if(!dragging)return;const r=svg.getBoundingClientRect();tx=startTx+(e.clientX-startX)*1380/r.width;ty=startTy+(e.clientY-startY)*780/r.height;updateTransform();});
svg.addEventListener('pointerup',e=>{dragging=false;svg.classList.remove('is-panning');try{svg.releasePointerCapture(e.pointerId)}catch(_){}});
svg.addEventListener('click',e=>{if(e.target===svg||e.target.closest('.cld-edges'))setLoop(activeLoop);});
document.querySelectorAll('[data-synth-scroll]').forEach(b=>b.addEventListener('click',()=>{const target=b.dataset.synthScroll==='cld'?document.getElementById('cld-section'):document.querySelector('#page-synthesis .synth-summary-grid');target&&target.scrollIntoView({behavior:'smooth',block:'start'});}));
setLoop('all');
})();
