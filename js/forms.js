/**
 * Отправка заявок через FormSubmit, фокус в модалках, Яндекс.Метрика после согласия с cookie.
 */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var email = cfg.formSubmitEmail || 'donbasscargo@mail.ru';
  var ymId = (cfg.yandexMetrikaId || '').replace(/\D/g, '');

  function formSubmitUrl() {
    return 'https://formsubmit.co/ajax/' + encodeURIComponent(email);
  }

  function sendLead(payload) {
    return fetch(formSubmitUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(
        Object.assign(
          {
            _subject: 'Заявка с donbasscargo.ru',
            _template: 'table',
            _captcha: 'false'
          },
          payload
        )
      )
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
    });
  }

  function validateNamePhone(name, phone) {
    if (!name || name.length < 2) {
      showToast('Введите имя (минимум 2 буквы)');
      return false;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      showToast('Введите корректный номер телефона');
      return false;
    }
    return true;
  }

  function submitCallbackImpl() {
    if (!document.getElementById('cbConsent').checked) {
      showToast('Необходимо согласие с политикой конфиденциальности');
      return;
    }
    var name = document.getElementById('cbName').value.trim();
    var phone = document.getElementById('cbPhone').value.trim();
    var em = document.getElementById('cbEmail').value.trim();
    if (!validateNamePhone(name, phone)) return;

    sendLead({
      _subject: 'Обратный звонок (модальное окно) — donbasscargo.ru',
      name: name,
      phone: phone,
      email: em,
      form: 'callback_modal'
    })
      .then(function () {
        closeCallback();
        showToast('Спасибо, ' + name + '! Мы перезвоним вам в ближайшее время.');
        document.getElementById('cbName').value = '';
        document.getElementById('cbPhone').value = '';
        document.getElementById('cbEmail').value = '';
      })
      .catch(function () {
        showToast(
          'Не удалось отправить заявку. Напишите на ' + email + ' или попробуйте позже.'
        );
      });
  }

  function submitContactImpl() {
    if (!document.getElementById('contactConsent').checked) {
      showToast('Необходимо согласие с политикой конфиденциальности');
      return;
    }
    var name = document.getElementById('contactName').value.trim();
    var phone = document.getElementById('contactPhone').value.trim();
    var em = document.getElementById('contactEmail').value.trim();
    if (!validateNamePhone(name, phone)) return;

    sendLead({
      _subject: 'Обратный звонок (форма контактов) — donbasscargo.ru',
      name: name,
      phone: phone,
      email: em,
      form: 'contacts_section'
    })
      .then(function () {
        showToast('Спасибо, ' + name + '! Мы перезвоним вам в ближайшее время.');
        document.getElementById('contactName').value = '';
        document.getElementById('contactPhone').value = '';
        document.getElementById('contactEmail').value = '';
      })
      .catch(function () {
        showToast(
          'Не удалось отправить заявку. Напишите на ' + email + ' или попробуйте позже.'
        );
      });
  }

  window.submitCallback = submitCallbackImpl;
  window.submitContact = submitContactImpl;

  document.addEventListener('DOMContentLoaded', function () {
    var _openCb = window.openCallback;
    if (typeof _openCb === 'function') {
      window.openCallback = function () {
        _openCb();
        var n = document.getElementById('cbName');
        if (n) setTimeout(function () { n.focus(); }, 80);
      };
    }
    var _openCalc = window.openCalculator;
    if (typeof _openCalc === 'function') {
      window.openCalculator = function () {
        _openCalc();
        var c = document.getElementById('calcFrom');
        if (c) setTimeout(function () { c.focus(); }, 80);
      };
    }
  });

  window.loadYandexMetrika = function () {
    if (!ymId || window._ymMetrikaLoaded) return;
    window._ymMetrikaLoaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(ymId, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
  };

  var _acceptCookiesOrig = window.acceptCookies;
  window.acceptCookies = function () {
    if (typeof _acceptCookiesOrig === 'function') _acceptCookiesOrig();
    window.loadYandexMetrika();
  };

  window.declineCookies = function () {
    try { localStorage.setItem('cookiesAccepted', '0'); } catch (e) {}
    var b = document.getElementById('cookieBanner');
    if (b) b.classList.add('hidden');
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('cookiesAccepted') === '1') {
      window.loadYandexMetrika();
    }
  });
})();
