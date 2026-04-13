/**
 * Navigation — builds the pill nav bar and highlights the active item.
 */

const NAV_LABELS = [
  ['Главная', 'Услуги', 'Контакты'],
  ['Главная', 'Услуги', 'Контакты'],
  ['Главная', 'Услуги', 'Контакты']
];

const NAV_TARGETS = [0, 1, 2]; // slide index each button scrolls to

function buildNav(activeSlide) {
  const pill = document.getElementById('navPill');
  if (!pill) return;
  const labels = NAV_LABELS[activeSlide] || NAV_LABELS[0];
  pill.innerHTML = '';
  labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn' + (i === activeSlide ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => goToSlide(NAV_TARGETS[i]));
    pill.appendChild(btn);
  });
}
