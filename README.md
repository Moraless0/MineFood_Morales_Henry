# MineFood 🍖

Sistema de gestión de restaurante con temática de Minecraft. SPA completa para manejar inventario, platillos, mesas, pedidos y reportes.

## 🎮 Características

- **Dashboard** - Vista general con estadísticas en tiempo real
- **Inventario** - Gestión de insumos con stock mínimo y alertas
- **Platillos** - Catálogo de platillos con precios e ingredientes
- **Mesas** - Control de 12 mesas con estados y tiempos
- **Pedidos** - Flujo completo de pedidos (pendiente → preparando → listo → servido → pagado)
- **Reportes** - Estadísticas de ventas, platillos más vendidos y uso de ingredientes
- **Tema Minecraft** - Interfaz completa con assets de Minecraft 1.21.11

## 🛠 Tecnologías

- HTML5
- CSS3 (Vanilla, sin frameworks)
- JavaScript (Vanilla, sin frameworks)
- LocalStorage para persistencia de datos

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/Moraless0/MineFood_Morales_Henry.git
cd MineFood
```

2. Abre `index.html` en tu navegador:
```bash
# Puedes usar un servidor local o abrir directamente
start index.html  # Windows
open index.html   # macOS
xdg-open index.html # Linux
```

## 🔑 Credenciales

- **Usuario:** `chef`
- **Contraseña:** `123456`

## 📖 Uso

### Dashboard
- Vista general del restaurante
- Estadísticas de ventas y pedidos
- Accesos rápidos a todas las secciones

### Inventario
- Agregar, editar y eliminar insumos
- Visualización en grid de items
- Alertas de stock bajo
- Búsqueda por nombre, código o descripción

### Platillos
- Crear platillos con ingredientes
- Definir precios
- Iconos de Minecraft automáticos

### Mesas
- 12 mesas con estados: Libre, Ocupada, Pagando
- Tiempo de ocupación en tiempo real
- Click para crear pedido o ver detalles

### Pedidos
- Crear pedidos desde mesas
- Flujo de estados: Pendiente → Preparando → Listo → Servido → Pagado
- Descuento automático de inventario al pasar a "Preparando"
- Filtrado por estado

### Reportes
- Ventas totales
- Platillos más vendidos
- Uso de ingredientes
- Promedio de pedido

## 📁 Estructura del Proyecto

```
MineFood/
├── index.html          # Login
├── app.html            # Aplicación principal (SPA)
├── assets/             # Imágenes y recursos de Minecraft
│   ├── 1.21.11/       # Assets de Minecraft 1.21.11
│   ├── icons/         # Iconos de la app
│   └── images/        # Imágenes de branding
├── js/                 # Módulos JavaScript
│   ├── auth.js         # Autenticación
│   ├── inventory.js    # Lógica de inventario
│   ├── dishes.js       # Lógica de platillos
│   ├── tables.js       # Lógica de mesas
│   ├── orders.js       # Lógica de pedidos
│   ├── router.js       # Router SPA
│   ├── *-ui.js        # UI de cada módulo
│   └── data-demo.js    # Datos de demo
└── styles/             # Estilos CSS
    ├── base.css        # Base y variables
    ├── layout.css      # Layout general
    ├── components.css  # Componentes UI
    ├── minecraft-theme.css # Tema Minecraft
    ├── responsive.css  # Media queries
    └── login.css       # Estilos de login
```

## 🎨 Wireframes

Los wireframes del proyecto están disponibles en: [Link de Canva - AGREGAR AQUÍ]

## 🚀 Desarrollo

El proyecto usa:
- **SPA (Single Page Application)** - Navegación sin recargas con hash routing
- **LocalStorage** - Persistencia de datos en el navegador
- **Módulos JavaScript** - Código organizado por funcionalidad
- **CSS Modular** - Estilos separados por propósito

## 📝 Notas

- Los datos se guardan en LocalStorage del navegador
- Al cerrar el navegador, los datos persisten
- Para resetear datos, usar la consola: `localStorage.clear()`
- El inventario se descuenta automáticamente al pasar pedidos a "Preparando"

## 🐛 Conocimientos

- El inventario no se descuenta al crear el pedido, solo al pasar a "Preparando"
- Los datos de demo se cargan la primera vez que se abre la app
- Los iconos de Minecraft se mapean automáticamente por nombre

## 📄 Licencia

Este proyecto es para fines educativos.

---

**Desarrollado con ❤️ y Minecraft**
