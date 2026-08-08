(function(){
  'use strict';

  if (document.querySelector('.ambient-ui-bg')) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const compactViewport = window.matchMedia('(max-width: 1024px)').matches;

  const wrap = document.createElement('div');
  wrap.className = 'ambient-ui-bg';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = `
    <div class="ambient-pointer-light"></div>
    <div class="ambient-reactive ambient-grid-anchor" data-depth="0.18" data-kind="grid">
      <div class="ambient-grid"></div>
    </div>

    <div class="ambient-reactive ambient-orb-anchor ambient-orb-anchor--a" data-depth="0.72" data-kind="orb" data-axis-x="1" data-axis-y="1">
      <div class="ambient-orb ambient-orb--a"></div>
    </div>
    <div class="ambient-reactive ambient-orb-anchor ambient-orb-anchor--b" data-depth="0.50" data-kind="orb" data-axis-x="-1" data-axis-y="1">
      <div class="ambient-orb ambient-orb--b"></div>
    </div>

    <div class="ambient-reactive ambient-wave-anchor ambient-wave-anchor--three" data-depth="0.22" data-kind="wave" data-axis-x="-1" data-axis-y="1">
      <div class="ambient-wave ambient-wave--three"><svg viewBox="0 0 1440 240" preserveAspectRatio="none"><path d="M0 132 C180 70 330 205 520 135 C700 65 840 200 1030 125 C1180 66 1310 140 1440 96 L1440 240 L0 240 Z" fill="rgba(73,180,255,.55)"/></svg></div>
    </div>
    <div class="ambient-reactive ambient-wave-anchor ambient-wave-anchor--two" data-depth="0.38" data-kind="wave" data-axis-x="1" data-axis-y="-1">
      <div class="ambient-wave ambient-wave--two"><svg viewBox="0 0 1440 240" preserveAspectRatio="none"><path d="M0 118 C160 42 340 205 540 124 C730 48 900 204 1080 118 C1250 38 1350 128 1440 86 L1440 240 L0 240 Z" fill="rgba(53,214,185,.62)"/></svg></div>
    </div>
    <div class="ambient-reactive ambient-wave-anchor ambient-wave-anchor--one" data-depth="0.55" data-kind="wave" data-axis-x="-1" data-axis-y="1">
      <div class="ambient-wave ambient-wave--one"><svg viewBox="0 0 1440 240" preserveAspectRatio="none"><path d="M0 128 C170 62 330 195 525 130 C720 65 840 190 1040 119 C1210 58 1345 145 1440 105 L1440 240 L0 240 Z" fill="rgba(61,153,255,.62)"/></svg></div>
    </div>

    <div class="ambient-symbols"></div>`;

  document.body.prepend(wrap);

  const symbols = wrap.querySelector('.ambient-symbols');
  const icons = [
    '<svg viewBox="0 0 24 24"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.2 3.6 4.9 3.6 8S14.4 17.8 12 20M12 4c-2.4 2.2-3.6 4.9-3.6 8S9.6 17.8 12 20"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M3 17c3-5 5 2 9-3s6 2 9-3M3 12c3-5 5 2 9-3s6 2 9-3"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="m8.2 11 7.6-4M8.2 13l7.6 4"/></svg>'
  ];

  const positions = [[8,18],[24,76],[41,12],[57,70],[73,25],[87,62],[15,48],[34,38],[66,47],[91,18],[49,87],[79,84]];
  positions.forEach((position, index) => {
    const anchor = document.createElement('span');
    anchor.className = 'ambient-reactive ambient-symbol-anchor';
    anchor.dataset.kind = 'symbol';
    anchor.dataset.depth = String(0.35 + (index % 5) * 0.12);
    anchor.dataset.axisX = index % 2 ? '-1' : '1';
    anchor.dataset.axisY = index % 3 ? '1' : '-1';
    anchor.dataset.phase = String(index * 0.73);
    anchor.style.left = position[0] + '%';
    anchor.style.top = position[1] + '%';

    const symbol = document.createElement('span');
    symbol.className = 'ambient-symbol';
    symbol.style.setProperty('--dur', (16 + (index % 5) * 3) + 's');
    symbol.style.setProperty('--delay', (-index * 2.1) + 's');
    symbol.innerHTML = icons[index % icons.length];

    anchor.appendChild(symbol);
    symbols.appendChild(anchor);
  });

  if (reduceMotion) {
    wrap.classList.add('ambient-reduced-motion');
    return;
  }

  /* Touch devices keep the CSS wave, orb and symbol animations, but do not
     need desktop pointer-parallax calculations running every frame. */
  if (compactViewport || !finePointer) {
    wrap.classList.add('ambient-mobile-passive');
    return;
  }

  const reactives = Array.from(wrap.querySelectorAll('.ambient-reactive'));
  const pointerLight = wrap.querySelector('.ambient-pointer-light');

  let targetPointerX = 0;
  let targetPointerY = 0;
  let currentPointerX = 0;
  let currentPointerY = 0;
  let pointerClientX = window.innerWidth * 0.5;
  let pointerClientY = window.innerHeight * 0.5;
  let currentLightX = pointerClientX;
  let currentLightY = pointerClientY;
  let targetScroll = window.scrollY || document.documentElement.scrollTop || 0;
  let currentScroll = targetScroll;
  let lastScroll = targetScroll;
  let scrollVelocity = 0;
  let animationFrame = 0;
  let isVisible = !document.hidden;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(from, to, amount) {
    return from + (to - from) * amount;
  }

  function handlePointerMove(event) {
    if (!finePointer) return;
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    targetPointerX = clamp((event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2, -1, 1);
    targetPointerY = clamp((event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2, -1, 1);
    wrap.classList.add('ambient-pointer-active');
  }

  function handlePointerLeave() {
    targetPointerX = 0;
    targetPointerY = 0;
    pointerClientX = window.innerWidth * 0.5;
    pointerClientY = window.innerHeight * 0.5;
    wrap.classList.remove('ambient-pointer-active');
  }

  function handleScroll() {
    targetScroll = window.scrollY || document.documentElement.scrollTop || 0;
    const delta = targetScroll - lastScroll;
    scrollVelocity = clamp(scrollVelocity + delta * 0.32, -42, 42);
    lastScroll = targetScroll;
    wrap.classList.add('ambient-is-scrolling');
    window.clearTimeout(handleScroll.stopTimer);
    handleScroll.stopTimer = window.setTimeout(() => {
      wrap.classList.remove('ambient-is-scrolling');
    }, 150);
  }

  function updateReactiveElement(element, timeSeconds) {
    const depth = Number(element.dataset.depth || 0.5);
    const axisX = Number(element.dataset.axisX || 1);
    const axisY = Number(element.dataset.axisY || 1);
    const phase = Number(element.dataset.phase || 0);
    const kind = element.dataset.kind || '';

    let x = 0;
    let y = 0;
    let scale = 1;
    let rotation = 0;

    if (kind === 'wave') {
      x = currentPointerX * 22 * depth * axisX + Math.sin(currentScroll * 0.0032 + phase) * 14 * depth;
      y = currentPointerY * 8 * depth * axisY + Math.cos(currentScroll * 0.004 + phase) * 7 * depth + scrollVelocity * 0.18 * depth;
      scale = 1 + Math.min(Math.abs(scrollVelocity), 30) * 0.0008 * depth;
    } else if (kind === 'symbol') {
      x = currentPointerX * 28 * depth * axisX + Math.sin(currentScroll * 0.0022 + phase) * 12 * depth;
      y = currentPointerY * 22 * depth * axisY + Math.cos(currentScroll * 0.0028 + phase) * 15 * depth + scrollVelocity * 0.12 * depth;
      rotation = currentPointerX * 4 * depth + Math.sin(timeSeconds * 0.35 + phase) * 1.8;
      scale = 1 + Math.abs(currentPointerX) * 0.035 * depth;
    } else if (kind === 'orb') {
      x = currentPointerX * 34 * depth * axisX + Math.sin(currentScroll * 0.0018 + phase) * 10 * depth;
      y = currentPointerY * 26 * depth * axisY + Math.cos(currentScroll * 0.002 + phase) * 12 * depth + scrollVelocity * 0.10 * depth;
      rotation = currentPointerX * 3 * depth;
    } else if (kind === 'grid') {
      x = currentPointerX * 10 * depth + (currentScroll % 72) * 0.10;
      y = currentPointerY * 8 * depth + (currentScroll % 72) * 0.14;
    }

    element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
  }

  function render(timestamp) {
    if (!isVisible) {
      animationFrame = 0;
      return;
    }

    currentPointerX = lerp(currentPointerX, targetPointerX, 0.075);
    currentPointerY = lerp(currentPointerY, targetPointerY, 0.075);
    currentScroll = lerp(currentScroll, targetScroll, 0.095);
    scrollVelocity *= 0.90;

    currentLightX = lerp(currentLightX, pointerClientX, 0.11);
    currentLightY = lerp(currentLightY, pointerClientY, 0.11);
    pointerLight.style.transform = `translate3d(${(currentLightX - 260).toFixed(1)}px, ${(currentLightY - 260).toFixed(1)}px, 0)`;

    const timeSeconds = timestamp * 0.001;
    for (const element of reactives) updateReactiveElement(element, timeSeconds);

    animationFrame = window.requestAnimationFrame(render);
  }

  function startAnimation() {
    if (!animationFrame && isVisible) animationFrame = window.requestAnimationFrame(render);
  }

  if (finePointer) {
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handlePointerLeave, { passive: true });
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', () => {
    pointerClientX = window.innerWidth * 0.5;
    pointerClientY = window.innerHeight * 0.5;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible) startAnimation();
  });

  startAnimation();
})();
