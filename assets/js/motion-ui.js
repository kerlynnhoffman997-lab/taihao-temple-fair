/* Motion 12.23.24 mini: small, user-triggered feedback over the existing layout. */
(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  const byElement = new WeakMap();
  const selector = 'button:not([disabled]), .chip, .cap[data-act], .enter-link, .header-link, #atlas .item';
  const available = () => !!(window.Motion && typeof window.Motion.animate === 'function');

  function cancel(element) {
    const previous = byElement.get(element);
    if (!previous) return;
    previous.controls.cancel?.();
    previous.restore();
    running.delete(previous);
    byElement.delete(element);
  }

  function animate(element, frames, options) {
    if (!(element instanceof Element) || !element.isConnected || preference.matches || !available()) return null;
    if (!element.getClientRects().length) return null;
    cancel(element);
    try {
      const original = Object.keys(frames).map(property => [
        property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)
      ]);
      const restore = () => {
        for (const [property, value, priority] of original) {
          if (value) element.style.setProperty(property, value, priority);
          else element.style.removeProperty(property);
        }
      };
      const controls = window.Motion.animate(element, frames, options);
      const record = { element, controls, restore };
      byElement.set(element, record);
      running.add(record);
      const cleanup = () => {
        running.delete(record);
        if (byElement.get(element) === record) {
          controls.cancel?.();
          restore();
          byElement.delete(element);
        }
      };
      Promise.resolve(controls).then(cleanup, cleanup);
      return controls;
    } catch (_) { return null; }
  }

  function press(element) {
    if (!(element instanceof Element) || element.matches(':disabled, [aria-disabled="true"]')) return null;
    // The independent scale property leaves map coordinates and positioning transforms intact.
    const base = getComputedStyle(element).scale;
    if (base && base !== 'none' && base !== '1') return null;
    return animate(element, { scale: [1, 0.965, 1] }, {
      duration: 0.24, times: [0, 0.3, 1], ease: ['easeOut', 'easeOut']
    });
  }

  function reveal(element) {
    if (!(element instanceof Element)) return null;
    const style = getComputedStyle(element);
    const frames = { opacity: [0, 1] };
    // Independent translate also preserves CSS transform used for centering dialogs.
    if (!style.translate || style.translate === 'none' || style.translate === '0px') {
      frames.translate = ['0 10px', '0 0'];
    }
    return animate(element, frames, { duration: 0.28, ease: [0.2, 0.7, 0.2, 1] });
  }

  function stopAll() {
    for (const record of running) {
      record.controls.cancel?.();
      record.restore();
      byElement.delete(record.element);
    }
    running.clear();
  }

  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    const target = event.target instanceof Element && event.target.closest(selector);
    if (target) press(target);
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    const target = event.target instanceof Element && event.target.closest(selector);
    if (target) press(target);
  });
  preference.addEventListener('change', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
  window.addEventListener('pagehide', stopAll);
  window.TaihaoMotion = Object.freeze({
    reveal, press,
    get ready() { return available(); },
    get reducedMotion() { return preference.matches; },
    version: '12.23.24'
  });
})();