/* Canada 1914–1918 — interactive exhibit */
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  // Loader
  let pct = 0;
  const loaderTimer = setInterval(() => {
    pct = Math.min(100, pct + Math.random() * 18);
    $('#loaderPct').textContent = Math.floor(pct);
    $('#loaderBarFill').style.width = pct + '%';
    if (pct >= 100) { clearInterval(loaderTimer); setTimeout(() => $('#loader').classList.add('hidden'), 300); }
  }, 80);

  // Starfield
  const canvas = $('#starfield'), ctx = canvas.getContext('2d');
  let stars = [];
  function resizeStars() { canvas.width = innerWidth; canvas.height = innerHeight; stars = Array.from({length: 170}, () => ({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.25+.2,a:Math.random()*.7+.15,s:Math.random()*.004+.001})); }
  function starLoop(t) { ctx.clearRect(0,0,canvas.width,canvas.height); for(const s of stars){ctx.globalAlpha=s.a*(.65+.35*Math.sin(t*s.s));ctx.fillStyle='#dce9ed';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();} ctx.globalAlpha=1; requestAnimationFrame(starLoop); }
  resizeStars(); addEventListener('resize', resizeStars); requestAnimationFrame(starLoop);

  // Cursor
  const cursor=$('#cursor'), ring=$('#cursor-ring'); let mx=-100,my=-100,rx=-100,ry=-100;
  addEventListener('mousemove', e=>{mx=e.clientX;my=e.clientY;});
  function cursorLoop(){cursor.style.left=mx+'px';cursor.style.top=my+'px';rx+=(mx-rx)*.12;ry+=(my-ry)*.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(cursorLoop)} cursorLoop();
  $$('a, .rifle-stage, .image-frame').forEach(el=>{el.addEventListener('mouseenter',()=>{cursor.classList.add('active');ring.classList.add('active')});el.addEventListener('mouseleave',()=>{cursor.classList.remove('active');ring.classList.remove('active')});});

  // Scroll progress + chapter label
  const progress=$('#progress-bar'), navChapter=$('#nav-chapter'), sections=$$('[data-chapter]');
  function scrollUI(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(scrollY/max*100)+'%';let current='Prologue';sections.forEach(s=>{if(scrollY>=s.offsetTop-innerHeight*.42) current=s.dataset.chapter});navChapter.textContent=current;}
  addEventListener('scroll',scrollUI,{passive:true}); scrollUI();

  // Reveal
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12}); $$('.reveal-left,.reveal-right').forEach(el=>revealObserver.observe(el));

  // Parallax hero
  addEventListener('scroll',()=>{const y=Math.min(scrollY,innerHeight);const hero=$('.hero-content');if(hero)hero.style.transform=`translateY(${y*.22}px)`},{passive:true});

  // Three.js Ross rifle — load the supplied GLB and normalize its materials.
  function initRifle(){
    const host=$('#rifle3d'), canvas=$('#rifleCanvas'), fallback=$('#rifleFallback');
    if(!window.THREE || !host || !canvas) return;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(35,host.clientWidth/Math.max(host.clientHeight,1),.01,1000);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(host.clientWidth,host.clientHeight);
    renderer.setClearColor(0x05080b,1);
    if(THREE.sRGBEncoding) renderer.outputEncoding=THREE.sRGBEncoding;
    if(THREE.ACESFilmicToneMapping!==undefined) renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.15;

    scene.add(new THREE.HemisphereLight(0xdcecff,0x382719,2.0));
    const key=new THREE.DirectionalLight(0xffe5c2,3.0); key.position.set(4,7,8); scene.add(key);
    const fill=new THREE.DirectionalLight(0x9abaff,2.0); fill.position.set(-5,2,4); scene.add(fill);
    const rim=new THREE.DirectionalLight(0x64ffda,2.0); rim.position.set(-4,4,-6); scene.add(rim);

    const pivot=new THREE.Group(); scene.add(pivot);
    let model=null, dragging=false, lastX=0,lastY=0,vel=0;
    const loader=new THREE.GLTFLoader();
    loader.load('rifle-model.glb', gltf=>{
      model=gltf.scene;
      // This asset marks its single material as BLEND and supplies alpha > 1.
      // Force solid rendering while retaining the model's base colors/textures.
      model.traverse(obj=>{
        if(!obj.isMesh) return;
        obj.frustumCulled=false;
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        mats.forEach(mat=>{
          if(!mat) return;
          mat.transparent=false;
          mat.opacity=1;
          mat.depthWrite=true;
          mat.alphaTest=0;
          if(mat.color) mat.color.multiplyScalar(1.35);
          mat.needsUpdate=true;
        });
      });
      const bounds=new THREE.Box3().setFromObject(model);
      const center=bounds.getCenter(new THREE.Vector3());
      const size=bounds.getSize(new THREE.Vector3());
      model.position.sub(center);
      pivot.add(model);
      // Orient the rifle broadside and frame it regardless of source-model scale.
      pivot.rotation.set(.08,-.28,0);
      const maxDim=Math.max(size.x,size.y,size.z)||1;
      const distance=(maxDim*.5)/Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*1.35;
      camera.position.set(distance*.15,distance*.24,distance*1.05);
      camera.near=Math.max(.01,distance/100); camera.far=distance*100;
      camera.lookAt(0,0,0); camera.updateProjectionMatrix();
      if(fallback) fallback.style.display='none';
    }, undefined, err=>{
      console.error('Unable to load rifle-model.glb',err);
      if(fallback){fallback.textContent='Could not load rifle-model.glb';fallback.style.display='block';}
    });

    host.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;host.setPointerCapture(e.pointerId)});
    host.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;pivot.rotation.y+=dx*.008;pivot.rotation.x+=dy*.004;lastX=e.clientX;lastY=e.clientY;vel=dx*.002});
    const stopDrag=()=>dragging=false;
    host.addEventListener('pointerup',stopDrag); host.addEventListener('pointercancel',stopDrag); host.addEventListener('pointerleave',stopDrag);
    host.addEventListener('wheel',e=>{e.preventDefault();camera.position.multiplyScalar(e.deltaY>0?1.08:.92);},{passive:false});
    function render(){if(!dragging)pivot.rotation.y+=vel,vel*=.94;renderer.render(scene,camera);requestAnimationFrame(render)} render();
    addEventListener('resize',()=>{const w=host.clientWidth,h=Math.max(host.clientHeight,1);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()});
  }
  initRifle();
})();
