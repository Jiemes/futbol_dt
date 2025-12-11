import os
from datetime import date
from pypdf import PdfReader

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as PDFImage
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image as PDFImage

# --- FUNCIONES AUXILIARES ---
def extract_text_from_pdf(file_path):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t: text += t + "\n"
        return text
    except: return ""

def calculate_age(born):
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

def get_player_stats(player):
    partidos = len([a for a in player.activities if a.tipo.value == 'Partido'])
    practicas = len([a for a in player.activities if a.tipo.value == 'Práctica'])
    goles = sum(a.goles for a in player.activities)
    return partidos, practicas, (partidos + practicas), goles

# --- PDF PLANIFICACIÓN (CON VALIDACIÓN DE IMAGEN) ---
def generate_session_pdf(session):
    filename = f"Plan_{session.fecha}_{session.titulo.replace(' ', '_')}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Encabezado
    titulo_texto = session.titulo if session.titulo else "Sin Título"
    
    # CORRECCIÓN: Usamos session.categoria
    cat_texto = session.categoria if session.categoria else "-"
    
    fecha_texto = str(session.fecha)
    
    title = Paragraph(f"<b>PLANIFICACIÓN: {titulo_texto}</b>", styles['Title'])
    sub = Paragraph(f"Fecha: {fecha_texto} | Equipo: {cat_texto}", styles['Heading2'])
    elements.append(title); elements.append(sub); elements.append(Spacer(1, 0.5*cm))
    
    if not session.exercises:
        elements.append(Paragraph("Sin ejercicios cargados.", styles['Normal']))
    
    total_min = 0
    for ex in session.exercises:
        ex_titulo = ex.titulo if ex.titulo else "Ejercicio"
        ex_cat = ex.categoria.value if ex.categoria else "General"
        ex_min = ex.tiempo_minutos if ex.tiempo_minutos else 0
        ex_mat = ex.materiales if ex.materiales else "Ninguno"
        ex_desc = ex.descripcion if ex.descripcion else ""
        
        elements.append(Paragraph(f"<b>• {ex_titulo}</b> ({ex_cat})", styles['Heading3']))
        detalles = f"<b>Tiempo:</b> {ex_min}' | <b>Materiales:</b> {ex_mat}"
        elements.append(Paragraph(detalles, styles['Normal']))
        elements.append(Spacer(1, 0.2*cm))
        
        if ex_desc:
            elements.append(Paragraph(f"<i>{ex_desc}</i>", styles['Normal']))
            elements.append(Spacer(1, 0.3*cm))
        
        # IMAGEN (Validación Robusta)
        if ex.foto_path and isinstance(ex.foto_path, str) and os.path.exists(ex.foto_path):
            try:
                # Ignoramos GIFs en PDF para evitar error, solo JPG/PNG
                if ex.foto_path.lower().endswith(('.jpg', '.jpeg', '.png')):
                    img = PDFImage(ex.foto_path, width=10*cm, height=6*cm, kind='proportional')
                    elements.append(img)
                    elements.append(Spacer(1, 0.5*cm))
                else:
                    elements.append(Paragraph("[Ver video/GIF en App]", styles['Normal']))
            except: pass 
        
        elements.append(Paragraph("_"*60, styles['Normal']))
        elements.append(Spacer(1, 0.5*cm))
        total_min += ex_min

    elements.append(Paragraph(f"<b>TIEMPO TOTAL ESTIMADO: {total_min} MINUTOS</b>", styles['Heading2']))
    
    try: doc.build(elements); return filename
    except Exception as e: return f"Error PDF: {e}"

# --- 2. LISTADO PLANTEL (IGUAL QUE ANTES) ---
def generate_team_list_pdf(category_name, players):
    filename = f"Plantel_{category_name.replace(' ', '_')}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    title = Paragraph(f"<b>PALOMETAS FC - {category_name}</b>", styles['Title'])
    subtitle = Paragraph(f"Reporte de Asistencia - {date.today().strftime('%d/%m/%Y')}", styles['Heading2'])
    elements.append(title); elements.append(subtitle); elements.append(Spacer(1, 0.5 * cm))

    data = [['Jugadora', 'Pos.', 'Edad', 'PJ', 'PE', 'Total', 'Goles']]
    player_data = []
    for p in players:
        pj, pe, total, goles = get_player_stats(p)
        player_data.append({'obj': p, 'pj': pj, 'pe': pe, 'total': total, 'goles': goles})
    
    sorted_data = sorted(player_data, key=lambda x: x['total'], reverse=True)
    
    for d in sorted_data:
        p = d['obj']
        edad = calculate_age(p.fecha_nacimiento)
        pos = p.posicion_principal.value
        if "Izquierda" in pos: pos = pos.replace("Izquierda", "Izq.")
        if "Derecha" in pos: pos = pos.replace("Derecha", "Der.")
        if "Central" in pos: pos = pos.replace("Central", "Cent.")
        row = [f"{p.nombre_completo}", pos, str(edad), str(d['pj']), str(d['pe']), str(d['total']), str(d['goles'])]
        data.append(row)

    col_widths = [7*cm, 4*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 2*cm]
    table = Table(data, colWidths=col_widths)
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkred),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (1, -1), 'LEFT'),
        ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ])
    for i in range(1, len(data)):
        bg_color = colors.whitesmoke if i % 2 == 0 else colors.white
        style.add('BACKGROUND', (0, i), (-1, i), bg_color)
    table.setStyle(style); elements.append(table)
    try: doc.build(elements); return filename
    except Exception as e: return f"Error: {e}"

# --- 3. FICHA INDIVIDUAL (IGUAL QUE ANTES) ---
def generate_player_stats_pdf(player, activities):
    filename = f"Ficha_{player.nombre_completo.replace(' ', '_')}.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    w, h = A4
    c.setFillColorRGB(0.55, 0, 0); c.rect(0, h-80, w, 80, fill=1)
    c.setFillColorRGB(1, 1, 1); c.setFont("Helvetica-Bold", 20)
    c.drawString(30, h-50, f"PALOMETAS FC - {player.categoria_actual.value}")
    
    c.setFillColorRGB(0, 0, 0); c.setFont("Helvetica", 12)
    y = h - 120
    c.drawString(30, y, f"Jugadora: {player.nombre_completo} ({player.apodo or '-'})")
    c.drawString(350, y, f"DNI: {player.dni}")
    y -= 25
    c.drawString(30, y, f"Posición: {player.posicion_principal.value}")
    y -= 25
    c.drawString(30, y, f"Tel: {player.telefono_personal or '-'}")
    y -= 25
    c.drawString(30, y, f"Salud: {player.estado_salud_actual}")
    
    pj, pe, total, total_goles = get_player_stats(player)
    y -= 50; c.setFont("Helvetica-Bold", 14); c.setFillColorRGB(0.55, 0, 0)
    c.drawString(30, y, "Estadísticas"); y -= 30; c.setFillColorRGB(0, 0, 0); c.setFont("Helvetica", 12)
    c.drawString(30, y, f"Partidos: {pj}  |  Prácticas: {pe}  |  Goles: {total_goles}")
    c.save()
    return filename