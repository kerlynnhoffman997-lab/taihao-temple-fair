/* Resume only a recent, complete visit record; storage failure keeps the entrance usable. */
(() => {
'use strict';
const key='taihao-visit-v1',maxAge=7*24*60*60*1000;
const pointIds=new Set(['q1','q1b','q2','q3','q3b','q4','q5a','q5b','q6','q7','q8','q9','q10','e1','e2','e2b','longyuan','w1','w2','w3','f1','f2','f4','f3']);
const enter=document.getElementById('enter'),copy=document.querySelector('.entry-copy'),fresh=document.getElementById('start-fresh'),header=document.querySelector('.header-link');
if(!enter||!copy||!fresh)return;
function readVisit(){
 try{
  const raw=localStorage.getItem(key);if(!raw)return null;
  const value=JSON.parse(raw),now=Date.now();
  if(!value||value.v!==1||!Number.isFinite(value.updatedAt)||value.updatedAt>now||now-value.updatedAt>maxAge)return null;
  if(value.point!==null&&!pointIds.has(value.point))return null;
  if(value.point===null?value.pointName!==null:typeof value.pointName!=='string'||!value.pointName.trim()||value.pointName.length>80)return null;
  if(typeof value.route!=='boolean'||!['习俗','非遗','提示'].includes(value.tab))return null;
  if(!Number.isInteger(value.lastRouteIndex)||value.lastRouteIndex<0||value.lastRouteIndex>12)return null;
  const camera=value.camera;
  if(!camera||!['x','y','k'].every(name=>typeof camera[name]==='number'&&Number.isFinite(camera[name]))||Math.abs(camera.x)>10000||Math.abs(camera.y)>10000||camera.k<.9||camera.k>4.5)return null;
  return value;
 }catch(_){return null}
}
function syncEntrance(){
 const visit=readVisit(),href=visit?'tour.html?resume=1':'tour.html';
 enter.setAttribute('href',href);enter.querySelector('span').textContent=visit?'继续游览':'进入庙会';
 copy.textContent=visit?(visit.point?'上次停在 · '+visit.pointName:'继续上次行程'):'逛一场庙会，看一方风物。';
 fresh.hidden=!visit;document.body.classList.toggle('has-resume',!!visit);
 if(header){header.setAttribute('href',href);header.setAttribute('aria-label',visit?'继续上次游览':'走进庙会')}
}
window.addEventListener('pageshow',syncEntrance);
window.addEventListener('storage',event=>{if(event.key===key||event.key===null)syncEntrance()});
syncEntrance();
})();
