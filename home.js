/*
Perspective ring adapted from Gallery Heading.
Copyright (c) Meng To / Design+Code. MIT License.
Source: https://threeui.com/component/gallery-heading
See THIRD_PARTY_NOTICES.txt. Artwork is supplied by the website owner.
*/
(() => {
'use strict';
const canvas=document.getElementById('gallery-canvas'),ctx=canvas.getContext('2d');
if(!ctx)return;
const toggle=document.getElementById('motion-toggle'),label=document.getElementById('motion-label');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),textures=[];
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
const ex=pt[0]-p[0],ey=pt[1]-p[1],fx=pa[0]-p[0],fy=pa[1]-p[1];if(Math.abs(ex*fy-ey*fx)<.4||!textures.length)return;
const image=textures[index%textures.length];ctx.save();ctx.setTransform(ex*2/image.width,ey*2/image.width,fx*2/image.height,fy*2/image.height,p[0],p[1]);roundRect(ctx,image.width,image.height,25);ctx.clip();ctx.drawImage(image,-image.width/2,-image.height/2);
if(C[2]<0){ctx.fillStyle='rgba(245,239,227,.4)';ctx.fillRect(-image.width/2,-image.height/2,image.width,image.height)}
ctx.restore();ctx.setTransform(1,0,0,1,0,0);
}
function render(){
if(!heading)return;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
const list=Array.from({length:ring.n},(_,i)=>{const psi=rad(ring.phase)-i*2*Math.PI/ring.n+elapsed*.28;return{i,psi,z:Math.cos(psi)*U[2]+Math.sin(psi)*V[2]}}).sort((a,b)=>a.z-b.z);
let textDrawn=false;for(const tile of list){if(!textDrawn&&tile.z>0){ctx.drawImage(heading,0,0);textDrawn=true}drawTile(tile.i,tile.psi)}if(!textDrawn)ctx.drawImage(heading,0,0);dirty=false;
}
function wantsMotion(){return!document.hidden&&(manual===null?hovering&&!reduced.matches:manual)}
function syncButton(){const moving=wantsMotion();toggle.setAttribute('aria-pressed',String(moving));label.textContent=moving?'暂停环绕':'播放环绕'}
function requestFrame(){if(!frameId)frameId=requestAnimationFrame(frame)}
function frame(now){
frameId=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;const target=wantsMotion()?1:0;
speed+=(target-speed)*(1-Math.exp(-dt*5));if(speed<.001&&!target)speed=0;if(speed){elapsed+=dt*speed;dirty=true}if(dirty)render();if(speed||target)requestFrame();else last=0;
}
canvas.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovering=true;syncButton();requestFrame()}});
canvas.addEventListener('pointerleave',()=>{hovering=false;syncButton();requestFrame()});
canvas.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse'){manual=!wantsMotion();syncButton();requestFrame()}});
toggle.addEventListener('click',()=>{manual=!wantsMotion();syncButton();requestFrame()});
document.addEventListener('visibilitychange',()=>{last=0;syncButton();requestFrame()});
reduced.addEventListener('change',()=>{if(reduced.matches)manual=false;syncButton();requestFrame()});
window.addEventListener('resize',resize);window.addEventListener('pageshow',()=>{document.body.classList.remove('is-entering');departing=false;document.querySelector('#enter').removeAttribute('aria-busy');last=0;speed=0;hovering=false;manual=reduced.matches?false:null;syncButton();requestFrame()});
// Warm the existing map assets so the next scene is ready before departure.
let warmedMap=null,departing=false;
function warmMap(){
if(warmedMap)return warmedMap;
const image=new Image();
const photo=new Promise(resolve=>{image.onload=()=>resolve();image.onerror=()=>resolve();image.src='assets/img/001.jpg'});
const page=fetch('tour.html',{cache:'force-cache'}).catch(()=>{});
warmedMap=Promise.all([photo,page]);return warmedMap;
}
for(const link of document.querySelectorAll('a[href="tour.html"]')){
link.addEventListener('pointerenter',warmMap,{once:true,passive:true});
link.addEventListener('focus',warmMap,{once:true});
link.addEventListener('click',async event=>{
if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
event.preventDefault();if(departing)return;departing=true;
document.querySelector('#enter').setAttribute('aria-busy','true');
await Promise.race([warmMap(),new Promise(resolve=>setTimeout(resolve,850))]);
manual=false;speed=0;hovering=false;syncButton();
document.body.classList.add('is-entering');
setTimeout(()=>location.assign(link.href),reduced.matches?0:220);
});
}
if(!navigator.connection?.saveData&&!/2g/.test(navigator.connection?.effectiveType||'')){
if(window.requestIdleCallback)requestIdleCallback(warmMap,{timeout:1800});else setTimeout(warmMap,1200);
}
window.__taihaoGallery={get ready(){return initialized},get time(){return elapsed},get images(){return textures.length},get moving(){return wantsMotion()},get tiles(){return ring?ring.n:0}};
resize();
Promise.all(Array.from({length:11},(_,i)=>new Promise(resolve=>{
const img=new Image();img.decoding='async';img.onload=()=>resolve(photoTexture(img));img.onerror=()=>resolve(null);img.src='assets/home/home-'+String(i+1).padStart(2,'0')+'.jpg';
}))).then(results=>{textures.push(...results.filter(Boolean));initialized=true;document.body.classList.add('gallery-ready');dirty=true;requestFrame()});
if(document.fonts)document.fonts.ready.then(()=>{drawHeading();dirty=true;requestFrame()});
})();
