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

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href').split('/').pop();
    if (href === currentPage) {
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
