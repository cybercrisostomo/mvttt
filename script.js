(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var body = document.body;
  var prefersReduced = matchMedia("(prefers-reduced-motion:reduce)");
  var isFine = matchMedia("(pointer:fine)").matches;

  /* ---------- theme ---------- */
  var themeBtn = $("theme");
  function currentTheme() {
    return root.dataset.theme || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
  }
  function updateThemeLabel() { themeBtn.textContent = currentTheme() === "dark" ? "light" : "dark"; }
  try { var saved = localStorage.getItem("theme"); if (saved) root.dataset.theme = saved; } catch (e) {}
  updateThemeLabel();
  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    updateThemeLabel();
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = $("menu"), header = $("hd"), navLinks = document.querySelectorAll("nav a");
  function closeMenu() {
    header.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "Menu";
  }
  menuBtn.addEventListener("click", function () {
    var open = header.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.textContent = open ? "Close" : "Menu";
  });
  navLinks.forEach(function (a) { a.addEventListener("click", closeMenu); });
  addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- progress bar ---------- */
  var prog = $("prog");
  addEventListener("scroll", function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
    header.classList.toggle("solid", scrollY > 40);
    $("top").classList.toggle("show", scrollY > innerHeight * 0.6);
  }, { passive: true });
  $("top").addEventListener("click", function () { scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------- background video (lightweight, lazy) ---------- */
  var vid = document.querySelector(".vid");
  var hero = $("home");
  function readyVideo() { hero.classList.add("ready"); }
  if (vid) {
    var cn = navigator.connection || {};
    if (cn.saveData || matchMedia("(max-width: 52rem)").matches || prefersReduced.matches) {
      vid.remove(); vid = null;
    } else if (vid.dataset.src) {
      vid.src = vid.dataset.src;
      if (vid.readyState >= 2) readyVideo();
      else vid.addEventListener("loadeddata", readyVideo);
    }
    if (vid && prefersReduced.matches) vid.pause();
  }

  /* ---------- clock (Manila) ---------- */
  var clk = $("clk");
  function tick() {
    clk.textContent = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" }) + " PHT";
  }
  tick(); setInterval(tick, 30000);

  /* ---------- hero: fuse + bomb + pin ---------- */
  var pull = $("pull");
  var sparks = $("sparks");
  function burstSparks(x, y, count) {
    if (prefersReduced.matches) return;
    count = count || 14;
    var frags = [];
    for (var i = 0; i < count; i++) {
      var s = document.createElement("div");
      s.className = "spark";
      var ang = Math.random() * 6.283;
      var dist = 40 + Math.random() * 160;
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.setProperty("--ty", (Math.sin(ang) * dist) + "px");
      s.style.setProperty("--tr", (Math.random() * 720 - 360) + "deg");
      s.style.animationDuration = (0.5 + Math.random() * 0.6) + "s";
      sparks.appendChild(s);
      frags.push(s);
    }
    setTimeout(function () { frags.forEach(function (f) { f.remove(); }); }, 1200);
  }

  function doBoom() {
    hero.classList.add("boom");
    var rect = hero.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height * 0.42;
    burstSparks(cx, cy, 20);
    setTimeout(function () { hero.classList.remove("boom"); }, 800);
  }

  pull.addEventListener("click", function (e) {
    e.stopPropagation();
    pull.classList.add("pulled");
    doBoom();
    setTimeout(function () { pull.classList.remove("pulled"); }, 2400);
    playMusic();
  });

  /* click anywhere on hero = mini boom */
  hero.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button, a, input, textarea")) return;
    doBoom();
    if (sparks.children.length === 0) burstSparks(e.clientX, e.clientY, 12);
  });

  /* ---------- custom cursor (fine pointer only) ---------- */
  var cur = $("cur");
  if (isFine && !prefersReduced.matches) {
    addEventListener("pointermove", function (e) {
      cur.style.opacity = 1;
      cur.style.transform = "translate(" + (e.clientX - 7) + "px, " + (e.clientY - 7) + "px)";
    });
    addEventListener("pointerover", function (e) {
      cur.classList.toggle("big", !!e.target.closest("a, button"));
    });
    addEventListener("pointerout", function () { cur.style.opacity = 0; });
  }

  /* ---------- music ---------- */
  var au = $("au"), snd = $("snd"), sndTxt = $("sndtxt");
  function playMusic() {
    return au.play().then(function () {
      sndTxt.textContent = "Tensionado Soapdish";
      snd.classList.add("playing");
      snd.setAttribute("aria-pressed", "true");
    }).catch(function () {});
  }
  function toggleMusic() {
    if (au.paused) playMusic();
    else {
      au.pause();
      sndTxt.textContent = "Play music";
      snd.classList.remove("playing");
      snd.setAttribute("aria-pressed", "false");
    }
  }
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && !e.target.closest("input, textarea, button")) {
      e.preventDefault();
      playMusic();
      document.removeEventListener("keydown", arguments.callee);
    }
  });
  snd.addEventListener("click", toggleMusic);

  /* ---------- work filter ---------- */
  var filterBtns = document.querySelectorAll("#filters button");
  var cards = document.querySelectorAll("#grid .card");
  var ghost = $("ghost");
  var ghostMsg = null;
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (o) {
        o.classList.toggle("on", o === btn);
        o.setAttribute("aria-pressed", o === btn ? "true" : "false");
      });
      var f = btn.dataset.f, shown = 0;
      cards.forEach(function (cd) {
        var show = f === "all" || (" " + cd.dataset.c + " ").indexOf(" " + f + " ") > -1;
        cd.style.display = show ? "" : "none";
        if (show) shown++;
      });
      ghost.style.display = f === "all" ? "" : "none";
      if (ghostMsg) { ghostMsg.remove(); ghostMsg = null; }
      if (!shown) {
        ghostMsg = document.createElement("p");
        ghostMsg.className = "none";
        ghostMsg.textContent = "Nothing in this category yet.";
        document.getElementById("grid").appendChild(ghostMsg);
      }
    });
  });
  // category counts
  filterBtns.forEach(function (b) {
    var f = b.dataset.f, n = 0;
    cards.forEach(function (c) { if (f === "all" || (" " + c.dataset.c + " ").indexOf(" " + f + " ") > -1) n++; });
    var sup = b.querySelector("sup");
    if (sup) sup.textContent = ("0" + n).slice(-2);
  });

  /* ---------- scroll reveal ---------- */
  if ("IntersectionObserver" in window && !prefersReduced.matches) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add("in");
          reveal.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    var revealEls = document.querySelectorAll(".h, .cell, .chips, .work-top > div, .filters, .card, .ghost, .about p, .tiles div, .links li");
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--d", Math.min(i, 5) * 90 + "ms");
      el.classList.add("rv");
      reveal.observe(el);
    });
  }

  /* ---------- contact form (mailto) ---------- */
  var TO = "you@domain.com";  // <-- change to your real email
  var form = $("mail");
  if (form) {
    var ok = form.querySelector(".ok");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var sub = encodeURIComponent("Hello mvtt — " + (fd.get("name") || ""));
      var body = encodeURIComponent("Name: " + fd.get("name") + "\nEmail: " + fd.get("email") + "\n\n" + fd.get("message"));
      location.href = "mailto:" + TO + "?subject=" + sub + "&body=" + body;
      ok.textContent = "Opened your mail app — hit send to deliver.";
      form.reset();
      setTimeout(function () { ok.textContent = ""; }, 6000);
    });
  }

})();
