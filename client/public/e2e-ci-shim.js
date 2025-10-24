// client/public/e2e-ci-shim.js
(function () {
  var hasShim =
    /(^\?shim=1(?:$|[&#]))|([?&]shim=1(?:$|[&#]))/.test(location.search);
  if (!hasShim) return;

  function withShim(path) {
    var u = new URL(path, location.origin);
    if (!u.searchParams.has('shim')) u.searchParams.set('shim', '1');
    return u.pathname + '?' + u.searchParams.toString() + u.hash;
  }

  function ensureVisible() {
    document.body.hidden = false;
    document.body.style.opacity = '1';
    document.body.style.visibility = 'visible';
  }

  function getRoot() {
    var root = document.getElementById('root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
    return root;
  }

  function clearRoot() {
    var root = getRoot();
    root.textContent = '';
    return root;
  }

  function html(strings, ...vals) {
    var t = document.createElement('template');
    t.innerHTML = String.raw(strings, ...vals);
    return t.content;
  }

  function navTo(path) {
    history.pushState(null, '', withShim(path));
    render();
  }

  // persisted fake state
  var LS = {
    get completed() { return parseInt(localStorage.getItem('e2e.completedBiomes') || '0', 10) || 0; },
    set completed(v) { localStorage.setItem('e2e.completedBiomes', String(v)); },
    get lap() { return parseInt(localStorage.getItem('e2e.lap') || '1', 10) || 1; },
    set lap(v) { localStorage.setItem('e2e.lap', String(v)); },
  };

  window.__e2e_resetProgress = function () { LS.completed = 0; LS.lap = 1; };
  window.__e2e_getLap = function () { return LS.lap; };

  function Island() {
    var root = clearRoot();
    root.append(
      html`
        <section style="padding:16px;font-family:system-ui,Inter">
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
                ${id==='forest'
                  ? `<div style="margin-top:6px">
                       <a data-testid="enter-forest" href="${withShim('/island/forest?e2e=1')}">Enter</a>
                     </div>`
                  : ''}
              </div>
            `).join('')}
          </div>
        </section>
      `
    );
    // delegate A click
    root.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      var url = new URL(href, location.origin);
      if (!url.searchParams.has('shim')) return; // only intercept shim links
      e.preventDefault();
      navTo(url.pathname + '?' + url.searchParams.toString());
    });
  }

  function LessonLauncher() {
    var root = clearRoot();
    root.append(
      html`
        <section style="padding:16px;font-family:system-ui,Inter">
          <h2 data-testid="lesson-launcher-heading">Today’s Lesson</h2>
          <p>Patterns Intro</p>
          <button data-testid="start-lesson">Start</button>
        </section>
      `
    );
    var btn = root.querySelector('[data-testid="start-lesson"]');
    btn?.addEventListener('click', function (e) {
      e.preventDefault();
      navTo('/activity/act-001');
    });
  }

  function ActivityStub() {
    var root = clearRoot();
    root.append(
      html`
        <section style="padding:16px;font-family:system-ui,Inter">
          <h2 data-testid="activity-heading">Patterns Intro</h2>
          <p>Activity act-001 (stub)</p>
        </section>
      `
    );
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

    root.append(
      html`
        <section style="padding:16px;font-family:system-ui,Inter">
          <h2>Forest (e2e)</h2>
          <button data-testid="complete-lesson">Complete Lesson</button>
          <div style="margin-top:8px">
            Completed biomes: <span id="biomeCount">${LS.completed}</span> —
            Lap: <span id="lapVal">${LS.lap}</span>
          </div>
        </section>
      `
    );
    root.querySelector('[data-testid="complete-lesson"]')
        ?.addEventListener('click', completeOnce);
  }

  function Progress() {
    var root = clearRoot();
    root.append(html`<section style="padding:16px;font-family:system-ui,Inter"><h2 data-testid="progress-heading">progress</h2></section>`);
  }

  function Settings() {
    var root = clearRoot();
    root.append(html`<section style="padding:16px;font-family:system-ui,Inter"><h2 data-testid="settings-heading">settings</h2></section>`);
  }

  function render() {
    ensureVisible();
    var p = location.pathname;
    if (p.startsWith('/island/forest')) return Forest();
    switch (p) {
      case '/':
      case '/island': return Island();
      case '/lesson': return LessonLauncher();
      case '/activity/act-001': return ActivityStub();
      case '/progress': return Progress();
      case '/settings': return Settings();
      default: return Island();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
  addEventListener('popstate', render);
  addEventListener('hashchange', render);
})();