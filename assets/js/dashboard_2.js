/* ======== INTERACTIVE 3D POPULATION MODEL ======== */
(function(){
  const viewer = document.getElementById('population-model-viewer');
  const stage = document.getElementById('model3d-stage');
  if(!viewer || !stage) return;

  const modelUrl = 'assets/models/Dehiwala_Population_Selectable.glb';
  viewer.setAttribute('src', modelUrl);

  const loading = document.getElementById('model3d-loading');
  const fill = document.getElementById('model3d-progress-fill');
  const progressLabel = document.getElementById('model3d-progress-label');
  let baseColor = '#63b3ed';
  let colorMode = 'population';
  const highlightColor = '#f6c85f';
  let selectedGN = 'Dehiwala East';
  let pointerStart = null;
  let pointerMoved = false;

  const toRgba = (hex,alpha=1)=>{
    const clean=hex.replace('#','');
    return [0,2,4].map(i=>parseInt(clean.slice(i,i+2),16)/255).concat(alpha);
  };
  const hexToRgb = hex => {
    const clean = hex.replace('#','');
    return {r:parseInt(clean.slice(0,2),16), g:parseInt(clean.slice(2,4),16), b:parseInt(clean.slice(4,6),16)};
  };
  const rgbToHex = ({r,g,b}) => '#' + [r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  const blend = (a,b,t) => rgbToHex({r:a.r+(b.r-a.r)*t, g:a.g+(b.g-a.g)*t, b:a.b+(b.b-a.b)*t});
  const blendMulti = (stops,t) => {
    if(t<=0) return stops[0].color; if(t>=1) return stops[stops.length-1].color;
    for(let i=0;i<stops.length-1;i++){
      const s0=stops[i], s1=stops[i+1];
      if(t>=s0.pos && t<=s1.pos){
        const local=(t-s0.pos)/(s1.pos-s0.pos || 1);
        return blend(hexToRgb(s0.color), hexToRgb(s1.color), local);
      }
    }
    return stops[stops.length-1].color;
  };
  const materialName = material => (material && material.name ? material.name.trim() : '');
  const rows = [...document.querySelectorAll('.gn3d-row')];
  const getRow = name => rows.find(r=>r.dataset.name===name);
  const popValues = rows.map(r=>Number(r.dataset.total));
  const popMin = Math.min(...popValues), popMax = Math.max(...popValues);
  const popRange = Math.max(1,popMax-popMin);
  const rankRows = [...rows].sort((a,b)=>Number(a.dataset.total)-Number(b.dataset.total));
  const rankMap = Object.fromEntries(rankRows.map((r,i)=>[r.dataset.name, rankRows.length===1 ? 0 : i/(rankRows.length-1)]));

  function getBaseColorForName(name){
    const row = getRow(name);
    if(!row) return baseColor;
    const t = (Number(row.dataset.total) - popMin) / popRange;
    if(colorMode === 'population'){
      return blendMulti([
        {pos:0, color:'#0f766e'},
        {pos:0.35, color:'#1d4ed8'},
        {pos:0.68, color:'#b45309'},
        {pos:1, color:'#9a3412'}
      ], t);
    }
    if(colorMode === 'height'){
      return blendMulti([
        {pos:0, color:'#155e75'},
        {pos:0.30, color:'#1e40af'},
        {pos:0.60, color:'#6d28d9'},
        {pos:1, color:'#9d174d'}
      ], t);
    }
    if(colorMode === 'spectrum'){
      const rt = rankMap[name] ?? t;
      return blendMulti([
        {pos:0, color:'#166534'},
        {pos:0.22, color:'#0f766e'},
        {pos:0.45, color:'#1d4ed8'},
        {pos:0.68, color:'#6d28d9'},
        {pos:1, color:'#be185d'}
      ], rt);
    }
    return baseColor;
  }

  viewer.addEventListener('progress',e=>{
    const p = Math.round((e.detail.totalProgress || 0) * 100);
    fill.style.width = p + '%';
    progressLabel.textContent = p < 100 ? `Loading selectable geometry… ${p}%` : 'Finalising GN materials…';
  });

  function paintMaterials(){
    if(!viewer.model || !viewer.model.materials) return;
    viewer.model.materials.forEach(material=>{
      const name = materialName(material);
      const isSelected = name === selectedGN;
      const appliedColor = isSelected ? highlightColor : getBaseColorForName(name);
      try {
        material.pbrMetallicRoughness.setBaseColorFactor(toRgba(appliedColor,1));
        material.pbrMetallicRoughness.setMetallicFactor(isSelected ? 0.10 : 0.02);
        material.pbrMetallicRoughness.setRoughnessFactor(isSelected ? 0.24 : 0.48);
      } catch(err) { console.warn('GN material styling unavailable',err); }
    });
  }

  function updateProfile(row){
    document.querySelectorAll('.gn3d-row').forEach(r=>r.classList.remove('active'));
    row.classList.add('active');
    document.getElementById('model-profile-name').textContent=row.dataset.name;
    document.getElementById('model-profile-total').textContent=Number(row.dataset.total).toLocaleString();
    document.getElementById('model-profile-male').textContent=Number(row.dataset.male).toLocaleString();
    document.getElementById('model-profile-female').textContent=Number(row.dataset.female).toLocaleString();
  }

  function selectGN(row,{rotate=true}={}){
    if(!row) return;
    selectedGN = row.dataset.name;
    updateProfile(row);
    paintMaterials();
    if(rotate){
      viewer.cameraOrbit=`${row.dataset.angle}deg 55deg auto`;
      if(typeof viewer.jumpCameraToGoal==='function') viewer.jumpCameraToGoal();
    }
  }

  viewer.addEventListener('load',()=>{
    fill.style.width='100%';
    progressLabel.textContent='Nine selectable GN divisions ready';
    paintMaterials();
    selectGN(getRow(selectedGN),{rotate:false});
    setTimeout(()=>loading.classList.add('done'),300);
  });
  viewer.addEventListener('error',()=>{
    progressLabel.textContent='The 3D model could not be displayed in this browser.';
    fill.style.background='var(--red)';
  });

  function jump(){ if(typeof viewer.jumpCameraToGoal==='function') viewer.jumpCameraToGoal(); }
  document.querySelectorAll('.camera-preset').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.camera-preset').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      viewer.cameraOrbit = btn.dataset.orbit;
      viewer.cameraTarget = 'auto auto auto';
      jump();
    });
  });

  function zoom(factor){
    try {
      const o = viewer.getCameraOrbit();
      viewer.cameraOrbit = `${o.theta}rad ${o.phi}rad ${Math.max(.01,o.radius*factor)}m`;
      jump();
    } catch(err) { console.warn('Zoom control unavailable',err); }
  }
  document.getElementById('model-zoom-in').addEventListener('click',()=>zoom(.82));
  document.getElementById('model-zoom-out').addEventListener('click',()=>zoom(1.22));
  document.getElementById('model-reset').addEventListener('click',()=>{
    viewer.cameraOrbit='25deg 55deg auto'; viewer.cameraTarget='auto auto auto'; viewer.fieldOfView='30deg';
    if(typeof viewer.resetTurntableRotation==='function') viewer.resetTurntableRotation();
    document.querySelectorAll('.camera-preset').forEach((b,i)=>b.classList.toggle('active',i===0));
    jump();
  });
  document.getElementById('model-fullscreen').addEventListener('click',async()=>{
    try { if(!document.fullscreenElement) await stage.requestFullscreen(); else await document.exitFullscreen(); } catch(err) { console.warn('Fullscreen unavailable',err); }
  });

  document.getElementById('model-auto-rotate').addEventListener('change',e=>viewer.toggleAttribute('auto-rotate',e.target.checked));
  const h=document.getElementById('model-height'), ho=document.getElementById('model-height-out');
  h.addEventListener('input',()=>{ viewer.scale=`1 ${h.value} 1`; ho.value=Number(h.value).toFixed(2)+'×'; });
  const ex=document.getElementById('model-exposure'), exo=document.getElementById('model-exposure-out');
  ex.addEventListener('input',()=>{ viewer.exposure=Number(ex.value); exo.value=Number(ex.value).toFixed(2); });
  const sh=document.getElementById('model-shadow'), sho=document.getElementById('model-shadow-out');
  sh.addEventListener('input',()=>{ viewer.shadowIntensity=Number(sh.value); sho.value=Number(sh.value).toFixed(2); });

  document.querySelectorAll('.model3d-swatch').forEach(s=>s.addEventListener('click',()=>{
    document.querySelectorAll('.model3d-swatch').forEach(x=>x.classList.remove('active'));
    s.classList.add('active');
    colorMode = s.dataset.colorMode || 'solid';
    if(colorMode === 'solid') baseColor = s.dataset.color || baseColor;
    paintMaterials();
  }));

  document.querySelectorAll('.gn3d-row').forEach(row=>{
    row.addEventListener('click',()=>selectGN(row));
    row.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();selectGN(row);} });
  });

  // Distinguish a click from camera dragging, then pick the intersected GN material.
  viewer.addEventListener('pointerdown',e=>{
    pointerStart={x:e.clientX,y:e.clientY}; pointerMoved=false;
  });
  viewer.addEventListener('pointermove',e=>{
    if(pointerStart && Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>7) pointerMoved=true;
  });
  viewer.addEventListener('pointerup',()=>{ setTimeout(()=>{pointerStart=null;},0); });
  viewer.addEventListener('click',e=>{
    if(pointerMoved || !viewer.modelIsVisible || typeof viewer.materialFromPoint!=='function') return;
    const material=viewer.materialFromPoint(e.clientX,e.clientY);
    const name=materialName(material);
    const row=getRow(name);
    if(row) selectGN(row,{rotate:false});
  });

  document.getElementById('download-embedded-glb').addEventListener('click',()=>{
    const a=document.createElement('a'); a.href=modelUrl; a.download='Dehiwala_Population_Selectable.glb'; document.body.appendChild(a); a.click(); a.remove();
  });
})();


/* ======== EXTERNAL DOWNLOAD STATUS ======== */
document.querySelectorAll('.gpkg-download, .xlsx-download').forEach(button=>{
  button.addEventListener('click',()=>{
    const status=button.nextElementSibling;
    if(status) status.textContent='Download started from the included downloads folder';
  });
});
