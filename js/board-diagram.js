/* La misma cancha se dibuja en el editor, la imagen y la vista de impresión. */
window.BoardDiagram = (() => {
    const width = 900, height = 650;
    const format = 'palometas-board-v1';
    const fields = { full: 'Cancha entera', half: 'Media cancha', free: 'Espacio libre' };
    const teams = {
        bordo: { name: 'Bordó', fill: '#a42a51', text: '#fff' },
        azul: { name: 'Azul', fill: '#1765ad', text: '#fff' },
        amarillo: { name: 'Amarilla', fill: '#ffd35a', text: '#253125' },
        blanco: { name: 'Blanca', fill: '#f5f1e5', text: '#22312b' }
    };
    const materials = {
        cone: { name: 'Cono', icon: 'mountain' },
        ball: { name: 'Pelota', icon: 'futbol' },
        goal: { name: 'Arco', icon: 'border-all', rotate: true },
        miniGoal: { name: 'Arquito', icon: 'square', rotate: true },
        pole: { name: 'Palo', icon: 'grip-lines-vertical', rotate: true },
        ring: { name: 'Aro', icon: 'circle' },
        ladder: { name: 'Escalera', icon: 'grip-lines', rotate: true },
        dummy: { name: 'Maniquí', icon: 'person' },
        run: { name: 'Desplazamiento', icon: 'arrow-up' },
        pass: { name: 'Pase', icon: 'arrow-right-long' }
    };
    const limits = { frames: 12, items: 100 };
    const e = Palometas.escapeHTML;
    const id = () => crypto.randomUUID();
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
    const number = (value, fallback) => Number.isFinite(value) ? value : fallback;
    const label = (value, limit = 80) => String(value ?? '').trim().slice(0, limit);
    const isLine = kind => kind === 'run' || kind === 'pass';
    const point = (x, y) => ({ x: Math.round(clamp(x, 28, width - 28)), y: Math.round(clamp(y, 28, height - 48)) });

    function normalize(data) {
        const field = Object.hasOwn(fields, data?.field) ? data.field : 'full';
        const frames = Array.isArray(data?.frames) ? data.frames.slice(0, limits.frames) : [];
        return { field, frames: (frames.length ? frames : [{ items: [] }]).map(frame => {
            const used = new Set();
            const items = Array.isArray(frame?.items) ? frame.items : [];
            return { items: items.slice(0, limits.items).flatMap(item => {
                if (!item || (item.kind !== 'player' && !Object.hasOwn(materials, item.kind))) return [];
                const token = typeof item.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(item.id) && !used.has(item.id) ? item.id : id();
                used.add(token);
                const clean = { id: token, kind: item.kind, ...point(number(item.x, width / 2), number(item.y, height / 2)) };
                if (item.kind === 'player') {
                    clean.color = Object.hasOwn(teams, item.color) ? item.color : 'bordo';
                    clean.label = label(item.label);
                    if (typeof item.playerId === 'string') clean.playerId = item.playerId.slice(0, 200);
                    if (item.slot) clean.slot = true;
                } else if (isLine(item.kind)) {
                    const end = point(number(item.x2, clean.x + 40), number(item.y2, clean.y));
                    clean.x2 = end.x;
                    clean.y2 = end.y;
                } else if (materials[item.kind].rotate) clean.angle = number(item.angle, 0) % 360;
                return [clean];
            }) };
        }) };
    }

    function pitch(field) {
        const line = '#d3eee0';
        const stripes = Array.from({ length: 8 }, (_, i) => '<rect x="24" y="' + (24 + i * 75) + '" width="852" height="75" fill="' + (i % 2 ? '#205844' : '#245f49') + '"/>').join('');
        let marks = '<rect x="24" y="24" width="852" height="600" rx="4"/>';
        if (field !== 'free') {
            marks += '<path d="M267 24v125h366V24 M373 24v45h154V24 M405 24V8h90v16"/><circle cx="450" cy="111" r="3" fill="' + line + '"/>';
            marks += field === 'half'
                ? '<path d="M388 624a62 62 0 0 1 124 0"/>'
                : '<path d="M24 324h852 M267 624V499h366v125 M373 624v-45h154v45 M405 624v16h90v-16"/><circle cx="450" cy="324" r="60"/><circle cx="450" cy="324" r="3" fill="' + line + '"/><circle cx="450" cy="537" r="3" fill="' + line + '"/>';
        }
        return '<rect width="900" height="650" fill="#133c31"/>' + stripes + '<g stroke="' + line + '" stroke-width="2" fill="none" opacity=".8">' + marks + '</g>';
    }

    function name(item, names) {
        return names.get(item.playerId) || item.label || (item.kind === 'player' ? 'Jugadora' : materials[item.kind].name);
    }

    function player(item, names) {
        const team = teams[item.color] || teams.bordo;
        const full = name(item, names);
        const shown = full.length > 23 ? full.slice(0, 22) + '…' : full;
        const initials = item.slot ? '' : shown.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
        const box = Math.min(174, Math.max(42, shown.length * 8 + 16));
        const font = shown.length > 17 ? 13 : 16;
        const left = clamp(item.x - box / 2, 5, width - box - 5) - item.x;
        return `<circle cy="3" r="18" fill="#0c2a22"/><circle r="17" fill="${team.fill}" stroke="#fff7ed" stroke-width="2" ${item.slot ? 'stroke-dasharray="4 3"' : ''}/><text y="5" text-anchor="middle" font-size="12" font-weight="700" fill="${team.text}">${e(initials || '+')}</text><rect x="${left}" y="22" width="${box}" height="23" rx="5" fill="#102e25"/><text x="${left + box / 2}" y="38" text-anchor="middle" font-size="${font}" font-weight="700" fill="#fff7ed">${e(shown)}</text>`;
    }

    const symbols = {
        ball: '<circle r="10" fill="#fff6db" stroke="#17372e" stroke-width="2"/><path d="M0-4 4-1 2 4h-4l-2-5z M0-4v-4 M4-1l4-2 M2 4l3 3 M-2 4l-3 3 M-4-1l-4-2" fill="#263a31" stroke="#263a31" stroke-width="1.2"/>',
        cone: '<path d="M0-14 12 10H-12z" fill="#ffad48" stroke="#513820" stroke-width="2"/><path d="M-8 3H8M-12 11H12" stroke="#fff1cb" stroke-width="2"/>',
        goal: '<path d="M-36 10v-24h72v24z M-24-14v24 M-12-14v24 M0-14v24 M12-14v24 M24-14v24 M-36-6h72 M-36 2h72" fill="#214838" stroke="#c6dfce" stroke-width="1.5"/><path d="M-36 10v-24h72v24" fill="none" stroke="#fff8ec" stroke-width="4" stroke-linecap="round"/>',
        miniGoal: '<path d="M-21 7V-8h42V7z M-10-8V7 M0-8V7 M10-8V7 M-21 0h42" fill="#25493a" stroke="#c6dfce" stroke-width="1.4"/><path d="M-21 7V-8h42V7" fill="none" stroke="#ffe185" stroke-width="3" stroke-linecap="round"/>',
        pole: '<ellipse cy="13" rx="10" ry="4" fill="#0e3527"/><path d="M0-15v27" stroke="#ffdf66" stroke-width="6" stroke-linecap="round"/>',
        ring: '<circle r="15" fill="none" stroke="#ffc75d" stroke-width="4"/>',
        ladder: '<path d="M-15-28v56 M15-28v56 M-15-27h30 M-15-14h30 M-15 0h30 M-15 14h30 M-15 27h30" fill="none" stroke="#ffe6a0" stroke-width="3" stroke-linecap="round"/>',
        dummy: '<circle cy="-14" r="6" fill="#ecc953" stroke="#4a4025" stroke-width="2"/><path d="M-10-5h20v16h-20z M0 11v11 M-10 22h20" fill="#ecc953" stroke="#4a4025" stroke-width="3"/>'
    };

    function arrow(item) {
        const dx = item.x2 - item.x, dy = item.y2 - item.y, a = Math.atan2(dy, dx);
        const x = dx - 13 * Math.cos(a), y = dy - 13 * Math.sin(a);
        const sx = 6 * Math.sin(a), sy = -6 * Math.cos(a);
        const color = item.kind === 'pass' ? '#ffe580' : '#f4fff7';
        return `<path d="M0 0L${dx} ${dy}" stroke="transparent" stroke-width="22"/><path d="M0 0L${x} ${y}" fill="none" stroke="${color}" stroke-width="3" ${item.kind === 'pass' ? 'stroke-dasharray="8 6"' : ''}/><path d="M${dx} ${dy} L${x + sx} ${y + sy} L${x - sx} ${y - sy}Z" fill="${color}"/>`;
    }

    function items(list, names, selected = '', interactive = false) {
        const ordered = [...list.filter(item => isLine(item.kind)), ...list.filter(item => !isLine(item.kind))];
        return ordered.map(item => {
            let body;
            if (item.kind === 'player') body = player(item, names);
            else if (isLine(item.kind)) body = arrow(item);
            else body = `<g transform="rotate(${item.angle || 0})"><rect x="-22" y="-22" width="44" height="44" fill="transparent"/>${symbols[item.kind]}</g>`;
            const focus = item.id === selected ? '<circle r="23" fill="none" stroke="#ffe47b" stroke-width="3" pointer-events="none"/>' : '';
            return `<g transform="translate(${item.x} ${item.y})" ${interactive ? 'data-piece="' + e(item.id) + '"' : ''}><title>${e(name(item, names))}</title>${focus}${body}</g>`;
        }).join('');
    }

    function picture(field, list, names, title, subtitle = '', light = false) {
        const heading = title.length > 54 ? title.slice(0, 53) + '…' : title;
        const ink = light ? '#17332a' : '#f7f3e7';
        const bg = light ? '#fff' : '#102d27';
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + 94}" viewBox="0 0 ${width} ${height + 94}" font-family="Arial,sans-serif" role="img" aria-label="${e(title)}"><rect width="100%" height="100%" fill="${bg}"/><text x="24" y="24" fill="${ink}" font-size="13" letter-spacing="2">PALOMETAS · SUB 17</text><text x="24" y="54" fill="${ink}" font-size="26" font-weight="700">${e(heading)}</text><g transform="translate(0 68)">${pitch(field)}${items(list, names)}</g><text x="24" y="${height + 86}" fill="${ink}" font-size="13">${e(subtitle)}</text></svg>`;
    }

    async function raster(svg, size = 1800) {
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
        try {
            const image = new Image();
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = () => reject(new Error('No se pudo preparar la imagen de la cancha.'));
                image.src = url;
            });
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = Math.round(size * (height + 94) / width);
            const context = canvas.getContext('2d');
            if (!context) throw new Error('No se pudo crear la imagen.');
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            return canvas;
        } finally { URL.revokeObjectURL(url); }
    }

    function between(from, to, progress) {
        const target = new Map(to.map(item => [item.id, item]));
        const mix = (a, b) => a + (b - a) * progress;
        return from.map(item => {
            const next = target.get(item.id);
            if (!next || next.kind !== item.kind) return item;
            const moved = { ...item, x: mix(item.x, next.x), y: mix(item.y, next.y) };
            if (isLine(item.kind)) {
                moved.x2 = mix(item.x2, next.x2);
                moved.y2 = mix(item.y2, next.y2);
            }
            return moved;
        });
    }

    return { width, height, format, fields, teams, materials, limits, e, id, label, point, isLine, normalize, name, pitch, items, picture, raster, between };
})();
