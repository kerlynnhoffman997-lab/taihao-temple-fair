/* Native, local-data-only stamp book. Paper #F5EFE3, cinnabar #B33B24.
   Host owns persistence and navigation; this module only reads getStamps() and getDiscoveries(). */
(() => {
  'use strict';
  let current = null;
  const font = '"Microsoft YaHei","PingFang SC",sans-serif';

  function create(options = {}) {
    current?.destroy();
    function normalize(list) {
      const ids=new Set();
      return (Array.isArray(list)?list:[]).filter(point=>{
        if(!point||typeof point.id!=='string'||!point.id||ids.has(point.id))return false;
        ids.add(point.id);return true;
      }).map(point=>({id:point.id,name:typeof point.name==='string'&&point.name.trim()?point.name.trim():point.id,
        takeaway:typeof point.takeaway==='string'?point.takeaway.trim().slice(0,300):'',
        question:typeof point.question==='string'?point.question.trim().slice(0,200):''}));
    }
    const stops=normalize(options.stops),points=normalize(Array.isArray(options.points)&&options.points.length?options.points:options.stops);
    const events = new AbortController(), urls = new Set();
    let dialog, grid, summary, progress, status, completion, saveButton, exploreButton, filters, modes, recordNote;
    let opened = false, destroyed = false, trigger = null, overflow = '', filter = 'all', wasComplete = false, saving = false;
    let snapshot = {}, unavailable = false, discoveries = {}, discoveryUnavailable = false, mode = 'stamps';
    const modeFilters={stamps:'all',discoveries:'all'};
    const listen = (target,type,handler) => target.addEventListener(type,handler,{signal:events.signal});
    const element = (tag,className,text) => {
      const node = document.createElement(tag);if(className)node.className=className;
      if(text !== undefined)node.textContent=text;return node;
    };
    function button(className,text) { const node=element('button',className,text);node.type='button';return node; }
    function read() {
      unavailable=false;snapshot={};
      try {
        const data=typeof options.getStamps === 'function' ? options.getStamps() : {};
        if(!data || typeof data !== 'object' || Array.isArray(data))throw Error('Unavailable stamp record');
        for(const stop of stops)if(Object.prototype.hasOwnProperty.call(data,stop.id) && typeof data[stop.id] === 'string' && data[stop.id].trim())snapshot[stop.id]=data[stop.id].slice(0,80);
      } catch (_) { unavailable=true;snapshot={}; }
      return Object.keys(snapshot).length;
    }
    function readDiscoveries() {
      discoveryUnavailable=false;discoveries={};
      try {
        const data=typeof options.getDiscoveries==='function'?options.getDiscoveries():{};
        if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Unavailable discovery record');
        for(const point of points) {
          if(!Object.prototype.hasOwnProperty.call(data,point.id))continue;
          const record=data[point.id];
          if(!record||typeof record==='object'&&(Array.isArray(record)||record.discovered===false))continue;
          if(record!==true&&typeof record!=='string'&&typeof record!=='object')continue;
          const text=typeof record==='string'?record:typeof record.takeaway==='string'?record.takeaway:typeof record.summary==='string'?record.summary:'';
          discoveries[point.id]={takeaway:(text.trim()||point.takeaway||'已查看这里的一处文化细节。').slice(0,300)};
        }
      } catch (_) { discoveryUnavailable=true;discoveries={}; }
      return Object.keys(discoveries).length;
    }
    function renderDiscoveryCards(shown) {
      for(const point of shown) {
        const found=Object.prototype.hasOwnProperty.call(discoveries,point.id),li=element('li','tsb-item tsb-discovery-item');
        const card=element('article','tsb-discovery-card'+(found?' is-discovered':''));
        const heading=element('div','tsb-discovery-heading');
        heading.append(element('h3','tsb-discovery-name',point.name),element('span','tsb-discovery-state',discoveryUnavailable?'记录暂不可读':found?'已发现':'待发现'));
        card.append(heading,element('p','tsb-discovery-takeaway',found?discoveries[point.id].takeaway:point.question||'这里藏着怎样的民俗细节？'));
        const action=button('tsb-discovery-visit',found?'再看这处发现 →':'去找细节 →');action.dataset.stampId=point.id;
        card.append(action);li.append(card);grid.append(li);
      }
    }
    function setView(value){
      if(!['stamps','discoveries'].includes(value)||value===mode)return;
      modeFilters[mode]=filter;mode=value;filter=modeFilters[mode];
      if(typeof options.onViewChange==='function')options.onViewChange(mode);
    }
    function tell(message) { if(status)status.textContent=message; }
    function mount() {
      if(dialog)return;
      dialog=document.createElement('dialog');dialog.className='taihao-stamp-book';
      dialog.setAttribute('aria-labelledby','tsb-title');dialog.setAttribute('aria-describedby','tsb-summary');
      dialog.innerHTML='<div class="tsb-shell"><header class="tsb-header"><div><p class="tsb-eyebrow">太昊陵庙会 · 我的进香路</p><h2 id="tsb-title">香印册</h2></div><button type="button" class="tsb-close" aria-label="关闭香印册">×</button></header><div class="tsb-modes" role="group" aria-label="查看香印或文化发现"><button type="button" class="tsb-mode" data-book-view="stamps">进香香印</button><button type="button" class="tsb-mode" data-book-view="discoveries">我的发现</button></div><section class="tsb-progress"><p id="tsb-summary" aria-live="polite"></p><progress aria-label="香印收集进度"></progress><p class="tsb-record-note">点选地点继续游览。记录来自当前浏览器。</p></section><div class="tsb-filters" role="group" aria-label="筛选香印"></div><div class="tsb-scroll"><section class="tsb-completion" hidden><p class="tsb-completion-kicker">这一程，九印已齐</p><h3>把庙会的记忆收好</h3><p>九处香印都已收集。存下纪念图，再去看看庙会风物。</p></section><ul class="tsb-grid"></ul><p class="tsb-status" role="status"></p></div><footer class="tsb-footer"><button type="button" class="tsb-action tsb-save">保存香印纪念图</button><button type="button" class="tsb-action tsb-explore">继续逛民俗风物</button><p>纪念图由本页文字与图形生成，不含个人信息。</p></footer></div>';
      document.body.append(dialog);
      grid=dialog.querySelector('.tsb-grid');summary=dialog.querySelector('#tsb-summary');
      progress=dialog.querySelector('progress');status=dialog.querySelector('.tsb-status');
      completion=dialog.querySelector('.tsb-completion');saveButton=dialog.querySelector('.tsb-save');
      exploreButton=dialog.querySelector('.tsb-explore');filters=dialog.querySelector('.tsb-filters');
      modes=dialog.querySelector('.tsb-modes');recordNote=dialog.querySelector('.tsb-record-note');
      for(const [value,label] of [['all','全部'],['remaining','未盖印'],['collected','已盖印']]) {
        const item=button('tsb-filter',label);item.dataset.stampFilter=value;item.dataset.label=label;filters.append(item);
      }
      exploreButton.hidden=typeof options.onExplore !== 'function';
      listen(dialog.querySelector('.tsb-close'),'click',()=>close());
      listen(dialog,'cancel',event=>{event.preventDefault();event.stopPropagation();close({reason:'escape'});});
      listen(dialog,'close',()=>{if(opened&&!dialog.open)close();});
      listen(dialog,'click',event=>{
        if(event.target!==dialog)return;
        const r=dialog.getBoundingClientRect();
        if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close({reason:'backdrop'});
      });
      listen(modes,'click',event=>{const item=event.target.closest('[data-book-view]');if(!item)return;setView(item.dataset.bookView);refresh();});
      listen(filters,'click',event=>{
        const item=event.target.closest('[data-stamp-filter]');if(!item)return;
        filter=item.dataset.stampFilter;refresh();
      });
      listen(grid,'click',event=>{
        const item=event.target.closest('[data-stamp-id]');if(!item)return;
        const id=item.dataset.stampId;close({restoreFocus:false,reason:'choose'});options.onChoose?.(id);
      });
      listen(exploreButton,'click',()=>{close({restoreFocus:false,reason:'explore'});options.onExplore?.();});
      listen(saveButton,'click',exportPng);
      listen(dialog,'keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close({reason:'escape'});return;}
        if(event.key!=='Tab')return;
        const nodes=[...dialog.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')].filter(node=>node.getClientRects().length);
        if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      });
    }
    function refresh() {
      if(destroyed)return;
      const count=read(),discoveredCount=readDiscoveries();if(!dialog)return;
      const focus=document.activeElement,focusedId=focus?.dataset?.stampId,focusedFilter=focus?.dataset?.stampFilter;
      const isDiscovery=mode==='discoveries',viewUnavailable=isDiscovery?discoveryUnavailable:unavailable;
      if(viewUnavailable)filter='all';
      const complete=!unavailable&&stops.length>0&&count===stops.length;
      if(complete&&!wasComplete&&!isDiscovery)filter='all';wasComplete=complete;
      dialog.classList.toggle('is-complete',complete);dialog.classList.toggle('is-unavailable',unavailable);
      dialog.classList.toggle('shows-discoveries',isDiscovery);
      const total=isDiscovery?points.length:stops.length,value=isDiscovery?discoveredCount:count;
      summary.textContent=isDiscovery?(discoveryUnavailable?'发现记录暂时无法读取':'已发现 '+value+' / '+total+' 处文化细节'):
        unavailable?'香印记录暂时无法读取':stops.length?'已盖 '+count+' / '+stops.length+' 印'+(complete?' · 全部收齐':' · 还有 '+(stops.length-count)+' 处未盖印'):'暂未提供盖印地点';
      progress.max=Math.max(1,total);progress.value=value;progress.hidden=viewUnavailable||!total;
      progress.setAttribute('aria-label',isDiscovery?'文化发现进度':'香印收集进度');
      recordNote.textContent=isDiscovery?'点开注解、读专属故事或看短片，留下你的发现。':'点选地点继续游览。香印与文化发现分别记录。';
      for(const item of modes.children) {
        const discovery=item.dataset.bookView==='discoveries';
        item.textContent=discovery?'我的发现 · '+discoveredCount+'/'+points.length:'进香香印 · '+count+'/'+stops.length;
        item.setAttribute('aria-pressed',String(item.dataset.bookView===mode));
      }
      filters.setAttribute('aria-label',isDiscovery?'筛选文化发现':'筛选香印');
      const totals={all:total,remaining:total-value,collected:value},labels=isDiscovery?{all:'全部',remaining:'未发现',collected:'已发现'}:{all:'全部',remaining:'未盖印',collected:'已盖印'};
      for(const item of filters.children) {
        item.textContent=labels[item.dataset.stampFilter]+(viewUnavailable&&item.dataset.stampFilter!=='all'?'':' '+totals[item.dataset.stampFilter]);
        item.setAttribute('aria-pressed',String(item.dataset.stampFilter===filter));item.disabled=viewUnavailable&&item.dataset.stampFilter!=='all';
      }
      const records=isDiscovery?discoveries:snapshot,source=isDiscovery?points:stops;
      const shown=source.filter(point=>filter==='all'||(filter==='collected')===Object.prototype.hasOwnProperty.call(records,point.id));
      grid.replaceChildren();
      if(isDiscovery)renderDiscoveryCards(shown);
      else for(const stop of shown) {
        const stamped=Object.prototype.hasOwnProperty.call(snapshot,stop.id),li=element('li','tsb-item');
        const item=button('tsb-place'+(stamped?' is-stamped':''));item.dataset.stampId=stop.id;
        const mark=element('span','tsb-seal',unavailable?'地点':stamped?'已盖':'待访');mark.setAttribute('aria-hidden','true');
        const copy=element('span','tsb-place-copy');
        copy.append(element('span','tsb-place-name',stop.name),element('span','tsb-place-state',unavailable?'仍可前往此处':stamped?'已盖印 · '+snapshot[stop.id]:'未盖印 · 前往此处'));
        item.append(mark,copy);li.append(item);grid.append(li);
      }
      if(!shown.length)grid.append(element('li','tsb-empty',isDiscovery?(filter==='collected'?'还没有留下发现，选一处地点去找细节。':'这一组已看完，可查看全部地点。'):!stops.length?'暂时没有盖印地点，仍可继续游览风物。':filter==='collected'?'还没有盖印，选一处未盖印地点开始。':'这些香印都已收好，可查看全部地点。'));
      completion.hidden=isDiscovery||!complete;saveButton.disabled=unavailable||!stops.length||saving;
      saveButton.textContent=saving?'正在生成纪念图…':complete?'保存九印纪念图':'保存云游纪念图';
      tell(isDiscovery&&discoveryUnavailable?'发现记录暂不可读取，香印仍可正常收集。':!isDiscovery&&unavailable?'记录暂不可读取，地点仍可正常进入。':'');
      if(opened&&focusedId)grid.querySelector('[data-stamp-id="'+CSS.escape(focusedId)+'"]')?.focus({preventScroll:true});
      else if(opened&&focusedFilter)filters.querySelector('[data-stamp-filter="'+focusedFilter+'"]')?.focus({preventScroll:true});
      return {count,total:stops.length,complete,unavailable,discovered:discoveredCount,pointTotal:points.length,discoveryUnavailable,view:mode};
    }
    function open(source,settings={}) {
      if(destroyed)return false;mount();
      if(settings)setView(settings.view);
      if(opened){refresh();return true;}
      trigger=source instanceof HTMLElement?source:document.activeElement;overflow=document.body.style.overflow;
      document.body.style.overflow='hidden';opened=true;refresh();
      if(typeof dialog.showModal==='function')dialog.showModal();
      else{dialog.setAttribute('open','');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');}
      dialog.querySelector('.tsb-close').focus({preventScroll:true});options.onOpen?.();
      return true;
    }
    function close({restoreFocus=true,notify=true,reason='dismiss'}={}) {
      if(!opened)return;opened=false;
      if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
      document.body.style.overflow=overflow;
      const source=trigger;trigger=null;
      if(restoreFocus&&source instanceof HTMLElement&&source.isConnected&&source.getClientRects().length&&!source.closest('[inert],[hidden]'))source.focus({preventScroll:true});
      if(notify)options.onClose?.({reason,restoreFocus});
    }
    async function exportPng() {
      if(destroyed||saving)return;const count=read(),discoveredCount=readDiscoveries();
      if(unavailable||!stops.length){refresh();return;}
      saving=true;saveButton.disabled=true;saveButton.textContent='正在生成纪念图…';tell('正在生成香印纪念图…');
      try {
        const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=discoveredCount?1900:1600;
        const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
        const ink='#30271d',red='#B33B24',muted='#88775f',paper='#F5EFE3';
        ctx.fillStyle=paper;ctx.fillRect(0,0,1200,canvas.height);
        ctx.strokeStyle='#d6c8b0';ctx.lineWidth=2;ctx.strokeRect(42,42,1116,canvas.height-84);ctx.strokeRect(54,54,1092,canvas.height-108);
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle=muted;ctx.font='28px '+font;ctx.fillText('太昊陵庙会 · 进香巡游图',600,128);
        ctx.fillStyle=ink;ctx.font='600 70px '+font;ctx.fillText('我的香印册',600,224);
        ctx.fillStyle=red;ctx.font='34px '+font;ctx.fillText('已盖 '+count+' / '+stops.length+' 印'+(count===stops.length?' · 九印已齐':''),600,314);
        ctx.fillStyle=muted;ctx.font='25px '+font;ctx.fillText(discoveryUnavailable?'文化发现记录暂不可读取':'已发现 '+discoveredCount+' / '+points.length+' 处文化细节',600,366);
        const columns=3,rows=Math.ceil(stops.length/columns),cellW=324,cellH=Math.min(310,980/Math.max(1,rows)),left=114,top=414;
        for(let i=0;i<stops.length;i++) {
          const stop=stops[i],stamped=Object.prototype.hasOwnProperty.call(snapshot,stop.id),cx=left+(i%columns)*cellW+cellW/2,cy=top+Math.floor(i/columns)*cellH;
          const color=stamped?red:'#afa08b';ctx.strokeStyle=color;ctx.lineWidth=stamped?5:2;
          ctx.strokeRect(cx-105,cy,210,146);ctx.lineWidth=2;ctx.strokeRect(cx-96,cy+9,192,128);
          ctx.fillStyle=color;ctx.font='600 48px '+font;ctx.fillText(stamped?'已盖印':'待来访',cx,cy+74);
          ctx.fillStyle=ink;ctx.font='28px '+font;ctx.fillText(stop.name,cx,cy+188,294);
          ctx.fillStyle=muted;ctx.font='20px '+font;ctx.fillText(stamped?snapshot[stop.id]:'未盖印',cx,cy+228,294);
        }
        if(discoveredCount) {
          ctx.textAlign='left';ctx.fillStyle=ink;ctx.font='600 28px '+font;
          ctx.fillText('我的文化发现',130,1345);
          const selected=points.filter(point=>Object.prototype.hasOwnProperty.call(discoveries,point.id)).slice(0,3);
          ctx.font='23px '+font;
          for(let i=0;i<selected.length;i++) {
            const point=selected[i],text=point.name+'：'+discoveries[point.id].takeaway,lines=[];let line='';
            for(const character of text) {
              if(ctx.measureText(line+character).width>940&&line){lines.push(line);line='';}
              line+=character;
            }
            if(line)lines.push(line);
            if(lines.length>2){lines.length=2;while(ctx.measureText(lines[1]+'…').width>940)lines[1]=lines[1].slice(0,-1);lines[1]+='…';}
            ctx.fillStyle=muted;for(let j=0;j<lines.length;j++)ctx.fillText(lines[j],130,1395+i*82+j*29);
          }
          ctx.textAlign='center';
        }
        ctx.fillStyle=ink;ctx.font='30px '+font;ctx.fillText(count===stops.length?'九处香印，留住这一程':'沿着香印，继续这一程',600,canvas.height-170);
        ctx.fillStyle=muted;ctx.font='20px '+font;ctx.fillText('浏览器内的虚拟盖印纪念 · 原创文字与几何图形',600,canvas.height-110);
        const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('PNG unavailable')),'image/png'));
        if(destroyed)return;
        const url=URL.createObjectURL(blob);urls.add(url);
        const link=document.createElement('a');link.href=url;link.download='太昊陵庙会-香印册-'+count+'印'+(discoveredCount?'-'+discoveredCount+'处发现':'')+'.png';document.body.append(link);link.click();link.remove();
        setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url)},30000);
        tell('纪念图已生成，请查看浏览器下载。');
      } catch (_) { tell('纪念图暂未能生成，请稍后再试。香印记录不会改变。'); }
      finally {saving=false;if(!destroyed){saveButton.disabled=unavailable||!stops.length;saveButton.textContent=count===stops.length?'保存九印纪念图':'保存香印纪念图';}}
    }
    function destroy() {
      if(destroyed)return;close({restoreFocus:false,notify:false});destroyed=true;events.abort();
      for(const url of urls)URL.revokeObjectURL(url);urls.clear();dialog?.remove();if(current===api)current=null;
    }
    const api={open,close,refresh,destroy,get isOpen(){return opened;},get view(){return mode;}};
    current=api;return api;
  }
  window.TaihaoStampBook=Object.freeze({create});
})();
