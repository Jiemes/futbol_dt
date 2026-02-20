const app = {
    init() {
        this.addEventListeners();
        this.loadPlayers();
        this.updateDashboard();
        console.log("Palometas Web App Iniciada");
    },

    addEventListeners() {
        document.querySelectorAll('.nav-links li').forEach(item => {
            item.addEventListener('click', () => {
                const screen = item.getAttribute('data-screen');
                this.showScreen(screen);
                document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        const target = document.getElementById(`screen-${screenId}`);
        if (target) {
            target.classList.add('active');
            if (screenId === 'tactic') {
                if (window.tacticBoard) {
                    window.tacticBoard.init();
                    window.tacticBoard.renderPlayerPool();
                }
            }
            if (screenId === 'attendance' && window.attendanceManager) attendanceManager.renderAttendanceList();
            if (screenId === 'planning' && window.planningManager) planningManager.init();
            if (screenId === 'library' && window.libraryManager) libraryManager.loadExercises();
            if (screenId === 'stats' && window.statsManager) statsManager.renderStats();
            if (screenId === 'gif-maker' && window.gifMaker) gifMaker.init();
            if (screenId === 'matches' && window.matchesManager) matchesManager.init();
            if (screenId === 'home') this.updateDashboard();
        }
    },

    loadPlayers() {
        // Just refresh local counts and notify other managers
        this.updateDashboard();
    },

    updateDashboard() {
        const players = window.playersManager ? window.playersManager.players : [];

        // Total Players
        const totalEl = document.getElementById('stat-total-players');
        if (totalEl) totalEl.textContent = players.length;

        // Injuries
        const injuredCount = players.filter(p => p.physical_status !== 'Apto').length;
        const injuredEl = document.getElementById('stat-injured-count');
        if (injuredEl) injuredEl.textContent = injuredCount;

        // Category Stats
        const catStats = { '1ra': 0, 'Res': 0, 'Sub17': 0 };
        players.forEach(p => { if (catStats[p.category] !== undefined) catStats[p.category]++; });

        const catList = document.getElementById('category-stats-list');
        if (catList) {
            catList.innerHTML = Object.entries(catStats).map(([cat, count]) => `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span>${cat === '1ra' ? 'Primera' : (cat === 'Res' ? 'Reserva' : 'Sub 17')}</span>
                    <strong style="color:var(--accent-color);">${count} Jugadoras</strong>
                </div>
            `).join('');
        }

        this.checkBirthdays(players);
        if (window.matchesManager) window.matchesManager.updateHomeMatches();
    },

    checkBirthdays(players) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        const monthName = today.toLocaleString('es-ES', { month: 'long' });

        const bdayMonth = [];
        players.forEach(p => {
            if (!p.birthdate) return;
            const [, m, d] = p.birthdate.split('-').map(Number);
            if (m === currentMonth) {
                bdayMonth.push({ name: p.alias, day: d, birthdate: p.birthdate });
            }
        });

        // Update Stat Card
        const bdayStat = document.getElementById('stat-bday-month');
        if (bdayStat) bdayStat.textContent = bdayMonth.length;

        // Update Monthly List
        const monthBox = document.getElementById('monthly-birthdays');
        const listEl = document.getElementById('birthday-list');
        const titleEl = monthBox ? monthBox.querySelector('h3') : null;

        if (bdayMonth.length > 0) {
            if (monthBox) monthBox.style.display = 'block';
            if (titleEl) titleEl.textContent = `🎂 Cumpleaños de ${monthName}`;
            listEl.innerHTML = bdayMonth.sort((a, b) => a.day - b.day).map(b => `
                <div class="mini-ex-item" style="cursor:default; background:rgba(255,152,0,0.1); border-color:rgba(255,152,0,0.3); position:relative;">
                    <div style="font-size:1.1rem; font-weight:bold; color:var(--accent-color);">${b.day}</div>
                    <div style="font-size:0.8rem; color:white;">${b.name}</div>
                    <a href="${this.generateGCalLink(b.name, b.birthdate)}" target="_blank" title="Agregar a Google Calendar" style="position:absolute; top:5px; right:5px; color:var(--accent-color); font-size:0.7rem;">
                        <i class="fas fa-calendar-plus"></i>
                    </a>
                </div>
            `).join('');
        } else {
            if (monthBox) monthBox.style.display = 'none';
        }
    },

    generateGCalLink(name, birthdate) {
        // Formato: YYYYMMDD
        const today = new Date();
        const [y, m, d] = birthdate.split('-').map(Number);
        const eventYear = today.getFullYear();
        const startDate = `${eventYear}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}T100000`;
        const endDate = `${eventYear}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}T110000`;

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=Cumpleaños+${encodeURIComponent(name)}&dates=${startDate}/${endDate}&details=Recordatorio+FUTBOL_DT+Los+Palometas&sf=true&output=xml`;
    },

    syncAllBirthdays() {
        const players = window.playersManager ? window.playersManager.players : [];
        const birthdays = players.filter(p => p.birthdate);

        if (birthdays.length === 0) return;

        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Los Palometas//FUTBOL_DT//ES\n";
        const todayYear = new Date().getFullYear();

        birthdays.forEach(p => {
            const [y, m, d] = p.birthdate.split('-').map(Number);
            // No changes needed for logic, but confirming consistency

            icsContent += "BEGIN:VEVENT\n";
            icsContent += `SUMMARY:Cumpleaños ${p.alias}\n`;
            icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
            icsContent += `DTEND;VALUE=DATE:${dateStr}\n`;
            icsContent += "RRULE:FREQ=YEARLY\n";
            icsContent += "DESCRIPTION:Recordatorio de cumpleaños de la jugadora de Los Palometas FC\n";
            icsContent += "BEGIN:VALARM\nTRIGGER:-PT14H\nACTION:DISPLAY\nDESCRIPTION:Cumpleaños hoy\nEND:VALARM\n";
            icsContent += "END:VEVENT\n";
        });

        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'cumpleaños_palometas.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert("Se ha descargado el archivo para tu agenda. Ábrelo en Google Calendar o Outlook para importar todos los cumpleaños.");
    }
};

window.addEventListener('DOMContentLoaded', () => app.init());
