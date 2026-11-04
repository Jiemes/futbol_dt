const playersManager = {
    players: [],
    allPlayers: [],
    init() {
        playerPhotos.init();
        document.getElementById('add-player-form').addEventListener('submit', event => { event.preventDefault(); this.savePlayer(); });
        document.getElementById('player-search').addEventListener('input', () => this.renderPlayersList());
        document.getElementById('player-delete').addEventListener('click', () => this.deletePlayer());
    },
    async loadPlayers() {
        if (!window.db || !window.auth?.currentUser) return;
        try {
            const snapshot = await window.db.collection('players').get();
            this.allPlayers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.players = this.allPlayers.filter(Palometas.isSub17).sort((a, b) => Palometas.nameOf(a).localeCompare(Palometas.nameOf(b), 'es'));
            this.renderPlayersList();
            document.getElementById('review-categories').hidden = !auth.currentUser.isOwner || !this.allPlayers.some(player => !Palometas.isSub17(player));
            app.updateDashboard();
            // The existing login calls loadPlayers(); hydrate the remaining panels here.
            await Promise.allSettled([matchesManager.loadMatches(), libraryManager.loadExercises()]);
        } catch (error) {
            console.error(error); app.notify('No se pudo cargar el plantel. Revisá la conexión y volvé a intentar.', true);
        }
    },
    renderPlayersList() {
        const grid = document.getElementById('players-grid');
        const search = document.getElementById('player-search').value.toLocaleLowerCase('es');
        const players = this.players.filter(player => [Palometas.nameOf(player), player.full_name, player.position, player.second_position].join(' ').toLocaleLowerCase('es').includes(search));
        grid.replaceChildren();
        if (!players.length) grid.innerHTML = '<p class="empty-state">No hay jugadoras para mostrar. Podés agregar las incorporaciones o revisar otras categorías.</p>';
        for (const player of players) {
            const card = document.createElement('article'); card.className = 'player-card';
            const birthday = Palometas.parseDate(player.birthdate) ? Palometas.formatDate(player.birthdate) : 'Cumpleaños sin completar';
            const photo = Palometas.imageURL(player.photo_url);
            card.innerHTML = (photo ? '<div class="card-avatar"><img src="' + Palometas.escapeHTML(photo) + '" alt="" loading="lazy"></div>' : '') +
                '<div class="card-info"><h2>' + Palometas.escapeHTML(Palometas.nameOf(player)) + '</h2><p>' + Palometas.escapeHTML(player.position || 'Posición sin definir') + '</p><p>' + Palometas.escapeHTML(birthday) + '</p><div class="button-row"><button class="btn btn-secondary btn-sm">Ver / editar datos</button></div></div>';
            card.querySelector('button').addEventListener('click', () => this.editPlayer(player.id)); grid.appendChild(card);
        }
    },
    editPlayer(id) {
        const player = id ? this.players.find(item => item.id === id) : {};
        if (!player) return;
        const form = document.getElementById('add-player-form'); form.reset();
        playerPhotos.reset(player.photo_url);
        document.getElementById('p-edit-id').value = player.id || '';
        document.getElementById('p-alias').value = player.alias || player.full_name || '';
        document.getElementById('p-name').value = player.full_name || '';
        document.getElementById('p-birthdate').value = player.birthdate || '';
        document.getElementById('p-birthdate').max = Palometas.todayISO();
        const position = document.getElementById('p-position');
        if (player.position && ![...position.options].some(option => option.value === player.position)) position.add(new Option(player.position, player.position));
        position.value = player.position || '';
        document.getElementById('p-second-position').value = player.second_position === '-' ? '' : player.second_position || '';
        document.getElementById('p-phone').value = player.phone || '';
        document.getElementById('p-emergency').value = player.emergency_contact || '';
        document.getElementById('player-title').textContent = id ? 'Datos de la jugadora' : 'Agregar jugadora a Sub 17';
        document.getElementById('player-delete').hidden = !id;
        document.getElementById('player-form-error').textContent = '';
        document.getElementById('player-dialog').showModal();
    },
    async savePlayer() {
        if (!window.db || !window.auth?.currentUser) return;
        const button = document.getElementById('player-save'); if (button.disabled) return;
        const errorElement = document.getElementById('player-form-error'); errorElement.textContent = '';
        const birthdate = document.getElementById('p-birthdate').value;
        const alias = document.getElementById('p-alias').value.trim();
        if (!alias || (birthdate && (!Palometas.parseDate(birthdate) || birthdate > Palometas.todayISO()))) {
            errorElement.textContent = 'Completá el nombre y revisá la fecha de nacimiento.'; return;
        }
        const data = { alias, full_name: document.getElementById('p-name').value.trim(), birthdate: birthdate || null, category: 'Sub17',
            position: document.getElementById('p-position').value, second_position: document.getElementById('p-second-position').value.trim(),
            phone: document.getElementById('p-phone').value.trim(), emergency_contact: document.getElementById('p-emergency').value.trim() };
        const id = document.getElementById('p-edit-id').value;
        if (!id || playerPhotos.changed) data.photo_url = playerPhotos.value || null;
        button.disabled = true;
        document.getElementById('player-delete').disabled = true;
        try {
            if (id) await window.db.collection('players').doc(id).update(data);
            else await window.db.collection('players').add(data);
            await this.loadPlayers(); document.getElementById('player-dialog').close(); app.notify('Datos de la jugadora guardados.');
        } catch (error) { console.error(error); errorElement.textContent = 'No se pudo guardar. Los datos siguen en el formulario para reintentar.'; }
        finally { button.disabled = false; document.getElementById('player-delete').disabled = false; }
    },
    async deletePlayer() {
        if (!window.db || !window.auth?.currentUser) return;
        const id = document.getElementById('p-edit-id').value;
        const player = this.players.find(item => item.id === id);
        const remove = document.getElementById('player-delete'), save = document.getElementById('player-save');
        if (!player || remove.disabled || save.disabled) return;
        if (!confirm('¿Borrar a ' + Palometas.nameOf(player) + ' del plantel Sub 17? Esta acción elimina su ficha.')) return;
        remove.disabled = true; save.disabled = true;
        document.getElementById('player-form-error').textContent = '';
        try {
            await window.db.collection('players').doc(id).delete();
            await this.loadPlayers(); document.getElementById('player-dialog').close(); app.notify('Jugadora borrada del plantel.');
        } catch (error) { console.error(error); document.getElementById('player-form-error').textContent = 'No se pudo borrar la jugadora. Podés volver a intentar.'; }
        finally { remove.disabled = false; save.disabled = false; }
    },
    reviewCategories() {
        if (!window.auth?.currentUser?.isOwner) return;
        const grid = document.getElementById('cleanup-list'); grid.replaceChildren();
        for (const player of this.allPlayers.filter(item => !Palometas.isSub17(item))) {
            const row = document.createElement('div'); row.className = 'cleanup-row';
            const label = document.createElement('label'); label.textContent = Palometas.nameOf(player);
            const small = document.createElement('small'); small.textContent = player.category || 'Sin categoría'; label.appendChild(small);
            const select = document.createElement('select'); select.dataset.playerId = player.id; select.setAttribute('aria-label', 'Acción para ' + Palometas.nameOf(player));
            for (const [value, name] of [['keep', 'Conservar'], ['promote', 'Incorporar a Sub 17'], ['delete', 'Borrar registro']]) select.add(new Option(name, value));
            if (/^(1ra|primera|res|reserva)$/i.test(player.category || '')) select.value = 'delete';
            row.append(label, select); grid.appendChild(row);
        }
        if (!grid.children.length) grid.innerHTML = '<p>No hay jugadoras de otras categorías.</p>';
        document.getElementById('cleanup-error').textContent = '';
        document.getElementById('cleanup-dialog').showModal();
    },
    async applyCategoryChanges() {
        if (!window.db || !window.auth?.currentUser?.isOwner) return;
        const button = document.getElementById('cleanup-apply'); if (button.disabled) return;
        const selected = [...document.querySelectorAll('#cleanup-list select')].filter(select => select.value !== 'keep').map(select => ({
            player: this.allPlayers.find(player => player.id === select.dataset.playerId && !Palometas.isSub17(player)), action: select.value
        })).filter(item => item.player);
        if (!selected.length) { document.getElementById('cleanup-error').textContent = 'Elegí al menos un cambio.'; return; }
        if (selected.length > 450) { document.getElementById('cleanup-error').textContent = 'Aplicá los cambios en grupos de hasta 450 registros.'; return; }
        const deleted = selected.filter(item => item.action === 'delete').map(item => item.player);
        const promoted = selected.filter(item => item.action === 'promote');
        if (!confirm('Se incorporarán ' + promoted.length + ' jugadoras a Sub 17 y se borrarán ' + deleted.length + ' registros de otras categorías. ¿Aplicar estos cambios?')) return;
        button.disabled = true;
        try {
            if (deleted.length) Palometas.download(JSON.stringify({ exported_at: new Date().toISOString(), players: deleted }, null, 2), 'application/json', 'respaldo-otras-categorias-' + Palometas.todayISO() + '.json');
            const batch = window.db.batch();
            for (const item of selected) {
                const ref = window.db.collection('players').doc(item.player.id);
                if (item.action === 'promote') batch.update(ref, { category: 'Sub17' });
                else if (item.action === 'delete') batch.delete(ref);
            }
            await batch.commit(); await this.loadPlayers(); document.getElementById('cleanup-dialog').close();
            app.notify('Plantel actualizado: ' + promoted.length + ' incorporaciones y ' + deleted.length + ' registros borrados.');
        } catch (error) { console.error(error); document.getElementById('cleanup-error').textContent = 'No se aplicaron los cambios. Revisá los permisos y volvé a intentar.'; }
        finally { button.disabled = false; }
    }
};
window.playersManager = playersManager;

