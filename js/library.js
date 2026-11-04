const libraryManager = {
    exercises: [],
    previewURL: null,
    fallbackImage: 'images/jugada-sin-imagen.svg',
    availableImages: new Set(["images/camiseta.png","images/entrenamientos/2026-11-04/01-control-color.gif","images/entrenamientos/2026-11-04/01-control-color.png","images/entrenamientos/2026-11-04/02-rondo-apoyos.gif","images/entrenamientos/2026-11-04/02-rondo-apoyos.png","images/entrenamientos/2026-11-04/03-duelo-apoyos.gif","images/entrenamientos/2026-11-04/03-duelo-apoyos.png","images/entrenamientos/2026-11-04/04-salida-sin-arquera.gif","images/entrenamientos/2026-11-04/04-salida-sin-arquera.png","images/entrenamientos/2026-11-04/05-salida-con-arquera.gif","images/entrenamientos/2026-11-04/05-salida-con-arquera.png","images/entrenamientos/2026-11-04/06-ataque-pase-atras.gif","images/entrenamientos/2026-11-04/06-ataque-pase-atras.png","images/entrenamientos/2026-11-04/movilidad.svg","images/entrenamientos/2026-11-04/portada.svg","images/logo.png","images/jugada-sin-imagen.svg"]),
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
                if (!data.title && !data.name && !Palometas.imageURL(data.gif_url)) return;
                this.exercises.push({ ...data, id: doc.id, collection: collections[index], title: data.name || data.title || 'Jugada sin nombre', phase: data.phase || data.category || 'Jugada' });
            });
        });
        this.exercises.sort((a, b) => a.title.localeCompare(b.title, 'es'));
        this.renderExercises();
        if (results.some(result => result.status === 'rejected')) app.notify('No se pudo cargar una parte de las jugadas. Revisá la conexión y volvé a intentar.', true);
    },
    mediaFor(item) {
        const original = Palometas.imageURL(item.gif_url);
        const fallback = (note, referenceOnly = false) => ({ src: this.fallbackImage, original, note, placeholder: true, referenceOnly });
        if (!original) return fallback('Este ejercicio tiene su consigna disponible.');
        if (item.imageUnavailable) return fallback('La imagen externa no está disponible, la consigna sigue acá.');
        if (original.startsWith('data:')) return { src: original, original, placeholder: false };
        const parsed = new URL(original, document.baseURI), base = new URL('.', document.baseURI);
        if (parsed.origin === base.origin && parsed.pathname.startsWith(base.pathname)) {
            const relative = parsed.pathname.slice(base.pathname.length);
            if (!this.availableImages.has(relative)) return { ...fallback('El archivo de imagen no está disponible, podés leer la consigna.'), original: '' };
            return { src: original, original, placeholder: false };
        }
        const seededReference = item.collection === 'exercises' && (/^(?:www\.)?entrenamientosdefutbol\.es$/i.test(parsed.hostname) || (/giphy\.com$/i.test(parsed.hostname) && parsed.pathname.includes('/media/v1.')));
        if (seededReference) return fallback('Consigna disponible, la imagen guardada es una referencia externa antigua.', true);
        return { src: original, original, placeholder: false };
    },
    handleImageError(image, item, notice) {
        image.onerror = null;
        item.imageUnavailable = true;
        image.src = this.fallbackImage;
        image.alt = 'Consigna del ejercicio disponible';
        if (notice) { notice.textContent = 'La imagen no está disponible, podés seguir leyendo la consigna.'; notice.hidden = false; }
    },
    renderExercises() {
        const grid = document.getElementById('library-grid'), search = document.getElementById('library-search').value.toLocaleLowerCase('es');
        grid.replaceChildren();
        const filtered = this.exercises.filter(item => [item.title, item.description, item.phase].join(' ').toLocaleLowerCase('es').includes(search));
        if (!filtered.length) grid.innerHTML = '<p class="empty-state">Todavía no hay jugadas para mostrar. Agregá un GIF preparado en nuestra conversación o buscá con otras palabras.</p>';
        for (const item of filtered) {
            const media = this.mediaFor(item);
            const escape = Palometas.escapeHTML, card = document.createElement('article'); card.className = 'exercise-card';
            card.innerHTML = '<button class="exercise-thumb" aria-label="' + escape('Ver ' + item.title) + '"><img loading="lazy" src="' + escape(media.src) + '" alt=""></button>' +
                '<div class="exercise-info"><span class="badge">' + escape(item.phase) + '</span><h2>' + escape(item.title) + '</h2><p class="text-muted">' + escape(item.description || '') + '</p><p class="library-media-note" ' + (media.placeholder ? '' : 'hidden') + '>' + escape(media.note || '') + '</p><div class="button-row"><button class="btn btn-secondary btn-sm">Ver ejercicio</button><button class="btn btn-secondary btn-sm btn-danger">Borrar</button></div></div>';
            card.querySelector('img').onerror = event => this.handleImageError(event.currentTarget, item, card.querySelector('.library-media-note'));
            const buttons = card.querySelectorAll('button');
            buttons[0].addEventListener('click', () => this.showExerciseDetail(item));
            buttons[1].addEventListener('click', () => this.showExerciseDetail(item));
            buttons[2].addEventListener('click', () => this.deleteExercise(item)); grid.appendChild(card);
        }
    },
    showExerciseDetail(item) {
        const media = this.mediaFor(item);
        document.getElementById('gif-viewer-title').textContent = item.title;
        const description = document.getElementById('gif-viewer-description');
        description.textContent = (item.description || '') + (media.note ? '\n\n' + media.note : '');
        const image = document.getElementById('gif-viewer-image'); image.onerror = () => this.handleImageError(image, item, null); image.src = media.src; image.alt = media.placeholder ? 'Consigna disponible' : item.title;
        const link = document.getElementById('gif-viewer-link'); link.hidden = !media.original;
        if (media.original) link.href = media.original; else link.removeAttribute('href');
        if (media.original.startsWith('data:')) { link.download = 'jugada-palometas.gif'; link.textContent = 'Descargar GIF'; }
        else { link.removeAttribute('download'); link.textContent = media.placeholder ? 'Consultar referencia externa' : 'Abrir imagen'; }
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

