/* Guarda las pizarras editables en las colecciones que ya usa Palometas. */
window.BoardArchive = (() => {
    const diagram = BoardDiagram;
    const collection = kind => window.db.collection(kind === 'formation' ? 'formations' : 'tactical_gifs');
    const revision = data => Number.isInteger(data?.board_revision) ? data.board_revision : 0;
    const timestamp = data => {
        const value = data.updated_at || data.created_at || data.formation_date;
        return typeof value?.toMillis === 'function' ? value.toMillis() : Date.parse(value || '') || 0;
    };
    const legacyPlayers = data => Array.isArray(data.positions_data?.players) ? data.positions_data.players : [];
    const legacyDrawings = data => Array.isArray(data.positions_data?.drawings) ? data.positions_data.drawings : [];

    function allowed(entry, roster) {
        const { data } = entry;
        const category = data.team_category || data.category;
        if (category) return Palometas.isSub17({ category });
        if (data.format === diagram.format) return false;
        return legacyPlayers(data).some(player => roster.has(player?.id));
    }

    async function load(kind) {
        const source = collection(kind);
        const query = kind === 'exercise' ? source.where('format', '==', diagram.format) : source;
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })).sort((a, b) => timestamp(b.data) - timestamp(a.data));
    }

    function legacyBoard(data, roster) {
        const old = data.positions_data || {};
        const players = legacyPlayers(data).filter(player => player && (roster.has(player.id) || player.isOpponent || player.id === 'O'));
        const lines = legacyDrawings(data).filter(line => line && [line.x1, line.y1, line.x2, line.y2].every(Number.isFinite));
        // Las pizarras viejas usaban píxeles y algunas no registraban el tamaño del lienzo.
        const size = (key, values, minimum) => Number.isFinite(old[key]) && old[key] > 0 ? old[key] : Math.max(minimum, ...values.filter(Number.isFinite).map(value => value + 28));
        const w = size('width', [...players.map(p => p.x), ...lines.flatMap(d => [d.x1, d.x2])], 360);
        const h = size('height', [...players.map(p => p.y), ...lines.flatMap(d => [d.y1, d.y2])], 510);
        const x = value => diagram.width * value / w;
        const y = value => diagram.height * value / h;
        const used = new Set();
        const items = players.flatMap(player => {
            const opponent = player.isOpponent || player.id === 'O';
            if (!opponent && used.has(player.id)) return [];
            if (!opponent) used.add(player.id);
            return [{ id: diagram.id(), kind: 'player', playerId: opponent ? '' : player.id,
                label: opponent ? 'Rival' : roster.get(player.id), color: opponent ? 'azul' : 'bordo', x: x(player.x), y: y(player.y) }];
        });
        items.push(...lines.map(line => ({ id: diagram.id(), kind: line.type === 'arrow' ? 'run' : 'pass',
            x: x(line.x1), y: y(line.y1), x2: x(line.x2), y2: y(line.y2) })));
        return diagram.normalize({ field: 'full', frames: [{ items }] });
    }

    function draft(entry, roster) {
        const { data } = entry, legacy = data.format !== diagram.format;
        return {
            legacy,
            title: diagram.label(data.name || 'Formación anterior', 100),
            date: Palometas.parseDate(data.formation_date) ? data.formation_date : '',
            notes: diagram.label(data.description || data.substitutes_list, 2000),
            board: legacy ? legacyBoard(data, roster) : diagram.normalize(data.board_data)
        };
    }

    async function save(kind, entry, details) {
        if (!window.db || !window.auth?.currentUser) throw new Error('Ingresá al sitio para guardar la pizarra.');
        const source = collection(kind);
        const ref = entry ? source.doc(entry.id) : source.doc();
        const now = new Date().toISOString();
        const data = {
            format: diagram.format, team_category: 'Sub17', name: details.title,
            description: details.notes, board_data: details.board,
            created_at: entry?.data.created_at || now, updated_at: now,
            board_revision: revision(entry?.data) + 1
        };
        if (kind === 'formation') {
            const items = details.board.frames[0].items;
            data.formation_date = details.date;
            // Conserva la estructura que leía la pizarra anterior.
            data.positions_data = {
                width: diagram.width, height: diagram.height,
                players: items.filter(p => p.kind === 'player' && !p.slot).map(p => ({
                    id: p.playerId || 'O', name: p.label, x: p.x, y: p.y, isOpponent: !p.playerId
                })),
                drawings: items.filter(p => diagram.isLine(p.kind)).map(p => ({
                    type: p.kind === 'run' ? 'arrow' : 'line', x1: p.x, y1: p.y, x2: p.x2, y2: p.y2
                }))
            };
        } else data.phase = 'Ejercicio de entrenamiento';

        await window.db.runTransaction(async transaction => {
            const current = await transaction.get(ref);
            if (entry && (!current.exists || revision(current.data()) !== revision(entry.data))) {
                throw new Error('La pizarra cambió desde que la abriste. Podés guardar tu trabajo como variante o volver a abrirla.');
            }
            transaction.set(ref, data, { merge: Boolean(entry) });
        });
        return { id: ref.id, data };
    }

    async function remove(kind, entry) {
        if (!window.db || !window.auth?.currentUser) throw new Error('Ingresá al sitio para borrar la pizarra.');
        const ref = collection(kind).doc(entry.id);
        await window.db.runTransaction(async transaction => {
            const current = await transaction.get(ref);
            if (!current.exists) return;
            if (revision(current.data()) !== revision(entry.data)) throw new Error('Hay una versión más reciente. Actualizá la lista antes de borrarla.');
            transaction.delete(ref);
        });
    }

    return { load, allowed, draft, save, remove };
})();
