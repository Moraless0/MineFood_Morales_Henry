(function () {
  'use strict';

  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.querySelector('.hamburger');
  const overlay = document.querySelector('.sidebar-overlay');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('is-open');
    if (overlay) overlay.classList.add('is-visible');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar && sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Marcar link activo basado en hash (SPA)
  const currentHash = window.location.hash.slice(1) || 'dashboard';
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href').slice(1); // Remover #
    if (href === currentHash) {
      item.classList.add('active');
    }
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const link = item.querySelector('a');
      if (link && window.innerWidth < 1024) {
        closeSidebar();
      }
    });
  });
})();
