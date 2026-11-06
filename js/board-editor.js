window.boardsManager = (() => {
    const diagram = BoardDiagram;
    const archive = BoardArchive;
    const editors = [];
    const presets = { '4-4-2': [4, 4, 2], '4-3-3': [4, 3, 3], '4-2-3-1': [4, 2, 3, 1], '3-5-2': [3, 5, 2] };
    const movement = 'Arrastrá las fichas para moverlas. También podés elegir una ficha y usar las flechas del teclado.';
    const option = (value, text) => `<option value="${diagram.e(value)}">${diagram.e(text)}</option>`;
    const button = (action, text, extra = '') => `<button type="button" class="btn btn-secondary btn-sm" data-board-action="${action}" ${extra}>${text}</button>`;
    const tool = (kind, text, icon, extra = '') => `<button type="button" class="board-tool" data-board-tool="${kind}" aria-pressed="false" ${extra}><i class="fas fa-${icon}" aria-hidden="true"></i><span>${text}</span></button>`;
    let gifshotLoader;

    function gifshot() {
        if (window.gifshot?.createGIF) return Promise.resolve(window.gifshot);
        if (!gifshotLoader) gifshotLoader = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/gifshot@0.4.5/dist/gifshot.min.js';
            script.onload = () => window.gifshot?.createGIF ? resolve(window.gifshot) : reject(new Error('El generador de GIF no está disponible.'));
            script.onerror = () => { script.remove(); reject(new Error('No se pudo cargar el generador de GIF.')); };
            document.head.append(script);
        }).catch(error => { gifshotLoader = null; throw error; });
        return gifshotLoader;
    }

    function markup(kind) {
        const formation = kind === 'formation';
        const label = formation ? 'formación' : 'ejercicio';
        const boardId = 'board-' + kind;
        return `<div class="board-controls" data-board-controls>
            <details class="board-saved" data-board-archive>
                <summary><strong>${formation ? 'Formaciones guardadas' : 'Ejercicios guardados'}</strong><span data-board-saved-count></span></summary>
                <div class="board-saved-toolbar">
                    <input type="search" data-board-saved-search aria-label="Buscar ${label} guardado" placeholder="Buscar por nombre o consigna">
                    ${button('reload', 'Actualizar lista')}
                </div>
                <div class="board-saved-list" data-board-saved></div>
            </details>
            <div class="board-document">
                <div class="board-document-fields">
                    <div><label for="${boardId}-title">Nombre</label><input id="${boardId}-title" data-board-title maxlength="100" placeholder="${formation ? 'Ej. vs. Talleres' : 'Ej. Salida por derecha'}"></div>
                    ${formation ? `<div><label for="${boardId}-date">Fecha, optativa</label><input id="${boardId}-date" type="date" data-board-date></div>` : ''}
                </div>
                <div class="board-actions">
                    <button type="button" class="btn btn-primary btn-sm" data-board-action="save">Guardar</button>
                    ${button('variant', 'Hacer variante')}${button('new', 'Nueva pizarra')}
                </div>
            </div>
            <p class="board-document-state" data-board-state></p>
            <div class="board-editor-grid">
                <aside class="board-tools" aria-label="${formation ? 'Plantel y esquemas' : 'Materiales y jugadoras'}">
                    ${formation ? `<h2>Esquema inicial</h2><div class="board-preset"><select data-board-preset aria-label="Esquema inicial">${Object.keys(presets).map(value => option(value, value)).join('')}</select>${button('preset', 'Armar')}</div>
                    <h2>Plantel Sub 17</h2><input type="search" data-board-roster-search aria-label="Buscar jugadora" placeholder="Buscar jugadora"><div class="board-roster" data-board-roster></div>` : `<h2>Jugadoras</h2>
                    <div class="board-tool-grid">${Object.entries(diagram.teams).map(([key, color]) => tool('player', color.name, 'user', 'data-team="' + key + '" style="--board-swatch:' + color.fill + '"')).join('')}</div>
                    <h2>Materiales y recorridos</h2><div class="board-tool-grid">${Object.entries(diagram.materials).map(([key, item]) => tool(key, item.name, item.icon)).join('')}</div>`}
                </aside>
                <div class="board-workspace">
                    <div class="board-field-toolbar">
                        ${tool('move', 'Mover', 'up-down-left-right')}
                        <label class="visually-hidden" for="${boardId}-field">Espacio de trabajo</label>
                        <select id="${boardId}-field" data-board-field>${Object.entries(diagram.fields).filter(([key]) => !formation || key !== 'free').map(([key, value]) => option(key, value)).join('')}</select>
                        ${button('undo', 'Deshacer')}
                    </div>
                    <p class="board-tool-hint" data-board-hint aria-live="polite"></p>
                    <svg class="board-surface" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${diagram.width} ${diagram.height}" tabindex="0" role="group" aria-label="Cancha editable" aria-describedby="${boardId}-keys" font-family="Arial,sans-serif">
                        <g data-board-pitch></g><g data-board-items></g>
                    </svg>
                    <span id="${boardId}-keys" class="visually-hidden">${movement}</span>
                    ${formation ? '' : `<div class="board-steps"><div class="board-steps-top"><strong>Pasos del ejercicio</strong>${button('step-add', 'Agregar paso')}${button('step-remove', 'Quitar paso')}${button('play', 'Ver movimiento')}</div><div class="board-step-list" data-board-steps></div><p>Agregá un paso, mové las fichas y volvé a reproducir la secuencia.</p></div>`}
                    <div class="board-selection">
                        <label for="${boardId}-pieces">Ficha en cancha</label>
                        <select id="${boardId}-pieces" data-board-piece-list></select>
                        <div class="board-selection-actions" data-board-selection hidden>
                            <label data-board-label-control>Etiqueta<input data-board-label maxlength="30"></label>
                            <label data-board-color-control>Color<select data-board-color>${Object.entries(diagram.teams).map(([key, value]) => option(key, value.name)).join('')}</select></label>
                            ${button('rotate', 'Girar')}${button('duplicate', 'Duplicar ficha')}${button('remove', 'Quitar ficha')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="board-bottom">
                <div><label for="${boardId}-notes">${formation ? 'Notas' : 'Consigna y variantes'}, optativo</label><textarea id="${boardId}-notes" data-board-notes rows="3" maxlength="2000" placeholder="${formation ? 'Indicaciones o suplentes' : 'Cómo prepararlo, qué mirar o cómo hacerlo más difícil'}"></textarea></div>
                <div class="board-actions">${button('png', 'Descargar PNG')}${button('print', 'Imprimir')}${formation ? '' : button('gif', 'Descargar GIF')}</div>
            </div>
        </div><p class="board-status" role="status" aria-live="polite" data-board-status hidden></p>`;
    }

    class Editor {
        constructor(root, kind) {
            this.root = root;
            this.kind = kind;
            this.formation = kind === 'formation';
            this.board = diagram.normalize({ field: this.formation ? 'full' : 'half' });
            this.frame = 0;
            this.history = [];
            this.roster = new Map();
            this.saved = [];
            this.record = null;
            this.tool = { kind: 'move' };
            this.selected = '';
            this.dirty = false;
            this.busy = false;
            this.loaded = false;
            this.loading = false;
            this.archiveRevision = 0;
            this.playback = null;
            this.gesture = null;
            this.root.innerHTML = markup(kind);
            this.svg = root.querySelector('.board-surface');
            this.bind();
            this.refreshRoster();
            this.render();
        }

        get items() { return this.board.frames[this.frame].items; }
        get selection() { return this.items.find(item => item.id === this.selected); }
        get(name) { return this.root.querySelector('[data-board-' + name + ']'); }
        action(name) { return this.root.querySelector('[data-board-action="' + name + '"]'); }
        title() { return diagram.label(this.get('title').value, 100); }
        name(item) { return diagram.name(item, this.roster); }

        bind() {
            this.root.addEventListener('click', event => this.click(event));
            this.root.addEventListener('input', event => {
                if (event.target === this.get('roster-search')) this.renderRoster();
                else if (event.target === this.get('saved-search')) this.renderSaved();
                else if ([this.get('title'), this.get('notes')].includes(event.target)) this.markDirty();
            });
            this.root.addEventListener('change', event => this.change(event.target));
            this.get('archive').addEventListener('toggle', () => {
                if (this.get('archive').open && !this.loaded) this.loadSaved();
            });
            this.svg.addEventListener('pointerdown', event => this.pointerDown(event));
            this.svg.addEventListener('pointermove', event => this.pointerMove(event));
            this.svg.addEventListener('pointerup', event => this.finishGesture(event));
            this.svg.addEventListener('pointercancel', event => this.finishGesture(event, true));
            this.svg.addEventListener('lostpointercapture', event => this.finishGesture(event, true));
            this.svg.addEventListener('keydown', event => this.keyboard(event));
            if (this.formation) this.bindRosterDrag();
        }

        bindRosterDrag() {
            const type = 'application/x-palometas-player';
            this.get('roster').addEventListener('dragstart', event => {
                const card = event.target.closest('[data-roster-id]');
                if (!card || this.busy) return;
                event.dataTransfer.setData(type, card.dataset.rosterId);
                event.dataTransfer.effectAllowed = 'move';
            });
            this.svg.addEventListener('dragover', event => {
                if (!this.busy && event.dataTransfer.types.includes(type)) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                }
            });
            this.svg.addEventListener('drop', event => {
                const id = event.dataTransfer.getData(type);
                if (!id || this.busy) return;
                event.preventDefault();
                const point = this.location(event);
                if (point) this.placePlayer(id, point, this.hit(event));
            });
        }

        click(event) {
            if (this.busy) return;
            const element = event.target.closest('button');
            if (!element || !this.root.contains(element)) return;
            const data = element.dataset;
            if (data.rosterId) {
                const placed = this.items.find(item => item.playerId === data.rosterId);
                this.choose(placed ? { kind: 'move' } : { kind: 'player', playerId: data.rosterId }, placed?.id);
                return;
            }
            if (data.boardTool) {
                this.choose({ kind: data.boardTool, color: data.team });
                return;
            }
            if (data.boardFrame !== undefined) {
                this.stop();
                this.frame = Number(data.boardFrame);
                this.selected = '';
                this.render();
                return;
            }
            if (data.archiveAction) {
                const entry = this.saved.find(item => item.id === data.entryId);
                if (!entry || !archive.allowed(entry, this.roster)) return;
                if (data.archiveAction === 'delete') this.deleteSaved(entry);
                else this.openSaved(entry, data.archiveAction === 'copy');
                return;
            }
            switch (data.boardAction) {
                case 'save': this.save(); break;
                case 'variant': this.variant(); break;
                case 'new': this.newBoard(); break;
                case 'reload': this.loadSaved(); break;
                case 'preset': this.applyPreset(); break;
                case 'undo': this.undo(); break;
                case 'step-add': this.addStep(); break;
                case 'step-remove': this.removeStep(); break;
                case 'play': this.play(); break;
                case 'rotate': this.rotate(); break;
                case 'duplicate': this.duplicate(); break;
                case 'remove': this.removeSelection(); break;
                case 'png': this.exportPNG(); break;
                case 'gif': this.exportGIF(); break;
                case 'print': this.print(); break;
            }
        }

        change(target) {
            if (this.busy) return;
            if (target === this.get('date')) this.markDirty();
            if (target === this.get('field')) this.edit(() => { this.board.field = target.value; });
            if (target === this.get('piece-list')) this.choose({ kind: 'move' }, target.value);
            const item = this.selection;
            if (item?.kind !== 'player') return;
            if (target === this.get('label') && !item.playerId) this.edit(() => { item.label = diagram.label(target.value, 30); });
            if (target === this.get('color')) this.edit(() => { item.color = target.value; });
        }

        refreshRoster() {
            this.roster = new Map((window.playersManager?.players || []).map(player => [player.id, Palometas.nameOf(player)]));
            this.renderRoster();
            this.renderSaved();
            if (this.playback === null) this.renderItems();
        }

        show(openSaved = false) {
            this.refreshRoster();
            if (openSaved) this.get('archive').open = true;
            if (!this.loaded) this.loadSaved();
        }

        hide() {
            this.stop();
            if (this.gesture) this.finishGesture({ pointerId: this.gesture.pointerId }, true);
        }

        notice(message = '', error = false) {
            clearTimeout(this.noticeTimer);
            const status = this.get('status');
            status.hidden = !message;
            status.textContent = message;
            status.dataset.error = String(error);
            if (message) this.noticeTimer = setTimeout(() => { status.hidden = true; }, error ? 11000 : 6000);
        }

        markDirty() { this.dirty = true; this.renderState(); }

        renderState() {
            this.get('state').textContent = this.dirty ? 'Cambios sin guardar' : this.record ? 'Guardada' : 'Pizarra nueva';
        }

        renderRoster() {
            if (!this.formation) return;
            const root = this.get('roster');
            const query = this.get('roster-search').value.toLocaleLowerCase('es').trim();
            const placed = new Set(this.items.map(item => item.playerId));
            const list = [...this.roster.entries()].filter(([, name]) => name.toLocaleLowerCase('es').includes(query));
            root.innerHTML = list.length ? list.map(([id, name]) => {
                const text = diagram.e(name);
                return `<button type="button" draggable="true" data-roster-id="${diagram.e(id)}" aria-pressed="${this.tool.playerId === id}" class="${placed.has(id) ? 'is-placed' : ''}"><span>${text}</span>${placed.has(id) ? '<small>En cancha</small>' : ''}</button>`;
            }).join('') : `<p>${this.roster.size ? 'No encontré ese nombre.' : 'Cuando cargue el plantel, vas a ver los nombres acá.'}</p>`;
        }

        renderSaved() {
            const list = this.saved.filter(entry => archive.allowed(entry, this.roster));
            const query = this.get('saved-search').value.toLocaleLowerCase('es').trim();
            const filtered = list.filter(({ data }) => `${data.name || ''} ${data.description || ''}`.toLocaleLowerCase('es').includes(query));
            this.get('saved-count').textContent = list.length ? String(list.length) : '';
            const root = this.get('saved');
            if (this.loading) { root.innerHTML = '<p class="text-muted">Cargando pizarras…</p>'; return; }
            if (!filtered.length) {
                root.innerHTML = `<p class="text-muted">${query ? 'Probá con otro nombre.' : this.loaded ? 'Todavía no hay pizarras guardadas.' : 'Actualizá la lista para ver tus pizarras.'}</p>`;
                return;
            }
            root.innerHTML = filtered.map(entry => {
                const { data } = entry, id = diagram.e(entry.id);
                const legacy = data.format !== diagram.format;
                const notes = diagram.label(data.description, 150);
                const caption = legacy ? 'Formación anterior' : this.formation
                    ? (data.formation_date ? Palometas.formatDate(data.formation_date) : 'Formación')
                    : `${data.board_data?.frames?.length || 1} pasos`;
                return `<article class="board-saved-card">
                    <div><strong>${diagram.e(data.name || 'Pizarra sin nombre')}</strong><small>${diagram.e(caption)}</small>${notes ? `<p>${diagram.e(notes)}</p>` : ''}</div>
                    <div class="board-actions">
                        <button type="button" class="btn btn-secondary btn-sm" data-archive-action="open" data-entry-id="${id}">Abrir</button>
                        <button type="button" class="btn btn-secondary btn-sm" data-archive-action="copy" data-entry-id="${id}">Hacer variante</button>
                        <button type="button" class="btn btn-secondary btn-sm btn-danger" data-archive-action="delete" data-entry-id="${id}">Borrar</button>
                    </div></article>`;
            }).join('');
        }

        renderItems(list = this.items, selected = this.selected) {
            this.get('items').innerHTML = diagram.items(list, this.roster, selected, true);
        }

        render() {
            if (!this.selection) this.selected = '';
            this.get('field').value = this.board.field;
            this.get('pitch').innerHTML = diagram.pitch(this.board.field);
            this.renderItems();
            this.renderRoster();
            this.renderState();
            this.renderSelection();
            this.renderSteps();
            this.action('undo').disabled = !this.history.length;
            this.action('variant').disabled = !this.items.length && this.board.frames.length === 1;
            this.root.querySelectorAll('[data-board-tool]').forEach(control => {
                control.setAttribute('aria-pressed', String(control.dataset.boardTool === this.tool.kind && (!control.dataset.team || control.dataset.team === this.tool.color)));
            });
            let hint = movement;
            if (!this.items.length) hint = this.formation ? 'Armá un esquema o elegí una jugadora y tocá la cancha.' : 'Elegí una jugadora o un material y tocá la cancha para empezar.';
            if (this.tool.playerId) hint = `Tocá la cancha o un puesto para ubicar a ${this.roster.get(this.tool.playerId)}.`;
            else if (diagram.isLine(this.tool.kind)) hint = 'Arrastrá desde el inicio hasta el destino del recorrido.';
            else if (this.tool.kind !== 'move') hint = 'Tocá la cancha para ubicar la ficha. Elegí Mover para acomodarla.';
            this.get('hint').textContent = hint;
            this.svg.dataset.tool = this.tool.kind;
        }

        renderSelection() {
            const item = this.selection, list = this.get('piece-list');
            list.innerHTML = option('', 'Elegí una ficha') + this.items.map(piece => option(piece.id, this.name(piece))).join('');
            list.value = this.selected;
            list.disabled = !this.items.length;
            this.get('selection').hidden = !item;
            if (!item) return;
            this.get('label-control').hidden = item.kind !== 'player' || Boolean(item.playerId);
            this.get('color-control').hidden = item.kind !== 'player';
            this.get('label').value = item.label || '';
            this.get('color').value = item.color || 'bordo';
            this.action('rotate').hidden = !diagram.materials[item.kind]?.rotate;
            this.action('duplicate').hidden = Boolean(item.playerId);
        }

        renderSteps() {
            if (this.formation) return;
            const steps = this.board.frames;
            this.get('steps').innerHTML = steps.map((_, i) => `<button type="button" class="board-step" data-board-frame="${i}" aria-pressed="${this.frame === i}">Paso ${i + 1}</button>`).join('');
            this.action('step-add').disabled = steps.length >= diagram.limits.frames || !steps[this.frame].items.length;
            this.action('step-remove').disabled = steps.length < 2;
            this.action('play').disabled = steps.length < 2;
            this.action('gif').disabled = steps.length < 2;
        }

        choose(tool, selected = '') {
            this.stop();
            this.tool = tool;
            this.selected = selected;
            this.render();
        }

        snapshot() { return { board: structuredClone(this.board), frame: this.frame }; }

        remember(snapshot = this.snapshot()) {
            this.history.push(snapshot);
            if (this.history.length > 30) this.history.shift();
        }

        edit(change) {
            this.stop();
            this.remember();
            change();
            this.markDirty();
            this.render();
        }

        undo() {
            this.stop();
            const previous = this.history.pop();
            if (!previous) return;
            this.board = previous.board;
            this.frame = previous.frame;
            this.markDirty();
            this.render();
        }

        applyPreset() {
            const rows = presets[this.get('preset').value];
            if (!rows) return;
            if (this.items.length && !confirm('¿Reemplazar las fichas por el esquema elegido? Podés deshacerlo.')) return;
            const slot = (x, y, label) => ({ id: diagram.id(), kind: 'player', x, y, label, color: 'bordo', slot: true });
            const players = [slot(450, 560, 'Arquera')];
            rows.forEach((count, row) => {
                const role = row === 0 ? 'Defensa' : row === rows.length - 1 ? 'Ataque' : 'Medio';
                const y = 460 - 285 * row / (rows.length - 1);
                for (let i = 0; i < count; i++) players.push(slot(diagram.width * (i + 1) / (count + 1), y, role + ' ' + (i + 1)));
            });
            this.edit(() => {
                this.board.field = 'full';
                this.board.frames[0].items = players;
                this.selected = '';
                this.tool = { kind: 'move' };
            });
        }

        location(event) {
            const matrix = this.svg.getScreenCTM();
            if (!matrix) return null;
            const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
            return diagram.point(x, y);
        }

        hit(event) {
            const id = event.target.closest('[data-piece]')?.dataset.piece;
            return this.items.find(item => item.id === id);
        }

        room() {
            if (this.items.length < diagram.limits.items) return true;
            this.notice('La cancha llegó al límite de fichas. Quitá alguna para agregar otra.', true);
            return false;
        }

        placePlayer(playerId, point, hit) {
            if (!this.roster.has(playerId)) return;
            const placed = this.items.find(item => item.playerId === playerId);
            const slot = hit?.kind === 'player' ? hit : null;
            if (!placed && !slot && !this.room()) return;
            this.edit(() => {
                const item = placed || slot || { id: diagram.id(), kind: 'player', ...point, color: 'bordo' };
                if (placed) {
                    const target = slot && slot !== placed ? { x: slot.x, y: slot.y } : point;
                    if (slot && slot !== placed) Object.assign(slot, { x: placed.x, y: placed.y });
                    Object.assign(placed, target);
                }
                item.playerId = playerId;
                item.label = this.roster.get(playerId);
                delete item.slot;
                if (!placed && !slot) this.items.push(item);
                this.selected = item.id;
                this.tool = { kind: 'move' };
            });
        }

        pointerDown(event) {
            if (this.busy || this.gesture || !event.isPrimary || event.button !== 0) return;
            const point = this.location(event);
            if (!point) return;
            event.preventDefault();
            this.stop();
            this.svg.focus({ preventScroll: true });
            const hit = this.hit(event);
            if (this.tool.playerId) { this.placePlayer(this.tool.playerId, point, hit); return; }
            const kind = this.tool.kind;
            if (kind !== 'move' && !this.room()) return;
            if (kind === 'move') {
                this.selected = hit?.id || '';
                this.render();
                if (!hit) return;
                this.gesture = { pointerId: event.pointerId, point, item: hit, origin: { ...hit }, before: this.snapshot() };
            } else if (diagram.isLine(kind)) {
                this.gesture = { pointerId: event.pointerId, line: { id: diagram.id(), kind, ...point, x2: point.x, y2: point.y } };
            } else {
                this.edit(() => {
                    const item = { id: diagram.id(), kind, ...point };
                    if (kind === 'player') {
                        item.color = this.tool.color;
                        item.label = String(this.items.filter(p => p.kind === 'player' && p.color === item.color).length + 1);
                    }
                    this.items.push(item);
                    this.selected = item.id;
                });
                return;
            }
            this.svg.setPointerCapture(event.pointerId);
        }

        shift(item, origin, dx, dy) {
            const line = diagram.isLine(item.kind);
            const xs = line ? [origin.x, origin.x2] : [origin.x];
            const ys = line ? [origin.y, origin.y2] : [origin.y];
            const x = Math.max(28 - Math.min(...xs), Math.min(diagram.width - 28 - Math.max(...xs), dx));
            const y = Math.max(28 - Math.min(...ys), Math.min(diagram.height - 48 - Math.max(...ys), dy));
            item.x = origin.x + x;
            item.y = origin.y + y;
            if (line) { item.x2 = origin.x2 + x; item.y2 = origin.y2 + y; }
        }

        pointerMove(event) {
            const gesture = this.gesture;
            if (!gesture || event.pointerId !== gesture.pointerId) return;
            const point = this.location(event);
            if (!point) return;
            if (gesture.line) {
                gesture.line.x2 = point.x;
                gesture.line.y2 = point.y;
                this.renderItems([...this.items, gesture.line], gesture.line.id);
            } else {
                this.shift(gesture.item, gesture.origin, point.x - gesture.point.x, point.y - gesture.point.y);
                this.renderItems();
            }
        }

        finishGesture(event, cancelled = false) {
            const gesture = this.gesture;
            if (!gesture || event.pointerId !== gesture.pointerId) return;
            this.gesture = null;
            if (this.svg.hasPointerCapture(event.pointerId)) this.svg.releasePointerCapture(event.pointerId);
            if (gesture.line) {
                if (!cancelled && Math.hypot(gesture.line.x2 - gesture.line.x, gesture.line.y2 - gesture.line.y) >= 16) {
                    this.edit(() => { this.items.push(gesture.line); this.selected = gesture.line.id; });
                    return;
                }
            } else if (cancelled) Object.assign(gesture.item, gesture.origin);
            else if (gesture.item.x !== gesture.origin.x || gesture.item.y !== gesture.origin.y) {
                this.remember(gesture.before);
                this.markDirty();
            }
            this.render();
        }

        keyboard(event) {
            if (this.busy || this.gesture) return;
            if (event.key === 'Escape') { this.choose({ kind: 'move' }); return; }
            const item = this.selection;
            if (!item) return;
            if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault();
                this.removeSelection();
                return;
            }
            const vectors = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            const direction = vectors[event.key];
            if (!direction) return;
            event.preventDefault();
            const step = event.shiftKey ? 18 : 5;
            this.edit(() => this.shift(item, { ...item }, direction[0] * step, direction[1] * step));
        }

        removeSelection() {
            const item = this.selection;
            if (item) this.edit(() => { this.items.splice(this.items.indexOf(item), 1); this.selected = ''; });
        }

        rotate() {
            const item = this.selection;
            if (diagram.materials[item?.kind]?.rotate) this.edit(() => { item.angle = ((item.angle || 0) + 45) % 360; });
        }

        duplicate() {
            const item = this.selection;
            if (!item || item.playerId || !this.room()) return;
            this.edit(() => {
                const copy = { ...item, id: diagram.id() };
                this.shift(copy, item, 27, 30);
                this.items.push(copy);
                this.selected = copy.id;
                this.tool = { kind: 'move' };
            });
        }

        addStep() {
            if (!this.items.length || this.board.frames.length >= diagram.limits.frames) return;
            this.edit(() => {
                this.board.frames.splice(this.frame + 1, 0, { items: structuredClone(this.items) });
                this.frame++;
                this.tool = { kind: 'move' };
            });
        }

        removeStep() {
            if (this.board.frames.length < 2) return;
            this.edit(() => {
                this.board.frames.splice(this.frame, 1);
                this.frame = Math.min(this.frame, this.board.frames.length - 1);
                this.selected = '';
            });
        }

        play() {
            if (this.playback !== null) { this.stop(); return; }
            const frames = this.board.frames;
            if (frames.length < 2) return;
            let start = null, last = -Infinity;
            this.action('play').textContent = 'Detener';
            const animate = now => {
                if (start === null) start = now;
                const elapsed = now - start, duration = 1200;
                const index = Math.floor(elapsed / duration);
                if (index >= frames.length) { this.stop(); return; }
                if (now - last >= 32) {
                    const from = frames[index].items;
                    const to = frames[index + 1]?.items;
                    const progress = Math.max(0, (elapsed % duration - 220) / (duration - 220));
                    this.renderItems(to ? diagram.between(from, to, progress) : from, '');
                    last = now;
                }
                this.playback = requestAnimationFrame(animate);
            };
            this.playback = requestAnimationFrame(animate);
        }

        stop() {
            if (this.playback === null) return;
            cancelAnimationFrame(this.playback);
            this.playback = null;
            this.action('play').textContent = 'Ver movimiento';
            this.renderItems();
        }

        canOpen() { return !this.dirty || confirm('¿Dejar esta pizarra con cambios sin guardar?'); }

        setDraft({ title = '', date = '', notes = '', board }, record = null) {
            this.stop();
            this.record = record;
            this.board = board;
            this.frame = 0;
            this.history = [];
            this.selected = '';
            this.tool = { kind: 'move' };
            this.dirty = false;
            this.get('title').value = title;
            this.get('notes').value = notes;
            if (this.formation) this.get('date').value = date;
            this.notice();
            this.render();
        }

        newBoard() {
            if (!this.canOpen()) return;
            this.setDraft({ board: diagram.normalize({ field: this.formation ? 'full' : 'half' }) });
            this.get('title').focus();
        }

        variant() {
            this.stop();
            this.record = null;
            this.get('title').value = this.variantName(this.title());
            this.markDirty();
            this.notice('Variante lista para editar. Guardala con el nombre que elijas.');
            this.get('title').focus();
            this.get('title').select();
        }

        variantName(title) { return title ? diagram.label(title, 88) + ' · variante' : 'Variante'; }

        openSaved(entry, copy) {
            if (!this.canOpen()) return;
            const data = archive.draft(entry, this.roster);
            if (copy) data.title = this.variantName(data.title);
            this.setDraft(data, copy || data.legacy ? null : entry);
            this.get('archive').open = false;
            if (copy || data.legacy) this.markDirty();
            if (data.legacy) this.notice('Abriste una copia de la formación anterior. Revisá las posiciones antes de guardarla.');
            else if (copy) this.notice('Variante lista para editar. Guardala con el nombre que elijas.');
            this.get('title').focus();
        }

        async loadSaved() {
            if (!window.db || !window.auth?.currentUser || this.loading) return;
            this.loading = true;
            const revision = this.archiveRevision;
            this.renderSaved();
            try {
                const saved = await archive.load(this.kind);
                if (revision === this.archiveRevision) this.saved = saved;
                this.loaded = true;
            } catch (error) {
                console.error(error);
                this.notice('No pude cargar las pizarras guardadas. Volvé a actualizar la lista.', true);
            } finally {
                this.loading = false;
                this.renderSaved();
            }
        }

        lock(busy) {
            this.busy = busy;
            this.get('controls').inert = busy;
            this.root.setAttribute('aria-busy', String(busy));
        }

        async save() {
            const title = this.title();
            if (!title) { this.notice('Poné un nombre a la pizarra para guardarla.', true); this.get('title').focus(); return; }
            if (!this.board.frames.some(frame => frame.items.length)) { this.notice('Ubicá al menos una ficha en la cancha.', true); return; }
            this.stop();
            this.lock(true);
            this.notice('Guardando pizarra…');
            const board = diagram.normalize(this.board);
            board.frames.forEach(frame => frame.items.forEach(item => {
                if (item.playerId) item.label = diagram.label(this.name(item));
            }));
            try {
                this.record = await archive.save(this.kind, this.record, {
                    title, board, date: this.get('date')?.value || '', notes: diagram.label(this.get('notes').value, 2000)
                });
                this.archiveRevision++;
                this.saved = [this.record, ...this.saved.filter(entry => entry.id !== this.record.id)];
                this.dirty = false;
                this.renderState();
                this.renderSaved();
                this.notice('Pizarra guardada.');
            } catch (error) {
                console.error(error);
                this.notice(error?.code ? 'No pude guardar la pizarra. Tus cambios siguen abiertos para reintentar.' : error.message, true);
            } finally { this.lock(false); }
        }

        async deleteSaved(entry) {
            if (!confirm(`¿Borrar “${entry.data.name || 'Pizarra sin nombre'}” de las guardadas?`)) return;
            this.stop();
            this.lock(true);
            try {
                await archive.remove(this.kind, entry);
                this.archiveRevision++;
                this.saved = this.saved.filter(item => item.id !== entry.id);
                if (this.record?.id === entry.id) { this.record = null; this.markDirty(); }
                this.renderSaved();
                this.notice('Pizarra borrada.');
            } catch (error) {
                console.error(error);
                this.notice(error?.code ? 'No pude borrar la pizarra.' : error.message, true);
            } finally { this.lock(false); }
        }

        picture(items = this.items, subtitle = '', light = false) {
            const date = this.get('date')?.value;
            const title = this.title() || (this.formation ? 'Formación Sub 17' : 'Ejercicio Sub 17');
            return diagram.picture(this.board.field, items, this.roster, title, subtitle || (date ? Palometas.formatDate(date) : ''), light);
        }

        filename(extension) {
            const base = this.title().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
            return `palometas-${base || (this.formation ? 'formacion' : 'ejercicio')}.${extension}`;
        }

        download(url, filename) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.append(link);
            link.click();
            link.remove();
        }

        async exportPNG() {
            this.stop();
            this.lock(true);
            this.notice('Preparando imagen…');
            try {
                const canvas = await diagram.raster(this.picture());
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                if (!blob) throw new Error('No se pudo preparar el PNG.');
                const url = URL.createObjectURL(blob);
                this.download(url, this.filename('png'));
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                this.notice('Imagen PNG preparada para compartir o imprimir.');
            } catch (error) { this.notice(error.message, true); }
            finally { this.lock(false); }
        }

        async exportGIF() {
            if (this.board.frames.length < 2) return;
            this.stop();
            this.lock(true);
            this.notice('Preparando GIF…');
            try {
                const encoder = await gifshot();
                const frames = this.board.frames;
                const images = [];
                let width, height;
                for (const [i, frame] of frames.entries()) {
                    const canvas = await diagram.raster(this.picture(frame.items, `Paso ${i + 1} de ${frames.length}`), 600);
                    width = canvas.width;
                    height = canvas.height;
                    images.push(canvas.toDataURL('image/png'));
                }
                const url = await new Promise((resolve, reject) => {
                    encoder.createGIF({ images, interval: 0.9, gifWidth: width, gifHeight: height }, result => {
                        if (result.error || !result.image) reject(new Error('No pude generar el GIF.'));
                        else resolve(result.image);
                    });
                });
                this.download(url, this.filename('gif'));
                this.notice('GIF preparado para compartir.');
            } catch (error) { this.notice(error.message, true); }
            finally { this.lock(false); }
        }

        print() {
            this.stop();
            const page = document.getElementById('board-print-page');
            const notes = diagram.label(this.get('notes').value, 2000);
            page.innerHTML = this.picture(this.items, '', true) + (notes ? `<p>${diagram.e(notes)}</p>` : '');
            document.body.classList.add('printing-board');
            window.print();
        }
    }

    return {
        init() {
            editors.push(new Editor(document.getElementById('formation-board'), 'formation'));
            editors.push(new Editor(document.getElementById('exercise-board'), 'exercise'));
            window.addEventListener('afterprint', () => document.body.classList.remove('printing-board'));
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) editors.forEach(editor => editor.hide());
            });
        },
        show(screen, openSaved = false) {
            editors.forEach(editor => {
                if (editor.root.closest('.screen').id === 'screen-' + screen) editor.show(openSaved);
                else editor.hide();
            });
        },
        refreshRoster() { editors.forEach(editor => editor.refreshRoster()); }
    };
})();
