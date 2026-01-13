const statsManager = {
    async init() {
        console.log("Iniciando stats manager...");
        await this.renderStats();
    },

    async renderStats() {
        if (!window.supabaseClient || !window.playersManager) return;

        const container = document.getElementById('stats-content');
        if (!container) return;

        container.innerHTML = '<p class="text-muted">Calculando estadísticas...</p>';

        const players = window.playersManager.players;
        const categories = ['1ra', 'Res', 'Sub17'];

        // Fetch all attendance
        const { data: allAtt } = await window.supabaseClient.from('attendance').select('*');
        // Fetch all matches
        const { data: allMatches } = await window.supabaseClient.from('matches').select('*');
        // Fetch all training plans
        const { count: totalPlans } = await window.supabaseClient.from('planning').select('*', { count: 'exact', head: true });

        // Build Category Stats Array
        const catStats = categories.map(cat => {
            const catPlayers = players.filter(p => p.category === cat);
            const playerIds = catPlayers.map(p => p.id);

            // Attendance
            const catAtt = (allAtt || []).filter(r => playerIds.includes(r.player_id));
            const distinctDates = [...new Set(catAtt.map(r => r.training_date))];
            const sessions = distinctDates.length;
            const presence = catAtt.filter(r => r.present).length;
            const avgAtt = (sessions > 0 && catPlayers.length > 0)
                ? Math.round((presence / (sessions * catPlayers.length)) * 100)
                : 0;

            // Matches
            const catMatches = (allMatches || []).filter(m => m.category === cat && m.score_local !== null && m.score_rival !== null);
            let gf = 0, ga = 0, pts = 0;

            catMatches.forEach(m => {
                const isLocal = m.condition === 'Local';
                const sLocal = parseInt(m.score_local);
                const sRival = parseInt(m.score_rival);

                if (isLocal) {
                    gf += sLocal; ga += sRival;
                    if (sLocal > sRival) pts += 3;
                    else if (sLocal === sRival) pts += 1;
                } else {
                    gf += sRival; ga += sLocal;
                    if (sRival > sLocal) pts += 3;
                    else if (sRival === sLocal) pts += 1;
                }
            });

            return {
                name: cat === '1ra' ? 'Primera' : (cat === 'Res' ? 'Reserva' : 'Sub 17'),
                count: catPlayers.length,
                avgAtt,
                sessions,
                played: catMatches.length,
                gf, ga, pts
            };
        });

        // Overall stats top bar
        let html = `
            <div class="stats-overview" style="margin-bottom:30px;">
                <div class="stat-box">
                    <span class="stat-number">${players.length}</span>
                    <span class="stat-label">Total Jugadoras</span>
                </div>
                <div class="stat-box">
                    <span class="stat-number">${totalPlans || 0}</span>
                    <span class="stat-label">Entrenamientos Realizados</span>
                </div>
                <div class="stat-box">
                    <span class="stat-number">${allMatches ? allMatches.filter(m => m.score_local !== null).length : 0}</span>
                    <span class="stat-label">Partidos Jugados</span>
                </div>
            </div>

            <div class="stats-grid-categories" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        `;

        catStats.forEach(s => {
            html += `
                <div class="config-card" style="padding:20px;">
                    <h3 style="color:var(--accent-color); border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:15px; display:flex; justify-content:space-between;">
                        ${s.name}
                        <span style="font-size:0.9rem; color:var(--text-muted);">${s.count} Jugadoras</span>
                    </h3>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <small class="text-muted">ENTRENAMIENTO</small>
                            <div style="font-size:1.1rem; font-weight:bold;">${s.avgAtt}% <span style="font-size:0.8rem; font-weight:normal; opacity:0.6">Asist.</span></div>
                            <div style="font-size:0.9rem; opacity:0.8">${s.sessions} Sesiones</div>
                        </div>
                        <div>
                            <small class="text-muted">TORNEO</small>
                            <div style="font-size:1.1rem; font-weight:bold;">${s.pts} Puntos</div>
                            <div style="font-size:0.9rem; opacity:0.8">${s.played} Partidos</div>
                        </div>
                    </div>

                    <div style="margin-top:15px; background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; display:flex; justify-content:space-around; text-align:center;">
                        <div>
                            <div style="font-size:0.7rem; color:var(--text-muted);">GOLES FAVOR</div>
                            <div style="font-weight:bold; color:#2ecc71;">${s.gf}</div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem; color:var(--text-muted);">GOLES CONTRA</div>
                            <div style="font-weight:bold; color:#e74c3c;">${s.ga}</div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem; color:var(--text-muted);">DIF. GOL</div>
                            <div style="font-weight:bold;">${s.gf - s.ga}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }
};

window.statsManager = statsManager;
window.addEventListener('DOMContentLoaded', () => statsManager.init());
