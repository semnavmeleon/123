/**
 * Slide management — CSS scroll-snap based navigation with
 * scroll event detection for user-initiated scrolling.
 * Optimized for performance.
 */

let currentSlide = 0;
const TOTAL_SLIDES = 3;
const container = document.getElementById('slidesContainer');
let isScrollingToSlide = false; // Флаг: программная прокрутка
let scrollDebounceTimer = null;

// Detect if mobile/tablet (no snap scroll)
const isSmallScreen = () => window.innerWidth <= 1100;

/* ---- Scroll to a specific slide ---- */
function goToSlide(index) {
  if (index < 0 || index >= TOTAL_SLIDES || index === currentSlide) return;
  const target = document.getElementById('slide-' + index);
  if (!target) return;

  // Обновляем UI мгновенно
  setActiveSlide(index);

  // Блокируем detectSlideFromScroll во время анимации прокрутки
  isScrollingToSlide = true;
  clearTimeout(scrollDebounceTimer);

  target.scrollIntoView({ behavior: 'smooth' });

  // Разблокируем после завершения анимации
  scrollDebounceTimer = setTimeout(function() {
    isScrollingToSlide = false;
  }, 500);
}

/* ---- Update UI when active slide changes ---- */
function setActiveSlide(index) {
  if (index === currentSlide) return;
  currentSlide = index;

  // Dots
  const dots = document.querySelectorAll('.slide-dot');
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('active', i === index);
  }

  // Nav
  buildNav(index);

  // Scroll indicator
  const indicator = document.getElementById('scrollIndicator');
  if (indicator) {
    indicator.classList.toggle('hidden', index === TOTAL_SLIDES - 1);
  }

  // Toggle in-view class for animations — only on desktop
  if (!isSmallScreen()) {
    const slides = document.querySelectorAll('.slide');
    for (let i = 0; i < slides.length; i++) {
      slides[i].classList.toggle('in-view', i === index);
    }
  }
}

/* ---- Detect active slide from scroll position ---- */
let lastScrollTop = -1;

function detectSlideFromScroll() {
  if (isSmallScreen() || isScrollingToSlide) return;

  const scrollTop = container.scrollTop;
  if (Math.abs(scrollTop - lastScrollTop) < 2) return; // Skip tiny scrolls
  lastScrollTop = scrollTop;

  const viewportH = container.clientHeight;
  let best = 0;
  let bestOverlap = 0;

  for (let i = 0; i < TOTAL_SLIDES; i++) {
    const slide = document.getElementById('slide-' + i);
    if (!slide) continue;
    const top = slide.offsetTop;
    const bottom = top + slide.offsetHeight;
    const visibleTop = Math.max(top, scrollTop);
    const visibleBottom = Math.min(bottom, scrollTop + viewportH);
    const overlap = Math.max(0, visibleBottom - visibleTop);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = i;
    }
  }
  setActiveSlide(best);
}

/* ---- Init scroll observer for user-initiated scrolling ---- */
function initSlideObserver() {
  if (isSmallScreen()) return; // Skip on mobile

  let scrollTimeout;
  let ticking = false;

  function onScroll() {
    if (ticking || isScrollingToSlide) return;
    ticking = true;
    requestAnimationFrame(function() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function() {
        if (!isScrollingToSlide) {
          detectSlideFromScroll();
        }
        ticking = false;
      }, 80);
    });
  }

  container.addEventListener('scroll', onScroll, { passive: true });

  // Also detect on scrollend for browsers that support it
  container.addEventListener('scrollend', function() {
    if (!isScrollingToSlide) {
      detectSlideFromScroll();
    }
  }, { passive: true });
}

/* ---- Keyboard navigation (desktop only) ---- */
document.addEventListener('keydown', function(e) {
  if (isSmallScreen()) return; // Skip on mobile
  if (document.getElementById('calcModal')?.classList.contains('active') ||
      document.getElementById('callbackModal')?.classList.contains('active')) {
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    goToSlide(currentSlide + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    goToSlide(currentSlide - 1);
  }
});

/* ---- Handle screen resize ---- */
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function() {
    if (isSmallScreen()) {
      // Show all slides, disable snap
      container.style.scrollSnapType = 'none';
    } else {
      // Re-enable snap
      container.style.scrollSnapType = 'y mandatory';
    }
  }, 200);
}, { passive: true });
