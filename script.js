const canvas=document.getElementById("world"),ctx=canvas.getContext("2d");
const $=id=>document.getElementById(id);
const startScreen=$("startScreen"),startButton=$("startButton"),objectiveText=$("objectiveText"),messageText=$("messageText"),hint=$("interactHint"),danger=$("danger"),chat=$("chat"),chatButton=$("chatButton"),closeChat=$("closeChat"),chatForm=$("chatForm"),chatInput=$("chatInput"),chatMessages=$("chatMessages"),actionButton=$("actionButton"),joystick=$("joystick"),stick=$("stick");
let started=false,hasKey=false,ended=false,last=performance.now(),messageTimer,lookId=null,lx=0,ly=0,joyX=0,joyY=0;
let maraState="calm",maraTarget={x:5.5,y:-4.5},maraTimer=0,conversation=[],suspicion=0,attachment=0,anger=0;
const held={};let player={x:-5.2,y:5.2,a:-Math.PI/2};let mara={x:5.2,y:-4.5,a:0};
const map=[
"####################",
"#........#.........#",
"#........#.........#",
"#........#.........#",
"#........#.........#",
"#........#.........#",
"#..................#",
"#....######........#",
"#....#.............#",
"#....#.............#",
"#....#.............#",
"#....######........#",
"#..................#",
"#........#.........#",
"#........#.........#",
"#........#.........#",
"#........#.........#",
"####################"
];
const decor=[
{x:-7.4,y:3.2,t:"bed"},{x:-6.8,y:-2.8,t:"desk"},{x:-2.8,y:5.7,t:"couch"},{x:1.2,y:4.9,t:"table"},{x:4.7,y:4.2,t:"tv"},{x:6.6,y:-2.7,t:"couch"},{x:-3.2,y:-4.6,t:"kitchen"},{x:-1.5,y:-4.6,t:"kitchen"}
];
function resize(){canvas.width=Math.floor(innerWidth*devicePixelRatio);canvas.height=Math.floor(innerHeight*devicePixelRatio);canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
addEventListener("resize",resize);resize();
function startGame(e){if(e)e.preventDefault();if(started)return;started=true;startScreen.style.display="none";startScreen.style.pointerEvents="none";objectiveText.textContent="Look around the house.";showMessage("Mara is in the house with you.")}
startButton.addEventListener("click",startGame);
startButton.addEventListener("pointerdown",startGame);
startScreen.addEventListener("click",e=>{if(e.target===startScreen||e.target.closest("#startButton"))startGame(e)});
startButton.addEventListener("pointerup",startGame);
startButton.addEventListener("touchend",startGame,{passive:false});
startButton.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")startGame(e)});
addEventListener("keydown",e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;held[e.key.toLowerCase()]=true;if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase()))e.preventDefault();if(e.key.toLowerCase()==="e")interact()});
addEventListener("keyup",e=>held[e.key.toLowerCase()]=false);
function wall(x,y){const gx=Math.floor(x+10),gy=Math.floor(y+9);return gy<0||gy>=map.length||gx<0||gx>=map[0].length||map[gy][gx]==="#"}
function clearPath(x1,y1,x2,y2){const d=Math.hypot(x2-x1,y2-y1),n=Math.ceil(d/.12);for(let i=1;i<n;i++){const p=i/n;if(wall(x1+(x2-x1)*p,y1+(y2-y1)*p))return false}return true}
function tryMove(x,y){if(!wall(x,player.y))player.x=x;if(!wall(player.x,y))player.y=y}
function move(dt){
 if(!started||ended)return;
 let f=(held.w||held.arrowup?1:0)-(held.s||held.arrowdown?1:0)-joyY,str=(held.d||held.arrowright?1:0)-(held.a||held.arrowleft?1:0)+joyX,n=Math.hypot(f,str);if(n>1){f/=n;str/=n}
 const ca=Math.cos(player.a),sa=Math.sin(player.a),speed=3.1;
 tryMove(player.x+(ca*f-sa*str)*speed*dt,player.y+(sa*f+ca*str)*speed*dt);
 updateMara(dt);check();
}
function updateMara(dt){
 const d=Math.hypot(player.x-mara.x,player.y-mara.y);
 if(maraState==="chasing"){
   danger.classList.add("on");danger.textContent="SHE IS CHASING YOU";
   const tx=player.x-mara.x,ty=player.y-mara.y,td=Math.hypot(tx,ty)||1;
   const speed=1.8;const nx=mara.x+tx/td*speed*dt,ny=mara.y+ty/td*speed*dt;
   if(!wall(nx,mara.y))mara.x=nx;if(!wall(mara.x,ny))mara.y=ny;mara.a=Math.atan2(ty,tx);
   if(d<1.05){maraState="watching";anger=Math.max(anger-8,40);showMessage("Mara caught up.");addMara("Why are you running from me?");}
   return;
 }
 danger.classList.toggle("on",maraState==="suspicious");danger.textContent=maraState==="suspicious"?"SHE IS LISTENING":"";
 maraTimer-=dt;
 if(maraState==="angry"){maraState="chasing";showMessage("Mara is coming for you.");return}
 if(maraState==="suspicious"&&d<4){maraTarget={x:player.x,y:player.y};}
 if(maraTimer<=0||Math.hypot(mara.x-maraTarget.x,mara.y-maraTarget.y)<.5){
   maraTimer=3+Math.random()*4;
   if(maraState==="calm")maraTarget=randomWalkable();else if(maraState==="suspicious")maraTarget={x:player.x,y:player.y};
 }
 const tx=maraTarget.x-mara.x,ty=maraTarget.y-mara.y,td=Math.hypot(tx,ty);
 if(td>.35){const speed=maraState==="suspicious"?.5:.28,nx=mara.x+tx/td*speed*dt,ny=mara.y+ty/td*speed*dt;if(!wall(nx,mara.y))mara.x=nx;if(!wall(mara.x,ny))mara.y=ny;mara.a=Math.atan2(ty,tx)}
}
function randomWalkable(){for(let i=0;i<30;i++){const x=Math.random()*16-8,y=Math.random()*14-7;if(!wall(x,y)&&Math.hypot(x-player.x,y-player.y)>3)return{x,y}}return{x:4,y:-3}}
function check(){
 const kd=Math.hypot(player.x-5.8,player.y-4.8);
 if(!hasKey&&kd<.8){hasKey=true;objectiveText.textContent="Get to the front door.";showMessage("You found a key.");addMara("You weren't supposed to find that yet.");}
 const dd=Math.hypot(player.x-8.2,player.y-7.2),md=Math.hypot(player.x-mara.x,player.y-mara.y);
 if(dd<1.4){hint.textContent=hasKey?"E / OPEN DOOR":"LOCKED";hint.style.display="block";actionButton.textContent=hasKey?"OPEN DOOR":"LOCKED";actionButton.style.display=innerWidth<=600?"block":"none"}
 else if(md<2){hint.textContent="E / TALK TO MARA";hint.style.display="block";actionButton.textContent="TALK";actionButton.style.display=innerWidth<=600?"block":"none"}
 else{hint.style.display="none";actionButton.style.display="none"}
}
function interact(){if(!started||ended)return;const dd=Math.hypot(player.x-8.2,player.y-7.2),md=Math.hypot(player.x-mara.x,player.y-mara.y);if(dd<1.4){if(hasKey)escapeGame();else showMessage("The front door is locked.")}else if(md<2)openChat()}
function escapeGame(){ended=true;$("endingTitle").textContent="YOU ESCAPED";$("endingText").textContent="The front door opens. The street outside is quiet. There was never an apocalypse."; $("endingScreen").style.display="flex"}
function showMessage(t){messageText.textContent=t;clearTimeout(messageTimer);messageTimer=setTimeout(()=>messageText.textContent=hasKey?"Get to the front door.":"Look around the house.",3200)}
function openChat(){chat.classList.add("open");chatButton.style.display="none";setTimeout(()=>chatInput.focus(),50)}
chatButton.addEventListener("click",openChat);closeChat.addEventListener("click",()=>{chat.classList.remove("open");chatButton.style.display=""});actionButton.addEventListener("click",interact);
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
 if(/(trust|believe)/.test(t)){return suspicion>25?"You keep asking me to prove things. Maybe you're the one who changed.":"Of course you trust me. We're together."}
 if(/(help|save me)/.test(t)){return"From what? Me? Or the world outside?"}
 if(/(sorry)/.test(t)){anger=Math.max(0,anger-20);return"I'll try to believe you. Just stay with me."}
 if(/(hello|hi|hey)/.test(t))return"Hi. I was wondering when you'd say something.";
 if(/(thank)/.test(t))return"You're welcome. See? We take care of each other.";
 return["I heard you.","Keep talking. I'm listening.","You don't remember as much as you think.","Tell me what you really mean.","Why are you looking at me like that?"][Math.floor(Math.random()*5)];
}
function setJoy(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=r.width*.34,d=Math.hypot(dx,dy)||1,k=Math.min(1,m/d);joyX=dx/m*k;joyY=dy/m*k;stick.style.left=(50+joyX*34)+"%";stick.style.top=(50+joyY*34)+"%"}
function resetJoy(){joyX=joyY=0;stick.style.left="50%";stick.style.top="50%"}joystick.addEventListener("pointerdown",e=>{joystick.setPointerCapture(e.pointerId);setJoy(e)});joystick.addEventListener("pointermove",e=>{if(e.buttons)setJoy(e)});joystick.addEventListener("pointerup",resetJoy);joystick.addEventListener("pointercancel",resetJoy);
canvas.addEventListener("pointerdown",e=>{if(innerWidth<=600&&started){lookId=e.pointerId;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)}});canvas.addEventListener("pointermove",e=>{if(e.pointerId===lookId){player.a+=(e.clientX-lx)*.006;lx=e.clientX;ly=e.clientY}});canvas.addEventListener("pointerup",e=>{if(e.pointerId===lookId)lookId=null});canvas.addEventListener("pointercancel",e=>{if(e.pointerId===lookId)lookId=null});
function cast(a){let x=player.x,y=player.y,dx=Math.cos(a)*.035,dy=Math.sin(a)*.035,d=0;while(d<20){x+=dx;y+=dy;d+=.035;if(wall(x,y))return d}return 20}
function project(x,y){const dx=x-player.x,dy=y-player.y,dist=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)-player.a,rel=Math.atan2(Math.sin(ang),Math.cos(ang));if(Math.abs(rel)>Math.PI/3||dist<.15)return null;return{dist,rel,sx:(.5+rel/(Math.PI/3))*innerWidth,scale:innerHeight/(dist*2.7)}}
function render(){
 const w=innerWidth,h=innerHeight;let g=ctx.createLinearGradient(0,0,0,h/2);g.addColorStop(0,"#080a0c");g.addColorStop(1,"#30343a");ctx.fillStyle=g;ctx.fillRect(0,0,w,h/2);g=ctx.createLinearGradient(0,h/2,0,h);g.addColorStop(0,"#34302d");g.addColorStop(1,"#090909");ctx.fillStyle=g;ctx.fillRect(0,h/2,w,h/2);
 const fov=Math.PI/3,rays=Math.ceil(w/2);for(let i=0;i<rays;i++){const sx=(i+.5)/rays,a=player.a-fov/2+sx*fov,d=cast(a),correct=d*Math.cos(a-player.a),wallH=Math.min(h*1.5,h/(correct*.72)),x=i*w/rays,shade=Math.max(24,150-correct*8);ctx.fillStyle="rgb("+shade+","+Math.max(25,shade-3)+","+Math.max(23,shade-7)+")";ctx.fillRect(x,h/2-wallH/2,Math.ceil(w/rays)+1,wallH)}
 decor.forEach(drawDecor);drawKey();drawMara();drawDoor();drawVignette();
}
function visible(p){if(!p)return false;return clearPath(player.x,player.y,p.x,p.y)}
function drawDecor(o){const p=project(o.x,o.y);if(!p||!visible(o))return;const s=p.scale,d=p.dist,x=p.sx,y=innerHeight/2+innerHeight/(d*4);ctx.save();ctx.translate(x,y);
 if(o.t==="bed"){ctx.fillStyle="#25282b";ctx.fillRect(-s*.65,-s*.28,s*1.3,s*.48);ctx.fillStyle="#5d6267";ctx.fillRect(-s*.58,-s*.22,s*.58,s*.32);ctx.fillStyle="#b8b8b0";ctx.fillRect(-s*.48,-s*.2,s*.3,s*.18)}
 if(o.t==="couch"){ctx.fillStyle="#28252a";ctx.fillRect(-s*.7,-s*.18,s*1.4,s*.42);ctx.fillRect(-s*.62,-s*.52,s*1.24,s*.38);ctx.fillStyle="#414047";ctx.fillRect(-s*.55,-s*.43,s*.32,s*.25);ctx.fillRect(s*.18,-s*.43,s*.32,s*.25)}
 if(o.t==="table"){ctx.fillStyle="#40352d";ctx.fillRect(-s*.5,-s*.12,s,s*.16);ctx.fillRect(-s*.38,s*.02,s*.12,s*.5);ctx.fillRect(s*.26,s*.02,s*.12,s*.5)}
 if(o.t==="desk"){ctx.fillStyle="#3b3029";ctx.fillRect(-s*.55,-s*.12,s*1.1,s*.16);ctx.fillRect(-s*.45,s*.02,s*.1,s*.5);ctx.fillRect(s*.35,s*.02,s*.1,s*.5);ctx.fillStyle="#17191c";ctx.fillRect(-s*.25,-s*.32,s*.5,s*.18)}
 if(o.t==="tv"){ctx.fillStyle="#111";ctx.fillRect(-s*.48,-s*.45,s*.96,s*.58);ctx.fillStyle="#4c5356";ctx.fillRect(-s*.39,-s*.36,s*.78,s*.38)}
 if(o.t==="kitchen"){ctx.fillStyle="#55514b";ctx.fillRect(-s*.55,-s*.25,s*1.1,s*.6);ctx.fillStyle="#1b1d1e";ctx.fillRect(-s*.42,-s*.18,s*.25,s*.2);ctx.fillRect(s*.08,-s*.18,s*.25,s*.2)}
 ctx.restore()}
function drawMara(){const p=project(mara.x,mara.y);if(!p||!visible(mara))return;const s=p.scale,x=p.sx,h=innerHeight,y=h/2;ctx.save();ctx.translate(x,y);const body=s*.78,head=s*.35;ctx.fillStyle=maraState==="chasing"?"#4a111b":"#5a2633";ctx.fillRect(-body*.48,s*.1,body*.96,s*1.2);ctx.fillStyle="#d9a995";ctx.beginPath();ctx.arc(0,-s*.28,head,0,Math.PI*2);ctx.fill();ctx.fillStyle="#151016";ctx.beginPath();ctx.arc(0,-s*.45,head*1.15,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#111";ctx.fillRect(-head*.5,-s*.34,head*.18,head*.12);ctx.fillRect(head*.32,-s*.34,head*.18,head*.12);
 if(maraState==="chasing"||maraState==="angry"){ctx.fillStyle="#d7d7d7";ctx.beginPath();ctx.moveTo(body*.5,s*.25);ctx.lineTo(body*.95,s*.45);ctx.lineTo(body*.58,s*.52);ctx.closePath();ctx.fill()}
 ctx.restore()}
function drawKey(){if(hasKey)return;const o={x:5.8,y:4.8},p=project(o.x,o.y);if(!p||!visible(o))return;const s=Math.min(1.3,p.scale/3),x=p.sx,y=innerHeight/2+innerHeight/(p.dist*4);ctx.save();ctx.translate(x,y);ctx.strokeStyle="#e5c64f";ctx.lineWidth=Math.max(2,5*s);ctx.beginPath();ctx.arc(-8*s,0,6*s,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-2*s,0);ctx.lineTo(18*s,0);ctx.lineTo(18*s,6*s);ctx.moveTo(10*s,0);ctx.lineTo(10*s,5*s);ctx.stroke();ctx.restore()}
function drawDoor(){const o={x:8.2,y:7.2},p=project(o.x,o.y);if(!p||!visible(o))return;const hh=Math.min(innerHeight*.75,innerHeight/(p.dist*.8)),ww=innerWidth*.12;ctx.fillStyle=hasKey?"#343434":"#151515";ctx.fillRect(p.sx-ww/2,innerHeight/2-hh/2,ww,hh);ctx.fillStyle="#9b8a62";ctx.fillRect(p.sx+ww*.2,innerHeight/2,ww*.08,ww*.05)}
function drawVignette(){const w=innerWidth,h=innerHeight,g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.25,w/2,h/2,Math.max(w,h)*.72);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.58)");ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;move(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);