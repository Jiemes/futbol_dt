const gifMaker = {
    canvas: null,
    ctx: null,
    elements: [],
    frames: [],
    currentTool: 'move',
    isDrawing: false,
    startX: 0,
    startY: 0,
    selectedElement: null,

    init() {
        this.canvas = document.getElementById('gif-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        setTimeout(() => {
            this.resizeCanvas();
            this.render();
        }, 100);

        this.addEventListeners();
    },

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;
        const w = container.clientWidth;
        this.canvas.width = w > 0 ? w : 600;
        this.canvas.height = 500;
        this.render();
    },

    addEventListeners() {
        this.canvas.replaceWith(this.canvas.cloneNode(true));
        this.canvas = document.getElementById('gif-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', () => this.handleEnd());

        document.querySelectorAll('#screen-gif-maker .tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#screen-gif-maker .tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });

        window.addEventListener('resize', () => this.resizeCanvas());
    },

    handleStart(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        if (this.currentTool === 'move') {
            this.selectedElement = this.elements.slice().reverse().find(el => {
                const size = (['goal', 'ladder'].includes(el.type)) ? 60 : 30;
                const dist = Math.sqrt((el.x - x) ** 2 + (el.y - y) ** 2);
                return dist < size;
            });
        } else if (this.currentTool === 'line' || this.currentTool === 'arrow') {
            this.isDrawing = true;
            this.startX = x;
            this.startY = y;
            this.elements.push({ type: this.currentTool, points: [{ x, y }] });
        } else {
            this.elements.push({ type: this.currentTool, x, y });
            this.render();
        }
    },

    handleMove(clientX, clientY) {
        if (!this.selectedElement && !this.isDrawing) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        if (this.selectedElement) {
            this.selectedElement.x = x;
            this.selectedElement.y = y;
        } else if (this.isDrawing) {
            const currentObj = this.elements[this.elements.length - 1];
            if (this.currentTool === 'line') currentObj.points.push({ x, y });
            else currentObj.points[1] = { x, y };
        }
        this.render();
    },

    handleEnd() {
        this.selectedElement = null;
        this.isDrawing = false;
        this.render();
    },

    render() {
        if (!this.ctx) return;
        this.drawField();

        this.elements.forEach(el => {
            if (el.type === 'line') this.drawCurve(el.points, 'white', 3);
            else if (el.type === 'arrow' && el.points.length > 1) this.drawArrow(el.points[0], el.points[1], 'white');
            else if (el.type === 'player_y') this.drawEntity(el.x, el.y, '#ffd700', 'Jug');
            else if (el.type === 'player_m') this.drawEntity(el.x, el.y, '#800020', 'Jug');
            else if (el.type === 'ball') this.drawBall(el.x, el.y);
            else if (el.type === 'cone') this.drawCone(el.x, el.y);
            else if (el.type === 'ring') this.drawRing(el.x, el.y);
            else if (el.type === 'stick') this.drawStick(el.x, el.y);
            else if (el.type === 'ladder') this.drawLadder(el.x, el.y);
            else if (el.type === 'goal') this.drawGoal(el.x, el.y);
            else if (el.type === 'dummy') this.drawDummy(el.x, el.y);
        });
    },

    drawCurve(points, color, width) {
        if (points.length < 2) return;
        this.ctx.beginPath();
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) this.ctx.lineTo(points[i].x, points[i].y);
        this.ctx.stroke();
    },

    drawArrow(p1, p2, color) {
        const headlen = 15;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(p2.x, p2.y);
        this.ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    },

    drawEntity(x, y, color, label) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, x, y + 5);
    },

    drawBall(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = 'black';
        this.ctx.stroke();
    },

    drawCone(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 15);
        this.ctx.lineTo(x - 12, y + 10);
        this.ctx.lineTo(x + 12, y + 10);
        this.ctx.closePath();
        this.ctx.fillStyle = 'orange';
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.stroke();
    },

    drawRing(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ff9800';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
    },

    drawStick(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(x - 30, y);
        this.ctx.lineTo(x + 30, y);
        this.ctx.strokeStyle = '#f1f1f1';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    },

    drawLadder(x, y) {
        const w = 40, h = 120;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        for (let i = 1; i < 5; i++) {
            let ry = y - h / 2 + (h / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x - w / 2, ry); this.ctx.lineTo(x + w / 2, ry); this.ctx.stroke();
        }
    },

    drawGoal(x, y) {
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x - 60, y - 20, 120, 40);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        this.ctx.fillRect(x - 60, y - 20, 120, 40);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = -60; i <= 60; i += 20) { this.ctx.moveTo(x + i, y - 20); this.ctx.lineTo(x + i, y + 20); }
        for (let j = -20; j <= 20; j += 10) { this.ctx.moveTo(x - 60, y + j); this.ctx.lineTo(x + 60, y + j); }
        this.ctx.stroke();
    },

    drawDummy(x, y) {
        this.ctx.fillStyle = '#999';
        this.ctx.fillRect(x - 10, y - 30, 20, 60);
        this.ctx.beginPath(); this.ctx.arc(x, y - 35, 12, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.strokeStyle = 'white'; this.ctx.stroke();
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
    },

    undo() { this.elements.pop(); this.render(); },
    clear() { this.elements = []; this.render(); },

    captureFrame() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
        this.frames.push(tempCanvas.toDataURL('image/png'));
        document.getElementById('frame-counter').innerText = `Frames: ${this.frames.length}`;
        document.getElementById('frame-counter').style.color = 'var(--primary-color)';
        setTimeout(() => document.getElementById('frame-counter').style.color = 'var(--accent-color)', 300);
    },

    resetGif() {
        this.frames = [];
        document.getElementById('frame-counter').innerText = `Frames: 0`;
        document.getElementById('gif-preview-container').innerHTML = '';
    },

    async generateGif() {
        if (this.frames.length < 2) { alert("Captura al menos 2 frames."); return; }
        const name = document.getElementById('gif-name').value;
        if (!name) { alert("Por favor, ponle un nombre al ejercicio antes de generar."); return; }

        const previewContainer = document.getElementById('gif-preview-container');
        previewContainer.innerHTML = '<p class="loading-text">Procesando Animación...</p>';

        gifshot.createGIF({
            images: this.frames,
            interval: 0.5,
            gifWidth: this.canvas.width,
            gifHeight: this.canvas.height
        }, async (obj) => {
            if (!obj.error) {
                const gifData = obj.image;
                previewContainer.innerHTML = `
                    <h4 style="color:var(--accent-color);">¡Animación Lista!</h4>
                    <img src="${gifData}" style="width:100%; border-radius:12px; margin-bottom:10px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <a href="${gifData}" download="${name.replace(/\s+/g, '_')}.gif" class="btn btn-secondary btn-block" style="text-decoration:none; text-align:center;">
                            <i class="fas fa-download"></i> Descargar GIF
                        </a>
                        <button id="save-gif-btn" class="btn btn-primary btn-block" onclick="gifMaker.saveGifMetadata('${gifData}')">
                            <i class="fas fa-save"></i> Guardar en Base de Datos
                        </button>
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-top:10px; text-align:center;">
                        Descarga el GIF y súbelo a tu carpeta de GitHub para verlo siempre.
                    </p>
                `;
            } else {
                previewContainer.innerHTML = '<p style="color:red;">Error al generar.</p>';
            }
        });
    },

    async saveGifMetadata(dataUrl) {
        const name = document.getElementById('gif-name').value;
        const btn = document.getElementById('save-gif-btn');
        if (!window.db) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        try {
            // Guardamos la referencia. El usuario debe subir el archivo a su GitHub con este nombre
            const fileName = `${name.replace(/\s+/g, '_')}.gif`;
            const githubPath = `images/tactical/${fileName}`;

            await window.db.collection('tactical_gifs').add({
                name: name,
                gif_url: githubPath,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("¡Referencia guardada! Recuerda descargar el GIF y subirlo a la carpeta 'images/tactical/' de tu GitHub.");
            this.resetGif();
            document.getElementById('gif-name').value = '';

        } catch (err) {
            console.error(err);
            alert("Error al guardar metadata: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar en Base de Datos';
        }
    }
};

window.gifMaker = gifMaker;
window.addEventListener('DOMContentLoaded', () => { if (document.getElementById('gif-canvas')) gifMaker.init(); });
