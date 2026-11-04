/* Animación vectorial de las tareas, se inicia únicamente con Ver movimiento. */
window.WarmupMotions = (() => {
    const clamp = n => Math.max(0, Math.min(1, n));
    const ease = n => { const v = clamp(n); return v * v * (3 - 2 * v); };
    const wave = (t, duration = 4) => (1 - Math.cos(t * Math.PI * 2 / duration)) / 2;
    const mix = (a, b, r) => a + (b - a) * r;
    const point = p => p.map(v => v.toFixed(1)).join(',');
    function base() {
        return { head: [450, 190], neck: [450, 217], ls: [418, 232], rs: [482, 232], le: [394, 280], re: [506, 280], lh: [380, 327], rh: [520, 327], hipL: [434, 320], hipR: [466, 320], lk: [429, 390], rk: [471, 390], la: [425, 455], ra: [475, 455], lf: [[414, 466], [442, 466]], rf: [[461, 466], [492, 466]] };
    }
    function athlete(p, side = false) {
        const limb = (a, b, c, color, width) => `<path d="M${point(a)} L${point(b)} ${point(c)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
        const shorts = (hip, knee) => { const q = [mix(hip[0], knee[0], .3), mix(hip[1], knee[1], .3)]; return `<path d="M${point(hip)} L${point(q)}" stroke="#142921" stroke-width="26" stroke-linecap="round"/>`; };
        let s = limb(p.hipL, p.lk, p.la, side ? '#b68b6a' : '#d9b28d', 15) + limb(p.hipR, p.rk, p.ra, '#e0b994', 16);
        s += limb(p.ls, p.le, p.lh, side ? '#b68b6a' : '#d9b28d', 12);
        s += `<path d="M${point(p.ls)} Q${point(p.neck)} ${point(p.rs)} L${point([p.hipR[0] + 8, p.hipR[1] + 2])} Q${point([450 + (p.hipL[0] + p.hipR[0] - 900) / 2, p.hipL[1] - 12])} ${point([p.hipL[0] - 8, p.hipL[1] + 2])} Z" fill="#c73c64"/>`;
        s += shorts(p.hipL, p.lk) + shorts(p.hipR, p.rk) + limb(p.rs, p.re, p.rh, '#e0b994', 12);
        s += `<path d="M${point(p.neck)} L${point(p.head)}" stroke="#d9b28d" stroke-width="14"/><path d="M${p.head[0] - 7},${p.head[1] - 18} q-39,-10 -45,27 q20,-14 34,-4" fill="#202a24"/><circle cx="${p.head[0]}" cy="${p.head[1]}" r="22" fill="#e0b994"/>`;
        if (side) s += `<path d="M${p.head[0] + 17},${p.head[1] - 7} l10,10 -10,3" fill="#e0b994"/>`;
        for (const foot of [p.lf, p.rf]) s += `<path d="M${point(foot[0])} L${point(foot[1])}" stroke="#f0eee3" stroke-width="13" stroke-linecap="round"/>`;
        return s;
    }
    function frontPose(id, t) {
        const p = base(); let phase = '';
        if (id === 'lateral') {
            const shift = 110 * Math.sin(t * Math.PI / 4), stride = Math.sin(t * Math.PI * 2), kneeBend = 12;
            for (const value of Object.values(p)) {
                if (Array.isArray(value[0])) value.forEach(q => { q[0] += shift; }); else value[0] += shift;
            }
            ['head', 'neck', 'ls', 'rs', 'le', 're', 'lh', 'rh', 'hipL', 'hipR'].forEach(key => { p[key][1] += kneeBend; });
            p.la[0] -= 12 * stride; p.ra[0] += 12 * stride;
            p.lf = [[p.la[0] - 11, 466], [p.la[0] + 17, 466]]; p.rf = [[p.ra[0] - 14, 466], [p.ra[0] + 17, 466]];
            phase = 'Desplazá de lado, abrí y acercá los pies sin cruzarlos';
        } else if (id === 'cadera') {
            const cycle = t % 16, right = cycle < 8, u = cycle % 8;
            const lift = u < 2 ? ease(u / 2) : u < 6 ? 1 : 1 - ease((u - 6) / 2);
            const open = u < 2 ? 0 : u < 4 ? ease((u - 2) / 2) : u < 6 ? 1 - ease((u - 4) / 2) : 0;
            p.rk = [471 + 65 * open, 390 - 67 * lift]; p.ra = [475 + 72 * open, 455 - 87 * lift]; p.rf = [[p.ra[0] - 12, p.ra[1] + 8], [p.ra[0] + 16, p.ra[1] + 8]];
            if (!right) reflect(p);
            phase = u < 2 ? 'Subí una rodilla con el tronco estable' : u < 4 ? 'Abrí la cadera hacia el costado' : u < 6 ? 'Volvé al centro con control' : 'Bajá el pie y cambiá de pierna';
        } else if (id === 'tronco') {
            const angle = Math.sin(t * Math.PI / 3) * .6, width = 32 * Math.cos(angle), turn = 6 * Math.sin(angle);
            p.ls = [450 - width + turn, 232]; p.rs = [450 + width + turn, 232];
            p.le = [450 - 70 * Math.cos(angle), 247 - 12 * Math.sin(angle)]; p.lh = [450 - 106 * Math.cos(angle), 248 - 19 * Math.sin(angle)];
            p.re = [450 + 70 * Math.cos(angle), 247 + 12 * Math.sin(angle)]; p.rh = [450 + 106 * Math.cos(angle), 248 + 19 * Math.sin(angle)];
            phase = 'Girá suave a cada lado, mantené los pies apoyados';
        } else if (id === 'equilibrio') {
            const cycle = t % 36, right = cycle < 18, u = cycle % 18;
            const lift = u < 2 ? ease(u / 2) : u < 17 ? 1 : 1 - ease(u - 17);
            p.head[0] -= 15 * lift; p.neck[0] -= 15 * lift; p.ls[0] -= 15 * lift; p.rs[0] -= 15 * lift;
            p.lh = [350, 285]; p.rh = [545, 285]; p.le = [385, 267]; p.re = [510, 267];
            p.rk = [471 + 20 * lift, 390 - 34 * lift]; p.ra = [475 + 25 * lift, 455 - 64 * lift]; p.rf = [[p.ra[0] - 12, p.ra[1] + 9], [p.ra[0] + 16, p.ra[1] + 9]];
            if (!right) reflect(p);
            phase = u < 2 ? 'Levantá un pie y encontrá el equilibrio' : u < 17 ? 'Sostené 15 segundos, pelvis nivelada y mirada al frente' : 'Apoyá y cambiá de pierna';
        }
        return { p, phase, side: false };
    }
    function reflect(p) {
        for (const value of Object.values(p)) { if (Array.isArray(value[0])) value.forEach(q => { q[0] = 900 - q[0]; }); else value[0] = 900 - value[0]; }
    }
    function sidePose(id, t) {
        const p = base(), a = wave(t, 5);
        Object.assign(p, { head: [480, 190], neck: [477, 217], ls: [455, 231], rs: [480, 234], le: [467, 285], re: [497, 281], lh: [495, 325], rh: [515, 319], hipL: [447, 320], hipR: [470, 320], lk: [440, 390], rk: [481, 390], la: [438, 454], ra: [480, 454], lf: [[426, 466], [462, 466]], rf: [[468, 466], [507, 466]] });
        let phase = '';
        if (id === 'tobillo') {
            p.hipL = [474 + 12 * a, 327 + 9 * a]; p.hipR = [490 + 12 * a, 328 + 9 * a];
            p.lk = [440, 405]; p.la = [405, 454]; p.lf = [[394, 466], [432, 466]];
            p.rk = [570 + 25 * a, 385 + 10 * a]; p.ra = [567, 453]; p.rf = [[555, 466], [600, 466]];
            for (const key of ['head', 'neck', 'ls', 'rs', 'le', 're', 'lh', 'rh']) p[key][0] += 15 * a;
            phase = a > .5 ? 'Llevá la rodilla hacia delante, mantené el talón abajo' : 'Volvé despacio sin despegar el talón';
        } else if (id === 'sentadilla') {
            for (const key of ['head', 'neck', 'ls', 'rs', 'le', 're', 'lh', 'rh']) { p[key][0] -= 15 * a; p[key][1] += 48 * a; }
            p.hipL = [447 - 36 * a, 320 + 55 * a]; p.hipR = [470 - 36 * a, 320 + 55 * a];
            p.lk = [440 + 23 * a, 390 + 12 * a]; p.rk = [481 + 23 * a, 390 + 12 * a];
            p.le = [mix(p.ls[0], 515, a), mix(p.ls[1] + 53, p.ls[1] + 10, a)]; p.lh = [mix(p.ls[0] + 20, 560, a), mix(p.ls[1] + 93, p.ls[1] + 10, a)];
            p.re = [mix(p.rs[0] + 17, 540, a), mix(p.rs[1] + 47, p.rs[1] + 10, a)]; p.rh = [mix(p.rs[0] + 35, 580, a), mix(p.rs[1] + 85, p.rs[1] + 10, a)];
            phase = a > .5 ? 'Cadera atrás y rodillas alineadas, bajá solo hasta controlar' : 'Subí sin impulso, mantené toda la planta apoyada';
        } else if (id === 'zancada') {
            p.hipL = [468, 322 + 42 * a]; p.hipR = [485, 324 + 42 * a];
            p.lk = [428, 389 + 40 * a]; p.rk = [558, 388 + 22 * a];
            p.la = [393, 447]; p.ra = [561, 454]; p.lf = [[390, 448], [422, 466]]; p.rf = [[548, 466], [590, 466]];
            for (const key of ['head', 'neck', 'ls', 'rs', 'le', 're', 'lh', 'rh']) p[key][1] += 40 * a;
            phase = a > .5 ? 'Bajá en una zancada corta, tronco erguido y pie delantero firme' : 'Subí con control, después cambiá la pierna adelantada';
        } else if (id === 'talones') {
            for (const [key, value] of Object.entries(p)) {
                if (!['lf', 'rf'].includes(key)) value[1] -= 24 * a;
            }
            p.lf = [[426, 466 - 24 * a], [462, 466]]; p.rf = [[468, 466 - 24 * a], [507, 466]];
            phase = a > .5 ? 'Subí los talones despacio, apoyate en la parte delantera del pie' : 'Bajá los talones con control, sin dejarte caer';
        }
        return { p, phase, side: true };
    }
    function track(keys, t, smooth = true) {
        if (t <= keys[0][0]) return keys[0][1];
        for (let i = 1; i < keys.length; i++) {
            if (t > keys[i][0]) continue;
            const [start, a] = keys[i - 1], [end, b] = keys[i], ratio = clamp((t - start) / (end - start));
            const f = smooth ? ease(ratio) : ratio;
            return [mix(a[0], b[0], f), mix(a[1], b[1], f)];
        }
        return keys[keys.length - 1][1];
    }
    function cone(x, y, label = '', color = '#ffb95e') {
        return `<path d="M${x},${y - 12} l-10,23 h20 z" fill="${color}" stroke="#3b3926" stroke-width="2"/>${label ? `<text x="${x}" y="${y + 39}" text-anchor="middle" fill="#d2d8b7" font-size="14">${label}</text>` : ''}`;
    }
    function footballer(p, angle, label, foot = '') {
        const color = label === 'A' ? '#ce3158' : '#318fd8';
        return `<g transform="translate(${point(p)})"><g transform="rotate(${angle})"><ellipse cx="-8" cy="-25" rx="6" ry="10" fill="${foot === 'I' ? '#9ee8bb' : '#f4eee3'}"/><ellipse cx="8" cy="-25" rx="6" ry="10" fill="${foot === 'D' ? '#9ee8bb' : '#f4eee3'}"/><ellipse rx="21" ry="23" fill="${color}" stroke="#fff7e9" stroke-width="2"/><path d="M-23,0 v18 M23,0 v18" stroke="#deb38b" stroke-width="9" stroke-linecap="round"/><circle cy="-6" r="13" fill="#e0b994"/></g><rect x="-15" y="34" width="30" height="23" rx="5" fill="#0d3026"/><text y="51" text-anchor="middle" fill="#fff8e9" font-size="17" font-weight="700">${label}</text></g>`;
    }
    function field() {
        return '<rect x="100" y="140" width="700" height="330" rx="12" fill="#1c5541" stroke="#9bc9ae" stroke-width="2"/>';
    }
    function ball(p) { return `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="#ffe059" stroke="#17392c" stroke-width="2"/>`; }
    const lane = { centers: [[500, 310], [752, 310]], fronts: [[525, 310], [727, 310]], meeting: [500, 310], parked: [525, 310], support: [608, 310], supportFoot: [583, 310] };
    function laneField() {
        return field() + cone(140, 310, 'Giro') + cone(550, 250, 'I', '#71c3e7') + cone(550, 370, 'D', '#e6698d') + cone(702, 250, 'D', '#e6698d') + cone(702, 370, 'I', '#71c3e7');
    }
    function setup() {
        return frame('UN SOLO ARMADO · CINCO CONOS POR PAREJA', laneField() + footballer(lane.centers[0], 90, 'A') + footballer(lane.centers[1], 270, 'B') + ball(lane.fronts[0]) + '<path d="M140,194 H500 M500,181 V207 M140,181 V207" fill="none" stroke="#c8dfca"/><text x="320" y="180" text-anchor="middle" fill="#c8dfca" font-size="17">10–12 m hasta el giro</text><path d="M500,440 H752" stroke="#c8dfca"/><text x="626" y="463" text-anchor="middle" fill="#c8dfca" font-size="16">6–8 m entre A y B</text>', 'Dejá los cinco conos fijos, en las carreras B se acerca para el pase corto');
    }
    function passing(t, options = {}) {
        const duration = options.wall ? 5.6 : 3.8;
        const feet = options.color ? ['I', 'D', 'I', 'I', 'D', 'D'] : ['I', 'I', 'D', 'D'];
        const u = t % (duration * feet.length), turn = Math.min(feet.length - 1, Math.max(0, Math.floor(u / duration))), local = u - turn * duration;
        const owner = turn % 2, foot = feet[turn], recipient = 1 - owner;
        const target = owner ? [702, foot === 'I' ? 350 : 270] : [550, foot === 'I' ? 270 : 350];
        const controlStart = options.wall ? 2 : 0, controlEnd = controlStart + (options.wall ? 1.6 : 2), passEnd = controlEnd + (options.wall ? 1.4 : 1.8);
        const positions = lane.centers.map(p => [...p]);
        let location, phase;
        const who = owner ? 'B' : 'A', partner = recipient ? 'B' : 'A';
        if (options.wall && local < controlStart) {
            location = local < 1 ? track([[0, lane.fronts[owner]], [1, lane.fronts[recipient]]], local) : track([[1, lane.fronts[recipient]], [2, lane.fronts[owner]]], local);
            phase = local < 1 ? `${who} inicia la pared con ${partner}` : `${partner} devuelve de cara, ${who} prepara el control orientado`;
        } else if (local < controlEnd) {
            location = track([[controlStart, lane.fronts[owner]], [controlEnd, target]], local);
            positions[owner] = [location[0] + (owner ? 25 : -25), location[1] + (foot === 'I' ? (owner ? -8 : 8) : (owner ? 8 : -8))];
            phase = `${who}, controlá hacia delante con la ${foot === 'I' ? 'izquierda' : 'derecha'}`;
            if (options.color) phase = `${foot === 'I' ? 'AZUL' : 'ROSA'}, ${who} controla con la ${foot === 'I' ? 'izquierda' : 'derecha'}`;
        } else {
            location = track([[controlEnd, target], [passEnd, lane.fronts[recipient]]], local);
            const last = [target[0] + (owner ? 25 : -25), target[1] + (foot === 'I' ? (owner ? -8 : 8) : (owner ? 8 : -8))];
            positions[owner] = track([[controlEnd, last], [passEnd, lane.centers[owner]]], local);
            phase = `${who} devuelve y vuelve al centro, ahora recibe ${partner}`;
            if (options.color) phase = `Indicá ${feet[(turn + 1) % feet.length] === 'I' ? 'AZUL' : 'ROSA'} antes de que reciba ${partner}`;
        }
        let body = laneField();
        body += `<path d="M${point(lane.fronts[owner])} L${point(target)}" fill="none" stroke="#9ee8bb" stroke-width="3"/><path d="M${point(target)} L${point(lane.fronts[recipient])}" fill="none" stroke="#fff5e5" stroke-width="2" stroke-dasharray="9 8"/>`;
        body += footballer(positions[0], 90, 'A', owner === 0 && local >= controlStart && local < controlEnd ? foot : '') + footballer(positions[1], 270, 'B', owner === 1 && local >= controlStart && local < controlEnd ? foot : '') + ball(location);
        body += '<text x="450" y="500" text-anchor="middle" fill="#bed5c3" font-size="16">Azul, izquierda · Rosa, derecha · Mismos cinco conos en todas las variantes</text>';
        return { body, phase };
    }
    function running(t, options = {}) {
        const { meeting, support, parked, supportFoot } = lane;
        const runnerKeys = [[0, support], [.7, [600, 205]], [2.7, [195, 205]], [3.3, [108, 270]], [3.8, [108, 350]], [4.4, [195, 390]], [5.6, [450, 385]], [6, meeting], [8, meeting]];
        const swapKeys = [[0, meeting], [.6, [480, 410]], [1.3, [630, 410]], [1.8, [630, 310]], [2, support], [8, support]];
        const facing = (keys, time, fallback) => {
            const a = track(keys, time, false), b = track(keys, time + .02, false);
            return Math.hypot(b[0] - a[0], b[1] - a[1]) < .01 ? fallback : Math.atan2(b[0] - a[0], a[1] - b[1]) * 180 / Math.PI;
        };
        let positions, angles, location, phase;
        if (t < 5) {
            positions = [track([[0, [165, 310]], [3, meeting], [5, meeting]], t), support]; angles = [90, 270];
            location = t < 3 ? parked : t < 4 ? track([[3, parked], [4, supportFoot]], t) : track([[4, supportFoot], [5, parked]], t);
            phase = t < 3 ? 'A corre desde el cono a la pelota' : t < 4 ? 'A frena y da un pase corto a B' : 'B devuelve corto y se prepara para correr al cono';
        } else {
            const cycle = (t - 5) % 16, half = Math.floor(cycle / 8), u = cycle % 8;
            const runner = half === 0 ? 1 : 0, other = 1 - runner;
            positions = []; angles = [];
            positions[runner] = track(runnerKeys, u, false); angles[runner] = facing(runnerKeys, u, 90);
            const target = [550, other === 0 ? 270 : 350];
            if (options.control && u < 2.4) {
                location = track([[0, parked], [1.2, target], [2.4, parked]], u);
                positions[other] = [location[0] - 25, location[1]]; angles[other] = 90;
            } else {
                const shift = options.control ? Math.max(0, u - 2.4) * 1.25 : u;
                positions[other] = track(swapKeys, shift, false); angles[other] = facing(swapKeys, shift, 270);
                location = u < 6 ? parked : u < 7 ? track([[6, parked], [7, supportFoot]], u) : track([[7, supportFoot], [8, parked]], u);
            }
            const who = runner ? 'B' : 'A', partner = other ? 'B' : 'A';
            phase = options.control && u < 1.2 ? `${partner} controla al ${other === 0 ? 'AZUL' : 'ROSA'}, ${who} sale al cono` : options.control && u < 2.4 ? `${partner} deja la pelota otra vez en el punto de pase` : u < 2.5 ? `${who} va al cono, ${partner} ocupa el apoyo de enfrente` : u < 4.4 ? `${who} rodea el cono y vuelve, la pelota queda preparada` : u < 6 ? `${who} vuelve a la pelota y se prepara para el pase corto` : u < 7 ? `${who} pasa corto a ${partner}` : `${partner} devuelve corto, ahora le toca correr al cono`;
        }
        let body = laneField();
        body += '<path d="M608,310 L600,205 H195 Q90,205 108,310 Q90,390 195,390 L450,385 500,310" fill="none" stroke="#9acbab" stroke-width="2" stroke-dasharray="9 8"/><path d="M525,310 H583" fill="none" stroke="#fff8e9" stroke-width="3" stroke-dasharray="8 7"/><circle cx="525" cy="310" r="17" fill="none" stroke="#ffe059" stroke-opacity=".55"/><text x="450" y="500" text-anchor="middle" fill="#bed5c3" font-size="16">B se acerca para la pared de 2–3 m · El cono de giro queda a 10–12 m</text>';
        body += footballer(positions[0], angles[0], 'A') + footballer(positions[1], angles[1], 'B') + ball(location);
        return { body, phase };
    }
    function frame(view, body, phase, progress = '', mobility = false) {
        const e = Palometas.escapeHTML;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="${e(view + '. ' + phase)}" font-family="Arial,sans-serif"><rect width="900" height="580" rx="18" fill="#102c27"/><text x="32" y="37" fill="#99cbb6" font-size="14" letter-spacing="3">PALOMETAS · ${mobility ? 'MOVILIDAD' : 'CIRCUITO DE PASES'}</text><text x="32" y="76" fill="#c8d9b8" font-size="18" letter-spacing="1">${e(view)}</text>${progress}${body}<rect x="22" y="519" width="856" height="43" rx="8" fill="#1c3d30"/><text x="450" y="546" text-anchor="middle" fill="#eff3e4" font-size="16">${e(phase)}</text></svg>`;
    }
    function render(id, t = 0, sequence = []) {
        t = Number.isFinite(t) ? Math.max(0, t) : 0;
        const mobility = id === 'movilidad';
        sequence = Array.isArray(sequence) ? sequence.filter(part => Number.isFinite(part.seconds) && part.seconds > 0) : [];
        let body, phase, view, sequenceTitle = '', progress = '';
        if (id === 'movilidad' && sequence.length) {
            const total = sequence.reduce((sum, part) => sum + part.seconds, 0), elapsed = t % total;
            let start = 0, index = 0;
            for (; index < sequence.length - 1; index++) { if (elapsed < start + sequence[index].seconds) break; start += sequence[index].seconds; }
            const part = sequence[index]; id = part.id; t = elapsed - start;
            sequenceTitle = `MOVILIDAD · ${index + 1} DE ${sequence.length} · ${part.name.toUpperCase()}`;
            progress = `<rect x="32" y="105" width="836" height="4" rx="2" fill="#ffffff20"/><rect x="32" y="105" width="${836 * clamp(elapsed / total)}" height="4" rx="2" fill="#a7d6af"/>`;
        }
        if (id === 'progresion') { ({ body, phase } = running(t)); view = 'CARRERA, PARED CORTA Y CAMBIO · VISTA DESDE ARRIBA'; }
        else if (id === 'pases' || id === 'color' || id === 'pared') { ({ body, phase } = passing(t, { color: id === 'color', wall: id === 'pared' })); view = id === 'color' ? 'CONTROL AL COLOR · VISTA DESDE ARRIBA' : id === 'pared' ? 'PARED Y CONTROL · VISTA DESDE ARRIBA' : 'CONTROL Y PASE · VISTA DESDE ARRIBA'; }
        else if (id === 'carrera-color') { ({ body, phase } = running(t, { control: true })); view = 'CARRERA, PARED Y CONTROL AL COLOR'; }
        else {
            const info = ['tobillo', 'sentadilla', 'zancada', 'talones'].includes(id) ? sidePose(id, t) : frontPose(id, t);
            body = `<ellipse cx="470" cy="469" rx="144" ry="12" fill="#0c241d"/><path d="M290 473 H670" stroke="#9dc2a9" stroke-width="2"/>${athlete(info.p, info.side)}`;
            phase = info.phase; view = info.side ? 'VISTA LATERAL' : 'VISTA DE FRENTE';
        }
        return frame(sequenceTitle || view, body, phase, progress, mobility);
    }
    return { render, setup };
})();
