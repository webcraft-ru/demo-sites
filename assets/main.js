// Общий скрипт демо-сайтов:
// 1) аккордеоны (сетка на компьютере, простой список на телефоне), фильтр каталога по разделам,
// 2) бейдж «Открыто до…», 3) плавающая кнопка звонка.
(function () {
  // ---------- 1. Аккордеоны ----------
  // Компьютер (≥ 768 px): аккордеоны сеткой, раскрытый занимает всю строку. Телефон (< 768 px): аккордеонов нет —
  // простой список разделов, все позиции сразу (как у меню-списка), фильтр сверху.
  var mobileMq = window.matchMedia('(max-width: 767px)');
  var isMobile = function () { return mobileMq.matches; };

  function loadImages(root) {
    root.querySelectorAll('img[data-src]').forEach(function (img) {
      img.addEventListener('load', function () { img.classList.add('is-loaded'); }, { once: true });
      img.addEventListener('error', function () { img.remove(); }, { once: true }); // остаётся градиент + иконка
      img.loading = 'lazy'; // на телефоне грузятся все разделы сразу — по мере прокрутки
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
  }

  var accs = document.querySelectorAll('[data-acc]');
  function setAcc(acc, open) {
    var btn = acc.querySelector('.acc__btn');
    if (open) loadImages(acc);
    acc.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    acc.querySelector('.acc__body').inert = !open;
  }
  // подстроить аккордеоны под ширину: телефон — всё открыто и не нажимается, компьютер — всё закрыто
  function syncAccs() {
    accs.forEach(function (acc) {
      var btn = acc.querySelector('.acc__btn');
      if (isMobile()) {
        setAcc(acc, true);
        btn.tabIndex = -1;
        btn.removeAttribute('aria-expanded');
      } else {
        btn.removeAttribute('tabindex');
        setAcc(acc, false);
      }
    });
  }
  accs.forEach(function (acc) {
    acc.querySelector('.acc__btn').addEventListener('click', function () {
      if (!isMobile()) setAcc(acc, !acc.classList.contains('is-open'));
    });
  });
  syncAccs();

  // ---------- 1а. Высота плашки демо (на узком экране она в 2 строки) — для липкой панели фильтра ----------
  var demoBar = document.querySelector('.demo-bar');
  var demoH = function () { return demoBar ? demoBar.offsetHeight : 0; };
  function setDemoH() { if (demoBar) document.documentElement.style.setProperty('--demo-h', demoH() + 'px'); }
  setDemoH();
  window.addEventListener('resize', setDemoH);

  // ---------- 1б. Фильтр каталога по разделам ----------
  // Телефон и меню-список: остаются только позиции выбранного раздела.
  // Компьютер + аккордеоны: все разделы на месте, выбранный раскрывается, ВСЕ остальные принудительно закрываются;
  // «Все» закрывает все.
  document.querySelectorAll('[data-filter]').forEach(function (bar) {
    var section = bar.closest('section');
    var anchor = section.querySelector('[data-filter-anchor]');
    var track = bar.querySelector('.filter__track');
    var chips = bar.querySelectorAll('[data-f]');
    var groups = section.querySelectorAll('[data-cat]');
    var isAcc = groups.length > 0 && groups[0].hasAttribute('data-acc');
    bar.hidden = false;

    function applyFilter(f) {
      var keepAll = isAcc && !isMobile();
      var target = null;
      groups.forEach(function (g) {
        var match = f === 'all' || g.getAttribute('data-cat') === f;
        g.hidden = keepAll ? false : !match;
        if (isAcc && !isMobile()) setAcc(g, f !== 'all' && match);
        if (f !== 'all' && match) target = g;
      });
      return keepAll ? target : null;
    }
    // при переходе через 768 px сбросить фильтр, чтобы ничего не осталось скрытым или раскрытым
    var onBreak = function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-f') === 'all')); });
      groups.forEach(function (g) { g.hidden = false; });
      syncAccs();
    };
    if (mobileMq.addEventListener) mobileMq.addEventListener('change', onBreak); else mobileMq.addListener(onBreak);

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-f');
        // панель уже прилипла (каталог прокручен) — после фильтрации вернуть начало каталога под панель
        var stuck = anchor.getBoundingClientRect().top < demoH() + 1;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var target = applyFilter(f);
        // выбранную кнопку — в центр полосы прокрутки
        if (track.scrollWidth > track.clientWidth) {
          track.scrollTo({ left: chip.offsetLeft - (track.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
        }
        if (target) window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - demoH() - 12, behavior: 'smooth' });
        else if (stuck) window.scrollTo({ top: window.scrollY + anchor.getBoundingClientRect().top - demoH(), behavior: 'smooth' });
      });
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
