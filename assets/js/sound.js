/*
 * Optional, user-activated synthetic UI sound. Never starts from stored consent.
 * Playback engine: Howler.js 2.2.4 (MIT), loaded separately from assets/vendor.
 * The WAV is original mathematical synthesis, NOT a live temple-fair recording.
 */
(() => {
  'use strict';
  if (window.TaihaoSound) return;
  const script = document.currentScript;
  const source = new URL('../audio/taihao-soft-cues.wav', script && script.src ? script.src : new URL('assets/js/sound.js', document.baseURI)).href;
  const storageKey = 'taihao-sound-v1';
  const sprites = {tap:[0,200],enter:[350,650],point:[1150,550],stamp:[1850,900],close:[2900,280],preview:[3350,6500]};
  const aliases = {click:'tap',toggle:'tap',select:'point',open:'point',scene:'point',confirm:'stamp',map:'enter',soundscape:'preview'};
  let preferredEnabled = false, volume = .28;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved === 'object') {
      preferredEnabled = saved.enabled === true;
      if (typeof saved.volume === 'number' && Number.isFinite(saved.volume)) volume = Math.max(0,Math.min(1,saved.volume));
    }
  } catch (_) {}
  // Each document begins quiet even when an earlier document remembered 'on'.
  let enabled = false, manualSuspended = false, hidden = document.hidden;
  let manualDuck = false, videoDuck = false, failed = false, bank = null;
  let activeId = null, activeName = null, pendingName = null, pendingLoad = null;
  let generation = 0, lastCueAt = -Infinity;
  const available = () => typeof window.Howl === 'function' && !(window.Howler && window.Howler.noAudio);
  const suspended = () => manualSuspended || hidden;
  const canPlay = () => enabled && !suspended() && available() && !failed;
  const isDucked = () => manualDuck || videoDuck;
  const gain = () => volume * (activeName === 'preview' ? .65 : 1) * (isDucked() ? .15 : 1);
  function getState() {
    const playing = !!(bank && activeId !== null && bank.playing(activeId));
    return Object.freeze({enabled,preferredEnabled,volume,available:available() && !failed,suspended:suspended(),ducked:isDucked(),
      playing,active:activeName,pending:pendingName,status:!available() || failed ? 'unavailable' : !enabled ? 'disabled' : suspended() ? 'suspended' : pendingName ? 'loading' : playing ? 'playing' : 'ready'});
  }
  function notify() { document.dispatchEvent(new CustomEvent('taihao:soundchange',{detail:getState()})); }
  function persist() { try { localStorage.setItem(storageKey,JSON.stringify({enabled:preferredEnabled,volume})); } catch (_) {} }
  function stop() {
    generation++;
    if (bank && pendingLoad) bank.off('load',pendingLoad);
    pendingLoad = null;pendingName = null;activeId = null;activeName = null;
    if (bank) { try { bank.stop(); } catch (_) {} }
    notify();
  }
  function fadeToCurrent() {
    if (!bank || activeId === null) return;
    try { bank.fade(bank.volume(activeId),gain(),120,activeId); } catch (_) {}
  }
  function syncVideoDuck() {
    const next = Array.from(document.querySelectorAll('video')).some(v => !v.paused && !v.ended);
    if (next !== videoDuck) { videoDuck = next;fadeToCurrent();notify(); }
  }
  function ensureBank() {
    if (bank) return bank;
    if (!available()) return null;
    try {
      bank = new window.Howl({src:[source],format:['wav'],sprite:sprites,autoplay:false,loop:false,preload:true,pool:1,volume:0,
        onplay(id) {
          if (id !== activeId || !canPlay()) { try { bank.stop(id); } catch (_) {} return; }
          bank.fade(0,gain(),35,id);notify();
        },
        onend(id) { if (id === activeId) { activeId = null;activeName = null;notify(); } },
        onplayerror(id) { if (id === activeId) stop(); },
        onloaderror() { failed = true;enabled = false;stop(); }
      });
      return bank;
    } catch (_) { failed = true;bank = null;return null; }
  }
  function setEnabled(value) {
    const next = value === true;
    preferredEnabled = next;persist();
    if (!next) { enabled = false;stop();return false; }
    if (failed && bank) { try { bank.unload(); } catch (_) {} bank = null; }
    failed = false;
    enabled = available();
    if (enabled && (!ensureBank() || !available())) enabled = false;
    notify();return enabled;
  }
  function playCue(name = 'tap') {
    name = aliases[name] || name;
    if (!Object.prototype.hasOwnProperty.call(sprites,name) || !canPlay()) return false;
    const now = Date.now();
    if (now - lastCueAt < 120) return false;
    lastCueAt = now;
    stop();syncVideoDuck();
    const current = ensureBank();if (!current) return false;
    const ticket = generation;
    const start = () => {
      if (ticket !== generation || !canPlay()) return;
      pendingLoad = null;pendingName = null;
      current.volume(0);activeName = name;
      activeId = current.play(name);
      if (typeof activeId !== 'number') { activeId = null;activeName = null; }
      notify();
    };
    if (current.state() === 'loaded') start();
    else {
      pendingName = name;pendingLoad = start;current.once('load',start);
      if (current.state() === 'unloaded') current.load();
      notify();
    }
    return true;
  }
  function setVolume(value) {
    const number = Number(value);
    if (Number.isFinite(number)) volume = Math.max(0,Math.min(1,number));
    persist();fadeToCurrent();notify();return volume;
  }
  function suspend() { manualSuspended = true;stop();return getState(); }
  function resume() { manualSuspended = false;notify();return getState(); }
  function duck(on) { manualDuck = on === true;syncVideoDuck();fadeToCurrent();notify();return isDucked(); }
  const api = {enable:() => setEnabled(true),toggle:() => setEnabled(!enabled),setEnabled,setVolume,playCue,
    preview:() => playCue('preview'),suspend,resume,stop,duck,getState};
  for (const key of ['enabled','preferredEnabled','volume','available','suspended','ducked','playing','active','status']) {
    Object.defineProperty(api,key,{enumerable:true,get:() => getState()[key]});
  }
  Object.defineProperty(api,'state',{enumerable:true,get:getState});
  window.TaihaoSound = Object.freeze(api);
  document.addEventListener('visibilitychange',() => {hidden = document.hidden;if (hidden) stop();else notify();});
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',() => {hidden = document.hidden;notify();});
  for (const event of ['play','pause','ended','emptied']) {
    document.addEventListener(event,e => {if (e.target && e.target.tagName === 'VIDEO') syncVideoDuck();},true);
  }
})();
