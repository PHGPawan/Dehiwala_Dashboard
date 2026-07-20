/* ======== INTERACTIVE 3D POPULATION MODEL ======== */
(function(){
  const viewer=document.getElementById('population-model-viewer');
  const stage=document.getElementById('model3d-stage');
  const select=document.getElementById('model-gn-select');
  if(!viewer||!stage||!select)return;

  const modelUrl='assets/models/Dehiwala_Population_Selectable.glb';
  viewer.setAttribute('src',modelUrl);

  const loading=document.getElementById('model3d-loading');
  const fill=document.getElementById('model3d-progress-fill');
  const progressLabel=document.getElementById('model3d-progress-label');
  const profileCard=document.getElementById('model-profile-name')?.closest('.model3d-control-card');
  const selectionChip=document.getElementById('model-selection-chip');

  const quickProfile=document.createElement('div');
  quickProfile.className='model3d-quick-profile is-empty';
  quickProfile.setAttribute('aria-live','polite');
  quickProfile.innerHTML='<div class="model3d-quick-kicker">SELECTED GN</div><div class="model3d-quick-name">No GN selected</div><div class="model3d-quick-stats"><span><b>—</b>Total</span><span><b>—</b>Male</span><span><b>—</b>Female</span></div>';
  stage.appendChild(quickProfile);

  let baseColor='#63b3ed';
  let colorMode='population';
  const selectedFill='#f4b942';
  const selectedOutline='#fff2a8';
  const defaultOutline='#b7c7d9';
  let selectedGN=null;
  let pointerStart=null;
  let pointerMoved=false;

  const toRgba=(hex,alpha=1)=>{
    const clean=hex.replace('#','');
    return [0,2,4].map(i=>parseInt(clean.slice(i,i+2),16)/255).concat(alpha);
  };
  const toRgb=hex=>toRgba(hex,1).slice(0,3);
  const hexToRgb=hex=>{const c=hex.replace('#','');return{r:parseInt(c.slice(0,2),16),g:parseInt(c.slice(2,4),16),b:parseInt(c.slice(4,6),16)}};
  const rgbToHex=({r,g,b})=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  const blend=(a,b,t)=>rgbToHex({r:a.r+(b.r-a.r)*t,g:a.g+(b.g-a.g)*t,b:a.b+(b.b-a.b)*t});
  const blendMulti=(stops,t)=>{
    if(t<=0)return stops[0].color;if(t>=1)return stops[stops.length-1].color;
    for(let i=0;i<stops.length-1;i++){
      const s0=stops[i],s1=stops[i+1];
      if(t>=s0.pos&&t<=s1.pos)return blend(hexToRgb(s0.color),hexToRgb(s1.color),(t-s0.pos)/(s1.pos-s0.pos||1));
    }
    return stops[stops.length-1].color;
  };
  const materialName=material=>(material&&material.name?material.name.trim():'');
  const records=[...select.options].filter(o=>o.value).map(o=>({
    name:o.value,total:Number(o.dataset.total),male:Number(o.dataset.male),female:Number(o.dataset.female),angle:Number(o.dataset.angle)
  }));
  const getRecord=name=>records.find(r=>r.name===name);
  const popValues=records.map(r=>r.total);
  const popMin=Math.min(...popValues),popMax=Math.max(...popValues),popRange=Math.max(1,popMax-popMin);
  const rankRecords=[...records].sort((a,b)=>a.total-b.total);
  const rankMap=Object.fromEntries(rankRecords.map((r,i)=>[r.name,rankRecords.length===1?0:i/(rankRecords.length-1)]));

  function getBaseColorForName(name){
    const rec=getRecord(name);if(!rec)return baseColor;
    const t=(rec.total-popMin)/popRange;
    if(colorMode==='population')return blendMulti([
      {pos:0,color:'#0f766e'},{pos:.35,color:'#1d4ed8'},{pos:.68,color:'#b45309'},{pos:1,color:'#9a3412'}
    ],t);
    if(colorMode==='height')return blendMulti([
      {pos:0,color:'#155e75'},{pos:.30,color:'#1e40af'},{pos:.60,color:'#6d28d9'},{pos:1,color:'#9d174d'}
    ],t);
    if(colorMode==='spectrum')return blendMulti([
      {pos:0,color:'#166534'},{pos:.22,color:'#0f766e'},{pos:.45,color:'#1d4ed8'},{pos:.68,color:'#6d28d9'},{pos:1,color:'#be185d'}
    ],rankMap[name]??t);
    return baseColor;
  }

  function setEmissive(material,color){
    try{if(typeof material.setEmissiveFactor==='function')material.setEmissiveFactor(toRgb(color));}catch(_){ }
  }

  function paintMaterials(){
    if(!viewer.model?.materials)return;
    viewer.model.materials.forEach(material=>{
      const name=materialName(material);
      const isOutline=name.startsWith('Outline::');
      const gnName=isOutline?name.slice('Outline::'.length):name;
      const isSelected=Boolean(selectedGN&&gnName===selectedGN);
      try{
        if(isOutline){
          const color=isSelected?selectedOutline:defaultOutline;
          material.pbrMetallicRoughness.setBaseColorFactor(toRgba(color,1));
          material.pbrMetallicRoughness.setMetallicFactor(isSelected?.08:0);
          material.pbrMetallicRoughness.setRoughnessFactor(isSelected?.18:.28);
          setEmissive(material,isSelected?'#ffb000':'#213449');
        }else{
          const applied=isSelected?selectedFill:getBaseColorForName(gnName);
          material.pbrMetallicRoughness.setBaseColorFactor(toRgba(applied,1));
          material.pbrMetallicRoughness.setMetallicFactor(isSelected?.12:.02);
          material.pbrMetallicRoughness.setRoughnessFactor(isSelected?.20:.48);
          setEmissive(material,isSelected?'#7a3600':'#000000');
        }
      }catch(err){console.warn('GN material styling unavailable',err);}
    });
  }

  function setEmptyProfile(){
    document.getElementById('model-profile-name').textContent='No GN selected';
    document.getElementById('model-profile-total').textContent='—';
    document.getElementById('model-profile-male').textContent='—';
    document.getElementById('model-profile-female').textContent='—';
    selectionChip.textContent='NO SELECTION';selectionChip.classList.remove('is-selected');
    quickProfile.classList.add('is-empty');
    quickProfile.querySelector('.model3d-quick-name').textContent='No GN selected';
    quickProfile.querySelectorAll('.model3d-quick-stats b').forEach(el=>el.textContent='—');
  }

  function updateProfile(rec){
    const values=[rec.total,rec.male,rec.female].map(v=>v.toLocaleString());
    document.getElementById('model-profile-name').textContent=rec.name;
    document.getElementById('model-profile-total').textContent=values[0];
    document.getElementById('model-profile-male').textContent=values[1];
    document.getElementById('model-profile-female').textContent=values[2];
    selectionChip.textContent='● HIGHLIGHTED';selectionChip.classList.add('is-selected');
    quickProfile.classList.remove('is-empty');
    quickProfile.querySelector('.model3d-quick-name').textContent=rec.name;
    quickProfile.querySelectorAll('.model3d-quick-stats b').forEach((el,i)=>el.textContent=values[i]);
    quickProfile.classList.remove('selection-pulse');
    profileCard?.classList.remove('selection-pulse');
    requestAnimationFrame(()=>{quickProfile.classList.add('selection-pulse');profileCard?.classList.add('selection-pulse');});
  }

  function selectGN(rec,{rotate=true}={}){
    if(!rec)return clearSelection();
    selectedGN=rec.name;select.value=rec.name;updateProfile(rec);paintMaterials();
    if(rotate){viewer.cameraOrbit=`${rec.angle}deg 55deg auto`;viewer.jumpCameraToGoal?.();}
  }
  function clearSelection(){selectedGN=null;select.value='';setEmptyProfile();paintMaterials();}

  viewer.addEventListener('progress',e=>{
    const p=Math.round((e.detail.totalProgress||0)*100);fill.style.width=p+'%';
    progressLabel.textContent=p<100?`Loading outlined GN geometry… ${p}%`:'Finalising GN boundaries…';
  });
  viewer.addEventListener('load',()=>{
    fill.style.width='100%';progressLabel.textContent='Nine outlined GN divisions ready';
    clearSelection();setTimeout(()=>loading.classList.add('done'),250);
  });
  viewer.addEventListener('error',()=>{progressLabel.textContent='The 3D model could not be displayed in this browser.';fill.style.background='var(--red)';});

  const jump=()=>viewer.jumpCameraToGoal?.();
  document.querySelectorAll('.camera-preset').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.camera-preset').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    viewer.cameraOrbit=btn.dataset.orbit;viewer.cameraTarget='auto auto auto';jump();
  }));
  function zoom(factor){try{const o=viewer.getCameraOrbit();viewer.cameraOrbit=`${o.theta}rad ${o.phi}rad ${Math.max(.01,o.radius*factor)}m`;jump();}catch(err){console.warn('Zoom unavailable',err);}}
  document.getElementById('model-zoom-in')?.addEventListener('click',()=>zoom(.82));
  document.getElementById('model-zoom-out')?.addEventListener('click',()=>zoom(1.22));
  document.getElementById('model-reset')?.addEventListener('click',()=>{
    viewer.cameraOrbit='25deg 55deg auto';viewer.cameraTarget='auto auto auto';viewer.fieldOfView='30deg';viewer.resetTurntableRotation?.();
    document.querySelectorAll('.camera-preset').forEach((b,i)=>b.classList.toggle('active',i===0));jump();
  });
  document.getElementById('model-fullscreen')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await stage.requestFullscreen();else await document.exitFullscreen();}catch(err){console.warn('Fullscreen unavailable',err);}});
  document.getElementById('model-auto-rotate')?.addEventListener('change',e=>viewer.toggleAttribute('auto-rotate',e.target.checked));
  const h=document.getElementById('model-height'),ho=document.getElementById('model-height-out');h?.addEventListener('input',()=>{viewer.scale=`1 ${h.value} 1`;ho.value=Number(h.value).toFixed(2)+'×';});
  const ex=document.getElementById('model-exposure'),exo=document.getElementById('model-exposure-out');ex?.addEventListener('input',()=>{viewer.exposure=Number(ex.value);exo.value=Number(ex.value).toFixed(2);});
  const sh=document.getElementById('model-shadow'),sho=document.getElementById('model-shadow-out');sh?.addEventListener('input',()=>{viewer.shadowIntensity=Number(sh.value);sho.value=Number(sh.value).toFixed(2);});

  document.querySelectorAll('.model3d-swatch').forEach(s=>s.addEventListener('click',()=>{
    document.querySelectorAll('.model3d-swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');
    colorMode=s.dataset.colorMode||'solid';if(colorMode==='solid')baseColor=s.dataset.color||baseColor;paintMaterials();
  }));

  select.addEventListener('change',()=>{const rec=getRecord(select.value);rec?selectGN(rec):clearSelection();});
  document.getElementById('model-clear-selection')?.addEventListener('click',clearSelection);

  viewer.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};pointerMoved=false;});
  viewer.addEventListener('pointermove',e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>7)pointerMoved=true;});
  viewer.addEventListener('pointerup',()=>setTimeout(()=>{pointerStart=null;},0));
  viewer.addEventListener('click',e=>{
    if(pointerMoved||!viewer.modelIsVisible||typeof viewer.materialFromPoint!=='function')return;
    const material=viewer.materialFromPoint(e.clientX,e.clientY);let name=materialName(material);
    if(name.startsWith('Outline::'))name=name.slice('Outline::'.length);
    const rec=getRecord(name);if(rec)selectGN(rec,{rotate:false});
  });

  document.getElementById('download-embedded-glb')?.addEventListener('click',()=>{
    const a=document.createElement('a');a.href=modelUrl;a.download='Dehiwala_Population_Selectable_Outlined.glb';document.body.appendChild(a);a.click();a.remove();
  });
})();

/* ======== EXTERNAL DOWNLOAD STATUS ======== */
document.querySelectorAll('.gpkg-download, .xlsx-download').forEach(button=>{
  button.addEventListener('click',()=>{const status=button.nextElementSibling;if(status)status.textContent='Download started from the included downloads folder';});
});
