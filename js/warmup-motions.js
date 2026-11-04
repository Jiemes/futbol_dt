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
    function cone(x, y, label = '') {
        return `<path d="M${x},${y - 12} l-10,23 h20 z" fill="#ffb95e" stroke="#3b3926" stroke-width="2"/>${label ? `<text x="${x}" y="${y + 39}" text-anchor="middle" fill="#d2d8b7" font-size="14">${label}</text>` : ''}`;
    }
    function footballer(p, angle, label, foot = '') {
        const color = label === 'A' ? '#ce3158' : '#318fd8';
        return `<g transform="translate(${point(p)})"><g transform="rotate(${angle})"><ellipse cx="-8" cy="-25" rx="6" ry="10" fill="${foot === 'I' ? '#9ee8bb' : '#f4eee3'}"/><ellipse cx="8" cy="-25" rx="6" ry="10" fill="${foot === 'D' ? '#9ee8bb' : '#f4eee3'}"/><ellipse rx="21" ry="23" fill="${color}" stroke="#fff7e9" stroke-width="2"/><path d="M-23,0 v18 M23,0 v18" stroke="#deb38b" stroke-width="9" stroke-linecap="round"/><circle cy="-6" r="13" fill="#e0b994"/></g><rect x="-15" y="34" width="30" height="23" rx="5" fill="#0d3026"/><text y="51" text-anchor="middle" fill="#fff8e9" font-size="17" font-weight="700">${label}</text></g>`;
    }
    function field() {
        return '<rect x="100" y="140" width="700" height="330" rx="12" fill="#1c5541" stroke="#9bc9ae" stroke-width="2"/>';
    }
    function ball(p) { return `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="#ffe059" stroke="#17392c" stroke-width="2"/>`; }
    function passing(t) {
        // Izquierda y derecha se leen desde la orientación de cada jugadora.
        const duration = 3.8, u = t % (duration * 4), turn = Math.floor(u / duration), local = u - turn * duration;
        const owner = turn % 2, foot = turn < 2 ? 'I' : 'D';
        const centers = [[235, 310], [665, 310]], fronts = [[260, 310], [640, 310]];
        const targets = [[300, foot === 'I' ? 255 : 365], [600, foot === 'I' ? 365 : 255]];
        const recipient = 1 - owner, target = targets[owner];
        const control = ease(local / 2), returning = ease((local - 2) / 1.8);
        let location;
        const positions = centers.map(p => [...p]);
        if (local < 2) {
            location = [mix(fronts[owner][0], target[0], control), mix(fronts[owner][1], target[1], control)];
            positions[owner] = [location[0] + (owner ? 25 : -25), location[1] + (foot === 'I' ? (owner ? -8 : 8) : (owner ? 8 : -8))];
        } else {
            location = [mix(target[0], fronts[recipient][0], returning), mix(target[1], fronts[recipient][1], returning)];
            const last = [target[0] + (owner ? 25 : -25), target[1] + (foot === 'I' ? (owner ? -8 : 8) : (owner ? 8 : -8))];
            positions[owner] = [mix(last[0], centers[owner][0], returning), mix(last[1], centers[owner][1], returning)];
        }
        let body = field();
        [[300, 235, 'I'], [300, 385, 'D'], [600, 235, 'D'], [600, 385, 'I']].forEach(p => { body += cone(...p); });
        body += `<path d="M${point(fronts[owner])} L${point(target)}" fill="none" stroke="#9ee8bb" stroke-width="3"/><path d="M${point(target)} L${point(fronts[recipient])}" fill="none" stroke="#fff5e5" stroke-width="2" stroke-dasharray="9 8"/>`;
        body += footballer(positions[0], 90, 'A', owner === 0 && local < 2 ? foot : '') + footballer(positions[1], 270, 'B', owner === 1 && local < 2 ? foot : '') + ball(location);
        body += '<text x="450" y="500" text-anchor="middle" fill="#bed5c3" font-size="17">6–8 m entre chicas · conos a 1–1,5 m · I y D desde cada jugadora</text>';
        const who = owner ? 'B' : 'A', side = foot === 'I' ? 'izquierda' : 'derecha';
        return { body, phase: local < 2 ? `${who}, controlá hacia delante con la ${side}, hacia tu cono ${foot === 'I' ? 'izquierdo' : 'derecho'}` : `${who}, devolvé el pase y volvé al centro, ahora recibe ${recipient ? 'B' : 'A'}` };
    }
    function running(t) {
        const meeting = [560, 315], support = [715, 315], parked = [584, 315], supportFoot = [690, 315];
        const runnerKeys = [[0, support], [.7, [670, 240]], [2.7, [235, 240]], [3.3, [150, 285]], [3.8, [150, 345]], [4.4, [235, 390]], [5.6, [510, 360]], [6, meeting], [8, meeting]];
        const swapKeys = [[0, meeting], [.7, [605, 400]], [1.3, [715, 400]], [2, support], [8, support]];
        const facing = (keys, time, fallback) => {
            const a = track(keys, time, false), b = track(keys, time + .02, false);
            return Math.hypot(b[0] - a[0], b[1] - a[1]) < .01 ? fallback : Math.atan2(b[0] - a[0], a[1] - b[1]) * 180 / Math.PI;
        };
        let positions, angles, location, phase;
        if (t < 5) {
            positions = [track([[0, [215, 315]], [3, meeting], [5, meeting]], t), support]; angles = [90, 270];
            location = t < 3 ? parked : t < 4 ? track([[3, parked], [4, supportFoot]], t) : track([[4, supportFoot], [5, parked]], t);
            phase = t < 3 ? 'A corre desde el cono a la pelota' : t < 4 ? 'A frena y da un pase corto a B' : 'B devuelve corto y se prepara para correr al cono';
        } else {
            const cycle = (t - 5) % 16, half = Math.floor(cycle / 8), u = cycle % 8;
            const runner = half === 0 ? 1 : 0, other = 1 - runner;
            positions = []; angles = [];
            positions[runner] = track(runnerKeys, u, false); positions[other] = track(swapKeys, u, false);
            angles[runner] = facing(runnerKeys, u, 90); angles[other] = facing(swapKeys, u, 270);
            location = u < 6 ? parked : u < 7 ? track([[6, parked], [7, supportFoot]], u) : track([[7, supportFoot], [8, parked]], u);
            const who = runner ? 'B' : 'A', partner = other ? 'B' : 'A';
            phase = u < 2 ? `${who} va al cono, ${partner} deja la pelota y ocupa el apoyo de enfrente` : u < 4.4 ? `${who} rodea el cono y vuelve, la pelota queda preparada` : u < 6 ? `${who} vuelve a la pelota y se prepara para el pase corto` : u < 7 ? `${who} pasa corto a ${partner}` : `${partner} devuelve corto, ahora le toca correr al cono`;
        }
        let body = field() + cone(185, 315, 'Cono de giro');
        body += '<path d="M715,300 L670,240 H235 Q135,240 150,315 Q135,390 235,390 L510,360 560,315" fill="none" stroke="#9acbab" stroke-width="2" stroke-dasharray="9 8"/><path d="M584,315 H690" fill="none" stroke="#fff8e9" stroke-width="3" stroke-dasharray="8 7"/><circle cx="584" cy="315" r="17" fill="none" stroke="#ffe059" stroke-opacity=".55"/><text x="450" y="500" text-anchor="middle" fill="#bed5c3" font-size="17">10–12 m al cono · pase corto de 2–3 m · cambia quién corre en cada vuelta</text>';
        body += footballer(positions[0], angles[0], 'A') + footballer(positions[1], angles[1], 'B') + ball(location);
        return { body, phase };
    }
    function render(id, t = 0, sequence = []) {
        let body, phase, view, sequenceTitle = '', progress = '';
        if (id === 'movilidad' && sequence.length) {
            const total = sequence.reduce((sum, part) => sum + part.seconds, 0), elapsed = t % total;
            let start = 0, index = 0;
            for (; index < sequence.length - 1; index++) { if (elapsed < start + sequence[index].seconds) break; start += sequence[index].seconds; }
            const part = sequence[index]; id = part.id; t = elapsed - start;
            sequenceTitle = `MOVILIDAD · ${index + 1} DE ${sequence.length} · ${part.name.toUpperCase()}`;
            progress = `<rect x="32" y="105" width="836" height="4" rx="2" fill="#ffffff20"/><rect x="32" y="105" width="${836 * elapsed / total}" height="4" rx="2" fill="#a7d6af"/>`;
        }
        if (id === 'progresion') { ({ body, phase } = running(t)); view = 'CARRERA, PARED CORTA Y CAMBIO · VISTA DESDE ARRIBA'; }
        else if (id === 'pases') { ({ body, phase } = passing(t)); view = 'CONTROL Y PASE · VISTA DESDE ARRIBA'; }
        else {
            const info = ['tobillo', 'sentadilla', 'zancada', 'talones'].includes(id) ? sidePose(id, t) : frontPose(id, t);
            body = `<ellipse cx="470" cy="469" rx="144" ry="12" fill="#0c241d"/><path d="M290 473 H670" stroke="#9dc2a9" stroke-width="2"/>${athlete(info.p, info.side)}`;
            phase = info.phase; view = info.side ? 'VISTA LATERAL' : 'VISTA DE FRENTE';
        }
        const e = Palometas.escapeHTML;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="${e((sequenceTitle ? sequenceTitle + '. ' : '') + phase)}" font-family="Arial,sans-serif"><rect width="900" height="580" rx="18" fill="#102c27"/><text x="32" y="37" fill="#99cbb6" font-size="14" letter-spacing="3">PALOMETAS · ACTIVACIÓN</text><text x="32" y="76" fill="#c8d9b8" font-size="18" letter-spacing="1">${e(sequenceTitle || view)}</text>${progress}${body}<rect x="22" y="519" width="856" height="43" rx="8" fill="#1c3d30"/><text x="450" y="546" text-anchor="middle" fill="#eff3e4" font-size="16">${e(phase)}</text></svg>`;
    }
    return { render };
})();
