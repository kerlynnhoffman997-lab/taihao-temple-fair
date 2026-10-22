/*
Perspective ring adapted from Gallery Heading.
Copyright (c) Meng To / Design+Code. MIT License.
Source: https://threeui.com/component/gallery-heading
See THIRD_PARTY_NOTICES.txt. Artwork is supplied by the website owner.
*/
(() => {
'use strict';
const canvas=document.getElementById('gallery-canvas'),toggle=document.getElementById('motion-toggle'),label=document.getElementById('motion-label'),status=document.getElementById('gallery-status');
let ctx=null;try{ctx=canvas&&canvas.getContext('2d')}catch(_){}
if(!ctx){document.body.classList.add('gallery-failed');label.textContent='画面暂未载入';status.textContent='风物画面暂未载入，仍可直接进入庙会地图。';return}
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),textures=Array(11).fill(null);
let loadedImages=0,settledImages=0,pageActive=true,frames=0;
let warmedMap=null,departing=false,navigationEpoch=0,navigationTimer=0;
const lowData=!!navigator.connection?.saveData||/(^|-)2g$/.test(navigator.connection?.effectiveType||'');
let width=0,height=0,scale=1,ox=0,oy=0,mobile=false,ring,U,V,AXIS,heading;
let elapsed=0,speed=0,manual=reduced.matches?false:null,hovering=false,last=0,frameId=0,dirty=true,initialized=false;
const rad=deg=>deg*Math.PI/180,sx=x=>ox+x*scale,sy=y=>oy+y*scale;
const offscreen=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function roundRect(x,w,h,r){
x.beginPath();x.moveTo(-w/2+r,-h/2);x.lineTo(w/2-r,-h/2);x.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
x.lineTo(w/2,h/2-r);x.quadraticCurveTo(w/2,h/2,w/2-r,h/2);x.lineTo(-w/2+r,h/2);x.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
x.lineTo(-w/2,-h/2+r);x.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);x.closePath();
}
function photoTexture(img){
const c=offscreen(640,480),x=c.getContext('2d'),factor=Math.max(c.width/img.naturalWidth,c.height/img.naturalHeight);
const w=img.naturalWidth*factor,h=img.naturalHeight*factor;x.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h);return c;
}
function drawHeading(){
heading=offscreen(width,height);const x=heading.getContext('2d');
const lines=mobile?[{text:'太昊陵庙会',top:660,height:112,max:770,color:'#705c45'},{text:'进香巡游图',top:814,height:130,max:910,color:'#241e17'}]:
[{text:'太昊陵庙会',top:773,height:157,max:1320,color:'#705c45'},{text:'进香巡游图',top:983,height:186,max:1540,color:'#241e17'}];
for(const line of lines){
const size=line.height*scale*1.18;x.font='700 '+size+'px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
x.textAlign='center';x.textBaseline='top';x.fillStyle=line.color;x.save();x.translate(sx(ring.cx),sy(line.top));
const measured=x.measureText(line.text).width;x.scale(Math.min(line.max*scale/measured,1.15),1);x.fillText(line.text,0,0);x.restore();
}}
function resize(){
const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
width=Math.round(rect.width*dpr);height=Math.round(rect.height*dpr);canvas.width=width;canvas.height=height;mobile=rect.width<760;
const dw=mobile?1100:2962,dh=mobile?1800:(rect.height<560?2500:2160);scale=Math.min(width/dw,height/dh);ox=(width-dw*scale)/2;oy=(height-dh*scale)/2;
ring=mobile?{cx:550,cy:805,a:425,ratio:.53,axis:-23,n:12,tileW:250,tileH:187.5,dist:13,phase:91}:
{cx:1481,cy:970,a:780,ratio:.52,axis:25.5,n:12,tileW:410,tileH:307.5,dist:13,phase:93};
const angle=rad(ring.axis),cf=ring.ratio,sf=Math.sqrt(1-cf*cf);U=[Math.cos(angle),Math.sin(angle),0];V=[-Math.sin(angle)*cf,Math.cos(angle)*cf,sf];
AXIS=[U[1]*V[2]-U[2]*V[1],U[2]*V[0]-U[0]*V[2],U[0]*V[1]-U[1]*V[0]];drawHeading();dirty=true;requestFrame();
}
function project(p){const k=ring.a*scale*ring.dist/(ring.dist-p[2]);return[sx(ring.cx)+k*p[0],sy(ring.cy)+k*p[1],k]}
function drawTile(index,psi){
const c=Math.cos(psi),s=Math.sin(psi),C=[c*U[0]+s*V[0],c*U[1]+s*V[1],c*U[2]+s*V[2]],T=[-s*U[0]+c*V[0],-s*U[1]+c*V[1],-s*U[2]+c*V[2]];
const hw=ring.tileW/(2*ring.a),hh=ring.tileH/(2*ring.a),p=project(C),pt=project(C.map((v,i)=>v+T[i]*hw)),pa=project(C.map((v,i)=>v+AXIS[i]*hh));
const ex=pt[0]-p[0],ey=pt[1]-p[1],fx=pa[0]-p[0],fy=pa[1]-p[1];if(Math.abs(ex*fy-ey*fx)<.4)return;
const image=textures[index%textures.length];if(!image)return;ctx.save();ctx.setTransform(ex*2/image.width,ey*2/image.width,fx*2/image.height,fy*2/image.height,p[0],p[1]);roundRect(ctx,image.width,image.height,25);ctx.clip();ctx.drawImage(image,-image.width/2,-image.height/2);
if(C[2]<0){ctx.fillStyle='rgba(245,239,227,.4)';ctx.fillRect(-image.width/2,-image.height/2,image.width,image.height)}
ctx.restore();ctx.setTransform(1,0,0,1,0,0);
}
function render(){
if(!heading)return;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);if(!loadedImages){dirty=false;return}ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
const list=Array.from({length:ring.n},(_,i)=>{const psi=rad(ring.phase)-i*2*Math.PI/ring.n+elapsed*.28;return{i,psi,z:Math.cos(psi)*U[2]+Math.sin(psi)*V[2]}}).sort((a,b)=>a.z-b.z);
let textDrawn=false;for(const tile of list){if(!textDrawn&&tile.z>0){ctx.drawImage(heading,0,0);textDrawn=true}drawTile(tile.i,tile.psi)}if(!textDrawn)ctx.drawImage(heading,0,0);dirty=false;frames++;initialized=true;
if(!document.body.classList.contains('gallery-ready')){document.body.classList.add('gallery-ready');status.textContent='民俗风物画面已载入。'}
}
function wantsMotion(){return pageActive&&!document.hidden&&!departing&&loadedImages>0&&(manual===null?hovering&&!reduced.matches:manual)}
function syncButton(){const moving=wantsMotion();toggle.disabled=!loadedImages||departing;toggle.setAttribute('aria-pressed',String(moving));label.textContent=!loadedImages?(document.body.classList.contains('gallery-failed')?'画面暂未载入':'正在载入画面'):moving?'暂停环绕':'播放环绕'}
function stopFrames(){if(frameId)cancelAnimationFrame(frameId);frameId=0;last=0;speed=0}
function requestFrame(){if(pageActive&&!document.hidden&&!departing&&!frameId)frameId=requestAnimationFrame(frame)}
function frame(now){
frameId=0;if(!pageActive||document.hidden||departing){stopFrames();return}
const dt=last?Math.min((now-last)/1000,.05):0;last=now;const target=wantsMotion()?1:0;
speed+=(target-speed)*(1-Math.exp(-dt*5));if(speed<.001&&!target)speed=0;if(speed){elapsed+=dt*speed;dirty=true}if(dirty)render();if(speed||target)requestFrame();else last=0;
}
function changeMotion(){if(!loadedImages||departing)return;manual=!wantsMotion();if(manual)queueRemaining();syncButton();requestFrame()}
canvas.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovering=true;if(!reduced.matches)queueRemaining();syncButton();requestFrame()}});
canvas.addEventListener('pointerleave',()=>{hovering=false;syncButton();requestFrame()});
let touchStart=null;
canvas.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'&&event.isPrimary)touchStart={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()}});
canvas.addEventListener('pointercancel',()=>{touchStart=null});
canvas.addEventListener('pointerup',event=>{const start=touchStart;touchStart=null;if(start&&start.id===event.pointerId&&Math.hypot(event.clientX-start.x,event.clientY-start.y)<12&&performance.now()-start.time<750)changeMotion()});
toggle.addEventListener('click',changeMotion);
document.addEventListener('visibilitychange',()=>{if(document.hidden){hovering=false;stopFrames()}else{pumpPhotos();requestFrame()}syncButton()});
reduced.addEventListener('change',()=>{if(reduced.matches)manual=false;syncButton();requestFrame()});
window.addEventListener('resize',resize);
window.addEventListener('pagehide',()=>{pageActive=false;navigationEpoch++;clearTimeout(navigationTimer);stopFrames()});
window.addEventListener('pageshow',event=>{
pageActive=true;
if(event.persisted){navigationEpoch++;clearTimeout(navigationTimer);departing=false;document.body.classList.remove('is-entering');document.getElementById('enter').removeAttribute('aria-busy');hovering=false;manual=reduced.matches?false:null;stopFrames();resize()}
pumpPhotos();syncButton();requestFrame();
});
// Warm the existing map assets so the next scene is ready before departure.
function warmMap(){
if(warmedMap)return warmedMap;
const image=new Image();
const photo=new Promise(resolve=>{image.onload=()=>resolve();image.onerror=()=>resolve();image.src='assets/img/001.jpg'});
const page=fetch('tour.html',{cache:'reload'}).catch(()=>{});
warmedMap=Promise.all([photo,page]);return warmedMap;
}
for(const link of document.querySelectorAll('a[href^="tour.html"]')){
link.addEventListener('pointerenter',warmMap,{once:true,passive:true});
link.addEventListener('focus',warmMap,{once:true});
link.addEventListener('click',async event=>{
if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
event.preventDefault();if(departing)return;departing=true;const epoch=++navigationEpoch;
stopFrames();syncButton();document.getElementById('enter').setAttribute('aria-busy','true');
await Promise.race([warmMap(),new Promise(resolve=>setTimeout(resolve,850))]);
if(epoch!==navigationEpoch||!pageActive)return;
manual=false;hovering=false;syncButton();document.body.classList.add('is-entering');
navigationTimer=setTimeout(()=>{if(epoch===navigationEpoch&&pageActive)location.assign(link.href)},reduced.matches?0:220);
});
}
// Decode only two originals at a time. Foreground slots paint immediately;
// remaining artwork and the map warm up after the first view, or on interaction.
const priority=[2,0,3,10,1],remaining=[4,5,6,7,8,9],photoQueue=priority.slice(),settled=Array(11).fill(false);
let activeLoads=0,remainingQueued=false,extrasScheduled=false,extrasDone=false;
function queueRemaining(){if(remainingQueued)return;remainingQueued=true;photoQueue.push(...remaining);pumpPhotos()}
function scheduleExtras(){
if(lowData||extrasScheduled||extrasDone||!priority.every(index=>settled[index]))return;
extrasScheduled=true;const work=()=>{extrasScheduled=false;if(!pageActive||document.hidden||departing)return;extrasDone=true;queueRemaining();warmMap()};
if(window.requestIdleCallback)requestIdleCallback(work,{timeout:1500});else setTimeout(work,150);
}
function loadPhoto(index){return new Promise(resolve=>{
const img=new Image(),source='assets/home/optimized/home-'+String(index+1).padStart(2,'0');let triedJpeg=false;img.decoding='async';img.fetchPriority=index===2?'high':priority.includes(index)?'auto':'low';
img.onload=async()=>{let texture=null;try{if(img.decode)await img.decode().catch(()=>{});if(img.naturalWidth)texture=photoTexture(img)}catch(_){}img.onload=null;img.onerror=null;resolve(texture)};
img.onerror=()=>{if(!triedJpeg){triedJpeg=true;img.src=source+'.jpg';return}img.onload=null;img.onerror=null;resolve(null)};
img.src=source+'.webp';
})}
function pumpPhotos(){
if(!pageActive||document.hidden||departing)return;
while(activeLoads<2&&photoQueue.length){
const index=photoQueue.shift();activeLoads++;
loadPhoto(index).then(texture=>{
textures[index]=texture;settled[index]=true;settledImages++;activeLoads--;if(texture){loadedImages++;dirty=true;requestFrame()}
if(settledImages===11){initialized=true;if(!loadedImages){document.body.classList.add('gallery-failed');status.textContent='风物画面暂未载入，仍可直接进入庙会地图。'}else if(loadedImages<11)status.textContent='部分风物画面未能载入，仍可正常进入庙会地图。'}
if(lowData&&!loadedImages&&priority.every(index=>settled[index])){initialized=true;document.body.classList.add('gallery-failed');status.textContent='风物画面暂未载入，仍可直接进入庙会地图。'}
syncButton();scheduleExtras();pumpPhotos();
});
}
scheduleExtras();
}
window.__taihaoGallery={get ready(){return initialized},get complete(){return settledImages===11},get time(){return elapsed},get images(){return loadedImages},get failed(){return settledImages-loadedImages},get moving(){return wantsMotion()},get tiles(){return ring?ring.n:0},get framePending(){return!!frameId},get frames(){return frames}};
syncButton();resize();pumpPhotos();
if(document.fonts)document.fonts.ready.then(()=>{drawHeading();dirty=true;requestFrame()});
})();
