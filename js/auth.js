// Inicializar el sistema de autenticación con Firebase
window.auth = {
    currentUser: null,
    ownerEmail: 'perrolocosanchez@live.com',
    authorizedUsers: [],

    async init() {
        console.log("Iniciando sistema de autenticación con Firebase...");
        this.addEventListeners();
        await this.checkSession();
    },

    addEventListeners() {
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
            if (this.currentUser.isOwner) {
                await this.loadAuthorizedUsers();
            }
            this.onLoginSuccess();
        }
    },

    async loadAuthorizedUsers() {
        if (!window.db) return;
        try {
            const snapshot = await window.db.collection('authorized_users').get();
            this.authorizedUsers = snapshot.docs.map(doc => doc.data().email.toLowerCase());
            this.renderUserList();
        } catch (error) {
            console.error("Error cargando usuarios autorizados:", error);
        }
    },

    async login(email, password) {
        const authorizedPassword = 'palometas';
        const lowerEmail = email.toLowerCase().trim();
        const isOwner = lowerEmail === this.ownerEmail.toLowerCase();

        let isAuthorized = isOwner;
        if (!isOwner && window.db) {
            const snapshot = await window.db.collection('authorized_users').where('email', '==', lowerEmail).get();
            if (!snapshot.empty) isAuthorized = true;
        }

        if (isAuthorized && password === authorizedPassword) {
            this.currentUser = {
                email: lowerEmail,
                name: isOwner ? 'Director Técnico' : 'Cuerpo Técnico',
                isOwner: isOwner
            };
            localStorage.setItem('palometas_session', JSON.stringify(this.currentUser));
            if (isOwner) await this.loadAuthorizedUsers();
            this.onLoginSuccess();
        } else {
            alert("Acceso denegado. Credenciales incorrectas.");
        }
    },

    logout() {
        localStorage.removeItem('palometas_session');
        this.currentUser = null;
        window.location.reload();
    },

    onLoginSuccess() {
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        }

        const configNav = document.getElementById('nav-config');
        if (configNav) {
            configNav.style.display = this.currentUser.isOwner ? 'flex' : 'none';
        }

        if (this.currentUser.isOwner) this.renderUserList();

        if (window.playersManager) window.playersManager.loadPlayers();
        if (window.attendanceManager) window.attendanceManager.loadRecords();
        if (window.planningManager) window.planningManager.loadPlans();
        if (window.statsManager) window.statsManager.renderStats();
    },

    async addUserAccess() {
        const input = document.getElementById('new-user-email');
        const email = input.value.trim().toLowerCase();

        if (email && email !== this.ownerEmail && window.db) {
            try {
                await window.db.collection('authorized_users').add({ email: email });
                input.value = '';
                await this.loadAuthorizedUsers();
            } catch (error) {
                alert("Error: No se pudo agregar el usuario.");
            }
        }
    },

    async removeUserAccess(email) {
        if (window.db) {
            const snapshot = await window.db.collection('authorized_users').where('email', '==', email).get();
            const batch = window.db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            await this.loadAuthorizedUsers();
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

window.addEventListener('DOMContentLoaded', () => auth.init());
