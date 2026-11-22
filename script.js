(function () {
  // Change this to your real email address
  var EMAIL = "hello@example.com";

  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (n) { return Math.min(1, Math.max(0, n)); };
  var root = document.documentElement;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ($("yr")) $("yr").textContent = new Date().getFullYear();

  var form = $("form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var body = "Name: " + form.name.value + "\nEmail: " + form.email.value + "\n\n" + form.msg.value;
    window.location.href = "mailto:" + EMAIL + "?subject=" +
      encodeURIComponent("Website enquiry from " + form.name.value) + "&body=" + encodeURIComponent(body);
  });

  if (still) { root.classList.add("static"); return; }
  root.classList.add("js");

  // Loading screen: shows the L&J mark while a page loads, then fades away
  var loader = document.querySelector(".loader");
  function hideLoader() { if (loader) loader.classList.add("gone"); }
  if (document.readyState === "complete") setTimeout(hideLoader, 800);
  else window.addEventListener("load", function () { setTimeout(hideLoader, 800); });

  // Fade out when moving to another page
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    var h = a.getAttribute("href");
    if (!h || h.charAt(0) === "#" || /^(https?:|mailto:|tel:)/.test(h)) return;
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(function () { window.location.href = h; }, 450);
  });
  window.addEventListener("pageshow", function () { document.body.classList.remove("leaving"); });

  var hero = $("hero"), lock = $("lock"), tag = $("tag"), halo = document.querySelector(".halo");
  var prog = $("prog"), tl = $("tl"), fill = $("fill");
  var orbs = document.querySelectorAll("[data-par]");
  var words = document.querySelectorAll(".w"), letters = [];
  var final = document.querySelector(".final"), hint = document.querySelector(".hint");
  var steps = tl ? tl.querySelectorAll("li") : [];
  var starts = [0.1, 0.3, 0.5], seps = document.querySelectorAll(".sep");
  var drift = 0;

  // Optional video background: only shows if hero.mp4 exists
  var v = $("bgv");
  if (v) {
    v.addEventListener("canplay", function () { v.classList.add("ok"); });
    v.addEventListener("error", function () { v.remove(); });
  }

  // Split each tagline word into letters so they arrive one by one
  for (var q = 0; q < words.length; q++) {
    var txt = words[q].textContent, arr = [];
    words[q].setAttribute("aria-label", txt);
    words[q].textContent = "";
    for (var c = 0; c < txt.length; c++) {
      var sp = document.createElement("span");
      sp.setAttribute("aria-hidden", "true");
      sp.textContent = txt.charAt(c);
      words[q].appendChild(sp);
      arr.push(sp);
    }
    letters.push(arr);
  }

  function frame() {
    var vh = window.innerHeight, i, j;
    if (hero) {
      var r = hero.getBoundingClientRect();
      var p = clamp(-r.top / (r.height - vh));
      lock.style.transform = "translate(var(--tx,0px),var(--ty,0px)) translateY(" + (-p * 9) + "vh) scale(" + (1 - p * 0.14) + ")";
      halo.style.transform = "translate(calc(var(--tx,0px) * -1.4),calc(var(--ty,0px) * -1.4)) scale(" + (1 + p * 0.9) + ")";
      halo.style.opacity = 1 - clamp(p * 1.3) * 0.45;
      hint.style.opacity = 1 - clamp(p * 8);
      for (i = 0; i < words.length; i++) {
        var e = clamp((p - starts[i]) / 0.12);
        for (j = 0; j < letters[i].length; j++) {
          var li = clamp(e * 1.9 - j * 0.11);
          letters[i][j].style.opacity = li;
          letters[i][j].style.transform = "translateY(" + ((1 - li) * 70) + "px) rotate(" + ((1 - li) * 8) + "deg) scale(" + (0.7 + li * 0.3) + ")";
        }
      }
      for (i = 0; i < seps.length; i++) seps[i].classList.toggle("on", p > starts[i + 1] - 0.02);
      tag.classList.toggle("done", p > 0.72);
      var fo = clamp((p - 0.78) / 0.12);
      final.style.opacity = fo;
      final.style.transform = "translateY(" + ((1 - fo) * 20) + "px)";
      final.style.pointerEvents = fo > 0.5 ? "auto" : "none";
    }

    var max = document.documentElement.scrollHeight - vh;
    prog.style.transform = "scaleX(" + clamp(max > 0 ? window.scrollY / max : 0) + ")";

    if (tl) {
      var t = tl.getBoundingClientRect();
      var h = clamp((vh * 0.65 - t.top) / t.height) * (t.height - 12);
      fill.style.height = h + "px";
      for (i = 0; i < steps.length; i++) steps[i].classList.toggle("on", steps[i].offsetTop + 8 < h);
    }
    for (i = 0; i < orbs.length; i++) {
      var pr = orbs[i].parentNode.getBoundingClientRect();
      orbs[i].style.transform = "translateY(" + ((pr.top + pr.height / 2 - vh / 2) * -orbs[i].getAttribute("data-par")) + "px)";
    }
    drift = window.scrollY;
  }

  // Services light up as they pass the middle of the screen
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle("on", e.isIntersecting); });
  }, { rootMargin: "-42% 0px -42% 0px" });
  document.querySelectorAll(".row").forEach(function (r) { io.observe(r); });

  // Headings wipe in once
  var ro = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } });
  }, { threshold: 0.4 });
  document.querySelectorAll("h1,h2").forEach(function (h) { ro.observe(h); });

  // Logo and glow lean towards your finger or mouse
  var mx = 0, my = 0, tx = 0, ty = 0, px = -999, py = -999;
  window.addEventListener("pointermove", function (e) {
    px = e.clientX; py = e.clientY;
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  // Floating gold dust
  var cv = $("dust"), cx = cv.getContext("2d"), dots = [], W, H;
  function size() {
    var d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * d; cv.height = innerHeight * d;
    cx.setTransform(d, 0, 0, d, 0, 0);
    W = innerWidth; H = innerHeight;
  }
  size();
  var n = innerWidth < 600 ? 40 : 80;
  for (var k = 0; k < n; k++) {
    dots.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, s: 0.02 + Math.random() * 0.06, z: 0.1 + Math.random() * 0.5, a: 0.15 + Math.random() * 0.5, ox: 0, oy: 0 });
  }
  function dust(ts) {
    if (lock) {
      tx += (mx * 34 - tx) * 0.06; ty += (my * 26 - ty) * 0.06;
      lock.style.setProperty("--tx", tx + "px"); lock.style.setProperty("--ty", ty + "px");
      halo.style.setProperty("--tx", tx + "px"); halo.style.setProperty("--ty", ty + "px");
    }
    cx.clearRect(0, 0, W, H);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var y = ((d.y * H - ts * d.s * 0.06 - drift * d.z) % H + H) % H;
      var x = d.x * W + Math.sin(ts / 3000 + i) * 14;
      var dx = x - px, dy = y - py, dist = Math.sqrt(dx * dx + dy * dy);
      var push = dist < 130 ? (130 - dist) / 130 : 0;
      d.ox += ((dx / (dist || 1)) * push * 60 - d.ox) * 0.12;
      d.oy += ((dy / (dist || 1)) * push * 60 - d.oy) * 0.12;
      var al = d.a * (0.6 + 0.4 * Math.sin(ts / 600 + i * 1.7));
      cx.beginPath(); cx.arc(x + d.ox, y + d.oy, d.r * 4, 0, 6.2832);
      cx.fillStyle = "rgba(201,164,92," + (al * 0.12) + ")"; cx.fill();
      cx.beginPath(); cx.arc(x + d.ox, y + d.oy, d.r, 0, 6.2832);
      cx.fillStyle = "rgba(236,212,154," + al + ")"; cx.fill();
    }
    requestAnimationFrame(dust);
  }
  requestAnimationFrame(dust);

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { frame(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener("resize", function () { size(); frame(); });
  frame();
})();
