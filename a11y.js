/*!
 * skincare.md — accessibility control panel
 * Injects the floating a11y widget on every page and persists the
 * visitor's preferences across pages via localStorage.
 *
 * Load with: <script src="/a11y.js" defer></script>
 */
(function () {
  'use strict';

  if (document.getElementById('a11y-widget')) return; // already present

  var STORE_KEY = 'skincaremd.a11y';
  var ZOOM_MIN = 80, ZOOM_MAX = 150, ZOOM_STEP = 10;

  var state = { zoom: 100, contrast: false, motion: false, dyslexia: false };

  /* ---------- persistence (never throws: private mode, blocked storage) ---- */

  function load() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (typeof saved.zoom === 'number') {
        state.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, saved.zoom));
      }
      state.contrast = !!saved.contrast;
      state.motion = !!saved.motion;
      state.dyslexia = !!saved.dyslexia;
    } catch (e) { /* ignore */ }
  }

  function save() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  /* ---------- styles ------------------------------------------------------ */

  var CSS = [
    /* ---- high contrast ---- */
    'body.a11y-contrast, body.a11y-contrast *{background-color:#000!important;color:#fff!important;border-color:#fff!important;box-shadow:none!important;}',
    'body.a11y-contrast img,body.a11y-contrast svg,body.a11y-contrast svg *{background-color:transparent!important;}',
    'body.a11y-contrast a,body.a11y-contrast a *{color:#FFE566!important;text-decoration:underline!important;text-underline-offset:3px;}',
    'body.a11y-contrast button,body.a11y-contrast [class*="btn"],body.a11y-contrast .nav-book,body.a11y-contrast .state-pill,body.a11y-contrast .cond-pill{border:1px solid #fff!important;}',
    'body.a11y-contrast :focus-visible{outline:3px solid #FFE566!important;outline-offset:2px!important;}',
    'body.a11y-contrast #a11y-panel{border:2px solid #fff!important;}',
    'body.a11y-contrast #a11y-toggle{border:2px solid #fff!important;}',

    /* ---- reduced motion ---- */
    'body.a11y-motion,body.a11y-motion *,body.a11y-motion *::before,body.a11y-motion *::after{transition:none!important;animation:none!important;scroll-behavior:auto!important;}',

    /* ---- dyslexia-friendly typeface ---- */
    'body.a11y-dyslexia,body.a11y-dyslexia *{font-family:Verdana,"Trebuchet MS",Tahoma,Arial,sans-serif!important;letter-spacing:0.04em!important;word-spacing:0.14em!important;line-height:1.9!important;}',

    /* ---- widget chrome ---- */
    '#a11y-widget{position:fixed;bottom:1.5rem;right:1.5rem;z-index:1000;font-family:var(--sans,-apple-system,BlinkMacSystemFont,"Inter",sans-serif);}',
    '#a11y-toggle{width:48px;height:48px;min-width:48px;min-height:48px;border-radius:50%;background:var(--ink,#1A1A18);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.25);padding:0;}',
    '#a11y-toggle:focus-visible{outline:3px solid var(--gold,#A07840);outline-offset:3px;}',
    '#a11y-panel{position:absolute;bottom:60px;right:0;width:262px;background:var(--white,#fff);border:1px solid rgba(26,26,24,0.18);border-radius:12px;padding:1.25rem;box-shadow:0 4px 24px rgba(0,0,0,0.14);}',
    '#a11y-panel[hidden]{display:none;}',
    '#a11y-panel .a11y-h{font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink,#1A1A18);margin-bottom:1rem;}',
    '#a11y-panel .a11y-row{margin-bottom:1rem;}',
    '#a11y-panel .a11y-cap{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;color:var(--ink-mid,#47453F);margin-bottom:0.5rem;}',
    '#a11y-panel .a11y-val{font-size:11px;font-variant-numeric:tabular-nums;color:var(--ink-mid,#47453F);}',
    '#a11y-panel .a11y-zoom{display:flex;gap:8px;}',
    '#a11y-panel button.a11y-btn{min-height:44px;padding:8px 10px;border:1px solid rgba(26,26,24,0.18);border-radius:6px;background:none;cursor:pointer;color:var(--ink,#1A1A18);font-family:inherit;font-size:13px;line-height:1;}',
    '#a11y-panel .a11y-zoom button.a11y-btn{flex:1;}',
    '#a11y-panel button.a11y-toggle-btn{width:100%;text-align:left;font-size:12px;}',
    '#a11y-panel button.a11y-btn[aria-pressed="true"]{background:var(--ink,#1A1A18);color:var(--white,#fff);border-color:var(--ink,#1A1A18);}',
    '#a11y-panel button.a11y-btn:hover{border-color:var(--ink,#1A1A18);}',
    '#a11y-panel button.a11y-btn:focus-visible{outline:3px solid var(--gold,#A07840);outline-offset:2px;}',
    '#a11y-panel button.a11y-reset{width:100%;min-height:44px;border:1px solid rgba(26,26,24,0.18);border-radius:6px;background:var(--cream,#F7F4EF);cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-mid,#47453F);}',
    '#a11y-panel button.a11y-reset:hover{color:var(--ink,#1A1A18);border-color:var(--ink,#1A1A18);}',
    '#a11y-panel button.a11y-reset:focus-visible{outline:3px solid var(--gold,#A07840);outline-offset:2px;}',
    '.a11y-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}',
    '@media (max-width:520px){#a11y-widget{bottom:1rem;right:1rem;}#a11y-panel{width:min(262px,calc(100vw - 2rem));}}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.id = 'a11y-styles';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------- markup ------------------------------------------------------ */

  var wrap = document.createElement('div');
  wrap.id = 'a11y-widget';
  wrap.innerHTML =
    '<button id="a11y-toggle" type="button" aria-label="Accessibility options" aria-expanded="false" aria-haspopup="dialog" aria-controls="a11y-panel">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="12" cy="5" r="2.5" fill="#fff"/>' +
        '<path d="M6 11.5C6 9.5 8.5 8 12 8C15.5 8 18 9.5 18 11.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M9 11L8 20H10.5L12 15L13.5 20H16L15 11" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '</svg>' +
    '</button>' +
    '<div id="a11y-panel" role="dialog" aria-modal="false" aria-label="Accessibility options" hidden>' +
      '<div class="a11y-h">Accessibility</div>' +

      '<div class="a11y-row">' +
        '<div class="a11y-cap"><span id="a11y-zoom-label">Text size</span>' +
        '<span class="a11y-val" id="a11y-zoom-val">100%</span></div>' +
        '<div class="a11y-zoom">' +
          '<button type="button" class="a11y-btn" data-zoom="-1" aria-label="Decrease text size">A&#8722;</button>' +
          '<button type="button" class="a11y-btn" data-zoom="0" aria-label="Reset text size to 100 percent">A</button>' +
          '<button type="button" class="a11y-btn" data-zoom="1" aria-label="Increase text size" style="font-size:15px;">A+</button>' +
        '</div>' +
      '</div>' +

      '<div class="a11y-row">' +
        '<div class="a11y-cap"><span id="a11y-contrast-label">High contrast</span></div>' +
        '<button type="button" class="a11y-btn a11y-toggle-btn" data-flag="contrast" aria-pressed="false" aria-labelledby="a11y-contrast-label a11y-contrast-state"><span id="a11y-contrast-state">Off</span></button>' +
      '</div>' +

      '<div class="a11y-row">' +
        '<div class="a11y-cap"><span id="a11y-motion-label">Reduce motion</span></div>' +
        '<button type="button" class="a11y-btn a11y-toggle-btn" data-flag="motion" aria-pressed="false" aria-labelledby="a11y-motion-label a11y-motion-state"><span id="a11y-motion-state">Off</span></button>' +
      '</div>' +

      '<div class="a11y-row">' +
        '<div class="a11y-cap"><span id="a11y-dyslexia-label">Dyslexia-friendly font</span></div>' +
        '<button type="button" class="a11y-btn a11y-toggle-btn" data-flag="dyslexia" aria-pressed="false" aria-labelledby="a11y-dyslexia-label a11y-dyslexia-state"><span id="a11y-dyslexia-state">Off</span></button>' +
      '</div>' +

      '<button type="button" class="a11y-reset">Reset all</button>' +
      '<p class="a11y-sr" role="status" aria-live="polite" id="a11y-status"></p>' +
    '</div>';

  document.body.appendChild(wrap);

  var toggleBtn = document.getElementById('a11y-toggle');
  var panel = document.getElementById('a11y-panel');
  var zoomVal = document.getElementById('a11y-zoom-val');
  var status = document.getElementById('a11y-status');

  /* ---------- apply ------------------------------------------------------- */

  var FLAG_CLASS = { contrast: 'a11y-contrast', motion: 'a11y-motion', dyslexia: 'a11y-dyslexia' };

  function applyZoom() {
    var root = document.documentElement;
    if (state.zoom === 100) {
      root.style.removeProperty('zoom');
      root.style.removeProperty('font-size');
    } else {
      // `zoom` scales the px-based type scale used throughout the site.
      root.style.zoom = state.zoom / 100;
      // Fallback for engines without `zoom`: scales any rem/em-based sizing.
      root.style.fontSize = (16 * state.zoom / 100).toFixed(2) + 'px';
    }
    zoomVal.textContent = state.zoom + '%';
  }

  function applyFlag(name) {
    var on = state[name];
    document.body.classList.toggle(FLAG_CLASS[name], on);
    var btn = panel.querySelector('[data-flag="' + name + '"]');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.firstChild.textContent = on ? 'On' : 'Off';
    if (name === 'motion') {
      document.documentElement.style.scrollBehavior = on ? 'auto' : '';
    }
  }

  function applyAll() {
    applyZoom();
    applyFlag('contrast');
    applyFlag('motion');
    applyFlag('dyslexia');
  }

  function announce(msg) {
    status.textContent = '';
    window.setTimeout(function () { status.textContent = msg; }, 60);
  }

  /* ---------- events ------------------------------------------------------ */

  function openPanel() {
    panel.removeAttribute('hidden');
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closePanel(refocus) {
    panel.setAttribute('hidden', '');
    toggleBtn.setAttribute('aria-expanded', 'false');
    if (refocus) toggleBtn.focus();
  }

  toggleBtn.addEventListener('click', function () {
    if (panel.hasAttribute('hidden')) openPanel(); else closePanel(false);
  });

  panel.addEventListener('click', function (e) {
    var zoomBtn = e.target.closest('[data-zoom]');
    if (zoomBtn) {
      var dir = parseInt(zoomBtn.getAttribute('data-zoom'), 10);
      if (dir === 0) {
        state.zoom = 100;
      } else {
        state.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, state.zoom + dir * ZOOM_STEP));
      }
      applyZoom();
      save();
      announce('Text size ' + state.zoom + ' percent');
      return;
    }

    var flagBtn = e.target.closest('[data-flag]');
    if (flagBtn) {
      var name = flagBtn.getAttribute('data-flag');
      state[name] = !state[name];
      applyFlag(name);
      save();
      return;
    }

    if (e.target.closest('.a11y-reset')) {
      state = { zoom: 100, contrast: false, motion: prefersReducedMotion(), dyslexia: false };
      applyAll();
      save();
      announce('All accessibility settings reset');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hasAttribute('hidden')) closePanel(true);
  });

  document.addEventListener('click', function (e) {
    if (panel.hasAttribute('hidden')) return;
    if (!wrap.contains(e.target)) closePanel(false);
  });

  // Close when focus leaves the widget entirely (keyboard users tabbing out).
  document.addEventListener('focusin', function (e) {
    if (panel.hasAttribute('hidden')) return;
    if (!wrap.contains(e.target)) closePanel(false);
  });

  /* ---------- init -------------------------------------------------------- */

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  load();
  // Honour the OS-level preference on a first visit, so the control reflects
  // the reduced-motion behaviour the stylesheets already apply.
  try {
    if (!window.localStorage.getItem(STORE_KEY) && prefersReducedMotion()) state.motion = true;
  } catch (e) { /* ignore */ }

  applyAll();
})();
