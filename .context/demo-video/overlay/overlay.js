/* Demo overlay: cursor, click ripple, caption bar, highlight box, key badge, title card.
   Injected into the prototype page before it loads. Everything lives in #demo-root so it
   never touches the app's own DOM. Playwright's real mouse events drive the cursor. */
(() => {
  if (window.__demo) return;
  const css = `
  #demo-root, #demo-root * { box-sizing: border-box; }
  #demo-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; font-family: "Noto Sans", system-ui, sans-serif; }
  html.demo-hide-bar .rbar, html.demo-hide-bar .rtab { display: none !important; }
  html { cursor: none !important; } html * { cursor: none !important; }
  #demo-cursor { position: absolute; left: 0; top: 0; width: 28px; height: 28px; margin: -3px 0 0 -3px; transition: transform .04s linear; will-change: transform; filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
  #demo-ripple { position: absolute; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; border: 3px solid #0e7490; opacity: 0; }
  #demo-ripple.go { animation: demo-rip .55s ease-out; }
  @keyframes demo-rip { 0% { transform: scale(.4); opacity: .9; } 100% { transform: scale(3.2); opacity: 0; } }
  #demo-hl { position: absolute; border: 3px solid #f59e0b; border-radius: 10px; box-shadow: 0 0 0 9999px rgba(15,23,42,.38); opacity: 0; transition: opacity .25s, left .25s, top .25s, width .25s, height .25s; }
  #demo-hl.on { opacity: 1; }
  #demo-cap { position: absolute; left: 50%; bottom: 28px; transform: translate(-50%, 12px); max-width: 78%; padding: 14px 26px; border-radius: 14px; background: rgba(15,23,42,.92); color: #fff; font: 500 22px/32px "Noto Sans", sans-serif; text-align: center; opacity: 0; transition: opacity .25s, transform .25s; box-shadow: 0 8px 28px rgba(0,0,0,.35); }
  #demo-cap.on { opacity: 1; transform: translate(-50%, 0); }
  #demo-cap.top { bottom: auto; top: 22px; }
  #demo-cap b { color: #fcd34d; font-weight: 700; }
  #demo-key { position: absolute; right: 36px; bottom: 120px; padding: 8px 18px; border-radius: 10px; background: #fff; color: #0f172a; border: 2px solid #94a3b8; border-bottom-width: 5px; font: 600 22px/28px "JetBrains Mono", monospace; opacity: 0; transition: opacity .2s; }
  #demo-key.on { opacity: 1; }
  #demo-card { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: linear-gradient(135deg, #0f172a, #134e4a); color: #fff; opacity: 0; transition: opacity .35s; text-align: center; padding: 0 120px; }
  #demo-card.on { opacity: 1; }
  #demo-card small { font: 500 18px/24px "JetBrains Mono", monospace; letter-spacing: 3px; text-transform: uppercase; color: #5eead4; }
  #demo-card h1 { margin: 0; font: 600 64px/74px "Newsreader", serif; }
  #demo-card p { margin: 0; font: 400 26px/38px "Noto Sans", sans-serif; color: #cbd5e1; max-width: 1000px; }
  `;
  const mount = () => {
    if (document.getElementById("demo-root")) return;
    const st = document.createElement("style"); st.textContent = css; document.documentElement.appendChild(st);
    const r = document.createElement("div"); r.id = "demo-root";
    r.innerHTML = `<div id="demo-hl"></div><div id="demo-ripple"></div>
      <svg id="demo-cursor" viewBox="0 0 28 28"><path d="M4 2 L4 22 L9.5 17 L13.5 25.5 L17 24 L13 15.5 L20.5 15.5 Z" fill="#fff" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/></svg>
      <div id="demo-key"></div><div id="demo-cap"></div><div id="demo-card"></div>`;
    document.documentElement.appendChild(r);
    document.documentElement.classList.add("demo-hide-bar");
    const cur = r.querySelector("#demo-cursor"), rip = r.querySelector("#demo-ripple");
    let x = -50, y = -50;
    const place = () => { cur.style.transform = `translate(${x}px,${y}px)`; };
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; place(); }, true);
    addEventListener("mousedown", (e) => { rip.style.left = e.clientX + "px"; rip.style.top = e.clientY + "px"; rip.classList.remove("go"); void rip.offsetWidth; rip.classList.add("go"); }, true);
    place();
  };
  const $ = (id) => document.getElementById(id);
  const md = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  window.__demo = {
    mount,
    caption(t, pos) { const c = $("demo-cap"); if (!t) return c.classList.remove("on"); c.classList.toggle("top", pos === "top"); c.innerHTML = md(t); c.classList.add("on"); },
    highlight(rect, pad = 8) { const h = $("demo-hl"); if (!rect) return h.classList.remove("on");
      Object.assign(h.style, { left: rect.x - pad + "px", top: rect.y - pad + "px", width: rect.width + pad * 2 + "px", height: rect.height + pad * 2 + "px" }); h.classList.add("on"); },
    key(t) { const k = $("demo-key"); if (!t) return k.classList.remove("on"); k.textContent = t; k.classList.add("on"); },
    card(kicker, title, sub) { const c = $("demo-card"); if (kicker === null) return c.classList.remove("on");
      c.innerHTML = `<small>${md(kicker)}</small><h1>${md(title)}</h1>${sub ? `<p>${md(sub)}</p>` : ""}`; c.classList.add("on"); },
    bar(show) { document.documentElement.classList.toggle("demo-hide-bar", !show); },
  };
  if (document.documentElement) mount(); else document.addEventListener("DOMContentLoaded", mount);
  document.addEventListener("DOMContentLoaded", mount);
})();
