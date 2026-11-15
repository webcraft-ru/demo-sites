// Общий скрипт демо-сайтов:
// 1) кофейни — липкая лента разделов меню со scrollspy, 1в) автосервисы — лента категорий и сетка услуг,
// 2) бейдж «Открыто до…», 3) плавающая кнопка звонка.
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduceMotion ? 'auto' : 'smooth';

  // ---------- 1. Высота плашки демо (на узком экране она в 2 строки) — для липкой ленты ----------
  var demoBar = document.querySelector('.demo-bar');
  var demoH = function () { return demoBar ? demoBar.offsetHeight : 0; };
  function setDemoH() { if (demoBar) root.style.setProperty('--demo-h', demoH() + 'px'); }
  setDemoH();
  window.addEventListener('resize', setDemoH);

  // ---------- 1а. Горизонтальная лента: стрелки на компьютере, состояние «в начале / в конце» ----------
  function hscroll(box) {
    var track = box.querySelector('[data-hs-track]');
    var prev = box.querySelector('[data-hs-prev]');
    var next = box.querySelector('[data-hs-next]');
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      box.classList.toggle('hs-none', max <= 2);
      box.classList.toggle('hs-start', track.scrollLeft <= 2);
      box.classList.toggle('hs-end', track.scrollLeft >= max - 2);
    }
    function step(dir) { track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: behavior }); }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return { track: track, update: update };
  }
  // показать элемент внутри ленты (по центру), не двигая саму страницу
  function reveal(track, el, smooth) {
    if (track.scrollWidth <= track.clientWidth) return;
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2, behavior: smooth ? behavior : 'auto' });
  }

  // ---------- 1б. Кофейни: меню сплошным списком, липкая лента разделов (scrollspy) ----------
  // Нажатие — плавная прокрутка к началу раздела; при прокрутке подсвечивается раздел, который сейчас на экране.
  document.querySelectorAll('[data-spy]').forEach(function (bar) {
    var section = bar.closest('section');
    var hs = hscroll(bar);
    var links = [].slice.call(bar.querySelectorAll('[data-spy-link]'));
    var groups = links.map(function (a) { return section.querySelector('[data-spy-group="' + a.getAttribute('data-spy-link') + '"]'); });
    bar.hidden = false;
    hs.update();

    var current = -1, locked = false, unlockTimer = 0, ticking = false;
    var offset = function () { return demoH() + bar.offsetHeight; };
    function setActive(i, smooth) {
      if (i === current) return;
      current = i;
      links.forEach(function (a, k) {
        a.classList.toggle('is-active', k === i);
        if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      if (i >= 0) reveal(hs.track, links[i], smooth);
    }
    // активный раздел — последний, чей заголовок поднялся выше линии чуть ниже ленты
    function spy() {
      ticking = false;
      var top = bar.getBoundingClientRect().top;
      bar.classList.toggle('is-stuck', section.getBoundingClientRect().top < demoH() && top <= demoH() + 1);
      if (locked) return;
      var line = offset() + Math.min(140, window.innerHeight * 0.25);
      var idx = 0;
      for (var k = 0; k < groups.length; k++) {
        if (groups[k].getBoundingClientRect().top <= line) idx = k; else break;
      }
      setActive(idx, true);
    }
    function unlock() { locked = false; spy(); }
    window.addEventListener('scroll', function () {
      if (locked) { clearTimeout(unlockTimer); unlockTimer = setTimeout(unlock, 160); } // прокрутка после нажатия закончилась
      if (!ticking) { ticking = true; setTimeout(spy, 40); }
    }, { passive: true });
    window.addEventListener('resize', function () { hs.update(); spy(); });

    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        // пока страница едет к разделу, подсветка не прыгает по промежуточным разделам
        locked = true;
        clearTimeout(unlockTimer);
        unlockTimer = setTimeout(unlock, 1500);
        setActive(i, true);
        window.scrollTo({ top: window.scrollY + groups[i].getBoundingClientRect().top - offset() - 10, behavior: behavior });
      });
    });
    spy();
  });

  // ---------- 1в. Автосервисы: лента категорий → сетка услуг ----------
  // Нажатие на категорию открывает под лентой её сетку; «Назад» — снова только лента.
  // Под сеткой — та же лента без открытой категории (прошлая открытая возвращается в неё).
  document.querySelectorAll('[data-svc]').forEach(function (sec) {
    sec.classList.add('is-ready');
    var top = sec.querySelector('[data-rail="top"]');
    var bottom = sec.querySelector('[data-rail="bottom"]');
    var hsTop = hscroll(top), hsBottom = hscroll(bottom);
    var topCards = top.querySelectorAll('[data-open]');
    var bottomCards = bottom.querySelectorAll('[data-open]');
    var groups = sec.querySelectorAll('[data-group]');
    var panel = sec.querySelector('[data-panel]');
    var back = sec.querySelector('[data-back]');
    var more = sec.querySelector('[data-more]');
    var active = -1;

    var scrollToEl = function (el, gap) {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - demoH() - gap, behavior: behavior });
    };
    function open(i) {
      active = i;
      groups.forEach(function (g) { g.classList.toggle('is-active', +g.getAttribute('data-group') === i); });
      topCards.forEach(function (c) { c.setAttribute('aria-pressed', String(+c.getAttribute('data-open') === i)); });
      bottomCards.forEach(function (c) { c.hidden = +c.getAttribute('data-open') === i; });
      back.hidden = i < 0;
      more.hidden = i < 0;
      hsTop.update();
      hsBottom.update();
      if (i >= 0) reveal(hsTop.track, topCards[i], true);
    }
    topCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var i = +card.getAttribute('data-open');
        if (i === active) return;
        open(i);
        // сетка открылась ниже экрана — подтянуть её начало
        var y = panel.getBoundingClientRect().top;
        if (y > window.innerHeight * 0.6) scrollToEl(panel, 8);
      });
    });
    bottomCards.forEach(function (card) {
      card.addEventListener('click', function () {
        open(+card.getAttribute('data-open'));
        hsBottom.track.scrollTo({ left: 0 });
        scrollToEl(panel, 8); // новая сетка — с начала, без прокрутки наверх вручную
      });
    });
    back.addEventListener('click', function () {
      var was = active;
      open(-1);
      scrollToEl(top, 70);
      if (was >= 0) topCards[was].focus({ preventScroll: true });
    });
    // фото не загрузилось — остаётся градиент с эмодзи
    sec.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () { img.remove(); }, { once: true });
    });
  });

  // ---------- 2. Бейдж «Открыто до…» ----------
  var DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  var toMin = function (s) { var a = s.split(':'); return +a[0] * 60 + +a[1]; };

  function nowIn(tz) {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz || 'Europe/Moscow', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    return {
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')),
      minutes: +get('hour') * 60 + +get('minute')
    };
  }

  function status(hours) {
    var week = hours.week, n = nowIn(hours.timezone), today = week[n.day];
    if (today) {
      if (n.minutes >= toMin(today[0]) && n.minutes < toMin(today[1])) return { open: true, text: 'Открыто до ' + today[1] };
      if (n.minutes < toMin(today[0])) return { open: false, text: 'Закрыто · откроется сегодня в ' + today[0] };
    }
    for (var i = 1; i <= 7; i++) {
      var d = (n.day + i) % 7;
      if (week[d]) return { open: false, text: 'Закрыто · откроется ' + (i === 1 ? 'завтра' : 'в ' + DAYS[d]) + ' в ' + week[d][0] };
    }
    return null;
  }

  var badge = document.querySelector('[data-open-badge]');
  if (badge && window.BIZ_HOURS && window.BIZ_HOURS.week) {
    try {
      var s = status(window.BIZ_HOURS);
      if (s) {
        badge.textContent = s.text;
        badge.classList.add(s.open ? 'is-open' : 'is-closed');
        badge.hidden = false;
      }
    } catch (e) { /* старый браузер без часовых поясов — просто без бейджа */ }
  }

  // ---------- 3. Плавающая кнопка звонка ----------
  var fab = document.querySelector('[data-fab]');
  var hero = document.querySelector('.hero');
  if (fab && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      fab.classList.toggle('is-visible', !e[0].isIntersecting);
    }).observe(hero);
  } else if (fab) {
    fab.classList.add('is-visible');
  }
})();
