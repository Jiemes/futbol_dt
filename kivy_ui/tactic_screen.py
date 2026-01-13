import os
import io
import json
import math
from datetime import date
from kivy.uix.widget import Widget
from kivy.graphics import Color, Ellipse, Line, Rectangle, InstructionGroup, Mesh
from kivy.uix.anchorlayout import AnchorLayout
from kivy.uix.behaviors import DragBehavior
from kivy.core.window import Window
from kivy.clock import Clock
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.label import MDLabel
from kivymd.uix.button import MDButton, MDButtonText, MDIconButton
from kivymd.uix.textfield import MDTextField, MDTextFieldHintText
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.dialog import MDDialog, MDDialogHeadlineText, MDDialogButtonContainer, MDDialogContentContainer
from kivymd.uix.list import MDListItem, MDListItemHeadlineText, MDListItemSupportingText
from kivymd.uix.snackbar import MDSnackbar, MDSnackbarText
from kivymd.app import MDApp
from database.db_setup import SessionLocal
from utils import crud
from models.player import Category
from models.formation import Formation
from utils.pdf_utils import generate_formation_pdf

# --- WIDGET PARA LA JUGADORA (CON IMAGEN DE CAMISETA PERSONALIZADA) ---
class BoardPlayer(DragBehavior, Widget):
    def __init__(self, nickname, player_id, **kwargs):
        super().__init__(**kwargs)
        self.nickname = nickname
        self.player_id = player_id
        self.size_hint = (None, None)
        self.size = (100, 100)
        
        with self.canvas:
            Color(1, 1, 1, 1)
            self.img_rect = Rectangle(
                source='camiseta.png',
                pos=(self.x + 5, self.y + 5), 
                size=(90, 90)
            )
        
        self.label = MDLabel(
            text=self.nickname,
            halign="center",
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            font_style="Label",
            role="medium",
            bold=True,
            size=(90, 25),
            pos=(self.x + 5, self.y + 55)
        )
        self.add_widget(self.label)

    def on_pos(self, *args):
        if hasattr(self, 'img_rect'):
            self.img_rect.pos = (self.x + 5, self.y + 5)
        if hasattr(self, 'label'):
            self.label.pos = (self.x + 5, self.y + 55)
        self.drag_rect_x, self.drag_rect_y = self.x, self.y

# --- WIDGET PARA EL CONTRINCANTE ---
class OpponentMarker(DragBehavior, Widget):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint = (None, None)
        self.size = (50, 50)
        with self.canvas:
            Color(0.1, 0.1, 0.8, 1)
            self.ellipse = Ellipse(pos=self.pos, size=self.size)
            Color(1, 1, 1, 1)
            self.line = Line(circle=(self.center_x, self.center_y, 25), width=1.5)

    def on_pos(self, *args):
        if hasattr(self, 'ellipse'):
            self.ellipse.pos = self.pos
        if hasattr(self, 'line'):
            self.line.circle = (self.center_x, self.center_y, 25)
        self.drag_rect_x, self.drag_rect_y = self.x, self.y

# --- LA PIZARRA TÁCTICA VERTICAL ---
class VerticalTacticBoard(Widget):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.players_on_board = []
        self.opponents_on_board = []
        self.drawings = []
        self.current_tool = "move"
        # Usamos un grupo de instrucciones para los trazos y que no se borren con los hijos
        self.drawing_instr = InstructionGroup()
        self.canvas.add(self.drawing_instr)
        self.draw_field()
        self.bind(size=self.update_field, pos=self.update_field)

    def draw_field(self):
        self.canvas.before.clear()
        with self.canvas.before:
            Color(0.08, 0.25, 0.08, 1)
            self.rect = Rectangle(pos=self.pos, size=self.size)
            Color(1, 1, 1, 0.95)
            Line(rectangle=(self.x + 10, self.y + 10, self.width - 20, self.height - 20), width=3)
            mid_y = self.y + self.height/2
            Line(points=[self.x+10, mid_y, self.x+self.width-10, mid_y], width=3)
            Line(circle=(self.center_x, self.center_y, self.width*0.15), width=3)
            bw, bh = self.width*0.55, self.height*0.14
            Line(rectangle=(self.center_x-bw/2, self.y+self.height-bh-10, bw, bh), width=3)
            Line(rectangle=(self.center_x-bw/2, self.y+10, bw, bh), width=3)

    def update_field(self, *args):
        self.rect.pos = self.pos
        self.rect.size = self.size
        self.draw_field()
        self.redraw_from_data()

    def on_touch_down(self, touch):
        if not self.collide_point(*touch.pos): return False
        if self.current_tool == "opponent":
            marker = OpponentMarker(pos=(touch.x-25, touch.y-25))
            self.add_widget(marker); self.opponents_on_board.append(marker)
            return True
        if self.current_tool == "move": return super().on_touch_down(touch)
        
        # Modo dibujo: añadimos instrucciones al grupo de dibujos
        self.drawing_instr.add(Color(1, 1, 0, 1))
        if self.current_tool == "line": 
            touch.ud['line'] = Line(points=(touch.x, touch.y), width=3)
            self.drawing_instr.add(touch.ud['line'])
        elif self.current_tool == "arrow":
            touch.ud['start'] = (touch.x, touch.y)
            touch.ud['line'] = Line(points=(touch.x, touch.y, touch.x, touch.y), width=3)
            self.drawing_instr.add(touch.ud['line'])
        return True

    def on_touch_move(self, touch):
        if self.current_tool == "move": return super().on_touch_move(touch)
        if 'line' in touch.ud:
            if self.current_tool == "line": touch.ud['line'].points += [touch.x, touch.y]
            elif self.current_tool == "arrow":
                sx, sy = touch.ud['start']
                touch.ud['line'].points = [sx, sy, touch.x, touch.y]
        return True

    def on_touch_up(self, touch):
        if self.current_tool == "move": return super().on_touch_up(touch)
        if 'line' in touch.ud:
            pts = touch.ud['line'].points
            if self.current_tool == "arrow": self.draw_arrow_head(pts[-4], pts[-3], pts[-2], pts[-1])
            rel_pts = []
            for i in range(0, len(pts), 2):
                rel_pts.append((pts[i]-self.x)/self.width); rel_pts.append((pts[i+1]-self.y)/self.height)
            self.drawings.append({"type": self.current_tool, "points": rel_pts})
        return True

    def draw_arrow_head(self, x1, y1, x2, y2):
        angle = math.atan2(y2-y1, x2-x1); k = 18
        l1 = Line(points=[x2, y2, x2-k*math.cos(angle-math.pi/6), y2-k*math.sin(angle-math.pi/6)], width=3)
        l2 = Line(points=[x2, y2, x2-k*math.cos(angle+math.pi/6), y2-k*math.sin(angle+math.pi/6)], width=3)
        self.drawing_instr.add(l1); self.drawing_instr.add(l2)

    def add_player(self, nickname, player_id, pos=None):
        if not pos: pos = (self.center_x-50, self.center_y-50)
        p = BoardPlayer(nickname, player_id, pos=pos)
        self.add_widget(p); self.players_on_board.append(p)
        return p

    def clear_board(self, players_only=True):
        # Elimiamos widgets hijos uno a uno
        for p in self.players_on_board: self.remove_widget(p)
        self.players_on_board = []
        for o in self.opponents_on_board: self.remove_widget(o)
        self.opponents_on_board = []
        if not players_only: 
            self.drawing_instr.clear() # Limpiamos solo los dibujos
            self.drawings = []

    def redraw_from_data(self):
        self.drawing_instr.clear()
        self.drawing_instr.add(Color(1, 1, 0, 1))
        for d in self.drawings:
            abs_pts = []
            for i in range(0, len(d['points']), 2):
                abs_pts.append(self.x + d['points'][i]*self.width); abs_pts.append(self.y + d['points'][i+1]*self.height)
            l = Line(points=abs_pts, width=3)
            self.drawing_instr.add(l)
            if d['type'] == "arrow" and len(abs_pts) >= 4:
                # Aquí no llamamos a draw_arrow_head porque ya añade al group, lo hacemos manual o similar
                x1, y1, x2, y2 = abs_pts[-4], abs_pts[-3], abs_pts[-2], abs_pts[-1]
                angle = math.atan2(y2-y1, x2-x1); k = 18
                self.drawing_instr.add(Line(points=[x2, y2, x2-k*math.cos(angle-math.pi/6), y2-k*math.sin(angle-math.pi/6)], width=3))
                self.drawing_instr.add(Line(points=[x2, y2, x2-k*math.cos(angle+math.pi/6), y2-k*math.sin(angle+math.pi/6)], width=3))

class TacticScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'tactic_screen'
        self.current_category = "Primera"
        self.md_bg_color = (0.05, 0.05, 0.05, 1)
        self.build_ui()

    def build_ui(self):
        main_layout = MDBoxLayout(orientation='horizontal')
        controls_scroll = MDScrollView(size_hint_x=None, width="340dp")
        controls = MDBoxLayout(orientation='vertical', adaptive_height=True, padding="15dp", spacing="14dp")
        
        back_box = MDBoxLayout(adaptive_height=True)
        btn_back = MDIconButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        btn_back.bind(on_release=lambda x: self.go_back())
        back_box.add_widget(btn_back)
        controls.add_widget(back_box)

        controls.add_widget(MDLabel(text="RIVAL / EVENTO", bold=True, theme_text_color="Custom", text_color=(1, 1, 1, 1), font_style="Title", role="large"))
        self.in_rival = MDTextField(mode="outlined")
        self.in_rival.text_color_normal = (1, 1, 1, 1)
        self.in_rival.text_color_focus = (1, 1, 1, 1)
        self.in_rival.font_size = "22sp"
        self.in_rival.add_widget(MDTextFieldHintText(text="Escribe aquí...", text_color=(1, 1, 1, 0.5)))
        controls.add_widget(self.in_rival)
        
        controls.add_widget(MDLabel(text="FECHA", bold=True, theme_text_color="Custom", text_color=(1, 1, 1, 1), font_style="Title", role="large"))
        self.in_fecha = MDTextField(mode="outlined", text=str(date.today()))
        self.in_fecha.text_color_normal = (1, 1, 1, 1)
        self.in_fecha.text_color_focus = (1, 1, 1, 1)
        self.in_fecha.font_size = "22sp"
        controls.add_widget(self.in_fecha)

        controls.add_widget(MDLabel(text="HERRAMIENTAS", bold=True, theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        tool_box = MDBoxLayout(adaptive_height=True, spacing="10dp")
        for icon, tid in [("cursor-move", "move"), ("pencil", "line"), ("arrow-top-right", "arrow"), ("account-group", "opponent"), ("eraser", "clear")]:
            btn = MDIconButton(icon=icon, theme_icon_color="Custom", icon_color=(1,1,1,1), theme_bg_color="Custom", md_bg_color=(0.2,0.2,0.2,1))
            if tid == "clear": btn.bind(on_release=lambda x: [self.board.clear_board(False), self.load_players()])
            else: btn.bind(on_release=lambda x, t=tid: self.select_tool(t))
            tool_box.add_widget(btn)
        controls.add_widget(tool_box)

        controls.add_widget(MDLabel(text="JUGADORAS", bold=True, theme_text_color="Custom", text_color=(1,1,1,1)))
        cat_box = MDBoxLayout(adaptive_height=True, spacing="8dp")
        for c in ["Primera", "Reserva", "Sub-17"]:
            b = MDButton(MDButtonText(text=c), style="tonal")
            b.bind(on_release=lambda x, cat=c: self.change_category(cat))
            cat_box.add_widget(b)
        controls.add_widget(cat_box)

        self.player_area_scroll = MDScrollView(size_hint_y=None, height="200dp")
        self.player_list_box = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="8dp")
        self.player_area_scroll.add_widget(self.player_list_box)
        controls.add_widget(self.player_area_scroll)

        controls.add_widget(MDLabel(text="SUPLENTES", bold=True, theme_text_color="Custom", text_color=(1,1,1,1)))
        self.in_suplentes = MDTextField(mode="outlined", multiline=True, height="100dp", size_hint_y=None)
        self.in_suplentes.text_color_normal = (1, 1, 1, 1)
        controls.add_widget(self.in_suplentes)

        act_box = MDBoxLayout(adaptive_height=True, spacing="15dp", padding=[0, 10, 0, 10])
        btn_s = MDButton(MDButtonText(text="GUARDAR"), style="filled", theme_bg_color="Custom", md_bg_color=(0,0.5,0,1))
        btn_s.bind(on_release=self.save_formation)
        btn_p = MDButton(MDButtonText(text="PDF"), style="tonal", theme_bg_color="Custom", md_bg_color=(0.55,0,0,0.25))
        btn_p.bind(on_release=self.export_current_formation_pdf)
        btn_hist = MDIconButton(icon="history", theme_icon_color="Custom", icon_color=(1, 1, 1, 1), theme_bg_color="Custom", md_bg_color=(0.2, 0.2, 0.2, 1))
        btn_hist.bind(on_release=lambda x: self.show_search_dialog())
        
        act_box.add_widget(btn_s); act_box.add_widget(btn_p); act_box.add_widget(btn_hist)
        controls.add_widget(act_box)
        controls_scroll.add_widget(controls)
        main_layout.add_widget(controls_scroll)

        board_area = AnchorLayout(anchor_x='center', anchor_y='center', padding="15dp")
        self_board_w = Window.width - 380 
        self.board = VerticalTacticBoard(size_hint=(None, 0.95), width=self_board_w) 
        board_area.add_widget(self.board)
        main_layout.add_widget(board_area)

        self.add_widget(main_layout); self.load_players()

    def select_tool(self, tid): self.board.current_tool = tid; self.show_alert(f"Modo: {tid.upper()}")
    def go_back(self): MDApp.get_running_app().root.current = 'main_menu'
    def change_category(self, cat): self.current_category = cat; self.load_players()

    def load_players(self):
        self.player_list_box.clear_widgets()
        db = SessionLocal()
        cat_enum = None
        for c in Category:
            if c.value.lower() == self.current_category.lower(): cat_enum = c; break
        players = crud.get_all_players(db, category=cat_enum)
        db.close()
        ids_on_board = [p.player_id for p in self.board.players_on_board]
        for p in players:
            if p.id in ids_on_board: continue
            name = p.apodo or p.nombre_completo.split()[0]
            item = MDListItem(MDListItemHeadlineText(text=name, theme_text_color="Custom", text_color=(1,1,1,1)), theme_bg_color="Custom", md_bg_color=(0.5, 0, 0, 1), radius=[10, 10, 10, 10])
            item.bind(on_release=lambda x, n=name, pid=p.id: self.add_player_to_board(n, pid))
            self.player_list_box.add_widget(item)

    def add_player_to_board(self, name, pid): self.board.add_player(name, pid); self.load_players()

    def save_formation(self, instance):
        if not self.in_rival.text: self.show_alert("Escribe el Rival"); return
        raw_date = self.in_fecha.text.strip()
        try: fecha_clean = raw_date[:10]; fecha_val = date.fromisoformat(fecha_clean)
        except Exception: fecha_val = date.today(); self.in_fecha.text = str(fecha_val); self.show_alert("Fecha corregida")
        bw, bh = self.board.size
        data_pos = [{"pid": p.player_id, "nickname": p.nickname, "x_rel": (p.x-self.board.x)/bw, "y_rel": (p.y-self.board.y)/bh} for p in self.board.players_on_board]
        db = SessionLocal()
        try: crud.create_formation(db, categoria=self.current_category, rival=self.in_rival.text, fecha_partido=fecha_val, data_posiciones=data_pos, suplentes=self.in_suplentes.text, dibujos=self.board.drawings); self.show_alert("Formación guardada")
        except Exception as e: self.show_alert(f"Error al guardar: {e}")
        finally: db.close()

    def export_current_formation_pdf(self, instance):
        bw, bh = self.board.size
        data_pos = [{"nickname":p.nickname, "x_rel":(p.x-self.board.x)/bw, "y_rel":(p.y-self.board.y)/bh} for p in self.board.players_on_board]
        try: fv = date.fromisoformat(self.in_fecha.text[:10])
        except: fv = date.today()
        temp_f = Formation(rival=self.in_rival.text or "Sin Rival", categoria=self.current_category, fecha_partido=fv, data_posiciones=data_pos, suplentes=self.in_suplentes.text, dibujos=self.board.drawings)
        try: 
            f = generate_formation_pdf(temp_f); self.show_alert(f"PDF: {f}")
            if os.name == 'nt': os.startfile(os.getcwd())
        except Exception as e: self.show_alert(f"Error PDF: {e}")

    def show_alert(self, text): MDSnackbar(MDSnackbarText(text=text)).open()

    def show_search_dialog(self):
        self.dialog_list = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="10dp")
        self.dialog = MDDialog(MDDialogHeadlineText(text="Cargar Formación", theme_text_color="Custom", text_color=(1,1,1,1)), MDDialogContentContainer(self.dialog_list), MDDialogButtonContainer(MDButton(MDButtonText(text="Cerrar"), style="text", on_release=lambda x: self.dialog.dismiss())))
        self.load_formation_list(); self.dialog.open()

    def load_formation_list(self):
        self.dialog_list.clear_widgets()
        db = SessionLocal()
        formations = db.query(Formation).order_by(Formation.id.desc()).limit(15).all()
        db.close()
        for f in formations:
            item_box = MDBoxLayout(adaptive_height=True, spacing="10dp", padding=[10, 5, 10, 5])
            btn_load = MDButton(MDButtonText(text=f"{f.rival} ({f.categoria}) - {f.fecha_partido}"), style="text", on_release=lambda x, fid=f.id: self.load_specific_formation(fid))
            btn_del = MDIconButton(icon="delete", theme_icon_color="Custom", icon_color=(1, 0, 0, 1), on_release=lambda x, fid=f.id: self.delete_formation(fid))
            item_box.add_widget(btn_load); item_box.add_widget(btn_del); self.dialog_list.add_widget(item_box)

    def load_specific_formation(self, f_id):
        if hasattr(self, 'dialog'): self.dialog.dismiss()
        db = SessionLocal()
        f = db.query(Formation).filter(Formation.id == f_id).first()
        db.close()
        if not f: return
        self.board.clear_board(False)
        self.in_rival.text = f.rival; self.in_fecha.text = str(f.fecha_partido); self.in_suplentes.text = f.suplentes or ""
        self.board.drawings = f.dibujos or []
        def place_players(*args):
            bw, bh = self.board.size
            if bw < 100: Clock.schedule_once(place_players, 0.1); return
            for p in (f.data_posiciones or []):
                self.board.add_player(p['nickname'], p.get('pid'), pos=(self.board.x + p['x_rel']*bw, self.board.y + p['y_rel']*bh))
            self.board.redraw_from_data(); self.load_players()
        Clock.schedule_once(place_players, 0.2)
        self.show_alert("Cargado con éxito")

    def delete_formation(self, f_id):
        db = SessionLocal()
        f = db.query(Formation).filter(Formation.id == f_id).first()
        if f: db.delete(f); db.commit(); self.show_alert("Formación eliminada")
        db.close()
        if hasattr(self, 'dialog'): self.load_formation_list()