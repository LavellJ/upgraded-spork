// public/e2e-ci-shim.js
(function () {
  // Activate only when ?shim=1 is present (also support legacy ?shim=1/<path>)
  var hasShim = /[?&]shim=1(?![^#]*=)/.test(location.search) || /^\?shim=1(?:\/?|$)/.test(location.search);
  if (!hasShim) return;

  // Normalize legacy ?shim=1/<path> -> /<path>?shim=1
  var legacy = location.search.match(/^\?shim=1\/(.+)/);
  if (legacy && legacy[1]) {
    history.replaceState(null, '', '/' + legacy[1] + '?shim=1' + location.hash);
  }

  // Ensure #root exists and page is visible
  function ensureRoot() {
    var root = document.getElementById('root');
    if (!root) { root = document.createElement('div'); root.id = 'root'; document.body.appendChild(root); }
    document.body.style.opacity = '1';
    document.documentElement.style.opacity = '1';
    return root;
  }

  // Helpers
  function withShim(url) {
    var u = new URL(url, location.origin);
    if (!u.searchParams.has('shim')) u.searchParams.set('shim', '1');
    return u.pathname + (u.searchParams.toString() ? '?' + u.searchParams.toString() : '') + u.hash;
  }
  function html(strings, ...vals) {
    var t = document.createElement('template');
    t.innerHTML = String.raw(strings, ...vals);
    return t.content;
  }
  function clearRoot() {
    var root = ensureRoot();
    root.innerHTML = '';
    return root;
  }
  function navTo(path) {
    history.pushState(null, '', withShim(path));
    window.dispatchEvent(new Event('popstate'));
  }

  // Persistent state
  var LS = {
    get completed() { return parseInt(localStorage.getItem('e2e.completedBiomes') || '0', 10) || 0; },
    set completed(v) { localStorage.setItem('e2e.completedBiomes', String(v)); },
    get lap() { return parseInt(localStorage.getItem('e2e.lap') || '1', 10) || 1; },
    set lap(v) { localStorage.setItem('e2e.lap', String(v)); }
  };
  window.__e2e_resetProgress = function () { LS.completed = 0; LS.lap = 1; };
  window.__e2e_getLap = function () { return LS.lap; };

  // Views
  function Island() {
    var root = clearRoot();
    root.append(html`
      <section style="padding:16px;font-family:Inter,system-ui">
        <h2 data-testid="island-heading">island</h2>
        <div style="display:flex;gap:8px;margin:8px 0;">
          <button data-testid="journal-btn">Journal</button>
          <button data-testid="backpack-btn">Backpack</button>
        </div>
        <div data-testid="scout-bubble" style="margin:8px 0;">👋 hi!</div>
        <div data-testid="lap-badge" style="font-weight:600;">Lap ${LS.lap}</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px;">
          ${['forest','tropics','desert','coast'].map(id => `
            <div style="border:1px solid #ddd;padding:8px;border-radius:8px">
              <div data-testid="biome-${id}" style="font-weight:600;text-transform:capitalize">${id}</div>
              <div data-testid="progress-${id}">progress chip</div>
              ${id==='forest' ? `<div style="margin-top:6px"><a data-testid="enter-forest" href="${withShim('/island/forest?e2e=1')}">Enter</a></div>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `);
  }
  function LessonLauncher() {
    var root = clearRoot();
    root.append(html`
      <section style="padding:16px;font-family:Inter,system-ui">
        <h2 data-testid="lesson-launcher-heading">Today’s Lesson</h2>
        <p>Patterns Intro</p>
        <button data-testid="start-lesson" onclick="(${navTo}).call(null, '/activity/act-001')">Start</button>
      </section>
    `);
  }
  function ActivityStub() {
    var root = clearRoot();
    root.append(html`
      <section style="padding:16px;font-family:Inter,system-ui">
        <h2 data-testid="activity-heading">Patterns Intro</h2>
        <p>Activity act-001 (stub)</p>
      </section>
    `);
  }
  function Forest() {
    var root = clearRoot();
    function completeOnce() {
      LS.completed = LS.completed + 1;
      if (LS.completed >= 4) { LS.lap = Math.max(2, LS.lap + 1); LS.completed = 0; }
      var c = document.getElementById('biomeCount'); if (c) c.textContent = String(LS.completed);
      var l = document.getElementById('lapVal'); if (l) l.textContent = String(LS.lap);
    }
    window.__e2e_completeOnce = completeOnce;
    root.append(html`
      <section style="padding:16px;font-family:Inter,system-ui">
        <h2>Forest (e2e)</h2>
        <button data-testid="complete-lesson" onclick="__e2e_completeOnce()">Complete Lesson</button>
        <div style="margin-top:8px">Completed biomes: <span id="biomeCount">${LS.completed}</span> — Lap: <span id="lapVal">${LS.lap}</span></div>
      </section>
    `);
  }
  function Progress() {
    var root = clearRoot();
    root.append(html`<section style="padding:16px;font-family:Inter,system-ui"><h2 data-testid="progress-heading">progress</h2></section>`);
  }
  function Settings() {
    var root = clearRoot();
    root.append(html`<section style="padding:16px;font-family:Inter,system-ui"><h2 data-testid="settings-heading">settings</h2></section>`);
  }

  // Router
  function render() {
    ensureRoot();
    var path = location.pathname;
    if (path.startsWith('/island/forest')) return Forest();
    switch (path) {
      case '/':
      case '/island': return Island();
      case '/lesson': return LessonLauncher();
      case '/activity/act-001': return ActivityStub();
      case '/progress': return Progress();
      case '/settings': return Settings();
      default: return Island();
    }
  }

  // Render now if the document is already loaded; else wait
  if (document.readyState !== 'loading') {
    render();
  } else {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  }
  window.addEventListener('popstate', render);
})();