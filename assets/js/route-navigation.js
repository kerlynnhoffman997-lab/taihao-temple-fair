/* Manual, interruptible route navigation. Embla Carousel 8.6.0 is optional. */
(() => {
  'use strict';
  let current = null;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  function create(options = {}) {
    if (current) current.destroy();
    const stops = Array.isArray(options.stops) ? options.stops.slice() : [];
    const stage = document.querySelector('.stage') || document.body;
    const cleanups = [];
    let index = 0, visible = false, playing = false, destroyed = false, embla = null;
    let programScroll = 0, nativeIntent = false, scrollTimer = 0, pointerStart = null, ignoreClickUntil = 0, tabFocus = false;
    function element(tag, className, text) {
      const node = document.createElement(tag);if (className) node.className = className;if (text !== undefined) node.textContent = text;return node;
    }
    function button(id, className, text, title) {
      const node = element('button',className,text);node.type = 'button';node.id = id;if (title) node.setAttribute('aria-label',title);return node;
    }
    function listen(node, type, handler, settings) {
      node.addEventListener(type,handler,settings);cleanups.push(() => node.removeEventListener(type,handler,settings));
    }
    const root = element('nav','route-dock');root.id = 'routeDock';root.hidden = true;root.setAttribute('aria-label','进香巡游站点');root.setAttribute('aria-busy','false');
    const controls = element('div','route-controls');
    const exit = button('routeExit','route-control route-exit','← 返回总览','结束巡游，返回地图总览');
    const play = button('routePlay','route-control route-play','▶ 自动巡游','自动播放巡游');play.setAttribute('aria-pressed','false');
    const position = element('span','route-position');position.id = 'routePosition';position.setAttribute('aria-live','polite');position.setAttribute('aria-atomic','true');
    controls.append(exit,play,position);
    const stations = element('div','route-stations');
    const previous = button('routePrev','route-arrow','‹','上一站');
    const next = button('routeNext','route-arrow','›','下一站');
    const viewport = element('div','route-viewport is-native');viewport.id = 'routeViewport';viewport.tabIndex = 0;viewport.setAttribute('aria-label','巡游站点，左右滑动或按方向键选择');
    const track = element('div','route-track');track.id = 'routeTrack';track.setAttribute('role','list');
    const buttons = stops.map((stop,number) => {
      const slide = element('div','route-slide');slide.setAttribute('role','listitem');
      const node = button('routeStop-'+number,'route-stop',undefined,'第'+(number+1)+'站，'+(stop.name || '')+(stop.step?'，'+stop.step:''));
      node.dataset.routeIndex = String(number);node.dataset.routeId = String(stop.id || '');
      const copy = element('span','route-copy');copy.append(element('span','route-name',stop.name || '站点'+(number+1)),element('span','route-step',stop.step || '进香巡游'));
      node.append(element('span','route-number',String(number+1).padStart(2,'0')),copy);slide.append(node);track.append(slide);return node;
    });
    viewport.append(track);stations.append(previous,viewport,next);root.append(controls,stations);stage.append(root);
    const limit = value => Math.max(0,Math.min(stops.length-1,Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0));
    function update() {
      buttons.forEach((node,number) => {if (number === index) node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');});
      previous.disabled = !stops.length || index === 0;next.disabled = !stops.length || index === stops.length-1;
      play.disabled = stops.length < 2;play.textContent = playing ? 'Ⅱ 暂停巡游' : '▶ 自动巡游';play.setAttribute('aria-pressed',String(playing));play.setAttribute('aria-label',playing ? '暂停自动巡游' : '自动播放巡游');
      position.textContent = stops.length ? String(index+1).padStart(2,'0')+' / '+String(stops.length).padStart(2,'0') : '暂无站点';
    }
    function setPlaying(value) {
      if (destroyed) return api;
      const next = value === true && visible && stops.length > 1;
      if (playing === next) return api;
      playing = next;update();if (typeof options.onPlayChange === 'function') options.onPlayChange(playing);return api;
    }
    function withoutSelect(work) {programScroll++;try {work();} finally {programScroll--;}}
    function scrollVisual(number,immediate) {
      if (!visible || destroyed || !buttons[number]) return;
      nativeIntent = false;clearTimeout(scrollTimer);
      if (embla) withoutSelect(() => embla.scrollTo(number,immediate || preference.matches));
      else {
        const slide = buttons[number].parentElement;
        viewport.scrollTo({left:slide.offsetLeft-(viewport.clientWidth-slide.offsetWidth)/2,behavior:immediate || preference.matches ? 'auto' : 'smooth'});
      }
    }
    function select(number, settings = {}) {
      if (destroyed || !stops.length) return api;
      const silent = settings.silent === true;
      if (!silent) setPlaying(false);
      index = limit(number);update();scrollVisual(index,settings.immediate === true);
      // Even the current stop is actionable: root can cancel a stale/busy selection.
      if (!silent && typeof options.onSelect === 'function') options.onSelect(index,'manual');return api;
    }
    function nativeSelection() {
      if (!nativeIntent || embla || !visible || destroyed || !buttons.length) return;
      const center = viewport.scrollLeft+viewport.clientWidth/2;
      let nearest = 0,distance = Infinity;
      buttons.forEach((node,number) => {const slide = node.parentElement,d = Math.abs(slide.offsetLeft+slide.offsetWidth/2-center);if (d < distance) {distance = d;nearest = number;}});
      nativeIntent = false;
      if (nearest !== index) {index = nearest;update();if (typeof options.onSelect === 'function') options.onSelect(index,'manual');}
    }
    function initCarousel() {
      if (embla || typeof window.EmblaCarousel !== 'function' || !stops.length) return;
      try {
        viewport.classList.remove('is-native');
        embla = window.EmblaCarousel(viewport,{loop:false,align:'center',containScroll:false,slidesToScroll:1,dragFree:false,skipSnaps:false,startIndex:index,duration:preference.matches?0:22,watchFocus:false});
        embla.on('select',engine => {
          if (destroyed || !visible || programScroll) return;
          const next = limit(engine.selectedScrollSnap());if (next === index) return;
          setPlaying(false);index = next;update();if (typeof options.onSelect === 'function') options.onSelect(index,'manual');
        });
        embla.on('pointerDown',() => setPlaying(false));
        embla.on('reInit',() => scrollVisual(index,true));
      } catch (_) {
        if (embla) {try {embla.destroy();} catch (_) {}}embla = null;viewport.classList.add('is-native');track.style.removeProperty('transform');
      }
    }
    function show(number = 0) {
      if (destroyed || !stops.length) return api;
      visible = true;root.hidden = false;index = limit(number);setPlaying(false);update();initCarousel();scrollVisual(index,true);return api;
    }
    function hide() {
      if (destroyed) return api;
      setPlaying(false);visible = false;nativeIntent = false;pointerStart = null;clearTimeout(scrollTimer);root.hidden = true;return api;
    }
    function setBusy(value) {if (!destroyed) root.setAttribute('aria-busy',String(value === true));return api;}
    function focusStop(number) {buttons[number]?.focus({preventScroll:true});}
    listen(document,'keydown',event => {tabFocus = event.key === 'Tab';},true);
    listen(root,'pointerdown',event => {
      tabFocus = false;
      if (event.target.closest('#routePlay')) return;
      setPlaying(false);
      if (event.target.closest('#routeViewport')) {
        pointerStart = {id:event.pointerId,x:event.clientX,y:event.clientY};
        if (!embla) {viewport.scrollTo({left:viewport.scrollLeft,behavior:'auto'});nativeIntent = true;}
      }
    },{passive:true});
    listen(window,'pointerup',event => {
      if (pointerStart && pointerStart.id === event.pointerId && Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>8) ignoreClickUntil = performance.now()+250;
      pointerStart = null;
    },{passive:true});
    listen(window,'pointercancel',() => {if (pointerStart) ignoreClickUntil = performance.now()+250;pointerStart = null;},{passive:true});
    listen(track,'click',event => {
      if (event.defaultPrevented || performance.now()<ignoreClickUntil) return;
      const node = event.target.closest('[data-route-index]');if (node) select(Number(node.dataset.routeIndex));
    });
    listen(previous,'click',() => select(index-1));listen(next,'click',() => select(index+1));
    listen(play,'click',() => setPlaying(!playing));listen(exit,'click',() => {hide();if (typeof options.onExit === 'function') options.onExit();});
    listen(viewport,'keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();event.stopPropagation();
      const focused = event.target.closest('[data-route-index]');const start = focused ? Number(focused.dataset.routeIndex) : index;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? stops.length-1 : start+(event.key==='ArrowRight'?1:-1);
      select(next,{immediate:preference.matches});focusStop(index);
    });
    // Tabbing reveals the focused card without opening its scene or changing aria-current.
    listen(track,'focusin',event => {const node = event.target.closest('[data-route-index]');if (node && tabFocus) {tabFocus = false;setPlaying(false);scrollVisual(Number(node.dataset.routeIndex),true);}});
    listen(viewport,'scroll',() => {if (!embla && nativeIntent) {clearTimeout(scrollTimer);scrollTimer = setTimeout(nativeSelection,120);}},{passive:true});
    listen(viewport,'wheel',event => {
      if (embla) return;setPlaying(false);nativeIntent = true;
      if (Math.abs(event.deltaY)>Math.abs(event.deltaX)) {event.preventDefault();viewport.scrollBy({left:event.deltaY,behavior:'auto'});}
    },{passive:false});
    listen(window,'resize',() => {if (visible && !embla) scrollVisual(index,true);},{passive:true});
    listen(preference,'change',() => {if (embla) withoutSelect(() => embla.reInit({duration:preference.matches?0:22}));scrollVisual(index,true);});
    listen(document,'visibilitychange',() => {if (document.hidden) setPlaying(false);});
    function destroy() {
      if (destroyed) return;
      setPlaying(false);destroyed = true;clearTimeout(scrollTimer);for (const dispose of cleanups) dispose();if (embla) {try {embla.destroy();} catch (_) {}}root.remove();if (current === api) current = null;
    }
    const api = {show,hide,select,setPlaying,setBusy,destroy,get index(){return index;},get visible(){return visible;},get playing(){return playing;}};
    update();current = api;return api;
  }
  window.TaihaoRoute = Object.freeze({create});
})();
