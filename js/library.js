const libraryManager = {
    exercises: [],
    previewURL: null,
    init() {
        document.getElementById('gif-form').addEventListener('submit', event => { event.preventDefault(); this.addExercise(); });
        document.getElementById('library-search').addEventListener('input', () => this.renderExercises());
        document.getElementById('gif-file').addEventListener('change', () => this.previewFile());
        document.getElementById('gif-url').addEventListener('change', () => {
            if (!document.getElementById('gif-file').files.length) this.setPreview(Palometas.imageURL(document.getElementById('gif-url').value));
        });
        document.getElementById('gif-dialog').addEventListener('close', () => this.releasePreview());
        document.getElementById('gif-viewer').addEventListener('close', () => document.getElementById('gif-viewer-image').removeAttribute('src'));
    },
    async loadExercises() {
        if (!window.db || !window.auth?.currentUser) return;
        const collections = ['tactical_gifs', 'exercises'];
        const results = await Promise.allSettled(collections.map(name => window.db.collection(name).get()));
        this.exercises = [];
        results.forEach((result, index) => {
            if (result.status !== 'fulfilled') { console.error(result.reason); return; }
            result.value.docs.forEach(doc => {
                const data = doc.data();
                if (data.team_category && !Palometas.isSub17({ category: data.team_category })) return;
                if (!Palometas.imageURL(data.gif_url)) return;
                this.exercises.push({ ...data, id: doc.id, collection: collections[index], title: data.name || data.title || 'Jugada sin nombre', phase: data.phase || data.category || 'Jugada' });
            });
        });
        this.exercises.sort((a, b) => a.title.localeCompare(b.title, 'es'));
        this.renderExercises();
        if (results.some(result => result.status === 'rejected')) app.notify('No se pudo cargar una parte de las jugadas. Revisá la conexión y volvé a intentar.', true);
    },
    renderExercises() {
        const grid = document.getElementById('library-grid'), search = document.getElementById('library-search').value.toLocaleLowerCase('es');
        grid.replaceChildren();
        const filtered = this.exercises.filter(item => [item.title, item.description, item.phase].join(' ').toLocaleLowerCase('es').includes(search));
        if (!filtered.length) grid.innerHTML = '<p class="empty-state">Todavía no hay jugadas para mostrar. Agregá un GIF preparado en nuestra conversación o buscá con otras palabras.</p>';
        for (const item of filtered) {
            const escape = Palometas.escapeHTML, card = document.createElement('article'); card.className = 'exercise-card';
            card.innerHTML = '<button class="exercise-thumb" aria-label="' + escape('Ver ' + item.title) + '"><img loading="lazy" src="' + escape(Palometas.imageURL(item.gif_url)) + '" alt=""></button>' +
                '<div class="exercise-info"><span class="badge">' + escape(item.phase) + '</span><h2>' + escape(item.title) + '</h2><p class="text-muted">' + escape(item.description || '') + '</p><div class="button-row"><button class="btn btn-secondary btn-sm">Ver jugada</button><button class="btn btn-secondary btn-sm btn-danger">Borrar</button></div></div>';
            const buttons = card.querySelectorAll('button');
            buttons[0].addEventListener('click', () => this.showExerciseDetail(item));
            buttons[1].addEventListener('click', () => this.showExerciseDetail(item));
            buttons[2].addEventListener('click', () => this.deleteExercise(item)); grid.appendChild(card);
        }
    },
    showExerciseDetail(item) {
        document.getElementById('gif-viewer-title').textContent = item.title;
        document.getElementById('gif-viewer-description').textContent = item.description || '';
        const image = document.getElementById('gif-viewer-image'); image.src = Palometas.imageURL(item.gif_url); image.alt = item.title;
        const link = document.getElementById('gif-viewer-link'); link.href = Palometas.imageURL(item.gif_url);
        if (item.gif_url.startsWith('data:')) { link.download = 'jugada-palometas.gif'; link.textContent = 'Descargar GIF'; }
        else { link.removeAttribute('download'); link.textContent = 'Abrir GIF'; }
        document.getElementById('gif-viewer').showModal();
    },
    editGif() {
        this.releasePreview(); document.getElementById('gif-form').reset(); this.setPreview('');
        document.getElementById('gif-form-error').textContent = ''; document.getElementById('gif-progress').textContent = '';
        document.getElementById('gif-dialog').showModal();
    },
    releasePreview() { if (this.previewURL) { URL.revokeObjectURL(this.previewURL); this.previewURL = null; } },
    setPreview(url) {
        const image = document.getElementById('gif-preview'); image.hidden = !url;
        if (url) image.src = url; else image.removeAttribute('src');
    },
    async previewFile() {
        this.releasePreview(); document.getElementById('gif-form-error').textContent = '';
        const file = document.getElementById('gif-file').files[0];
        if (!file) { this.setPreview(''); return; }
        try {
            await Palometas.validateGif(file);
            this.previewURL = URL.createObjectURL(file); this.setPreview(this.previewURL);
        } catch (error) { this.setPreview(''); document.getElementById('gif-form-error').textContent = error.message; }
    },
    async addExercise() {
        if (!window.db || !window.auth?.currentUser) return;
        const button = document.getElementById('gif-save'); if (button.disabled) return;
        const errorElement = document.getElementById('gif-form-error'), progress = document.getElementById('gif-progress');
        errorElement.textContent = ''; progress.textContent = '';
        const title = document.getElementById('gif-name').value.trim(), file = document.getElementById('gif-file').files[0], inputURL = document.getElementById('gif-url').value.trim();
        if (!title || (!file && !inputURL) || (file && inputURL)) { errorElement.textContent = 'Completá un nombre y elegí un archivo GIF o un enlace, una de las dos opciones.'; return; }
        button.disabled = true;
        try {
            const ref = window.db.collection('tactical_gifs').doc();
            let url = Palometas.imageURL(inputURL);
            if (file) {
                await Palometas.validateGif(file);
                progress.textContent = 'Guardando GIF…';
                // 600 KiB becomes 800 KiB in base64, leaving room under Firestore's 1 MiB document limit.
                url = await new Promise((resolve, reject) => {
                    const reader = new FileReader(); reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('No se pudo leer el archivo GIF.')); reader.readAsDataURL(file);
                });
            }
            if (!url) throw new Error('Usá un enlace HTTPS válido para la jugada.');
            await ref.set({ name: title, team_category: 'Sub17', phase: document.getElementById('gif-phase').value,
                description: document.getElementById('gif-description').value.trim().slice(0, 4000), gif_url: url, created_at: new Date().toISOString() });
            await this.loadExercises(); document.getElementById('gif-dialog').close(); app.notify('Jugada guardada.');
        } catch (error) {
            console.error(error);
            errorElement.textContent = error.message || 'No se pudo guardar la jugada. El formulario conserva los datos para reintentar.';
        } finally { button.disabled = false; progress.textContent = ''; }
    },
    async deleteExercise(item) {
        if (!window.db || !window.auth?.currentUser || !confirm('¿Borrar esta jugada de la biblioteca?')) return;
        try {
            await window.db.collection(item.collection).doc(item.id).delete();
            await this.loadExercises(); app.notify('Jugada borrada.');
        } catch (error) { console.error(error); app.notify('No se pudo borrar la jugada.', true); }
    }
};
window.libraryManager = libraryManager;

