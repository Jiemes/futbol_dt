(() => {
    const year = '2011';
    const labels = {
        create: 'Crear ficha',
        promote: 'Incorporar desde Sub 15',
        complete: 'Completar fecha en Sub 17',
        existing: 'Ya está en Sub 17',
        review: 'Revisar ficha existente'
    };

    function nameKey(value) {
        return (String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).sort().join(' ');
    }

    function parseRows(value) {
        const lines = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (!lines.length || lines.length > 50) throw new Error('Pegá entre 1 y 50 filas.');
        const names = new Set();
        return lines.map((line, index) => {
            const [name, date, extra] = line.split('|').map(part => part.trim());
            const key = nameKey(name);
            if (!key || name.length > 80 || extra !== undefined || !date?.startsWith(year + '-') || !Palometas.parseDate(date)) {
                throw new Error('Revisá la fila ' + (index + 1) + '. Usá nombre completo | AAAA-MM-DD, con fecha de 2011.');
            }
            if (names.has(key)) throw new Error('Hay un nombre repetido en la fila ' + (index + 1) + '.');
            names.add(key);
            return { name, date, key };
        });
    }

    async function planImport(collection, rows) {
        const snapshot = await collection.get({ source: 'server' });
        const players = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                key: nameKey(data.full_name || data.alias),
                date: data.birthdate || '',
                category: String(data.category ?? '').toLowerCase().replace(/[\s_-]/g, ''),
                sub17: Palometas.isSub17(data)
            };
        });
        return rows.map(row => {
            const matches = players.filter(player => player.key === row.key);
            const [match] = matches;
            if (!match) {
                const action = players.some(player => player.date === row.date) ? 'review' : 'create';
                return { ...row, action };
            }
            let action = 'review';
            if (matches.length === 1 && (!match.date || match.date === row.date)) {
                if (match.sub17) action = match.date ? 'existing' : 'complete';
                else if (['sub15', 'u15'].includes(match.category)) action = 'promote';
            }
            return { ...row, action, match };
        });
    }

    function canSave(row) {
        return ['create', 'promote', 'complete'].includes(row.action);
    }

    async function saveRows(collection, plan) {
        const writes = await Promise.all(plan.filter(canSave).map(async row => {
            if (row.match) return { row, ref: collection.doc(row.match.id) };
            const bytes = new TextEncoder().encode(row.key + '|' + row.date);
            const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
            const id = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
            return { row, ref: collection.doc('import-' + id) };
        }));
        await window.db.runTransaction(async transaction => {
            const entries = await Promise.all(writes.map(write => transaction.get(write.ref)));
            for (let index = 0; index < writes.length; index++) {
                const { row, ref } = writes[index];
                const entry = entries[index];
                if (row.action === 'create') {
                    if (entry.exists) throw new Error('El plantel cambió. Volvé a revisar la lista.');
                    transaction.set(ref, { alias: row.name, full_name: row.name, birthdate: row.date, category: 'Sub17' });
                    continue;
                }
                const data = entry.data();
                const category = String(data?.category ?? '').toLowerCase().replace(/[\s_-]/g, '');
                if (!data || category !== row.match.category || (data.birthdate || '') !== row.match.date ||
                    nameKey(data.full_name || data.alias) !== row.key) {
                    throw new Error('Una ficha cambió. Volvé a revisar la lista.');
                }
                const changes = {};
                if (row.action === 'promote') changes.category = 'Sub17';
                if (!data.birthdate) changes.birthdate = row.date;
                transaction.update(ref, changes);
            }
        });
    }

    window.addEventListener('DOMContentLoaded', () => {
        const open = document.getElementById('roster-import-open');
        const dialog = document.getElementById('roster-import-dialog');
        const input = document.getElementById('roster-import-input');
        const review = document.getElementById('roster-import-review');
        const save = document.getElementById('roster-import-save');
        const close = document.getElementById('roster-import-close');
        const status = document.getElementById('roster-import-status');
        const list = document.getElementById('roster-import-list');
        let plan = [];
        let busy = false;

        function render(nextPlan) {
            plan = nextPlan;
            list.replaceChildren();
            for (const row of plan) {
                const item = document.createElement('li');
                item.textContent = row.name + ' · ' + Palometas.formatDate(row.date) + ' · ' + labels[row.action];
                list.append(item);
            }
            save.hidden = !plan.some(canSave);
        }

        async function run(operation) {
            if (busy || !window.auth?.currentUser?.isOwner || !window.db) return;
            busy = true;
            review.disabled = save.disabled = input.disabled = close.disabled = true;
            status.textContent = '';
            try {
                await operation(window.db.collection('players'));
            } catch (error) {
                status.textContent = error instanceof Error ? error.message : 'No se pudo acceder al plantel.';
            } finally {
                busy = false;
                review.disabled = save.disabled = input.disabled = close.disabled = false;
            }
        }

        open.addEventListener('click', () => {
            if (!window.auth?.currentUser?.isOwner) {
                app.notify('Ingresá con la cuenta administradora para incorporar jugadoras.', true);
                return;
            }
            dialog.showModal();
        });
        input.addEventListener('input', () => { status.textContent = ''; render([]); });
        dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
        dialog.addEventListener('close', () => { input.value = ''; status.textContent = ''; render([]); });

        review.addEventListener('click', () => run(async collection => {
            render([]);
            render(await planImport(collection, parseRows(input.value)));
            const pending = plan.filter(row => row.action === 'review').length;
            const writable = plan.filter(canSave).length;
            status.textContent = writable + ' para guardar. ' + pending + ' para revisar manualmente.';
        }));

        save.addEventListener('click', () => run(async collection => {
            const current = await planImport(collection, parseRows(input.value));
            if (JSON.stringify(current) !== JSON.stringify(plan)) {
                render(current);
                status.textContent = 'El plantel cambió. Revisá la lista actualizada antes de guardar.';
                return;
            }
            const count = current.filter(canSave).length;
            const pending = current.filter(row => row.action === 'review').length;
            if (!count) return;
            await saveRows(collection, current);
            await playersManager.loadPlayers();
            dialog.close();
            app.notify('Fichas guardadas en Sub 17: ' + count + '. Pendientes de revisión: ' + pending + '.');
        }));
    });
})();
