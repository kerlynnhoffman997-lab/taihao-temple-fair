/* One overview explains the full map, the route and its optional stamps. */
(() => {
 'use strict';
 function create(options={}){
  let dialog,opened=false,trigger=null;const byId=new Map((options.points||[]).map(p=>[p.id,p]));
  function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el}
  function mount(){
   if(dialog)return;
   dialog=document.createElement('dialog');dialog.className='journey-guide';dialog.setAttribute('aria-labelledby','journeyGuideTitle');
   dialog.innerHTML='<div class="jg-shell"><header><div><p class="jg-eyebrow">线上民俗云游</p><h2 id="journeyGuideTitle">这一程，怎样逛</h2></div><button class="jg-close" type="button" aria-label="关闭巡游概览">×</button></header><div class="jg-scroll"><p class="jg-purpose">沿一条进香路，认识人们如何相聚、表达心愿，再把庙会风物带回生活。</p><p class="jg-counts"><b>24处</b>是全图点位；<b>13站</b>串成进香路，其中<b>9处</b>可以盖香印。</p><p class="jg-play">先看场景，再点图中标记找细节；打开注解、读文化关联或播放短片，会留下“我的发现”。也可手动记下当站看点，香印可自由收集。</p><div class="jg-chapters"></div><section class="jg-about"><h3>画面与资料</h3><p>场景为AI辅助创作的艺术化插画，地图为云游示意。故事介绍相关民俗、旧礼俗与传说；实地开放和参观安排请以景区现场信息为准。</p><p>香印记录到访，“我的发现”记录你打开过的内容；两项进度分别保存。</p><div class="jg-sources"></div></section></div></div>';
   document.body.append(dialog);dialog.querySelector('.jg-close').onclick=()=>close();
   dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
   dialog.addEventListener('click',e=>{const target=e.target.closest('[data-journey-id]');if(target){const id=target.dataset.journeyId;close({restoreFocus:false,reason:'choose'});options.onChoose?.(id)}else if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
   dialog.addEventListener('close',()=>{if(opened&&!dialog.open)close()});
   const sources=dialog.querySelector('.jg-sources');for(const source of options.sources||[]){if(!source.url?.startsWith('https://'))continue;const link=node('a','',source.title);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';sources.append(link)}
  }
  function refresh(){
   if(!dialog)return;const list=dialog.querySelector('.jg-chapters'),current=options.getCurrent?.(),focused=document.activeElement?.closest('[data-journey-id]')?.dataset.journeyId;list.replaceChildren();
   (options.chapters||[]).forEach((chapter,index)=>{
    const section=node('section','jg-chapter');section.append(node('h3','',String(index+1).padStart(2,'0')+' · '+chapter.title),node('p','jg-intro',chapter.intro));const stops=node('div','jg-stops');
    for(const id of chapter.pointIds){const point=byId.get(id);if(!point)continue;const button=node('button','jg-stop');button.type='button';button.dataset.journeyId=id;if(id===current)button.setAttribute('aria-current','step');button.append(node('span','',point.name),node('small','',options.hasDiscovery?.(id)?'已打开线索':id===current?'当前一站':'走近看看'));stops.append(button)}
    section.append(stops);list.append(section);
   });
   if(opened&&focused)list.querySelector('[data-journey-id="'+focused+'"]')?.focus({preventScroll:true});
  }
  function open(source){mount();trigger=source instanceof HTMLElement?source:document.activeElement;if(!opened){options.onOpen?.();opened=true;dialog.showModal()}refresh();dialog.querySelector('.jg-close').focus({preventScroll:true});}
  function close({restoreFocus=true,notify=true,reason='dismiss'}={}){if(!opened)return;opened=false;dialog.close();if(restoreFocus&&trigger?.isConnected)trigger.focus({preventScroll:true});if(notify)options.onClose?.({reason});}
  return {open,close,refresh,get isOpen(){return opened}};
 }
 window.TaihaoJourneyGuide={create};
})();
