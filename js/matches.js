const matchesManager = {
    matches: [],
    init() {
        document.getElementById('match-form').addEventListener('submit', event => { event.preventDefault(); this.saveMatch(); });
        document.getElementById('add-scorer').addEventListener('click', () => this.addScorer());
        document.getElementById('match-tournament-filter').addEventListener('change', () => this.renderMatches());
    },
    async loadMatches() {
        if (!window.db || !window.auth?.currentUser) return;
        try {
            const snapshot = await window.db.collection('matches').get();
            this.matches = Palometas.sortMatches(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter(Palometas.isSub17));
            const filter = document.getElementById('match-tournament-filter'), previous = filter.value;
            filter.replaceChildren(new Option('Todos', ''));
            [...new Set(this.matches.map(match => match.tournament).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')).forEach(name => filter.add(new Option(name, name)));
            if ([...filter.options].some(option => option.value === previous)) filter.value = previous;
            this.renderMatches(); this.updateHomeMatches();
        } catch (error) { console.error(error); app.notify('No se pudo cargar el fixture. Revisá la conexión y volvé a intentar.', true); }
    },
    renderMatches() {
        const grid = document.getElementById('matches-grid'), tournament = document.getElementById('match-tournament-filter').value;
        grid.replaceChildren();
        const matches = this.matches.filter(match => !tournament || match.tournament === tournament);
        if (!matches.length) grid.innerHTML = '<p class="empty-state">Todavía no hay partidos. Podés cargar los rivales aunque el día y el horario estén a confirmar.</p>';
        for (const match of matches) grid.appendChild(this.matchCard(match));
    },
    matchCard(match, compact = false) {
        const escape = Palometas.escapeHTML;
        const card = document.createElement('article'); card.className = 'config-card fixture-card';
        const time = match.date?.includes('T') ? match.date.split('T')[1].slice(0, 5) : '';
        const scorers = Array.isArray(match.scorers) ? match.scorers : [];
        card.innerHTML = (match.tournament ? '<span class="badge">' + escape(match.tournament) + '</span>' : '') +
            '<h2>' + escape(match.round ? 'Fecha ' + match.round + ' · ' : '') + 'Palometas vs. ' + escape(match.rival) + '</h2>' +
            '<p class="text-muted">' + escape(Palometas.formatDate(match.date)) + (time && time !== '00:00' ? ' · ' + escape(time) + ' h' : '') + '<br>' +
            escape([match.condition, match.location].filter(Boolean).join(' · ') || 'Cancha a confirmar') + '</p>' +
            (Palometas.isPlayed(match) ? '<p class="result" aria-label="Resultado: Palometas ' + match.score_local + ', rival ' + match.score_rival + '">' + match.score_local + ' – ' + match.score_rival + '</p>' : '') +
            (!compact && scorers.length ? '<p>Goles: ' + escape(scorers.map(row => row.name + (row.goals > 1 ? ' × ' + row.goals : '')).join(', ')) + '</p>' : '') +
            (!compact && match.observations ? '<p class="text-muted">' + escape(match.observations) + '</p>' : '');
        if (!compact) {
            const buttons = document.createElement('div'); buttons.className = 'button-row';
            const edit = document.createElement('button'); edit.className = 'btn btn-secondary btn-sm'; edit.textContent = 'Editar / cargar resultado';
            edit.addEventListener('click', () => this.editMatch(match.id));
            const remove = document.createElement('button'); remove.className = 'btn btn-secondary btn-sm btn-danger'; remove.textContent = 'Borrar';
            remove.addEventListener('click', () => this.deleteMatch(match.id));
            buttons.append(edit, remove); card.appendChild(buttons);
        }
        return card;
    },
    updateHomeMatches() {
        const container = document.getElementById('home-next-matches'); if (!container) return;
        container.replaceChildren();
        const today = Palometas.todayISO();
        const next = this.matches.filter(match => !Palometas.isPlayed(match) && (!match.date || match.date.slice(0, 10) >= today)).slice(0, 3);
        if (!next.length) container.innerHTML = '<p class="empty-state">Sin próximos partidos cargados.</p>';
        next.forEach(match => container.appendChild(this.matchCard(match, true)));
    },
    editMatch(id) {
        const match = id ? this.matches.find(item => item.id === id) : {};
        if (!match) return;
        document.getElementById('match-form').reset();
        document.getElementById('match-edit-id').value = match.id || '';
        for (const [field, value] of Object.entries({
            'm-rival': match.rival, 'm-tournament': match.tournament, 'm-round': match.round,
            'm-date': match.date?.slice(0, 10), 'm-time': match.date?.includes('T') ? match.date.split('T')[1].slice(0, 5) : '',
            'm-condition': match.condition, 'm-location': match.location, 'm-score-local': match.score_local,
            'm-score-rival': match.score_rival, 'm-observations': match.observations
        })) document.getElementById(field).value = value ?? '';
        document.getElementById('scorer-list').replaceChildren();
        (Array.isArray(match.scorers) ? match.scorers : []).forEach(row => this.addScorer(row));
        document.getElementById('match-details').open = Palometas.isPlayed(match) || Boolean(match.scorers?.length);
        document.getElementById('match-title').textContent = id ? 'Editar partido' : 'Agregar partido';
        document.getElementById('match-form-error').textContent = '';
        document.getElementById('match-dialog').showModal();
    },
    addScorer(value = {}) {
        const row = document.createElement('div'); row.className = 'scorer-row';
        const select = document.createElement('select'); select.setAttribute('aria-label', 'Goleadora');
        select.add(new Option('Elegir jugadora', ''));
        playersManager.players.forEach(player => select.add(new Option(Palometas.nameOf(player), player.id)));
        if (value.player_id && ![...select.options].some(option => option.value === value.player_id)) select.add(new Option(value.name || 'Jugadora anterior', value.player_id));
        select.value = value.player_id || '';
        const goals = document.createElement('input'); goals.type = 'number'; goals.min = '1'; goals.max = '99'; goals.step = '1'; goals.value = value.goals ?? 1; goals.setAttribute('aria-label', 'Cantidad de goles');
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-secondary btn-sm'; remove.textContent = 'Quitar';
        remove.addEventListener('click', () => row.remove()); row.append(select, goals, remove);
        document.getElementById('scorer-list').appendChild(row);
    },
    async saveMatch() {
        if (!window.db || !window.auth?.currentUser) return;
        const button = document.getElementById('match-save'); if (button.disabled) return;
        const errorElement = document.getElementById('match-form-error'); errorElement.textContent = '';
        button.disabled = true;
        try {
            const read = id => document.getElementById(id).value;
            const scorers = [...document.querySelectorAll('#scorer-list .scorer-row')].map(row => ({
                player_id: row.querySelector('select').value,
                name: row.querySelector('select').selectedOptions[0]?.textContent || '',
                goals: row.querySelector('input').value
            }));
            const data = Palometas.matchPayload({ rival: read('m-rival'), tournament: read('m-tournament'), round: read('m-round'),
                date: read('m-date'), time: read('m-time'), condition: read('m-condition'), location: read('m-location'),
                score_local: read('m-score-local'), score_rival: read('m-score-rival'), observations: read('m-observations') }, scorers);
            const id = read('match-edit-id');
            if (id) await window.db.collection('matches').doc(id).update(data);
            else await window.db.collection('matches').add(data);
            await this.loadMatches(); document.getElementById('match-dialog').close(); app.notify('Partido guardado.');
        } catch (error) { console.error(error); errorElement.textContent = error.message || 'No se pudo guardar el partido.'; }
        finally { button.disabled = false; }
    },
    async deleteMatch(id) {
        if (!window.db || !window.auth?.currentUser || !this.matches.some(match => match.id === id) || !confirm('¿Borrar este partido del fixture?')) return;
        try { await window.db.collection('matches').doc(id).delete(); await this.loadMatches(); app.notify('Partido borrado.'); }
        catch (error) { console.error(error); app.notify('No se pudo borrar el partido.', true); }
    }
};
window.matchesManager = matchesManager;

