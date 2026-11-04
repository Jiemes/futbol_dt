const trainingsManager = {
    sessions: [], current: null, step: 0, fieldPlayers: 10,
    selectedIds: [], draftIds: new Set(), keeperId: null, rosterSignature: '', warmupIndex: 0, animationFrame: null, rosterChoiceMade: false, autoRoster: false,
    mediaRoot(session = this.current) { return `images/entrenamientos/${session.id}/`; },
    asset(file) { return `${this.mediaRoot()}${file}?v=20261104-2`; },
    e(value) { return Palometas.escapeHTML(String(value ?? '')); },
    date(value) { return value.split('-').reverse().join('/'); },
    init() {
        this.sessions = [...(window.PALOMETAS_TRAININGS || [])].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
        this.renderCatalog();
        this.renderHome();
        document.addEventListener('click', event => {
            const button = event.target.closest('[data-training-open], [data-training-catalog], [data-training-step], [data-training-motion], [data-training-enlarge], [data-training-copy], [data-training-roster-apply], [data-training-roster-clear], [data-training-warmup], [data-training-pick-roster]');
            if (!button) return;
            if (button.hasAttribute('data-training-open')) this.openSession(button.dataset.trainingOpen);
            else if (button.hasAttribute('data-training-catalog')) this.showCatalog();
            else if (button.hasAttribute('data-training-step')) this.goTo(Number(button.dataset.trainingStep));
            else if (button.hasAttribute('data-training-motion')) this.toggleMotion(button);
            else if (button.hasAttribute('data-training-enlarge')) this.enlarge(button);
            else if (button.hasAttribute('data-training-copy')) this.copyLink();
            else if (button.hasAttribute('data-training-roster-apply')) this.applyRoster();
            else if (button.hasAttribute('data-training-roster-clear')) this.clearRoster();
            else if (button.hasAttribute('data-training-warmup')) this.changeWarmup(Number(button.dataset.trainingWarmup));
            else if (button.hasAttribute('data-training-pick-roster')) { const picker = document.querySelector('.training-roster'); picker.open = true; picker.scrollIntoView({ block: 'start' }); }
        });
        document.getElementById('training-guide').addEventListener('change', event => {
            if (event.target.id === 'training-warmup-move') { this.changeWarmup(Number(event.target.value)); return; }
            if (event.target.matches('[data-training-present]')) {
                if (event.target.checked) this.draftIds.add(event.target.value); else this.draftIds.delete(event.target.value);
                document.getElementById('training-roster-count').textContent = `${this.draftIds.size} de campo seleccionadas`;
                return;
            }
            if (event.target.id === 'training-keeper-select') { this.keeperId = event.target.value; return; }
            if (event.target.id !== 'training-player-count') return;
            const count = Number(event.target.value);
            if (![9, 10, 11, 12].includes(count)) return;
            this.fieldPlayers = count;
            this.renderStage();
            this.updateCount();
        });
        window.addEventListener('hashchange', () => this.route());
        document.addEventListener('visibilitychange', () => { if (document.hidden) this.stopWarmup(); });
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
        if (!session) { this.stopWarmup(); catalog.hidden = false; guide.hidden = true; this.current = null; return; }
        const match = /^paso-(\d+)$/.exec(parts[2] || '');
        const requestedStep = match ? Number(match[1]) - 1 : 0;
        this.step = Math.max(0, Math.min(session.stages.length - 1, requestedStep));
        if (this.current?.id !== session.id) {
            this.current = session; this.restoreRoster(); this.warmupIndex = 0;
            this.fieldPlayers = this.selectedIds.length || session.defaultFieldPlayers;
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
            <details class="training-preparation training-roster"><summary>Elegí a las chicas para formar los grupos</summary><p>Marcá a las presentes y vas a ver directamente sus nombres en cada grupo y sobre el campo.</p><div id="training-roster-picker"></div></details>
            <div class="training-workspace"><nav class="training-timeline" aria-label="Pasos del entrenamiento">${s.stages.map((stage, index) => `<button type="button" class="training-timeline-step" data-training-step="${index}"><span class="training-step-number">${index + 1}</span><span><strong>${this.e(stage.shortTitle)}</strong><small>${stage.start}–${stage.end} · ${stage.minutes} min</small></span>${stage.id === 'integrar-arquera' ? '<span class="training-gk-dot" aria-label="Se incorpora la arquera"></span>' : ''}</button>`).join('')}</nav><article class="training-stage" id="training-stage"></article></div>
            <details class="training-references"><summary>Tus reels guardados</summary><div class="training-reels-grid">${s.references.map(ref => `<a href="https://www.instagram.com/reel/${encodeURIComponent(ref.code)}/" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram" aria-hidden="true"></i><span>${this.e(ref.title)}<small>Abrir en Instagram ↗</small></span></a>`).join('')}</div></details>`;
        this.rosterSignature = ''; this.refreshRoster();
    },
    updateCount() {
        document.getElementById('training-attendance').textContent = `${this.fieldPlayers} hasta las 20 · ${this.fieldPlayers + 1} desde las 20`;
        const select = document.getElementById('training-player-count');
        select.value = String(this.fieldPlayers); select.disabled = this.selectedIds.length > 0;
    },
    selectedPlayers() {
        const roster = window.playersManager?.players || [];
        return this.selectedIds.map(id => roster.find(player => player.id === id)).filter(Boolean);
    },
    restoreRoster() {
        this.selectedIds = []; this.keeperId = null; this.rosterChoiceMade = false; this.autoRoster = false;
        try {
            const saved = JSON.parse(localStorage.getItem(`palometas-training-roster-${this.current.id}`) || 'null');
            if (saved && Array.isArray(saved.ids) && saved.ids.length <= 12 && (saved.ids.length === 0 || saved.ids.length >= 9) && saved.ids.every(id => typeof id === 'string')) {
                this.selectedIds = [...new Set(saved.ids)];
                this.keeperId = typeof saved.keeperId === 'string' ? saved.keeperId : null;
                this.rosterChoiceMade = true; this.autoRoster = saved.auto === true;
            }
        } catch { /* La selección también puede usarse sin almacenamiento local. */ }
        this.draftIds = new Set(this.selectedIds);
    },
    saveRoster() {
        try { localStorage.setItem(`palometas-training-roster-${this.current.id}`, JSON.stringify({ ids: this.selectedIds, keeperId: this.keeperId, auto: this.autoRoster })); }
        catch { /* No bloquear el reparto si el navegador no permite guardarlo. */ }
    },
    renderRoster() {
        const root = document.getElementById('training-roster-picker'); if (!root) return;
        const roster = window.playersManager?.players || [], fields = roster.filter(player => !TrainingLineups.isKeeper(player)), keepers = roster.filter(TrainingLineups.isKeeper);
        if (!fields.length) { root.innerHTML = '<p class="text-muted">Cuando se cargue el plantel, vas a ver los nombres para elegir a las presentes.</p>'; return; }
        const keeperId = this.keeperId === null ? (keepers.length === 1 ? keepers[0].id : '') : this.keeperId;
        root.innerHTML = `<div class="training-roster-grid">${fields.map(player => `<label class="training-roster-player"><input type="checkbox" data-training-present value="${this.e(player.id)}" ${this.draftIds.has(player.id) ? 'checked' : ''}><span><strong>${this.e(Palometas.nameOf(player))}</strong></span></label>`).join('')}</div><label class="training-keeper-select" for="training-keeper-select">Arquera que se suma desde las 20</label><select id="training-keeper-select"><option value="">Asignar después</option>${keepers.map(player => `<option value="${this.e(player.id)}" ${player.id === keeperId ? 'selected' : ''}>${this.e(Palometas.nameOf(player))}</option>`).join('')}</select><div class="button-row training-roster-actions"><strong id="training-roster-count" role="status">${this.draftIds.size} de campo seleccionadas</strong><button type="button" class="btn btn-primary btn-sm" data-training-roster-apply>Usar estas chicas</button><button type="button" class="btn btn-secondary btn-sm" data-training-roster-clear>Limpiar selección</button></div><p id="training-roster-error" class="form-error" role="alert"></p><p class="text-muted">Elegí de 9 a 12 chicas de campo y sumá la arquera aparte. Podés cambiar las presentes antes de cada práctica.</p>`;
    },
    applyRoster() {
        const fields = (window.playersManager?.players || []).filter(player => !TrainingLineups.isKeeper(player));
        const ids = [...document.querySelectorAll('[data-training-present]:checked')].map(input => input.value).filter(id => fields.some(player => player.id === id));
        if (ids.length < 9 || ids.length > 12) { document.getElementById('training-roster-error').textContent = 'Elegí entre 9 y 12 jugadoras de campo para armar este entrenamiento.'; return; }
        this.selectedIds = ids; this.draftIds = new Set(ids); this.keeperId = document.getElementById('training-keeper-select').value;
        this.fieldPlayers = ids.length; this.rosterChoiceMade = true; this.autoRoster = false; this.saveRoster(); this.updateCount(); this.renderRoster(); this.renderStage();
    },
    clearRoster() { this.selectedIds = []; this.draftIds.clear(); this.rosterChoiceMade = true; this.autoRoster = false; this.saveRoster(); this.renderRoster(); this.updateCount(); this.renderStage(); },
    refreshRoster() {
        if (!this.current || !document.getElementById('training-roster-picker')) return;
        const roster = window.playersManager?.players || [];
        if (!roster.length) { this.renderRoster(); this.updateCount(); this.renderStage(); return; }
        const fields = roster.filter(player => !TrainingLineups.isKeeper(player));
        if (!this.rosterChoiceMade && fields.length >= 9 && fields.length <= 12) {
            this.selectedIds = fields.map(player => player.id); this.draftIds = new Set(this.selectedIds);
            this.rosterChoiceMade = true; this.autoRoster = true; this.saveRoster();
        }
        const signature = JSON.stringify(roster.map(p => [p.id, p.alias, p.full_name, p.position, p.second_position]));
        if (signature === this.rosterSignature) return;
        this.rosterSignature = signature;
        const ids = new Set(roster.filter(player => !TrainingLineups.isKeeper(player)).map(player => player.id));
        this.draftIds = new Set([...this.draftIds].filter(id => ids.has(id)));
        this.selectedIds = this.selectedIds.filter(id => ids.has(id));
        if (this.selectedIds.length && this.selectedIds.length < 9) this.selectedIds = [];
        if (this.selectedIds.length) this.fieldPlayers = this.selectedIds.length;
        this.renderRoster(); this.updateCount(); this.renderStage();
    },
    lineupHTML(stage, lineup) {
        if (!stage.positionNotes) return '';
        if (!lineup.named) return '<section class="training-lineups"><h3>Los grupos por nombre</h3><p>Marcá a las chicas que vienen hoy para ver directamente quién va en cada grupo.</p><button type="button" class="btn btn-primary btn-sm" data-training-pick-roster>Elegir las presentes</button></section>';
        let groups = [...lineup.groups];
        if (stage.type === 'warmup' && this.warmupIndex === 0) groups = [{ title: 'Movilidad · todas juntas', team: 'red', slots: groups.flatMap(group => group.slots) }];
        if (lineup.keeper) groups.push({ title: 'Arquera · desde las 20', team: 'keeper', slots: [lineup.keeper] });
        return `<section class="training-lineups"><div class="training-name-heading"><h3>Las chicas para este ejercicio</h3><button type="button" class="training-text-button" data-training-pick-roster>Cambiar presentes</button></div>${this.autoRoster ? '<p class="training-lineup-hint">Armé el reparto con todas las chicas cargadas en el plantel. Cambiá las presentes si hoy falta alguna.</p>' : ''}<div class="training-lineup-grid">${groups.map(group => `<div class="training-lineup-team ${group.team}"><h4>${this.e(group.title)}</h4><ul class="training-name-list">${group.slots.map(slot => `<li>${slot.player ? `<span class="training-name-initial" aria-hidden="true">${this.e(Palometas.nameOf(slot.player).trim().charAt(0))}</span><strong>${this.e(Palometas.nameOf(slot.player))}</strong>` : '<span>Elegí quién se suma como arquera.</span>'}</li>`).join('')}</ul>${group.note ? `<p>${this.e(group.note)}</p>` : ''}</div>`).join('')}</div></section>`;
    },
    warmupDemoHTML() {
        const moves = this.current.stages[this.step].moves, move = moves[this.warmupIndex];
        const parts = move.parts ? `<div class="training-mobility-parts"><h4>Todo dentro de Movilidad</h4><ol>${move.parts.map(part => `<li><strong>${this.e(part.name)}</strong><small>${this.e(part.dose)}</small><p>${part.instructions.map(item => this.e(item)).join(' ')}</p></li>`).join('')}</ol></div>` : '';
        return `<p class="training-warmup-dose"><strong>${this.e(move.time)}</strong> · ${this.e(move.dose)}</p><figure class="training-media"><div class="training-static">${WarmupMotions.render(move.id, 0, move.parts)}</div><div class="training-motion" data-warmup="${this.e(move.id)}" hidden></div><figcaption><span>${move.parts ? 'Mostrá la secuencia de Movilidad, los ocho movimientos avanzan automáticamente uno detrás de otro.' : 'Mostrá el ejercicio y usá estas indicaciones para guiar a las chicas.'}</span><div class="training-media-actions"><button type="button" class="btn btn-primary btn-sm" data-training-motion aria-pressed="false">▶ Ver movimiento</button><button type="button" class="btn btn-secondary btn-sm" data-training-enlarge>Ampliar preparación</button></div></figcaption></figure><div class="training-warmup-instructions">${this.list(move.instructions, true)}${parts}</div><div class="training-warmup-navigation"><button type="button" class="btn btn-secondary btn-sm" data-training-warmup="${this.warmupIndex - 1}" ${this.warmupIndex === 0 ? 'disabled' : ''}>← Ejercicio anterior</button><span>${this.warmupIndex + 1} de ${moves.length} ejercicios</span><button type="button" class="btn btn-secondary btn-sm" data-training-warmup="${this.warmupIndex + 1}" ${this.warmupIndex === moves.length - 1 ? 'disabled' : ''}>Próximo ejercicio →</button></div>`;
    },
    warmupHTML(stage) {
        return `<section class="training-warmup"><label for="training-warmup-move">Elegí el ejercicio que querés ver</label><select id="training-warmup-move">${stage.moves.map((move, i) => `<option value="${i}" ${i === this.warmupIndex ? 'selected' : ''}>${this.e(move.number || i + 1)}. ${this.e(move.name)}</option>`).join('')}</select><div id="training-warmup-example">${this.warmupDemoHTML()}</div></section>`;
    },
    changeWarmup(index) {
        const moves = this.current?.stages[this.step].moves;
        if (!moves || !Number.isInteger(index) || index < 0 || index >= moves.length) return;
        this.stopWarmup(); this.warmupIndex = index; this.renderStage();
        document.getElementById('training-warmup-move').focus({ preventScroll: true });
    },
    stopWarmup() {
        if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
        const motion = document.querySelector('.training-motion[data-warmup]');
        if (motion) { motion.hidden = true; const media = motion.closest('.training-media'); media.querySelector('.training-static').hidden = false; const button = media.querySelector('[data-training-motion]'); button.setAttribute('aria-pressed', 'false'); button.textContent = '▶ Ver movimiento'; }
    },
    list(items, ordered = false) { const tag = ordered ? 'ol' : 'ul'; return `<${tag}>${items.map(item => `<li>${this.e(item)}</li>`).join('')}</${tag}>`; },
    legend() { return '<div class="training-legend"><span><i class="red"></i>Equipo</span><span><i class="blue"></i>Rival</span><span><i class="neutral"></i>Apoyo neutral</span><span><i class="keeper"></i>Arquera</span><span><i class="ball"></i>Pelota</span></div>'; },
    media({ title, staticHTML, gif, example, caption }) {
        return `<figure class="training-media"><div class="training-static">${staticHTML}</div>${gif ? `<div class="training-motion" hidden><img data-gif="${this.asset(gif)}" alt="${this.e(title)}: ejemplo de movimiento" width="900" height="600"></div>` : ''}<figcaption><span>${this.e(caption || (gif ? 'Armado con tu reparto. GIF de ejemplo: ' + example + '.' : 'Tomá esta ubicación como referencia y ajustá el espacio a cómo resuelvan las chicas.'))}</span><div class="training-media-actions">${gif ? '<button type="button" class="btn btn-primary btn-sm" data-training-motion aria-pressed="false">▶ Ver movimiento</button>' : ''}<button type="button" class="btn btn-secondary btn-sm" data-training-enlarge>Ampliar armado</button>${gif ? `<a class="training-download" href="${this.asset(gif)}" download>Descargar GIF</a>` : ''}</div></figcaption></figure>`;
    },
    stationHTML(station, index) {
        const count = TrainingBoards.groups(this.fieldPlayers)[index];
        let format;
        if (station.id === 'pase') format = count === 4 ? 'Dos parejas: 4 jugadoras, dos pelotas.' : 'Un trío: pasadora, receptora y apoyo.';
        if (station.id === 'rondo') format = count === 4 ? '3 contra 1.' : '2 contra 1, ampliá si la defensora cierra todas las líneas.';
        if (station.id === 'duelo') format = `1 contra 1 + ${count - 2} ${count === 3 ? 'apoyo neutral' : 'apoyos neutrales'}.`;
        return `<details class="training-station" ${index === 0 ? 'open' : ''}><summary><span class="training-station-letter">${station.letter}</span><span>${this.e(station.title)}<small>${station.dimension} · Empezá con ${count} jugadoras, después llegan los otros grupos</small></span></summary><div class="training-station-body"><p class="training-focus">${this.e(station.objective)}</p><p class="training-formation">${this.e(format)}</p>${this.list(station.steps, true)}<div class="training-challenge"><strong>El reto</strong><p>${this.e(station.score)}</p></div><p class="training-coach-cue">${this.e(station.cue)}</p>${this.media({ title: station.title, staticHTML: `<img src="${this.asset(station.gif.replace('.gif', '.png'))}" alt="${this.e(station.title)}: disposición del ejemplo animado" width="900" height="600" loading="lazy">`, gif: station.gif, example: station.example, caption: 'Esquema y GIF de ejemplo: ' + station.example + '. Usá la variante indicada para cada grupo.' })}</div></details>`;
    },
    renderStage() {
        this.stopWarmup();
        const stage = this.current.stages[this.step], last = this.step === this.current.stages.length - 1;
        const roster = window.playersManager?.players || [];
        const keepers = roster.filter(TrainingLineups.isKeeper);
        const selectedKeeper = this.keeperId === null ? (keepers.length === 1 ? keepers[0] : null) : keepers.find(p => p.id === this.keeperId);
        const lineup = TrainingLineups.create(stage.type, this.fieldPlayers, this.selectedPlayers(), selectedKeeper);
        let visual;
        if (stage.type === 'warmup') visual = this.warmupHTML(stage);
        else if (stage.type === 'cooldown') visual = `<div class="training-closing-visual"><span aria-hidden="true">✓</span><p>Una compañera libre.<br>Una decisión compartida.</p><small>Dos ideas para llevar al próximo partido.</small></div>`;
        else visual = this.media({ title: stage.title, staticHTML: TrainingBoards.render(stage.type, this.fieldPlayers, lineup), gif: stage.gif, example: stage.example });
        document.getElementById('training-stage').innerHTML = `
            <div class="training-stage-topline"><span>PASO ${this.step + 1} DE ${this.current.stages.length}</span><span>${stage.start}–${stage.end} <strong>· ${stage.minutes} min</strong></span></div>
            <div class="training-progress" role="progressbar" aria-label="Posición en el recorrido" aria-valuemin="1" aria-valuemax="${this.current.stages.length}" aria-valuenow="${this.step + 1}"><span style="width:${(this.step + 1) / this.current.stages.length * 100}%"></span></div>
            <h2 id="training-step-heading" tabindex="-1">${this.e(stage.title)}</h2><p class="training-focus">${this.e(stage.focus)}</p>
            <div class="training-rolebar"><strong>${this.e(TrainingBoards.description(stage.type, this.fieldPlayers))}</strong><span class="${stage.goalkeeper ? 'with-keeper' : ''}">${stage.goalkeeper ? 'Con arquera' : 'Sin arquera'}</span></div>
            ${visual}${stage.type !== 'warmup' && stage.type !== 'cooldown' ? this.legend() : ''}
            ${this.lineupHTML(stage, lineup)}
            <div class="training-instruction-grid"><section><h3>Cómo organizarlo</h3><p>${this.e(stage.organization)}</p></section><section><h3>Trabajo y pausas</h3><p>${this.e(stage.timing)}</p></section></div>
            <section class="training-instructions"><h3>Cómo guiar el ejercicio</h3>${this.list(stage.instructions, true)}</section>
            ${stage.stations ? `<section class="training-stations"><h3>Abrí cada estación para ver el ejercicio</h3>${stage.stations.map((station, index) => this.stationHTML(station, index)).join('')}</section>` : ''}
            <section class="training-cues"><h3>Qué mirar y qué decirles</h3>${this.list(stage.cues)}</section>
            <details class="training-adjustments"><summary>Ajustar la dificultad</summary><div class="training-instruction-grid"><div><h4>Para facilitar</h4><p>${this.e(stage.easier)}</p></div><div><h4>Para progresar</h4><p>${this.e(stage.harder)}</p></div></div></details>
            ${stage.care ? `<p class="training-care">${this.e(stage.care)}</p>` : ''}
            <div class="training-step-footer"><button type="button" class="btn btn-secondary" data-training-step="${this.step - 1}" ${this.step === 0 ? 'disabled' : ''}>← Anterior</button><span>${stage.end} · ${last ? 'Fin de la práctica' : 'Siguiente: ' + this.e(this.current.stages[this.step + 1].shortTitle)}</span>${last ? '<button type="button" class="btn btn-primary" data-training-catalog>Volver a las fechas</button>' : `<button type="button" class="btn btn-primary" data-training-step="${this.step + 1}">Siguiente →</button>`}</div>`;
        document.querySelectorAll('.training-timeline-step').forEach((button, index) => {
            button.classList.toggle('is-current', index === this.step);
            if (index === this.step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
        });
    },
    toggleMotion(button) {
        const media = button.closest('.training-media'), motion = media.querySelector('.training-motion');
        const play = motion.hidden;
        if (motion.dataset.warmup) {
            if (!play) { this.stopWarmup(); return; }
            this.stopWarmup(); motion.hidden = false; media.querySelector('.training-static').hidden = true;
            button.setAttribute('aria-pressed', 'true'); button.textContent = '■ Ver preparación';
            const start = performance.now(); let previous = -100;
            const move = this.current.stages[this.step].moves.find(item => item.id === motion.dataset.warmup);
            const animate = now => {
                if (!motion.isConnected || motion.hidden) { this.animationFrame = null; return; }
                if (now - previous >= 33) { motion.innerHTML = WarmupMotions.render(motion.dataset.warmup, (now - start) / 1000, move?.parts); previous = now; }
                this.animationFrame = requestAnimationFrame(animate);
            };
            this.animationFrame = requestAnimationFrame(animate); return;
        }
        const image = motion.querySelector('img');
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
