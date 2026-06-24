(function () {
  'use strict';

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('is-open');
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('is-open');
    }
  }

  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-modal-open');
      openModal(target);
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-modal-close');
      if (target) {
        closeModal(target);
      } else {
        const modal = btn.closest('.mc-modal');
        if (modal) modal.classList.remove('is-open');
      }
    });
  });

  document.querySelectorAll('.mc-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-open');
      }
    });
  });

  window.openModal = openModal;
  window.closeModal = closeModal;
})();
