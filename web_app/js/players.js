const playersManager = {
    players: [],
    currentFilter: 'Todas',
    cropper: null,

    async init() {
        await this.loadPlayers();
        this.addEventListeners();
    },

    addEventListeners() {
        const playerForm = document.getElementById('add-player-form');
        if (playerForm) {
            playerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.savePlayer();
            });
        }
    },

    async loadPlayers() {
        if (!window.db) return;
        try {
            const snapshot = await window.db.collection('players').orderBy('alias', 'asc').get();
            this.players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderPlayersList();

            if (window.app && window.app.loadPlayers) window.app.loadPlayers();
            if (window.attendanceManager) window.attendanceManager.renderAttendanceList();
            if (window.statsManager) window.statsManager.renderStats();
            if (window.tacticBoard) window.tacticBoard.renderPlayerPool();
        } catch (error) {
            console.error("Error cargando jugadoras:", error);
        }
    },

    setFilter(cat, btn) {
        this.currentFilter = cat;
        document.querySelectorAll('.players-filters .filter-chip').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.renderPlayersList();
    },

    handlePhotoSelection(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('cropper-image');
                img.src = e.target.result;

                document.getElementById('p-photo-container').style.display = 'none';
                document.getElementById('cropper-wrapper').style.display = 'block';

                if (this.cropper) this.cropper.destroy();

                this.cropper = new Cropper(img, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 1,
                    responsive: true
                });
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    applyCrop() {
        if (!this.cropper) return;
        const canvas = this.cropper.getCroppedCanvas({ width: 200, height: 200 });
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        document.getElementById('p-photo-preview').src = croppedDataUrl;
        document.getElementById('p-photo-url').value = croppedDataUrl;
        this.cancelCrop();
    },

    cancelCrop() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        document.getElementById('cropper-wrapper').style.display = 'none';
        document.getElementById('p-photo-container').style.display = 'flex';
    },

    async savePlayer() {
        const editId = document.getElementById('p-edit-id').value;
        const alias = document.getElementById('p-alias').value;
        const name = document.getElementById('p-name').value;
        const dni = document.getElementById('p-dni').value;
        const birthdate = document.getElementById('p-birthdate').value;
        const cat = document.getElementById('p-cat').value;
        const pos1 = document.getElementById('p-pos1').value;
        const pos2 = document.getElementById('p-pos2').value;
        const weight = document.getElementById('p-weight').value;
        const height = document.getElementById('p-height').value;
        const apto = document.getElementById('p-apto').value;
        const insurance = document.getElementById('p-insurance').value;
        const photo = document.getElementById('p-photo-url').value;
        const phone = document.getElementById('p-phone') ? document.getElementById('p-phone').value : null;
        const emergency = document.getElementById('p-emergency') ? document.getElementById('p-emergency').value : null;

        if (!alias || !window.db) return;

        const playerData = {
            alias: alias,
            full_name: name || '',
            dni: dni || null,
            birthdate: birthdate || null,
            category: cat,
            position: pos1,
            second_position: pos2 || '-',
            weight: weight ? parseFloat(weight) : null,
            height: height ? parseFloat(height) : null,
            physical_status: apto || 'Apto',
            insurance: insurance || null,
            phone: phone,
            emergency_contact: emergency,
            photo_url: photo || null
        };

        try {
            if (editId) {
                await window.db.collection('players').doc(editId).update(playerData);
            } else {
                await window.db.collection('players').add(playerData);
            }
            await this.loadPlayers();
            this.resetForm();
            this.showAddModal(false);
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar jugadora.");
        }
    },

    resetForm() {
        document.getElementById('add-player-form').reset();
        document.getElementById('p-edit-id').value = '';
        document.getElementById('p-photo-preview').src = 'images/camiseta.png';
        document.getElementById('p-photo-url').value = '';
        document.getElementById('player-modal-title').textContent = 'Nueva Jugadora';
        document.getElementById('player-submit-btn').textContent = 'Guardar Jugadora';
    },

    async editPlayer(id, e) {
        if (e) e.stopPropagation();
        const p = this.players.find(player => player.id === id);
        if (!p) return;

        this.showDetailModal(false); // Close detail if open

        document.getElementById('p-edit-id').value = p.id;
        document.getElementById('p-alias').value = p.alias;
        document.getElementById('p-name').value = p.full_name || '';
        document.getElementById('p-dni').value = p.dni || '';
        document.getElementById('p-birthdate').value = p.birthdate || '';
        document.getElementById('p-cat').value = p.category;
        document.getElementById('p-pos1').value = p.position || 'Arquera';
        document.getElementById('p-pos2').value = p.second_position || '-';
        document.getElementById('p-weight').value = p.weight || '';
        document.getElementById('p-height').value = p.height || '';
        document.getElementById('p-apto').value = p.physical_status || 'Apto';
        document.getElementById('p-insurance').value = p.insurance || '';
        document.getElementById('p-phone').value = p.phone || '';
        document.getElementById('p-emergency').value = p.emergency_contact || '';
        document.getElementById('p-photo-preview').src = p.photo_url || 'images/camiseta.png';
        document.getElementById('p-photo-url').value = p.photo_url || '';

        document.getElementById('player-modal-title').textContent = 'Editar Jugadora';
        document.getElementById('player-submit-btn').textContent = 'Actualizar Datos';

        this.showAddModal(true);
    },

    async deletePlayer(id, e) {
        if (e) e.stopPropagation();
        if (confirm("¿Estás seguro de eliminar a esta jugadora?") && window.db) {
            try {
                await window.db.collection('players').doc(id).delete();
                await this.loadPlayers();
                this.showDetailModal(false);
            } catch (error) {
                console.error("Error al eliminar:", error);
            }
        }
    },

    renderPlayersList() {
        const grid = document.getElementById('players-grid');
        if (!grid) return;

        grid.innerHTML = '';
        let filtered = this.players;
        if (this.currentFilter !== 'Todas') {
            filtered = this.players.filter(p => p.category === this.currentFilter);
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">No hay jugadoras en esta categoría.</p>';
            return;
        }

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'player-card';
            card.onclick = () => this.showPlayerDetail(p.id);
            card.innerHTML = `
                <div class="card-avatar">
                    <img src="${p.photo_url || 'images/camiseta.png'}" alt="Foto" onerror="this.src='images/camiseta.png'">
                </div>
                <div class="card-info">
                    <h4>${p.alias}</h4>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    calculateAge(birthdate) {
        if (!birthdate) return '-';
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },

    async showPlayerDetail(id) {
        const player = this.players.find(p => p.id === id);
        if (!player) return;

        let attendancePct = 0;
        let presenceCount = 0;

        try {
            const snapshot = await window.db.collection('attendance').where('player_id', '==', id).get();
            const attData = snapshot.docs.map(doc => doc.data());
            const totalSessions = attData.length;
            presenceCount = attData.filter(a => a.present).length;
            attendancePct = totalSessions > 0 ? Math.round((presenceCount / totalSessions) * 100) : 0;
        } catch (error) {
            console.error("Error obteniendo asistencia:", error);
        }

        const content = document.getElementById('player-detail-content');
        content.innerHTML = `
            <div style="padding: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                    <h2 style="color:white; margin:0;">Ficha Técnica</h2>
                    <button class="btn-icon" onclick="playersManager.showDetailModal(false)" style="color:white; font-size:1.5rem;"><i class="fas fa-times"></i></button>
                </div>

                <div style="text-align:center; margin-bottom: 20px;">
                    <img src="${player.photo_url || 'images/camiseta.png'}" style="width:120px; height:120px; border-radius:50%; border:4px solid var(--primary-color); object-fit:cover;">
                    <h2 style="color:white; margin-top:10px;">${player.alias}</h2>
                    <p style="color:var(--text-muted);">${player.full_name || '-'}</p>
                </div>

                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    <button onclick="playersManager.editPlayer('${player.id}')" class="btn btn-primary" style="flex:1;"><i class="fas fa-edit"></i> Editar</button>
                    <button onclick="playersManager.deletePlayer('${player.id}')" class="btn-icon delete" style="background:rgba(255,0,0,0.1); padding:10px; border-radius:8px;"><i class="fas fa-trash"></i></button>
                </div>
                
                <div class="detail-stats" style="grid-template-columns: repeat(2, 1fr);">
                    <div class="mini-stat"><span>${player.category}</span><small>Cat.</small></div>
                    <div class="mini-stat"><span>${player.position || '-'}</span><small>Pos. 1</small></div>
                    <div class="mini-stat"><span>${player.second_position || '-'}</span><small>Pos. 2</small></div>
                    <div class="mini-stat"><span style="color:${player.physical_status === 'Apto' ? '#2ecc71' : '#e74c3c'}">${player.physical_status || 'Apto'}</span><small>Estado</small></div>
                    <div class="mini-stat"><span>${player.weight || '-'} kg</span><small>Peso</small></div>
                    <div class="mini-stat"><span>${player.height || '-'} cm</span><small>Alt.</small></div>
                    <div class="mini-stat"><span>${attendancePct}%</span><small>Asist.</small></div>
                    <div class="mini-stat"><span>${presenceCount}</span><small>Pres.</small></div>
                </div>

                <div class="personal-data" style="margin-top:20px; background: rgba(255,255,255,0.03); padding:15px; border-radius:12px;">
                    <p><strong>DNI:</strong> ${player.dni || '-'}</p>
                    <p><strong>Fecha Nac.:</strong> ${player.birthdate || '-'} (${this.calculateAge(player.birthdate)} años)</p>
                    <p><strong>Obra Social:</strong> ${player.insurance || '-'}</p>
                    <p><strong>Teléfono:</strong> ${player.phone || '-'}</p>
                    <p><strong>Emergencias:</strong> ${player.emergency_contact || '-'}</p>
                </div>

                <button class="btn btn-secondary btn-block" style="margin-top:20px;" onclick="playersManager.showDetailModal(false)">
                    <i class="fas fa-arrow-right"></i> Cerrar Panel
                </button>
            </div>
        `;

        this.showDetailModal(true);
    },

    showAddModal(show) {
        console.log("showAddModal llamada con:", show);
        const modal = document.getElementById('modal-player');
        if (!modal) {
            console.error("Error: No se encontró el elemento con ID 'modal-player'");
            alert("Error interno: El modal no existe en el HTML.");
            return;
        }
        if (show) {
            console.log("Activando modal...");
            modal.classList.add('active');
            // Forzar display por si falla el CSS
            modal.style.display = 'block';
            modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            console.log("Cerrando modal...");
            modal.classList.remove('active');
            modal.style.display = 'none';
            this.resetForm();
            this.cancelCrop();
        }
    },

    showDetailModal(show) {
        const modal = document.getElementById('modal-player-detail');
        if (modal) {
            if (show) {
                modal.classList.add('active');
                modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                modal.classList.remove('active');
            }
        }
    },

    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(22);
        doc.setTextColor(128, 0, 32);
        doc.text('Los Palometas FC - Plantilla Completa', 14, 20);

        const categories = ['1ra', 'Res', 'Sub17'];
        let startY = 30;

        categories.forEach(cat => {
            const catPlayers = this.players.filter(p => p.category === cat);
            if (catPlayers.length === 0) return;

            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.text(`Categoría: ${cat}`, 14, startY);

            const tableData = catPlayers.map(p => [
                p.alias,
                p.full_name || '-',
                p.dni || '-',
                p.birthdate || '-',
                p.position || '-',
                p.second_position || '-',
                p.physical_status || 'Apto',
                p.phone || '-',
                p.emergency_contact || '-'
            ]);

            doc.autoTable({
                startY: startY + 5,
                head: [['Alias', 'Nombre', 'DNI', 'F. Nac', 'Pos 1', 'Pos 2', 'Estado', 'Teléfono', 'Emergencia']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [128, 0, 32] },
                margin: { left: 14, right: 14 }
            });

            startY = doc.lastAutoTable.finalY + 15;

            if (startY > 180 && categories.indexOf(cat) < categories.length - 1) {
                doc.addPage();
                startY = 20;
            }
        });

        doc.save('Plantilla_Los_Palometas.pdf');
    }
};

window.playersManager = playersManager;
window.addEventListener('DOMContentLoaded', () => playersManager.init());
