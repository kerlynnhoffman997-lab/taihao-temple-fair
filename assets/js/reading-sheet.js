/* A small reading panel around the existing scene content; no map/route engine changes. */
(() => {
 'use strict';
 const phone=matchMedia('(max-width:680px), (max-width:920px) and (max-height:520px)');
 const landscape=matchMedia('(min-width:480px) and (max-width:920px) and (max-height:520px)');
 let stage,card,header,content,title,subtitle,toggle,footer,previous,next,observer,frame=0;
 let options={},expanded=false,currentPoint=null,hasPrevious=false,hasNext=false,routeActive=false,ready=false,lastHeight=0,lastLayout='';
 function queueLayout(){
  if(frame)return;
  frame=requestAnimationFrame(()=>{
   frame=0;if(!ready)return;
   const rect=card.getBoundingClientRect();
   const signature=[rect.x,rect.y,rect.width,rect.height,innerWidth,innerHeight,phone.matches,expanded,stage.classList.contains('has-detail'),document.body.classList.contains('route-active')].join(':');
   if(signature===lastLayout)return;
   lastLayout=signature;
   if(phone.matches){
    const height=Math.ceil(rect.height);
    if(height&&height!==lastHeight){lastHeight=height;stage.style.setProperty('--reading-sheet-height',height+'px')}
   }else{lastHeight=0;stage.style.removeProperty('--reading-sheet-height')}
   document.dispatchEvent(new CustomEvent('taihao:sheetlayout',{detail:{expanded,mobile:phone.matches}}));
  });
 }
 function apply(){
  if(!ready)return;
  const collapsed=phone.matches&&!expanded;
  content.hidden=collapsed;content.inert=collapsed;
  card.classList.toggle('rs-expanded',phone.matches&&expanded);
  card.classList.toggle('rs-with-nav',hasPrevious||hasNext);
  toggle.setAttribute('aria-expanded',String(!collapsed));
  toggle.textContent=collapsed?'读说明':'收起';
  toggle.setAttribute('aria-label',(collapsed?'展开':'收起')+(title.textContent||'当前场景')+'说明');
  previous.disabled=!hasPrevious;next.disabled=!hasNext;
  previous.textContent=routeActive?'‹ 上一站':'‹ 上一处';next.textContent=routeActive?(hasNext?'下一站 ›':'已到终点'):'下一处 ›';
  footer.hidden=!(hasPrevious||hasNext);
  queueLayout();
 }
 function setExpanded(value,{notify=true}={}){
  if(!ready)return;
  const before=expanded;expanded=!!value;
  if(!expanded&&content.contains(document.activeElement))toggle.focus({preventScroll:true});
  apply();
  if(notify&&before!==expanded){
   options.onExpandChange?.(expanded);
   document.dispatchEvent(new CustomEvent('taihao:readingchange',{detail:{expanded,pointId:currentPoint}}));
  }
 }
 function init(settings={}){
  options={...options,...settings};if(ready)return api;
  stage=document.querySelector('.stage');card=document.getElementById('dcard');
  if(!stage||!card)return api;
  const close=document.getElementById('dcardClose');
  content=document.createElement('div');content.id='readingSheetContent';content.className='rs-content';
  for(const child of [...card.childNodes])if(child!==close)content.append(child);
  header=document.createElement('div');header.className='rs-header';
  const heading=document.createElement('div');heading.className='rs-heading';
  title=document.createElement('h3');title.className='rs-title';
  subtitle=document.createElement('span');subtitle.className='rs-subtitle';
  heading.append(title,subtitle);
  toggle=document.createElement('button');toggle.type='button';toggle.id='readingSheetToggle';toggle.className='rs-toggle';toggle.setAttribute('aria-controls',content.id);
  header.append(heading,toggle);if(close)header.append(close);
  footer=document.createElement('nav');footer.className='rs-footer';footer.setAttribute('aria-label','相邻点位');
  previous=document.createElement('button');previous.type='button';previous.id='readingPrevious';previous.className='rs-step rs-previous';
  next=document.createElement('button');next.type='button';next.id='readingNext';next.className='rs-step rs-next';
  footer.append(previous,next);card.replaceChildren(header,content,footer);
  toggle.addEventListener('click',()=>setExpanded(!expanded));
  previous.addEventListener('click',()=>{if(!previous.disabled)options.onPrevious?.()});
  next.addEventListener('click',()=>{if(!next.disabled)options.onNext?.()});
  card.classList.add('reading-sheet-ready');stage.classList.add('reading-sheet-enabled');ready=true;
  expanded=landscape.matches;
  const modeChanged=()=>{expanded=landscape.matches;apply()};
  phone.addEventListener('change',modeChanged);landscape.addEventListener('change',modeChanged);
  if(typeof ResizeObserver==='function'){observer=new ResizeObserver(queueLayout);observer.observe(card)}
  let wasDetail=stage.classList.contains('has-detail');
  const sceneObserver=new MutationObserver(()=>{
   const hasDetail=stage.classList.contains('has-detail');
   if(wasDetail&&!hasDetail){currentPoint=null;expanded=landscape.matches;apply()}
   wasDetail=hasDetail;
  });
  sceneObserver.observe(stage,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',queueLayout,{passive:true});
  apply();return api;
 }
 function sync(state={}){
  if(!ready)init();if(!ready)return api;
  const nextPoint=state.pointId??null,changed=nextPoint!==currentPoint;
  currentPoint=nextPoint;
  hasPrevious=state.hasPrevious===true;hasNext=state.hasNext===true;routeActive=state.routeActive===true;
  title.textContent=document.getElementById('dcardTitle')?.textContent||'场景';
  subtitle.textContent=document.getElementById('dcardStep')?.textContent||'';
  if(changed){expanded=landscape.matches;content.scrollTop=0}
  apply();return api;
 }
 const api={init,sync,expand:()=>setExpanded(true),collapse:()=>setExpanded(false),get expanded(){return expanded},get mobile(){return phone.matches},get ready(){return ready}};
 window.TaihaoReadingSheet=Object.freeze(api);
})();