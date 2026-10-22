/* Original instrumental loop, independent of scene cues and activated by the visitor. */
(() => {
  'use strict';
  if (window.TaihaoMusic) return;
  const script = document.currentScript;
  const source = new URL('../audio/taihao-background.wav', script?.src || new URL('assets/js/background-music.js', document.baseURI)).href;
  const storageKey = 'taihao-music-v1';
  let volume = .28;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (Number.isFinite(saved?.volume)) volume = Math.max(0, Math.min(1, saved.volume));
  } catch (_) {}
  // A remembered volume never starts music in a newly opened document.
  let bank = null, activeId = null, pendingLoad = null, generation = 0;
  let requested = false, phase = 'off', pageActive = true, hidden = document.hidden;
  let videoMuted = false, previewDucked = false;
  const available = () => typeof window.Howl === 'function' && !window.Howler?.noAudio;
  const suspended = () => hidden || !pageActive;
  const targetGain = () => volume * (videoMuted ? 0 : previewDucked ? .12 : 1);
  function getState() {
    return Object.freeze({ enabled: requested, playing: !!(bank && activeId !== null && bank.playing(activeId)),
      status: phase, volume, ducked: videoMuted || previewDucked, videoMuted, available: available() });
  }
  function persistVolume() {
    try { localStorage.setItem(storageKey, JSON.stringify({ volume })); } catch (_) {}
  }
  function syncUI() {
    const pressed = phase === 'loading' || phase === 'playing';
    const label = phase === 'loading' ? '音乐：载入' : phase === 'playing' ? '音乐：开' : phase === 'paused' ? '音乐：暂停' : phase === 'error' ? '音乐：重试' : '音乐：关';
    const action = phase === 'loading' ? '正在加载背景音乐，点击取消' : phase === 'playing' ? '关闭背景音乐' : phase === 'paused' ? '继续播放背景音乐' : phase === 'error' ? '重新播放背景音乐' : '开启背景音乐';
    for (const button of document.querySelectorAll('[data-music-toggle]')) {
      const text = button.querySelector('[data-music-label]');
      if (text) text.textContent = button.id === 'musicMenuToggle' ? action : label;
      button.setAttribute('aria-pressed', String(pressed));
      button.setAttribute('aria-busy', String(phase === 'loading'));
      button.setAttribute('aria-label', action);
      button.dataset.musicState = phase;
      button.title = action;
    }
    const slider = document.getElementById('musicVolume'), output = document.getElementById('musicVolumeValue');
    if (slider) slider.value = String(Math.round(volume * 100));
    if (output) output.textContent = Math.round(volume * 100) + '%';
    const status = document.getElementById('musicStatus');
    if (status) status.textContent = phase === 'loading' ? '背景音乐载入中，可再次点击取消。'
      : phase === 'error' ? '音乐暂未播放，请点击重试。'
      : phase === 'paused' ? '离开页面时已暂停，点击音乐开关可继续。'
      : phase === 'playing' && videoMuted ? '短片播放期间，背景音乐自动静音。'
      : phase === 'playing' && previewDucked ? '音景试听期间，背景音乐自动降低音量。'
      : phase === 'playing' ? (volume === 0 ? '音乐已开启，当前音量为 0。' : '背景音乐循环播放中，可随时关闭。')
      : '原创合成器乐，开启后循环播放。';
  }
  function notify() {
    syncUI();
    document.dispatchEvent(new CustomEvent('taihao:musicchange', { detail: getState() }));
  }
  function cancelLoad() {
    generation++;
    if (bank && pendingLoad) bank.off('load', pendingLoad);
    pendingLoad = null;
  }
  function fadeToCurrent() {
    if (!bank || activeId === null || phase !== 'playing') return;
    try { bank.fade(bank.volume(activeId), targetGain(), 180, activeId); } catch (_) {}
  }
  function syncDucking() {
    const nextVideo = Array.from(document.querySelectorAll('video')).some(video => !video.paused && !video.ended);
    const cues = window.TaihaoSound?.state;
    const nextPreview = cues?.active === 'preview' || cues?.pending === 'preview';
    if (nextVideo === videoMuted && nextPreview === previewDucked) return;
    videoMuted = nextVideo; previewDucked = nextPreview;
    fadeToCurrent(); notify();
  }
  function fail() {
    cancelLoad(); requested = false; phase = 'error';
    if (bank && activeId !== null) { try { bank.stop(activeId); } catch (_) {} }
    activeId = null; notify();
  }
  function ensureBank() {
    if (bank) return bank;
    if (!available()) return null;
    try {
      const current = new window.Howl({ src: [source], format: ['wav'], loop: true, autoplay: false, preload: false, pool: 1, volume: 0,
        onplay(id) {
          if (bank !== current) return;
          if (!requested || suspended() || id !== activeId) { current.stop(id); return; }
          // Howler also emits play at a loop boundary; preserve gain there.
          if (phase !== 'playing') {
            phase = 'playing'; current.volume(0, id); current.fade(0, targetGain(), 180, id); notify();
          }
        },
        onloaderror() {
          if (bank !== current) return;
          if (requested) fail();
          else if (!requested && activeId === null) { current.unload(); bank = null; }
        },
        onplayerror(id) { if (bank === current && id === activeId && requested) fail(); }
      });
      bank = current; return current;
    } catch (_) { return null; }
  }
  function stop() {
    cancelLoad(); requested = false; phase = 'off';
    if (bank && activeId !== null) { try { bank.stop(activeId); } catch (_) {} }
    activeId = null; notify(); return getState();
  }
  function pauseForPage() {
    if (phase !== 'loading' && phase !== 'playing') return;
    cancelLoad(); requested = false; phase = 'paused';
    if (bank && activeId !== null) { try { bank.pause(activeId); } catch (_) {} }
    notify();
  }
  function start() {
    if (requested && (phase === 'loading' || phase === 'playing')) return true;
    if (suspended()) { phase = 'paused'; notify(); return false; }
    if (phase === 'error' && bank) { try { bank.unload(); } catch (_) {} bank = null; activeId = null; }
    cancelLoad();
    requested = true; phase = 'loading'; syncDucking();
    const current = ensureBank();
    if (!current) { fail(); return false; }
    const ticket = generation;
    const play = () => {
      if (ticket !== generation || !requested || suspended()) return;
      pendingLoad = null;
      current.volume(0);
      activeId = current.play(activeId === null ? undefined : activeId);
      if (typeof activeId !== 'number') { fail(); return; }
      notify();
    };
    if (current.state() === 'loaded') play();
    else { pendingLoad = play; current.once('load', play); if (current.state() === 'unloaded') current.load(); notify(); }
    return true;
  }
  function toggle() { return phase === 'loading' || phase === 'playing' ? stop() : start(); }
  function setVolume(value) {
    const next = Number(value);
    if (Number.isFinite(next)) volume = Math.max(0, Math.min(1, next));
    persistVolume(); fadeToCurrent(); notify(); return volume;
  }
  window.TaihaoMusic = Object.freeze({ start, stop, toggle, setVolume, getState, get state() { return getState(); } });
  for (const button of document.querySelectorAll('[data-music-toggle]')) button.addEventListener('click', toggle);
  document.getElementById('musicVolume')?.addEventListener('input', event => setVolume(Number(event.target.value) / 100));
  for (const event of ['play', 'playing', 'pause', 'ended', 'emptied']) {
    document.addEventListener(event, event => { if (event.target?.tagName === 'VIDEO') syncDucking(); }, true);
  }
  document.addEventListener('taihao:soundchange', syncDucking);
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (hidden) pauseForPage(); else notify(); });
  window.addEventListener('pagehide', () => { pageActive = false; pauseForPage(); });
  window.addEventListener('pageshow', () => { pageActive = true; hidden = document.hidden; notify(); });
  syncDucking(); syncUI();
})();
