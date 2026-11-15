// Общий скрипт демо-сайтов:
// 1) аккордеоны (плавное раскрытие + подгрузка фото только при открытии), фильтр каталога по разделам,
// 2) бейдж «Открыто до…», 3) плавающая кнопка звонка.
(function () {
  // ---------- 1. Аккордеоны ----------
  function loadImages(root) {
    root.querySelectorAll('img[data-src]').forEach(function (img) {
      img.addEventListener('load', function () { img.classList.add('is-loaded'); }, { once: true });
      img.addEventListener('error', function () { img.remove(); }, { once: true }); // остаётся градиент + иконка
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
  }

  document.querySelectorAll('[data-acc]').forEach(function (acc) {
    var btn = acc.querySelector('.acc__btn');
    var body = acc.querySelector('.acc__body');
    body.inert = true;
    btn.addEventListener('click', function () {
      var open = !acc.classList.contains('is-open');
      if (open) loadImages(acc);
      acc.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      body.inert = !open;
    });
  });

  // ---------- 1а. Высота плашки демо (на узком экране она в 2 строки) — для липкой панели фильтра ----------
  var demoBar = document.querySelector('.demo-bar');
  var demoH = function () { return demoBar ? demoBar.offsetHeight : 0; };
  function setDemoH() { if (demoBar) document.documentElement.style.setProperty('--demo-h', demoH() + 'px'); }
  setDemoH();
  window.addEventListener('resize', setDemoH);

  // ---------- 1б. Фильтр каталога по разделам ----------
  document.querySelectorAll('[data-filter]').forEach(function (bar) {
    var section = bar.closest('section');
    var anchor = section.querySelector('[data-filter-anchor]');
    var track = bar.querySelector('.filter__track');
    var chips = bar.querySelectorAll('[data-f]');
    var groups = section.querySelectorAll('[data-cat]');
    bar.hidden = false;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-f');
        // панель уже прилипла (каталог прокручен) — после фильтрации вернуть начало каталога под панель
        var stuck = anchor.getBoundingClientRect().top < demoH() + 1;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        groups.forEach(function (g) {
          var show = f === 'all' || g.getAttribute('data-cat') === f;
          g.hidden = !show;
          // аккордеон: выбранный раздел сразу раскрываем
          if (show && f !== 'all' && g.hasAttribute('data-acc') && !g.classList.contains('is-open')) g.querySelector('.acc__btn').click();
        });
        // выбранную кнопку — в центр полосы прокрутки
        if (track.scrollWidth > track.clientWidth) {
          track.scrollTo({ left: chip.offsetLeft - (track.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
        }
        if (stuck) window.scrollTo({ top: window.scrollY + anchor.getBoundingClientRect().top - demoH(), behavior: 'smooth' });
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
