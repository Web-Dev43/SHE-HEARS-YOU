import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas=document.getElementById("world");
const $=id=>document.getElementById(id);
const startScreen=$("startScreen"),startButton=$("startButton"),objectiveText=$("objectiveText"),messageText=$("messageText"),hint=$("interactHint"),danger=$("danger"),chat=$("chat"),chatButton=$("chatButton"),closeChat=$("closeChat"),chatForm=$("chatForm"),chatInput=$("chatInput"),chatMessages=$("chatMessages"),actionButton=$("actionButton"),joystick=$("joystick"),stick=$("stick");

let started=false,hasKey=false,ended=false,messageTimer,lookId=null,lx=0,ly=0,joyX=0,joyY=0;
let maraState="calm",maraTimer=0,conversation=[],suspicion=0,attachment=0,anger=0;
const held={};

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07090b);
scene.fog=new THREE.Fog(0x07090b,8,25);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,50);
camera.position.set(-5.2,1.65,5.2);
camera.rotation.order="YXZ";
let yaw=-Math.PI/2,pitch=0;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.8;

const colliders=[];
const interactables=[];
const clock=new THREE.Clock();

function box(name,x,y,z,w,h,d,mat,collide=true){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);
 if(collide)colliders.push({x,z,w,d});
 return m;
}
function mat(c,rough=1){return new THREE.MeshStandardMaterial({color:c,roughness:rough})}
const wallMat=mat(0x383337),floorMat=mat(0x24211f),wood=mat(0x4a3023),dark=mat(0x151719),fabric=mat(0x353943),metal=mat(0x55585c),red=mat(0x4d1823),skin=mat(0xd7a28d),hair=mat(0x161217),white=mat(0xd6d6d2);

box("floor",0,0,0,18,.15,16,floorMat,false);
for(let x=-9;x<=9;x+=2)box("wall",-9,1.5,x,.2,3.0,2,wallMat);
for(let x=-9;x<=9;x+=2)box("wall",9,1.5,x,.2,3.0,2,wallMat);
for(let z=-7;z<=7;z+=2)box("wall",z,1.5,-8,2,3,.2,wallMat);
for(let z=-7;z<=7;z+=2)if(z<5||z>7)box("wall",z,1.5,8,2,3,.2,wallMat);
box("divider",-1.2,1.5,0,.2,3,8,wallMat);
box("divider",2.8,1.5,-4,8,3,.2,wallMat);
box("divider",-4.2,1.5,1.8,.2,3,6,wallMat);

const ambient=new THREE.HemisphereLight(0x9aa0aa,0x11100e,.65);scene.add(ambient);
const moon=new THREE.DirectionalLight(0xb9c8ff,1.15);moon.position.set(-4,8,5);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);scene.add(moon);
function lamp(x,z){
 const l=new THREE.PointLight(0xffd9aa,1.2,7,2);l.position.set(x,2.6,z);l.castShadow=true;scene.add(l);
 const shade=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,.35,16),white);shade.position.set(x,2.85,z);scene.add(shade);
}
lamp(-5.8,4.8);lamp(4.8,4.8);lamp(5.2,-4.7);

function furniture(){
 const bed=box("bed",-6.8,0.55,4.8,3.5,.7,2.5,fabric);box("pillow",-7.55,.95,4.8,1.0,.25,1.7,white,false);
 box("nightstand",-4.55,.45,5.3,.7,.9,.7,wood);box("desk",-6.4,.65,1.6,2.5,1.3,.8,wood);box("monitor",-6.4,1.65,1.65,1.1,.7,.12,dark,false);
 box("couch",3.8,.65,5.4,3.2,1.1,1.25,fabric);box("coffee",3.8,.32,3.5,1.6,.55,.8,wood);
 box("tvstand",6.0,.5,2.2,2.5,.8,.7,wood);box("tv",6.0,1.55,2.15,2.2,1.3,.18,dark,false);
 box("kitchenCounter",-6.4,.7,-4.9,3.2,1.4,.8,metal);box("fridge",-3.9,1.2,-5.1,1.1,2.4,1.0,white);
 box("table",4.5,.75,-5.4,2.4,.15,1.5,wood);for(const x of [3.5,5.5])for(const z of [-6.1,-4.7])box("chair",x,.5,z,.45,1,.45,wood);
}
furniture();

const door=box("frontDoor",7.75,1.5,6.9,.18,3.0,2.0,dark);
const keyGroup=new THREE.Group();keyGroup.position.set(4.9,.28,4.1);scene.add(keyGroup);
const ring=new THREE.Mesh(new THREE.TorusGeometry(.12,.035,8,20),new THREE.MeshStandardMaterial({color:0x9b8751,metalness:.7,roughness:.3}));
const shaft=new THREE.Mesh(new THREE.BoxGeometry(.42,.05,.05),new THREE.MeshStandardMaterial({color:0x9b8751,metalness:.7,roughness:.3}));
ring.rotation.x=Math.PI/2;shaft.position.x=.25;keyGroup.add(ring,shaft);interactables.push({type:"key",object:keyGroup});

const mara=new THREE.Group();mara.position.set(5.0,0,-3.9);scene.add(mara);
const maraBody=new THREE.Group();mara.add(maraBody);
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.8,6,12),new THREE.MeshStandardMaterial({color:0x552631,roughness:.85}));torso.position.y=1.05;torso.scale.set(.85,1, .55);torso.castShadow=true;maraBody.add(torso);
const neck=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.2,10),skin);neck.position.y=1.68;maraBody.add(neck);
const head=new THREE.Mesh(new THREE.SphereGeometry(.38,16,12),skin);head.position.y=2.02;head.castShadow=true;maraBody.add(head);
const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.41,16,10,0,Math.PI*2,0,Math.PI*.62),hair);hairCap.position.set(0,2.12,0);maraBody.add(hairCap);
const fringe=new THREE.Mesh(new THREE.BoxGeometry(.7,.22,.25),hair);fringe.position.set(0,2.05,.32);maraBody.add(fringe);
function limb(x,y,z,sx,sy,sz,material,parent){
 const m=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.55,5,8),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;
}
const armL=limb(-.48,1.12,0,.9,1,.9,skin,maraBody),armR=limb(.48,1.12,0,.9,1,.9,skin,maraBody);
const legL=limb(-.18,.38,0,.95,1,.95,dark,maraBody),legR=limb(.18,.38,0,.95,1,.95,dark,maraBody);
const eyeMat=mat(0x111111);
for(const x of [-.14,.14]){const e=new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),eyeMat);e.position.set(x,2.04,.36);maraBody.add(e)}
const maraLight=new THREE.PointLight(0x5a1728,1.1,3);maraLight.position.set(0,1.4,.4);mara.add(maraLight);

function blocked(x,z){
 if(x<-8.35||x>8.35||z<-7.35||z>7.35)return true;
 for(const c of colliders)if(x>c.x-c.w/2-.3&&x<c.x+c.w/2+.3&&z>c.z-c.d/2-.3&&z<c.z+c.d/2+.3)return true;
 return false;
}
function tryMove(x,z){if(!blocked(x,camera.position.z))camera.position.x=x;if(!blocked(camera.position.x,z))camera.position.z=z}

function lookingAtMara(){
 const dx=mara.position.x-camera.position.x,dz=mara.position.z-camera.position.z;
 const a=Math.atan2(dx,-dz),diff=Math.atan2(Math.sin(a-yaw),Math.cos(a-yaw));
 return Math.abs(diff)<.28&&Math.hypot(dx,dz)<9;
}
function maraCanSeePlayer(){return Math.hypot(camera.position.x-mara.position.x,camera.position.z-mara.position.z)<7}

function move(dt){
 if(!started||ended)return;
 let f=(held.w||held.arrowup?1:0)-(held.s||held.arrowdown?1:0)-joyY;
 let str=(held.d||held.arrowright?1:0)-(held.a||held.arrowleft?1:0)+joyX;
 const n=Math.hypot(f,str);if(n>1){f/=n;str/=n}
 const speed=3.2,ca=Math.cos(yaw),sa=Math.sin(yaw);
 tryMove(camera.position.x+(ca*f+sa*str)*speed*dt,camera.position.z+(sa*f-ca*str)*speed*dt);
 updateMara(dt);check();
}
function updateMara(dt){
 const dx=camera.position.x-mara.position.x,dz=camera.position.z-mara.position.z,d=Math.hypot(dx,dz);
 if(maraState==="chasing"){
  danger.classList.add("on");danger.textContent="SHE IS CHASING YOU";
  const td=d||1,nx=mara.position.x+dx/td*1.75*dt,nz=mara.position.z+dz/td*1.75*dt;
  if(!blocked(nx,mara.position.z))mara.position.x=nx;if(!blocked(mara.position.x,nz))mara.position.z=nz;
  mara.lookAt(camera.position.x,1.2,camera.position.z);
  if(d<1.1){maraState="watching";anger=Math.max(anger-8,40);showMessage("Mara caught up.");addMara("Why are you running from me?")}
  return;
 }
 danger.classList.toggle("on",maraState==="suspicious");danger.textContent=maraState==="suspicious"?"SHE IS LISTENING":"";
 maraTimer-=dt;
 if(maraState==="angry"){maraState="chasing";showMessage("Mara is coming for you.");return}
 if(maraTimer<=0){
  maraTimer=3+Math.random()*4;
  const a=Math.random()*Math.PI*2,r=2.5+Math.random()*3.5;
  const tx=THREE.MathUtils.clamp(camera.position.x+Math.cos(a)*r,-7.3,7.3),tz=THREE.MathUtils.clamp(camera.position.z+Math.sin(a)*r,-6.3,6.3);
  if(!blocked(tx,tz))mara.userData.target={x:tx,z:tz};
 }
 const target=mara.userData.target||{x:5,z:-4};
 const tx=target.x-mara.position.x,tz=target.z-mara.position.z,td=Math.hypot(tx,tz);
 if(td>.25){
  const speed=maraState==="suspicious"?.65:.32,nx=mara.position.x+tx/td*speed*dt,nz=mara.position.z+tz/td*speed*dt;
  if(!blocked(nx,mara.position.z))mara.position.x=nx;if(!blocked(mara.position.x,nz))mara.position.z=nz;
  mara.lookAt(camera.position.x,1.2,camera.position.z);
 }
 if(lookingAtMara()&&d<6&&maraState==="calm"){maraState="suspicious";suspicion+=8;showMessage("Mara noticed you watching her.");addMara("Why are you looking at me like that?")}
}
function animateMara(t){
 const moving=mara.userData.target&&Math.hypot(mara.userData.target.x-mara.position.x,mara.userData.target.z-mara.position.z)>.3;
 const walk=moving?Math.sin(t*.012)*.42:0;
 armL.rotation.x=walk;armR.rotation.x=-walk;legL.rotation.x=-walk;legR.rotation.x=walk;
 maraBody.position.y=Math.abs(Math.sin(t*.006))* .025;
 if(maraState==="chasing")maraBody.rotation.z=Math.sin(t*.04)*.025;
 else maraBody.rotation.z=0;
}
function check(){
 const kd=Math.hypot(camera.position.x-keyGroup.position.x,camera.position.z-keyGroup.position.z);
 if(!hasKey&&kd<.55){hasKey=true;keyGroup.visible=false;objectiveText.textContent="Find the front door.";showMessage("Something cold presses into your palm.");addMara("You found it. I wondered how long that would take.")}
 const dd=Math.hypot(camera.position.x-7.75,camera.position.z-6.9),md=Math.hypot(camera.position.x-mara.position.x,camera.position.z-mara.position.z);
 if(dd<1.8){hint.textContent=hasKey?"E / OPEN DOOR":"LOCKED";hint.style.display="block";actionButton.textContent=hasKey?"OPEN DOOR":"LOCKED";actionButton.style.display=innerWidth<=600?"block":"none"}
 else if(md<2.1){hint.textContent="E / TALK TO MARA";hint.style.display="block";actionButton.textContent="TALK";actionButton.style.display=innerWidth<=600?"block":"none"}
 else{hint.style.display="none";actionButton.style.display="none"}
}
function interact(){
 if(!started||ended)return;
 const dd=Math.hypot(camera.position.x-7.75,camera.position.z-6.9),md=Math.hypot(camera.position.x-mara.position.x,camera.position.z-mara.position.z);
 if(dd<1.8){if(hasKey)escapeGame();else showMessage("The front door is locked.")}
 else if(md<2.1)openChat();
}
function escapeGame(){ended=true;$("endingTitle").textContent="YOU ESCAPED";$("endingText").textContent="The front door opens. The street outside is quiet. There was never an apocalypse."; $("endingScreen").style.display="flex"}
function showMessage(t){messageText.textContent=t;clearTimeout(messageTimer);messageTimer=setTimeout(()=>messageText.textContent=hasKey?"Find the front door.":"Look around the house.",3200)}
function openChat(){chat.classList.add("open");chatButton.style.display="none";setTimeout(()=>chatInput.focus(),50)}
chatButton.addEventListener("click",openChat);closeChat.addEventListener("click",()=>{chat.classList.remove("open");chatButton.style.display=""});
actionButton.addEventListener("click",interact);
chatForm.addEventListener("submit",e=>{e.preventDefault();if(!started||ended)return;const t=chatInput.value.trim();if(!t)return;addPlayer(t);chatInput.value="";conversation.push({role:"user",text:t});setTimeout(()=>addMara(reply(t)),420)});
function addChat(cls,name,text){const w=document.createElement("div");w.className="chat-message "+cls;const s=document.createElement("strong");s.textContent=name;const p=document.createElement("p");p.textContent=text;w.append(s,p);chatMessages.appendChild(w);chatMessages.scrollTop=chatMessages.scrollHeight}
function addPlayer(t){addChat("you-message","YOU",t)}function addMara(t){conversation.push({role:"mara",text:t});addChat("she-message","MARA",t)}
function reply(raw){
 const t=raw.toLowerCase().replace(/[?!.,]/g,"").trim();
 if(/(shut up|stupid|idiot|hate you|leave me alone|annoying)/.test(t)){anger+=35;suspicion+=12;if(anger>=70){maraState="angry";return"I gave you everything. And this is how you talk to me?"}return"That hurt. Why are you being like this?"}
 if(/(world|outside|apocalypse|end(ing)?|danger|safe)/.test(t)){suspicion+=5;return"Outside isn't safe. You know what happened. You don't need to see it yourself."}
 if(/(why|what do you mean|explain)/.test(t)&&conversation.length>2)return"You came here because you trusted me. You said you wanted somewhere safe. Why are you acting like I brought you here against your will?"
 if(/(who are you|your name)/.test(t))return"I'm Mara. Your girlfriend. You used to say my name like it meant home."
 if(/(girlfriend|relationship|love|loved)/.test(t)){attachment+=10;return"You are my girlfriend. I don't understand why you're questioning that now."}
 if(/(where am i|where are we)/.test(t))return"Home. Our house. The world outside is falling apart, but we're safe here."
 if(/(why am i here|why did you bring me|how did i get here)/.test(t)){suspicion+=4;return"You asked me to keep you safe. You were scared. You don't remember everything yet."}
 if(/(key|keys)/.test(t)){suspicion+=10;return hasKey?"You already found it.":"Why are you so interested in the door?"}
 if(/(escape|leave|get out|let me out|go outside)/.test(t)){suspicion+=18;attachment+=4;if(suspicion>=45){maraState="suspicious";return"Why do you keep talking about leaving me? I'm trying to protect you."}return"You can't go outside. Not now."}
 if(/(trust|believe)/.test(t))return suspicion>25?"You keep asking me to prove things. Maybe you're the one who changed.":"Of course you trust me. We're together."
 if(/(help|save me)/.test(t))return"From what? Me? Or the world outside?"
 if(/(sorry)/.test(t)){anger=Math.max(0,anger-20);return"I'll try to believe you. Just stay with me."}
 if(/(hello|hi|hey)/.test(t))return"Hi. I was wondering when you'd say something.";
 if(/(thank)/.test(t))return"You're welcome. See? We take care of each other.";
 if(lookingAtMara())return"Why are you looking at me like that?";
 return["I heard you.","Keep talking. I'm listening.","You don't remember as much as you think.","Tell me what you really mean."][Math.floor(Math.random()*4)];
}
function setJoy(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=r.width*.34,d=Math.hypot(dx,dy)||1,k=Math.min(1,m/d);joyX=dx/m*k;joyY=dy/m*k;stick.style.left=(50+joyX*34)+"%";stick.style.top=(50+joyY*34)+"%"}
function resetJoy(){joyX=joyY=0;stick.style.left="50%";stick.style.top="50%"}
joystick.addEventListener("pointerdown",e=>{joystick.setPointerCapture(e.pointerId);setJoy(e)});joystick.addEventListener("pointermove",e=>{if(e.buttons)setJoy(e)});joystick.addEventListener("pointerup",resetJoy);joystick.addEventListener("pointercancel",resetJoy);
canvas.addEventListener("pointerdown",e=>{if(innerWidth<=600&&started){lookId=e.pointerId;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener("pointermove",e=>{if(e.pointerId===lookId){yaw+=(e.clientX-lx)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-ly)*.006,-1.25,1.25);lx=e.clientX;ly=e.clientY}});
canvas.addEventListener("pointerup",e=>{if(e.pointerId===lookId)lookId=null});canvas.addEventListener("pointercancel",e=>{if(e.pointerId===lookId)lookId=null});

document.addEventListener("click",()=>{if(started&&!ended&&innerWidth>600&&document.pointerLockElement!==canvas)canvas.requestPointerLock?.()});
document.addEventListener("mousemove",e=>{if(started&&document.pointerLockElement===canvas){yaw-=e.movementX*.0025;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0025,-1.25,1.25)}});

addEventListener("keydown",e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;held[e.key.toLowerCase()]=true;if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase()))e.preventDefault();if(e.key.toLowerCase()==="e")interact()});
addEventListener("keyup",e=>held[e.key.toLowerCase()]=false);

function startGame(e){if(e)e.preventDefault();if(started)return;started=true;startScreen.style.display="none";startScreen.style.visibility="hidden";startScreen.style.pointerEvents="none";objectiveText.textContent="Explore the house.";showMessage("Mara is somewhere in the house.");}
window.startGame=startGame;
startButton.addEventListener("click",startGame);

function render(){
 camera.rotation.y=yaw;camera.rotation.x=pitch;
 maraBody.traverse(o=>{if(o.isMesh)o.material.needsUpdate=true});
 renderer.render(scene,camera);
}
function loop(t){const dt=Math.min(.05,clock.getDelta());move(dt);animateMara(t);render();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
