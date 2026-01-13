// Configuración de Supabase
const SUPABASE_URL = 'https://jpsqjyxrrilfesgfivoo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_z2vaIDgKV3ZrMsqpAz-0-A_qmoUsCs8';

// Inicializar el cliente de Supabase
window.supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

window.auth = {
    currentUser: null,
    ownerEmail: 'perrolocosanchez@live.com',
    authorizedUsers: [],

    async init() {
        console.log("Iniciando sistema de autenticación...");
        this.addEventListeners();
        await this.checkSession();
    },

    addEventListeners() {
        // Mobile Toggle logic
        const toggleBtn = document.getElementById('mobile-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (toggleBtn && sidebar && overlay) {
            const toggleMenu = () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            };

            toggleBtn.addEventListener('click', toggleMenu);
            overlay.addEventListener('click', toggleMenu);

            document.querySelectorAll('.nav-links li').forEach(li => {
                li.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('active');
                        overlay.classList.remove('active');
                    }
                });
            });
        }

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log("Formulario de login enviado...");
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                await this.login(email, password);
            });
        }
    },

    async checkSession() {
        const savedUser = localStorage.getItem('palometas_session');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            console.log("Sesión recuperada:", this.currentUser.email);
            if (this.currentUser.isOwner) {
                await this.loadAuthorizedUsers();
            }
            this.onLoginSuccess();
        }
    },

    async loadAuthorizedUsers() {
        if (!window.supabaseClient) return;
        const { data, error } = await window.supabaseClient.from('authorized_users').select('email');
        if (!error && data) {
            this.authorizedUsers = data.map(u => u.email.toLowerCase());
            this.renderUserList();
        }
    },

    async login(email, password) {
        const authorizedPassword = 'palometas';
        const lowerEmail = email.toLowerCase().trim();

        console.log("Intentando login para:", lowerEmail);

        // Verificar si es dueño
        const isOwner = lowerEmail === this.ownerEmail.toLowerCase();

        let isAuthorized = isOwner;
        if (!isOwner && window.supabaseClient) {
            const { data, error } = await window.supabaseClient.from('authorized_users').select('email').eq('email', lowerEmail).single();
            if (data && !error) isAuthorized = true;
        }

        if (isAuthorized && password === authorizedPassword) {
            console.log("Login exitoso. Configurando sesión...");
            this.currentUser = {
                email: lowerEmail,
                name: isOwner ? 'Director Técnico' : 'Cuerpo Técnico',
                isOwner: isOwner
            };
            localStorage.setItem('palometas_session', JSON.stringify(this.currentUser));

            if (isOwner) await this.loadAuthorizedUsers();
            this.onLoginSuccess();
        } else {
            console.error("Login fallido: Credenciales incorrectas");
            alert("Acceso denegado. Credenciales incorrectas.");
        }
    },

    logout() {
        localStorage.removeItem('palometas_session');
        this.currentUser = null;
        window.location.reload();
    },

    onLoginSuccess() {
        console.log("Ejecutando onLoginSuccess...");
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }

        const configNav = document.getElementById('nav-config');
        if (configNav) {
            configNav.style.display = this.currentUser.isOwner ? 'flex' : 'none';
        }

        if (this.currentUser.isOwner) {
            this.renderUserList();
        }

        // Actualizar otros manager si están cargados
        if (window.playersManager) window.playersManager.loadPlayers();
        if (window.attendanceManager) window.attendanceManager.loadRecords();
        if (window.planningManager) window.planningManager.loadPlans();
        if (window.statsManager) window.statsManager.renderStats();

        console.log("Dashboard desbloqueado para:", this.currentUser.email);
    },

    async addUserAccess() {
        const input = document.getElementById('new-user-email');
        const email = input.value.trim().toLowerCase();

        if (email && email !== this.ownerEmail && window.supabaseClient) {
            const { error } = await window.supabaseClient.from('authorized_users').insert([{ email: email }]);
            if (!error) {
                input.value = '';
                await this.loadAuthorizedUsers();
            } else {
                alert("Error: El mail ya existe o es inválido.");
            }
        }
    },

    async removeUserAccess(email) {
        if (window.supabaseClient) {
            const { error } = await window.supabaseClient.from('authorized_users').delete().eq('email', email);
            if (!error) {
                await this.loadAuthorizedUsers();
            }
        }
    },

    renderUserList() {
        const list = document.getElementById('authorized-users-list');
        if (!list) return;

        list.innerHTML = '';
        this.authorizedUsers.forEach(email => {
            if (email === this.ownerEmail) return;
            const div = document.createElement('div');
            div.className = 'user-item-row';
            div.innerHTML = `
                <span>${email}</span>
                <button class="btn-delete-small" onclick="auth.removeUserAccess('${email}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            list.appendChild(div);
        });
    }
};

// Iniciar aplicación
window.addEventListener('DOMContentLoaded', () => auth.init());
