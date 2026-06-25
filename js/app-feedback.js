(function () {
  'use strict';

  function ensureToastHost() {
    let host = document.querySelector('.mc-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'mc-toast-host';
      document.body.appendChild(host);
    }
    return host;
  }

  function showToast(message, type = 'success') {
    const host = ensureToastHost();
    const toast = document.createElement('div');
    toast.className = `mc-toast mc-toast--${type}`;
    toast.textContent = message;
    host.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add('is-hiding');
      window.setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  function confirmAction(message) {
    return window.confirm(message);
  }

  function resetDemoData() {
    localStorage.removeItem('minefood_inventory');
    localStorage.removeItem('minefood_dishes');
    localStorage.removeItem('minefood_orders');
    localStorage.removeItem('minefood_first_visit');
    showToast('Datos de demostración restaurados. Recargando...', 'success');
    window.setTimeout(() => window.location.reload(), 700);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-reset-demo]').forEach(button => {
      button.addEventListener('click', () => {
        if (confirmAction('¿Restaurar los datos de demostración? Se perderán cambios locales de inventario, platillos y pedidos.')) {
          resetDemoData();
        }
      });
    });
  });

  window.MineFoodFeedback = {
    showToast,
    confirmAction,
    resetDemoData
  };
})();
