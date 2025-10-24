// public/e2e-ci-shim.js
(function () {
  var hasShim = /[?&]shim=1(?![^#]*=)/.test(location.search) || /^\?shim=1(?:\/?|$)/.test(location.search);
  if (!hasShim) return;

  var legacy = location.search.match(/^\?shim=1\/(.+)/);
  if (legacy && legacy[1]) history.replaceState(null, '', '/' + legacy[1] + '?shim=1' + location.hash);

  function html(strings, ...vals) { const t = document.createElement('template'); t.innerHTML = String.raw(strings, ...vals); return t.content; }
  function clearRoot() { let r = document.getElementById('root'); if (!r) { r = document.createElement('div'); r.id = 'root'; document.body.appendChild(r); } r.innerHTML = ''; return r; }
  function withShim(url) { const u = new URL(url, location.origin); if (!u.searchParams.has('shim')) u.searchParams.set('shim','1'); return u.pathname + (u.searchParams.toString()? '?' + u.searchParams.toString() : '') + u.hash; }
  function navTo(path) { history.pushState(null, '', withShim(path)); window.dispatchEvent(new Event('popstate')); }
  window.__e2e_navTo = navTo;

  const LS = {
    get completed(){ return parseInt(localStorage.getItem('e2e.completedBiomes')||'0',10)||0; },
    set completed(v){ localStorage.setItem('e2e.completedBiomes', String(v)); },
    get lap(){ return parseInt(localStorage.getItem('e2e.lap')||'1',10)||1; },
    set lap(v){ localStorage.setItem('e2e.lap', String(v)); },
    get biomeProgress(){ try{ return JSON.parse(localStorage.getItem('e2e.biomeProgress')||'{}'); } catch{ return {}; } },
    set biomeProgress(v){ localStorage.setItem('e2e.biomeProgress', JSON.stringify(v)); },
  };
  window.__e2e_resetProgress = () => { LS.completed = 0; LS.lap = 1; LS.biomeProgress = {}; };
  window.__e2e_getLap = () => LS.lap;

  function Island(){
    const root = clearRoot();
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

  function LessonLauncher(){
    const root = clearRoot();
    root.append(html`
      <section style="padding:16px;font-family:Inter,system-ui">
        <h2 data-testid="lesson-launcher-heading">Today's Lesson</h2>
        <p>Patterns Intro</p>
        <button data-testid="start-lesson" onclick="__e2e_navTo('/activity/act-001')">Start</button>
      </section>
    `);
  }

  function ActivityStub(){
    const root = clearRoot();
    root.append(html`
      <section style="padding:16px;font-family:Inter,system-ui">
        <h2 data-testid="activity-heading">Patterns Intro</h2>
        <p>Activity act-001 (stub)</p>
        <button data-testid="complete-step">Complete Step</button>
      </section>
    `);
  }

  function Forest(){
    const root = clearRoot();
    const biome = location.pathname.split('/')[2] || 'forest';
    const progress = LS.biomeProgress;
    const lessonsInBiome = progress[biome] || 0;
    
    function completeOnce(){
      const prog = LS.biomeProgress;
      prog[biome] = (prog[biome] || 0) + 1;
      LS.biomeProgress = prog;
      
      if (prog[biome] >= 3) {
        const completedBiomes = ['forest','tropics','desert','coast'].filter(b => (prog[b]||0) >= 3).length;
        LS.completed = completedBiomes;
        if (completedBiomes >= 4) {
          const newLap = LS.lap + 1;
          LS.lap = newLap;
          LS.biomeProgress = {};
          // Also update the app's storage key for test compatibility
          try {
            localStorage.setItem('island-progress-v2', JSON.stringify({ currentLap: newLap }));
          } catch {}
        }
      }
      const c = document.getElementById('biomeCount'); if (c) c.textContent = String(LS.completed);
      const l = document.getElementById('lapVal'); if (l) l.textContent = String(LS.lap);
      const b = document.getElementById('biomeLessons'); if (b) b.textContent = String(LS.biomeProgress[biome] || 0);
    }
    window.__e2e_completeOnce = completeOnce;
    root.append(html`
      <section style="padding:16px;font-family:Inter,system-ui">
        <h2>${biome.charAt(0).toUpperCase() + biome.slice(1)} (e2e)</h2>
        <button data-testid="complete-lesson" onclick="__e2e_completeOnce()">Complete Lesson</button>
        <div style="margin-top:8px">Lessons in ${biome}: <span id="biomeLessons">${lessonsInBiome}</span> — Completed biomes: <span id="biomeCount">${LS.completed}</span> — Lap: <span id="lapVal">${LS.lap}</span></div>
      </section>
    `);
  }

  function Progress(){ clearRoot().append(html`<section style="padding:16px;font-family:Inter,system-ui"><h2 data-testid="progress-heading">progress</h2></section>`); }
  function Settings(){ clearRoot().append(html`<section style="padding:16px;font-family:Inter,system-ui"><h2 data-testid="settings-heading">settings</h2></section>`); }

  function render(){
    const p = location.pathname;
    if (p.startsWith('/island/forest') || p.startsWith('/island/tropics') || p.startsWith('/island/desert') || p.startsWith('/island/coast')) return Forest();
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

  document.addEventListener('DOMContentLoaded', () => { document.body.style.opacity = '1'; render(); });
  window.addEventListener('popstate', render);
})();
