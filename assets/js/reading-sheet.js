/* Picture-first scenes with visible, contextual ways to explore each stop. */
(() => {
 'use strict';
 const phone=matchMedia('(max-width:680px), (max-width:920px) and (max-height:520px)');
 const landscape=matchMedia('(min-width:480px) and (max-width:920px) and (max-height:520px)');
 let stage,card,header,content,heading,title,count,name,subtitle,progress,toggle,toggleLabel,quick,explore,video,stamp,footer,previous,next,observer,frame=0;
 let options={},expanded=false,currentPoint=null,hasPrevious=false,hasNext=false,routeActive=false,ready=false,lastHeight=0,lastLayout='';
 let index=-1,total=0,chapter='',question='',hasVideo=false,canStamp=false,discovered=false;
 const busy=()=>document.getElementById('pointPending')?.hidden===false;
 function queueLayout(){
  if(frame)return;
  frame=requestAnimationFrame(()=>{
   frame=0;if(!ready)return;
   const rect=card.getBoundingClientRect();
   const signature=[rect.x,rect.y,rect.width,rect.height,innerWidth,innerHeight,phone.matches,expanded,stage.classList.contains('has-detail'),document.body.classList.contains('route-active')].join(':');
   if(signature===lastLayout)return;
   lastLayout=signature;
   if(phone.matches){const height=Math.ceil(rect.height);if(height&&height!==lastHeight){lastHeight=height;stage.style.setProperty('--reading-sheet-height',height+'px')}}
   else{lastHeight=0;stage.style.removeProperty('--reading-sheet-height')}
   document.dispatchEvent(new CustomEvent('taihao:sheetlayout',{detail:{expanded,mobile:phone.matches}}));
  });
 }
 function apply(){
  if(!ready)return;
  const collapsed=phone.matches&&!expanded,waiting=busy();
  content.hidden=collapsed;content.inert=collapsed;
  card.classList.toggle('rs-expanded',phone.matches&&expanded);card.classList.toggle('rs-with-nav',hasPrevious||hasNext);
  toggle.setAttribute('aria-expanded',String(!collapsed));
  toggleLabel.textContent=collapsed?(question||'你在图中发现了什么？'):'故事与玩法';
  toggle.title=question;
  toggle.setAttribute('aria-label',collapsed?(question||'当站观察问题')+'，展开故事与玩法':'收起故事与玩法');
  const hasPosition=routeActive&&index>=0&&total>0;
  count.hidden=!hasPosition;count.textContent=hasPosition?`${index+1}/${total}`:'';
  const place=document.getElementById('dcardTitle')?.textContent||'场景';
  name.textContent=place;
  subtitle.textContent=hasPosition?(chapter||'进香巡游')+' · 总览':chapter||document.getElementById('dcardStep')?.textContent||'';
  heading.disabled=!hasPosition||typeof options.onOverview!=='function';
  heading.setAttribute('aria-label',hasPosition?`第${index+1}/${total}站，${place}，${chapter}，查看巡游总览`:place);
  progress.hidden=!hasPosition;progress.style.setProperty('--rs-progress',hasPosition?Math.min(100,(index+1)/total*100)+'%':'0%');
  const selectedStop=document.querySelector('#routeDock .route-stop[aria-current="step"]');
  if(hasPosition&&!waiting&&selectedStop&&Number(selectedStop.dataset.routeIndex)===index){
   const railStep=selectedStop.querySelector('.route-step');
   if(railStep)railStep.dataset.readingProgress=`${index+1}/${total} · ${chapter||'进香巡游'}`;
  }
  quick.hidden=!collapsed;quick.setAttribute('aria-busy',String(waiting));
  explore.textContent=discovered?'再看细节':'找细节';explore.classList.toggle('is-discovered',discovered);
  explore.setAttribute('aria-label',discovered?'继续查看'+place+'已发现的看点':'在'+place+'中找细节');
  explore.disabled=waiting||typeof options.onExplore!=='function';
  video.hidden=!hasVideo;video.disabled=waiting||typeof options.onVideo!=='function';
  stamp.hidden=!canStamp;
  const originalStamp=document.getElementById('dStampBtn'),stamped=!!originalStamp?.classList.contains('done');
  stamp.textContent=stamped?'已集香印':'集香印';stamp.disabled=waiting||stamped||typeof options.onStamp!=='function';
  quick.style.setProperty('--rs-actions',String(1+(hasVideo?1:0)+(canStamp?1:0)));
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
  if(notify&&before!==expanded){options.onExpandChange?.(expanded);document.dispatchEvent(new CustomEvent('taihao:readingchange',{detail:{expanded,pointId:currentPoint}}))}
 }
 function button(id,className,label){const node=document.createElement('button');node.type='button';node.id=id;node.className=className;node.textContent=label;return node}
 function init(settings={}){
  options={...options,...settings};if(ready){apply();return api}
  stage=document.querySelector('.stage');card=document.getElementById('dcard');if(!stage||!card)return api;
  const close=document.getElementById('dcardClose');
  content=document.createElement('div');content.id='readingSheetContent';content.className='rs-content';
  for(const child of [...card.childNodes])if(child!==close)content.append(child);
  header=document.createElement('div');header.className='rs-header';
  heading=button('readingOverview','rs-heading','');
  title=document.createElement('span');title.className='rs-title';
  count=document.createElement('span');count.className='rs-count';
  name=document.createElement('span');name.className='rs-name';title.append(count,name);
  subtitle=document.createElement('span');subtitle.className='rs-subtitle';
  progress=document.createElement('span');progress.className='rs-progress';progress.setAttribute('aria-hidden','true');progress.append(document.createElement('i'));
  heading.append(title,subtitle,progress);
  toggle=button('readingSheetToggle','rs-toggle','');toggle.setAttribute('aria-controls',content.id);
  toggleLabel=document.createElement('span');toggleLabel.className='rs-question';toggle.append(toggleLabel);
  header.append(heading,toggle);if(close)header.append(close);
  quick=document.createElement('div');quick.className='rs-quick';quick.setAttribute('aria-label','当站玩法');
  explore=button('readingExplore','rs-quick-action rs-explore','找细节');
  video=button('readingVideo','rs-quick-action rs-video','看短片');
  stamp=button('readingStamp','rs-quick-action rs-stamp','集香印');quick.append(explore,video,stamp);
  footer=document.createElement('nav');footer.className='rs-footer';footer.setAttribute('aria-label','相邻点位');
  previous=button('readingPrevious','rs-step rs-previous','');next=button('readingNext','rs-step rs-next','');footer.append(previous,next);
  card.replaceChildren(header,quick,content,footer);
  toggle.addEventListener('click',()=>setExpanded(!expanded));
  heading.addEventListener('click',event=>{event.stopPropagation();if(!heading.disabled)options.onOverview?.(heading)});
  explore.addEventListener('click',event=>{event.stopPropagation();if(!explore.disabled&&!busy())options.onExplore?.(explore)});
  video.addEventListener('click',event=>{event.stopPropagation();if(!video.disabled&&!busy())options.onVideo?.(video)});
  stamp.addEventListener('click',event=>{event.stopPropagation();if(!stamp.disabled&&!busy())options.onStamp?.(stamp)});
  previous.addEventListener('click',()=>{if(!previous.disabled)options.onPrevious?.(previous)});
  next.addEventListener('click',()=>{if(!next.disabled)options.onNext?.(next)});
  card.classList.add('reading-sheet-ready');stage.classList.add('reading-sheet-enabled');ready=true;expanded=false;
  phone.addEventListener('change',()=>{expanded=false;apply()});landscape.addEventListener('change',apply);
  if(typeof ResizeObserver==='function'){observer=new ResizeObserver(queueLayout);observer.observe(card)}
  let wasDetail=stage.classList.contains('has-detail');
  const sceneObserver=new MutationObserver(()=>{const hasDetail=stage.classList.contains('has-detail');if(wasDetail&&!hasDetail){currentPoint=null;expanded=false;apply()}wasDetail=hasDetail});
  sceneObserver.observe(stage,{attributes:true,attributeFilter:['class']});
  for(const node of [document.getElementById('dStampBtn'),document.getElementById('pointPending')]){
   if(node)new MutationObserver(apply).observe(node,{attributes:true,attributeFilter:['disabled','class','hidden'],childList:true,subtree:true});
  }
  window.addEventListener('resize',queueLayout,{passive:true});apply();return api;
 }
 function sync(state={}){
  if(!ready)init();if(!ready)return api;
  const nextPoint=state.pointId??null,changed=nextPoint!==currentPoint;currentPoint=nextPoint;
  hasPrevious=state.hasPrevious===true;hasNext=state.hasNext===true;routeActive=state.routeActive===true;
  const fallback=(document.querySelector('#routeDock .route-position')?.textContent||'').match(/(\d+)\s*\/\s*(\d+)/);
  index=Number.isFinite(state.index)?state.index:fallback?Number(fallback[1])-1:-1;
  total=Number.isFinite(state.total)?state.total:fallback?Number(fallback[2]):0;
  chapter=typeof state.chapterTitle==='string'?state.chapterTitle:changed?document.getElementById('dcardStep')?.textContent||'':chapter;
  question=typeof state.question==='string'?state.question:changed?'你在图中发现了什么？':question;
  hasVideo=typeof state.hasVideo==='boolean'?state.hasVideo:[...document.querySelectorAll('#pointMedia button')].some(node=>node.textContent.includes('短片'));
  canStamp=typeof state.canStamp==='boolean'?state.canStamp:!document.getElementById('dStampBtn')?.classList.contains('off');
  discovered=typeof state.discovered==='boolean'?state.discovered:changed?false:discovered;
  if(changed){expanded=false;content.scrollTop=0}
  apply();return api;
 }
 const api={init,sync,expand:()=>setExpanded(true),collapse:()=>setExpanded(false),get expanded(){return expanded},get mobile(){return phone.matches},get ready(){return ready}};
 window.TaihaoReadingSheet=Object.freeze(api);
})();