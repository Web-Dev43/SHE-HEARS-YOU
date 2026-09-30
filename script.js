import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas=document.getElementById("world");
const game=document.getElementById("game");
const objectiveText=document.getElementById("objectiveText");
const messageText=document.getElementById("messageText");
const interactHint=document.getElementById("interactHint");
const startScreen=document.getElementById("startScreen");
const startButton=document.getElementById("startButton");
const endingScreen=document.getElementById("endingScreen");
const endingTitle=document.getElementById("endingTitle");
const endingText=document.getElementById("endingText");
const chat=document.getElementById("chat");
const chatButton=document.getElementById("chatButton");
const closeChat=document.getElementById("closeChat");
const chatForm=document.getElementById("chatForm");
const chatInput=document.getElementById("chatInput");
const chatMessages=document.getElementById("chatMessages");
const joystick=document.getElementById("joystick");
const stick=document.getElementById("stick");

let gameStarted=false,hasKey=false,gameEnded=false;
let messageTimeout;
let conversation=[];
const keys={};
const clock=new THREE.Clock();

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x050607);
scene.fog=new THREE.Fog(0x050607,8,30);

const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,100);
camera.position.set(0,1.65,7.5);

const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;

const ambient=new THREE.HemisphereLight(0x8b8b95,0x101010,1.15);
scene.add(ambient);
const lamp=new THREE.PointLight(0xffe5c4,2.2,15);
lamp.position.set(0,3.3,0);
lamp.castShadow=true;
scene.add(lamp);

function mat(color,rough=.85){return new THREE.MeshStandardMaterial({color,roughness:rough});}
const floorMat=mat(0x24272a),wallMat=mat(0x1a1c1f),woodMat=mat(0x33271f),darkMat=mat(0x111315);

function box(name,x,y,z,w,h,d,material,rot=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.name=name;m.position.set(x,y,z);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}

box("floor",0,-.05,0,20,.1,18,floorMat);
box("back wall",0,2,-8,20,4,.3,wallMat);
box("left wall",-10,2,0,.3,4,16,wallMat);
box("right wall",10,2,0,.3,4,16,wallMat);
box("front wall left",-6,2,8,.3,4,2.8,wallMat);
box("front wall right",6,2,8,.3,4,2.8,wallMat);
box("front top",-0,3.5,8,8,1,.3,wallMat);

box("bed", -6, .65,-5, 4,1.3,2.2, woodMat);
box("pillow",-7.2,1.35,-5,.9,.25,1.5,mat(0x55575a));
box("couch",5,.7,-4,3.8,1.4,1.7,mat(0x343238));
box("table",-4,.9,3,2.5,.18,1.5,woodMat);
for(const [x,z] of [[-4.9,2.45],[-3.1,2.45],[-4.9,3.55],[-3.1,3.55]]) box("table leg",x,.45,z,.15,.9,.15,woodMat);

const key=box("KEY",0,.55,2,.35,.18,.75,mat(0xf0c84b, .45));
key.rotation.y=.35;
const keyRing=new THREE.Mesh(new THREE.TorusGeometry(.18,.045,10,24),mat(0xf0c84b,.35));
keyRing.rotation.x=Math.PI/2;keyRing.position.set(.18,.68,2);scene.add(keyRing);

const door=box("EXIT DOOR",0,2,7.82,2.2,4,.3,mat(0x151719));
const knob=box("door knob",.65,1.8,7.58,.12,.12,.12,mat(0xb8a36a,.4));

const mara=new THREE.Group();
mara.position.set(4,0,-2);
const mBody=new THREE.Mesh(new THREE.CapsuleGeometry(.42,1.05,6,12),mat(0x3b1d27));
mBody.position.y=1.05;mBody.castShadow=true;mara.add(mBody);
const mHead=new THREE.Mesh(new THREE.SphereGeometry(.36,16,12),mat(0xd1a997));
mHead.position.y=1.95;mHead.castShadow=true;mara.add(mHead);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.39,16,12,0,Math.PI*2,0,Math.PI*.62),mat(0x151216));
hair.position.y=2.08;mara.add(hair);
for(const x of [-.11,.11]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),mat(0x090509));eye.position.set(x,1.98,.335);mara.add(eye)}
scene.add(mara);

let yaw=0,pitch=0;
const velocity=new THREE.Vector3();
const forward=new THREE.Vector3(),right=new THREE.Vector3();
let joystickX=0,joystickY=0;
let lookPointer=null,lastLookX=0,lastLookY=0;

function setLook(dx,dy){
  yaw-=dx*.0022;
  pitch-=dy*.0022;
  pitch=Math.max(-1.25,Math.min(1.25,pitch));
}

function startGame(){
  gameStarted=true;startScreen.style.display="none";
  showMessage("She's somewhere in the house.");
  if(innerWidth>600 && document.body.requestPointerLock) canvas.requestPointerLock();
}
startButton.addEventListener("click",startGame);

document.addEventListener("keydown",e=>{
  if(e.target===chatInput||e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  keys[k]=true;
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();
  if(e.key.toLowerCase()==="e")interact();
});
document.addEventListener("keyup",e=>{keys[e.key]=false});

canvas.addEventListener("click",()=>{
  if(gameStarted&&innerWidth>600&&!document.pointerLockElement)canvas.requestPointerLock();
});
document.addEventListener("mousemove",e=>{
  if(document.pointerLockElement===canvas)setLook(e.movementX,e.movementY);
});

function updatePlayer(dt){
  if(!gameStarted||gameEnded)return;
  let x=(keys.a||keys.ArrowLeft?-1:0)+(keys.d||keys.ArrowRight?1:0)+joystickX;
  let z=(keys.w||keys.ArrowUp?-1:0)+(keys.s||keys.ArrowDown?1:0)+joystickY;
  const len=Math.hypot(x,z);
  if(len>1){x/=len;z/=len}
  camera.rotation.order="YXZ";
  camera.rotation.y=yaw;camera.rotation.x=pitch;
  forward.set(-Math.sin(yaw),0,-Math.cos(yaw));
  right.set(Math.cos(yaw),0,-Math.sin(yaw));
  velocity.set(0,0,0).addScaledVector(forward,z*-1).addScaledVector(right,x);
  if(velocity.lengthSq()>0)velocity.normalize().multiplyScalar(3.1*dt);
  camera.position.add(velocity);
  camera.position.x=Math.max(-8.8,Math.min(8.8,camera.position.x));
  camera.position.z=Math.max(-6.8,Math.min(7.1,camera.position.z));
  camera.position.y=1.65;
  updateMara(dt);
  checkInteractions();
}

function updateMara(dt){
  const dx=camera.position.x-mara.position.x,dz=camera.position.z-mara.position.z;
  const dist=Math.hypot(dx,dz);
  if(dist<7&&dist>1.7){
    mara.position.x+=(dx/dist)*dt*.38;
    mara.position.z+=(dz/dist)*dt*.38;
    mara.lookAt(camera.position.x,mara.position.y,camera.position.z);
  }
  if(dist<1.7&&Math.random()<dt*.7)showMessage("Mara is standing very close.");
}

function checkInteractions(){
  const p=camera.position;
  const keyDist=Math.hypot(p.x-key.position.x,p.z-key.position.z);
  const doorDist=Math.hypot(p.x-door.position.x,p.z-door.position.z);
  const maraDist=Math.hypot(p.x-mara.position.x,p.z-mara.position.z);
  if(!hasKey&&keyDist<1.8){
    collectKey();
  }
  if(doorDist<2.2){
    interactHint.textContent=hasKey?"TAP / PRESS E TO ESCAPE":"THE DOOR IS LOCKED";
    interactHint.style.display="block";
  }else if(maraDist<2.4){
    interactHint.textContent="TALK TO MARA";
    interactHint.style.display="block";
  }else interactHint.style.display="none";
}

function collectKey(){
  if(hasKey||!gameStarted||gameEnded)return;
  hasKey=true;key.visible=false;keyRing.visible=false;
  objectiveText.textContent="Escape through the door.";
  showMessage("You found the key.");
  addMaraMessage("You found that faster than I expected.");
}

function interact(){
  if(!gameStarted||gameEnded)return;
  const p=camera.position;
  const doorDist=Math.hypot(p.x-door.position.x,p.z-door.position.z);
  const maraDist=Math.hypot(p.x-mara.position.x,p.z-mara.position.z);
  if(doorDist<2.5){if(hasKey)escape();else showMessage("The door won't open. You need the key.");}
  else if(maraDist<2.8)openChat();
}

function escape(){
  gameEnded=true;endingTitle.textContent="YOU ESCAPED";
  endingText.textContent="The door opens. Cold air rushes inside. Behind you, Mara doesn't move.";
  endingScreen.style.display="flex";
}

function showMessage(t){
  messageText.textContent=t;clearTimeout(messageTimeout);
  messageTimeout=setTimeout(()=>messageText.textContent=hasKey?"Find the exit.":"Find the key.",3000);
}

function openChat(){chat.classList.add("open");setTimeout(()=>chatInput.focus(),50)}
chatButton.addEventListener("click",openChat);
closeChat.addEventListener("click",()=>chat.classList.remove("open"));
chatForm.addEventListener("submit",e=>{
  e.preventDefault();if(!gameStarted||gameEnded)return;
  const text=chatInput.value.trim();if(!text)return;
  addPlayerMessage(text);conversation.push({role:"player",text});chatInput.value="";
  setTimeout(()=>{const response=getMaraResponse(text);addMaraMessage(response);conversation.push({role:"mara",text:response})},450);
});
function addPlayerMessage(text){addChat("you-message","YOU",text)}
function addMaraMessage(text){addChat("she-message","MARA",text)}
function addChat(cls,name,text){
  const w=document.createElement("div");w.className="chat-message "+cls;
  const s=document.createElement("strong");s.textContent=name;
  const p=document.createElement("p");p.textContent=text;
  w.append(s,p);chatMessages.appendChild(w);chatMessages.scrollTop=chatMessages.scrollHeight;
}
function getMaraResponse(raw){
  const t=raw.toLowerCase();
  if(t.includes("who are you")||t.includes("your name"))return"My name is Mara.";
  if(t.includes("hello")||t.includes("hi")||t.includes("hey"))return["Hi.","You're finally talking to me.","Hello. I was wondering when you'd say something."][Math.floor(Math.random()*3)];
  if(t.includes("where"))return"You're in the house.";
  if(t.includes("key"))return hasKey?"You found it.":"Why are you asking about the key?";
  if(t.includes("escape")||t.includes("leave")||t.includes("get out"))return hasKey?"You really want to leave?":"You don't have the key.";
  if(t.includes("scared")||t.includes("afraid")||t.includes("fear"))return"You don't have to be scared.";
  if(t.includes("help"))return"Tell me what you need.";
  if(t.includes("what are you doing"))return"Watching. Listening. Waiting.";
  return["I heard you.","Keep talking.","I'm listening.","Tell me more."][Math.floor(Math.random()*4)];
}

function setJoystick(e){
  const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.34;const d=Math.hypot(dx,dy);
  if(d>max){dx=dx/d*max;dy=dy/d*max}
  joystickX=dx/max;joystickY=dy/max;
  stick.style.left=(50+joystickX*34)+"%";stick.style.top=(50+joystickY*34)+"%";
}
function resetJoystick(){joystickX=0;joystickY=0;stick.style.left="50%";stick.style.top="50%"}
joystick.addEventListener("pointerdown",e=>{joystick.setPointerCapture(e.pointerId);setJoystick(e)});
joystick.addEventListener("pointermove",e=>{if(e.buttons)setJoystick(e)});
joystick.addEventListener("pointerup",resetJoystick);joystick.addEventListener("pointercancel",resetJoystick);

canvas.addEventListener("pointerdown",e=>{
  if(innerWidth<=600&&gameStarted&&e.pointerId!==1){lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;canvas.setPointerCapture(e.pointerId)}
});
canvas.addEventListener("pointermove",e=>{
  if(innerWidth<=600&&e.pointerId===lookPointer){setLook(e.clientX-lastLookX,e.clientY-lastLookY);lastLookX=e.clientX;lastLookY=e.clientY}
});
canvas.addEventListener("pointerup",e=>{if(e.pointerId===lookPointer)lookPointer=null});
canvas.addEventListener("pointercancel",e=>{if(e.pointerId===lookPointer)lookPointer=null});

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
});

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  updatePlayer(dt);
  renderer.render(scene,camera);
}
animate();