from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import os

def generate_player_pdf(player, activities):
    """Genera un PDF con la ficha técnica y estadísticas de la jugadora."""
    filename = f"Ficha_{player.nombre_completo.replace(' ', '_')}.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
    # Encabezado (Bordó)
    c.setFillColorRGB(0.55, 0, 0)
    c.rect(0, height - 100, width, 100, fill=1)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 60, f"PALOMETAS FC - {player.categoria_actual.value}")
    
    # Datos Personales
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 140, f"Ficha Técnica: {player.nombre_completo}")
    
    c.setFont("Helvetica", 12)
    y = height - 170
    c.drawString(50, y, f"Apodo: {player.apodo or '-'}")
    c.drawString(300, y, f"DNI: {player.dni}")
    y -= 20
    c.drawString(50, y, f"Posición: {player.posicion_principal.value}")
    c.drawString(300, y, f"Pos. Alt: {player.posicion_secundaria.value if player.posicion_secundaria else '-'}")
    y -= 20
    c.drawString(50, y, f"Altura: {player.altura_cm} cm")
    c.drawString(300, y, f"Peso: {player.peso_kg} kg")
    y -= 20
    c.drawString(50, y, f"Salud: {player.estado_salud_actual}")
    
    # Estadísticas Totales
    y -= 40
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Estadísticas de Temporada")
    y -= 25
    c.setFont("Helvetica", 12)
    
    total_min = sum([a.minutos_jugados for a in activities if a.tipo.value == 'Partido'])
    total_goals = sum([a.goles for a in activities])
    practicas = len([a for a in activities if a.tipo.value == 'Práctica'])
    
    c.drawString(50, y, f"Minutos Jugados: {total_min}")
    c.drawString(200, y, f"Goles: {total_goals}")
    c.drawString(350, y, f"Asistencias a Prácticas: {practicas}")

    # Tabla de Últimos Eventos
    y -= 40
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Historial Reciente (Últimos 10 eventos)")
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(50, y, "Fecha       | Tipo      | Rival/Obs       | Min | Goles")
    y -= 5
    c.line(50, y, 500, y)
    y -= 15
    
    for act in sorted(activities, key=lambda x: x.fecha, reverse=True)[:15]:
        line = f"{act.fecha} | {act.tipo.value[:8]} | {act.rival_u_observacion[:15] if act.rival_u_observacion else '-'} | {act.minutos_jugados} | {act.goles}"
        c.drawString(50, y, line)
        y -= 15
        if y < 50:
            c.showPage()
            y = height - 50

    c.save()
    return filename