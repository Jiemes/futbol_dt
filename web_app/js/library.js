const libraryManager = {
    exercises: [],
    currentFilter: 'all',
    currentSearch: '',

    async init() {
        await this.loadExercises();
        this.addFilterEventListeners();
    },

    addFilterEventListeners() {
        const filters = document.getElementById('library-filters');
        if (!filters) return;

        filters.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                filters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilter = chip.dataset.cat;
                this.renderExercises();
            });
        });
    },

    handleSearch() {
        this.currentSearch = document.getElementById('library-search').value.toLowerCase();
        this.renderExercises();
    },

    async loadExercises() {
        if (!window.db) return;
        try {
            const snapshot = await window.db.collection('exercises').orderBy('title').get();
            this.exercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderExercises();
        } catch (error) {
            console.error(error);
        }
    },

    async addExercise() {
        const title = document.getElementById('ex-title').value;
        const cat = document.getElementById('ex-cat').value;
        const desc = document.getElementById('ex-desc').value;
        const gif = document.getElementById('ex-gif').value;

        if (!title || !window.db) return;

        try {
            await window.db.collection('exercises').add({
                title: title,
                category: cat,
                description: desc,
                gif_url: gif
            });
            await this.loadExercises();
            document.getElementById('add-exercise-form').reset();
            this.showAddModal(false);
        } catch (error) {
            console.error(error);
            alert("Error al guardar el ejercicio.");
        }
    },

    async deleteExercise(id, e) {
        if (e) e.stopPropagation();
        if (confirm("¿Eliminar este ejercicio de la biblioteca?") && window.db) {
            try {
                await window.db.collection('exercises').doc(id).delete();
                await this.loadExercises();
            } catch (error) {
                console.error(error);
            }
        }
    },

    renderExercises() {
        const grid = document.getElementById('library-grid');
        if (!grid) return;

        grid.innerHTML = '';
        let filtered = this.exercises;

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(ex => ex.category === this.currentFilter);
        }

        if (this.currentSearch) {
            filtered = filtered.filter(ex =>
                ex.title.toLowerCase().includes(this.currentSearch) ||
                (ex.description && ex.description.toLowerCase().includes(this.currentSearch))
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">No se encontraron ejercicios.</p>';
            return;
        }

        filtered.forEach(ex => {
            const card = document.createElement('div');
            card.className = 'exercise-card';
            card.onclick = () => this.showExerciseDetail(ex.id);
            card.innerHTML = `
                <div class="exercise-thumb">
                    <img src="${ex.gif_url || 'images/camiseta.png'}" alt="${ex.title}" onerror="this.src='images/camiseta.png'">
                    <span class="badge" style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6);">${ex.category}</span>
                </div>
                <div class="exercise-info">
                    <h4>${ex.title}</h4>
                    <p style="font-size:0.85rem; color:var(--text-muted);">${ex.description ? ex.description.substring(0, 60) + '...' : '-'}</p>
                    <div style="display:flex; justify-content: flex-end; margin-top: 10px;">
                        <button onclick="libraryManager.deleteExercise('${ex.id}', event)" class="btn-delete-small"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    showExerciseDetail(id) {
        const ex = this.exercises.find(e => e.id === id);
        if (!ex) return;

        const content = document.getElementById('exercise-detail-content');
        content.innerHTML = `
            <div class="exercise-detail-view">
                <div class="detail-text">
                    <span class="badge" style="margin-bottom:10px;">${ex.category}</span>
                    <h2 style="margin-bottom:5px;">${ex.title}</h2>
                    <p style="margin-bottom:20px;">${ex.description ? ex.description.replace(/\n/g, '<br>') : 'Sin descripción'}</p>
                </div>
                <div class="detail-media">
                    <img src="${ex.gif_url || 'images/camiseta.png'}" alt="${ex.title}" onerror="this.src='images/camiseta.png'" style="max-width:100%; border-radius:12px;">
                </div>
            </div>
        `;
        this.showDetailModal(true);
    },

    // --- GIF Gallery Methods ---
    async showGifGallery(show) {
        const modal = document.getElementById('modal-gif-gallery');
        if (!modal) return;

        if (show) {
            modal.classList.add('active');
            await this.loadGifGallery();
        } else {
            modal.classList.remove('active');
        }
    },

    async loadGifGallery() {
        const grid = document.getElementById('gif-gallery-grid');
        if (!grid || !window.db) return;

        grid.innerHTML = '<p class="text-muted">Cargando galería...</p>';

        try {
            const snapshot = await window.db.collection('tactical_gifs').orderBy('created_at', 'desc').get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            grid.innerHTML = '';
            if (data.length === 0) {
                grid.innerHTML = '<p class="text-muted">No has creado GIFs todavía.</p>';
                return;
            }

            data.forEach(gif => {
                const item = document.createElement('div');
                item.className = 'config-card';
                item.style.padding = '10px';
                item.style.cursor = 'pointer';
                const dateStr = gif.created_at ? (gif.created_at.toDate ? gif.created_at.toDate().toLocaleDateString() : new Date(gif.created_at).toLocaleDateString()) : '-';
                item.innerHTML = `
                    <img src="${gif.gif_url}" style="width:100%; border-radius:8px; height:120px; object-fit:cover; margin-bottom:10px;">
                    <div style="font-size:0.85rem; font-weight:bold; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${gif.name}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted);">${dateStr}</div>
                `;
                item.onclick = () => {
                    document.getElementById('ex-gif').value = gif.gif_url;
                    this.showGifGallery(false);
                };
                grid.appendChild(item);
            });
        } catch (error) {
            console.error(error);
        }
    },

    showAddModal(show) {
        const modal = document.getElementById('modal-exercise');
        if (modal) {
            if (show) modal.classList.add('active');
            else modal.classList.remove('active');
        }
    },

    showDetailModal(show) {
        const modal = document.getElementById('modal-exercise-detail');
        if (modal) {
            if (show) modal.classList.add('active');
            else modal.classList.remove('active');
        }
    }
};

window.libraryManager = libraryManager;
window.addEventListener('DOMContentLoaded', () => libraryManager.init());
