/* Portfolio: home page behaviour */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Mobile menu ---------- */
  const toggle = $(".nav-toggle"), menu = $("#nav-menu");
  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Theme (dark by default, choice remembered) ---------- */
  const root = document.documentElement, themeBtn = $(".theme-toggle");
  let theme = "dark";
  try { theme = localStorage.getItem("theme") || "dark"; } catch (_) {}
  const applyTheme = (t) => {
    theme = t; root.dataset.theme = t;
    themeBtn.setAttribute("aria-label", `Switch to ${t === "dark" ? "light" : "dark"} theme`);
    readHoney();
  };
  themeBtn.addEventListener("click", () => {
    applyTheme(theme === "dark" ? "light" : "dark");
    try { localStorage.setItem("theme", theme); } catch (_) {}
  });

  /* ---------- Split the name into letters for the entrance ---------- */
  document.querySelectorAll("[data-split]").forEach((el, line) => {
    const text = el.textContent.trim();
    el.textContent = "";
    [...text].forEach((c, i) => {
      const s = document.createElement("span");
      s.className = "ch"; s.textContent = c;
      s.style.setProperty("--i", i + line * 6);
      el.appendChild(s);
    });
  });

  /* ---------- Typewriter story line ---------- */
  const typed = $(".typed");
  if (typed) {
    const lines = JSON.parse(typed.dataset.lines);
    if (reduceMotion) { typed.textContent = " " + lines[0]; }
    else {
      let li = 0, ci = 0, deleting = false;
      const tick = () => {
        const full = lines[li];
        ci += deleting ? -1 : 1;
        typed.textContent = " " + full.slice(0, ci);
        let wait = deleting ? 22 : 45;
        if (!deleting && ci === full.length) { deleting = true; wait = 2200; }
        else if (deleting && ci === 0) { deleting = false; li = (li + 1) % lines.length; wait = 500; }
        setTimeout(tick, wait);
      };
      setTimeout(tick, 2200);
    }
  }

  /* ---------- Scroll: progress bar + active link ---------- */
  const bar = $(".progress");
  const links = [...document.querySelectorAll('.nav-menu a[href^="#"]')];
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));

  /* ---------- Pointer effects (desktop only) ---------- */
  const glow = $(".cursor-glow"), tilt = $(".tilt");
  if (finePointer && !reduceMotion) {
    addEventListener("pointermove", (e) => {
      glow.classList.add("on");
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      mouse.x = e.clientX; mouse.y = e.clientY;
    }, { passive: true });

    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      tilt.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg)`;
    });
    hero.addEventListener("pointerleave", () => { tilt.style.transform = ""; });

    document.querySelectorAll(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------- Honeycomb canvas: hexagons light up near the pointer ---------- */
  const canvas = $(".hive"), ctx = canvas.getContext("2d");
  const mouse = { x: -999, y: -999 };
  let rgb = "224,163,74", W = 0, H = 0, dpr = 1;
  const R = 34; // hexagon radius
  function readHoney() { rgb = getComputedStyle(root).getPropertyValue("--honey-rgb").trim() || rgb; }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function hex(cx, cy) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 3 * k + Math.PI / 6;
      ctx[k ? "lineTo" : "moveTo"](cx + (R - 1.5) * Math.cos(a), cy + (R - 1.5) * Math.sin(a));
    }
    ctx.closePath();
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const rect = canvas.getBoundingClientRect();
    const mx = mouse.x - rect.left, my = mouse.y - rect.top;
    const w = Math.sqrt(3) * R, h = 1.5 * R;
    for (let row = -1; row * h < H + R; row++) {
      for (let col = -1; col * w < W + w; col++) {
        const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * h;
        const wave = (Math.sin(cx * .008 + cy * .006 + t * .0009) + 1) / 2;       // slow ambient wave
        const d = Math.hypot(cx - mx, cy - my);
        const near = Math.max(0, 1 - d / 200);                                    // pointer light
        const a = .035 + wave * .05 + near * .4;
        hex(cx, cy);
        if (near > .05) { ctx.fillStyle = `rgba(${rgb},${near * .12})`; ctx.fill(); }
        ctx.strokeStyle = `rgba(${rgb},${a})`; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  readHoney(); applyTheme(theme); resize(); requestAnimationFrame(draw);
  addEventListener("resize", () => { resize(); if (reduceMotion) draw(0); });
  if (reduceMotion) draw(0);

  /* ---------- Footer year ---------- */
  const year = $("#year"); if (year) year.textContent = new Date().getFullYear();
})();