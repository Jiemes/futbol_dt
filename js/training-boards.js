/* Diagramas propios: el reparto siempre corresponde a las jugadoras elegidas. */
window.TrainingBoards = (() => {
    const colors = { red: '#ce3158', blue: '#318fd8', neutral: '#f2eee4', keeper: '#f4aa3b' };
    const safe = value => Palometas.escapeHTML(String(value));
    const groups = n => Array.from({ length: 3 }, (_, i) => Math.floor(n / 3) + (i < n % 3 ? 1 : 0));
    function distribution(type, n) {
        if (type === 'stations') return { groups: groups(n) };
        if (type === 'build-no-gk') { const neutral = n % 2 ? 1 : 2; return { red: (n - neutral) / 2, blue: (n - neutral) / 2, neutral, keeper: false }; }
        if (type === 'build-gk') return { red: Math.ceil(n / 2), blue: Math.floor(n / 2), neutral: 0, keeper: true };
        if (type === 'attack') return { red: Math.ceil((n - 2) / 2), blue: Math.floor((n - 2) / 2), neutral: 2, keeper: true };
        if (type === 'game') return { red: Math.floor(n / 2), blue: Math.floor(n / 2), neutral: n % 2, keeper: true };
        return { total: n + (type === 'cooldown' ? 1 : 0) };
    }
    function description(type, n) {
        const d = distribution(type, n);
        if (type === 'stations') return d.groups.map((count, i) => `${'ABC'[i]}: ${count}`).join(' · ') + ' jugadoras';
        if (type === 'warmup') return `${n} jugadoras de campo · arquera en trabajo específico`;
        if (type === 'cooldown') return `${n} de campo + arquera · cierre en conjunto`;
        let text = `${d.red} contra ${d.blue}`;
        if (d.neutral) text += ` + ${d.neutral} ${type === 'attack' ? 'apoyos de banda' : d.neutral === 1 ? 'comodín' : 'comodines'}`;
        if (d.keeper) text += ' + arquera';
        return text;
    }
    function person(x, y, team, label = '', name = '') {
        const short = name.length > 14 ? name.slice(0, 13) + '…' : name;
        return `<g transform="translate(${x} ${y})"><title>${safe(name || label)}</title><circle cy="3" r="17" fill="#092c27"/><circle r="17" fill="${colors[team]}" stroke="#fff8ee" stroke-width="2"/><text text-anchor="middle" y="6" fill="${team === 'neutral' ? '#17382f' : '#fff'}" font-family="Arial,sans-serif" font-weight="700" font-size="${String(label).length > 2 ? 12 : 15}">${safe(label)}</text>${name ? `<rect x="-53" y="${team === 'blue' ? -42 : 20}" width="106" height="19" rx="4" fill="#0c2d26"/><text y="${team === 'blue' ? -28 : 34}" text-anchor="middle" fill="#fff7e9" font-family="Arial,sans-serif" font-size="12">${safe(short)}</text>` : ''}</g>`;
    }
    function cone(x, y) { return `<path d="M${x},${y - 8} l-6,12 h12 z" fill="#ffbd61" stroke="#472e0c" stroke-width="1"/>`; }
    function ball(x, y) { return `<circle cx="${x}" cy="${y}" r="7" fill="#ffe059" stroke="#202b28" stroke-width="2"/>`; }
    function arrow(x1, y1, x2, y2, pass = false) { return `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="${pass ? '#fff9ee' : '#a2d7c2'}" stroke-width="3" ${pass ? 'stroke-dasharray="9 7"' : ''} marker-end="url(#training-arrow)"/>`; }
    function pitch(x, y, w, h) {
        let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#185442"/>`;
        for (let i = 1; i < 8; i += 2) s += `<rect x="${x + 2}" y="${y + h * i / 8}" width="${w - 4}" height="${h / 8}" fill="#1d5d49"/>`;
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="#cce5d8" stroke-width="2"/>`;
        [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(p => { s += cone(...p); });
        return s;
    }
    function wrapper(title, subtitle, body, height = 600) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${height}" role="img" aria-label="${safe(title + '. ' + subtitle)}"><defs><marker id="training-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#e5f5e9"/></marker></defs><rect width="900" height="${height}" rx="18" fill="#102c27"/><text x="34" y="36" fill="#99cbb6" font-family="Arial,sans-serif" font-size="14" letter-spacing="3">PALOMETAS · SUB 17</text><text x="34" y="73" fill="#fff9ee" font-family="Arial,sans-serif" font-size="27" font-weight="700">${safe(title)}</text><text x="34" y="101" fill="#c0d9cc" font-family="Arial,sans-serif" font-size="18">${safe(subtitle)}</text>${body}</svg>`;
    }
    function fieldBoard(type, n, lineup) {
        const x = 100, y = 150, w = 700, h = 340;
        const xy = p => [x + p[0] * w, y + p[1] * h];
        let s = pitch(x, y, w, h);
        const gate = (top, positions = [.2, .8]) => positions.forEach(p => { const cy = top ? y : y + h; s += cone(x + p * w - 28, cy) + cone(x + p * w + 28, cy); });
        const goal = top => { const cy = top ? y : y + h; s += `<rect x="${x + w * .39}" y="${top ? cy - 19 : cy}" width="${w * .22}" height="19" fill="#122f28" stroke="#f6f1e6" stroke-width="3"/><path d="M${x + w * .25},${cy} v${top ? 65 : -65} h${w * .5} v${top ? -65 : 65}" fill="none" stroke="#cce5d8" stroke-width="1.5"/>`; };
        if (type === 'build-no-gk') {
            gate(true); gate(false);
        } else if (type === 'build-gk') {
            goal(false); gate(true);
        } else {
            goal(true); gate(false);
            if (type === 'game') s += `<path d="M${x},${y + h / 2} h${w}" stroke="#d3ebdb" stroke-opacity=".4" stroke-dasharray="8 8"/><text x="450" y="552" fill="#c0d9cc" text-anchor="middle" font-family="Arial,sans-serif" font-size="18">Cambiá el equipo que ataca el arco en cada pausa</text>`;
        }
        lineup.groups.forEach(group => group.slots.forEach(slot => { s += person(...xy(slot.point), group.team, slot.code, slot.player ? Palometas.nameOf(slot.player) : ''); }));
        if (lineup.keeper) s += person(...xy(lineup.keeper.point), 'keeper', 'ARQ', lineup.keeper.player ? Palometas.nameOf(lineup.keeper.player) : '');
        const start = lineup.keeper?.point || lineup.groups[0].slots[0].point;
        s += ball(...xy([start[0] + .025, start[1] - .03]));
        const titles = { 'build-no-gk': 'Dos puertas para progresar, sin arquera', 'build-gk': 'Salida desde la arquera hacia dos puertas', attack: 'Un arco, dos bandas y apoyo por detrás', game: 'Un arco real y dos puertas de conos' };
        const dimensions = { 'build-no-gk': '30 × 24 m', 'build-gk': '32 × 28 m', attack: '36 × 30 m', game: '40 × 30 m' };
        return wrapper(titles[type], `${description(type, n)} · ${dimensions[type]}`, s);
    }
    function stationsBoard(n, lineup) {
        const counts = groups(n); let s = '';
        for (let i = 0; i < 3; i++) {
            const x = 38 + i * 288, y = 167, w = 248, h = 262, count = counts[i];
            s += `<text x="${x}" y="142" fill="#f6f2e9" font-family="Arial,sans-serif" font-size="21" font-weight="700">${'ABC'[i]} · ${count} jugadoras</text>` + pitch(x, y, w, h);
            let assigned = 0;
            const p = (u, v, team, label) => { const slot = lineup.groups[i].slots[assigned++]; return person(x + u * w, y + v * h, team, label, slot?.player ? Palometas.nameOf(slot.player) : ''); };
            if (i === 0) {
                if (count === 4) s += p(.24, .18, 'red', '1') + p(.24, .8, 'red', '2') + p(.76, .18, 'red', '3') + p(.76, .8, 'red', '4');
                else s += p(.2, .8, 'red', 'P') + p(.5, .28, 'red', 'R') + p(.8, .8, 'red', 'AP');
                s += arrow(x + .24 * w, y + .7 * h, x + .24 * w, y + .32 * h, true);
                [.22, .76].forEach(u => { s += cone(x + u * w - 18, y + .5 * h) + cone(x + u * w + 18, y + .5 * h); });
            } else if (i === 1) {
                s += p(.18, .25, 'red', '1') + p(.8, .3, 'red', '2') + p(.53, .52, 'blue', 'D');
                if (count === 4) s += p(.55, .8, 'red', '3');
                s += ball(x + .24 * w, y + .2 * h);
            } else {
                s += p(.4, .62, 'red', '1') + p(.52, .35, 'blue', 'D') + p(-.06, .5, 'neutral', 'C');
                if (count === 4) s += p(1.06, .5, 'neutral', 'C');
                [y, y + h].forEach(cy => { s += cone(x + w / 2 - 22, cy) + cone(x + w / 2 + 22, cy); });
                s += ball(x + .46 * w, y + .6 * h);
            }
        }
        s += `<text x="162" y="483" fill="#c0d9cc" text-anchor="middle" font-family="Arial,sans-serif" font-size="18">Pase y control · 12 × 10 m</text><text x="450" y="483" fill="#c0d9cc" text-anchor="middle" font-family="Arial,sans-serif" font-size="18">Rondo · 12 × 12 m</text><text x="738" y="483" fill="#c0d9cc" text-anchor="middle" font-family="Arial,sans-serif" font-size="18">1v1 + apoyos · 14 × 12 m</text><text x="450" y="523" fill="#ecf5e8" text-anchor="middle" font-family="Arial,sans-serif" font-size="22">A → B → C → A · 8 minutos por estación</text><text x="450" y="555" fill="#99cbb6" text-anchor="middle" font-family="Arial,sans-serif" font-size="17">Dejá al menos 4 m libres entre campos · Agua y pelotas por fuera</text>`;
        return wrapper('Armado de las tres estaciones', `${n} jugadoras de campo · ninguna estación necesita arquera`, s);
    }
    function render(type, n, lineup = TrainingLineups.create(type, n)) {
        if (type === 'stations') return stationsBoard(n, lineup);
        if (['build-no-gk', 'build-gk', 'attack', 'game'].includes(type)) return fieldBoard(type, n, lineup);
        return '';
    }
    return { distribution, description, groups, render };
})();
