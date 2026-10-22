/* Native, local-data-only stamp book. Paper #F5EFE3, cinnabar #B33B24.
   Host owns persistence and navigation; this module only reads getStamps(). */
(() => {
  'use strict';
  let current = null;
  const font = '"Microsoft YaHei","PingFang SC",sans-serif';

  function create(options = {}) {
    current?.destroy();
    const seen = new Set();
    const stops = (Array.isArray(options.stops) ? options.stops : []).filter(stop => {
      if (!stop || typeof stop.id !== 'string' || !stop.id || seen.has(stop.id)) return false;
      seen.add(stop.id);return true;
    }).map(stop => ({id:stop.id,name:typeof stop.name === 'string' && stop.name.trim() ? stop.name.trim() : stop.id}));
    const events = new AbortController(), urls = new Set();
    let dialog, grid, summary, progress, status, completion, saveButton, exploreButton, filters;
    let opened = false, destroyed = false, trigger = null, overflow = '', filter = 'all', wasComplete = false, saving = false;
    let snapshot = {}, unavailable = false;
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
    function tell(message) { if(status)status.textContent=message; }
    function mount() {
      if(dialog)return;
      dialog=document.createElement('dialog');dialog.className='taihao-stamp-book';
      dialog.setAttribute('aria-labelledby','tsb-title');dialog.setAttribute('aria-describedby','tsb-summary');
      dialog.innerHTML='<div class="tsb-shell"><header class="tsb-header"><div><p class="tsb-eyebrow">太昊陵庙会 · 我的进香路</p><h2 id="tsb-title">香印册</h2></div><button type="button" class="tsb-close" aria-label="关闭香印册">×</button></header><section class="tsb-progress"><p id="tsb-summary" aria-live="polite"></p><progress aria-label="香印收集进度"></progress><p class="tsb-record-note">点选地点继续游览。记录来自当前浏览器。</p></section><div class="tsb-filters" role="group" aria-label="筛选香印"></div><div class="tsb-scroll"><section class="tsb-completion" hidden><p class="tsb-completion-kicker">这一程，九印已齐</p><h3>把庙会的记忆收好</h3><p>九处香印都已收集。存下纪念图，再去看看庙会风物。</p></section><ul class="tsb-grid"></ul><p class="tsb-status" role="status"></p></div><footer class="tsb-footer"><button type="button" class="tsb-action tsb-save">保存香印纪念图</button><button type="button" class="tsb-action tsb-explore">继续逛民俗风物</button><p>纪念图由本页文字与图形生成，不含个人信息。</p></footer></div>';
      document.body.append(dialog);
      grid=dialog.querySelector('.tsb-grid');summary=dialog.querySelector('#tsb-summary');
      progress=dialog.querySelector('progress');status=dialog.querySelector('.tsb-status');
      completion=dialog.querySelector('.tsb-completion');saveButton=dialog.querySelector('.tsb-save');
      exploreButton=dialog.querySelector('.tsb-explore');filters=dialog.querySelector('.tsb-filters');
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
      const count=read();if(!dialog)return;
      const focus=document.activeElement,focusedId=focus?.dataset?.stampId,focusedFilter=focus?.dataset?.stampFilter;
      if(unavailable)filter='all';
      const complete=!unavailable&&stops.length>0&&count===stops.length;
      if(complete&&!wasComplete)filter='all';wasComplete=complete;
      dialog.classList.toggle('is-complete',complete);dialog.classList.toggle('is-unavailable',unavailable);
      summary.textContent=unavailable?'香印记录暂时无法读取':stops.length?'已盖 '+count+' / '+stops.length+' 印'+(complete?' · 全部收齐':' · 还有 '+(stops.length-count)+' 处未盖印'):'暂未提供盖印地点';
      progress.max=Math.max(1,stops.length);progress.value=count;progress.hidden=unavailable||!stops.length;
      const totals={all:stops.length,remaining:stops.length-count,collected:count};
      for(const item of filters.children) {
        item.textContent=item.dataset.label+(unavailable&&item.dataset.stampFilter!=='all'?'':' '+totals[item.dataset.stampFilter]);
        item.setAttribute('aria-pressed',String(item.dataset.stampFilter===filter));
        item.disabled=unavailable&&item.dataset.stampFilter!=='all';
      }
      const shown=stops.filter(stop=>filter==='all'||(filter==='collected')===Object.prototype.hasOwnProperty.call(snapshot,stop.id));
      grid.replaceChildren();
      for(const stop of shown) {
        const stamped=Object.prototype.hasOwnProperty.call(snapshot,stop.id),li=element('li','tsb-item');
        const item=button('tsb-place'+(stamped?' is-stamped':''));item.dataset.stampId=stop.id;
        const mark=element('span','tsb-seal',unavailable?'地点':stamped?'已盖':'待访');mark.setAttribute('aria-hidden','true');
        const copy=element('span','tsb-place-copy');
        copy.append(element('span','tsb-place-name',stop.name),element('span','tsb-place-state',unavailable?'仍可前往此处':stamped?'已盖印 · '+snapshot[stop.id]:'未盖印 · 前往此处'));
        item.append(mark,copy);li.append(item);grid.append(li);
      }
      if(!shown.length){const empty=element('li','tsb-empty',!stops.length?'暂时没有盖印地点，仍可继续游览风物。':filter==='collected'?'还没有盖印，选一处未盖印地点开始。':'这些香印都已收好，可查看全部地点。');grid.append(empty);}
      completion.hidden=!complete;saveButton.disabled=unavailable||!stops.length||saving;
      saveButton.textContent=saving?'正在生成纪念图…':complete?'保存九印纪念图':'保存香印纪念图';
      tell(unavailable?'记录暂不可读取，地点仍可正常进入。':'');
      if(opened&&focusedId)grid.querySelector('[data-stamp-id="'+CSS.escape(focusedId)+'"]')?.focus({preventScroll:true});
      else if(opened&&focusedFilter)filters.querySelector('[data-stamp-filter="'+focusedFilter+'"]')?.focus({preventScroll:true});
      return {count,total:stops.length,complete,unavailable};
    }
    function open(source) {
      if(destroyed)return false;mount();
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
      if(destroyed||saving)return;const count=read();
      if(unavailable||!stops.length){refresh();return;}
      saving=true;saveButton.disabled=true;saveButton.textContent='正在生成纪念图…';tell('正在生成香印纪念图…');
      try {
        const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;
        const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
        const ink='#30271d',red='#B33B24',muted='#88775f',paper='#F5EFE3';
        ctx.fillStyle=paper;ctx.fillRect(0,0,1200,1600);
        ctx.strokeStyle='#d6c8b0';ctx.lineWidth=2;ctx.strokeRect(42,42,1116,1516);ctx.strokeRect(54,54,1092,1492);
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle=muted;ctx.font='28px '+font;ctx.fillText('太昊陵庙会 · 进香巡游图',600,128);
        ctx.fillStyle=ink;ctx.font='600 70px '+font;ctx.fillText('我的香印册',600,224);
        ctx.fillStyle=red;ctx.font='34px '+font;ctx.fillText('已盖 '+count+' / '+stops.length+' 印'+(count===stops.length?' · 九印已齐':''),600,314);
        const columns=3,rows=Math.ceil(stops.length/columns),cellW=324,cellH=Math.min(310,980/Math.max(1,rows)),left=114,top=414;
        for(let i=0;i<stops.length;i++) {
          const stop=stops[i],stamped=Object.prototype.hasOwnProperty.call(snapshot,stop.id),cx=left+(i%columns)*cellW+cellW/2,cy=top+Math.floor(i/columns)*cellH;
          const color=stamped?red:'#afa08b';ctx.strokeStyle=color;ctx.lineWidth=stamped?5:2;
          ctx.strokeRect(cx-105,cy,210,146);ctx.lineWidth=2;ctx.strokeRect(cx-96,cy+9,192,128);
          ctx.fillStyle=color;ctx.font='600 48px '+font;ctx.fillText(stamped?'已盖印':'待来访',cx,cy+74);
          ctx.fillStyle=ink;ctx.font='28px '+font;ctx.fillText(stop.name,cx,cy+188,294);
          ctx.fillStyle=muted;ctx.font='20px '+font;ctx.fillText(stamped?snapshot[stop.id]:'未盖印',cx,cy+228,294);
        }
        ctx.fillStyle=ink;ctx.font='30px '+font;ctx.fillText(count===stops.length?'九处香印，留住这一程':'沿着香印，继续这一程',600,1430);
        ctx.fillStyle=muted;ctx.font='20px '+font;ctx.fillText('浏览器内的虚拟盖印纪念 · 原创文字与几何图形',600,1490);
        const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('PNG unavailable')),'image/png'));
        if(destroyed)return;
        const url=URL.createObjectURL(blob);urls.add(url);
        const link=document.createElement('a');link.href=url;link.download='太昊陵庙会-香印册-'+count+'印.png';document.body.append(link);link.click();link.remove();
        setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url)},30000);
        tell('纪念图已生成，请查看浏览器下载。');
      } catch (_) { tell('纪念图暂未能生成，请稍后再试。香印记录不会改变。'); }
      finally {saving=false;if(!destroyed){saveButton.disabled=unavailable||!stops.length;saveButton.textContent=count===stops.length?'保存九印纪念图':'保存香印纪念图';}}
    }
    function destroy() {
      if(destroyed)return;close({restoreFocus:false,notify:false});destroyed=true;events.abort();
      for(const url of urls)URL.revokeObjectURL(url);urls.clear();dialog?.remove();if(current===api)current=null;
    }
    const api={open,close,refresh,destroy,get isOpen(){return opened;}};
    current=api;return api;
  }
  window.TaihaoStampBook=Object.freeze({create});
})();
