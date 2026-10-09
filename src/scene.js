import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// An illustrative procedural model. Dimensions and internals are not engineering data.
function woodTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(512, 1024);
  for (let y = 0; y < 1024; y++) for (let x = 0; x < 512; x++) {
    const warp = x + 13*Math.sin(y*.009+x*.006) + 5*Math.sin(y*.022+x*.013);
    const grain = Math.sin(warp*.29)*5 + Math.sin(warp*.85)*3 + Math.sin(warp*.055+y*.003)*13;
    const pore = Math.sin(x*4.83+y*1.77)*Math.sin(y*.127)*2.5;
    const knot = Math.sin(Math.sqrt((x-340)**2+(y-420)**2*.04)*.2)*5;
    const index = (y*512+x)*4; const v = grain+pore+knot;
    image.data[index] = 117+v; image.data[index+1] = 76+v*.75; image.data[index+2] = 47+v*.48; image.data[index+3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(1.8,1);
  return texture;
}
function compositeTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#282e2b';ctx.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=8)for(let x=0;x<128;x+=8){
    const vertical=(x/8+y/8)%2===0;
    for(let i=0;i<4;i++){ctx.strokeStyle=i%2?'#353c37':'#202723';ctx.lineWidth=1;ctx.beginPath();
      if(vertical){ctx.moveTo(x+i*2,y);ctx.lineTo(x+i*2,y+8);}else{ctx.moveTo(x,y+i*2);ctx.lineTo(x+8,y+i*2);}ctx.stroke();}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(4,6);return texture;
}
function buildModel() {
  const root=new THREE.Group(),groups={},anchors={};
  const grain=woodTexture(),weave=compositeTexture();
  const materials={
    wood:new THREE.MeshPhysicalMaterial({map:grain,roughness:.48,metalness:0,clearcoat:.2,clearcoatRoughness:.48,bumpMap:grain,bumpScale:.003}),
    metal:new THREE.MeshStandardMaterial({color:0xafb1a8,metalness:.94,roughness:.34}),
    composite:new THREE.MeshPhysicalMaterial({map:weave,roughness:.44,metalness:.22,clearcoat:.18,bumpMap:weave,bumpScale:.004}),
    rubber:new THREE.MeshStandardMaterial({color:0x252c25,roughness:.85}),
    light:new THREE.MeshStandardMaterial({color:0xe9ffd4,emissive:0xd5ffb0,emissiveIntensity:1.1,roughness:.3}),
    dark:new THREE.MeshStandardMaterial({color:0x31362e,metalness:.6,roughness:.4})
  };
  function mesh(parent,geometry,material,position=[0,0,0]){const m=new THREE.Mesh(geometry,material);m.position.set(...position);parent.add(m);return m;}
  function cylinder(parent,r,h,mat,y=0){return mesh(parent,new THREE.CylinderGeometry(r,r,h,64),mat,[0,y,0]);}
  // One model unit represents 15 cm. Every main section is exactly 2 units
  // long (30 cm), and all three share the same 0.20-unit outer radius.
  const sectionLength=2,outerRadius=.20;
  function section(id,y,offsetY,material){
    const g=new THREE.Group();g.position.y=y;g.userData.base=new THREE.Vector3(0,y,0);g.userData.offset=new THREE.Vector3(0,offsetY,0);
    g.userData.lengthCm=30;g.userData.outerRadius=outerRadius;root.add(g);groups[id]=g;
    const shape=[[0,-1],[.185,-1],[outerRadius,-.983],[outerRadius,.983],[.185,1],[0,1]].map(p=>new THREE.Vector2(...p));
    mesh(g,new THREE.LatheGeometry(shape,72),material);anchors[id]=[0,0,0];return g;
  }
  const walnut=section('walnut',2,.9,materials.wood);
  // Flush integrated accents are part of this section, never additional exploded pieces.
  cylinder(walnut,.2002,.045,materials.light,.77);
  cylinder(walnut,.2004,.012,materials.metal,.742);
  cylinder(walnut,.2004,.012,materials.metal,.798);
  const control=mesh(walnut,new THREE.SphereGeometry(.034,24,12),materials.dark,[.193,.14,.037]);control.scale.set(.25,1.55,1);
  const metal=section('metal',0,0,materials.metal);
  const composite=section('composite',-2,-.9,materials.composite);
  cylinder(composite,.2002,.11,materials.rubber,-.942);
  // Illustrative joint pilots are attached to the sections and hidden when assembled.
  for(const g of [walnut,metal]){cylinder(g,.112,.25,materials.dark,-1.095);cylinder(g,.114,.025,materials.metal,-1.2);}
  return {root,groups,anchors,materials,sectionLength,outerRadius};
}

export function createMotickScene(host,options={}) {
  const hero=Boolean(options.hero);
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.setAttribute('tabindex','-1');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(hero?30:32,1,.1,60);
  const pmrem=new THREE.PMREMGenerator(renderer), environment=new RoomEnvironment();
  scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff,0x687358,2.4));
  const key=new THREE.DirectionalLight(0xfff4df,3.8);key.position.set(4,7,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0xe3f1dc,2.4);fill.position.set(-4,1,-2);scene.add(fill);
  const model=buildModel();scene.add(model.root);
  let current=0,target=0,yaw=hero?-.4:-.42,targetYaw=yaw;
  let reducedMotion=Boolean(options.reducedMotion),visible=true,active=true,raf=0,disposed=false;
  let selected='walnut',width=1,height=1;
  const vector=new THREE.Vector3();
  const labelOffsets={walnut:[-96,-5],metal:[96,0],composite:[-105,5]};
  function size() {
    width=host.clientWidth;height=host.clientHeight;if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    if(hero){camera.position.set(0,0,width<600?8.5:6.6);model.root.rotation.set(.10,yaw,-1.12);model.root.scale.setScalar(width<600?.83:1);}
    else{camera.position.set(0,.05,Math.max(15.6,9.4/(camera.aspect*.57)));model.root.rotation.set(-.04,yaw,-.12);}
    camera.lookAt(0,0,0);camera.updateProjectionMatrix();invalidate();
  }
  function render() {
    raf=0;if(disposed||!visible||!active)return;
    current=reducedMotion?target:THREE.MathUtils.lerp(current,target,.13);
    yaw=reducedMotion?targetYaw:THREE.MathUtils.lerp(yaw,targetYaw,.16);
    if(Math.abs(target-current)<.0005)current=target;
    if(Math.abs(targetYaw-yaw)<.0005)yaw=targetYaw;
    for(const g of Object.values(model.groups))g.position.copy(g.userData.base).addScaledVector(g.userData.offset,current);
    model.root.rotation.y=yaw;
    renderer.render(scene,camera);
    if(!hero && options.onLabels) {
      const positions={};
      for(const [id,g] of Object.entries(model.groups)) {
        vector.set(...model.anchors[id]);g.localToWorld(vector);vector.project(camera);
        const mobile=width<480,offset=labelOffsets[id];
        const x=(vector.x*.5+.5)*width+offset[0]*(mobile?.68:1);
        const y=(-vector.y*.5+.5)*height+offset[1];
        positions[id]={x:THREE.MathUtils.clamp(x,mobile?58:70,width-(mobile?58:70)),y:THREE.MathUtils.clamp(y,40,height-30)};
      }
      options.onLabels(positions);
    }
    host.dataset.sections='3';host.dataset.sectionLengths='30,30,30';host.dataset.uniformDiameter='true';host.dataset.explosion=current.toFixed(3);host.dataset.rotation=yaw.toFixed(3);
    if(current!==target || yaw!==targetYaw)invalidate();
  }
  function invalidate(){if(!raf&&visible&&active&&!disposed)raf=requestAnimationFrame(render);}
  host.append(renderer.domElement);
  const resizeObserver=new ResizeObserver(size);resizeObserver.observe(host);
  // Smooth scrolling can queue several intersection changes before this callback.
  // The most recent entry reflects the current visibility of this one host.
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[entries.length-1].isIntersecting;if(visible)invalidate();else if(raf){cancelAnimationFrame(raf);raf=0;}},{rootMargin:'100px'});visibilityObserver.observe(host);
  const onVisibility=()=>{if(!document.hidden)invalidate();};document.addEventListener('visibilitychange',onVisibility);
  let pointer=null;
  if(!hero) {
    renderer.domElement.addEventListener('pointerdown',event=>{if(event.button!==0)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,last:event.clientX,drag:false};});
    renderer.domElement.addEventListener('pointermove',event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      if(event.buttons===0){pointer=null;return;}
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      if(!pointer.drag&&Math.abs(dy)>Math.abs(dx)+8){pointer=null;return;}
      if(Math.abs(dx)>6){pointer.drag=true;renderer.domElement.setPointerCapture(event.pointerId);}
      if(pointer.drag){targetYaw+=(event.clientX-pointer.last)*.008;invalidate();}
      pointer.last=event.clientX;
    });
    const end=()=>{pointer=null;};renderer.domElement.addEventListener('pointerup',end);renderer.domElement.addEventListener('pointercancel',end);
  }
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();active=false;disposed=true;if(raf)cancelAnimationFrame(raf);resizeObserver.disconnect();visibilityObserver.disconnect();options.onContextLost?.();if(hero)host.classList.remove('ready');});
  size();renderer.render(scene,camera);
  return {
    setExplosion(value,immediate=false){target=value;if(immediate)current=value;invalidate();},
    select(id){selected=id;host.dataset.selected=selected;invalidate();},
    rotate(delta){targetYaw+=delta;invalidate();},
    reset(){targetYaw=hero?-.4:-.42;invalidate();},
    setActive(value){active=value;if(active)invalidate();else if(raf){cancelAnimationFrame(raf);raf=0;}},
    setReducedMotion(value){reducedMotion=value;invalidate();}
  };
}
