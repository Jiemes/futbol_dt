const playerPhotos = {
    value: '',
    changed: false,
    cropper: null,
    objectURL: null,
    loadToken: 0,
    ready: false,
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;
        document.getElementById('p-photo-file').addEventListener('change', event => this.selectFile(event.target));
        document.getElementById('p-photo-remove').addEventListener('click', () => {
            this.value = ''; this.changed = true; this.showPreview();
            document.getElementById('p-photo-status').textContent = 'La foto se quitará al guardar la ficha.';
        });
        document.getElementById('photo-crop-apply').addEventListener('click', () => this.applyCrop());
        document.getElementById('photo-crop-reset').addEventListener('click', () => { if (this.ready) this.cropper.reset(); });
        document.querySelectorAll('[data-photo-zoom]').forEach(button => button.addEventListener('click', () => {
            if (this.ready) this.cropper.zoom(Number(button.dataset.photoZoom));
        }));
        document.querySelectorAll('[data-photo-rotate]').forEach(button => button.addEventListener('click', () => {
            if (this.ready) this.cropper.rotate(Number(button.dataset.photoRotate));
        }));
        document.getElementById('photo-crop-dialog').addEventListener('close', () => this.disposeCrop());
        document.getElementById('player-dialog').addEventListener('close', () => {
            const dialog = document.getElementById('photo-crop-dialog');
            if (dialog.open) dialog.close();
            else this.disposeCrop();
        });
    },

    reset(photo) {
        this.disposeCrop(); this.value = photo || ''; this.changed = false;
        document.getElementById('p-photo-file').value = '';
        document.getElementById('p-photo-error').textContent = '';
        document.getElementById('p-photo-status').textContent = this.value ? 'Foto actual de la jugadora.' : '';
        this.showPreview();
    },

    showPreview() {
        const image = document.getElementById('p-photo-preview');
        const empty = document.getElementById('p-photo-empty');
        const source = Palometas.imageURL(this.value);
        image.hidden = !source; empty.hidden = Boolean(source);
        image.onerror = () => { image.hidden = true; empty.hidden = false; empty.textContent = 'Foto no disponible'; };
        empty.textContent = 'Sin foto';
        if (source) image.src = source; else image.removeAttribute('src');
        document.getElementById('p-photo-remove').hidden = !this.value;
    },

    selectFile(input) {
        const file = input.files?.[0]; input.value = '';
        const error = document.getElementById('p-photo-error'); error.textContent = '';
        if (!file) return;
        if (!file.size || file.size > 25 * 1024 * 1024) {
            error.textContent = 'Elegí una foto de hasta 25 MB.'; return;
        }
        const supportedType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        if (!supportedType && (file.type || !/\.(jpe?g|png|webp)$/i.test(file.name))) {
            error.textContent = 'Usá una foto JPG, PNG o WebP.'; return;
        }
        if (typeof window.Cropper !== 'function') {
            error.textContent = 'No se pudo cargar el editor de fotos. Recargá la página y volvé a elegir la foto.'; return;
        }
        this.disposeCrop();
        const token = ++this.loadToken;
        const dialog = document.getElementById('photo-crop-dialog');
        const image = document.getElementById('photo-crop-image');
        document.getElementById('photo-crop-error').textContent = '';
        document.getElementById('photo-crop-status').textContent = 'Cargando foto…';
        this.objectURL = URL.createObjectURL(file);
        image.onload = () => {
            if (token !== this.loadToken || !dialog.open) return;
            image.onload = null;
            try {
                this.cropper = new window.Cropper(image, {
                    aspectRatio: 1, viewMode: 1, dragMode: 'move', autoCropArea: 0.25,
                    responsive: true, restore: true, checkOrientation: true,
                    cropBoxMovable: true, cropBoxResizable: true, zoomOnTouch: true, zoomOnWheel: true,
                    toggleDragModeOnDblclick: false, preview: '.photo-crop-preview',
                    minContainerWidth: 200, minContainerHeight: 240,
                    ready: () => {
                        if (token !== this.loadToken || !dialog.open) return;
                        this.ready = true; document.getElementById('photo-crop-controls').disabled = false;
                        document.getElementById('photo-crop-status').textContent = 'Ajustá el recuadro para que se vea solo la cara de la jugadora.';
                    }
                });
            } catch (cropError) {
                console.error(cropError); document.getElementById('photo-crop-error').textContent = 'No se pudo abrir el recorte. Cancelá y volvé a seleccionar la foto.';
            }
        };
        image.onerror = () => {
            if (token !== this.loadToken) return;
            document.getElementById('photo-crop-status').textContent = '';
            document.getElementById('photo-crop-error').textContent = 'No se pudo abrir esta imagen. Probá con una foto JPG, PNG o WebP.';
        };
        dialog.showModal(); image.src = this.objectURL;
    },

    applyCrop() {
        if (!this.cropper || !this.ready) return;
        const error = document.getElementById('photo-crop-error'); error.textContent = '';
        try {
            const canvas = this.cropper.getCroppedCanvas({ width: 320, height: 320, fillColor: '#ffffff', imageSmoothingEnabled: true, imageSmoothingQuality: 'high' });
            if (!canvas || !canvas.width || !canvas.height) throw new Error('No hay un recorte disponible.');
            const photo = canvas.toDataURL('image/jpeg', 0.82);
            if (!photo.startsWith('data:image/jpeg;base64,')) throw new Error('No se pudo generar la foto.');
            this.value = photo; this.changed = true; this.showPreview();
            document.getElementById('p-photo-status').textContent = 'Recorte listo. Guardá la ficha para conservarlo.';
            document.getElementById('photo-crop-dialog').close();
        } catch (cropError) { console.error(cropError); error.textContent = 'No se pudo preparar el recorte. Ajustá el recuadro y volvé a intentar.'; }
    },

    disposeCrop() {
        this.loadToken++; this.ready = false;
        if (this.cropper) { this.cropper.destroy(); this.cropper = null; }
        const image = document.getElementById('photo-crop-image');
        image.onload = null; image.onerror = null; image.removeAttribute('src');
        if (this.objectURL) { URL.revokeObjectURL(this.objectURL); this.objectURL = null; }
        document.getElementById('photo-crop-controls').disabled = true;
        document.querySelector('.photo-crop-preview').replaceChildren();
        document.getElementById('photo-crop-status').textContent = '';
    }
};
window.playerPhotos = playerPhotos;
