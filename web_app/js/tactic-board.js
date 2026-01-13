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
        this.canvas.replaceWith(this.canvas.cloneNode(true));
        this.canvas = document.getElementById('tactic-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            this.playersOnField.push({
                id: data.id,
                name: data.name,
                x: x,
                y: y,
                isOpponent: false
            });
            this.render();
            this.renderPlayerPool();
        });

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        document.querySelectorAll('#screen-tactic .tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#screen-tactic .tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });

        window.addEventListener('resize', () => this.resizeCanvas());
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
                e.dataTransfer.setData('text/plain', JSON.stringify({ id: p.id, name: p.alias }));
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

        // Keep hidden textarea updated for SAVING
        document.getElementById('substitutes-text').value = subs.map(s => s.alias).join(', ');
    },

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (this.currentTool === 'move') {
            const index = this.playersOnField.findIndex(p => {
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                return dist < 20;
            });
            if (index !== -1) {
                this.selectedPlayer = this.playersOnField[index];
                // Right click or long press could be delete, but for now let's just move
            }
        } else if (['line', 'arrow'].includes(this.currentTool)) {
            this.isDrawing = true;
            this.startX = x;
            this.startY = y;
        } else if (this.currentTool === 'opponent') {
            this.playersOnField.push({ name: 'O', x, y, isOpponent: true });
            this.render();
        }
    },

    handleMouseMove(e) {
        if (!this.selectedPlayer && !this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (this.selectedPlayer) {
            this.selectedPlayer.x = x;
            this.selectedPlayer.y = y;
            this.render();
        }

        if (this.isDrawing) {
            this.render(); // Redraw field + items
            this.drawTempShape(x, y);
        }
    },

    handleMouseUp(e) {
        if (this.isDrawing) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            this.drawings.push({
                type: this.currentTool,
                x1: this.startX,
                y1: this.startY,
                x2: x,
                y2: y
            });
            this.isDrawing = false;
        }

        // Remove player if dragged out of canvas? 
        if (this.selectedPlayer) {
            if (this.selectedPlayer.x < 0 || this.selectedPlayer.x > this.canvas.width ||
                this.selectedPlayer.y < 0 || this.selectedPlayer.y > this.canvas.height) {
                this.playersOnField = this.playersOnField.filter(p => p !== this.selectedPlayer);
                this.renderPlayerPool();
            }
        }

        this.selectedPlayer = null;
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
        this.playersOnField.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
            this.ctx.fillStyle = p.isOpponent ? '#2c3e50' : '#800020';
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 11px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(p.name || '?', p.x, p.y + 4);
        });
    },

    drawField() {
        this.ctx.fillStyle = '#081a08';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);

        this.ctx.beginPath();
        this.ctx.moveTo(10, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width - 10, this.canvas.height / 2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 40, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.strokeRect(this.canvas.width / 2 - 60, 10, 120, 50);
        this.ctx.strokeRect(this.canvas.width / 2 - 60, this.canvas.height - 60, 120, 50);
    },

    undoDraw() {
        this.drawings.pop();
        this.render();
    },

    clear() {
        this.playersOnField = [];
        this.drawings = [];
        this.render();
        this.renderPlayerPool();
    },

    async save() {
        const rival = document.getElementById('rival-name').value;
        const date = document.getElementById('match-date').value;
        const subs = document.getElementById('substitutes-text').value;

        if (!rival || !date || !window.supabaseClient) {
            alert("Completa Rival y Fecha por favor.");
            return;
        }

        const formationData = {
            players: this.playersOnField,
            drawings: this.drawings
        };

        const { error } = await window.supabaseClient.from('formations').insert([{
            name: rival,
            formation_date: date,
            positions_data: formationData,
            substitutes_list: subs
        }]);

        if (!error) {
            alert("¡Estrategia guardada!");
            await this.loadFormationsList();
        } else {
            console.error(error);
            alert("Error al guardar táctica.");
        }
    },

    async loadFormationsList() {
        if (!window.supabaseClient) return;
        const { data } = await window.supabaseClient.from('formations').select('*').order('formation_date', { ascending: false });
        if (data) this.renderHistory(data);
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
        const { data } = await window.supabaseClient.from('formations').select('*').eq('id', id).single();
        if (data) {
            document.getElementById('rival-name').value = data.name;
            document.getElementById('match-date').value = data.formation_date;
            this.playersOnField = data.positions_data.players || [];
            this.drawings = data.positions_data.drawings || [];
            this.render();
            this.renderPlayerPool();
        }
    },

    async deleteFormation(id) {
        if (confirm("¿Borrar táctica?")) {
            await window.supabaseClient.from('formations').delete().eq('id', id);
            await this.loadFormationsList();
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
