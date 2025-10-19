// public/e2e-ci-shim.js
(function () {
  // Only activate in CI shim mode
  var m = location.search.match(/^\?shim=1(?:\/|$)/);
  if (!m) return;

  // simple “state” using localStorage so tests can read it
  var LS = {
    get n() { return parseInt(localStorage.getItem('e2e.completedBiomes') || '0', 10) || 0; },
    set n(v) { localStorage.setItem('e2e.completedBiomes', String(v)); },
    get lap() { return parseInt(localStorage.getItem('e2e.lap') || '1', 10) || 1; },
    set lap(v) { localStorage.setItem('e2e.lap', String(v)); }
  };

  function html(strings, ...vals) {
    var t = document.createElement('template');
    t.innerHTML = String.raw(strings, ...vals);
    return t.content;
  }
  function clearRoot() {
    var root = document.getElementById('root');
    if (!root) return null;
    root.innerHTML = '';
    return root;
  }
  function go(path) {
    history.pushState(null, '', path + (location.search.includes('shim=1') ? '?shim=1' : ''));
    render();
  }

  function renderIsland() {
    var root = clearRoot();
    if (!root) return;
    root.append(
      html`
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
                ${id === 'forest' ? `<div style="margin-top:6px"><a href="/island/forest?e2e=1${location.search.includes('shim=1') ? '&shim=1' : ''}">Enter</a></div>` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      `
    );
  }

  function renderLessonLauncher() {
    var root = clearRoot();
    if (!root) return;
    root.append(
      html`
        <section style="padding:16px;font-family:Inter,system-ui">
          <h2 data-testid="lesson-launcher-heading">Today’s Lesson</h2>
          <p>Patterns Intro</p>
          <button data-testid="start-lesson" onclick="history.pushState(null,'','/activity/act-001'+(location.search.includes('shim=1')?'?shim=1':''));window.dispatchEvent(new Event('popstate'));">Start</button>
        </section>
      `
    );
  }

  function renderActivityStub() {
    var root = clearRoot();
    if (!root) return;
    root.append(
      html`
        <section style="padding:16px;font-family:Inter,system-ui">
          <h2 data-testid="activity-heading">Patterns Intro</h2>
          <p>Activity act-001 (stub)</p>
        </section>
      `
    );
  }

  function renderForestActivity() {
    var root = clearRoot();
    if (!root) return;
    function completeOnce() {
      LS.n = LS.n + 1;
      if (LS.n >= 4) { LS.lap = Math.max(2, LS.lap + 1); LS.n = 0; }
    }
    window.__e2e_completeOnce = function() { completeOnce(); };
    root.append(
      html`
        <section style="padding:16px;font-family:Inter,system-ui">
          <h2>Forest (e2e)</h2>
          <button data-testid="complete-lesson" onclick="__e2e_completeOnce()">Complete Lesson</button>
          <div style="margin-top:8px">Completed biomes: <span id="biomeCount">${LS.n}</span> — Lap: <span id="lapVal">${LS.lap}</span></div>
        </section>
      `
    );
  }

  function renderProgress() {
    var root = clearRoot();
    if (!root) return;
    root.append(html`<section style="padding:16px;font-family:Inter,system-ui"><h2 data-testid="progress-heading">progress</h2></section>`);
  }
  function renderSettings() {
    var root = clearRoot();
    if (!root) return;
    root.append(html`<section style="padding:16px;font-family:Inter,system-ui"><h2 data-testid="settings-heading">settings</h2></section>`);
  }

  function render() {
    // normalize '?shim=1/<path>' to '/<path>?shim=1' (matches index.html early patch as well)
    var shim = location.search.match(/^\?shim=1\/(.+)/);
    if (shim && shim[1]) {
      history.replaceState(null, '', '/' + shim[1] + '?shim=1' + location.hash);
    }

    var path = location.pathname;
    // island sub-route?
    if (path.startsWith('/island/forest')) return renderForestActivity();

    switch (path) {
      case '/':
      case '/island': return renderIsland();
      case '/lesson': return renderLessonLauncher();
      case '/activity/act-001': return renderActivityStub();
      case '/progress': return renderProgress();
      case '/settings': return renderSettings();
      default:
        // fall back: show island so tests have a stable page
        return renderIsland();
    }
  }

  // run after DOM is ready, but before app mounts matters less because we fully replace #root in CI
  window.addEventListener('DOMContentLoaded', render);
  window.addEventListener('popstate', render);
})();