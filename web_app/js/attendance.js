const attendanceManager = {
    currentDate: new Date().toISOString().split('T')[0],
    playersStates: {},
    isNewRecord: true,
    history: [],

    async init() {
        this.currentDate = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('attendance-date');
        if (dateInput) {
            dateInput.value = this.currentDate;
            dateInput.addEventListener('change', async (e) => {
                this.currentDate = e.target.value;
                await this.loadRecords();
            });
        }
        await this.loadRecords();
        await this.loadHistory();
    },

    async loadHistory() {
        if (!window.db) return;
        try {
            const snapshot = await window.db.collection('attendance').orderBy('training_date', 'desc').get();
            const uniqueDates = [...new Set(snapshot.docs.map(doc => doc.data().training_date))];
            this.history = uniqueDates;
            this.renderHistory();
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
    },

    renderHistory() {
        const container = document.getElementById('attendance-history-list');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay registros previos.</p>';
            return;
        }

        container.innerHTML = this.history.map(dateStr => {
            const date = new Date(dateStr + 'T12:00:00'); // Evitar problemas de timezone
            const isActive = dateStr === this.currentDate;

            return `
                <div class="mini-ex-item" 
                     style="margin-bottom:10px; border-left: 3px solid ${isActive ? 'var(--primary-color)' : 'transparent'}; background: ${isActive ? 'rgba(74, 158, 255, 0.1)' : 'rgba(255,255,255,0.03)'}; display:flex; justify-content:space-between; align-items:center; padding: 10px; border-radius: 8px;">
                    <div style="cursor:pointer; flex: 1;" onclick="attendanceManager.setDate('${dateStr}')">
                        <strong style="color:${isActive ? 'var(--primary-color)' : 'white'}">${date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                        <br><small style="opacity:0.6">${dateStr}</small>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="event.stopPropagation(); attendanceManager.deleteSession('${dateStr}')" title="Borrar esta sesión" 
                                style="background:rgba(231, 76, 60, 0.1); border:none; color:#e74c3c; cursor:pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition: all 0.2s;">
                            <i class="fas fa-trash-alt" style="font-size: 0.85rem;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    async deleteSession(dateStr) {
        if (!window.db) return;
        if (!confirm(`¿Estás seguro de que deseas borrar todos los registros del día ${dateStr}? Esta acción no se puede deshacer.`)) return;

        try {
            const snapshot = await window.db.collection('attendance').where('training_date', '==', dateStr).get();
            if (snapshot.empty) {
                alert("No se encontraron registros para borrar.");
                return;
            }

            const batch = window.db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            alert(`Registros del día ${dateStr} borrados correctamente.`);

            // Si borramos el día que estamos viendo, recargar para mostrar que es nuevo
            if (dateStr === this.currentDate) {
                await this.loadRecords();
            }
            await this.loadHistory();
            if (window.app) window.app.updateDashboard();
        } catch (error) {
            console.error("Error al borrar sesión:", error);
            alert("Error al intentar borrar los registros.");
        }
    },

    setDate(dateStr) {
        this.currentDate = dateStr;
        const dateInput = document.getElementById('attendance-date');
        if (dateInput) dateInput.value = dateStr;
        this.loadRecords();
        this.renderHistory();
    },

    async loadRecords() {
        if (!window.db) return;

        try {
            const snapshot = await window.db.collection('attendance').where('training_date', '==', this.currentDate).get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const players = window.playersManager ? window.playersManager.players : [];
            this.playersStates = {};

            const banner = document.getElementById('attendance-status-banner');

            if (data.length > 0) {
                this.isNewRecord = false;
                this.updateStatusBanner(false);

                players.forEach(p => {
                    const record = data.find(r => r.player_id === p.id);
                    this.playersStates[p.id] = record ? record.present : false;
                });
            } else {
                this.isNewRecord = true;
                this.updateStatusBanner(true);

                players.forEach(p => {
                    this.playersStates[p.id] = true;
                });
            }

            this.renderAttendanceList();
        } catch (error) {
            console.error("Error cargando asistencia:", error);
        }
    },

    renderAttendanceList() {
        const container = document.getElementById('attendance-list');
        if (!container) return;

        const players = window.playersManager ? window.playersManager.players : [];
        container.innerHTML = '';

        if (players.length === 0) {
            container.innerHTML = '<p class="text-muted" style="padding:20px">No hay jugadoras cargadas.</p>';
            return;
        }

        const sorted = [...players].sort((a, b) => a.alias.localeCompare(b.alias));
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
        grid.style.gap = '15px';

        sorted.forEach(p => {
            const isPresent = this.playersStates[p.id] || false;

            const card = document.createElement('div');
            card.className = 'config-card';
            card.style.padding = '15px';
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.gap = '12px';
            card.style.cursor = 'pointer';
            card.style.transition = 'all 0.2s ease';
            card.style.border = isPresent ? '1px solid var(--primary-color)' : '1px solid #e74c3c';
            card.style.transform = isPresent ? 'none' : 'scale(0.98)';
            card.style.opacity = isPresent ? '1' : '0.7';

            card.onclick = (e) => {
                this.playersStates[p.id] = !this.playersStates[p.id];
                this.renderAttendanceList();
            };

            card.innerHTML = `
                <div style="width:28px; height:28px; border-radius:50%; border:2px solid ${isPresent ? 'var(--primary-color)' : '#666'}; background:${isPresent ? 'var(--primary-color)' : 'transparent'}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    ${isPresent ? '<i class="fas fa-check" style="color:white; font-size:0.9rem;"></i>' : '<i class="fas fa-times" style="color:#666; font-size:0.8rem;"></i>'}
                </div>
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:bold; font-size:1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.alias}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${p.category}</div>
                </div>
                <div style="font-size:0.65rem; font-weight:bold; color:${isPresent ? 'var(--primary-color)' : '#e74c3c'}">
                    ${isPresent ? 'PRESENTE' : 'AUSENTE'}
                </div>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);
    },

    toggleAll(present) {
        const players = window.playersManager ? window.playersManager.players : [];
        players.forEach(p => {
            this.playersStates[p.id] = present;
        });
        this.renderAttendanceList();
    },

    async saveAll() {
        if (!window.db) return;

        const players = window.playersManager ? window.playersManager.players : [];
        const records = players.map(p => ({
            player_id: p.id,
            training_date: this.currentDate,
            present: this.playersStates[p.id] || false
        }));

        try {
            // Borrar antiguos
            const snapshot = await window.db.collection('attendance').where('training_date', '==', this.currentDate).get();
            const batch = window.db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            // Insertar nuevos
            const nextBatch = window.db.batch();
            records.forEach(rec => {
                const ref = window.db.collection('attendance').doc();
                nextBatch.set(ref, rec);
            });
            await nextBatch.commit();

            alert(`Asistencia del día ${this.currentDate} guardada correctamente.`);
            await this.loadHistory();
            await this.loadRecords();
            if (window.app) window.app.updateDashboard();
        } catch (error) {
            console.error(error);
            alert("Error al guardar la asistencia.");
        }
    },

    async updateStatusBanner(isNew) {
        const banner = document.getElementById('attendance-status-banner');
        const deleteBtn = document.getElementById('btn-delete-attendance');
        if (!banner) return;

        if (isNew) {
            banner.innerHTML = `<div class="badge" style="background:var(--accent-color); padding:8px 15px; border-radius:30px;"><i class="fas fa-info-circle"></i> Nuevo Registro (Default: Todas Presentes)</div>`;
            if (deleteBtn) deleteBtn.style.display = 'none';
        } else {
            banner.innerHTML = `<div class="badge" style="background:#2ecc71; padding:8px 15px; border-radius:30px;"><i class="fas fa-check-circle"></i> Asistencia Registrada</div>`;
            if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        }
    }
};

window.attendanceManager = attendanceManager;
window.addEventListener('DOMContentLoaded', () => attendanceManager.init());
