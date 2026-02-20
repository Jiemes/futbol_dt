const planningManager = {
    plans: [],
    libraryExercises: [],
    selectedExercises: [],
    currentSearch: '',
    selectorSearch: '',

    async init() {
        await this.loadLibraryCache();
        await this.loadPlans();
        // Don't render full selector yet, wait for search or show a subset
        this.renderMiniLibrarySelector();
    },

    async loadLibraryCache() {
        if (!window.db) return;
        try {
            const snapshot = await window.db.collection('exercises').get();
            this.libraryExercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(error);
        }
    },

    async loadPlans() {
        if (!window.db) return;
        try {
            const snapshot = await window.db.collection('planning').orderBy('session_date', 'desc').get();
            this.plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderPlans();
        } catch (error) {
            console.error(error);
        }
    },

    handleSearch() {
        this.currentSearch = document.getElementById('planning-search').value.toLowerCase();
        this.renderPlans();
    },

    handleSelectorSearch() {
        this.selectorSearch = document.getElementById('selector-search').value.toLowerCase();
        this.renderMiniLibrarySelector();
    },

    async renderMiniLibrarySelector() {
        const grid = document.getElementById('mini-exercise-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // Filter based on search
        let filtered = [];
        if (this.selectorSearch.length > 0) {
            filtered = this.libraryExercises.filter(ex =>
                ex.title.toLowerCase().includes(this.selectorSearch) ||
                (ex.category && ex.category.toLowerCase().includes(this.selectorSearch)) ||
                (ex.description && ex.description.toLowerCase().includes(this.selectorSearch))
            );
        } else {
            // Show only currently selected if no search
            filtered = this.libraryExercises.filter(ex => this.selectedExercises.includes(ex.id));
        }

        filtered.forEach(ex => {
            const item = document.createElement('div');
            item.className = 'mini-ex-item';
            if (this.selectedExercises.includes(ex.id)) item.classList.add('selected');
            item.innerHTML = `<strong>${ex.category || ''}</strong><br>${ex.title}`;
            item.onclick = () => this.toggleExerciseSelection(ex.id, item);
            grid.appendChild(item);
        });
    },

    toggleExerciseSelection(id, element) {
        if (this.selectedExercises.includes(id)) {
            this.selectedExercises = this.selectedExercises.filter(item => item !== id);
            element.classList.remove('selected');
        } else {
            this.selectedExercises.push(id);
            element.classList.add('selected');
        }
    },

    async addPlan() {
        const title = document.getElementById('plan-title').value;
        const date = document.getElementById('plan-date').value;
        const content = document.getElementById('plan-content').value;

        if (!title || !date || !window.db) return;

        try {
            await window.db.collection('planning').add({
                title: title,
                session_date: date,
                content: content,
                exercise_ids: this.selectedExercises
            });
            await this.loadPlans();
            document.getElementById('add-plan-form').reset();
            this.selectedExercises = [];
            this.selectorSearch = '';
            document.getElementById('selector-search').value = '';
            this.renderMiniLibrarySelector();
        } catch (error) {
            console.error(error);
            alert("Error al guardar planificación.");
        }
    },

    togglePlanCollapse(card) {
        card.classList.toggle('active');
    },

    async deletePlan(id, event) {
        if (event) event.stopPropagation();
        if (confirm("¿Eliminar este plan?") && window.db) {
            try {
                await window.db.collection('planning').doc(id).delete();
                await this.loadPlans();
            } catch (error) {
                console.error(error);
            }
        }
    },

    renderPlans() {
        const list = document.getElementById('planning-list');
        if (!list) return;

        list.innerHTML = '';

        let filteredPlans = this.plans;
        if (this.currentSearch) {
            filteredPlans = filteredPlans.filter(p => p.title.toLowerCase().includes(this.currentSearch));
        }

        if (filteredPlans.length === 0) {
            list.innerHTML = '<p class="text-muted">No se encontraron sesiones.</p>';
            return;
        }

        filteredPlans.forEach(p => {
            const card = document.createElement('div');
            card.className = 'plan-card';
            card.onclick = () => this.togglePlanCollapse(card);

            let exercisesHtml = '';
            if (p.exercise_ids && p.exercise_ids.length > 0) {
                exercisesHtml = '<div class="plan-exercises-detailed">';
                p.exercise_ids.forEach(eid => {
                    const ex = this.libraryExercises.find(e => e.id === eid);
                    if (ex) {
                        exercisesHtml += `
                            <div class="plan-ex-card-mini" onclick="event.stopPropagation(); libraryManager.showExerciseDetail('${ex.id}')">
                                <img src="${ex.gif_url || 'images/camiseta.png'}" onerror="this.src='images/camiseta.png'">
                                <div class="info">
                                    <span class="badge" style="font-size:0.6rem; opacity:0.8;">${ex.category || ''}</span>
                                    <h5>${ex.title}</h5>
                                    <p>${ex.description || '-'}</p>
                                </div>
                            </div>
                        `;
                    }
                });
                exercisesHtml += '</div>';
            }

            card.innerHTML = `
                <div class="plan-header">
                    <span class="plan-date"><i class="far fa-calendar-alt"></i> ${p.session_date}</span>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <button class="btn-delete-small" onclick="planningManager.deletePlan('${p.id}', event)"><i class="fas fa-trash"></i></button>
                        <i class="fas fa-chevron-down toggle-icon"></i>
                    </div>
                </div>
                <h4>${p.title}</h4>
                <div class="plan-details">
                    <p>${p.content ? p.content.replace(/\n/g, '<br>') : '-'}</p>
                    <div style="margin-top:15px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
                        <h5 style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; margin-bottom:10px;">Ejercicios Vinculados:</h5>
                        ${exercisesHtml || '<p class="text-muted" style="font-size:0.8rem;">Sin ejercicios específicos</p>'}
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => planningManager.init());
