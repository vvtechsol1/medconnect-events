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

  /* ---------- Hero titles: rise on load ---------- */
  gsap.utils.toArray(".home-hero h1, .page-hero h1, .ed-hero h1").forEach(function (h) {
    gsap.from(h, { opacity: 0, y: 34, duration: 0.9, ease: "power3.out", delay: 0.05 });
  });

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
