/* Los repartos se calculan en el dispositivo, sin modificar el plantel. */
window.TrainingLineups = (() => {
    const role = (code, label, prefer, point) => ({ code, label, prefer, point });
    function family(position) {
        const text = String(position || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (/arquera|portera|guardameta/.test(text)) return 'keeper';
        if (/lateral|carriler/.test(text)) return 'wide';
        if (/extrem|wing/.test(text)) return 'wing';
        if (/medio|volante|mediocamp|enganche|pivote/.test(text)) return 'mid';
        if (/delant|atacan|punta|nueve/.test(text)) return 'front';
        if (/defens|central|zague|stopper/.test(text)) return 'back';
        return 'any';
    }
    const isKeeper = player => family(player.position) === 'keeper';
    const name = player => Palometas.nameOf(player);
    const capacities = n => TrainingBoards.groups(n);
    function definitions(type, n) {
        if (type === 'stations') return capacities(n).map((count, i) => ({
            id: 'station-' + i, title: 'Grupo ' + (i + 1) + ' · empieza en ' + 'ABC'[i], team: ['red', 'blue', 'neutral'][i],
            slots: [role('DEF', 'Defensora o lateral', ['back', 'wide']), role('MC', 'Mediocampista', ['mid']), role('AT', 'Delantera o extrema', ['front', 'wing']), role('BAN', 'Jugadora de banda', ['wide', 'wing', 'mid'])].slice(0, count),
            note: 'Mantené este grupo y rotalo por las tres estaciones. Adentro del ejercicio, cambiá las funciones.'
        }));
        if (type === 'warmup' || type === 'circuit') {
            const sizes = Array(Math.floor(n / 2)).fill(2);
            if (n % 2) sizes[sizes.length - 1] = 3;
            return sizes.map((size, i) => ({ id: 'pair-' + i, title: size === 3 ? 'Trío de pases' : 'Pareja ' + (i + 1), team: 'red',
                slots: [role('1', 'Primera pasadora', i % 2 ? ['wide', 'wing'] : ['back', 'wide']), role('2', 'Receptora', i % 2 ? ['front', 'mid'] : ['mid', 'front']), role('3', 'Tercer apoyo', ['any'])].slice(0, size),
                note: 'Mantené este grupo en todas las variantes. En el trío, rotá después de dos secuencias completas.' }));
        }
        if (type === 'finishing') return [{ id: 'finishing-queue', title: 'Fila de definición · todas juntas', team: 'red', slots: Array.from({ length: n }, (_, i) => role(String(i + 1), 'Turno ' + (i + 1), ['any'])), note: 'Una pelota por chica. Mantené este orden y cambiá de puesto cuando todas terminen.' }];
        if (type === 'cooldown') return [];
        const d = TrainingBoards.distribution(type, n);
        let red, blue, neutral = [];
        if (type === 'build-gk') {
            red = [role('C1', 'Central izquierda', ['back'], [.24, .74]), role('C2', 'Central derecha', ['back'], [.76, .74]), role('MC', 'Mediocampista de apoyo', ['mid'], [.5, .48]), role('LI', 'Lateral izquierda', ['wide', 'wing'], [.13, .28]), role('LD', 'Lateral derecha', ['wide', 'wing'], [.87, .28]), role('MP', 'Apoyo adelantado', ['mid', 'front'], [.44, .17])].slice(0, d.red);
            blue = [role('DC', 'Delantera que orienta la presión', ['front'], [.5, .63]), role('EI', 'Presión por izquierda', ['wing', 'wide'], [.24, .53]), role('ED', 'Presión por derecha', ['wing', 'wide'], [.76, .53]), role('M1', 'Cierre interior izquierdo', ['mid'], [.36, .27]), role('M2', 'Cierre interior derecho', ['mid', 'back'], [.64, .27]), role('AP', 'Cobertura de la presión', ['back', 'mid'], [.51, .15])].slice(0, d.blue);
        } else if (type === 'attack') {
            red = [role('MC', 'Llegada de frente al pase atrás', ['mid'], [.5, .62]), role('DC', 'Delantera al primer palo', ['front'], [.36, .27]), role('EX', 'Extrema al segundo palo', ['wing', 'front'], [.67, .36]), role('SEG', 'Apoyo de seguridad', ['mid', 'back'], [.71, .82]), role('INT', 'Segunda llegada interior', ['mid', 'wing'], [.24, .61])].slice(0, d.red);
            blue = d.blue === 3 ? [role('C1', 'Central izquierda', ['back'], [.35, .2]), role('C2', 'Central derecha', ['back'], [.65, .2]), role('MC', 'Cobertura delante de las centrales', ['mid', 'wide'], [.51, .4])] : [role('C1', 'Central izquierda', ['back'], [.43, .18]), role('C2', 'Central derecha', ['back'], [.64, .18]), role('LI', 'Defensa por izquierda', ['wide', 'wing'], [.2, .32]), role('LD', 'Defensa por derecha', ['wide', 'wing'], [.8, .32]), role('MC', 'Cobertura interior', ['mid'], [.51, .4])].slice(0, d.blue);
            neutral = [role('AI', 'Apoyo por la banda izquierda', ['wide', 'wing'], [-.035, .48]), role('AD', 'Apoyo por la banda derecha', ['wide', 'wing'], [1.035, .48])];
        } else {
            const base = count => count === 4 ? [role('C', 'Central y primer pase', ['back']), role('L', 'Lateral que da amplitud', ['wide', 'wing']), role('MC', 'Mediocampista interior', ['mid']), role('DC', 'Delantera y profundidad', ['front', 'wing'])] : [role('C1', 'Central izquierda', ['back']), ...(count === 6 ? [role('C2', 'Central derecha', ['back'])] : []), role('LI', 'Lateral izquierda', ['wide', 'wing']), role('LD', 'Lateral derecha', ['wide', 'wing']), role('MC', 'Mediocampista interior', ['mid']), role('DC', 'Delantera y profundidad', ['front', 'wing'])];
            red = base(d.red); blue = base(d.blue);
            const points = d.red === 4 ? [[.32, .8], [.13, .49], [.52, .6], [.69, .3]] : d.red === 5 ? [[.5, .8], [.13, .5], [.86, .5], [.48, .6], [.65, .24]] : [[.3, .8], [.7, .8], [.13, .5], [.86, .5], [.48, .6], [.65, .24]];
            red.forEach((slot, i) => { slot.point = points[i]; });
            blue.forEach((slot, i) => { slot.point = [1 - points[i][0], 1 - points[i][1]]; });
            neutral = Array.from({ length: d.neutral }, (_, i) => role(d.neutral === 1 ? 'AP' : 'A' + (i + 1), 'Comodín interior', ['mid', 'wing'], d.neutral === 1 ? [.5, .43] : i ? [.77, .68] : [.23, .32]));
        }
        return [
            { id: 'red', title: type === 'build-gk' ? 'Equipo rojo · construye con la arquera' : 'Equipo rojo · ataca el arco o las puertas de enfrente', team: 'red', slots: red },
            { id: 'blue', title: type === 'build-gk' ? 'Equipo azul · presiona la salida' : 'Equipo azul · recupera y sale por las puertas', team: 'blue', slots: blue },
            ...(neutral.length ? [{ id: 'neutral', title: type === 'attack' ? 'Apoyos de banda · ayudan a quien tiene la pelota' : 'Comodines · ayudan a quien tiene la pelota', team: 'neutral', slots: neutral }] : [])
        ];
    }
    function score(player, slot) {
        const main = family(player.position), second = family(player.second_position);
        if (slot.prefer.includes(main)) return 100 - slot.prefer.indexOf(main) * 4;
        if (slot.prefer.includes(second) && second !== 'any') return 65 - slot.prefer.indexOf(second) * 4;
        if ((main === 'wide' && slot.prefer.includes('wing')) || (main === 'wing' && slot.prefer.includes('wide'))) return 40;
        return slot.prefer.includes('any') ? 5 : 0;
    }
    function create(type, n, players = [], keeper = null) {
        const groups = definitions(type, n), slots = groups.flatMap(group => group.slots);
        // Máxima afinidad total, primero posición habitual y después alternativa.
        if (players.length === slots.length && players.length <= 12 && slots.length) {
            const memo = new Map(), choices = new Map();
            function best(mask, index) {
                if (index === slots.length) return 0;
                if (memo.has(mask)) return memo.get(mask);
                let value = -Infinity, chosen = -1;
                players.forEach((player, p) => {
                    if (mask & (1 << p)) return;
                    const candidate = score(player, slots[index]) + best(mask | (1 << p), index + 1);
                    if (candidate > value) { value = candidate; chosen = p; }
                });
                memo.set(mask, value); choices.set(mask, chosen); return value;
            }
            best(0, 0); let mask = 0;
            slots.forEach(slot => { const index = choices.get(mask); slot.player = players[index]; slot.adapted = score(slot.player, slot) < 40; mask |= (1 << index); });
        }
        const withKeeper = ['build-gk', 'attack', 'game', 'finishing'].includes(type);
        return { groups, keeper: withKeeper ? { code: 'ARQ', label: 'Arquera, desde las 20', player: keeper, point: type === 'build-gk' ? [.5, .94] : [.5, .065] } : null, named: players.length === n };
    }
    return { family, isKeeper, name, create };
})();
