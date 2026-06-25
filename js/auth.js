// Autenticación con localStorage

const Auth = {
  USER_KEY: 'minefood_user',

  init() {
    const existingUser = localStorage.getItem(this.USER_KEY);
    if (!existingUser) {
      const defaultUser = {
        username: 'chef',
        password: '123456'
      };
      localStorage.setItem(this.USER_KEY, JSON.stringify(defaultUser));
      console.log('Usuario por defecto creado: chef / 123456');
    }
  },

  validateCredentials(username, password) {
    const storedUser = JSON.parse(localStorage.getItem(this.USER_KEY));
    return storedUser && 
           storedUser.username === username && 
           storedUser.password === password;
  },

  registerUser(username, password) {
    const newUser = {
      username: username,
      password: password
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(newUser));
    console.log('Usuario registrado:', username);
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(this.USER_KEY));
  },

  checkAuth() {
    const user = this.getCurrentUser();
    const currentPath = window.location.pathname;
    
    if (!user && !currentPath.includes('index.html')) {
      window.location.href = 'index.html';
    }
    
    if (user && currentPath.includes('index.html')) {
      window.location.href = 'app.html';
    }
  }
};

Auth.init();
