const canvas=document.getElementById("world"),startScreen=document.getElementById("startScreen"),startButton=document.getElementById("startButton"),diagnostic=document.getElementById("diagnostic");
let started=false;const keys={};let joyX=0,joyY=0,joyTouchId=null,lookTouchId=null,lastLookX=0,lastLookY=0,yaw=0,pitch=0;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xb8b0a4);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,100);camera.position.set(0,1.65,5);camera.rotation.order="YXZ";
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
const floor=new THREE.Mesh(new THREE.BoxGeometry(18,.2,14),new THREE.MeshStandardMaterial({color:0x766d65,roughness:.9}));floor.position.y=-.1;scene.add(floor);
const wallMat=new THREE.MeshStandardMaterial({color:0xc7beb3,roughness:.9});function wall(x,y,z,w,h,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wallMat);m.position.set(x,y,z);scene.add(m)}wall(0,1.5,-7,18,3,.25);wall(-9,1.5,0,.25,3,14);wall(9,1.5,0,.25,3,14);wall(0,1.5,7,18,3,.25);
function prop(x,y,z,w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.9}));m.position.set(x,y,z);scene.add(m)}
prop(-4,.35,-2,3.4,.7,2.4,0x777b82);prop(4,.65,-2.4,2.8,1.3,.8,0x8d6247);prop(3,.4,2.4,2,.8,1.1,0x76503b);
scene.add(new THREE.HemisphereLight(0xffead0,0x6d665f,2.5));const sun=new THREE.DirectionalLight(0xffead2,2.5);sun.position.set(-3,8,4);scene.add(sun);const ceiling=new THREE.PointLight(0xffd8b0,2.5,18);ceiling.position.set(0,2.7,0);scene.add(ceiling);
const colliders=[{x:0,z:-7,w:18,d:.25},{x:-9,z:0,w:.25,d:14},{x:9,z:0,w:.25,d:14},{x:0,z:7,w:18,d:.25},{x:-4,z:-2,w:3.4,d:2.4},{x:4,z:-2.4,w:2.8,d:.8},{x:3,z:2.4,w:2,d:1.1}];
function blocked(x,z){if(x<-8.5||x>8.5||z<-6.5||z>6.5)return true;for(const c of colliders)if(x>c.x-c.w/2-.28&&x<c.x+c.w/2+.28&&z>c.z-c.d/2-.28&&z<c.z+c.d/2+.28)return true;return false}
function movePlayer(dx,dz){const nx=camera.position.x+dx,nz=camera.position.z+dz;if(!blocked(nx,camera.position.z))camera.position.x=nx;if(!blocked(camera.position.x,nz))camera.position.z=nz}
const joystick=document.getElementById("joystick"),stick=document.getElementById("stick"),moveZone=document.getElementById("moveZone"),lookZone=document.getElementById("lookZone");
let movePointer=null,lookPointer=null;
function applyJoy(x,y){const r=joystick.getBoundingClientRect(),dx=x-(r.left+r.width/2),dy=y-(r.top+r.height/2),max=r.width*.34,len=Math.hypot(dx,dy)||1,k=Math.min(1,max/len);joyX=dx/max*k;joyY=dy/max*k;stick.style.left=(50+joyX*34)+"%";stick.style.top=(50+joyY*34)+"%"}
function resetJoy(){movePointer=null;joyX=joyY=0;stick.style.left="50%";stick.style.top="50%"}
moveZone.addEventListener("pointerdown",e=>{if(!started)return;e.preventDefault();movePointer=e.pointerId;moveZone.setPointerCapture(e.pointerId);applyJoy(e.clientX,e.clientY)},{passive:false});
moveZone.addEventListener("pointermove",e=>{if(e.pointerId===movePointer){e.preventDefault();applyJoy(e.clientX,e.clientY)}},{passive:false});
moveZone.addEventListener("pointerup",e=>{if(e.pointerId===movePointer)resetJoy()});
moveZone.addEventListener("pointercancel",resetJoy);
moveZone.addEventListener("lostpointercapture",resetJoy);
lookZone.addEventListener("pointerdown",e=>{if(!started)return;e.preventDefault();lookPointer=e.pointerId;lookZone.setPointerCapture(e.pointerId);lastLookX=e.clientX;lastLookY=e.clientY},{passive:false});
lookZone.addEventListener("pointermove",e=>{if(e.pointerId===lookPointer){e.preventDefault();yaw-=(e.clientX-lastLookX)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastLookY)*.006,-1.2,1.2);lastLookX=e.clientX;lastLookY=e.clientY}},{passive:false});
lookZone.addEventListener("pointerup",e=>{if(e.pointerId===lookPointer)lookPointer=null});
lookZone.addEventListener("pointercancel",e=>{if(e.pointerId===lookPointer)lookPointer=null});
addEventListener("keydown",e=>{if(e.target.tagName!=="INPUT")keys[e.key.toLowerCase()]=true});addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
function startGame(){if(started)return;started=true;startScreen.style.display="none";diagnostic.style.display="none"}startButton.addEventListener("click",startGame);startButton.addEventListener("touchend",e=>{e.preventDefault();startGame()},{passive:false});
function update(dt){if(!started)return;let f=(keys.w?1:0)-(keys.s?1:0)-joyY,s=(keys.d?1:0)-(keys.a?1:0)+joyX,n=Math.hypot(f,s);if(n>1){f/=n;s/=n}const speed=3.2,ca=Math.cos(yaw),sa=Math.sin(yaw);movePlayer((ca*f+sa*s)*speed*dt,(sa*f-ca*s)*speed*dt)}
function render(){camera.rotation.y=yaw;camera.rotation.x=pitch;renderer.render(scene,camera)}const clock=new THREE.Clock();function loop(){update(Math.min(clock.getDelta(),.05));render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
