/* ============================================================
   Catalyst Corp — Scroll polish
   Smooth scrolling (Lenis) + advanced GSAP scroll reveals.
   Fully guarded: if GSAP/Lenis are missing or the user prefers
   reduced motion, content is shown immediately with native scroll.
   ============================================================ */
(function () {
  "use strict";
  var d = document.documentElement;

  function showAll() {
    d.classList.remove("anim-init");
    if (window.__animFallback) { clearTimeout(window.__animFallback); window.__animFallback = null; }
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Bail out gracefully — reveal everything, keep native scroll.
  if (reduce || !window.gsap || !window.ScrollTrigger) { showAll(); return; }
  if (window.__animFallback) { clearTimeout(window.__animFallback); window.__animFallback = null; }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scrolling via Lenis (safe with sticky/fixed/pins) ---------- */
  if (window.Lenis) {
    try {
      var lenis = new Lenis({
        lerp: 0.1,           // interpolated smoothing — smoothest continuous feel
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        syncTouch: false     // let touch devices use native momentum
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis;

      // Route in-page anchor links through Lenis for a smooth glide.
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          if (!id || id === "#" || id.length < 2) return;
          var target = document.querySelector(id);
          if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -90 }); }
        });
      });
    } catch (err) { /* Lenis optional — native scroll still works */ }
  }

  /* ---------- Advanced reveals: staggered fade + rise ---------- */
  var reveals = gsap.utils.toArray(".reveal");
  if (reveals.length) {
    gsap.set(reveals, { opacity: 0, y: 30 });
    ScrollTrigger.batch(reveals, {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.09, overwrite: true });
      }
    });
  }

  /* ---------- Hero heading: character reveal (SplitText, blur + rise) ---------- */
  (function () {
    var heroTitles = gsap.utils.toArray(".home-hero h1, .page-hero h1, .ed-hero h1");
    if (!heroTitles.length) return;
    if (window.SplitText && document.fonts && document.fonts.ready) {
      try { gsap.registerPlugin(SplitText); } catch (e) {}
      document.fonts.ready.then(function () {
        heroTitles.forEach(function (h) {
          try {
            SplitText.create(h, {
              type: "words, chars",
              onSplit: function (self) {
                return gsap.from(self.chars, {
                  opacity: 0, yPercent: 60, filter: "blur(10px)",
                  duration: 0.7, ease: "power3.out", stagger: 0.022
                });
              }
            });
          } catch (e) { gsap.set(h, { clearProps: "all" }); }
        });
      });
    } else {
      heroTitles.forEach(function (h) {
        gsap.from(h, { opacity: 0, y: 34, duration: 0.9, ease: "power3.out" });
      });
    }
  })();

  /* ---------- Section titles: fade up on scroll ---------- */
  var titles = gsap.utils.toArray(".sec-head h2, .split-copy h2, .about-copy h2, .cta-box h2, .quote-wrap h2");
  if (titles.length) {
    gsap.set(titles, { opacity: 0, y: 42 });
    ScrollTrigger.batch(titles, {
      start: "top 86%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.95, ease: "power3.out", stagger: 0.1, overwrite: true });
      }
    });
  }

  /* ---------- Paragraph text masking (GSAP SplitText) ----------
     Splits body copy into lines and reveals each line rising out of a mask
     as it scrolls into view. Runs after fonts load for correct line breaks. */
  if (window.SplitText && document.fonts && document.fonts.ready) {
    try { gsap.registerPlugin(SplitText); } catch (e) {}
    document.fonts.ready.then(function () {
      var paras = gsap.utils.toArray(".sec-head p, .split-copy p, .about-copy p, .cta-box p, .home-hero p.sub, .page-hero p, .lede, .fcard p, .step p");
      paras.forEach(function (el) {
        try {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            linesClass: "sp-line",
            onSplit: function (self) {
              return gsap.from(self.lines, {
                yPercent: 115,
                duration: 0.9,
                ease: "power4.out",
                stagger: 0.11,
                scrollTrigger: { trigger: el, start: "top 86%", once: true }
              });
            }
          });
        } catch (e) { /* leave paragraph as-is on any failure */ }
      });
      ScrollTrigger.refresh();
    });
  }

  /* ---------- Logo strip: seamless horizontal marquee (plays in view) ---------- */
  gsap.utils.toArray(".logos .lrow").forEach(function (row) {
    try {
      var items = Array.prototype.slice.call(row.children);
      if (items.length < 2) return;
      var track = document.createElement("div");
      track.className = "logo-track";
      items.forEach(function (it) { track.appendChild(it); });
      items.forEach(function (it) { var c = it.cloneNode(true); c.setAttribute("aria-hidden", "true"); track.appendChild(c); });
      row.classList.add("is-marquee");
      row.appendChild(track);
      var loop = gsap.to(track, { xPercent: -50, duration: 26, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        trigger: row, start: "top bottom", end: "bottom top",
        onToggle: function (self) { self.isActive ? loop.play() : loop.pause(); }
      });
    } catch (e) { /* leave the static logo row on any failure */ }
  });

  /* ---------- Gentle parallax on framed media ---------- */
  gsap.utils.toArray(".split-media").forEach(function (el) {
    gsap.fromTo(el, { backgroundPositionY: "42%" }, {
      backgroundPositionY: "58%", ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  // Content is now GSAP-controlled; keep the pre-paint hide class in place.
  ScrollTrigger.refresh();
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
