// Sistema de autenticación para Audiolibros Escuchados

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Verificar si hay un usuario logueado
        this.checkCurrentUser();
        
        // Configurar eventos
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        const showRegisterLink = document.getElementById('show-register');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }
    }

    showRegisterForm() {
        const loginCard = document.querySelector('.login-card');
        const loginForm = document.getElementById('login-form');
        const showRegisterLink = document.getElementById('show-register');

        loginCard.innerHTML = `
            <div class="login-logo">📚 Crear Cuenta</div>
            
            <div id="error-message" class="error-message"></div>
            <div id="success-message" class="success-message"></div>
            
            <form id="register-form" class="login-form">
                <div class="form-group">
                    <label for="reg-username">Usuario</label>
                    <input type="text" id="reg-username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="reg-email">Email</label>
                    <input type="email" id="reg-email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="reg-password">Contraseña</label>
                    <input type="password" id="reg-password" name="password" required>
                </div>
                
                <div class="form-group">
                    <label for="reg-confirm-password">Confirmar Contraseña</label>
                    <input type="password" id="reg-confirm-password" name="confirm-password" required>
                </div>
                
                <button type="submit" class="login-btn">Crear Cuenta</button>
            </form>
            
            <div class="register-link">
                ¿Ya tienes cuenta? <a href="#" id="show-login">Inicia sesión aquí</a>
            </div>
        `;

        // Configurar eventos del formulario de registro
        const registerForm = document.getElementById('register-form');
        const showLoginLink = document.getElementById('show-login');

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    showLoginForm() {
        const loginCard = document.querySelector('.login-card');
        
        loginCard.innerHTML = `
            <div class="login-logo">📚 Audiolibros Escuchados</div>
            
            <div id="error-message" class="error-message"></div>
            <div id="success-message" class="success-message"></div>
            
            <form id="login-form" class="login-form">
                <div class="form-group">
                    <label for="username">Usuario</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="login-btn">Iniciar Sesión</button>
            </form>
            
            <div class="register-link">
                ¿No tienes cuenta? <a href="#" id="show-register">Regístrate aquí</a>
            </div>
        `;

        // Reconfigurar eventos
        this.setupEventListeners();
    }

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showError('Por favor completa todos los campos');
            return;
        }

        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.login(user);
            this.showSuccess('¡Inicio de sesión exitoso!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.showError('Usuario o contraseña incorrectos');
        }
    }

    handleRegister() {
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        // Validaciones
        if (!username || !email || !password || !confirmPassword) {
            this.showError('Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            this.showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Por favor ingresa un email válido');
            return;
        }

        const users = this.getUsers();
        
        // Verificar si el usuario ya existe
        if (users.some(u => u.username === username)) {
            this.showError('El nombre de usuario ya está en uso');
            return;
        }

        if (users.some(u => u.email === email)) {
            this.showError('El email ya está registrado');
            return;
        }

        // Crear nuevo usuario
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
            books: [] // Colección de libros vacía
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        this.showSuccess('¡Cuenta creada exitosamente!');
        setTimeout(() => {
            this.showLoginForm();
        }, 1500);
    }

    login(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log('Usuario logueado:', user.username);
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    checkCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            console.log('Usuario actual:', this.currentUser.username);
        }
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getUserBooks() {
        if (!this.currentUser) return [];
        return this.currentUser.books || [];
    }

    saveUserBooks(books) {
        if (!this.currentUser) return;

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].books = books;
            this.currentUser.books = books;
            
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }

    addBook(book) {
        if (!this.currentUser) return;

        const books = this.getUserBooks();
        const existingBook = books.find(b => 
            b.title === book.title && b.author === book.author
        );

        if (!existingBook) {
            books.push(book);
            this.saveUserBooks(books);
            console.log('Libro agregado a la colección del usuario');
        }
    }

    removeBook(bookTitle, bookAuthor) {
        if (!this.currentUser) return;

        const books = this.getUserBooks();
        const filteredBooks = books.filter(b => 
            !(b.title === bookTitle && b.author === bookAuthor)
        );
        
        this.saveUserBooks(filteredBooks);
        console.log('Libro removido de la colección del usuario');
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Inicializar el sistema de autenticación
const auth = new AuthSystem();

// Función global para verificar autenticación en otras páginas
function checkAuth() {
    if (!auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Función global para cerrar sesión
function logout() {
    auth.logout();
} 