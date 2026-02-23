const tacticBoard = {
    canvas: null,
    ctx: null,
    playersOnField: [],
    drawings: [],
    currentTool: 'move',
    isDrawing: false,
    startX: 0,
    startY: 0,
    selectedPlayer: null,
    currentFilter: '1ra',
    lastPlacedPlayer: null, // For mobile placement fallback

    async init() {
        this.canvas = document.getElementById('tactic-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.resizeCanvas();
        this.addEventListeners();
        this.render();
        this.renderPlayerPool();
        await this.loadFormationsList();
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    },

    addEventListeners() {
        if (!this._initialized) {
            this.canvas.replaceWith(this.canvas.cloneNode(true));
            this.canvas = document.getElementById('tactic-canvas');
            this._initialized = true;

            // GLOBAL KEYBOARD SHORTCUTS
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (this.selectedPlayer) {
                        this.removePlayer(this.selectedPlayer);
                    }
                }
            });
        }

        this.ctx = this.canvas.getContext('2d');

        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => this.handleDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleUp(e));

        // Touch Events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleDown(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            this.handleUp(e.changedTouches[0]);
        });

        // Drag and Drop (Desktop)
        this.canvas.addEventListener('dragenter', (e) => e.preventDefault());
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('dragleave', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            try {
                // Clear any click-to-place to avoid double placement on desktop
                this.lastPlacedPlayer = null;
                const dataStr = e.dataTransfer.getData('text/plain');
                if (!dataStr) return;
                const data = JSON.parse(dataStr);
                const coords = this.getCoords(e);
                this.addPlayerToField(data.id, data.name, coords.x, coords.y);
            } catch (err) {
                console.error("Drop error:", err);
            }
        });

        // Tool buttons
        document.querySelectorAll('#screen-tactic .tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#screen-tactic .tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });

        if (!this._resizeAttached) {
            window.addEventListener('resize', () => {
                if (document.getElementById('screen-tactic').classList.contains('active')) {
                    this.resizeCanvas();
                }
            });
            this._resizeAttached = true;
        }
    },

    getCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    addPlayerToField(id, name, x, y) {
        // Anti-duplication check: check if player is already on field
        const exists = this.playersOnField.some(p => p.id === id);
        if (exists && id !== 'O') {
            console.log("Player already on field:", name);
            return;
        }

        this.playersOnField.push({
            id: id,
            name: name,
            x: x,
            y: y,
            isOpponent: id === 'O'
        });
        this.render();
        this.renderPlayerPool();
    },

    renderPlayerPool() {
        const container = document.getElementById('player-pool');
        if (!container || !window.playersManager) return;

        const players = window.playersManager.players;
        const filtered = players.filter(p => p.category === this.currentFilter);

        // Filter out players already on the field
        const onFieldIds = this.playersOnField.map(p => p.id);
        const available = filtered.filter(p => !onFieldIds.includes(p.id));

        container.innerHTML = '';
        available.forEach(p => {
            const div = document.createElement('div');
            div.className = 'player-item';
            div.textContent = p.alias;
            div.draggable = true;
            div.dataset.playerId = p.id;

            div.addEventListener('dragstart', (e) => {
                // Clear fallback to avoid double placement
                this.lastPlacedPlayer = null;
                e.dataTransfer.setData('text/plain', JSON.stringify({ id: p.id, name: p.alias }));
            });

            div.addEventListener('click', () => {
                this.lastPlacedPlayer = { id: p.id, name: p.alias };
                document.querySelectorAll('.player-item').forEach(el => {
                    el.style.borderColor = 'rgba(255,255,255,0.05)';
                    el.style.boxShadow = 'none';
                });
                div.style.border = '2px solid var(--accent-color)';
                div.style.boxShadow = '0 0 10px var(--accent-color)';
            });

            container.appendChild(div);
        });

        this.updateSubstitutes(filtered, onFieldIds);
    },

    setFilter(cat, btn) {
        this.currentFilter = cat;
        if (btn) {
            document.querySelectorAll('#screen-tactic .filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        this.renderPlayerPool();
    },

    updateSubstitutes(allPlayersInCat, onFieldIds) {
        const subsList = document.getElementById('substitutes-list-auto');
        if (!subsList) return;

        const subs = allPlayersInCat.filter(p => !onFieldIds.includes(p.id));

        if (subs.length === 0) {
            subsList.innerHTML = '<p class="text-muted" style="font-size:0.8rem;">Todas las jugadoras están en cancha.</p>';
        } else {
            subsList.innerHTML = `
                <div style="font-weight:bold; font-size:0.8rem; margin-bottom:10px; color:var(--accent-color);">SUPLENTES (${subs.length})</div>
                <div style="display:flex; flex-wrap:wrap; gap:5px;">
                    ${subs.map(s => `<span class="badge" style="background:rgba(255,255,255,0.1); font-size:0.7rem;">${s.alias}</span>`).join('')}
                </div>
            `;
        }
        document.getElementById('substitutes-text').value = subs.map(s => s.alias).join(', ');
    },

    handleDown(e) {
        const { x, y } = this.getCoords(e);
        const w = this.canvas.width;
        const hitRadius = Math.max(25, w * 0.06);

        if (this.currentTool === 'move') {
            if (this.lastPlacedPlayer) {
                this.addPlayerToField(this.lastPlacedPlayer.id, this.lastPlacedPlayer.name, x, y);
                this.lastPlacedPlayer = null;
                document.querySelectorAll('.player-item').forEach(el => {
                    el.style.borderColor = 'rgba(255,255,255,0.05)';
                    el.style.boxShadow = 'none';
                });
                return;
            }

            const index = this.playersOnField.findIndex(p => {
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                return dist < hitRadius;
            });
            if (index !== -1) {
                this.selectedPlayer = this.playersOnField[index];
                this.render(); // Redraw to maybe show a selection indicator
            } else {
                this.selectedPlayer = null;
                this.render();
            }
        }
        else if (this.currentTool === 'delete') {
            const index = this.playersOnField.findIndex(p => {
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                return dist < hitRadius;
            });
            if (index !== -1) {
                this.removePlayer(this.playersOnField[index]);
            }
        }
        else if (['line', 'arrow'].includes(this.currentTool)) {
            this.isDrawing = true;
            this.startX = x;
            this.startY = y;
        }
        else if (this.currentTool === 'opponent') {
            this.playersOnField.push({ id: 'O_' + Date.now(), name: 'O', x, y, isOpponent: true });
            this.render();
        }
    },

    removePlayer(player) {
        this.playersOnField = this.playersOnField.filter(p => p !== player);
        if (this.selectedPlayer === player) this.selectedPlayer = null;
        this.render();
        this.renderPlayerPool();
    },

    // New specific delete function for the main button
    deleteSelection() {
        if (this.selectedPlayer) {
            this.removePlayer(this.selectedPlayer);
        } else {
            // If no player selected, maybe remove the last one added? 
            // Or just alert to select first. Let's remove last player if exists.
            if (this.playersOnField.length > 0) {
                this.removePlayer(this.playersOnField[this.playersOnField.length - 1]);
            }
        }
    },

    handleMove(e) {
        if (!this.selectedPlayer && !this.isDrawing) return;
        const { x, y } = this.getCoords(e);

        if (this.selectedPlayer) {
            this.selectedPlayer.x = x;
            this.selectedPlayer.y = y;
            this.render();
        }

        if (this.isDrawing) {
            this.render();
            this.drawTempShape(x, y);
        }
    },

    handleUp(e) {
        if (this.isDrawing) {
            const { x, y } = this.getCoords(e || { clientX: this.startX, clientY: this.startY });
            this.drawings.push({
                type: this.currentTool,
                x1: this.startX,
                y1: this.startY,
                x2: x,
                y2: y
            });
            this.isDrawing = false;
        }

        if (this.selectedPlayer) {
            const padding = -50;
            if (this.selectedPlayer.x < padding || this.selectedPlayer.x > this.canvas.width - padding ||
                this.selectedPlayer.y < padding || this.selectedPlayer.y > this.canvas.height - padding) {
                this.removePlayer(this.selectedPlayer);
            }
        }
        this.render();
    },

    drawTempShape(endX, endY) {
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 5]);
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        if (this.currentTool === 'arrow') {
            this.drawArrowhead(this.startX, this.startY, endX, endY);
        }
        this.ctx.setLineDash([]);
    },

    drawArrowhead(x1, y1, x2, y2) {
        const headlen = 12;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.ctx.fill();
    },

    render() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.drawField();

        // Draw saved drawings
        this.drawings.forEach(d => {
            this.ctx.beginPath();
            this.ctx.moveTo(d.x1, d.y1);
            this.ctx.lineTo(d.x2, d.y2);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            if (d.type === 'arrow') {
                this.ctx.fillStyle = 'white';
                const headlen = 15;
                const angle = Math.atan2(d.y2 - d.y1, d.x2 - d.x1);
                this.ctx.beginPath();
                this.ctx.moveTo(d.x2, d.y2);
                this.ctx.lineTo(d.x2 - headlen * Math.cos(angle - Math.PI / 6), d.y2 - headlen * Math.sin(angle - Math.PI / 6));
                this.ctx.lineTo(d.x2 - headlen * Math.cos(angle + Math.PI / 6), d.y2 - headlen * Math.sin(angle + Math.PI / 6));
                this.ctx.closePath();
                this.ctx.fill();
            }
        });

        // Draw players
        const playerRadius = Math.max(12, w * 0.04);
        const fontSize = Math.max(10, w * 0.03);

        this.playersOnField.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, playerRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.isOpponent ? '#2c3e50' : '#800020';
            this.ctx.fill();
            this.ctx.strokeStyle = (this.selectedPlayer === p) ? 'yellow' : 'white';
            this.ctx.lineWidth = (this.selectedPlayer === p) ? 4 : 2;
            this.ctx.stroke();

            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${fontSize}px Outfit`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(p.name || '?', p.x, p.y + (fontSize / 3));
        });
    },

    drawField() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const margin = 20;
        this.ctx.fillStyle = '#081a08';
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(margin, margin, w - (margin * 2), h - (margin * 2));
        this.ctx.beginPath();
        this.ctx.moveTo(margin, h / 2);
        this.ctx.lineTo(w - margin, h / 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(w / 2, h / 2, w * 0.15, 0, Math.PI * 2);
        this.ctx.stroke();
        const areaW = w * 0.4;
        const areaH = h * 0.12;
        this.ctx.strokeRect(w / 2 - areaW / 2, margin, areaW, areaH);
        this.ctx.strokeRect(w / 2 - areaW / 2, h - margin - areaH, areaW, areaH);
    },

    clear() {
        if (confirm("¿Limpiar toda la pizarra?")) {
            this.playersOnField = [];
            this.drawings = [];
            this.selectedPlayer = null;
            this.render();
            this.renderPlayerPool();
        }
    },

    async save() {
        const rival = document.getElementById('rival-name').value;
        const date = document.getElementById('match-date').value;
        const subs = document.getElementById('substitutes-text').value;

        if (!rival || !date || !window.db) {
            alert("Completa Rival y Fecha por favor.");
            return;
        }

        const formationData = {
            players: this.playersOnField,
            drawings: this.drawings
        };

        try {
            await window.db.collection('formations').add({
                name: rival,
                formation_date: date,
                positions_data: formationData,
                substitutes_list: subs,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("¡Estrategia guardada!");
            await this.loadFormationsList();
        } catch (error) {
            console.error(error);
            alert("Error al guardar táctica.");
        }
    },

    async loadFormationsList() {
        if (!window.db) return;
        try {
            const snapshot = await window.db.collection('formations').orderBy('formation_date', 'desc').get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderHistory(data);
        } catch (error) {
            console.error(error);
        }
    },

    renderHistory(formations) {
        const list = document.getElementById('formation-history');
        if (!list) return;
        list.innerHTML = formations.map(f => `
            <div class="history-item">
                <div class="hist-info" onclick="tacticBoard.loadSpecific('${f.id}')">
                    <strong>${f.name}</strong>
                    <span>${f.formation_date}</span>
                </div>
                <button onclick="tacticBoard.deleteFormation('${f.id}')" class="btn-delete-small"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    },

    async loadSpecific(id) {
        if (!window.db) return;
        try {
            const doc = await window.db.collection('formations').doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('rival-name').value = data.name;
                document.getElementById('match-date').value = data.formation_date;
                this.playersOnField = data.positions_data.players || [];
                this.drawings = data.positions_data.drawings || [];
                this.render();
                this.renderPlayerPool();
            }
        } catch (error) {
            console.error(error);
        }
    },

    async deleteFormation(id) {
        if (confirm("¿Borrar táctica?") && window.db) {
            try {
                await window.db.collection('formations').doc(id).delete();
                await this.loadFormationsList();
            } catch (error) {
                console.error(error);
            }
        }
    },

    exportImage() {
        const link = document.createElement('a');
        link.download = `táctica-${document.getElementById('rival-name').value}.png`;
        link.href = this.canvas.toDataURL("image/png");
        link.click();
    }
};

window.tacticBoard = tacticBoard;
window.addEventListener('DOMContentLoaded', () => tacticBoard.init());
