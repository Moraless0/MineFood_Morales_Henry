// Router SPA para MineFood - Navegación sin recargas

const Router = {
  // Rutas disponibles
  routes: {
    'dashboard': 'view-dashboard',
    'tables': 'view-tables',
    'inventory': 'view-inventory',
    'dishes': 'view-dishes',
    'orders': 'view-orders',
    'reports': 'view-reports'
  },

  // Ruta por defecto
  defaultRoute: 'dashboard',

  // Inicializar router
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
    this.handleRoute();
  },

  // Manejar cambio de ruta
  handleRoute() {
    const requestedHash = window.location.hash.slice(1) || this.defaultRoute;
    const hash = this.routes[requestedHash] ? requestedHash : this.defaultRoute;
    const viewId = this.routes[hash];
    
    this.navigate(viewId);
    this.updateActiveLink(hash);
  },

  // Navegar a una vista
  navigate(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
      view.classList.add('hidden');
    });

    // Mostrar vista seleccionada
    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.remove('hidden');
      targetView.classList.add('active');
    }

    // Disparar evento de cambio de vista
    window.dispatchEvent(new CustomEvent('viewChange', { detail: { viewId } }));
  },

  // Actualizar link activo en sidebar
  updateActiveLink(hash) {
    document.querySelectorAll('.nav-item').forEach(item => {
      const link = item.querySelector('a');
      item.classList.remove('active');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href === `#${hash}`) {
        item.classList.add('active');
      }
    });
  },

  // Navegar programáticamente
  goTo(route) {
    window.location.hash = route;
  }
};

// Inicializar router
document.addEventListener('DOMContentLoaded', () => {
  Router.init();
});
