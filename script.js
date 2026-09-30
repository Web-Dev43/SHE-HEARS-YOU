import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const $=id=>document.getElementById(id);
const canvas=$("world"),startScreen=$("startScreen"),startButton=$("startButton"),objective=$("objectiveText"),message=$("messageText"),hint=$("interactHint"),danger=$("danger"),chat=$("chat"),chatButton=$("chatButton"),closeChat=$("closeChat"),chatForm=$("chatForm"),chatInput=$("chatInput"),chatMessages=$("chatMessages"),action=$("actionButton"),joystick=$("joystick"),stick=$("stick");

let started=false,ended=false,hasKey=false,hasNote=false,drawerOpen=false,frontDoorOpen=false;
let state="calm",suspicion=0,anger=0,attachment=0,messageTimer=0,lookPointer=null,lastX=0,lastY=0,joyX=0,joyY=0;
const keys={},conversation=[];
const scene=new THREE.Scene();scene.background=new THREE.Color(0x08090a);scene.fog=new THREE.Fog(0x08090a,9,28);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,55);camera.position.set(-6.2,1.62,5.1);camera.rotation.order="YXZ";
let yaw=-Math.PI/2,pitch=0;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.72;
const colliders=[],objects=[],lights=[];

const M={wall:new THREE.MeshStandardMaterial({color:0x45403e,roughness:.92}),floor:new THREE.MeshStandardMaterial({color:0x252322,roughness:.94}),wood:new THREE.MeshStandardMaterial({color:0x4b3327,roughness:.82}),darkWood:new THREE.MeshStandardMaterial({color:0x2b211c,roughness:.9}),fabric:new THREE.MeshStandardMaterial({color:0x3b3c40,roughness:1}),metal:new THREE.MeshStandardMaterial({color:0x62666a,roughness:.65,metalness:.2}),glass:new THREE.MeshStandardMaterial({color:0x29343a,roughness:.18,metalness:.15,transparent:true,opacity:.55}),black:new THREE.MeshStandardMaterial({color:0x101113,roughness:.7}),paper:new THREE.MeshStandardMaterial({color:0xc9c1ae,roughness:1}),skin:new THREE.MeshStandardMaterial({color:0xc88f7d,roughness:.88}),hair:new THREE.MeshStandardMaterial({color:0x141216,roughness:1}),dress:new THREE.MeshStandardMaterial({color:0x542630,roughness:.9}),white:new THREE.MeshStandardMaterial({color:0xd4d0c8,roughness:1})};
function mesh(geo,material,x,y,z,cast=true,receive=true){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=receive;scene.add(m);return m}
function box(name,x,y,z,w,h,d,material,solid=true){const m=mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z);m.name=name;if(solid)colliders.push({x,z,w,d,ref:m});return m}
function addProp(o,type,label,range=1.45){objects.push({o,type,label,range});return o}
function wall(x,y,z,w,h,d){box("wall",x,y,z,w,h,d,M.wall,true)}
function roomDecor(){
  box("rug",0,.08,2.2,3.8,.04,3.4,new THREE.MeshStandardMaterial({color:0x393434,roughness:1}),false);
  box("bed",-6.45,.55,4.85,3.5,.7,2.45,M.fabric,true);box("mattress",-6.45,.91,4.85,3.25,.22,2.2,M.white,false);box("pillow",-7.35,1.08,4.85,.9,.18,1.6,M.white,false);
  box("headboard",-7.95,1.65,4.85,.15,2.2,2.7,M.darkWood,true);box("nightstand",-4.35,.52,5.35,.75,1.0,.75,M.wood,true);
  box("lampbase",-4.35,1.15,5.35,.18,.15,.18,M.metal,false);mesh(new THREE.CylinderGeometry(.22,.3,.34,12),M.white,-4.35,1.4,5.35,false,false);
  box("desk",-6.15,.68,1.25,2.6,1.3,.85,M.wood,true);box("deskTop",-6.15,1.36,1.25,2.7,.12,.9,M.darkWood,false);
  box("monitor",-6.15,1.85,1.2,1.15,.68,.1,M.black,false);box("monitorGlow",-6.15,1.85,1.14,.92,.5,.015,new THREE.MeshStandardMaterial({color:0x263238,emissive:0x172027,emissiveIntensity:.8}),false);
  box("couch",3.8,.62,5.15,3.35,1.15,1.35,M.fabric,true);box("couchBack",3.8,1.35,5.68,3.35,1.35,.28,M.fabric,true);box("cushion",3.1,1.02,5.0,1.25,.3,1.05,M.fabric,false);box("cushion2",4.45,1.02,5.0,1.25,.3,1.05,M.fabric,false);
  box("coffeeTable",3.8,.42,3.45,1.75,.65,.9,M.darkWood,true);box("mug",3.8,.79,3.45,.18,.16,.18,M.white,false);
  box("tvStand",6.25,.5,2.1,2.35,.8,.75,M.wood,true);box("tv",6.25,1.48,2.05,2.25,1.3,.16,M.black,true);box("tvScreen",6.25,1.5,1.94,1.92,1.0,.025,new THREE.MeshStandardMaterial({color:0x11181c,emissive:0x10171b,emissiveIntensity:.65}),false);
  box("counter",-6.2,.7,-4.75,3.4,1.35,.85,M.metal,true);box("counterTop",-6.2,1.42,-4.75,3.55,.12,.92,M.darkWood,false);
  box("fridge",-3.8,1.3,-5.1,1.15,2.6,1.05,M.white,true);box("fridgeHandle",-3.28,1.35,-4.55,.06,1.25,.06,M.metal,false);
  box("kitchenSink",-6.3,1.51,-4.75,.7,.05,.55,M.metal,false);
  box("diningTable",4.6,.76,-5.15,2.5,.16,1.55,M.wood,true);
  for(const [x,z] of [[3.55,-6.05],[5.65,-6.05],[3.55,-4.25],[5.65,-4.25]])box("chair",x,.55,z,.5,1.05,.5,M.wood,true);
  box("bathVanity",-5.8,.65,-1.9,2.2,1.2,.65,M.white,true);box("mirror",-5.8,1.9,-2.25,1.7,1.2,.08,M.glass,false);box("bathTub",-2.9,.5,-1.9,1.6,.8,2.2,M.white,true);
  box("hallRunner",0,.09,-1.2,1.1,.03,5.2,new THREE.MeshStandardMaterial({color:0x302a28,roughness:1}),false);
}
function buildHouse(){
  box("floor",0,0,0,18,.16,16,M.floor,false);
  wall(-9,1.55,0,.22,3.1,16);wall(9,1.55,0,.22,16,3.1);wall(0,1.55,-8,18,3.1,.22);wall(-5.5,1.55,8,7,3.1,.22);wall(1.8,1.55,8,10.4,3.1,.22);
  wall(-1.6,1.55,2.4,.18,3.1,11.2);wall(2.2,1.55,-4.4,7.6,3.1,.18);wall(-4.2,1.55,-1.7,.18,3.1,3.2);
  wall(-4.2,1.55,2.7,.18,3.1,2.8);
  box("ceiling",0,3.15,0,18,.12,16,new THREE.MeshStandardMaterial({color:0x2c2b2b,roughness:1}),false);
  roomDecor();
  const door=box("frontDoor",8.82,1.5,6.2,.18,3.0,2.2,M.darkWood,true);door.userData.frontDoor=true;addProp(door,"frontDoor","OPEN DOOR",2.2);
  const bedroomDoor=box("bedroomDoor",-1.6,1.5,5.35,.18,2.8,1.35,M.wood,true);addProp(bedroomDoor,"door","BEDROOM DOOR",1.8);
  const bathroomDoor=box("bathroomDoor",-4.2,1.5,.45,.18,2.8,1.1,M.wood,true);addProp(bathroomDoor,"door","BATHROOM DOOR",1.7);
  const drawer=box("drawer",-4.35,.78,5.0,.55,.22,.55,M.darkWood,true);drawer.userData.drawer=true;addProp(drawer,"drawer","OPEN DRAWER",1.5);
  const note=box("note",-6.15,1.46,1.25,.32,.02,.22,M.paper,false);note.rotation.y=.15;note.userData.note=true;addProp(note,"note","READ NOTE",1.35);
  const key=mesh(new THREE.BoxGeometry(.38,.045,.045),M.metal,0,0,0,false,false);key.position.set(4.25,.77,5.0);key.rotation.y=.4;key.userData.key=true;key.visible=true;addProp(key,"key","TAKE KEY",1.25);
  key.add(mesh(new THREE.TorusGeometry(.11,.025,8,18),M.metal,.2,.0,0,false,false));
}
buildHouse();

const hemi=new THREE.HemisphereLight(0x9ca4af,0x151311,.52);scene.add(hemi);
const moon=new THREE.DirectionalLight(0xa9bbd7,1.0);moon.position.set(-5,9,4);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-12;moon.shadow.camera.right=12;moon.shadow.camera.top=12;moon.shadow.camera.bottom=-12;scene.add(moon);
function ceilingLight(x,z,warm=.9){const p=new THREE.PointLight(0xffd8b0,warm,7,2);p.position.set(x,2.75,z);p.castShadow=true;scene.add(p);lights.push(p);mesh(new THREE.CylinderGeometry(.18,.28,.28,12),M.white,x,2.91,z,false,false)}
ceilingLight(-6,4.5,.8);ceilingLight(-5,-4.5,.75);ceilingLight(4,4.7,.9);ceilingLight(5,-4.7,.65);ceilingLight(0,0,.45);

const mara=new THREE.Group();mara.position.set(5.1,0,-4.0);scene.add(mara);mara.userData.target={x:5.1,z:-4};
const body=new THREE.Group();mara.add(body);
const torso=mesh(new THREE.CapsuleGeometry(.38,.72,6,12),M.dress,0,1.08,0);torso.scale.set(.88,1,.62);body.add(torso);
const head=mesh(new THREE.SphereGeometry(.38,18,14),M.skin,0,2.02,0,false,false);body.add(head);
const hairCap=mesh(new THREE.SphereGeometry(.42,18,12,0,Math.PI*2,0,Math.PI*.68),M.hair,0,2.12,0,false,false);body.add(hairCap);
for(const x of [-.14,.14])mesh(new THREE.SphereGeometry(.035,8,8),M.black,x,2.04,.36,false,false);
const armL=mesh(new THREE.CapsuleGeometry(.085,.58,5,8),M.skin,-.47,1.15,0,true,false),armR=mesh(new THREE.CapsuleGeometry(.085,.58,5,8),M.skin,.47,1.15,0,true,false);
const legL=mesh(new THREE.CapsuleGeometry(.105,.62,5,8),M.black,-.17,.42,0,true,false),legR=mesh(new THREE.CapsuleGeometry(.105,.62,5,8),M.black,.17,.42,0,true,false);
const hairBack=mesh(new THREE.CapsuleGeometry(.3,.65,6,10),M.hair,0,1.72,-.16,false,false);hairBack.scale.set(1,1,0.55);body.add(hairBack);
const maraLight=new THREE.PointLight(0x5b1727,.9,3);maraLight.position.set(0,1.45,.45);mara.add(maraLight);

function blocked(x,z,ignore=null){
 if(x<-8.35||x>8.35||z<-7.35||z>7.35)return true;
 for(const c of colliders){if(c.ref===ignore||!c.ref.visible)continue;if(x>c.x-c.w/2-.28&&x<c.x+c.w/2+.28&&z>c.z-c.d/2-.28&&z<c.z+c.d/2+.28)return true}
 return false;
}
function movePlayer(dx,dz){const nx=camera.position.x+dx,nz=camera.position.z+dz;if(!blocked(nx,camera.position.z))camera.position.x=nx;if(!blocked(camera.position.x,nz))camera.position.z=nz}
function showMessage(t){message.textContent=t;clearTimeout(messageTimer);messageTimer=setTimeout(()=>message.textContent=hasKey?"Find the front door.":"Explore the house.",3400)}
function nearest(){
 let best=null,bd=99;
 for(const a of objects){if(!a.o.visible)continue;const d=Math.hypot(camera.position.x-a.o.position.x,camera.position.z-a.o.position.z);if(d<a.range&&d<bd){bd=d;best=a}}
 const md=Math.hypot(camera.position.x-mara.position.x,camera.position.z-mara.position.z);
 if(md<1.7&&md<bd)best={type:"mara",label:"TALK TO MARA",range:1.7};
 return best;
}
function interact(){
 if(!started||ended)return;
 const a=nearest();if(!a)return;
 if(a.type==="key"){hasKey=true;a.o.visible=false;objective.textContent="Find the front door.";showMessage("A small key. Cold from the drawer.");addMara("You found that? I thought I'd hidden it better.");return}
 if(a.type==="note"){if(!hasNote){hasNote=true;objective.textContent="Find the key. Mara is hiding something.";showMessage("The note says: "She knows when you lie."");addMara("You found the note.");}else showMessage("The note still says: She knows when you lie.");return}
 if(a.type==="drawer"){drawerOpen=!drawerOpen;showMessage(drawerOpen?"The drawer opens with a soft click.":"You close the drawer.");if(drawerOpen&&!hasKey){const k=objects.find(o=>o.type==="key");if(k){k.o.position.set(-4.12,.91,5.02);}}return}
 if(a.type==="door"){showMessage("The door is stuck.");return}
 if(a.type==="frontDoor"){if(hasKey){frontDoorOpen=true;escapeGame()}else showMessage("Locked. The key isn't here.");return}
 if(a.type==="mara")openChat();
}
function escapeGame(){ended=true;document.exitPointerLock?.();$("endingTitle").textContent="YOU GOT OUT";$("endingText").textContent="The lock gives way. Behind you, Mara doesn't follow. For the first time, the house is completely silent.";$("endingScreen").style.display="flex"}
function updateInteraction(){
 const a=nearest();if(!started||ended||!a){hint.style.display="none";action.style.display=innerWidth<=600?"block":"none";return}
 hint.textContent=(innerWidth>600?"E / ":"")+a.label;hint.style.display="block";action.textContent=a.label;action.style.display=innerWidth<=600?"block":"none";
}
function lookingAtMara(){const dx=mara.position.x-camera.position.x,dz=mara.position.z-camera.position.z;const target=Math.atan2(dx,-dz),diff=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));return Math.abs(diff)<.3&&Math.hypot(dx,dz)<8}
function maraAI(dt){
 if(!started||ended)return;
 const dx=camera.position.x-mara.position.x,dz=camera.position.z-mara.position.z,d=Math.hypot(dx,dz);
 if(state==="chasing"){danger.classList.add("on");danger.textContent="SHE IS COMING";const nx=mara.position.x+dx/(d||1)*1.5*dt,nz=mara.position.z+dz/(d||1)*1.5*dt;if(!blocked(nx,mara.position.z,mara.userData.collider))mara.position.x=nx;if(!blocked(mara.position.x,nz,mara.userData.collider))mara.position.z=nz;mara.lookAt(camera.position.x,1.15,camera.position.z);if(d<1.05){state="watching";addMara("Why are you running from me?");showMessage("Mara caught up.");}return}
 danger.classList.toggle("on",state==="suspicious");danger.textContent="SHE IS LISTENING";
 mara.userData.timer=(mara.userData.timer||0)-dt;
 if(mara.userData.timer<=0){mara.userData.timer=3+Math.random()*4;const a=Math.random()*Math.PI*2,r=2.5+Math.random()*4;const tx=THREE.MathUtils.clamp(camera.position.x+Math.cos(a)*r,-7.3,7.3),tz=THREE.MathUtils.clamp(camera.position.z+Math.sin(a)*r,-6.5,6.5);if(!blocked(tx,tz))mara.userData.target={x:tx,z:tz}}
 const target=mara.userData.target||{x:5.1,z:-4},tx=target.x-mara.position.x,tz=target.z-mara.position.z,td=Math.hypot(tx,tz);
 if(td>.25){const sp=state==="suspicious"?.58:.38,nx=mara.position.x+tx/td*sp*dt,nz=mara.position.z+tz/td*sp*dt;if(!blocked(nx,mara.position.z))mara.position.x=nx;if(!blocked(mara.position.x,nz))mara.position.z=nz;mara.lookAt(camera.position.x,1.15,camera.position.z)}
 if(lookingAtMara()&&d<6&&state==="calm"){state="suspicious";suspicion+=8;showMessage("Mara noticed you watching her.");addMara("Why are you looking at me like that?")}
}
function animateMara(t){const target=mara.userData.target||mara.position,moving=Math.hypot(target.x-mara.position.x,target.z-mara.position.z)>.3,w=moving?Math.sin(t*.012)*.45:0;armL.rotation.x=w;armR.rotation.x=-w;legL.rotation.x=-w;legR.rotation.x=w;body.position.y=Math.abs(Math.sin(t*.006))*.025}

function addChat(cls,name,text){const d=document.createElement("div");d.className="chat-message "+cls;const s=document.createElement("strong"),p=document.createElement("p");s.textContent=name;p.textContent=text;d.append(s,p);chatMessages.appendChild(d);chatMessages.scrollTop=chatMessages.scrollHeight}
function addPlayer(t){addChat("you-message","YOU",t);conversation.push({role:"user",text:t})}
function addMara(t){addChat("she-message","MARA",t);conversation.push({role:"mara",text:t})}
function openChat(){if(ended)return;chat.classList.add("open");chatButton.style.display="none";setTimeout(()=>chatInput.focus(),40)}
function reply(raw){
 const t=raw.toLowerCase().replace(/[?!.,]/g,"").trim();
 if(/(shut up|stupid|idiot|hate you|leave me alone|annoying)/.test(t)){anger+=32;suspicion+=12;if(anger>=65){state="chasing";return"I was trying to keep you safe. Stop making me do this."}return"That wasn't very kind."}
 if(/(where am i|where are we)/.test(t))return"You're in the house. You came here because you wanted somewhere quiet.";
 if(/(why am i here|why did you bring me|how did i get here)/.test(t)){suspicion+=5;return"You told me you needed somewhere nobody could reach you. You don't remember saying that?"}
 if(/(outside|world|apocalypse|safe|danger)/.test(t)){suspicion+=5;return"Outside isn't what you think it is. Stay here and you won't have to find out."}
 if(/(who are you|your name)/.test(t))return"I'm Mara. You know that.";
 if(/(leave|escape|get out|let me out|door)/.test(t)){suspicion+=17;attachment+=3;if(suspicion>40){state="suspicious";return"Why are you planning to leave? We haven't finished talking."}return"The front door is locked. There's nowhere you need to go."}
 if(/(key|keys)/.test(t)){suspicion+=9;return hasKey?"You found it. So now you can leave, I suppose.":"There isn't a key you need to worry about."}
 if(/(note|drawer|bedroom)/.test(t))return hasNote?"You weren't supposed to read that.":"Some things in this house are private.";
 if(/(trust|believe)/.test(t))return suspicion>25?"You keep asking questions like you already decided I'm lying.":"I thought you trusted me.";
 if(/(help|save me)/.test(t))return"Tell me what you think you need saving from.";
 if(/(sorry)/.test(t)){anger=Math.max(0,anger-18);return"Then stay calm. We can start over."}
 if(/(hello|hi|hey)/.test(t))return"Hi. I was wondering when you'd say something.";
 if(/(thank)/.test(t))return"You're welcome.";
 if(lookingAtMara())return"Why are you looking at me like that?";
 return conversation.length>4?["You keep circling around the same question.","I heard you. I'm listening.","You remember more than you're telling me.","Keep talking."][Math.floor(Math.random()*4)]:["I heard you.","I'm listening.","Tell me what you remember."][Math.floor(Math.random()*3)];
}
chatButton.addEventListener("click",openChat);closeChat.addEventListener("click",()=>{chat.classList.remove("open");chatButton.style.display=""});action.addEventListener("click",interact);
chatForm.addEventListener("submit",e=>{e.preventDefault();const t=chatInput.value.trim();if(!started||ended||!t)return;addPlayer(t);chatInput.value="";setTimeout(()=>addMara(reply(t)),350)});

function setJoy(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=r.width*.34,d=Math.hypot(dx,dy)||1,k=Math.min(1,m/d);joyX=dx/m*k;joyY=dy/m*k;stick.style.left=(50+joyX*34)+"%";stick.style.top=(50+joyY*34)+"%"}
function resetJoy(){joyX=joyY=0;stick.style.left="50%";stick.style.top="50%"}
joystick.addEventListener("pointerdown",e=>{joystick.setPointerCapture(e.pointerId);setJoy(e)});joystick.addEventListener("pointermove",e=>{if(e.buttons)setJoy(e)});joystick.addEventListener("pointerup",resetJoy);joystick.addEventListener("pointercancel",resetJoy);
canvas.addEventListener("pointerdown",e=>{if(innerWidth<=600&&started&&!chat.classList.contains("open")){lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener("pointermove",e=>{if(e.pointerId===lookPointer){yaw+=(e.clientX-lastX)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.006,-1.22,1.22);lastX=e.clientX;lastY=e.clientY}});
canvas.addEventListener("pointerup",e=>{if(e.pointerId===lookPointer)lookPointer=null});canvas.addEventListener("pointercancel",e=>{if(e.pointerId===lookPointer)lookPointer=null});
document.addEventListener("mousemove",e=>{if(started&&document.pointerLockElement===canvas){yaw-=e.movementX*.0025;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0025,-1.22,1.22)}});
document.addEventListener("click",()=>{if(started&&!ended&&innerWidth>600&&document.pointerLockElement!==canvas&&!chat.classList.contains("open"))canvas.requestPointerLock?.()});
addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==="e")interact()});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
startButton.addEventListener("click",()=>{if(started)return;started=true;startScreen.style.display="none";objective.textContent="Explore the house.";showMessage("Mara is somewhere in the house.");if(innerWidth>600)canvas.requestPointerLock?.()});
$("againButton").addEventListener("click",()=>location.reload());

function update(dt){if(!started||ended)return;let f=(keys.w?1:0)-(keys.s?1:0)-joyY,str=(keys.d?1:0)-(keys.a?1:0)+joyX,n=Math.hypot(f,str);if(n>1){f/=n;str/=n}const speed=3.15,ca=Math.cos(yaw),sa=Math.sin(yaw);movePlayer((ca*f+sa*str)*speed*dt,(sa*f-ca*str)*speed*dt);updateInteraction();maraAI(dt)}
function render(t){camera.rotation.y=yaw;camera.rotation.x=pitch;renderer.render(scene,camera);animateMara(t)}
const clock=new THREE.Clock();function loop(t){const dt=Math.min(.05,clock.getDelta());update(dt);render(t);requestAnimationFrame(loop)}requestAnimationFrame(loop);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
