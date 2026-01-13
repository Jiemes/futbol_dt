const matchesManager = {
    matches: [],
    currentFilter: 'Todas',
    isInitialized: false,

    async init() {
        await this.loadMatches();
        if (!this.isInitialized) {
            this.addEventListeners();
            this.isInitialized = true;
        }
    },

    addEventListeners() {
        const form = document.getElementById('match-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveMatch();
            });
        }
    },

    async loadMatches() {
        if (!window.supabaseClient) return;
        const { data, error } = await window.supabaseClient
            .from('matches')
            .select('*')
            .order('date', { ascending: true });

        if (!error && data) {
            this.matches = data;
            this.renderMatches();
            this.renderStandings();
            this.updateHomeMatches();
        }
    },

    async saveMatch() {
        const id = document.getElementById('match-edit-id').value;
        const datePart = document.getElementById('m-date-only').value;
        const timePart = document.getElementById('m-time-only').value || "00:00";

        const fullDate = `${datePart}T${timePart}:00`;

        const matchData = {
            tournament: document.getElementById('m-tournament').value || 'Torneo',
            category: document.getElementById('m-category').value,
            rival: document.getElementById('m-rival').value,
            date: fullDate,
            condition: document.getElementById('m-condition').value,
            location: document.getElementById('m-location').value,
            score_local: document.getElementById('m-score-local').value ? parseInt(document.getElementById('m-score-local').value) : null,
            score_rival: document.getElementById('m-score-rival').value ? parseInt(document.getElementById('m-score-rival').value) : null,
            observations: document.getElementById('m-observations').value || ''
        };

        let result;
        if (id) {
            result = await window.supabaseClient.from('matches').update(matchData).eq('id', id);
        } else {
            result = await window.supabaseClient.from('matches').insert([matchData]);
        }

        if (!result.error) {
            await this.loadMatches();
            this.showAddModal(false);
        } else {
            console.error(result.error);
            alert("Error al guardar partido. Asegúrate de actualizar la tabla en Supabase.");
        }
    },

    setFilter(cat, btn) {
        this.currentFilter = cat;
        document.querySelectorAll('#screen-matches .filter-chip').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.renderMatches();
    },

    renderMatches() {
        const grid = document.getElementById('matches-grid');
        if (!grid) return;

        let filtered = this.matches;
        if (this.currentFilter !== 'Todas') {
            filtered = this.matches.filter(m => m.category === this.currentFilter);
        }

        grid.innerHTML = '';
        if (filtered.length === 0) {
            grid.innerHTML = '<p class="text-muted">No hay partidos registrados en esta categoría.</p>';
            return;
        }

        filtered.forEach(m => {
            const date = new Date(m.date);
            const isPlayed = m.score_local !== null && m.score_rival !== null;
            const hasTime = m.date.includes('T') && !m.date.endsWith('T00:00:00');

            const card = document.createElement('div');
            card.className = 'config-card';
            card.style.borderLeft = `5px solid ${isPlayed ? 'var(--primary-color)' : 'var(--accent-color)'}`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
                    <div>
                        <span class="badge" style="background:var(--primary-color);">${m.category}</span>
                        <span class="badge" style="background:rgba(255,255,255,0.1); margin-left:5px;">${m.tournament || 'Torneo'}</span>
                        <h4 style="margin-top:10px; font-size:1.2rem;">Palometas vs ${m.rival}</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted);">
                            <i class="fas fa-calendar"></i> ${date.toLocaleDateString('es-AR')} ${hasTime ? ' - ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 'hs' : ''}<br>
                            <i class="fas fa-map-marker-alt"></i> ${m.location || 'Sin definir'} (${m.condition})
                        </p>
                    </div>
                    <div style="text-align:right;">
                        ${isPlayed ? `
                            <div style="font-size:1.5rem; font-weight:bold; color:white;">
                                ${m.score_local} - ${m.score_rival}
                            </div>
                            <span style="font-size:0.7rem; color:var(--accent-color);">FINALIZADO</span>
                        ` : `
                            <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--accent-color);">PENDIENTE</span>
                        `}
                    </div>
                </div>
                ${m.observations ? `<p style="font-size:0.8rem; background:rgba(255,255,255,0.03); padding:8px; border-radius:5px; margin-bottom:15px; border-left:2px solid var(--accent-color);">${m.observations}</p>` : ''}
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-secondary btn-sm" onclick="matchesManager.editMatch('${m.id}')">Editar / Resultado</button>
                    <button class="btn btn-secondary btn-sm" style="color:#e74c3c; opacity:0.6;" onclick="matchesManager.deleteMatch('${m.id}')">Borrar</button>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    renderStandings() {
        const container = document.getElementById('standings-container');
        if (!container) return;

        const played = this.matches.filter(m => m.score_local !== null).sort((a, b) => new Date(b.date) - new Date(a.date));

        if (played.length === 0) {
            container.innerHTML = '<p class="text-muted">Aún no hay resultados para mostrar.</p>';
            return;
        }

        let html = `
            <table style="width:100%; border-collapse: collapse; font-size:0.85rem;">
                <thead>
                    <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align:left; color:var(--accent-color);">
                        <th style="padding:10px;">Fecha</th>
                        <th style="padding:10px;">Cat.</th>
                        <th style="padding:10px;">Rival</th>
                        <th style="padding:10px;">RES</th>
                    </tr>
                </thead>
                <tbody>
        `;

        played.forEach(m => {
            const date = new Date(m.date);
            const win = m.score_local > m.score_rival;
            const draw = m.score_local === m.score_rival;
            const color = win ? '#2ecc71' : (draw ? '#ccc' : '#e74c3c');

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding:10px;">${date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</td>
                    <td style="padding:10px;">${m.category}</td>
                    <td style="padding:10px;">${m.rival}</td>
                    <td style="padding:10px; font-weight:bold; color:${color}">${m.score_local}-${m.score_rival}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    updateHomeMatches() {
        const container = document.getElementById('home-next-matches');
        if (!container) return;

        const now = new Date();
        const tenDaysLater = new Date();
        tenDaysLater.setDate(now.getDate() + 10);

        const future = this.matches
            .filter(m => {
                const d = new Date(m.date);
                return d >= now && d <= tenDaysLater && m.score_local === null;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (future.length === 0) {
            container.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">Sin partidos en los próximos 10 días.</p>';
            return;
        }

        container.innerHTML = future.map(m => {
            const date = new Date(m.date);
            return `
                <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:12px; margin-bottom:10px; border-left:3px solid var(--accent-color);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:var(--accent-color);">${m.category}</strong> vs ${m.rival}<br>
                            <small class="text-muted"><i class="fas fa-calendar"></i> ${date.toLocaleDateString('es-AR')}</small>
                        </div>
                        <span class="badge" style="background:rgba(255,255,255,0.05); font-size:0.7rem;">${m.condition}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    editMatch(id) {
        const m = this.matches.find(match => match.id === id);
        if (!m) return;

        document.getElementById('match-edit-id').value = m.id;
        document.getElementById('m-tournament').value = m.tournament || '';
        document.getElementById('m-category').value = m.category;
        document.getElementById('m-rival').value = m.rival;

        const dateObj = new Date(m.date);
        document.getElementById('m-date-only').value = m.date.split('T')[0];
        document.getElementById('m-time-only').value = m.date.includes('T') ? m.date.split('T')[1].substring(0, 5) : '';

        document.getElementById('m-condition').value = m.condition;
        document.getElementById('m-location').value = m.location || '';
        document.getElementById('m-score-local').value = m.score_local !== null ? m.score_local : '';
        document.getElementById('m-score-rival').value = m.score_rival !== null ? m.score_rival : '';
        document.getElementById('m-observations').value = m.observations || '';

        document.getElementById('match-modal-title').textContent = 'Editar Partido / Resultado';
        this.showAddModal(true);
    },

    async deleteMatch(id) {
        if (confirm("¿Eliminar este partido del calendario?") && window.supabaseClient) {
            const { error } = await window.supabaseClient.from('matches').delete().eq('id', id);
            if (!error) this.loadMatches();
        }
    },

    showAddModal(show) {
        const modal = document.getElementById('modal-match');
        if (show) modal.classList.add('active');
        else {
            modal.classList.remove('active');
            document.getElementById('match-form').reset();
            document.getElementById('match-edit-id').value = '';
            document.getElementById('match-modal-title').textContent = 'Programar Partido';
        }
    }
};

window.matchesManager = matchesManager;
window.addEventListener('DOMContentLoaded', () => matchesManager.init());
