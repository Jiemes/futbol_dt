const app = {
    showAllBirthdays: false,
    init() {
        document.querySelectorAll('[data-screen]').forEach(item => {
            item.addEventListener('click', () => item.dataset.screen === 'trainings' ? trainingsManager.showCatalog() : this.showScreen(item.dataset.screen, item.hasAttribute('data-board-archive')));
            item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); item.click(); } });
        });
        document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
        document.getElementById('birthday-toggle').addEventListener('click', () => { this.showAllBirthdays = !this.showAllBirthdays; this.updateDashboard(); });
        playersManager.init(); matchesManager.init(); libraryManager.init(); boardsManager.init(); trainingsManager.init();
        this.updateDashboard();
    },
    async refresh() {
        await playersManager.loadPlayers();
        this.updateDashboard();
    },
    showScreen(screen, openSaved = false) {
        if (!document.getElementById(`screen-${screen}`)) return;
        if (screen !== 'trainings') window.trainingsManager?.stopWarmup();
        if (screen !== 'trainings' && location.hash.startsWith('#entrenamientos')) history.replaceState(null, '', location.pathname + location.search);
        document.querySelectorAll('.screen').forEach(element => element.classList.toggle('active', element.id === `screen-${screen}`));
        document.querySelectorAll('.nav-links [data-screen]').forEach(element => element.classList.toggle('active', element.dataset.screen === screen));
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebar-overlay').classList.remove('active');
        document.querySelector('.content-area').scrollTop = 0;
        window.boardsManager?.show(screen, openSaved);
    },
    notify(message, error = false) {
        const element = document.getElementById('app-message');
        element.textContent = message; element.hidden = false; element.dataset.error = String(error);
    },
    updateDashboard() {
        const players = window.playersManager?.players || [];
        document.getElementById('stat-total-players').textContent = players.length;
        document.getElementById('stat-goalkeepers').textContent = players.filter(player => /arquera|portera/i.test(player.position || '')).length;
        const birthdays = Palometas.birthdays(players);
        document.getElementById('stat-bday-month').textContent = birthdays.filter(player => player.birthday.days <= 30).length;
        const list = document.getElementById('birthday-list'); list.replaceChildren();
        if (!birthdays.length) list.innerHTML = '<p class="text-muted">Completá las fechas de nacimiento del plantel para ver los próximos cumpleaños.</p>';
        const toggle = document.getElementById('birthday-toggle');
        toggle.hidden = birthdays.length <= 5; toggle.textContent = this.showAllBirthdays ? 'Ver próximos cinco' : `Ver todos (${birthdays.length})`;
        for (const player of (this.showAllBirthdays ? birthdays : birthdays.slice(0, 5))) {
            const card = document.createElement('article'); card.className = 'birthday-item';
            const when = player.birthday.days === 0 ? '¡Hoy!' : player.birthday.days === 1 ? 'Mañana' : `En ${player.birthday.days} días`;
            const heading = document.createElement('strong'); heading.textContent = Palometas.nameOf(player);
            const date = document.createElement('span'); date.textContent = `${Palometas.formatDate(player.birthday.date)} · ${when}`;
            const button = document.createElement('button'); button.className = 'btn btn-secondary btn-sm'; button.textContent = 'Agendar cumpleaños';
            button.addEventListener('click', () => this.exportBirthdays([player]));
            card.classList.toggle('birthday-today', player.birthday.days === 0); card.append(heading, date, button); list.appendChild(card);
        }
        const missing = players.filter(player => !Palometas.parseDate(player.birthdate)).length;
        document.getElementById('birthdays-missing').textContent = missing ? `${missing} jugadora(s) sin fecha de nacimiento válida.` : '';
        if (window.matchesManager) matchesManager.updateHomeMatches();
        window.trainingsManager?.refreshRoster();
        window.boardsManager?.refreshRoster();
    },
    exportBirthdays(players = playersManager.players) {
        if (!Palometas.birthdays(players).length) { this.notify('No hay cumpleaños válidos para exportar.', true); return; }
        Palometas.download(Palometas.birthdayCalendar(players), 'text/calendar;charset=utf-8', 'cumpleanos-palometas-sub17.ics');
        this.notify('Agenda descargada. Importala en tu calendario y revisá que los avisos estén activados.');
    }
};
window.app = app;
window.addEventListener('DOMContentLoaded', () => app.init());

