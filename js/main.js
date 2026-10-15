(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  // Mobile navigation
  const toggle = $(".nav-toggle"), menu = $("#nav-menu");
  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });

  // Remember the selected color mode.
  const root = document.documentElement, themeButton = $(".theme-toggle");
  let theme = "dark";
  try { theme = localStorage.getItem("theme") || "dark"; } catch (_) {}
  const applyTheme = (value) => {
    theme = value;
    if (value === "dark") delete root.dataset.theme;
    else root.dataset.theme = value;
    themeButton.setAttribute("aria-label", `Switch to ${value === "dark" ? "light" : "dark"} theme`);
    readHoney();
  };
  themeButton.addEventListener("click", () => {
    applyTheme(theme === "dark" ? "light" : "dark");
    try { localStorage.setItem("theme", theme); } catch (_) {}
  });

  // Letter-by-letter name entrance.
  $$('[data-split]').forEach((line, lineIndex) => {
    const characters = [...line.childNodes];
    line.textContent = "";
    let letterIndex = 0;
    characters.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        [...node.textContent].forEach((character) => {
          const span = document.createElement("span");
          span.className = "ch";
          span.textContent = character;
          span.style.setProperty("--i", letterIndex++ + lineIndex * 7);
          line.append(span);
        });
      } else line.append(node);
    });
  });

  // Story fragments rotate like small chapters.
  const typed = $(".typed");
  if (typed) {
    const lines = JSON.parse(typed.dataset.lines);
    if (reduceMotion) typed.textContent = lines[0];
    else {
      let lineIndex = 0, charIndex = 0, deleting = false;
      const type = () => {
        const line = lines[lineIndex];
        charIndex += deleting ? -1 : 1;
        typed.textContent = line.slice(0, charIndex);
        let delay = deleting ? 20 : 42;
        if (!deleting && charIndex === line.length) { deleting = true; delay = 2200; }
        else if (deleting && charIndex === 0) { deleting = false; lineIndex = (lineIndex + 1) % lines.length; delay = 450; }
        setTimeout(type, delay);
      };
      setTimeout(type, 1700);
    }
  }

  // Scroll progress and active navigation state.
  const progress = $(".progress");
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
  const navLinks = $$('.nav-menu a[href^="#"]');
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
      });
    }, { rootMargin: "-42% 0px -48% 0px" });
    $$('main section[id]').forEach((section) => sectionObserver.observe(section));

    const animated = $$('.chapter .section-top,.chapter-grid,.origin-story,.storyline,.section-heading,.skill-card,.featured-project,.project-note,.contact-inner>.section-top,.contact-kicker,.contact-inner>h2,.contact-row');
    if (!reduceMotion) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .12, rootMargin: "0px 0px -30px 0px" });
      animated.forEach((item) => revealObserver.observe(item));
    }
  }

  // Subtle desktop cursor, tilt, and magnetic button interactions.
  const glow = $(".cursor-glow"), tilt = $(".tilt"), mouse = { x: -999, y: -999 };
  if (finePointer && !reduceMotion) {
    addEventListener("pointermove", (event) => {
      glow.classList.add("on");
      glow.style.transform = `translate(${event.clientX}px,${event.clientY}px)`;
      mouse.x = event.clientX; mouse.y = event.clientY;
    }, { passive: true });
    const hero = $(".hero");
    hero.addEventListener("pointermove", (event) => {
      const rect = tilt.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) / innerWidth;
      const y = (event.clientY - (rect.top + rect.height / 2)) / innerHeight;
      tilt.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
    });
    hero.addEventListener("pointerleave", () => { tilt.style.transform = ""; });
    $$(".magnetic").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .12}px,${(event.clientY - rect.top - rect.height / 2) * .18}px)`;
      });
      button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    });
  }

  // Honeycomb field with a soft pointer wake.
  const canvas = $(".hive"), context = canvas.getContext("2d");
  let rgb = "221,162,70", width = 0, height = 0, pixelRatio = 1;
  const radius = 33;
  function readHoney() { rgb = getComputedStyle(root).getPropertyValue("--honey-rgb").trim() || rgb; }
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = width * pixelRatio; canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
  function drawHexagon(cx, cy) {
    context.beginPath();
    for (let point = 0; point < 6; point++) {
      const angle = Math.PI / 3 * point + Math.PI / 6;
      context[point ? "lineTo" : "moveTo"](cx + (radius - 1.5) * Math.cos(angle), cy + (radius - 1.5) * Math.sin(angle));
    }
    context.closePath();
  }
  function draw(time = 0) {
    context.clearRect(0, 0, width, height);
    const rect = canvas.getBoundingClientRect();
    const mx = mouse.x - rect.left, my = mouse.y - rect.top;
    const stepX = Math.sqrt(3) * radius, stepY = 1.5 * radius;
    for (let row = -1; row * stepY < height + radius; row++) {
      for (let col = -1; col * stepX < width + stepX; col++) {
        const cx = col * stepX + (row % 2 ? stepX / 2 : 0), cy = row * stepY;
        const wave = (Math.sin(cx * .008 + cy * .006 + time * .0007) + 1) / 2;
        const proximity = Math.max(0, 1 - Math.hypot(cx - mx, cy - my) / 190);
        drawHexagon(cx, cy);
        if (proximity > .05) { context.fillStyle = `rgba(${rgb},${proximity * .12})`; context.fill(); }
        context.strokeStyle = `rgba(${rgb},${.035 + wave * .05 + proximity * .35})`;
        context.lineWidth = 1;
        context.stroke();
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  readHoney(); applyTheme(theme); resizeCanvas();
  if (!reduceMotion) requestAnimationFrame(draw); else draw(0);
  addEventListener("resize", () => { resizeCanvas(); if (reduceMotion) draw(0); });

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
