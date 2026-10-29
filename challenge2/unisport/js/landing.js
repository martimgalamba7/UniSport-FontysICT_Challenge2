/* ==========================================================================
   TAILWIND THEME CONFIGURATION
   ========================================================================== */

if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          display: ['Syne', 'Plus Jakarta Sans', 'sans-serif'],
          sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        },
        colors: {
          brand: {
            orange: '#FF4D00',
            'orange-hover': '#EA4500',
            'orange-light': '#FFF1EB',
            cream: '#FAFAF8',
            warm: '#F4F2EC',
            card: '#FFFFFF',
            dark: '#111113',
          }
        },
        screens: {
          '3xl': '1920px',
          '4xl': '2560px',
        }
      }
    }
  };
}

/* ==========================================================================
   LANDING PAGE INTERACTION CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  /* --- Scroll Direction & Parallax Motion --- */
  let lastScrollY = window.pageYOffset;
  let scrollDirection = 'down';

  window.addEventListener('scroll', () => {
    const currentY = window.pageYOffset;
    scrollDirection = currentY >= lastScrollY ? 'down' : 'up';
    lastScrollY = currentY;
  }, { passive: true });

  const parallaxWrappers = document.querySelectorAll('.sport-parallax-icon-wrapper[data-parallax-speed]');
  const reactiveCards = document.querySelectorAll('.card-hover');

  function updateScrollMotion() {
    const vh = window.innerHeight;

    parallaxWrappers.forEach(wrap => {
      const speed = parseFloat(wrap.dataset.parallaxSpeed) || 0.15;
      const rotSpeed = parseFloat(wrap.dataset.parallaxRotate) || 0.04;
      const parent = wrap.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();

      const distFromCenter = (rect.top + rect.height / 2) - (vh / 2);
      const translateY = -distFromCenter * speed;
      const rotate = -distFromCenter * rotSpeed;

      wrap.style.setProperty('--scroll-ty', `${translateY.toFixed(1)}px`);
      wrap.style.setProperty('--scroll-rot', `${rotate.toFixed(1)}deg`);
    });

    reactiveCards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) {
        const dist = (rect.top + rect.height / 2) - (vh / 2);
        const factor = (idx % 2 === 0 ? 0.025 : -0.025);
        const driftY = -dist * factor;
        card.style.setProperty('--scroll-drift', `${driftY.toFixed(1)}px`);
      }
    });
  }

  window.addEventListener('scroll', () => {
    requestAnimationFrame(updateScrollMotion);
  }, { passive: true });
  updateScrollMotion();

  /* --- Bi-Directional Scroll Reveal Observer --- */
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (scrollDirection === 'up') {
            entry.target.classList.add('is-revealed-up');
            entry.target.classList.remove('is-revealed');
          } else {
            entry.target.classList.add('is-revealed');
            entry.target.classList.remove('is-revealed-up');
          }
        } else {
          entry.target.classList.remove('is-revealed', 'is-revealed-up');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  /* --- FAQ Accordion Controller --- */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const answer = item.querySelector('.faq-answer');
      const icon = item.querySelector('.faq-icon');
      const isOpen = answer.classList.contains('is-open');

      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('is-open'));
      document.querySelectorAll('.faq-icon').forEach(i => i.classList.remove('is-open'));

      if (!isOpen) {
        answer.classList.add('is-open');
        icon.classList.add('is-open');
      }
    });
  });
});
