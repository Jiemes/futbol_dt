import os
from datetime import date
from pypdf import PdfReader

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as PDFImage
from reportlab.pdfgen import canvas

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

# --- PDF PLANIFICACIÓN (DISEÑO MEJORADO) ---
def generate_session_pdf(session):
    # Nombre de archivo seguro
    clean_title = "".join([c for c in session.titulo if c.isalnum() or c in (' ', '_')]).rstrip()
    filename = f"Sesion_{session.fecha}_{clean_title.replace(' ', '_')}.pdf"
    
    # Aseguramos que la carpeta existe (por si acaso se guarda en subcarpeta, aunque aquí es raíz)
    doc = SimpleDocTemplate(
        filename, 
        pagesize=A4, 
        rightMargin=1.5*cm, 
        leftMargin=1.5*cm, 
        topMargin=1.5*cm, 
        bottomMargin=1.5*cm
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Estilo Título Principal
    text_color = colors.Color(0.55, 0, 0) # El rojo de Palometas
    style_tit = ParagraphStyle(
        'MainTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=text_color,
        spaceAfter=10,
        alignment=1 # Centrado
    )
    
    style_sub = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.grey,
        alignment=1,
        spaceAfter=20
    )

    # 1. LOGO DEL CLUB
    if os.path.exists('logo.png'):
        try:
            logo = PDFImage('logo.png', width=2.5*cm, height=2.5*cm)
            elements.append(logo)
        except Exception as e:
            print(f"Error logo: {e}")

    # 2. CABECERA
    elements.append(Paragraph(f"<b>{session.titulo.upper()}</b>", style_tit))
    fecha_fmt = session.fecha.strftime('%d/%m/%Y') if hasattr(session.fecha, 'strftime') else str(session.fecha)
    elements.append(Paragraph(f"Categoría: {session.categoria}  |  Fecha: {fecha_fmt}", style_sub))
    
    if not session.exercises:
        elements.append(Spacer(1, 2*cm))
        elements.append(Paragraph("<i>Esta sesión no contiene ejercicios registrados.</i>", styles['Normal']))
    
    temp_files = []
    total_min = 0
    
    # 3. EJERCICIOS
    for i, ex in enumerate(session.exercises):
        elements.append(Spacer(1, 0.5*cm))
        # Línea divisoria
        elements.append(Paragraph("<hr width='100%' color='maroon' thickness='1'/>", styles['Normal']))
        elements.append(Spacer(1, 0.3*cm))
        
        # Título del ejercicio
        elements.append(Paragraph(f"<b>{i+1}. {ex.titulo.upper()}</b>", styles['Heading3']))
        
        # Ficha Técnica
        obj = ex.objetivo_principal.value if hasattr(ex.objetivo_principal, 'value') else str(ex.objetivo_principal)
        intense = ex.intensidad_carga.value if hasattr(ex.intensidad_carga, 'value') else str(ex.intensidad_carga)
        
        elements.append(Paragraph(
            f"<b>Objetivo:</b> {obj}  |  <b>Tiempo:</b> {ex.tiempo_minutos} min  |  <b>Intensidad:</b> {intense}",
            styles['Normal']
        ))
        
        if ex.descripcion:
            elements.append(Spacer(1, 0.2*cm))
            elements.append(Paragraph(f"<b>Descripción:</b> {ex.descripcion}", styles['Normal']))
            
        if ex.materiales:
            elements.append(Spacer(1, 0.1*cm))
            elements.append(Paragraph(f"<b>Materiales:</b> {ex.materiales}", styles['Normal']))

        # IMAGEN / GIF
        if ex.foto_path and os.path.exists(ex.foto_path):
            try:
                from PIL import Image as PIL_Img
                img_path = ex.foto_path
                
                if ex.foto_path.lower().endswith('.gif'):
                    with PIL_Img.open(ex.foto_path) as pimg:
                        t_name = f"tmp_ex_{i}_{session.id}.png"
                        pimg.seek(0)
                        pimg.convert("RGB").save(t_name)
                        img_path = t_name
                        temp_files.append(t_name)
                
                # Imagen escalada
                pdf_img = PDFImage(img_path, width=15*cm, height=9*cm, kind='proportional')
                pdf_img.hAlign = 'CENTER'
                elements.append(Spacer(1, 0.5*cm))
                elements.append(pdf_img)
            except Exception as e:
                print(f"Error imagen {i}: {e}")
                elements.append(Paragraph(f"<i>[Imagen: {os.path.basename(ex.foto_path)}]</i>", styles['Normal']))

        total_min += (ex.tiempo_minutos or 0)

    # 4. CIERRE
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph("<hr width='100%' color='black' thickness='2'/>", styles['Normal']))
    
    style_resumen = ParagraphStyle('Resumen', parent=styles['Normal'], fontSize=14, alignment=2, textColor=text_color)
    elements.append(Paragraph(f"<b>DURACIÓN TOTAL ESTIMADA: {total_min} MINUTOS</b>", style_resumen))

    try:
        # CONSTRUIR PDF
        doc.build(elements)
        
        # Verificación de que el archivo se creó y tiene tamaño
        if os.path.exists(filename) and os.path.getsize(filename) > 0:
            # Borrar temporales solo si tuvo éxito
            for f in temp_files:
                try: os.remove(f)
                except: pass
            return filename
        else:
            return "Error: El PDF se generó pero está vacío."
    except Exception as e:
        import traceback
        error_msg = f"Error al construir PDF: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return f"Error: {str(e)}"

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

# --- 4. EXPORTAR FORMACIÓN TÁCTICA ---
def generate_formation_pdf(formation):
    filename = f"Tactico_{formation.fecha_partido}_{formation.rival.replace(' ', '_')}.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    w, h = A4
    
    # Encabezado Premium
    c.setFillColorRGB(0.55, 0, 0)
    c.rect(0, h-100, w, 100, fill=1)
    
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 22)
    # Logo del club
    if os.path.exists('logo.png'):
        c.drawImage('logo.png', 30, h-85, width=70, height=70, mask='auto')
    
    c.drawCentredString(w/2, h-45, f"ESTRATEGIA - {formation.categoria.upper()}")
    c.setFont("Helvetica", 14)
    c.drawCentredString(w/2, h-75, f"vs {formation.rival} | Fecha: {formation.fecha_partido}")
    
    # Dibujo del Campo (Vertical)
    # Centrado en la página
    fw, fh = 400, 550 # Medidas del dibujo
    fx = (w - fw) / 2
    fy = 50
    
    c.setStrokeColorRGB(0.2, 0.4, 0.2)
    c.setFillColorRGB(0.3, 0.6, 0.3)
    c.rect(fx, fy, fw, fh, fill=1)
    
    c.setStrokeColor(colors.white)
    c.setLineWidth(2)
    # Perímetro
    c.rect(fx+10, fy+10, fw-20, fh-20)
    # Mitad
    c.line(fx+10, fy+fh/2, fx+fw-10, fy+fh/2)
    # Círculo Central
    c.circle(fx+fw/2, fy+fh/2, 40)
    
    # Áreas
    c.rect(fx+fw/2-80, fy+fh-110, 160, 100) # Arriba
    c.rect(fx+fw/2-80, fy+10, 160, 100)       # Abajo

    # 5. DIBUJOS TÁCTICOS (Líneas y Flechas)
    dibujos = getattr(formation, 'dibujos', []) or []
    c.setStrokeColor(colors.yellow)
    c.setLineWidth(1.5)
    for d in dibujos:
        pts = d.get('points', [])
        if len(pts) < 4: continue
        abs_pts = []
        for i in range(0, len(pts), 2):
            abs_pts.append(fx + (pts[i] * fw))
            abs_pts.append(fy + (pts[i+1] * fh))
            
        # Dibujar trazo
        p_path = c.beginPath()
        p_path.moveTo(abs_pts[0], abs_pts[1])
        for i in range(2, len(abs_pts), 2):
            p_path.lineTo(abs_pts[i], abs_pts[i+1])
        c.drawPath(p_path)
        
        # Puntas de flecha
        if d.get('type') == 'arrow':
            import math
            x1, y1, x2, y2 = abs_pts[-4], abs_pts[-3], abs_pts[-2], abs_pts[-1]
            angle = math.atan2(y2 - y1, x2 - x1)
            k = 10
            c.line(x2, y2, x2 - k * math.cos(angle - math.pi/6), y2 - k * math.sin(angle - math.pi/6))
            c.line(x2, y2, x2 - k * math.cos(angle + math.pi/6), y2 - k * math.sin(angle + math.pi/6))

    # 6. JUGADORAS (Imagen de Camiseta Personalizada)
    data = formation.data_posiciones if formation.data_posiciones else []
    for p in data:
        px = fx + (p['x_rel'] * fw)
        py = fy + (p['y_rel'] * fh)
        
        # Camiseta Personalizada
        if os.path.exists('camiseta.png'):
            c.drawImage('camiseta.png', px-15, py-15, width=30, height=30, mask='auto')
        else:
            # Fallback por si no existe
            c.setStrokeColor(colors.white)
            c.setFillColorRGB(0.5, 0, 0)
            c.rect(px-10, py-12, 20, 24, fill=1)
        
        # Apodo en Blanco
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 7)
        name = p.get('nickname', '??')
        c.drawCentredString(px, py+3, name) # Un poco más arriba para que de en el pecho

    # Suplentes
    if hasattr(formation, 'suplentes') and formation.suplentes:
        c.setFillColorRGB(0.55, 0, 0)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(fx, fy - 25, "SUPLENTES:")
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 10)
        txt = str(formation.suplentes).replace('\n', ', ')
        c.drawString(fx + 85, fy - 25, txt)

    c.save()
    return filename