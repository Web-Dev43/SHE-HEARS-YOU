const canvas=document.getElementById("world");
const ctx=canvas.getContext("2d");
const startScreen=document.getElementById("startScreen");
const startButton=document.getElementById("startButton");
const objectiveText=document.getElementById("objectiveText");
const messageText=document.getElementById("messageText");
const interactHint=document.getElementById("interactHint");
const chat=document.getElementById("chat");
const chatButton=document.getElementById("chatButton");
const closeChat=document.getElementById("closeChat");
const chatForm=document.getElementById("chatForm");
const chatInput=document.getElementById("chatInput");
const chatMessages=document.getElementById("chatMessages");
const joystick=document.getElementById("joystick");
const stick=document.getElementById("stick");

let started=false,hasKey=false,ended=false,last=performance.now(),messageTimer;
const held={};
let player={x:0,y:6.5,a:0};
let mara={x:4,y:-2};
let joyX=0,joyY=0,lookId=null,lx=0,ly=0;

const map=[
"####################",
"#..................#",
"#..................#",
"#....####..........#",
"#....#..#..........#",
"#....#..#..........#",
"#..................#",
"#..................#",
"#..................#",
"#..................#",
"#..................#",
"#..................#",
"#..................#",
"#..................#",
"#..................#",
"#..................#",
"#..................#",
"####################"
];

function resize(){canvas.width=Math.floor(innerWidth*devicePixelRatio);canvas.height=Math.floor(innerHeight*devicePixelRatio);canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
addEventListener("resize",resize);resize();

function startGame(){started=true;startScreen.style.display="none";showMessage("She's somewhere in the house.");}
startButton.addEventListener("click",startGame);

addEventListener("keydown",e=>{
 if(e.target===chatInput||e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
 held[e.key.toLowerCase()]=true;
 if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase()))e.preventDefault();
 if(e.key.toLowerCase()==="e")interact();
});
addEventListener("keyup",e=>held[e.key.toLowerCase()]=false);

function wall(x,y){const gx=Math.floor(x+10),gy=Math.floor(y+9);return gy<0||gy>=map.length||gx<0||gx>=map[0].length||map[gy][gx]==="#"}
function move(dt){
 if(!started||ended)return;
 let f=(held.w||held.arrowup?1:0)-(held.s||held.arrowdown?1:0)+(-joyY);
 let str=(held.d||held.arrowright?1:0)-(held.a||held.arrowleft?1:0)+joyX;
 const n=Math.hypot(f,str);if(n>1){f/=n;str/=n}
 const ca=Math.cos(player.a),sa=Math.sin(player.a);
 const nx=player.x+(ca*f-sa*str)*3*dt,ny=player.y+(sa*f+ca*str)*3*dt;
 if(!wall(nx,player.y))player.x=nx;if(!wall(player.x,ny))player.y=ny;
 const dx=player.x-mara.x,dy=player.y-mara.y,d=Math.hypot(dx,dy);
 if(d<7&&d>1.8){mara.x+=dx/d*dt*.35;mara.y+=dy/d*dt*.35}
 check();
}

function check(){
 const kd=Math.hypot(player.x,player.y-2);
 if(!hasKey&&kd<1.2){hasKey=true;objectiveText.textContent="Escape through the door.";showMessage("You found the key.");addMara("You found that faster than I expected.")}
 const dd=Math.hypot(player.x,player.y-8);
 const md=Math.hypot(player.x-mara.x,player.y-mara.y);
 if(dd<1.5){interactHint.textContent=hasKey?"TAP / PRESS E TO ESCAPE":"THE DOOR IS LOCKED";interactHint.style.display="block"}
 else if(md<2){interactHint.textContent="TALK TO MARA";interactHint.style.display="block"}
 else interactHint.style.display="none";
}

function interact(){
 if(!started||ended)return;
 const dd=Math.hypot(player.x,player.y-8),md=Math.hypot(player.x-mara.x,player.y-mara.y);
 if(dd<1.8){if(hasKey)escapeGame();else showMessage("The door won't open. You need the key.")}
 else if(md<2.5)openChat();
}

function escapeGame(){ended=true;document.getElementById("endingTitle").textContent="YOU ESCAPED";document.getElementById("endingText").textContent="The door opens. Cold air rushes inside. Behind you, Mara doesn't move.";document.getElementById("endingScreen").style.display="flex"}

function showMessage(t){messageText.textContent=t;clearTimeout(messageTimer);messageTimer=setTimeout(()=>messageText.textContent=hasKey?"Find the exit.":"Find the key.",3000)}

function openChat(){chat.classList.add("open");setTimeout(()=>chatInput.focus(),50)}
chatButton.addEventListener("click",openChat);closeChat.addEventListener("click",()=>chat.classList.remove("open"));
chatForm.addEventListener("submit",e=>{
 e.preventDefault();if(!started||ended)return;const t=chatInput.value.trim();if(!t)return;
 addPlayer(t);chatInput.value="";setTimeout(()=>addMara(reply(t)),350);
});
function addChat(cls,name,text){const w=document.createElement("div");w.className="chat-message "+cls;const s=document.createElement("strong");s.textContent=name;const p=document.createElement("p");p.textContent=text;w.append(s,p);chatMessages.appendChild(w);chatMessages.scrollTop=chatMessages.scrollHeight}
function addPlayer(t){addChat("you-message","YOU",t)} function addMara(t){addChat("she-message","MARA",t)}
function reply(raw){const t=raw.toLowerCase();if(t.includes("who are you")||t.includes("your name"))return"My name is Mara.";if(t.includes("hi")||t.includes("hello")||t.includes("hey"))return"Hi. I was wondering when you'd say something.";if(t.includes("key"))return hasKey?"You found it.":"Why are you asking about the key?";if(t.includes("escape")||t.includes("leave"))return hasKey?"You really want to leave?":"You don't have the key.";if(t.includes("help"))return"Tell me what you need.";if(t.includes("where"))return"You're in the house.";return["I heard you.","Keep talking.","I'm listening.","Tell me more."][Math.floor(Math.random()*4)]}

function setJoy(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=r.width*.34,d=Math.hypot(dx,dy)||1,k=Math.min(1,m/d);joyX=dx/m*k;joyY=dy/m*k;stick.style.left=(50+joyX*34)+"%";stick.style.top=(50+joyY*34)+"%"}
function resetJoy(){joyX=joyY=0;stick.style.left="50%";stick.style.top="50%"}
joystick.addEventListener("pointerdown",e=>{joystick.setPointerCapture(e.pointerId);setJoy(e)});joystick.addEventListener("pointermove",e=>{if(e.buttons)setJoy(e)});joystick.addEventListener("pointerup",resetJoy);joystick.addEventListener("pointercancel",resetJoy);

canvas.addEventListener("pointerdown",e=>{if(innerWidth<=600&&started){lookId=e.pointerId;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener("pointermove",e=>{if(e.pointerId===lookId){player.a+=(e.clientX-lx)*.006;lx=e.clientX;ly=e.clientY}});
canvas.addEventListener("pointerup",e=>{if(e.pointerId===lookId)lookId=null});canvas.addEventListener("pointercancel",e=>{if(e.pointerId===lookId)lookId=null});

function cast(a){
 let x=player.x,y=player.y,dx=Math.cos(a)*.045,dy=Math.sin(a)*.045,d=0;
 while(d<20){x+=dx;y+=dy;d+=.045;if(wall(x,y))return d}return 20
}
function render(){
 const w=innerWidth,h=innerHeight;
 ctx.fillStyle="#20242a";ctx.fillRect(0,0,w,h/2);
 ctx.fillStyle="#36383a";ctx.fillRect(0,h/2,w,h/2);
 const fov=Math.PI/3,rays=Math.ceil(w/3);
 for(let i=0;i<rays;i++){
  const sx=(i+.5)/rays,ang=player.a-fov/2+sx*fov,d=cast(ang),correct=d*Math.cos(ang-player.a);
  const wallH=Math.min(h*1.4,h/(correct*.7)),x=i*w/rays;
  const shade=Math.max(35,175-correct*10);
  ctx.fillStyle="rgb("+shade+","+shade+","+shade+")";ctx.fillRect(x,h/2-wallH/2,Math.ceil(w/rays)+1,wallH);
 }
 drawSprite(mara.x,mara.y,0.9,"#9b415c","#f0c0aa");
 if(!hasKey)drawSprite(0,2,.35,"#f5d34b","#fff1a0");
 drawDoor();
}
function drawSprite(x,y,size,body,head){
 const dx=x-player.x,dy=y-player.y,dist=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)-player.a;
 let rel=Math.atan2(Math.sin(ang),Math.cos(ang));if(Math.abs(rel)>Math.PI/3||dist<.2)return;
 const w=innerWidth,h=innerHeight,fov=Math.PI/3,sx=(.5+rel/fov)*w;
 const scale=h/(dist*2.8),bw=size*scale,bh=scale*2.3;
 ctx.fillStyle=body;ctx.fillRect(sx-bw/2,h/2+bh*.05,bw,bh*.55);
 ctx.fillStyle=head;ctx.beginPath();ctx.arc(sx,h/2-bh*.18,bw*.38,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#161018";ctx.fillRect(sx-bw*.22,h/2-bh*.23,bw*.12,bw*.12);ctx.fillRect(sx+bw*.10,h/2-bh*.23,bw*.12,bw*.12);
}
function drawDoor(){const dx=-player.x,dy=8-player.y,dist=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)-player.a,rel=Math.atan2(Math.sin(ang),Math.cos(ang));if(Math.abs(rel)<Math.PI/5){const sx=(.5+rel/(Math.PI/3))*innerWidth,hh=Math.min(innerHeight*.8,innerHeight/(dist*.9));ctx.fillStyle="#111";ctx.fillRect(sx-innerWidth*.07,innerHeight/2-hh/2,innerWidth*.14,hh)}}

function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;move(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);