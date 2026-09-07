/* ==========================================================================
   APEX ACCOUNTING — INTERACTIONS
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initNav();
    initScrollUI();
    initReveal();
    initMarquee();
    initCounters();
    initModals();
    initForms();
    initTestimonials();
    initEstimator();

    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  /* ==========================================================================
     THEME
     ========================================================================== */
  function initTheme() {
    var root = document.documentElement;
    var toggle = document.getElementById('theme-toggle');

    // The inline <head> script has already applied the stored/preferred theme,
    // so there is nothing to resolve here — only the toggle to wire up.
    if (!root.getAttribute('data-theme')) root.setAttribute('data-theme', 'light');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });
  }

  /* ==========================================================================
     NAVIGATION DRAWER
     ========================================================================== */
  function initNav() {
    var menu = document.getElementById('nav-menu');
    var overlay = document.getElementById('nav-overlay');
    var burger = document.getElementById('hamburger');
    var close = document.getElementById('drawer-close');
    if (!menu) return;

    function open() {
      menu.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function shut() {
      menu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (burger) burger.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    if (overlay) overlay.addEventListener('click', shut);

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (menu.classList.contains('active')) shut();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('active')) shut();
    });
  }

  /* ==========================================================================
     SCROLL: navbar state, progress bar, scroll-spy, back-to-top
     ========================================================================== */
  function initScrollUI() {
    var navbar = document.getElementById('navbar');
    var progress = document.getElementById('scroll-progress');
    var toTop = document.getElementById('to-top');
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links .nav-link'));
    var ticking = false;

    function update() {
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;

      if (navbar) navbar.classList.toggle('is-scrolled', y > 24);
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
      if (toTop) toTop.classList.toggle('is-visible', y > 640);

      // Scroll spy — the section occupying the upper third of the viewport wins.
      var marker = y + window.innerHeight * 0.32;
      var current = null;
      sections.forEach(function (sec) {
        if (sec.offsetTop <= marker) current = sec.id;
      });
      links.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  /* ==========================================================================
     SCROLL REVEAL
     ========================================================================== */
  function initReveal() {
    var items = document.querySelectorAll('.reveal-item');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================================
     MARQUEE — duplicate the track for a seamless loop
     ========================================================================== */
  function initMarquee() {
    var track = document.getElementById('marquee-track');
    if (!track) return;
    track.innerHTML += track.innerHTML;
  }

  /* ==========================================================================
     ANIMATED COUNTERS
     ========================================================================== */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.dataset.count);
      var decimals = parseInt(el.dataset.decimals || '0', 10);
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';

      if (reduceMotion) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }

      var duration = 1500;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================================
     SERVICE CARD SPOTLIGHT + MODALS
     ========================================================================== */
  function initModals() {
    var backdrop = document.getElementById('modal-backdrop');
    var modals = document.querySelectorAll('.modal');
    var lastFocused = null;

    // Cursor-tracked spotlight
    document.querySelectorAll('.service-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    if (!backdrop) return;

    // Which booking option each modal maps to
    var serviceMap = {
      'modal-bookkeeping': 'bookkeeping',
      'modal-tax': 'tax',
      'modal-audit': 'audit',
      'modal-payroll': 'payroll'
    };
    var openId = null;

    function open(id) {
      var modal = document.getElementById(id);
      if (!modal) return;
      lastFocused = document.activeElement;
      openId = id;
      backdrop.classList.add('active');
      backdrop.setAttribute('aria-hidden', 'false');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      var btn = modal.querySelector('.modal-close');
      if (btn) btn.focus();
    }

    function shut() {
      backdrop.classList.remove('active');
      backdrop.setAttribute('aria-hidden', 'true');
      modals.forEach(function (m) { m.classList.remove('active'); });
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    document.querySelectorAll('.open-modal').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        open(btn.getAttribute('data-modal'));
      });
    });

    document.querySelectorAll('.modal-close').forEach(function (btn) {
      btn.addEventListener('click', shut);
    });

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) shut();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('active')) shut();
    });

    // Carry the chosen service across to the booking form
    document.querySelectorAll('.modal-cta').forEach(function (cta) {
      cta.addEventListener('click', function () {
        var select = document.getElementById('book-service');
        var value = serviceMap[openId];
        if (select && value) {
          select.value = value;
          select.closest('.form-group').classList.remove('error');
        }
        shut();
      });
    });
  }

  /* ==========================================================================
     FORM VALIDATION
     ========================================================================== */
  function initForms() {
    ['booking-form', 'contact-form'].forEach(function (id) {
      var form = document.getElementById(id);
      if (!form) return;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var valid = true;
        var firstBad = null;

        form.querySelectorAll('[required]').forEach(function (input) {
          var group = input.closest('.form-group');
          var ok;

          if (input.type === 'checkbox') {
            ok = input.checked;
          } else if (input.type === 'email') {
            ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
          } else {
            ok = input.value.trim() !== '';
          }

          if (group) group.classList.toggle('error', !ok);
          if (group) group.classList.toggle('success', ok);
          if (!ok) {
            valid = false;
            if (!firstBad) firstBad = input;
          }
        });

        if (!valid) {
          if (firstBad) firstBad.focus();
          return;
        }

        form.classList.add('submitted');
        form.querySelectorAll('.form-group').forEach(function (g) {
          g.classList.remove('error', 'success');
        });
      });

      form.querySelectorAll('input, select, textarea').forEach(function (input) {
        input.addEventListener('input', function () {
          var group = input.closest('.form-group');
          if (group) group.classList.remove('error');
        });
      });
    });

    // Footer newsletter — inline confirmation
    var news = document.getElementById('newsletter-form');
    if (news) {
      news.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = news.querySelector('input');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
          input.focus();
          return;
        }
        input.value = '';
        input.placeholder = 'Subscribed — thank you';
        input.disabled = true;
      });
    }
  }

  /* ==========================================================================
     TESTIMONIAL SLIDER
     ========================================================================== */
  function initTestimonials() {
    var viewport = document.getElementById('testimonial-viewport');
    var dotsWrap = document.getElementById('t-dots');
    if (!viewport || !dotsWrap) return;

    var cards = Array.prototype.slice.call(viewport.querySelectorAll('.testimonial-card'));
    var index = 0;
    var timer = null;

    cards.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 't-dot' + (i === 0 ? ' is-active' : '');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      dot.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(dotsWrap.children);

    function go(next, manual) {
      index = (next + cards.length) % cards.length;
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
      if (manual) restart();
    }

    function restart() {
      if (timer) clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(function () { go(index + 1); }, 7000);
    }

    document.getElementById('t-prev').addEventListener('click', function () { go(index - 1, true); });
    document.getElementById('t-next').addEventListener('click', function () { go(index + 1, true); });
    viewport.addEventListener('pointerenter', function () { if (timer) clearInterval(timer); });
    viewport.addEventListener('pointerleave', restart);

    restart();
  }

  /* ==========================================================================
     INTERACTIVE TAX ESTIMATOR
     Published 2025 federal rates. Illustration only — not tax advice.
     ========================================================================== */
  function initEstimator() {
    var shell = document.getElementById('bracket-list');
    if (!shell) return;

    var BRACKETS = {
      single: [
        { rate: 0.10, from: 0,      to: 11925 },
        { rate: 0.12, from: 11925,  to: 48475 },
        { rate: 0.22, from: 48475,  to: 103350 },
        { rate: 0.24, from: 103350, to: 197300 },
        { rate: 0.32, from: 197300, to: 250525 },
        { rate: 0.35, from: 250525, to: 626350 },
        { rate: 0.37, from: 626350, to: Infinity }
      ],
      married: [
        { rate: 0.10, from: 0,      to: 23850 },
        { rate: 0.12, from: 23850,  to: 96950 },
        { rate: 0.22, from: 96950,  to: 206700 },
        { rate: 0.24, from: 206700, to: 394600 },
        { rate: 0.32, from: 394600, to: 501050 },
        { rate: 0.35, from: 501050, to: 751600 },
        { rate: 0.37, from: 751600, to: Infinity }
      ]
    };

    var STANDARD_DEDUCTION = { single: 15000, married: 30000 };

    var state = {
      status: 'single',
      income: 120000,
      retirement: 8000,
      deduction: 'standard',
      itemized: 22000,
      levers: { hsa: false, qbi: false, charity: false }
    };

    var DEFAULTS = JSON.parse(JSON.stringify(state));

    // --- Elements ---
    var incomeInput = document.getElementById('est-income');
    var incomeRange = document.getElementById('est-income-range');
    var retireRange = document.getElementById('est-401k');
    var retireOut = document.getElementById('est-401k-out');
    var itemizedInput = document.getElementById('est-itemized');
    var itemizedWrap = document.getElementById('itemized-wrap');
    var segStatus = document.getElementById('seg-status');
    var segDeduction = document.getElementById('seg-deduction');
    var levers = document.getElementById('est-levers');
    var resetBtn = document.getElementById('est-reset');

    var arc = document.getElementById('donut-arc');
    var keepOut = document.getElementById('donut-keep');
    var taxOut = document.getElementById('fig-tax');
    var subOut = document.getElementById('fig-sub');
    var taxableOut = document.getElementById('stat-taxable');
    var effectiveOut = document.getElementById('stat-effective');
    var marginalOut = document.getElementById('stat-marginal');
    var bracketNote = document.getElementById('bracket-note');
    var leverHint = document.getElementById('lever-hint');

    var ARC_LENGTH = 2 * Math.PI * 50; // r = 50 in the SVG viewBox

    // --- Formatting helpers ---
    var money0 = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    });

    function fmt(n) { return money0.format(Math.round(n)); }

    // --- The calculation ---
    function calculate() {
      var brackets = BRACKETS[state.status];
      var standard = STANDARD_DEDUCTION[state.status];

      var aboveLine = state.retirement + (state.levers.hsa ? 4300 : 0);
      var agi = Math.max(0, state.income - aboveLine);

      var itemizedTotal = (state.deduction === 'itemized' ? state.itemized : 0) +
                          (state.levers.charity ? 5000 : 0);
      var deduction = Math.max(standard, itemizedTotal);
      var usedItemized = itemizedTotal > standard;

      var preQbi = Math.max(0, agi - deduction);
      // Simplified QBI: 20% of taxable income, assuming all income qualifies.
      var qbi = state.levers.qbi ? preQbi * 0.20 : 0;
      var taxable = Math.max(0, preQbi - qbi);

      var rows = [];
      var tax = 0;
      var marginal = brackets[0].rate;

      brackets.forEach(function (b) {
        var span = Math.max(0, Math.min(taxable, b.to) - b.from);
        var owed = span * b.rate;
        tax += owed;
        if (span > 0) marginal = b.rate;
        rows.push({ rate: b.rate, from: b.from, amount: owed, span: span });
      });

      return {
        agi: agi,
        deduction: deduction,
        usedItemized: usedItemized,
        qbi: qbi,
        taxable: taxable,
        tax: tax,
        marginal: marginal,
        effective: state.income > 0 ? tax / state.income : 0,
        takeHome: state.income - tax,
        rows: rows
      };
    }

    // --- Rendering ---
    var bracketRows = null;

    function buildBracketRows(rows) {
      shell.innerHTML = '';
      bracketRows = rows.map(function () {
        var row = document.createElement('div');
        row.className = 'bracket-row';
        row.innerHTML =
          '<span class="bracket-rate num"></span>' +
          '<span class="bracket-bar"><i></i></span>' +
          '<span class="bracket-amount num"></span>';
        shell.appendChild(row);
        return {
          el: row,
          rate: row.querySelector('.bracket-rate'),
          bar: row.querySelector('.bracket-bar i'),
          amount: row.querySelector('.bracket-amount')
        };
      });
    }

    var animFrame = null;
    var firstPaint = true;
    var shown = { tax: 0, taxable: 0, effective: 0, keep: 0 };

    function render() {
      var r = calculate();

      if (!bracketRows) buildBracketRows(r.rows);

      var peak = r.rows.reduce(function (m, row) { return Math.max(m, row.amount); }, 0);

      r.rows.forEach(function (row, i) {
        var node = bracketRows[i];
        var empty = row.amount <= 0;
        node.rate.textContent = Math.round(row.rate * 100) + '%';
        node.bar.style.setProperty('--w', (peak > 0 ? (row.amount / peak) * 100 : 0) + '%');
        node.amount.textContent = empty ? '—' : fmt(row.amount);
        node.el.classList.toggle('is-empty', empty);
        node.el.classList.toggle('is-marginal', !empty && row.rate === r.marginal);
      });

      // Donut: the gold arc is the share paid in tax
      var taxShare = state.income > 0 ? Math.min(r.tax / state.income, 1) : 0;
      arc.style.strokeDashoffset = ARC_LENGTH * (1 - taxShare);

      marginalOut.textContent = Math.round(r.marginal * 100) + '%';
      bracketNote.textContent = '2025 · ' + (state.status === 'single' ? 'Single' : 'Married jointly');

      // Explain a lever that is switched on but cannot bite, rather than
      // leaving the user staring at an unchanged number.
      var standard = STANDARD_DEDUCTION[state.status];
      if (state.levers.charity && !r.usedItemized) {
        leverHint.textContent = 'Charitable giving only lowers your bill if your itemised total clears the ' +
          fmt(standard) + ' standard deduction. Switch to “Itemised” to see the effect.';
        leverHint.hidden = false;
      } else {
        leverHint.hidden = true;
      }

      subOut.innerHTML = 'on ' + fmt(r.taxable) + ' taxable · ' +
        '<strong>' + fmt(r.takeHome) + '</strong> take-home' +
        (r.usedItemized ? ' · itemised' : '') +
        (r.qbi > 0 ? ' · QBI applied' : '');

      // Tween the headline figures
      var target = {
        tax: r.tax,
        taxable: r.taxable,
        effective: r.effective * 100,
        keep: (1 - taxShare) * 100
      };

      // Land on the real numbers immediately on first paint, then tween on changes.
      if (reduceMotion || firstPaint) {
        firstPaint = false;
        shown = target;
        paint(shown);
        return;
      }

      var from = { tax: shown.tax, taxable: shown.taxable, effective: shown.effective, keep: shown.keep };
      var start = null;
      var duration = 420;

      if (animFrame) cancelAnimationFrame(animFrame);

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        shown = {
          tax: from.tax + (target.tax - from.tax) * eased,
          taxable: from.taxable + (target.taxable - from.taxable) * eased,
          effective: from.effective + (target.effective - from.effective) * eased,
          keep: from.keep + (target.keep - from.keep) * eased
        };
        paint(shown);
        if (p < 1) animFrame = requestAnimationFrame(step);
      }
      animFrame = requestAnimationFrame(step);
    }

    function paint(v) {
      taxOut.textContent = fmt(v.tax);
      taxableOut.textContent = fmt(v.taxable);
      effectiveOut.textContent = v.effective.toFixed(1) + '%';
      keepOut.textContent = Math.round(v.keep) + '%';
    }

    // --- Control wiring ---
    // Hands the CSS a 0–1 progress value; the track gradient offsets it by half
    // a thumb so the fill edge lands exactly under the thumb's centre.
    function paintSlider(el) {
      var min = parseFloat(el.min) || 0;
      var max = parseFloat(el.max) || 100;
      var p = max > min ? (parseFloat(el.value) - min) / (max - min) : 0;
      el.style.setProperty('--p', Math.min(Math.max(p, 0), 1));
    }

    function setSegment(group, value) {
      var buttons = Array.prototype.slice.call(group.querySelectorAll('button'));
      buttons.forEach(function (b, i) {
        var on = b.dataset.value === value;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) group.style.setProperty('--seg-index', i);
      });
    }

    var grouped = new Intl.NumberFormat('en-US');

    function syncIncome(value, source) {
      state.income = Math.max(0, Math.min(value || 0, 2000000));
      // While the field has focus we leave the raw text alone so the caret stays put.
      if (source !== 'input') incomeInput.value = grouped.format(state.income);
      if (source !== 'range') incomeRange.value = Math.min(state.income, parseFloat(incomeRange.max));
      paintSlider(incomeRange);
      render();
    }

    incomeRange.addEventListener('input', function () {
      syncIncome(parseFloat(incomeRange.value), 'range');
    });

    incomeInput.addEventListener('input', function () {
      syncIncome(parseFloat(incomeInput.value.replace(/[^0-9]/g, '')), 'input');
    });

    incomeInput.addEventListener('focus', function () {
      incomeInput.value = state.income ? String(state.income) : '';
    });

    incomeInput.addEventListener('blur', function () {
      incomeInput.value = grouped.format(state.income);
    });

    retireRange.addEventListener('input', function () {
      state.retirement = parseFloat(retireRange.value) || 0;
      retireOut.textContent = fmt(state.retirement);
      paintSlider(retireRange);
      render();
    });

    itemizedInput.addEventListener('input', function () {
      state.itemized = Math.max(0, parseFloat(itemizedInput.value) || 0);
      render();
    });

    segStatus.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      state.status = btn.dataset.value;
      setSegment(segStatus, state.status);
      render();
    });

    segDeduction.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      state.deduction = btn.dataset.value;
      setSegment(segDeduction, state.deduction);
      itemizedWrap.hidden = state.deduction !== 'itemized';
      render();
    });

    levers.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var key = chip.dataset.lever;
      state.levers[key] = !state.levers[key];
      chip.setAttribute('aria-pressed', state.levers[key] ? 'true' : 'false');
      render();
    });

    resetBtn.addEventListener('click', function () {
      state = JSON.parse(JSON.stringify(DEFAULTS));
      incomeInput.value = grouped.format(state.income);
      incomeRange.value = state.income;
      retireRange.value = state.retirement;
      retireOut.textContent = fmt(state.retirement);
      itemizedInput.value = state.itemized;
      itemizedWrap.hidden = true;
      setSegment(segStatus, state.status);
      setSegment(segDeduction, state.deduction);
      levers.querySelectorAll('.chip').forEach(function (c) {
        c.setAttribute('aria-pressed', 'false');
      });
      paintSlider(incomeRange);
      paintSlider(retireRange);
      render();
    });

    // --- Initial paint ---
    setSegment(segStatus, state.status);
    setSegment(segDeduction, state.deduction);
    paintSlider(incomeRange);
    paintSlider(retireRange);
    retireOut.textContent = fmt(state.retirement);
    render();
  }
})();
