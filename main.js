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

  // Three.js Ross rifle GLB viewer
  function initRifle(){
    const host=$('#rifle3d'), canvas=$('#rifleCanvas'), fallback=$('#rifleFallback');
    if(!window.THREE || !host || !canvas) return;

    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0x05080b);
    const camera=new THREE.PerspectiveCamera(30,host.clientWidth/host.clientHeight,.01,1000);
    camera.position.set(0,1.2,7.5);

    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(host.clientWidth,host.clientHeight);
    renderer.outputEncoding=THREE.sRGBEncoding;

    scene.add(new THREE.HemisphereLight(0xd9eee8,0x17100c,1.45));
    const key=new THREE.DirectionalLight(0xffffff,2.6); key.position.set(5,7,8); scene.add(key);
    const rim=new THREE.DirectionalLight(0x8ad8c2,2.0); rim.position.set(-7,3,-5); scene.add(rim);
    const warm=new THREE.PointLight(0xd6b56d,1.15,18); warm.position.set(3,-1,4); scene.add(warm);

    const group=new THREE.Group(); scene.add(group);
    const loader=new THREE.GLTFLoader();
    let model=null;

    loader.load('rifle-model.glb', gltf=>{
      model=gltf.scene;
      model.traverse(o=>{
        if(o.isMesh){
          o.castShadow=true; o.receiveShadow=true;
          if(o.material){ o.material.side=THREE.DoubleSide; }
        }
      });
      const box=new THREE.Box3().setFromObject(model);
      const size=box.getSize(new THREE.Vector3());
      const center=box.getCenter(new THREE.Vector3());
      const maxAxis=Math.max(size.x,size.y,size.z)||1;
      const scale=5.9/maxAxis;
      model.scale.setScalar(scale);
      model.position.set(-center.x*scale,-center.y*scale,-center.z*scale);
      group.add(model);
      group.rotation.set(.08,-.34,.02);
      fallback.style.display='none';
    }, undefined, err=>{
      console.error('Could not load rifle-model.glb',err);
      fallback.textContent='Rifle model could not be loaded';
      fallback.style.display='grid';
    });

    let dragging=false,lastX=0,lastY=0,vel=0;
    host.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;host.setPointerCapture(e.pointerId)});
    host.addEventListener('pointermove',e=>{
      if(!dragging)return;
      const dx=e.clientX-lastX,dy=e.clientY-lastY;
      group.rotation.y+=dx*.008;
      group.rotation.x+=dy*.004;
      group.rotation.x=Math.max(-.65,Math.min(.65,group.rotation.x));
      lastX=e.clientX;lastY=e.clientY;vel=dx*.002;
    });
    host.addEventListener('pointerup',()=>dragging=false);
    host.addEventListener('pointercancel',()=>dragging=false);

    host.addEventListener('wheel',e=>{
      e.preventDefault();
      camera.position.z=Math.max(4.5,Math.min(11,camera.position.z+e.deltaY*.004));
    },{passive:false});

    function resize(){
      renderer.setSize(host.clientWidth,host.clientHeight);
      camera.aspect=host.clientWidth/host.clientHeight;
      camera.updateProjectionMatrix();
    }
    addEventListener('resize',resize);

    function render(){
      if(!dragging){ group.rotation.y+=vel; vel*=.94; }
      renderer.render(scene,camera);
      requestAnimationFrame(render);
    }
    render();
  }
  initRifle();
})();
