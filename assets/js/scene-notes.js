/* A local, non-modal index of the clues already present in each scene. */
(() => {
  'use strict';
  const TYPES = { story: '故事', image: '细节图', video: '短片' };
  function create({ container, onChoose, onPeek, onOpen, onToggle, onViewImage } = {}) {
    if (!container) throw new TypeError('Scene notes need a container.');
    const details = document.createElement('details');
    details.id = 'sceneNotesDetails';
    details.className = 'scene-notes';
    const summary = document.createElement('summary');
    summary.id = 'sceneNotesSummary';
    summary.className = 'sn-summary';
    const label = document.createElement('span');
    label.className = 'sn-summary-label';
    const chevron = document.createElement('span');
    chevron.className = 'sn-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '⌄';
    summary.append(label, chevron);
    const body = document.createElement('div');
    body.className = 'sn-body';
    const introduction = document.createElement('p');
    introduction.className = 'sn-intro';
    introduction.textContent = '挑一个看点，走近画中的故事。';
    const list = document.createElement('ol');
    list.className = 'sn-list';
    const imageButton = document.createElement('button');
    imageButton.type = 'button';
    imageButton.className = 'sn-view-image';
    imageButton.textContent = '看整幅画 ↗';
    body.append(introduction, list, imageButton);
    details.append(summary, body);
    container.replaceChildren(details);
    const openedNotes = new Map();
    let pointId = null, signature = '', rows = [], notifiedOpen = false, scrollFrame = 0, peekedIndex = null;

    function peek(index) {
      peekedIndex = index;
      onPeek?.(index);
    }
    function clearPeek() {
      // Native details toggle is queued; it must not clear a newer scene-marker preview.
      if (peekedIndex === null) return;
      peekedIndex = null;
      onPeek?.(null);
    }
    function notifyToggle() {
      const open = details.open;
      if (open === notifiedOpen) return;
      notifiedOpen = open;
      if (open) onOpen?.();
      else clearPeek();
      onToggle?.(open);
    }
    function updateOpened() {
      const known = openedNotes.get(pointId);
      rows.forEach((row, index) => {
        const opened = !!known?.has(index);
        row.button.classList.toggle('is-opened', opened);
        row.status.hidden = !opened;
      });
    }
    function scrollWithinPanel() {
      scrollFrame = 0;
      if (!details.open || !summary.isConnected) return;
      summary.focus({ preventScroll: true });
      for (let parent = details.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (!/(auto|scroll)/.test(style.overflowY) || parent.scrollHeight <= parent.clientHeight) continue;
        const target = summary.getBoundingClientRect(), bounds = parent.getBoundingClientRect();
        if (target.top < bounds.top + 8) parent.scrollTop += target.top - bounds.top - 8;
        else if (target.bottom > bounds.bottom - 8) parent.scrollTop += target.bottom - bounds.bottom + 8;
        break;
      }
    }
    details.addEventListener('toggle', notifyToggle);
    // Keep scene-level click handlers from dismissing an annotation during index use.
    details.addEventListener('click', event => event.stopPropagation());
    imageButton.addEventListener('click', event => {
      event.stopPropagation();
      clearPeek();
      onViewImage?.(imageButton);
    });

    function sync({ pointId: nextPointId, name = '', notes = [], hasImage = false } = {}) {
      const safeNotes = notes.map(note => ({ title: String(note.title || '场景看点'), kind: TYPES[note.kind] ? note.kind : 'story' }));
      const nextSignature = JSON.stringify(safeNotes), changedPoint = pointId !== nextPointId;
      if (changedPoint) {
        details.open = false;
        notifyToggle();
        clearPeek();
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        scrollFrame = 0;
      }
      pointId = nextPointId;
      container.hidden = !safeNotes.length && !hasImage;
      label.textContent = '本场看点 · ' + safeNotes.length;
      list.setAttribute('aria-label', (name ? name + ' · ' : '') + '本场看点');
      imageButton.hidden = !hasImage;
      introduction.hidden = !safeNotes.length;
      if (changedPoint || signature !== nextSignature) {
        const activeIndex = rows.findIndex(row => row.button === document.activeElement);
        rows = safeNotes.map((note, index) => {
          const item = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'sn-note';
          button.dataset.noteIndex = String(index);
          button.dataset.kind = note.kind;
          const kind = document.createElement('span');
          kind.className = 'sn-kind';
          kind.textContent = TYPES[note.kind];
          const title = document.createElement('span');
          title.className = 'sn-title';
          title.textContent = note.title;
          const tail = document.createElement('span');
          tail.className = 'sn-tail';
          const status = document.createElement('span');
          status.className = 'sn-opened';
          status.textContent = '已打开';
          status.hidden = true;
          const arrow = document.createElement('span');
          arrow.className = 'sn-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = '↗';
          tail.append(status, arrow);
          button.append(kind, title, tail);
          button.addEventListener('pointerenter', () => peek(index));
          button.addEventListener('pointerleave', clearPeek);
          button.addEventListener('focus', () => peek(index));
          button.addEventListener('blur', clearPeek);
          button.addEventListener('click', event => {
            event.stopPropagation();
            clearPeek();
            onChoose?.(index, button);
          });
          item.append(button);
          return { item, button, status };
        });
        list.replaceChildren(...rows.map(row => row.item));
        signature = nextSignature;
        if (!changedPoint && activeIndex >= 0 && details.open) rows[activeIndex]?.button.focus({ preventScroll: true });
      }
      updateOpened();
    }
    function open() {
      if (container.hidden) return;
      if (details.open) onOpen?.();
      else { details.open = true; notifyToggle(); }
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(scrollWithinPanel);
    }
    function close() {
      details.open = false;
      notifyToggle();
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    }
    function highlight(index) {
      rows.forEach((row, current) => row.button.classList.toggle('is-highlighted', Number.isInteger(index) && current === index));
    }
    function markOpened(id, index) {
      if (!id || !Number.isInteger(index) || index < 0) return;
      if (!openedNotes.has(id)) openedNotes.set(id, new Set());
      openedNotes.get(id).add(index);
      if (id === pointId) updateOpened();
    }
    sync();
    return { sync, open, close, highlight, markOpened, get isOpen() { return details.open; } };
  }
  window.TaihaoSceneNotes = { create };
})();
