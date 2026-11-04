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
    function footballer(p, angle, label, foot = '', handTarget = null) {
        const color = label === 'ARQ' ? '#f4aa3b' : label === 'B' ? '#318fd8' : '#ce3158';
        return `<g transform="translate(${point(p)}) scale(.8)"><g transform="rotate(${angle})"><ellipse cx="-8" cy="-25" rx="6" ry="10" fill="${foot === 'I' ? '#9ee8bb' : '#f4eee3'}"/><ellipse cx="8" cy="-25" rx="6" ry="10" fill="${foot === 'D' ? '#9ee8bb' : '#f4eee3'}"/><ellipse rx="21" ry="23" fill="${color}" stroke="#fff7e9" stroke-width="2"/><path d="M-23,0 v18 M23,0 v18" stroke="#deb38b" stroke-width="9" stroke-linecap="round"/><circle cy="-6" r="13" fill="#e0b994"/></g><rect x="-15" y="34" width="30" height="23" rx="5" fill="#0d3026"/><text y="51" text-anchor="middle" fill="#fff8e9" font-size="17" font-weight="700">${label}</text></g>${handTarget ? `<path d="M${p[0]},${p[1]} L${handTarget[0]},${handTarget[1]}" stroke="#deb38b" stroke-width="7" stroke-linecap="round"/><circle cx="${handTarget[0]}" cy="${handTarget[1]}" r="4" fill="#e0b994"/>` : ''}`;
    }
    function field() {
        return '<rect x="100" y="140" width="700" height="330" rx="12" fill="#1c5541" stroke="#9bc9ae" stroke-width="2"/>';
    }
    function ball(p) { return `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="#ffe059" stroke="#17392c" stroke-width="2"/>`; }
    // Escala de referencia, 100 unidades equivalen a un metro.
    const lane = { centerCones: [[350, 310], [550, 310]], centers: [[380, 310], [520, 310]], fronts: [[400, 310], [500, 310]], rears: [[150, 310], [750, 310]] };
    const face = owner => owner === 0 ? 90 : 270;
    const local = (owner, p) => [lane.centerCones[owner][0] + (owner === 0 ? p[0] : -p[0]), 310 + (owner === 0 ? -p[1] : p[1])];
    const copyCenters = () => lane.centers.map(p => [...p]);
    const footAt = turn => turn < 2 ? 'I' : 'D';
    function target(owner, foot, deep = false) { return local(owner, [deep ? 110 : 55, (foot === 'I' ? 1 : -1) * (deep ? 25 : 40)]); }
    function controlBody(owner, location, foot) { return [location[0] + (owner ? 20 : -20), location[1] + (owner ? -1 : 1) * (foot === 'I' ? 6.4 : -6.4)]; }
    function heading(a, b, fallback) { return Math.hypot(b[0] - a[0], b[1] - a[1]) < .01 ? fallback : Math.atan2(b[0] - a[0], a[1] - b[1]) * 180 / Math.PI; }
    function pathPose(keys, t, fallback) {
        const p = track(keys, t, false);
        return { p, angle: heading(p, track(keys, t + .002, false), fallback) };
    }
    function ahead(p, angle) { const rad = angle * Math.PI / 180; return [p[0] + 20 * Math.sin(rad), p[1] - 20 * Math.cos(rad)]; }
    function laneField() {
        return field() + cone(350, 310, 'C', '#e8dfb7') + cone(550, 310, 'C', '#e8dfb7') + cone(420, 240, 'I', '#71c3e7') + cone(420, 380, 'D', '#e6698d') + cone(480, 240, 'D', '#e6698d') + cone(480, 380, 'I', '#71c3e7') + cone(150, 310, 'Atrás') + cone(750, 310, 'Atrás');
    }
    function setup() {
        const measures = '<path d="M350,180 H550 M350,170 V190 M550,170 V190" fill="none" stroke="#c8dfca"/><text x="450" y="165" text-anchor="middle" fill="#dcebd3" font-size="17">2 m entre centros</text><path d="M350,310 L420,240" stroke="#dcebd3" stroke-dasharray="5 5"/><text x="365" y="252" fill="#dcebd3" font-size="16">1 m</text><path d="M150,435 H350 M550,435 H750" stroke="#c8dfca"/><text x="250" y="463" text-anchor="middle" fill="#c8dfca" font-size="15">2 m de apoyo trasero</text><text x="650" y="463" text-anchor="middle" fill="#c8dfca" font-size="15">2 m de apoyo trasero</text>';
        return frame('DOS TRIÁNGULOS ENFRENTADOS · OCHO CONOS FIJOS', laneField() + measures + footballer(lane.centers[0], face(0), 'A') + footballer(lane.centers[1], face(1), 'B') + ball(lane.fronts[0]), 'Parate delante del cono central, los laterales quedan hacia delante y a los costados');
    }
    function rearPose(owner, foot, origin, progress, touch = false) {
        const side = foot === 'I' ? 1 : -1;
        const rows = [[0, origin], [.12, local(owner, [15, 105 * side])], [.3, local(owner, [-145, 105 * side])], [.46, local(owner, [-230, 0])], [.56, local(owner, [-230, 0])], [.72, local(owner, [-145, -105 * side])], [.9, local(owner, [30, -30 * side])], [1, lane.centers[owner]]];
        const pose = pathPose(rows, clamp(progress), face(owner));
        if (touch && progress >= .46 && progress <= .56) pose.hand = lane.rears[owner];
        return pose;
    }
    function actors(positions, angles, location, active = -1, foot = '', hand = null) {
        return footballer(positions[0], angles[0], 'A', active === 0 ? foot : '', active === 0 ? hand : null) + footballer(positions[1], angles[1], 'B', active === 1 ? foot : '', active === 1 ? hand : null) + ball(location);
    }
    function notes(text) { return `<text x="450" y="500" text-anchor="middle" fill="#bed5c3" font-size="16">${Palometas.escapeHTML(text)}</text>`; }
    function basicPassing(t, rear = false) {
        const duration = rear ? 5.4 : 3.8, turn = Math.min(3, Math.floor((t % (duration * 4)) / duration)), u = (t % (duration * 4)) - turn * duration;
        const owner = turn % 2, recipient = 1 - owner, foot = footAt(turn), end = target(owner, foot), controlEnd = rear ? 1.6 : 2, passEnd = controlEnd + 1.8;
        const positions = copyCenters(), angles = [face(0), face(1)], last = controlBody(owner, end, foot);
        let location, phase;
        if (u < controlEnd) {
            location = track([[0, lane.fronts[owner]], [controlEnd, end]], u);
            positions[owner] = controlBody(owner, location, foot);
            phase = `${owner ? 'B' : 'A'} orienta el primer toque, pasa antes de superar el cono lateral`;
        } else {
            location = track([[controlEnd, end], [passEnd, lane.fronts[recipient]]], u);
            if (rear) {
                const pose = rearPose(owner, foot, last, (u - controlEnd) / (duration - controlEnd)); positions[owner] = pose.p; angles[owner] = pose.angle;
                phase = `${owner ? 'B' : 'A'} pasa y va al cono de atrás, ${recipient ? 'B' : 'A'} espera su regreso`;
            } else {
                positions[owner] = track([[controlEnd, last], [passEnd, lane.centers[owner]]], u);
                phase = `${owner ? 'B' : 'A'} devuelve y vuelve al centro, ahora recibe ${recipient ? 'B' : 'A'}`;
            }
        }
        let body = laneField() + `<path d="M${point(lane.fronts[owner])} L${point(end)}" fill="none" stroke="#9ee8bb" stroke-width="2"/><path d="M${point(end)} L${point(lane.fronts[recipient])}" fill="none" stroke="#fff5e5" stroke-width="2" stroke-dasharray="7 6"/>`;
        body += actors(positions, angles, location, owner, u < controlEnd ? foot : '') + notes(rear ? 'Después de pasar, rodeá tu cono trasero y volvé para recibir por el otro perfil' : 'Primer toque hacia delante y al costado, devolución antes del cono, vuelta al centro');
        return { body, phase };
    }
    function curveState(owner, foot, t) {
        const side = foot === 'I' ? 1 : -1, u = clamp(t / 3.6);
        const rows = [[0, lane.centers[owner]], [.2, local(owner, [20, 85 * side])], [.4, local(owner, [55, 115 * side])], [.58, local(owner, [95, 95 * side])], [.72, local(owner, [100, 55 * side])], [.8, local(owner, [70, 25 * side])], [.86, local(owner, [35, 20 * side])], [1, local(owner, [35, 20 * side])]];
        let pose;
        if (u < .86) pose = pathPose(rows, u, face(owner));
        else {
            const startAngle = heading(local(owner, [70, 25 * side]), local(owner, [35, 20 * side]), face(owner));
            const delta = ((face(owner) - startAngle + 540) % 360) - 180;
            pose = { p: rows[rows.length - 1][1], angle: startAngle + delta * ease((u - .86) / .14) };
        }
        const location = u === 0 ? lane.fronts[owner] : ahead(pose.p, pose.angle);
        return { ...pose, location };
    }
    function figureEight(t) {
        const duration = 7.4, turn = Math.min(3, Math.floor((t % (duration * 4)) / duration)), u = (t % (duration * 4)) - turn * duration;
        const owner = turn % 2, recipient = 1 - owner, foot = footAt(turn), positions = copyCenters(), angles = [face(0), face(1)];
        const end = curveState(owner, foot, 3.6); let location, phase;
        if (u < 3.6) {
            const pose = curveState(owner, foot, u); positions[owner] = pose.p; angles[owner] = pose.angle; location = pose.location;
            phase = `${owner ? 'B' : 'A'} conduce por fuera del cono, dibujando la curva del ocho`;
        } else {
            location = track([[3.6, end.location], [4.8, lane.fronts[recipient]]], u);
            const pose = rearPose(owner, foot, end.p, (u - 3.6) / 3.8); positions[owner] = pose.p; angles[owner] = pose.angle;
            phase = `${owner ? 'B' : 'A'} descarga y vuelve por atrás, en su próxima recepción cambia el perfil`;
        }
        const body = laneField() + actors(positions, angles, location, owner, u < 3.6 ? foot : '') + notes('Rodeá el cono por fuera con pelota, alterná el lado en la siguiente recepción');
        return { body, phase };
    }
    function deepPassing(t) {
        const duration = 3.8, turn = Math.min(3, Math.floor((t % (duration * 4)) / duration)), u = (t % (duration * 4)) - turn * duration;
        const owner = turn % 2, recipient = 1 - owner, foot = footAt(turn), end = target(owner, foot, true), last = controlBody(owner, end, foot);
        const positions = copyCenters(), angles = [face(0), face(1)]; let location, phase;
        if (u < 1.2) {
            location = track([[0, lane.fronts[owner]], [1.2, end]], u); positions[owner] = controlBody(owner, location, foot);
            phase = `${owner ? 'B' : 'A'} orienta hacia delante y atraviesa la línea de sus conos`;
        } else {
            location = track([[1.2, end], [2.4, lane.fronts[recipient]]], u);
            const side = foot === 'I' ? 1 : -1;
            positions[owner] = track([[1.2, last], [2.7, local(owner, [30, -25 * side])], [3.8, lane.centers[owner]]], u);
            phase = `${owner ? 'B' : 'A'} devuelve con el toque siguiente y reinicia con una diagonal hacia atrás`;
        }
        const body = laneField() + `<path d="M420,218 V402 M480,218 V402" fill="none" stroke="#daeacf" stroke-width="1" stroke-dasharray="6 6"/>` + actors(positions, angles, location, owner, u < 1.2 ? foot : '') + notes('Dos contactos, control orientado y pase con el toque siguiente, sin acomodar otra vez');
        return { body, phase };
    }
    function fakeAndTouch(t) {
        const duration = 6.2, turn = Math.min(3, Math.floor((t % (duration * 4)) / duration)), u = (t % (duration * 4)) - turn * duration;
        const owner = turn % 2, recipient = 1 - owner, foot = turn < 2 ? 'D' : 'I', side = foot === 'I' ? 1 : -1;
        const nextTurn = (turn + 1) % 4, nextFoot = nextTurn < 2 ? 'D' : 'I', nextSide = nextFoot === 'I' ? 1 : -1;
        const receive = local(owner, [50, 20 * side]), end = target(owner, foot), last = controlBody(owner, end, foot);
        const nextReceive = local(recipient, [50, 20 * nextSide]);
        const positions = copyCenters(), angles = [face(0), face(1)]; let location, hand = null, phase;
        positions[recipient] = track([[0, lane.centers[recipient]], [.7, lane.centers[recipient]], [1.2, local(recipient, [30, -18 * nextSide])], [2.4, controlBody(recipient, nextReceive, nextFoot)]], u);
        if (u >= .7 && u < 1.2) angles[recipient] = face(recipient) - nextSide * 15;
        if (u < 1.2) {
            location = track([[0, receive], [1.2, end]], u); positions[owner] = controlBody(owner, location, foot);
            phase = `${owner ? 'B' : 'A'} controla con suela o exterior, ${recipient ? 'B' : 'A'} prepara la finta`;
        } else {
            location = track([[1.2, end], [2.4, nextReceive]], u);
            const pose = rearPose(owner, foot, last, (u - 1.2) / 5, true); positions[owner] = pose.p; angles[owner] = pose.angle; hand = pose.hand;
            phase = u < 2.4 ? `${recipient ? 'B' : 'A'} sale al lado contrario para recibir el pase` : hand ? `${owner ? 'B' : 'A'} toca el cono trasero con la mano y vuelve` : `${owner ? 'B' : 'A'} vuelve al centro, su compañera espera para devolver`;
        }
        const body = laneField() + actors(positions, angles, location, owner, u < 1.2 ? foot : '', hand) + notes('Finta antes de recibir, control al otro lado y toque con la mano al cono trasero');
        return { body, phase };
    }
    function rotatePositions(t) {
        const duration = 8.3, turn = Math.min(3, Math.floor((t % (duration * 4)) / duration)), u = (t % (duration * 4)) - turn * duration;
        const leftPerson = turn % 2, rightPerson = 1 - leftPerson, foot = footAt(turn);
        const positions = [], angles = []; positions[leftPerson] = lane.centers[0]; positions[rightPerson] = lane.centers[1]; angles[leftPerson] = face(0); angles[rightPerson] = face(1);
        const end = target(1, foot), last = controlBody(1, end, foot); let location, phase;
        if (u < 1) { location = track([[0, lane.fronts[0]], [1, lane.fronts[1]]], u); phase = `${leftPerson ? 'B' : 'A'} inicia el pase al centro de su compañera`; }
        else if (u < 2.6) {
            location = track([[1, lane.fronts[1]], [2.6, end]], u); positions[rightPerson] = controlBody(1, location, foot);
            phase = `${rightPerson ? 'B' : 'A'} orienta hacia el lateral y prepara la devolución`;
        } else if (u < 3.8) {
            location = track([[2.6, end], [3.8, lane.fronts[0]]], u); positions[rightPerson] = track([[2.6, last], [3.8, lane.centers[1]]], u);
            phase = `${rightPerson ? 'B' : 'A'} devuelve, ahora las dos van a cambiar de puesto`;
        } else if (u < 4.3) { location = lane.fronts[0]; phase = `${leftPerson ? 'B' : 'A'} frena la pelota y avisa, te la dejo`; }
        else {
            const progress = (u - 4.3) / 4;
            const top = [[0, lane.centers[0]], [.15, [390, 280]], [.35, [335, 205]], [.5, [450, 185]], [.7, [565, 205]], [.9, [510, 280]], [1, lane.centers[1]]];
            const bottom = [[0, lane.centers[1]], [.15, [510, 340]], [.35, [565, 415]], [.5, [450, 435]], [.7, [335, 415]], [.9, [390, 340]], [1, lane.centers[0]]];
            const a = pathPose(top, progress, face(1)), b = pathPose(bottom, progress, face(0));
            positions[leftPerson] = a.p; angles[leftPerson] = a.angle; positions[rightPerson] = b.p; angles[rightPerson] = b.angle;
            location = lane.fronts[0]; phase = 'Voy, cada una usa un costado y ocupa el centro que dejó su compañera';
        }
        const body = laneField() + '<path d="M380,310 Q335,185 450,185 Q565,185 520,310 M520,310 Q565,435 450,435 Q335,435 380,310" fill="none" stroke="#a8d2b1" stroke-width="2" stroke-dasharray="7 7"/>' + actors(positions, angles, location) + notes('Una por cada costado, pelota frenada y comunicación, voy, te la dejo');
        return { body, phase };
    }
    const finishingSpots = [
        { name: 'Centro', pole: [450, 325], queue: [450, 416], wait: [760, 416] },
        { name: 'Extremo izquierdo', pole: [210, 325], queue: [145, 416], wait: [110, 416] },
        { name: 'Extremo derecho', pole: [690, 325], queue: [755, 416], wait: [790, 416] }
    ];
    const queuePoint = (spot, index) => [spot.queue[0], spot.queue[1] + 24 * index];
    const waitingPoint = (spot, index) => [spot.wait[0], spot.wait[1] + 24 * index];
    function finishingField(active) {
        let body = '<rect x="95" y="145" width="710" height="345" rx="4" fill="#1c5541" stroke="#bcdac5" stroke-width="2"/><path d="M210,145 V325 H690 V145 M340,145 V208 H560 V145" fill="none" stroke="#c9dfcd" stroke-width="2"/><circle cx="450" cy="265" r="3" fill="#d9e9dc"/><rect x="394" y="124" width="112" height="21" fill="#102c27" stroke="#f6f1e6" stroke-width="3"/><path d="M406,125 V144 M422,125 V144 M438,125 V144 M454,125 V144 M470,125 V144 M486,125 V144 M395,135 H505" stroke="#d2e1d3" stroke-width="1"/>';
        finishingSpots.forEach((spot, index) => {
            const [x, y] = spot.pole;
            body += `<circle cx="${x}" cy="${y}" r="20" fill="${index === active ? '#ffe05925' : '#ffffff08'}"/><path d="M${x},${y - 14} V${y + 14}" stroke="#ffbd61" stroke-width="8" stroke-linecap="round"/><text x="${x}" y="${y + 38}" text-anchor="middle" fill="${index === active ? '#ffe059' : '#c9dfcd'}" font-size="15">${index + 1} · ${Palometas.escapeHTML(spot.name)}</text>`;
        });
        return body;
    }
    function finishing(t) {
        const stageDuration = 24, elapsed = t % (stageDuration * 3), station = Math.min(2, Math.floor(elapsed / stageDuration)), stageTime = elapsed - station * stageDuration;
        const spot = finishingSpots[station], next = finishingSpots[(station + 1) % 3];
        const movingGroup = stageTime >= 21, active = Math.min(2, Math.floor(stageTime / 7)), u = stageTime - active * 7;
        const foot = active === 1 ? 'I' : 'D', kick = [spot.pole[0] + (foot === 'D' ? 32 : -32), spot.pole[1] - 24];
        const goalTarget = [450 + (foot === 'D' ? -30 : 30), 157], angle = heading(kick, goalTarget, 0), rad = angle * Math.PI / 180;
        const kickBody = [kick[0] - 20 * Math.sin(rad) - (foot === 'D' ? 1 : -1) * 6.4 * Math.cos(rad), kick[1] + 20 * Math.cos(rad) - (foot === 'D' ? 1 : -1) * 6.4 * Math.sin(rad)];
        const start = queuePoint(spot, 0), wait = waitingPoint(spot, active), pickup = [goalTarget[0], goalTarget[1] + 22];
        const activeRoute = [[0, start], [1.8, kickBody], [3.2, kickBody], [4.3, pickup], [5.4, [wait[0], 230]], [6.7, wait], [7, wait]];
        let body = finishingField(station), phase, keeper = [450, 176];
        if (movingGroup) {
            const progress = ease((stageTime - 21) / 3);
            for (let i = 0; i < 3; i++) {
                const from = waitingPoint(spot, i), to = queuePoint(next, i), p = [mix(from[0], to[0], progress), mix(from[1], to[1], progress)];
                body += footballer(p, heading(from, to, 0), String(i + 1)) + ball([mix(from[0] + 18, to[0], progress), mix(from[1], to[1] - 20, progress)]);
            }
            phase = `Todas terminaron, llevá el grupo junto al puesto ${station === 2 ? 1 : station + 2}`;
        } else {
            for (let i = 0; i < 3; i++) {
                let p, location, facing = 0;
                if (i < active) { p = waitingPoint(spot, i); location = [p[0] + 18, p[1]]; }
                else if (i > active) {
                    const from = queuePoint(spot, i - active), to = queuePoint(spot, i - active - 1), advance = ease(u / 1.8);
                    p = [mix(from[0], to[0], advance), mix(from[1], to[1], advance)]; location = [p[0], p[1] - 20];
                } else {
                    p = track(activeRoute, u, false);
                    facing = u < 1.8 ? angle * ease(u / 1.8) : u < 3.2 ? angle : u < 6.7 ? pathPose(activeRoute, u, 0).angle : 0;
                    if (u < 2.3) location = track([[0, [start[0], start[1] - 20]], [1.8, kick], [2.3, kick]], u);
                    else if (u < 4.3) location = track([[2.3, kick], [2.9, goalTarget], [4.3, goalTarget]], u);
                    else { const lift = ease((u - 4.3) / .4); location = [mix(goalTarget[0], p[0] + 18, lift), mix(goalTarget[1], p[1], lift)]; }
                }
                body += footballer(p, facing, String(i + 1), i === active && u < 2.3 ? foot : '') + ball(location);
            }
            const react = u < 3 ? ease((u - 2.3) / .7) : 1 - ease((u - 4.8) / 1.4);
            keeper = [mix(450, goalTarget[0], react), 176];
            phase = u < 1.8 ? `${active + 1} conduce hasta el palo y prepara su pie ${foot === 'I' ? 'izquierdo' : 'derecho'}` : u < 2.3 ? 'Último toque al costado del palo, pie de apoyo y mirada al arco' : u < 3.2 ? `${active + 1} remata, las demás esperan con su pelota` : u < 4.3 ? 'La jugadora busca la pelota, la siguiente espera que quede libre' : 'Pelota recuperada, espera por fuera y queda listo el siguiente turno';
        }
        body += footballer(keeper, 180, 'ARQ') + notes('Un puesto por vez, cada una con su pelota, cambiá cuando todas hayan rematado');
        return { body, phase, view: `15 · DEFINICIÓN · PUESTO ${station + 1} DE 3 · ${spot.name.toUpperCase()}` };
    }
    function frame(view, body, phase, progress = '', mobility = false, category = '') {
        const e = Palometas.escapeHTML;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="${e(view + '. ' + phase)}" font-family="Arial,sans-serif"><rect width="900" height="580" rx="18" fill="#102c27"/><text x="32" y="37" fill="#99cbb6" font-size="14" letter-spacing="3">PALOMETAS · ${category || (mobility ? 'MOVILIDAD' : 'CIRCUITO DE PASES')}</text><text x="32" y="76" fill="#c8d9b8" font-size="18" letter-spacing="1">${e(view)}</text>${progress}${body}<rect x="22" y="519" width="856" height="43" rx="8" fill="#1c3d30"/><text x="450" y="546" text-anchor="middle" fill="#eff3e4" font-size="16">${e(phase)}</text></svg>`;
    }
    function render(id, t = 0, sequence = []) {
        t = Number.isFinite(t) ? Math.max(0, t) : 0;
        const mobility = id === 'movilidad', isFinishing = id === 'definicion-tres-palos';
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
        if (id === 'pases') { ({ body, phase } = basicPassing(t)); view = '9 · CONTROL Y PASE ANTES DEL CONO'; }
        else if (id === 'progresion') { ({ body, phase } = basicPassing(t, true)); view = '10 · PASE Y VUELTA AL CONO TRASERO'; }
        else if (id === 'ocho') { ({ body, phase } = figureEight(t)); view = '11 · OCHO DE CONTROL Y DESCARGA'; }
        else if (id === 'profundidad') { ({ body, phase } = deepPassing(t)); view = '12 · CONTROL PROFUNDO Y DEVOLUCIÓN RÁPIDA'; }
        else if (id === 'amague') { ({ body, phase } = fakeAndTouch(t)); view = '13 · AMAGUE, CONTROL Y APOYO TRASERO'; }
        else if (id === 'rotacion') { ({ body, phase } = rotatePositions(t)); view = '14 · INTERCAMBIO DE PUESTOS'; }
        else if (isFinishing) ({ body, phase, view } = finishing(t));
        else {
            const info = ['tobillo', 'sentadilla', 'zancada', 'talones'].includes(id) ? sidePose(id, t) : frontPose(id, t);
            body = `<ellipse cx="470" cy="469" rx="144" ry="12" fill="#0c241d"/><path d="M290 473 H670" stroke="#9dc2a9" stroke-width="2"/>${athlete(info.p, info.side)}`;
            phase = info.phase; view = info.side ? 'VISTA LATERAL' : 'VISTA DE FRENTE';
        }
        return frame(sequenceTitle || view, body, phase, progress, mobility, isFinishing ? 'DEFINICIÓN' : '');
    }
    return { render, setup };
})();
