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
    function running(t) {
        const u = t % 14; let x, amplitude, phase;
        if (u < 4) { x = 140 + 330 * (u / 4) ** 1.5; amplitude = 26 + u * 5; phase = 'Aumentá la velocidad de a poco, sin llegar al máximo'; }
        else if (u < 6) { x = 470 + 200 * (1 - (1 - (u - 4) / 2) ** 2); amplitude = 32 - 11 * (u - 4); phase = 'Acortá los pasos y bajá la velocidad antes de detenerte'; }
        else if (u < 7) { x = 670; amplitude = 0; phase = 'Terminá la frenada con equilibrio'; }
        else { x = 670 - 530 * (u - 7) / 7; amplitude = 17; phase = 'Volvé caminando y prepará la siguiente progresión'; }
        const pose = sidePose('none', t).p, swing = Math.sin(t * Math.PI * (u < 6 ? 3 : 1.8));
        pose.lk = [450 - amplitude * swing, 390]; pose.rk = [470 + amplitude * swing, 390];
        pose.la = [438 - amplitude * swing, 454 - Math.max(0, swing) * amplitude]; pose.ra = [480 + amplitude * swing, 454 - Math.max(0, -swing) * amplitude];
        pose.lf = [[pose.la[0] - 10, pose.la[1] + 10], [pose.la[0] + 23, pose.la[1] + 10]]; pose.rf = [[pose.ra[0] - 10, pose.ra[1] + 10], [pose.ra[0] + 23, pose.ra[1] + 10]];
        const mirror = u >= 7 ? 'translate(900 0) scale(-1 1)' : '';
        return { body: `<path d="M120,460 H780" stroke="#8db79d" stroke-width="2" stroke-dasharray="10 9"/><text x="450" y="493" text-anchor="middle" fill="#b9d1bf" font-size="18">10–15 metros · dejá espacio para frenar</text><g transform="translate(${x - 450 * .7} 137) scale(.7)"><g transform="${mirror}">${athlete(pose, true)}</g></g>`, phase };
    }
    function passing(t) {
        const u = t % 10;
        const receive = u < 2 ? 0 : u < 4 ? ease((u - 2) / 2) : u < 7 ? 1 : 1 - ease((u - 7) / 3);
        let bx, by;
        if (u < 2) { bx = mix(225, 660, ease(u / 2)); by = 345; }
        else if (u < 4) { bx = 660; by = mix(345, 280, ease((u - 2) / 2)); }
        else if (u < 7) { bx = mix(660, 225, ease((u - 4) / 3)); by = mix(280, 345, ease((u - 4) / 3)); }
        else { bx = 225; by = 345; }
        const person = (x, y, angle) => `<g transform="translate(${x} ${y}) rotate(${angle})"><ellipse rx="23" ry="33" fill="#cc3b61" stroke="#fff5e6" stroke-width="2"/><circle cy="-7" r="15" fill="#e0b994"/><path d="M-24,-3 V22 M24,-3 V22" stroke="#ddb28b" stroke-width="9" stroke-linecap="round"/></g>`;
        return { body: `<rect x="135" y="170" width="630" height="290" rx="12" fill="#1d5540" stroke="#b2d5ba"/><path d="M245 345 640 345 640 260" fill="none" stroke="#d9edd5" stroke-width="3" stroke-dasharray="10 8"/>${person(210, 350, 90)}${person(660, 345 - 65 * receive, -45)}<circle cx="${bx + 15}" cy="${by + 16}" r="10" fill="#ffe059" stroke="#17392c" stroke-width="2"/><text x="450" y="492" text-anchor="middle" fill="#c0d7c5" font-size="18">6–8 metros · pasá y ofrecé otro apoyo</text>`, phase: u < 2 ? 'Pasá a tu compañera, que mire antes de recibir' : u < 4 ? 'Recibí de costado y orientá el primer toque' : 'Devolvé un pase preciso y volvé a ofrecerte' };
    }
    function render(id, t = 0) {
        let body, phase, view;
        if (id === 'progresion') { ({ body, phase } = running(t)); view = 'PROGRESAR Y FRENAR'; }
        else if (id === 'pases') { ({ body, phase } = passing(t)); view = 'CONTROL Y PASE · VISTA DESDE ARRIBA'; }
        else {
            const info = ['tobillo', 'sentadilla', 'zancada', 'talones'].includes(id) ? sidePose(id, t) : frontPose(id, t);
            body = `<ellipse cx="470" cy="469" rx="144" ry="12" fill="#0c241d"/><path d="M290 473 H670" stroke="#9dc2a9" stroke-width="2"/>${athlete(info.p, info.side)}`;
            phase = info.phase; view = info.side ? 'VISTA LATERAL' : 'VISTA DE FRENTE';
        }
        const e = Palometas.escapeHTML;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="${e(phase)}" font-family="Arial,sans-serif"><rect width="900" height="580" rx="18" fill="#102c27"/><text x="32" y="37" fill="#99cbb6" font-size="14" letter-spacing="3">PALOMETAS · ACTIVACIÓN</text><text x="32" y="76" fill="#c8d9b8" font-size="18" letter-spacing="1">${view}</text>${body}<rect x="22" y="519" width="856" height="43" rx="8" fill="#1c3d30"/><text x="450" y="546" text-anchor="middle" fill="#eff3e4" font-size="16">${e(phase)}</text></svg>`;
    }
    return { render };
})();
