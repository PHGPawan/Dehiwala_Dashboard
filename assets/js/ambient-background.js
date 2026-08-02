(function(){
  'use strict';
  if(document.querySelector('.ambient-ui-bg')) return;
  const wrap=document.createElement('div');
  wrap.className='ambient-ui-bg';
  wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML=`
    <div class="ambient-grid"></div>
    <div class="ambient-orb ambient-orb--a"></div>
    <div class="ambient-orb ambient-orb--b"></div>
    <div class="ambient-wave ambient-wave--three"><svg viewBox="0 0 1440 240" preserveAspectRatio="none"><path d="M0 132 C180 70 330 205 520 135 C700 65 840 200 1030 125 C1180 66 1310 140 1440 96 L1440 240 L0 240 Z" fill="rgba(73,180,255,.55)"/></svg></div>
    <div class="ambient-wave ambient-wave--two"><svg viewBox="0 0 1440 240" preserveAspectRatio="none"><path d="M0 118 C160 42 340 205 540 124 C730 48 900 204 1080 118 C1250 38 1350 128 1440 86 L1440 240 L0 240 Z" fill="rgba(53,214,185,.62)"/></svg></div>
    <div class="ambient-wave ambient-wave--one"><svg viewBox="0 0 1440 240" preserveAspectRatio="none"><path d="M0 128 C170 62 330 195 525 130 C720 65 840 190 1040 119 C1210 58 1345 145 1440 105 L1440 240 L0 240 Z" fill="rgba(61,153,255,.62)"/></svg></div>
    <div class="ambient-symbols"></div>`;
  document.body.prepend(wrap);
  const symbols=wrap.querySelector('.ambient-symbols');
  const icons=[
    '<svg viewBox="0 0 24 24"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.2 3.6 4.9 3.6 8S14.4 17.8 12 20M12 4c-2.4 2.2-3.6 4.9-3.6 8S9.6 17.8 12 20"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M3 17c3-5 5 2 9-3s6 2 9-3M3 12c3-5 5 2 9-3s6 2 9-3"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="m8.2 11 7.6-4M8.2 13l7.6 4"/></svg>'
  ];
  const positions=[[8,18],[24,76],[41,12],[57,70],[73,25],[87,62],[15,48],[34,38],[66,47],[91,18],[49,87],[79,84]];
  positions.forEach((p,i)=>{
    const el=document.createElement('span');
    el.className='ambient-symbol';
    el.style.left=p[0]+'%';el.style.top=p[1]+'%';
    el.style.setProperty('--dur',(16+(i%5)*3)+'s');
    el.style.setProperty('--delay',(-i*2.1)+'s');
    el.innerHTML=icons[i%icons.length];
    symbols.appendChild(el);
  });
})();
