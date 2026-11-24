(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll(
    '.cover-image, .archive-media, .detail-image-surface, .artist-portrait'
  )].filter(element => element.querySelector('img'));
  const seen = new WeakSet();
  let observer;

  function clean(element) {
    element.classList.remove('artwork-entering', 'artwork-feedback', 'lightbox-pop');
  }
  function animate(element, name, restart = false) {
    if (!element || preference.matches) return;
    clean(element);
    if (restart) void element.offsetWidth;
    element.classList.add(name);
  }
  targets.forEach(element => {
    element.classList.add('artwork-motion-target');
    element.addEventListener('animationend', event => {
      if (event.target === element) clean(element);
    });
    element.addEventListener('animationcancel', event => {
      if (event.target === element && preference.matches) clean(element);
    });
  });

  function observe() {
    observer?.disconnect();
    if (preference.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target)) continue;
        seen.add(entry.target);
        animate(entry.target, 'artwork-entering');
        observer.unobserve(entry.target);
      }
    }, {threshold: .12, rootMargin: '0px 0px -2% 0px'});
    targets.forEach(element => { if (!seen.has(element)) observer.observe(element); });
  }
  function targetFor(element) {
    if (!(element instanceof Element)) return null;
    return element.closest('.artwork-motion-target') ||
      element.closest('a, button')?.querySelector('.artwork-motion-target');
  }
  function feedback(element) {
    const target = targetFor(element);
    if (!target || preference.matches) return;
    seen.add(target);
    observer?.unobserve(target);
    animate(target, 'artwork-feedback', true);
  }
  let touchPress;
  // All pointer listeners are passive. A pan or pinch is never held back.
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') {
      touchPress = event.isPrimary ? {id:event.pointerId, x:event.clientX, y:event.clientY, target:event.target} : undefined;
    } else if (event.button === 0) feedback(event.target);
  }, {passive:true});
  document.addEventListener('pointerup', event => {
    if (touchPress?.id !== event.pointerId) return;
    const press = touchPress;
    touchPress = undefined;
    if (Math.hypot(event.clientX-press.x, event.clientY-press.y) < 8) feedback(press.target);
  }, {passive:true});
  document.addEventListener('pointercancel', () => { touchPress = undefined; }, {passive:true});
  document.addEventListener('click', event => {
    if (event.detail === 0) feedback(event.target);
  }, {passive:true});

  const dialog = document.querySelector('#lightbox');
  const artwork = dialog?.querySelector('.lightbox-artwork');
  const image = artwork?.querySelector('img');
  if (dialog && artwork && image) {
    const revealDetail = () => {
      if (dialog.open && image.complete && image.naturalWidth) animate(artwork, 'lightbox-pop', true);
    };
    image.addEventListener('load', revealDetail);
    artwork.addEventListener('animationend', event => {
      if (event.target === artwork) clean(artwork);
    });
    new MutationObserver(() => {
      if (dialog.open) revealDetail();
      else clean(artwork);
    }).observe(dialog, {attributes:true, attributeFilter:['open']});
    dialog.addEventListener('close', () => clean(artwork));
  }
  preference.addEventListener('change', () => {
    targets.forEach(clean);
    if (artwork) clean(artwork);
    observe();
  });
  observe();
})();
