(function (root) {
    'use strict';
    const TIME_ZONE = 'America/Argentina/Buenos_Aires';
    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const isSub17 = record => ['sub17', 'u17'].includes(String(record?.category ?? '').toLowerCase().replace(/[\s_-]/g, ''));
    const nameOf = player => player.alias || player.full_name || 'Sin nombre';
    const pad = n => String(n).padStart(2, '0');
    function parseDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
        if (!match) return null;
        const [year, month, day] = match.slice(1).map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day ? { year, month, day } : null;
    }
    function todayISO(now = new Date()) {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
        const get = type => parts.find(part => part.type === type).value;
        return `${get('year')}-${get('month')}-${get('day')}`;
    }
    function birthdayInYear(birth, year) {
        const lastDay = new Date(Date.UTC(year, birth.month, 0)).getUTCDate();
        return `${year}-${pad(birth.month)}-${pad(Math.min(birth.day, lastDay))}`;
    }
    function nextBirthday(birthdate, today = todayISO()) {
        const birth = parseDate(birthdate), current = parseDate(today);
        if (!birth || !current) return null;
        let date = birthdayInYear(birth, current.year);
        if (date < today) date = birthdayInYear(birth, current.year + 1);
        return { date, days: Math.round((Date.parse(date + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86400000) };
    }
    function birthdays(players, now = new Date()) {
        const today = todayISO(now);
        return players.filter(isSub17).map(player => ({ ...player, birthday: nextBirthday(player.birthdate, today) }))
            .filter(player => player.birthday).sort((a, b) => a.birthday.days - b.birthday.days || nameOf(a).localeCompare(nameOf(b), 'es'));
    }
    function formatDate(date) {
        if (!parseDate(String(date ?? '').slice(0, 10))) return 'Fecha a confirmar';
        return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(date.slice(0, 10) + 'T12:00:00Z'));
    }
    const escapeICS = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
    function foldICS(line) {
        const lines = []; let current = '', bytes = 0;
        for (const char of line) {
            const length = new TextEncoder().encode(char).length;
            if (bytes + length > 75) { lines.push(current); current = ' '; bytes = 1; }
            current += char; bytes += length;
        }
        lines.push(current); return lines.join('\r\n');
    }
    function birthdayCalendar(players, now = new Date()) {
        const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
        const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Palometas//Sub17//ES', 'CALSCALE:GREGORIAN',
            'X-WR-CALNAME:Cumpleaños Palometas Sub 17', `X-WR-TIMEZONE:${TIME_ZONE}`,
            'BEGIN:VTIMEZONE', `TZID:${TIME_ZONE}`, 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:-0300', 'TZOFFSETTO:-0300', 'TZNAME:ART', 'END:STANDARD', 'END:VTIMEZONE'];
        for (const player of birthdays(players, now)) {
            const birth = parseDate(player.birthdate), date = player.birthday.date.replace(/-/g, '');
            const recurrence = birth.month === 2 && birth.day === 29 ? 'FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1' : 'FREQ=YEARLY';
            const uid = encodeURIComponent(player.id || `${nameOf(player)}-${player.birthdate}`);
            lines.push('BEGIN:VEVENT', `UID:sub17-cumple-${uid}@palometas.futbol-dt`, `DTSTAMP:${stamp}`,
                `DTSTART;TZID=${TIME_ZONE}:${date}T090000`, `DTEND;TZID=${TIME_ZONE}:${date}T091000`,
                `RRULE:${recurrence}`, `SUMMARY:${escapeICS('Cumpleaños de ' + nameOf(player))}`,
                'DESCRIPTION:Saludo de cumpleaños. Palometas Sub 17.', 'TRANSP:TRANSPARENT',
                'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${escapeICS('Saludar a ' + nameOf(player))}`, 'END:VALARM', 'END:VEVENT');
        }
        lines.push('END:VCALENDAR');
        return lines.map(foldICS).join('\r\n') + '\r\n';
    }
    function score(value) {
        if (value === '' || value === null || value === undefined) return null;
        if (!/^\d{1,2}$/.test(String(value))) throw new Error('Los goles deben ser números enteros entre 0 y 99.');
        return Number(value);
    }
    function matchPayload(values, scorers = []) {
        const rival = String(values.rival ?? '').trim();
        if (!rival) throw new Error('Ingresá el nombre del rival.');
        const dateOnly = values.date || '';
        if (dateOnly && !parseDate(dateOnly)) throw new Error('Revisá la fecha del partido.');
        if (values.time && (!dateOnly || !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time))) throw new Error('Para indicar un horario, completá también una fecha válida.');
        const own = score(values.score_local), rivalScore = score(values.score_rival);
        if ((own === null) !== (rivalScore === null)) throw new Error('Completá ambos resultados o dejá los dos vacíos.');
        const grouped = new Map();
        for (const row of scorers) {
            if (!row.player_id) continue;
            const goals = score(row.goals);
            if (!goals) throw new Error('Cada goleadora debe tener al menos un gol.');
            const previous = grouped.get(row.player_id);
            grouped.set(row.player_id, { player_id: row.player_id, name: String(row.name || 'Jugadora'), goals: (previous?.goals || 0) + goals });
        }
        const cleanScorers = [...grouped.values()];
        if (own !== null && cleanScorers.reduce((total, row) => total + row.goals, 0) > own) throw new Error('Las goleadoras suman más goles que el resultado de Palometas.');
        return { category: 'Sub17', rival, tournament: String(values.tournament || '').trim(), round: String(values.round || '').trim(),
            date: dateOnly ? dateOnly + (values.time ? `T${values.time}:00` : '') : null,
            condition: values.condition || '', location: String(values.location || '').trim(),
            score_local: own, score_rival: rivalScore, scorers: cleanScorers, observations: String(values.observations || '').trim() };
    }
    const isPlayed = match => Number.isInteger(match.score_local) && Number.isInteger(match.score_rival);
    function sortMatches(matches) {
        return [...matches].sort((a, b) => {
            if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
            if (a.date && !b.date) return -1;
            if (!a.date && b.date) return 1;
            return String(a.round || '').localeCompare(String(b.round || ''), 'es', { numeric: true }) || String(a.rival).localeCompare(String(b.rival), 'es');
        });
    }
    function imageURL(value) {
        const url = String(value || '').trim();
        if (/^data:image\/(?:gif|png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(url)) return url;
        if (/^(?:images\/|\.\/images\/)[^\s<>"']+$/i.test(url) && !url.includes('..')) return url;
        try { const parsed = new URL(url); return parsed.protocol === 'https:' ? parsed.href : ''; } catch { return ''; }
    }
    async function validateGif(file) {
        if (!file) throw new Error('Seleccioná un archivo GIF.');
        if (!/\.gif$/i.test(file.name) || file.size > 600 * 1024 || !file.size) throw new Error('Elegí un GIF de hasta 600 KB. Para archivos más grandes podés usar un enlace.');
        const header = new TextDecoder().decode(await file.slice(0, 6).arrayBuffer());
        if (!['GIF87a', 'GIF89a'].includes(header)) throw new Error('El archivo seleccionado no es un GIF válido.');
    }
    function download(content, type, filename) {
        const url = URL.createObjectURL(new Blob([content], { type }));
        const link = document.createElement('a'); link.href = url; link.download = filename;
        document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    const api = { TIME_ZONE, escapeHTML, isSub17, nameOf, parseDate, todayISO, nextBirthday, birthdays, formatDate, birthdayCalendar, matchPayload, isPlayed, sortMatches, imageURL, validateGif, download };
    root.Palometas = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
