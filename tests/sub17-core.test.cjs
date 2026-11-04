const { test } = require('node:test');
const assert = require('node:assert/strict');
const { File } = require('node:buffer');
const core = require('../js/sub17-core.js');

test('el plantel y la agenda excluyen otras categorías y aceptan variantes de Sub 17', () => {
    const players = [
        { id: 's', alias: 'Sub 17', category: 'Sub 17', birthdate: '2011-11-05' },
        { id: 'p', alias: 'Primera', category: '1ra', birthdate: '2004-11-05' },
        { id: 'j', alias: 'Sub 15', category: 'Sub15', birthdate: '2013-11-05' },
        { id: 'u', alias: 'U17', category: 'U-17', birthdate: '2011-12-01' },
        { id: 'x', alias: 'Sin fecha', category: 'Sub17' }
    ];
    assert.deepEqual(core.birthdays(players, new Date('2026-11-03T16:00:00Z')).map(p => p.id), ['s', 'u']);
    const calendar = core.birthdayCalendar(players, new Date('2026-11-03T16:00:00Z'));
    assert.ok(!calendar.includes('Primera') && !calendar.includes('Sub 15'));
});
test('el día se calcula en Argentina aunque el servidor ya esté en el día siguiente', () => {
    assert.equal(core.todayISO(new Date('2026-11-04T01:30:00Z')), '2026-11-03');
    assert.deepEqual(core.nextBirthday('2011-11-03', '2026-11-03'), { date: '2026-11-03', days: 0 });
});
test('cumpleaños pasados y cambio de año se ordenan por próxima ocurrencia', () => {
    assert.deepEqual(core.nextBirthday('2010-01-01', '2026-12-31'), { date: '2027-01-01', days: 1 });
    assert.equal(core.nextBirthday('2010-11-02', '2026-11-03').date, '2027-11-02');
    assert.equal(core.nextBirthday('2010-02-30', '2026-11-03'), null);
});
test('el 29 de febrero se recuerda el último día de febrero', () => {
    assert.equal(core.nextBirthday('2012-02-29', '2027-01-01').date, '2027-02-28');
    assert.equal(core.nextBirthday('2012-02-29', '2028-01-01').date, '2028-02-29');
    const calendar = core.birthdayCalendar([{ id: 'leap', alias: 'Ana', category: 'Sub17', birthdate: '2012-02-29' }], new Date('2027-01-01T15:00:00Z'));
    assert.ok(calendar.includes('RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1'));
});
test('ICS tiene identificación estable, duración positiva, zona horaria, recurrencia y alarma', () => {
    const players = [{ id: 'player-1', alias: 'Ana', category: 'Sub17', birthdate: '2010-11-03' }];
    const calendar = core.birthdayCalendar(players, new Date('2026-11-03T16:00:00Z'));
    assert.ok(calendar.includes('UID:sub17-cumple-player-1@palometas.futbol-dt\r\n'));
    assert.ok(calendar.includes('DTSTART;TZID=America/Argentina/Buenos_Aires:20261103T090000\r\n'));
    assert.ok(calendar.includes('DTEND;TZID=America/Argentina/Buenos_Aires:20261103T091000\r\n'));
    assert.ok(calendar.includes('RRULE:FREQ=YEARLY\r\n'));
    assert.ok(calendar.includes('ACTION:DISPLAY\r\nTRIGGER:PT0M\r\n'));
    assert.ok(calendar.includes('DTSTAMP:20261103T160000Z\r\n'));
    assert.ok(calendar.endsWith('END:VCALENDAR\r\n'));
});
test('nombres con tildes, comas, barras y saltos no rompen el archivo ICS', () => {
    const alias = 'Á'.repeat(100) + ', Ana; \\ apellido\nBEGIN:VEVENT';
    const calendar = core.birthdayCalendar([{ id: 'p', alias, category: 'Sub17', birthdate: '2011-01-02' }]);
    const unfolded = calendar.replace(/\r\n /g, '');
    assert.equal(unfolded.split('\r\n').filter(line => line === 'BEGIN:VEVENT').length, 1);
    assert.ok(unfolded.includes('\\, Ana\\; \\\\ apellido\\nBEGIN:VEVENT'));
    for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
});
test('un rival se puede guardar sin día, torneo, resultado ni goleadoras', () => {
    const match = core.matchPayload({ rival: 'Carteros' });
    assert.equal(match.category, 'Sub17'); assert.equal(match.date, null);
    assert.equal(match.score_local, null); assert.equal(match.score_rival, null);
    assert.deepEqual(match.scorers, []); assert.equal(core.isPlayed(match), false);
    assert.equal(core.isPlayed({ rival: 'Datos antiguos' }), false);
});
test('un empate 0 a 0 es un resultado válido y no se pierde al editar', () => {
    const match = core.matchPayload({ rival: 'Talleres', score_local: '0', score_rival: '0' });
    assert.equal(match.score_local, 0); assert.equal(match.score_rival, 0); assert.equal(core.isPlayed(match), true);
});
test('resultados parciales, negativos y fechas inválidas no se guardan', () => {
    assert.throws(() => core.matchPayload({ rival: 'Club', score_local: '1' }), /ambos resultados/);
    assert.throws(() => core.matchPayload({ rival: 'Club', score_local: '-1', score_rival: '0' }), /enteros/);
    assert.throws(() => core.matchPayload({ rival: 'Club', date: '2027-02-30' }), /fecha/);
    assert.throws(() => core.matchPayload({ rival: 'Club', time: '19:00' }), /fecha válida/);
    assert.throws(() => core.matchPayload({ rival: '  ' }), /rival/);
});
test('goleadoras pueden quedar incompletas o cargarse sin resultado, y se consolidan duplicados', () => {
    const rows = [{ player_id: 'a', name: 'Ana', goals: '1' }, { player_id: 'a', name: 'Ana', goals: '2' }];
    assert.deepEqual(core.matchPayload({ rival: 'Club' }, rows).scorers, [{ player_id: 'a', name: 'Ana', goals: 3 }]);
    assert.equal(core.matchPayload({ rival: 'Club', score_local: '4', score_rival: '1' }, rows).scorers[0].goals, 3);
    assert.throws(() => core.matchPayload({ rival: 'Club', score_local: '2', score_rival: '1' }, rows), /más goles/);
});
test('el fixture conserva fechas a confirmar y ordena números de fecha naturalmente', () => {
    const matches = [{ rival: 'B', round: '10' }, { rival: 'A', round: '2' }, { rival: 'C', date: '2027-03-07' }];
    assert.deepEqual(core.sortMatches(matches).map(m => m.rival), ['C', 'A', 'B']);
    assert.equal(core.formatDate('2027-03-07'), '07/03/2027');
    assert.equal(core.formatDate(null), 'Fecha a confirmar');
});
test('se bloquean enlaces de imagen ejecutables y texto con HTML', () => {
    assert.equal(core.imageURL('javascript:alert(1)'), '');
    assert.equal(core.imageURL('http://inseguro.test/a.gif'), '');
    assert.equal(core.imageURL('https://example.test/a.gif'), 'https://example.test/a.gif');
    assert.equal(core.escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});
test('la carga acepta GIF real y rechaza archivos falsos o demasiado grandes', async () => {
    await core.validateGif(new File(['GIF89a', 'demo'], 'jugada.gif', { type: 'image/gif' }));
    await assert.rejects(core.validateGif(new File(['<script>'], 'falso.gif')), /no es un GIF/);
    await assert.rejects(core.validateGif(new File(['GIF89a'], 'imagen.png')), /Elegí un GIF/);
    await assert.rejects(core.validateGif({ name: 'grande.gif', size: 600 * 1024 + 1 }), /hasta 600 KB/);
});
