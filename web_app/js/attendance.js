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
        if (!window.supabaseClient) return;

        // Obtener fechas únicas que tienen asistencia grabada
        const { data, error } = await window.supabaseClient
            .from('attendance')
            .select('training_date')
            .order('training_date', { ascending: false });

        if (!error && data) {
            // Filtrar fechas únicas
            const uniqueDates = [...new Set(data.map(item => item.training_date))];
            this.history = uniqueDates;
            this.renderHistory();
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
                     style="cursor:pointer; margin-bottom:10px; border-left: 3px solid ${isActive ? 'var(--primary-color)' : 'transparent'}; background: ${isActive ? 'rgba(74, 158, 255, 0.1)' : 'rgba(255,255,255,0.03)'}"
                     onclick="attendanceManager.setDate('${dateStr}')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:${isActive ? 'var(--primary-color)' : 'white'}">${date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                            <br><small style="opacity:0.6">${dateStr}</small>
                        </div>
                        <i class="fas fa-chevron-right" style="opacity:0.3"></i>
                    </div>
                </div>
            `;
        }).join('');
    },

    setDate(dateStr) {
        this.currentDate = dateStr;
        const dateInput = document.getElementById('attendance-date');
        if (dateInput) dateInput.value = dateStr;
        this.loadRecords();
        this.renderHistory();
    },

    async loadRecords() {
        if (!window.supabaseClient) return;

        const { data, error } = await window.supabaseClient
            .from('attendance')
            .select('*')
            .eq('training_date', this.currentDate);

        const players = window.playersManager ? window.playersManager.players : [];
        this.playersStates = {};

        const banner = document.getElementById('attendance-status-banner');

        if (!error && data && data.length > 0) {
            this.isNewRecord = false;
            if (banner) banner.innerHTML = `<div class="badge" style="background:#2ecc71; padding:8px 15px; border-radius:30px;"><i class="fas fa-check-circle"></i> Asistencia Registrada</div>`;

            players.forEach(p => {
                const record = data.find(r => r.player_id === p.id);
                this.playersStates[p.id] = record ? record.present : false;
            });
        } else {
            this.isNewRecord = true;
            if (banner) banner.innerHTML = `<div class="badge" style="background:var(--accent-color); padding:8px 15px; border-radius:30px;"><i class="fas fa-info-circle"></i> Nuevo Registro (Default: Todas Presentes)</div>`;

            players.forEach(p => {
                this.playersStates[p.id] = true;
            });
        }

        this.renderAttendanceList();
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
        if (!window.supabaseClient) return;

        const players = window.playersManager ? window.playersManager.players : [];
        const records = players.map(p => ({
            player_id: p.id,
            training_date: this.currentDate,
            present: this.playersStates[p.id] || false
        }));

        const { error: delError } = await window.supabaseClient
            .from('attendance')
            .delete()
            .eq('training_date', this.currentDate);

        if (delError) {
            console.error("Error al limpiar registros previos:", delError);
        }

        const { error } = await window.supabaseClient
            .from('attendance')
            .insert(records);

        if (!error) {
            alert(`Asistencia del día ${this.currentDate} guardada correctamente.`);
            await this.loadHistory();
            await this.loadRecords();
            if (window.app) window.app.updateDashboard();
        } else {
            console.error(error);
            alert("Error al guardar la asistencia.");
        }
    }
};

window.attendanceManager = attendanceManager;
window.addEventListener('DOMContentLoaded', () => attendanceManager.init());
