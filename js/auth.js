// Sistema de autenticación con localStorage

const Auth = {
  // Clave para guardar el usuario en localStorage
  USER_KEY: 'minefood_user',

  // Inicializar usuario por defecto si no existe
  init() {
    const existingUser = localStorage.getItem(this.USER_KEY);
    if (!existingUser) {
      // Crear usuario por defecto
      const defaultUser = {
        username: 'chef',
        password: '123456'
      };
      localStorage.setItem(this.USER_KEY, JSON.stringify(defaultUser));
      console.log('Usuario por defecto creado: chef / 123456');
    }
  },

  // Validar credenciales
  validateCredentials(username, password) {
    const storedUser = JSON.parse(localStorage.getItem(this.USER_KEY));
    return storedUser && 
           storedUser.username === username && 
           storedUser.password === password;
  },

  // Registrar nuevo usuario
  registerUser(username, password) {
    const newUser = {
      username: username,
      password: password
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(newUser));
    console.log('Usuario registrado:', username);
  },

  // Obtener usuario actual
  getCurrentUser() {
    return JSON.parse(localStorage.getItem(this.USER_KEY));
  }
};

// Inicializar al cargar
Auth.init();
