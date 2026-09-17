const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');

function setMenu(open) {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

const header = document.querySelector('[data-header]');
window.addEventListener('scroll', () => header?.classList.toggle('is-scrolled', window.scrollY > 12), { passive: true });

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

const enquiryForm = document.querySelector('[data-enquiry-form]');
enquiryForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = enquiryForm.querySelector('[data-form-status]');
  const data = new FormData(enquiryForm);
  const subject = `Website enquiry — ${data.get('service') || 'General enquiry'}`;
  const body = [
    `Name: ${data.get('name') || ''}`,
    `Email: ${data.get('email') || ''}`,
    `Telephone: ${data.get('telephone') || 'Not provided'}`,
    `Service: ${data.get('service') || 'Not specified'}`,
    `Preferred contact: ${data.get('preferred_contact') || 'Email'}`,
    '',
    'Enquiry:',
    `${data.get('enquiry') || ''}`,
  ].join('\n');

  if (status) status.textContent = 'Opening your email app with the enquiry details prepared.';
  window.location.href = `mailto:nerogawali@yahoo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

const brandFilm = document.querySelector("[data-brand-film]");
const motionToggle = document.querySelector("[data-motion-toggle]");
const motionLabel = document.querySelector("[data-motion-label]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionPausedByUser = reduceMotion;

function setMotionButton(paused) {
  if (!motionToggle || !motionLabel) return;
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionLabel.textContent = paused ? "Play animation" : "Pause animation";
  const icon = motionToggle.querySelector(".motion-control-icon");
  if (icon) icon.textContent = paused ? "▶" : "Ⅱ";
}

if (brandFilm) {
  setMotionButton(reduceMotion);
  if ("IntersectionObserver" in window) {
    const motionObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !motionPausedByUser) {
        brandFilm.play().catch(() => setMotionButton(true));
      } else {
        brandFilm.pause();
      }
    }, { threshold: 0.35 });
    motionObserver.observe(brandFilm);
  } else if (!reduceMotion) {
    brandFilm.play().catch(() => setMotionButton(true));
  }
}

motionToggle?.addEventListener("click", () => {
  if (!brandFilm) return;
  if (brandFilm.paused) {
    motionPausedByUser = false;
    brandFilm.play().then(() => setMotionButton(false)).catch(() => setMotionButton(true));
  } else {
    motionPausedByUser = true;
    brandFilm.pause();
    setMotionButton(true);
  }
});

const contactRail = document.createElement('aside');
contactRail.className = 'contact-rail is-expanded';
contactRail.id = 'contact-rail';
contactRail.setAttribute('aria-label', 'Quick contact actions');
contactRail.innerHTML = `
  <button class="rail-action rail-toggle" type="button" aria-expanded="true" aria-controls="contact-rail" aria-label="Collapse quick contact actions" title="Collapse quick contact actions">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
  </button>
  <a class="rail-action rail-whatsapp" href="https://wa.me/254117233635?text=Hello%20Arende%20Oriri%20%26%20Associates%20Advocates%2C%20I%20would%20like%20to%20make%20an%20enquiry." target="_blank" rel="noopener noreferrer" aria-label="Start a WhatsApp conversation" title="WhatsApp">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" /><path d="M9 8.5c.2-.4.4-.4.7-.4h.5c.2 0 .3.1.4.4l.6 1.4c.1.2.1.4-.1.6l-.5.6c.6 1.1 1.5 1.8 2.6 2.3l.6-.6c.2-.2.4-.2.6-.1l1.3.6c.3.1.4.3.3.6-.2.7-.8 1.2-1.5 1.3-1.2.1-2.7-.6-4.1-1.8-1.2-1-2.2-2.5-2.6-3.5-.3-.7-.2-1 .2-1.4Z" /></svg>
  </a>
  <a class="rail-action rail-phone" href="tel:+254117233635" aria-label="Call Arende Oriri and Associates Advocates" title="Call +254 117 233 635">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5 9.5 4l1.3 4-1.8 1.5a12 12 0 0 0 5.5 5.5l1.5-1.8 4 1.3-.5 2.5c-.2 1-1 1.6-2 1.5C10 17.8 6.2 14 5 6.5c-.1-1 .5-1.8 1.5-2Z" /></svg>
  </a>`;
const contactRailHost = document.querySelector('.hero, .page-hero');
if (contactRailHost) document.body.append(contactRail);

const railToggle = contactRail.querySelector('.rail-toggle');
railToggle?.addEventListener('click', () => {
  const expanded = contactRail.classList.toggle('is-expanded');
  railToggle.setAttribute('aria-expanded', String(expanded));
  railToggle.setAttribute('aria-label', expanded ? 'Collapse quick contact actions' : 'Expand quick contact actions');
  railToggle.setAttribute('title', expanded ? 'Collapse quick contact actions' : 'Expand quick contact actions');
});

/* === ARENDE LOGO REVEAL START === */
const arendeBrandReveal = document.querySelector('[data-brand-reveal]');

if (arendeBrandReveal) {
  const LOOP_MS = 3800;
  let arendeLoopTimer = null;

  const replayBrandReveal = () => {
    arendeBrandReveal.classList.remove('is-animated');
    void arendeBrandReveal.offsetWidth;
    arendeBrandReveal.classList.add('is-animated');
  };

  const stopBrandLoop = () => {
    if (arendeLoopTimer) {
      clearInterval(arendeLoopTimer);
      arendeLoopTimer = null;
    }
  };

  const startBrandLoop = () => {
    if (reduceMotion) return;
    stopBrandLoop();
    replayBrandReveal();
    arendeLoopTimer = setInterval(replayBrandReveal, LOOP_MS);
  };

  if (reduceMotion) {
    arendeBrandReveal.classList.add('is-animated');
  } else if ('IntersectionObserver' in window) {
    const arendeBrandObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        startBrandLoop();
      } else {
        stopBrandLoop();
      }
    }, { threshold: 0.25 });

    arendeBrandObserver.observe(arendeBrandReveal);
  } else {
    startBrandLoop();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopBrandLoop();
    } else if (!reduceMotion) {
      const rect = arendeBrandReveal.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) startBrandLoop();
    }
  });
}
/* === ARENDE LOGO REVEAL END === */
