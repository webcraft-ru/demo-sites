// Общий скрипт демо-сайтов:
// 1) аккордеоны (плавное раскрытие + подгрузка фото только при открытии),
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
