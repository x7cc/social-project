/* Canada interactive exhibit */
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  // Loader
  const loader = $('#loader');
  let pct = 0;
  const loaderTimer = setInterval(() => {
    pct = Math.min(96, pct + Math.random() * 13);
    const pctEl = $('#loaderPct'), bar = $('#loaderBarFill');
    if (pctEl) pctEl.textContent = Math.floor(pct);
    if (bar) bar.style.width = pct + '%';
    if (pct >= 96) clearInterval(loaderTimer);
  }, 90);
  function finishLoader() {
    clearInterval(loaderTimer);
    const pctEl = $('#loaderPct'), bar = $('#loaderBarFill');
    if (pctEl) pctEl.textContent = '100';
    if (bar) bar.style.width = '100%';
    setTimeout(() => loader?.classList.add('hidden'), 350);
  }
  window.addEventListener('load', () => setTimeout(finishLoader, 350));
  setTimeout(finishLoader, 4500);

  // Animated starfield with shooting stars
  const starCanvas = $('#starfield');
  const ctx = starCanvas?.getContext('2d');
  let stars = [], shooters = [], lastShot = 0;
  function resizeStars() {
    if (!starCanvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    starCanvas.width = Math.floor(innerWidth * dpr);
    starCanvas.height = Math.floor(innerHeight * dpr);
    starCanvas.style.width = innerWidth + 'px';
    starCanvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({length: Math.round(Math.min(260, innerWidth * innerHeight / 6500))}, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() * 1.25 + .25, a: Math.random() * .55 + .16,
      phase: Math.random() * Math.PI * 2, speed: Math.random() * .8 + .3
    }));
  }
  function spawnShooter() {
    const fromLeft = Math.random() > .25;
    const x = fromLeft ? Math.random() * innerWidth * .75 : innerWidth * (.55 + Math.random() * .4);
    const y = Math.random() * innerHeight * .42;
    const angle = Math.PI * (.13 + Math.random() * .15);
    const speed = 7 + Math.random() * 8;
    shooters.push({x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, max: 35 + Math.random() * 30, len: 70 + Math.random() * 100});
  }
  function starLoop(t) {
    if (!ctx) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of stars) {
      const alpha = s.a * (.62 + .38 * Math.sin(t * .0007 * s.speed + s.phase));
      ctx.globalAlpha = alpha; ctx.fillStyle = '#d9eee9';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (t - lastShot > 3600 + Math.random() * 4200) { spawnShooter(); lastShot = t; }
    shooters = shooters.filter(s => s.life < s.max);
    for (const s of shooters) {
      s.x += s.vx; s.y += s.vy; s.life++;
      const alpha = Math.sin(Math.PI * s.life / s.max) * .85;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * s.len / 12, s.y - s.vy * s.len / 12);
      grad.addColorStop(0, `rgba(236,248,242,${alpha})`);
      grad.addColorStop(1, 'rgba(167,216,199,0)');
      ctx.strokeStyle = grad; ctx.lineWidth = 1.4; ctx.beginPath();
      ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * s.len / 12, s.y - s.vy * s.len / 12); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.beginPath(); ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(starLoop);
  }
  resizeStars(); addEventListener('resize', resizeStars); requestAnimationFrame(starLoop);

  // Custom cursor
  const cursor = $('#cursor'), ring = $('#cursor-ring');
  let mx = -100, my = -100, rx = -100, ry = -100;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  // title liquid highlight
  $$('.hero-word').forEach(word => {
    let tx = 50, ty = 50, x = 50, y = 50, vx = 0, vy = 0, active = false;
    word.addEventListener('pointermove', e => {
      const r = word.getBoundingClientRect();
      tx = Math.max(0, Math.min(100, (e.clientX-r.left)/r.width*100));
      ty = Math.max(0, Math.min(100, (e.clientY-r.top)/r.height*100));
      active = true;
    });
    word.addEventListener('pointerleave', () => { tx = 50; ty = 50; active = false; });
    const stir = () => {
      // Spring-like small wake
      vx = (vx + (tx-x) * (active ? .16 : .075)) * .82;
      vy = (vy + (ty-y) * (active ? .16 : .075)) * .82;
      x += vx; y += vy;
      word.style.setProperty('--liquid-x', x.toFixed(2)+'%');
      word.style.setProperty('--liquid-y', y.toFixed(2)+'%');
      word.style.setProperty('--liquid-wake', Math.min(1, (Math.abs(vx)+Math.abs(vy))*.045).toFixed(3));
      requestAnimationFrame(stir);
    };
    requestAnimationFrame(stir);
  });
  function cursorLoop() {
    if (cursor && ring) {
      cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
      rx += (mx - rx) * .12; ry += (my - ry) * .12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    }
    requestAnimationFrame(cursorLoop);
  }
  cursorLoop();
  $$('a, .rifle-stage, .image-frame').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor?.classList.add('active'); ring?.classList.add('active'); });
    el.addEventListener('mouseleave', () => { cursor?.classList.remove('active'); ring?.classList.remove('active'); });
  });

  // Scroll progress and chapter label
  const progress = $('#progress-bar'), navChapter = $('#nav-chapter'), sections = $$('[data-chapter]');
  function scrollUI() {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    let current = 'Prologue';
    sections.forEach(s => { if (scrollY >= s.offsetTop - innerHeight * .42) current = s.dataset.chapter; });
    if (navChapter) navChapter.textContent = current;
  }
  addEventListener('scroll', scrollUI, {passive:true}); scrollUI();

  // Scroll reveals
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
    }), {threshold:.12});
    $$('.reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));
  } else $$('.reveal-left, .reveal-right').forEach(el => el.classList.add('visible'));

  // Subtle mouse-reactive title highlight
  const heroTitle = $('.hero-title');
  addEventListener('pointermove', e => {
    if (!heroTitle) return;
    const r = heroTitle.getBoundingClientRect();
    heroTitle.style.setProperty('--mouse-x', `${Math.max(0, Math.min(100, (e.clientX-r.left)/r.width*100))}%`);
    heroTitle.style.setProperty('--mouse-y', `${Math.max(0, Math.min(100, (e.clientY-r.top)/r.height*100))}%`);
  }, {passive:true});

  // horizontal ticker
  const ticker = $('.h-scroll-track');
  if (ticker) {
    let offset = 0, previous = 0, halfWidth = 0, paused = false;
    const measureTicker = () => { halfWidth = ticker.scrollWidth / 2; };
    measureTicker(); addEventListener('resize', measureTicker);
    ticker.parentElement?.addEventListener('mouseenter', () => paused = true);
    ticker.parentElement?.addEventListener('mouseleave', () => paused = false);
    function tickerFrame(now) {
      if (!previous) previous = now;
      const dt = Math.min((now-previous)/1000, .05); previous = now;
      if (!paused && halfWidth > 0) { offset = (offset + 42*dt) % halfWidth; ticker.style.transform = `translate3d(${-offset}px,0,0)`; }
      requestAnimationFrame(tickerFrame);
    }
    requestAnimationFrame(tickerFrame);
  }

  // Gentle parallax
  addEventListener('scroll', () => {
    const y = Math.min(scrollY, innerHeight), hero = $('.hero-content');
    if (hero && innerWidth > 800) hero.style.transform = `translateY(${y * .12}px)`;
  }, {passive:true});

  // Load the supplied GLB
  function initRifle() {
    const host = $('#rifle3d'), canvas = $('#rifleCanvas'), fallback = $('#rifleFallback');
    if (!host || !canvas) return;
    if (!window.THREE || !THREE.GLTFLoader) {
      if (fallback) fallback.textContent = '3D viewer could not start — check the Three.js connection.';
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, host.clientWidth / Math.max(1, host.clientHeight), .01, 1000);
    const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);

    scene.add(new THREE.HemisphereLight(0xe7f3ef, 0x292018, 1.45));
    const key = new THREE.DirectionalLight(0xffe4bd, 2.25); key.position.set(4, 7, 8); scene.add(key);
    const fill = new THREE.DirectionalLight(0x9ecdc2, 1.2); fill.position.set(-6, 2, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xd7e5ff, 1.5); rim.position.set(1, 5, -7); scene.add(rim);

    const pivot = new THREE.Group(); scene.add(pivot);
    let model = null, dragging = false, lastX = 0, lastY = 0, velocity = 0, zoom = 1, baseDistance = 8, lastDragAt = 0;
    const loader = new THREE.GLTFLoader();
    loader.load('rifle-model.glb', gltf => {
      model = gltf.scene;
      // Fix transparency flags
      model.traverse(obj => {
        if (!obj.isMesh) return;
        obj.castShadow = true; obj.receiveShadow = true;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(mat => {
          if (!mat) return;
          mat.transparent = false;
          mat.opacity = 1;
          mat.depthWrite = true;
          mat.blending = THREE.NormalBlending;
          if ('transmission' in mat) mat.transmission = 0;
          if ('alphaTest' in mat) mat.alphaTest = 0;
          if (mat.color) mat.color.setRGB(mat.color.r, mat.color.g, mat.color.b);
          mat.needsUpdate = true;
        });
      });
      // Center and scale from model bounds
      let box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      //source rifle upright
      model.rotation.x = -Math.PI / 2;
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(7.6 / maxDim);
      pivot.add(model);
      box = new THREE.Box3().setFromObject(pivot);
      const fitted = box.getSize(new THREE.Vector3());
      baseDistance = Math.max(5.8, fitted.length() * 1.12);
      camera.position.set(0, fitted.y * .45 + .15, baseDistance);
      camera.lookAt(0, 0, 0);
      if (fallback) fallback.style.display = 'none';
    }, xhr => {
      if (xhr.total && $('#loaderPct')) $('#loaderPct').textContent = Math.min(99, Math.round(xhr.loaded / xhr.total * 100));
    }, err => {
      console.error('Unable to load rifle-model.glb', err);
      if (fallback) { fallback.style.display = 'grid'; fallback.textContent = 'Could not load rifle-model.glb — keep it beside index.html.'; }
    });

    host.addEventListener('pointerdown', e => { dragging = true; lastDragAt = performance.now(); lastX = e.clientX; lastY = e.clientY; host.setPointerCapture(e.pointerId); });
    host.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      pivot.rotation.y += dx * .008; pivot.rotation.x = THREE.MathUtils.clamp(pivot.rotation.x + dy * .004, -1.2, 1.2); lastDragAt = performance.now();
      lastX = e.clientX; lastY = e.clientY; velocity = dx * .0015;
    });
    const stopDrag = () => { dragging = false; };
    host.addEventListener('pointerup', stopDrag); host.addEventListener('pointercancel', stopDrag); host.addEventListener('lostpointercapture', stopDrag);
    host.addEventListener('wheel', e => { e.preventDefault(); zoom = THREE.MathUtils.clamp(zoom + Math.sign(e.deltaY) * .08, .72, 1.65); }, {passive:false});
    function render() {
      if (!dragging) {
        const idleSpeed = (performance.now() - lastDragAt > 1800) ? 0.0032 : 0;
        pivot.rotation.y += velocity + idleSpeed; velocity *= .90;
      }
      camera.position.z += (baseDistance / zoom - camera.position.z) * .08;
      renderer.render(scene, camera); requestAnimationFrame(render);
    }
    render();
    addEventListener('resize', () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    });
  }
  initRifle();
})();
