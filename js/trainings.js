const trainingsManager = {
    sessions: [], current: null, step: 0, fieldPlayers: 10,
    mediaRoot(session = this.current) { return `images/entrenamientos/${session.id}/`; },
    e(value) { return Palometas.escapeHTML(String(value ?? '')); },
    date(value) { return value.split('-').reverse().join('/'); },
    init() {
        this.sessions = [...(window.PALOMETAS_TRAININGS || [])].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
        this.renderCatalog();
        this.renderHome();
        document.addEventListener('click', event => {
            const button = event.target.closest('[data-training-open], [data-training-catalog], [data-training-step], [data-training-motion], [data-training-enlarge], [data-training-copy]');
            if (!button) return;
            if (button.hasAttribute('data-training-open')) this.openSession(button.dataset.trainingOpen);
            else if (button.hasAttribute('data-training-catalog')) this.showCatalog();
            else if (button.hasAttribute('data-training-step')) this.goTo(Number(button.dataset.trainingStep));
            else if (button.hasAttribute('data-training-motion')) this.toggleMotion(button);
            else if (button.hasAttribute('data-training-enlarge')) this.enlarge(button);
            else if (button.hasAttribute('data-training-copy')) this.copyLink();
        });
        document.getElementById('training-guide').addEventListener('change', event => {
            if (event.target.id !== 'training-player-count') return;
            const count = Number(event.target.value);
            if (![9, 10, 11, 12].includes(count)) return;
            this.fieldPlayers = count;
            this.renderStage();
            this.updateCount();
        });
        window.addEventListener('hashchange', () => this.route());
        if (location.hash.startsWith('#entrenamientos')) this.route();
    },
    renderHome() {
        const session = this.sessions[0], root = document.getElementById('home-training');
        if (!session) return;
        root.innerHTML = `<article class="training-home-card"><div><p class="eyebrow">ÚLTIMO ENTRENAMIENTO CARGADO</p><h2>${this.date(session.uploadedAt)} <span>· ${this.e(session.title)}</span></h2><p>${session.start}–${session.end} · ${session.stages.length} pasos · Arquera desde las ${session.goalkeeperFrom}</p></div><button type="button" class="btn btn-primary" data-training-open="${this.e(session.id)}">Recorrer entrenamiento <span aria-hidden="true">→</span></button></article>`;
    },
    renderCatalog() {
        document.getElementById('trainings-catalog').innerHTML = this.sessions.length ? `<div class="training-catalog-grid">${this.sessions.map(session => `<article class="training-session-card"><div class="training-cover"><img src="${this.mediaRoot(session)}portada.svg" width="900" height="520" alt="Campo de fútbol con apoyos y una opción de ataque" loading="lazy"><span class="training-cover-label">SESIÓN · SUB 17</span></div><div class="training-session-info"><p class="training-upload-label">Fecha de carga</p><h2>${this.date(session.uploadedAt)}</h2><h3>${this.e(session.title)}</h3><div class="training-tags"><span>${session.start}–${session.end}</span><span>${session.stages.length} pasos</span><span>10–12 habituales</span></div><p>${this.e(session.objective)}</p><p class="training-keeper-line"><i class="fas fa-hand-paper" aria-hidden="true"></i> Arquera desde las ${session.goalkeeperFrom}</p><button type="button" class="btn btn-primary" data-training-open="${this.e(session.id)}">Abrir entrenamiento <span aria-hidden="true">→</span></button></div></article>`).join('')}</div>` : '<p class="empty-state">Todavía no hay entrenamientos cargados.</p>';
    },
    navigate(hash) { if (location.hash === hash) this.route(); else location.hash = hash; },
    showCatalog() { this.navigate('#entrenamientos'); },
    openSession(id) { this.navigate(`#entrenamientos/${encodeURIComponent(id)}/paso-1`); },
    goTo(index) {
        if (!this.current || !Number.isInteger(index) || index < 0 || index >= this.current.stages.length) return;
        this.navigate(`#entrenamientos/${encodeURIComponent(this.current.id)}/paso-${index + 1}`);
    },
    route() {
        if (!location.hash.startsWith('#entrenamientos')) return;
        const parts = location.hash.slice(1).split('/');
        let id;
        try { id = decodeURIComponent(parts[1] || ''); } catch { id = ''; }
        const session = this.sessions.find(item => item.id === id);
        const wasOpen = this.current?.id === session?.id && !document.getElementById('training-guide').hidden;
        app.showScreen('trainings');
        const catalog = document.getElementById('trainings-catalog'), guide = document.getElementById('training-guide');
        if (!session) { catalog.hidden = false; guide.hidden = true; this.current = null; return; }
        const match = /^paso-(\d+)$/.exec(parts[2] || '');
        const requestedStep = match ? Number(match[1]) - 1 : 0;
        this.step = Math.max(0, Math.min(session.stages.length - 1, requestedStep));
        if (this.current?.id !== session.id) {
            this.current = session; this.fieldPlayers = session.defaultFieldPlayers;
            this.renderGuide();
        }
        catalog.hidden = true; guide.hidden = false;
        this.renderStage(); this.updateCount();
        document.getElementById('training-step-heading').focus({ preventScroll: true });
        if (wasOpen) document.getElementById('training-stage').scrollIntoView({ block: 'start' });
    },
    renderGuide() {
        const s = this.current;
        document.getElementById('training-guide').innerHTML = `
            <div class="training-back-row"><button type="button" class="training-text-button" data-training-catalog>← Todas las fechas</button><button type="button" class="training-text-button" data-training-copy>Copiar enlace al paso</button></div>
            <div class="training-guide-intro"><div><p class="training-upload-label">Fecha de carga · práctica ${this.date(s.date)}</p><h2>${this.date(s.uploadedAt)}</h2><h3>${this.e(s.title)}</h3><p>${this.e(s.objective)}</p><div class="training-tags"><span>${s.start}–${s.end}</span><span>120 min con pausas</span><span>Arquera desde ${s.goalkeeperFrom}</span></div></div><div class="training-count-control"><label for="training-player-count">Jugadoras de campo hoy</label><select id="training-player-count">${[9, 10, 11, 12].map(n => `<option value="${n}" ${n === this.fieldPlayers ? 'selected' : ''}>${n} de campo</option>`).join('')}</select><p>La arquera se cuenta aparte y llega a las ${s.goalkeeperFrom}.</p><strong id="training-attendance" role="status"></strong></div></div>
            <details class="training-preparation"><summary>Antes de empezar · materiales y armado</summary><div class="training-preparation-grid"><div><h3>Materiales</h3><ul>${s.equipment.map(item => `<li>${this.e(item)}</li>`).join('')}</ul></div><div><h3>Preparar el campo</h3><p>${this.e(s.preparation)}</p><p>${this.e(s.coaching)}</p></div></div></details>
            <div class="training-workspace"><nav class="training-timeline" aria-label="Pasos del entrenamiento">${s.stages.map((stage, index) => `<button type="button" class="training-timeline-step" data-training-step="${index}"><span class="training-step-number">${index + 1}</span><span><strong>${this.e(stage.shortTitle)}</strong><small>${stage.start}–${stage.end} · ${stage.minutes} min</small></span>${stage.id === 'integrar-arquera' ? '<span class="training-gk-dot" aria-label="Se incorpora la arquera"></span>' : ''}</button>`).join('')}</nav><article class="training-stage" id="training-stage"></article></div>
            <details class="training-references"><summary>Ideas que compartiste · 9 reels de Instagram</summary><p>Guardamos los nueve enlaces para consultarlos. Instagram no permitió revisar los videos de forma fiable al preparar esta sesión; no se les atribuye ninguno de los ejercicios. Los esquemas y GIFs del recorrido son propios.</p><div class="training-reels-grid">${s.references.map(ref => `<a href="https://www.instagram.com/reel/${encodeURIComponent(ref.code)}/" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram" aria-hidden="true"></i><span>${this.e(ref.title)}<small>Abrir en Instagram ↗</small></span></a>`).join('')}</div></details>
            <details class="training-references"><summary>Referencias para preparar la sesión</summary><p>Adaptación propia para este grupo. Los GIFs muestran una solución posible, no un recorrido obligatorio. Las referencias aportan principios de apoyo, orientación corporal, combinación y aumento gradual de intensidad; no son una reproducción de esas sesiones.</p><ul>${s.sources.map(source => `<li><a href="${this.e(source.url)}" target="_blank" rel="noopener noreferrer">${this.e(source.title)} ↗</a></li>`).join('')}</ul></details>`;
    },
    updateCount() {
        document.getElementById('training-attendance').textContent = `${this.fieldPlayers} hasta las 20 · ${this.fieldPlayers + 1} desde las 20`;
    },
    list(items, ordered = false) { const tag = ordered ? 'ol' : 'ul'; return `<${tag}>${items.map(item => `<li>${this.e(item)}</li>`).join('')}</${tag}>`; },
    legend() { return '<div class="training-legend"><span><i class="red"></i>Equipo</span><span><i class="blue"></i>Rival</span><span><i class="neutral"></i>Apoyo neutral</span><span><i class="keeper"></i>Arquera</span><span><i class="ball"></i>Pelota</span></div>'; },
    media({ title, staticHTML, gif, example, caption }) {
        return `<figure class="training-media"><div class="training-static">${staticHTML}</div>${gif ? `<div class="training-motion" hidden><img data-gif="${this.mediaRoot() + gif}" alt="${this.e(title)}: ejemplo de movimiento" width="900" height="600"></div>` : ''}<figcaption><span>${this.e(caption || (gif ? 'Armado: grupo elegido. GIF: ' + example + '.' : 'Ubicación inicial de referencia; ajustar el espacio a cómo resuelve el grupo.'))}</span><div class="training-media-actions">${gif ? '<button type="button" class="btn btn-primary btn-sm" data-training-motion aria-pressed="false">▶ Ver movimiento</button>' : ''}<button type="button" class="btn btn-secondary btn-sm" data-training-enlarge>Ampliar armado</button>${gif ? `<a class="training-download" href="${this.mediaRoot() + gif}" download>Descargar GIF</a>` : ''}</div></figcaption></figure>`;
    },
    stationHTML(station, index) {
        const count = TrainingBoards.groups(this.fieldPlayers)[index];
        let format;
        if (station.id === 'pase') format = count === 4 ? 'Dos parejas: 4 jugadoras, dos pelotas.' : 'Un trío: pasadora, receptora y apoyo.';
        if (station.id === 'rondo') format = count === 4 ? '3 contra 1.' : '2 contra 1; ampliar si la defensora cierra todas las líneas.';
        if (station.id === 'duelo') format = `1 contra 1 + ${count - 2} ${count === 3 ? 'apoyo neutral' : 'apoyos neutrales'}.`;
        return `<details class="training-station" ${index === 0 ? 'open' : ''}><summary><span class="training-station-letter">${station.letter}</span><span>${this.e(station.title)}<small>${station.dimension} · Inicio con ${count} jugadoras; después llegan los otros grupos</small></span></summary><div class="training-station-body"><p class="training-focus">${this.e(station.objective)}</p><p class="training-formation">${this.e(format)}</p>${this.list(station.steps, true)}<div class="training-challenge"><strong>El reto</strong><p>${this.e(station.score)}</p></div><p class="training-coach-cue"><strong>Mirar:</strong> ${this.e(station.cue)}</p>${this.media({ title: station.title, staticHTML: `<img src="${this.mediaRoot() + station.gif.replace('.gif', '.png')}" alt="${this.e(station.title)}: disposición del ejemplo animado" width="900" height="600" loading="lazy">`, gif: station.gif, example: station.example, caption: 'Esquema y GIF de ejemplo: ' + station.example + '. Usar la variante indicada para cada grupo.' })}</div></details>`;
    },
    renderStage() {
        const stage = this.current.stages[this.step], last = this.step === this.current.stages.length - 1;
        const root = this.mediaRoot();
        let visual;
        if (stage.type === 'warmup') visual = this.media({ title: stage.title, staticHTML: `<img src="${root}movilidad.svg" alt="Cuatro preparaciones: tobillo, cadera, fuerza y frenada controlada" width="900" height="640">`, caption: 'Guía visual esquemática. Acompañarla con la demostración del entrenador y las consignas de abajo.' });
        else if (stage.type === 'cooldown') visual = `<div class="training-closing-visual"><span aria-hidden="true">✓</span><p>Una compañera libre.<br>Una decisión compartida.</p><small>Dos ideas para llevar al próximo partido.</small></div>`;
        else visual = this.media({ title: stage.title, staticHTML: TrainingBoards.render(stage.type, this.fieldPlayers), gif: stage.gif, example: stage.example });
        document.getElementById('training-stage').innerHTML = `
            <div class="training-stage-topline"><span>PASO ${this.step + 1} DE ${this.current.stages.length}</span><span>${stage.start}–${stage.end} <strong>· ${stage.minutes} min</strong></span></div>
            <div class="training-progress" role="progressbar" aria-label="Posición en el recorrido" aria-valuemin="1" aria-valuemax="${this.current.stages.length}" aria-valuenow="${this.step + 1}"><span style="width:${(this.step + 1) / this.current.stages.length * 100}%"></span></div>
            <h2 id="training-step-heading" tabindex="-1">${this.e(stage.title)}</h2><p class="training-focus">${this.e(stage.focus)}</p>
            <div class="training-rolebar"><strong>${this.e(TrainingBoards.description(stage.type, this.fieldPlayers))}</strong><span class="${stage.goalkeeper ? 'with-keeper' : ''}">${stage.goalkeeper ? 'Con arquera' : 'Sin arquera'}</span></div>
            ${visual}${stage.type !== 'warmup' && stage.type !== 'cooldown' ? this.legend() : ''}
            <div class="training-instruction-grid"><section><h3>Cómo organizarlo</h3><p>${this.e(stage.organization)}</p></section><section><h3>Trabajo y pausas</h3><p>${this.e(stage.timing)}</p></section></div>
            <section class="training-instructions"><h3>Consigna paso a paso</h3>${this.list(stage.instructions, true)}</section>
            ${stage.stations ? `<section class="training-stations"><h3>Abrí cada estación para ver el ejercicio</h3>${stage.stations.map((station, index) => this.stationHTML(station, index)).join('')}</section>` : ''}
            <section class="training-cues"><h3>Qué observar y decir</h3>${this.list(stage.cues)}</section>
            <details class="training-adjustments"><summary>Ajustar la dificultad</summary><div class="training-instruction-grid"><div><h4>Para facilitar</h4><p>${this.e(stage.easier)}</p></div><div><h4>Para progresar</h4><p>${this.e(stage.harder)}</p></div></div></details>
            ${stage.care ? `<p class="training-care">${this.e(stage.care)}</p>` : ''}
            <div class="training-step-footer"><button type="button" class="btn btn-secondary" data-training-step="${this.step - 1}" ${this.step === 0 ? 'disabled' : ''}>← Anterior</button><span>${stage.end} · ${last ? 'Fin de la práctica' : 'Siguiente: ' + this.e(this.current.stages[this.step + 1].shortTitle)}</span>${last ? '<button type="button" class="btn btn-primary" data-training-catalog>Volver a las fechas</button>' : `<button type="button" class="btn btn-primary" data-training-step="${this.step + 1}">Siguiente →</button>`}</div>`;
        document.querySelectorAll('.training-timeline-step').forEach((button, index) => {
            button.classList.toggle('is-current', index === this.step);
            if (index === this.step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
        });
    },
    toggleMotion(button) {
        const media = button.closest('.training-media'), motion = media.querySelector('.training-motion'), image = motion.querySelector('img');
        const play = motion.hidden;
        if (play) image.src = image.dataset.gif; else image.removeAttribute('src');
        motion.hidden = !play; media.querySelector('.training-static').hidden = play;
        button.setAttribute('aria-pressed', String(play)); button.textContent = play ? '■ Ver armado' : '▶ Ver movimiento';
    },
    enlarge(button) {
        const content = button.closest('.training-media').querySelector('.training-static').innerHTML;
        const enlarged = document.getElementById('training-enlarged'); enlarged.innerHTML = content;
        document.getElementById('training-media-dialog').showModal();
    },
    async copyLink() {
        try { await navigator.clipboard.writeText(location.href); app.notify('Enlace al paso copiado.'); }
        catch { app.notify('Podés copiar el enlace de este paso desde la barra de direcciones.'); }
    }
};
window.trainingsManager = trainingsManager;
