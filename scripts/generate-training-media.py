"""Genera los esquemas y GIFs originales de la sesión, sin servicios externos.
Requiere Pillow y DejaVu Sans. Ejecutar desde cualquier directorio.
No ejecuta pruebas de la aplicación ni accede a datos del plantel.
"""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / 'images' / 'entrenamientos' / '2026-11-04'
OUT.mkdir(parents=True, exist_ok=True)
FONT_ROOT = Path('/usr/share/fonts/truetype/dejavu')
F = {size: ImageFont.truetype(str(FONT_ROOT / 'DejaVuSans.ttf'), size) for size in (13, 14, 15, 16, 17)}
B = {size: ImageFont.truetype(str(FONT_ROOT / 'DejaVuSans-Bold.ttf'), size) for size in (13, 15, 16, 18, 20, 25)}
RED, BLUE, WHITE, KEEPER, BALL = '#ce3158', '#318fd8', '#f2eee4', '#f4aa3b', '#ffe059'
W, H = 900, 600

def fixed(x, y): return [(0, (x, y)), (12, (x, y))]
def moving(*points): return list(points)
def player(label, color, points): return {'label': label, 'color': color, 'points': points}
def at(points, t):
    if t <= points[0][0]: return points[0][1]
    for (start, a), (end, b) in zip(points, points[1:]):
        if t <= end:
            ratio = (t - start) / (end - start)
            return a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio
    return points[-1][1]

SCENES = [
    dict(file='01-control-color', title='A · Control hacia el color',
         subtitle='Dos parejas · Dos carriles separados · 12 × 10 m', mode='color',
         phases=[(0, 'La pasadora nombra el color mientras viaja la pelota'), (3, 'Mirar y orientar el primer control hacia la puerta'), (7, 'Devolver un pase preciso y prepararse otra vez'), (10, 'Cambiar funciones cada 45–60 segundos')],
         players=[player('1', RED, fixed(.24, .82)), player('2', RED, moving((0, (.24, .2)), (3, (.24, .2)), (4.8, (.35, .35)), (8, (.35, .35)), (10, (.24, .2)), (12, (.24, .2)))),
                  player('3', RED, fixed(.76, .82)), player('4', RED, moving((0, (.76, .2)), (3, (.76, .2)), (4.8, (.65, .35)), (8, (.65, .35)), (10, (.76, .2)), (12, (.76, .2))))],
         balls=[moving((0, (.24, .82)), (1, (.24, .82)), (3, (.24, .2)), (4.8, (.35, .35)), (5.8, (.35, .35)), (7.5, (.24, .82)), (12, (.24, .82))),
                moving((0, (.76, .82)), (1, (.76, .82)), (3, (.76, .2)), (4.8, (.65, .35)), (5.8, (.65, .35)), (7.5, (.76, .82)), (12, (.76, .82)))],
         passes=[(1, 3, (.24, .82), (.24, .2)), (1, 3, (.76, .82), (.76, .2)), (5.8, 7.5, (.35, .35), (.24, .82)), (5.8, 7.5, (.65, .35), (.76, .82))]),
    dict(file='02-rondo-apoyos', title='B · Pasar y ofrecer otro apoyo',
         subtitle='3 contra 1 · Con tres jugadoras, adaptar a 2 contra 1', mode='rondo',
         phases=[(0, 'Abrir una línea de pase fuera de la sombra de la rival'), (3, 'Recibir de costado para ver otra opción'), (6, 'Después del pase, cambiar el ángulo de apoyo'), (10, 'Todas rotan por defensa; no es un castigo')],
         players=[player('1', RED, moving((0, (.18, .25)), (4, (.18, .25)), (7, (.2, .53)), (12, (.2, .53)))),
                  player('2', RED, fixed(.82, .28)), player('3', RED, fixed(.55, .8)),
                  player('D', BLUE, moving((0, (.45, .48)), (3, (.66, .45)), (6, (.6, .62)), (9, (.36, .6)), (12, (.36, .6))))],
         balls=[moving((0, (.18, .25)), (1, (.18, .25)), (2.5, (.82, .28)), (4, (.82, .28)), (5.5, (.55, .8)), (7, (.55, .8)), (8.5, (.2, .53)), (12, (.2, .53)))],
         passes=[(1, 2.5, (.18, .25), (.82, .28)), (4, 5.5, (.82, .28), (.55, .8)), (7, 8.5, (.55, .8), (.2, .53))]),
    dict(file='03-duelo-apoyos', title='C · 1 contra 1 con apoyo neutral',
         subtitle='Un apoyo por fuera · Con cuatro, agregar otro al lado opuesto', mode='duel',
         phases=[(0, 'La portadora elige: conducir o combinar'), (3, 'El apoyo neutral devuelve a quien tiene la pelota'), (6, 'Moverse para recibir por delante de la rival'), (9, 'Cruzar la puerta con control; al recuperar, invertir')],
         players=[player('1', RED, moving((0, (.4, .76)), (2, (.4, .67)), (3.5, (.4, .67)), (6, (.36, .27)), (8, (.36, .27)), (10.5, (.5, -.02)), (12, (.5, -.02)))),
                  player('D', BLUE, moving((0, (.52, .45)), (3, (.35, .48)), (6, (.28, .35)), (10, (.4, .14)), (12, (.4, .14)))),
                  player('C', WHITE, fixed(-.035, .46))],
         balls=[moving((0, (.4, .76)), (2, (.4, .67)), (3.5, (-.035, .46)), (4.5, (-.035, .46)), (6, (.36, .27)), (8, (.36, .27)), (10.5, (.5, -.02)), (12, (.5, -.02)))],
         passes=[(2, 3.5, (.4, .67), (-.035, .46)), (4.5, 6, (-.035, .46), (.36, .27))]),
    dict(file='04-salida-sin-arquera', title='Salida · Apoyo, cambio y progresión',
         subtitle='4 contra 4 + 2 comodines · Primera hora: sin arquera', mode='four-gates',
         phases=[(0, 'La jugadora del fondo inicia con los pies'), (3, 'La comodín ofrece apoyo interior'), (6, 'Si se cierra el lado, volver y cambiar la orientación'), (9, 'Avanzar por la puerta libre con control')],
         players=[player('1', RED, fixed(.25, .8)), player('2', RED, fixed(.75, .8)), player('3', RED, fixed(.15, .38)),
                  player('4', RED, moving((0, (.85, .38)), (8, (.85, .38)), (10.5, (.8, -.02)), (12, (.8, -.02)))),
                  player('1', BLUE, moving((0, (.28, .57)), (3, (.29, .66)), (7, (.41, .64)), (12, (.41, .64)))),
                  player('2', BLUE, moving((0, (.72, .57)), (5, (.63, .59)), (8, (.76, .47)), (12, (.76, .47)))),
                  player('3', BLUE, fixed(.35, .22)), player('4', BLUE, fixed(.65, .22)),
                  player('C1', WHITE, fixed(.43, .5)), player('C2', WHITE, fixed(.6, .36))],
         balls=[moving((0, (.25, .8)), (1, (.25, .8)), (2.5, (.43, .5)), (3.5, (.43, .5)), (5, (.75, .8)), (6, (.75, .8)), (8, (.85, .38)), (10.5, (.8, -.02)), (12, (.8, -.02)))],
         passes=[(1, 2.5, (.25, .8), (.43, .5)), (3.5, 5, (.43, .5), (.75, .8)), (6, 8, (.75, .8), (.85, .38))]),
    dict(file='05-salida-con-arquera', title='Desde las 20 · La arquera también apoya',
         subtitle='5 que construyen contra 5 que presionan + arquera', mode='build',
         phases=[(0, 'Arquera inicia; abrir dos lados y una línea interior'), (3, 'Recibir perfilada y ofrecer un pase de seguridad'), (6, 'Cambiar de lado cuando la presión se acerca'), (9, 'Salir con control por una puerta; luego reiniciar')],
         players=[player('A', KEEPER, fixed(.5, .94)), player('1', RED, fixed(.24, .74)), player('2', RED, fixed(.76, .74)),
                  player('3', RED, fixed(.5, .48)), player('4', RED, fixed(.13, .28)),
                  player('5', RED, moving((0, (.87, .28)), (8, (.87, .28)), (10.7, (.8, -.02)), (12, (.8, -.02)))),
                  player('1', BLUE, moving((0, (.34, .59)), (3, (.26, .61)), (6, (.43, .59)), (12, (.43, .59)))),
                  player('2', BLUE, moving((0, (.66, .59)), (5, (.59, .57)), (8, (.75, .6)), (12, (.75, .6)))),
                  player('3', BLUE, fixed(.43, .32)), player('4', BLUE, moving((0, (.73, .22)), (8, (.72, .24)), (11, (.74, .1)), (12, (.74, .1)))),
                  player('5', BLUE, fixed(.24, .18))],
         balls=[moving((0, (.5, .94)), (1, (.5, .94)), (2, (.24, .74)), (3, (.24, .74)), (4.3, (.5, .48)), (5, (.5, .48)), (6.3, (.76, .74)), (7, (.76, .74)), (8.4, (.87, .28)), (10.7, (.8, -.02)), (12, (.8, -.02)))],
         passes=[(1, 2, (.5, .94), (.24, .74)), (3, 4.3, (.24, .74), (.5, .48)), (5, 6.3, (.5, .48), (.76, .74)), (7, 8.4, (.76, .74), (.87, .28))]),
    dict(file='06-ataque-pase-atras', title='Ataque · Banda, llegadas y pase atrás',
         subtitle='4 contra 4 + 2 apoyos neutrales por fuera + arquera', mode='attack',
         phases=[(0, 'El apoyo de banda ofrece amplitud'), (3, 'Una al primer palo, otra al segundo, otra de frente'), (6, 'Pase atrás si está libre; si no, buscar otra opción'), (9, 'Remate y apoyo de seguridad detrás de la acción')],
         players=[player('1', RED, moving((0, (.5, .65)), (3, (.5, .65)), (7.8, (.49, .43)), (12, (.49, .43)))),
                  player('2', RED, moving((0, (.36, .28)), (3, (.36, .28)), (6, (.35, .13)), (12, (.35, .13)))),
                  player('3', RED, moving((0, (.67, .39)), (3, (.67, .39)), (6, (.67, .13)), (12, (.67, .13)))),
                  player('4', RED, fixed(.71, .82)),
                  player('1', BLUE, moving((0, (.27, .29)), (4, (.17, .3)), (6, (.09, .2)), (12, (.09, .2)))),
                  player('2', BLUE, moving((0, (.45, .2)), (6, (.4, .14)), (12, (.4, .14)))),
                  player('3', BLUE, moving((0, (.65, .2)), (6, (.64, .16)), (12, (.64, .16)))),
                  player('4', BLUE, moving((0, (.78, .44)), (6, (.72, .38)), (12, (.72, .38)))),
                  player('C1', WHITE, moving((0, (-.035, .48)), (2.5, (-.035, .48)), (5.5, (-.035, .18)), (12, (-.035, .18)))),
                  player('C2', WHITE, fixed(1.035, .48)),
                  player('A', KEEPER, moving((0, (.5, .065)), (6, (.43, .065)), (9, (.5, .065)), (12, (.5, .065))))],
         balls=[moving((0, (.5, .65)), (1, (.5, .65)), (2.5, (-.035, .48)), (5.5, (-.035, .18)), (6.3, (-.035, .18)), (7.8, (.49, .43)), (8.6, (.49, .43)), (10, (.53, -.02)), (12, (.53, -.02)))],
         passes=[(1, 2.5, (.5, .65), (-.035, .48)), (6.3, 7.8, (-.035, .18), (.49, .43)), (8.6, 10, (.49, .43), (.53, -.02))])
]

def arrow(draw, a, b, color, dashed=False, width=2):
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = math.hypot(dx, dy)
    if length < 5: return
    ux, uy = dx / length, dy / length
    if dashed:
        for start in range(0, int(length), 16):
            end = min(start + 8, length)
            draw.line((a[0] + ux * start, a[1] + uy * start, a[0] + ux * end, a[1] + uy * end), fill=color, width=width)
    else: draw.line((a, b), fill=color, width=width)
    draw.polygon([b, (b[0] - 10 * ux + 5 * uy, b[1] - 10 * uy - 5 * ux), (b[0] - 10 * ux - 5 * uy, b[1] - 10 * uy + 5 * ux)], fill=color)

def render(scene, t):
    im = Image.new('RGB', (W, H), '#102c27'); d = ImageDraw.Draw(im)
    d.text((32, 18), 'PALOMETAS · SUB 17', font=B[13], fill='#99cbb6')
    d.text((32, 45), scene['title'], font=B[25], fill='#fff9ee')
    d.text((32, 81), scene['subtitle'], font=F[15], fill='#c0d9cc')
    x, y, w, h = 100, 139, 700, 345
    def xy(p): return x + p[0] * w, y + p[1] * h
    d.rectangle((x, y, x + w, y + h), fill='#185442')
    for i in range(1, 8, 2): d.rectangle((x + 2, y + i * h / 8, x + w - 2, y + (i + 1) * h / 8), fill='#1d5d49')
    d.rectangle((x, y, x + w, y + h), outline='#cce5d8', width=2)
    def cone(cx, cy, color='#ffbd61'):
        d.polygon([(cx, cy - 8), (cx - 6, cy + 4), (cx + 6, cy + 4)], fill=color)
    def gates(top, positions=(.2, .8)):
        for pos in positions:
            for side in (-1, 1): cone(x + pos * w + side * 28, y if top else y + h)
    def goal(top):
        cy = y if top else y + h
        d.rectangle((x + w * .39, cy - 18 if top else cy, x + w * .61, cy if top else cy + 18), fill='#142b25', outline='#f6f1e6', width=3)
        py = cy + 62 if top else cy - 62
        d.line([(x + w * .25, cy), (x + w * .25, py), (x + w * .75, py), (x + w * .75, cy)], fill='#a9c7b5', width=1)
    for p in ((x, y), (x + w, y), (x, y + h), (x + w, y + h)): cone(*p)
    mode = scene['mode']
    if mode == 'duel': gates(True, (.5,)); gates(False, (.5,))
    if mode == 'four-gates': gates(True); gates(False)
    if mode == 'build': goal(False); gates(True)
    if mode == 'attack': goal(True); gates(False)
    if mode == 'color':
        d.line((x + w / 2, y, x + w / 2, y + h), fill='#9dc5ae', width=1)
        for cx, color in ((.13, BLUE), (.35, RED), (.65, BLUE), (.87, RED)):
            for offset in (-.045, .045): cone(*xy((cx + offset, .3)), color)
    for p in scene['players']:
        for (start, a), (end, b) in zip(p['points'], p['points'][1:]):
            if start <= t <= end and a != b: arrow(d, xy(a), xy(b), '#91bba4', True, 1)
    for start, end, a, b in scene.get('passes', []):
        if start - .3 <= t <= end + .4: arrow(d, xy(a), xy(b), '#fff9ee', True, 2)
    for p in scene['players']:
        cx, cy = xy(at(p['points'], t)); r = 16
        d.ellipse((cx - r + 1, cy - r + 3, cx + r + 1, cy + r + 3), fill='#0a2c26')
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=p['color'], outline='#fff9ee', width=2)
        d.text((cx, cy), p['label'], font=B[13], anchor='mm', fill='#16372d' if p['color'] == WHITE else '#fff')
    for points in scene['balls']:
        bx, by = xy(at(points, t)); bx += 11; by -= 10
        d.ellipse((bx - 6, by - 6, bx + 6, by + 6), fill=BALL, outline='#152a22', width=2)
    phase = scene['phases'][0][1]
    for start, label in scene['phases']:
        if t >= start: phase = label
    d.rounded_rectangle((24, 510, 876, 554), radius=8, fill='#1c3c30')
    d.text((40, 523), phase, font=B[16], fill='#f5f6e9')
    for cx, color, label in ((33, RED, 'Equipo'), (147, BLUE, 'Rival'), (246, WHITE, 'Neutral'), (367, KEEPER, 'Arquera'), (500, BALL, 'Pelota')):
        d.ellipse((cx, 574, cx + 9, 583), fill=color)
        d.text((cx + 15, 569), label, font=F[13], fill='#b9cebf')
    d.text((620, 569), 'Blanco: pase · Verde: carrera', font=F[13], fill='#b9cebf')
    return im

for scene in SCENES:
    frames = [render(scene, i / 8) for i in range(96)]
    palette = frames[0].quantize(colors=64, method=Image.Quantize.MEDIANCUT)
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    indexed[0].save(OUT / (scene['file'] + '.gif'), save_all=True, append_images=indexed[1:], duration=125, loop=0, optimize=True)
    frames[0].save(OUT / (scene['file'] + '.png'))
    print(scene['file'] + '.gif creado')

cover = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img" aria-label="Apoyos y ataque en el campo de Palometas"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#193f32"/><stop offset="1" stop-color="#0d211e"/></linearGradient><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#ffffff" stroke-opacity=".035"/></pattern><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10" fill="#d6e6c1"/></marker></defs><rect width="900" height="520" fill="url(#g)"/><rect width="900" height="520" fill="url(#grid)"/><g transform="translate(450 280) rotate(-8)"><rect x="-305" y="-163" width="610" height="326" rx="8" fill="#215b43" stroke="#9fc6ab" stroke-width="2"/><path d="M-305 0H305M0-163V163M-305-90H-220V90H-305M305-90H220V90H305" fill="none" stroke="#a4c9b0" stroke-opacity=".45"/><circle r="49" fill="none" stroke="#a4c9b0" stroke-opacity=".45"/><path d="M-210 105-50 35 110 105 218-90" fill="none" stroke="#e6edc9" stroke-width="3" stroke-dasharray="10 9" marker-end="url(#a)"/><path d="M205 25 218-75" fill="none" stroke="#91c4a9" stroke-width="2" marker-end="url(#a)"/><g fill="#cb3156" stroke="#fff6e9" stroke-width="3"><circle cx="-210" cy="105" r="21"/><circle cx="110" cy="105" r="21"/><circle cx="205" cy="25" r="21"/></g><circle cx="-50" cy="35" r="21" fill="#f2eee4" stroke="#fff6e9" stroke-width="3"/><g fill="#318fd8" stroke="#e2ebdf" stroke-width="3"><circle cx="-75" cy="-40" r="19"/><circle cx="85" cy="-55" r="19"/><circle cx="-165" cy="5" r="19"/></g><circle cx="-188" cy="90" r="8" fill="#ffe059" stroke="#1d382b" stroke-width="2"/></g><text x="40" y="482" fill="#c7dbba" font-family="Arial,sans-serif" font-size="17" letter-spacing="4">MIRAR · APOYAR · AVANZAR</text><circle cx="825" cy="66" r="28" fill="#78304a"/><text x="825" y="73" text-anchor="middle" fill="#fff1eb" font-family="Arial,sans-serif" font-size="21" font-weight="700">17</text></svg>'''
(OUT / 'portada.svg').write_text(cover)

def athlete(cx, cy, pose):
    # Figuras didácticas, esquemáticas; no sustituyen la demostración del entrenador.
    poses = {
        'ankle': ('M0-53 L-5-5 35 16 52 53 M-5-5-34 27-46 54', 'M-1-43-30-10-3-7 M0-43 27-13 11-6'),
        'hip': ('M0-53 L0-5-21 21 10 34 M0-5 18 20 20 56', 'M0-43-30-16-45-20 M0-43 29-24 42-42'),
        'balance': ('M0-53 L0-5-22 17-10 39 M0-5 15 20 16 56', 'M0-43-38-23 M0-43 36-24'),
        'brake': ('M0-53 L-13-5 9 16 25 53 M-13-5-42 19-59 50', 'M-4-43 22-30 39-46 M-4-43-34-18-51-24')
    }
    legs, arms = poses[pose]
    return f'<g transform="translate({cx} {cy})"><ellipse cx="0" cy="65" rx="72" ry="8" fill="#0e2c24"/><path d="M-2-101 Q-33-117-37-85 Q-19-94-10-84" fill="#242b28"/><circle cy="-78" r="18" fill="#deb48d"/><path d="{arms}" fill="none" stroke="#deb48d" stroke-width="12" stroke-linecap="round"/><path d="{legs}" fill="none" stroke="#d5ae88" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M0-52-4-7" stroke="#c83c61" stroke-width="36" stroke-linecap="round"/><path d="M-5-7-16 7 M-2-7 13 8" stroke="#213a32" stroke-width="24" stroke-linecap="round"/></g>'

parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 640" role="img" aria-label="Preparación progresiva: tobillo, cadera, equilibrio y frenada"><rect width="900" height="640" rx="18" fill="#102c27"/><text x="32" y="35" fill="#99cbb6" font-family="Arial,sans-serif" font-size="14" letter-spacing="3">PALOMETAS · ENTRADA EN CALOR</text><text x="32" y="76" fill="#fff9ee" font-family="Arial,sans-serif" font-size="28" font-weight="700">Preparar el movimiento, de menos a más</text>']
panels = [(26, 105, 'ankle', '01 · TOBILLO', 'Talón apoyado; avanzar sin forzar.'), (462, 105, 'hip', '02 · CADERA', 'Abrir y cerrar con control.'), (26, 365, 'balance', '03 · FUERZA Y EQUILIBRIO', 'Rodilla estable; rango cómodo.'), (462, 365, 'brake', '04 · PROGRESAR Y FRENAR', 'Pasos cortos al bajar la velocidad.')]
for x, y, pose, title, caption in panels:
    parts += [f'<rect x="{x}" y="{y}" width="412" height="245" rx="12" fill="#193d31" stroke="#7aa68b" stroke-opacity=".25"/><text x="{x + 18}" y="{y + 29}" fill="#c8d9b8" font-family="Arial,sans-serif" font-size="16" font-weight="700">{title}</text>', athlete(x + 207, y + 146, pose), f'<text x="{x + 206}" y="{y + 225}" text-anchor="middle" fill="#c0d9cc" font-family="Arial,sans-serif" font-size="16">{caption}</text>']
parts.append('</svg>')
(OUT / 'movilidad.svg').write_text(''.join(parts))
print('Portada y lámina de movilidad creadas')
