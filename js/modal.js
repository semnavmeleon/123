/**
 * Calculator modal — пошаговый квиз (3 шага)
 */

let calcCurrentStep = 1;
let calcAutoDistance = 0;
let calcFromCoords = null;
let calcToCoords = null;

const calcStepLabels = {
  1: 'Шаг 1 из 3 — Маршрут',
  2: 'Шаг 2 из 3 — Груз',
  3: 'Результат'
};

/* ---- Custom cargo select ---- */
function toggleCargoSelect() {
  const select = document.getElementById('cargoSelect');
  const trigger = select.querySelector('.custom-select-trigger');
  const options = document.getElementById('cargoOptions');
  trigger.classList.toggle('active');
  options.classList.toggle('open');
}

function selectCargo(el) {
  const value = el.getAttribute('data-value');
  const text = el.textContent;
  document.getElementById('calcCargo').value = value;
  document.getElementById('cargoSelectValue').textContent = text;
  document.getElementById('cargoSelectValue').style.color = 'var(--text-primary)';

  // Mark selected
  document.querySelectorAll('.custom-option').forEach(function(opt) {
    opt.classList.remove('selected');
  });
  el.classList.add('selected');

  // Close
  document.getElementById('cargoOptions').classList.remove('open');
  document.getElementById('cargoSelect').querySelector('.custom-select-trigger').classList.remove('active');
}

// Close on outside click
document.addEventListener('click', function(e) {
  const select = document.getElementById('cargoSelect');
  if (select && !select.contains(e.target)) {
    document.getElementById('cargoOptions').classList.remove('open');
    select.querySelector('.custom-select-trigger').classList.remove('active');
  }
});

/* ---- City autocomplete using local database ---- */
function initCityAutocomplete(inputId, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const suggestionsBox = document.createElement('div');
  suggestionsBox.className = 'calc-suggestions';
  input.parentElement.style.position = 'relative';
  input.parentElement.appendChild(suggestionsBox);

  let currentIndex = -1;
  let currentMatches = [];

  input.addEventListener('input', function() {
    const query = input.value.trim().toLowerCase().replace(/ё/g, 'е');
    currentIndex = -1;

    if (query.length < 2) {
      suggestionsBox.innerHTML = '';
      suggestionsBox.style.display = 'none';
      return;
    }

    // Find matches
    currentMatches = [];
    for (const city in CITY_COORDS) {
      const cityNorm = city.toLowerCase().replace(/ё/g, 'е');
      if (cityNorm.includes(query) || query.includes(cityNorm)) {
        currentMatches.push(city);
      }
      if (currentMatches.length >= 10) break;
    }

    if (currentMatches.length === 0) {
      suggestionsBox.innerHTML = '<div class="calc-suggestion-item calc-suggestion-empty">Ничего не найдено</div>';
      suggestionsBox.style.display = 'block';
      return;
    }

    suggestionsBox.innerHTML = currentMatches.map(function(city, i) {
      return '<div class="calc-suggestion-item" data-index="' + i + '">' + city + '</div>';
    }).join('');
    suggestionsBox.style.display = 'block';
  });

  // Click on suggestion
  suggestionsBox.addEventListener('click', function(e) {
    const item = e.target.closest('.calc-suggestion-item');
    if (!item || item.classList.contains('calc-suggestion-empty')) return;
    const idx = parseInt(item.getAttribute('data-index'));
    if (currentMatches[idx]) {
      input.value = currentMatches[idx];
      suggestionsBox.style.display = 'none';
      if (CITY_COORDS[currentMatches[idx]]) {
        onSelect(currentMatches[idx], CITY_COORDS[currentMatches[idx]]);
      }
    }
  });

  // Keyboard navigation
  input.addEventListener('keydown', function(e) {
    const items = suggestionsBox.querySelectorAll('.calc-suggestion-item:not(.calc-suggestion-empty)');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentIndex = Math.min(currentIndex + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentIndex = Math.max(currentIndex - 1, 0);
      updateHighlight(items);
    } else if (e.key === 'Enter' && currentIndex >= 0) {
      e.preventDefault();
      items[currentIndex].click();
    } else if (e.key === 'Escape') {
      suggestionsBox.style.display = 'none';
    }
  });

  function updateHighlight(items) {
    items.forEach(function(item, i) {
      item.classList.toggle('highlight', i === currentIndex);
    });
  }

  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!input.parentElement.contains(e.target)) {
      suggestionsBox.style.display = 'none';
    }
  });
}

/* ---- Haversine distance ---- */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/* ---- Auto-calculate distance ---- */
function autoCalcDistance() {
  const hint = document.getElementById('calcDistanceHint');

  if (calcFromCoords && calcToCoords) {
    const dist = haversine(calcFromCoords[0], calcFromCoords[1], calcToCoords[0], calcToCoords[1]);
    calcAutoDistance = Math.round(dist * 1.3);
    hint.textContent = 'Расстояние: ~' + calcAutoDistance + ' км (автодорога)';
    hint.style.color = 'var(--accent)';
  } else if (!calcFromCoords && !calcToCoords) {
    hint.textContent = 'Введите оба города для расчёта расстояния';
    hint.style.color = 'var(--text-muted)';
    calcAutoDistance = 0;
  } else {
    hint.textContent = 'Выберите город из подсказок';
    hint.style.color = 'var(--text-muted)';
    calcAutoDistance = 0;
  }
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', function() {
  // City autocomplete with local database
  initCityAutocomplete('calcFrom', function(city, coords) {
    calcFromCoords = coords;
    autoCalcDistance();
  });

  initCityAutocomplete('calcTo', function(city, coords) {
    calcToCoords = coords;
    autoCalcDistance();
  });

  // Volume auto-calc
  ['calcLength', 'calcWidth', 'calcHeight'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function() {
        var l = parseFloat(document.getElementById('calcLength').value) || 0;
        var w = parseFloat(document.getElementById('calcWidth').value) || 0;
        var h = parseFloat(document.getElementById('calcHeight').value) || 0;
        var vol = (l * w * h) / 1000000;
        document.getElementById('calcVolume').textContent = vol > 0 ? 'Объём: ' + vol.toFixed(3) + ' м³' : 'Объём: — м³';
      });
    }
  });

  // Phone mask for all phone inputs
  var phoneInputs = [
    document.getElementById('cbPhone'),
    document.getElementById('contactPhone')
  ];

  phoneInputs.forEach(function(input) {
    if (input) {
      input.addEventListener('input', function(e) {
        var x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
        if (!x[2]) {
          e.target.value = x[1] ? '+7' : '';
        } else {
          e.target.value = '+7 (' + x[2] + (x[3] ? ') ' + x[3] : '') + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
        }
      });

      // Format on focus loss - don't clear incomplete phone, just leave as is
      input.addEventListener('blur', function(e) {
        var digits = e.target.value.replace(/\D/g, '');
        // Only clear if it's obviously invalid (starts with +7 but has less than 3 digits after)
        if (digits.length > 0 && digits.length < 4 && e.target.value.startsWith('+7')) {
          // User started typing but didn't continue - keep it for better UX
          // e.target.value = '';
        }
      });
    }
  });
});

/* ---- Calculator open/close ---- */
function openCalculator() {
  document.getElementById('calcModal').classList.add('active');
}

function closeCalculator() {
  document.getElementById('calcModal').classList.remove('active');
  resetCalc();
}

function resetCalc() {
  calcCurrentStep = 1;
  calcAutoDistance = 0;
  calcFromCoords = null;
  calcToCoords = null;
  document.querySelectorAll('.calc-step').forEach(function(s) { s.classList.remove('active'); });
  document.querySelector('.calc-step[data-step="1"]').classList.add('active');
  document.getElementById('calcStepLabel').textContent = calcStepLabels[1];

  document.querySelectorAll('.calc-step-dot').forEach(function(dot, i) {
    dot.classList.toggle('active', i === 0);
    dot.classList.remove('done');
  });

  document.getElementById('calcFrom').value = '';
  document.getElementById('calcTo').value = '';
  document.getElementById('calcCargo').value = '';
  document.getElementById('calcWeight').value = '';
  document.getElementById('calcLength').value = '';
  document.getElementById('calcWidth').value = '';
  document.getElementById('calcHeight').value = '';
  document.getElementById('calcVolume').textContent = 'Объём: — м³';
  document.getElementById('calcDistanceHint').textContent = 'Введите оба города для расчёта расстояния';
  document.getElementById('calcDistanceHint').style.color = 'var(--text-muted)';

  // Reset custom select
  document.getElementById('cargoSelectValue').textContent = 'Тип груза';
  document.getElementById('cargoSelectValue').style.color = 'var(--text-muted)';
  document.querySelectorAll('.custom-option').forEach(function(opt) { opt.classList.remove('selected'); });
  document.getElementById('cargoOptions').classList.remove('open');
  document.getElementById('cargoSelect').querySelector('.custom-select-trigger').classList.remove('active');
}

/* ---- Navigation ---- */
function calcNext(step) {
  if (calcCurrentStep === 1) {
    var from = document.getElementById('calcFrom').value.trim();
    var to = document.getElementById('calcTo').value.trim();
    if (!from || !to) {
      showToast('Укажите города отправления и назначения');
      return;
    }
    if (!calcFromCoords || !calcToCoords) {
      showToast('Выберите города из подсказок для расчёта расстояния');
      return;
    }
  }
  if (calcCurrentStep === 2) {
    const cargo = document.getElementById('calcCargo').value;
    const weight = document.getElementById('calcWeight').value;
    if (!cargo || !weight) {
      showToast('Укажите тип груза и вес');
      return;
    }
  }

  // Switch step
  document.querySelectorAll('.calc-step').forEach(s => s.classList.remove('active'));
  document.querySelector('.calc-step[data-step="' + step + '"]').classList.add('active');

  // Update dots
  document.querySelectorAll('.calc-step-dot').forEach((dot, i) => {
    if (i < step - 1) {
      dot.classList.add('done');
      dot.classList.remove('active');
    } else if (i === step - 1) {
      dot.classList.add('active');
      dot.classList.remove('done');
    } else {
      dot.classList.remove('active', 'done');
    }
  });

  document.getElementById('calcStepLabel').textContent = calcStepLabels[step];
  calcCurrentStep = step;
}

function calcPrev(step) {
  document.querySelectorAll('.calc-step').forEach(s => s.classList.remove('active'));
  document.querySelector('.calc-step[data-step="' + step + '"]').classList.add('active');

  document.querySelectorAll('.calc-step-dot').forEach((dot, i) => {
    if (i < step - 1) {
      dot.classList.add('done');
      dot.classList.remove('active');
    } else if (i === step - 1) {
      dot.classList.add('active');
      dot.classList.remove('done');
    } else {
      dot.classList.remove('active', 'done');
    }
  });

  document.getElementById('calcStepLabel').textContent = calcStepLabels[step];
  calcCurrentStep = step;
}

/* ---- Volume auto-calc ---- */
document.addEventListener('DOMContentLoaded', function() {
  ['calcLength', 'calcWidth', 'calcHeight'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function() {
        const l = parseFloat(document.getElementById('calcLength').value) || 0;
        const w = parseFloat(document.getElementById('calcWidth').value) || 0;
        const h = parseFloat(document.getElementById('calcHeight').value) || 0;
        const vol = (l * w * h) / 1000000; // см³ → м³
        if (vol > 0) {
          document.getElementById('calcVolume').textContent = 'Объём: ' + vol.toFixed(3) + ' м³';
        } else {
          document.getElementById('calcVolume').textContent = 'Объём: — м³';
        }
      });
    }
  });
});

/* ---- Submit calculation ---- */
function submitCalc() {
  var from     = document.getElementById('calcFrom').value.trim();
  var to       = document.getElementById('calcTo').value.trim();
  var cargo    = document.getElementById('calcCargo').value;
  var weight   = parseFloat(document.getElementById('calcWeight').value) || 0;
  var distance = calcAutoDistance;

  if (!from || !to) {
    showToast('Укажите города');
    return;
  }
  if (!cargo || !weight) {
    showToast('Заполните тип груза и вес');
    return;
  }

  var baseRate = 35;
  var cargoMultipliers = {
    standard: 1.0, oversized: 1.8, dangerous: 2.2, fragile: 1.5, bulk: 0.9
  };
  var cargoNames = {
    standard: 'Стандартный', oversized: 'Негабаритный', dangerous: 'Опасный', fragile: 'Хрупкий', bulk: 'Навалочный'
  };

  var multiplier = cargoMultipliers[cargo] || 1.0;
  var basePrice = baseRate * (distance || 500) * multiplier;
  if (weight > 500) basePrice += (weight - 500) * 2;
  basePrice = Math.max(basePrice, 5000);

  var priceMin = Math.round(basePrice * 0.85 / 100) * 100;
  var priceMax = Math.round(basePrice * 1.15 / 100) * 100;

  var detailsHTML = '';
  detailsHTML += '<strong>Маршрут:</strong> ' + from + ' → ' + to + '<br>';
  detailsHTML += '<strong>Расстояние:</strong> ~' + distance + ' км<br>';
  detailsHTML += '<strong>Груз:</strong> ' + (cargoNames[cargo] || cargo) + ', ' + weight + ' кг';

  var l = parseFloat(document.getElementById('calcLength').value) || 0;
  var w = parseFloat(document.getElementById('calcWidth').value) || 0;
  var h = parseFloat(document.getElementById('calcHeight').value) || 0;
  var vol = (l * w * h) / 1000000;
  if (vol > 0) detailsHTML += ', объём ' + vol.toFixed(2) + ' м³';

  document.getElementById('calcPriceMin').textContent = priceMin.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('calcPriceMax').textContent = priceMax.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('calcDetails').innerHTML = detailsHTML;

  calcNext(3);
}

// Close modal on overlay click
document.getElementById('calcModal')?.addEventListener('click', function (e) {
  if (e.target === this) closeCalculator();
});

/* ---- Callback ---- */
function openCallback() {
  document.getElementById('callbackModal').classList.add('active');
}

function closeCallback() {
  document.getElementById('callbackModal').classList.remove('active');
}

function submitCallback() {
  var name  = document.getElementById('cbName').value.trim();
  var phone = document.getElementById('cbPhone').value.trim();

  // Валидация имени
  if (!name || name.length < 2) {
    showToast('Введите имя (минимум 2 буквы)');
    return;
  }

  // Валидация телефона — минимум 10 цифр
  var phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    showToast('Введите корректный номер телефона');
    return;
  }

  // TODO: здесь можно добавить fetch для отправки на сервер
  // fetch('/api/callback', { method: 'POST', body: JSON.stringify({ name, phone }) })

  closeCallback();
  showToast('Спасибо, ' + name + '! Мы перезвоним вам в ближайшее время.');
}

// Close callback modal on overlay click
document.getElementById('callbackModal')?.addEventListener('click', function (e) {
  if (e.target === this) closeCallback();
});

/* ---- Contact form ---- */
function submitContact() {
  var name  = document.getElementById('contactName').value.trim();
  var phone = document.getElementById('contactPhone').value.trim();

  // Валидация имени
  if (!name || name.length < 2) {
    showToast('Введите имя (минимум 2 буквы)');
    return;
  }

  // Валидация телефона — минимум 10 цифр
  var phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    showToast('Введите корректный номер телефона');
    return;
  }

  // TODO: здесь можно добавить fetch для отправки на сервер
  // fetch('/api/callback', { method: 'POST', body: JSON.stringify({ name, phone }) })

  showToast('Спасибо, ' + name + '! Мы перезвоним вам в ближайшее время.');
}

/* ---- Toast ---- */
let _toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').textContent = message;
  toast.classList.add('show');
  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ---- Escape key ---- */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('callbackModal')?.classList.contains('active')) closeCallback();
    if (document.getElementById('calcModal')?.classList.contains('active')) closeCalculator();
  }
});
