(function () {
  'use strict';

  function runActions(actions, el) {
    actions.split(',').forEach(function (name) {
      name = name.trim();
      if (!name) return;
      var fn = window[name];
      if (typeof fn !== 'function') return;
      if (name === 'selectCargo') { fn(el); return; }
      var arg = el.getAttribute('data-arg');
      if (arg !== null && arg !== '') {
        var num = Number(arg);
        fn(isNaN(num) ? arg : num);
      } else {
        fn();
      }
    });
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.tagName === 'A') e.preventDefault();
    runActions(el.getAttribute('data-action'), el);
  });

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-submit]');
    if (!form) return;
    e.preventDefault();
    var fn = window[form.getAttribute('data-submit')];
    if (typeof fn === 'function') fn();
  });

  window.goToNextSlide = function () {
    var dots = document.querySelectorAll('.slide-dot');
    for (var i = 0; i < dots.length; i++) {
      if (dots[i].classList.contains('active')) {
        if (typeof window.goToSlide === 'function') {
          window.goToSlide(Math.min(i + 1, dots.length - 1));
        }
        return;
      }
    }
  };

  window.showToastVK = function () { if (window.showToast) window.showToast('Переход в ВКонтакте...'); };
  window.showToastTG = function () { if (window.showToast) window.showToast('Переход в Telegram...'); };
  window.showToastWA = function () { if (window.showToast) window.showToast('Переход в WhatsApp...'); };
  window.showToastVKShort = function () { if (window.showToast) window.showToast('ВКонтакте'); };
  window.showToastTGShort = function () { if (window.showToast) window.showToast('Telegram'); };
  window.showToastWAShort = function () { if (window.showToast) window.showToast('WhatsApp'); };

  window.closeCalcAndCallback = function () {
    if (window.closeCalculator) window.closeCalculator();
    if (window.openCallback) window.openCallback();
  };

  document.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el.tagName === 'IMG' && el.hasAttribute('data-hide-on-error')) {
      el.style.display = 'none';
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.buildNav === 'function') window.buildNav(0);
    if (typeof window.initSlideObserver === 'function') window.initSlideObserver();

    try {
      if (!localStorage.getItem('cookiesAccepted')) {
        var b = document.getElementById('cookieBanner');
        if (b) b.classList.remove('hidden');
      }
    } catch (e) {}
  });
})();
