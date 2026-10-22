/* A contained, accessible full-image view. Map navigation stays outside this module. */
(() => {
  'use strict';
  const events = new AbortController();
  let dialog, viewport, image, heading, message, zoomButton, resetButton, closeButton, readout;
  let observer, opened = false, destroyed = false, trigger = null, bodyOverflow = '', request = 0;
  let scale = 1, x = 0, y = 0, frame = 0, boxWidth = 0, boxHeight = 0, fitWidth = 0, fitHeight = 0;
  let drag = null, lastTap = null, lastTouch = 0, multiplePointers = false;
  const pointers = new Set();
  const listen = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: events.signal });
  const emit = open => document.dispatchEvent(new CustomEvent('taihao:viewerchange', { detail: { open } }));
  const limit = (value, min, max) => Math.max(min, Math.min(max, value));

  function clampPan() {
    const maxX = Math.max(0, (fitWidth * scale - boxWidth) / 2);
    const maxY = Math.max(0, (fitHeight * scale - boxHeight) / 2);
    x = limit(x, -maxX, maxX);
    y = limit(y, -maxY, maxY);
  }
  function render() {
    frame = 0;
    if (!image) return;
    image.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function updateControls() {
    dialog.classList.toggle('is-zoomed', scale > 1.01);
    readout.value = `${Math.round(scale * 100)}%`;
    readout.textContent = readout.value;
    zoomButton.disabled = !fitWidth || scale >= 3;
    resetButton.disabled = !fitWidth || scale === 1;
  }
  function measure(width, height) {
    boxWidth = width;
    boxHeight = height;
    const ratio = image.naturalWidth && image.naturalHeight ? Math.min(width / image.naturalWidth, height / image.naturalHeight) : 0;
    fitWidth = image.naturalWidth * ratio;
    fitHeight = image.naturalHeight * ratio;
    clampPan();
    updateControls();
    schedule();
  }
  function measureOnce() {
    if (!opened) return;
    const rect = viewport.getBoundingClientRect();
    measure(rect.width, rect.height);
  }
  function zoom(value) {
    if (!opened || !fitWidth) return;
    scale = limit(value, 1, 3);
    if (scale === 1) x = y = 0;
    clampPan();
    updateControls();
    schedule();
  }
  function reset() { zoom(1); }
  function releaseDrag() {
    if (drag && viewport.hasPointerCapture?.(drag.id)) viewport.releasePointerCapture(drag.id);
    drag = null;
    dialog?.classList.remove('is-dragging');
  }
  function pointerDown(event) {
    pointers.add(event.pointerId);
    if (pointers.size > 1) { multiplePointers = true; releaseDrag(); lastTap = null; return; }
    if (event.button !== 0 || scale <= 1 || !event.isPrimary) return;
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x, y, moved: false };
    dialog.classList.add('is-dragging');
    viewport.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    if (!drag || drag.id !== event.pointerId || pointers.size > 1) return;
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    x = drag.x + dx;
    y = drag.y + dy;
    clampPan();
    schedule();
  }
  function pointerEnd(event) {
    const moved = drag?.id === event.pointerId && drag.moved;
    const wasMultiple = multiplePointers;
    pointers.delete(event.pointerId);
    if (!pointers.size) multiplePointers = false;
    if (drag?.id === event.pointerId) releaseDrag();
    if (event.type !== 'pointerup' || event.pointerType !== 'touch' || moved || pointers.size || wasMultiple) return;
    const now = performance.now();
    lastTouch = now;
    if (lastTap && now - lastTap.time < 330 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 28) {
      zoom(scale > 1 ? 1 : 2);
      lastTap = null;
    } else lastTap = { time: now, x: event.clientX, y: event.clientY };
  }
  function mount() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'taihao-image-viewer';
    dialog.setAttribute('aria-labelledby', 'taihao-image-viewer-title');
    dialog.innerHTML = `<div class="tv-shell"><header class="tv-header"><h2 id="taihao-image-viewer-title"></h2><div class="tv-actions"><button type="button" class="tv-button tv-zoom" aria-label="放大图片">＋ 放大</button><button type="button" class="tv-button tv-reset" aria-label="复位图片">复位</button><button type="button" class="tv-button tv-close" aria-label="关闭大图，返回原注解">×</button></div></header><div class="tv-viewport"><img class="tv-image" draggable="false" decoding="async" alt=""><p class="tv-message" role="status"></p></div><footer class="tv-footer"><span class="tv-hint">双击放大 · 放大后拖动查看</span><output class="tv-scale" aria-label="图片缩放比例">100%</output></footer></div>`;
    viewport = dialog.querySelector('.tv-viewport');
    image = dialog.querySelector('.tv-image');
    heading = dialog.querySelector('h2');
    message = dialog.querySelector('.tv-message');
    zoomButton = dialog.querySelector('.tv-zoom');
    resetButton = dialog.querySelector('.tv-reset');
    closeButton = dialog.querySelector('.tv-close');
    readout = dialog.querySelector('.tv-scale');
    document.body.append(dialog);
    listen(closeButton, 'click', () => close());
    listen(zoomButton, 'click', () => zoom(scale + 0.5));
    listen(resetButton, 'click', reset);
    listen(dialog, 'cancel', event => { event.preventDefault(); close(); });
    listen(dialog, 'close', () => { if (opened && !dialog.open) close(); });
    listen(dialog, 'click', event => { if (event.target === dialog) close(); });
    listen(dialog, 'keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(scale + 0.5); }
      else if (event.key === '-') { event.preventDefault(); zoom(scale - 0.5); }
      else if (event.key === '0') { event.preventDefault(); reset(); }
    });
    listen(viewport, 'pointerdown', pointerDown);
    listen(viewport, 'pointermove', pointerMove, { passive: true });
    listen(viewport, 'pointerup', pointerEnd);
    listen(viewport, 'pointercancel', pointerEnd);
    listen(viewport, 'lostpointercapture', event => { if (drag?.id === event.pointerId) releaseDrag(); });
    listen(viewport, 'dblclick', event => {
      if (lastTouch && performance.now() - lastTouch < 700) return;
      event.preventDefault();
      zoom(scale > 1 ? 1 : 2);
    });
    listen(viewport, 'wheel', event => {
      // Browser Ctrl/pinch zoom remains available, including on touch devices.
      if (event.ctrlKey || event.metaKey || !matchMedia('(pointer:fine)').matches) return;
      event.preventDefault();
      zoom(scale * Math.exp(-limit(event.deltaY, -120, 120) * 0.002));
    }, { passive: false });
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(entries => {
        if (!opened) return;
        const rect = entries[0].contentRect;
        measure(rect.width, rect.height);
      });
      observer.observe(viewport);
    } else listen(window, 'resize', measureOnce, { passive: true });
  }
  function open({ src, alt = '', title = '完整场景图', trigger: source } = {}) {
    if (destroyed || typeof src !== 'string' || !src.trim()) return false;
    mount();
    const alreadyOpen = opened;
    if (!alreadyOpen) {
      trigger = source instanceof HTMLElement ? source : document.activeElement;
      bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      opened = true;
      dialog.showModal();
    } else if (source instanceof HTMLElement) trigger = source;
    const token = ++request;
    releaseDrag();
    pointers.clear();
    multiplePointers = false;
    lastTap = null;
    scale = 1; x = y = 0; fitWidth = fitHeight = 0;
    heading.textContent = title;
    image.alt = alt || title;
    image.removeAttribute('src');
    message.textContent = '正在载入图片…';
    dialog.classList.add('is-loading');
    dialog.classList.remove('has-error');
    image.onload = () => {
      if (!opened || token !== request) return;
      dialog.classList.remove('is-loading');
      message.textContent = '';
      measureOnce();
    };
    image.onerror = () => {
      if (!opened || token !== request) return;
      dialog.classList.remove('is-loading');
      dialog.classList.add('has-error');
      message.textContent = '图片暂时无法加载';
      fitWidth = fitHeight = 0;
      updateControls();
    };
    image.src = src;
    updateControls();
    schedule();
    measureOnce();
    if (!alreadyOpen) {
      closeButton.focus({ preventScroll: true });
      emit(true);
    }
    return true;
  }
  function close({ restoreFocus = true } = {}) {
    if (!opened) return;
    opened = false;
    request++;
    releaseDrag();
    pointers.clear();
    multiplePointers = false;
    lastTap = null;
    image.onload = image.onerror = null;
    if (dialog.open) dialog.close();
    document.body.style.overflow = bodyOverflow;
    if (restoreFocus && trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    trigger = null;
    emit(false);
  }
  function destroy() {
    if (destroyed) return;
    close();
    destroyed = true;
    events.abort();
    observer?.disconnect();
    if (frame) cancelAnimationFrame(frame);
    dialog?.remove();
  }
  window.TaihaoImageViewer = Object.freeze({ open, close, destroy, get isOpen() { return opened; } });
})();