import os
from kivy.uix.widget import Widget
from kivy.graphics import Color, Ellipse, Line, Rectangle, Triangle
from kivy.core.window import Window
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.button import MDButton, MDButtonText, MDIconButton
from kivymd.uix.label import MDLabel
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton
from kivymd.uix.snackbar import MDSnackbar, MDSnackbarText
from kivymd.app import MDApp
from kivy.uix.anchorlayout import AnchorLayout
from PIL import Image as PILImage
import io

class TacticalCanvas(Widget):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.objects = []
        self.mode = 'player_y' 
        self.selected_obj = None
        self.current_line = None
        
        with self.canvas.before:
            Color(0.4, 0.8, 0.4, 1)
            self.rect = Rectangle(size=self.size, pos=self.pos)
        
        self.bind(size=self.update_rect, pos=self.update_rect)

    def update_rect(self, *args):
        self.rect.pos = self.pos
        self.rect.size = self.size
        self.redraw()

    def on_touch_down(self, touch):
        if not self.collide_point(*touch.pos):
            return super().on_touch_down(touch)
        
        if self.mode == 'move':
            for obj in reversed(self.objects):
                if 'pos' in obj:
                    dist = ((obj['pos'][0] - touch.x)**2 + (obj['pos'][1] - touch.y)**2)**0.5
                    if dist < 40: # Rango mayor para figuras grandes
                        self.selected_obj = obj
                        return True
            return False

        if self.mode == 'line':
            self.current_line = [touch.x, touch.y]
            return True
            
        new_obj = {'type': self.mode, 'pos': (touch.x, touch.y)}
        self.objects.append(new_obj)
        self.redraw()
        return True

    def on_touch_move(self, touch):
        if self.mode == 'move' and self.selected_obj:
            self.selected_obj['pos'] = (touch.x, touch.y)
            self.redraw()
            return True
        if self.mode == 'line' and self.current_line:
            self.current_line.extend([touch.x, touch.y])
            self.redraw()
            return True
        return super().on_touch_move(touch)

    def on_touch_up(self, touch):
        self.selected_obj = None
        if self.mode == 'line' and self.current_line:
            self.objects.append({'type': 'line', 'points': self.current_line})
            self.current_line = None
            self.redraw()
            return True
        return super().on_touch_up(touch)

    def redraw(self):
        self.canvas.clear()
        self.canvas.before.clear() # Limpiar el fondo anterior para evitar superposiciones
        with self.canvas.before:
            Color(0.4, 0.8, 0.4, 1) # Verde claro
            Rectangle(size=self.size, pos=self.pos)
            Color(1, 1, 1, 0.4)
            # Líneas de campo
            Line(rectangle=(self.x + 10, self.y + 10, self.width - 20, self.height - 20), width=1.5)
            Line(points=[self.x + self.width/2, self.y + 10, self.x + self.width/2, self.y + self.height - 10], width=1.5)

        with self.canvas:
            for obj in self.objects:
                x, y = obj['pos'] if 'pos' in obj else (0,0)
                if obj['type'] == 'player_y':
                    Color(1, 1, 0, 1) # Amarillo
                    Ellipse(pos=(x-25, y-25), size=(50, 50))
                    Color(0, 0, 0, 1)
                    Line(ellipse=(x-25, y-25, 50, 50), width=1.5)
                elif obj['type'] == 'player_m':
                    Color(0.5, 0, 0, 1) # Bordó
                    Ellipse(pos=(x-25, y-25), size=(50, 50))
                    Color(1, 1, 1, 1)
                    Line(ellipse=(x-25, y-25, 50, 50), width=1.5)
                elif obj['type'] == 'ball':
                    Color(1, 1, 1, 1) # Blanco
                    Ellipse(pos=(x-12, y-12), size=(24, 24))
                    Color(0, 0, 0, 1)
                    Line(ellipse=(x-12, y-12, 24, 24), width=1)
                elif obj['type'] == 'cone':
                    Color(1, 0.5, 0, 1) # Naranja
                    Triangle(points=[x, y+30, x-25, y-20, x+25, y-20])
                elif obj['type'] == 'ring':
                    Color(1, 0.6, 0, 1) # Naranja Intenso
                    Line(circle=(x, y, 35), width=3)
                elif obj['type'] == 'stick':
                    Color(0.8, 0.8, 0.8, 1) # Gris/Palo
                    Line(points=[x-60, y, x+60, y], width=6)
                elif obj['type'] == 'ladder':
                    Color(1, 1, 1, 1)
                    Line(points=[x-35, y-120, x-35, y+120], width=2.5)
                    Line(points=[x+35, y-120, x+35, y+120], width=2.5)
                    for off in [-120, -60, 0, 60, 120]:
                        Line(points=[x-35, y+off, x+35, y+off], width=2.5)
                elif obj['type'] == 'goal':
                    Color(1, 1, 1, 1)
                    Line(rectangle=(x-75, y-25, 150, 50), width=4)
                    Color(1, 1, 1, 0.2)
                    Rectangle(pos=(x-75, y-25), size=(150, 50))
                elif obj['type'] == 'line':
                    Color(1, 1, 1, 0.8)
                    Line(points=obj['points'], width=2)
            
            if self.current_line:
                Color(1, 1, 1, 0.5)
                Line(points=self.current_line, width=1.5)

    def clear_canvas(self):
        self.objects = []
        self.redraw()

    def undo(self):
        if self.objects:
            self.objects.pop()
            self.redraw()

class GifMakerScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'gif_maker_screen'
        self.frames = []
        self.build_ui()

    def build_ui(self):
        main_layout = MDBoxLayout(orientation='vertical')
        
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        lead = MDTopAppBarLeadingButtonContainer()
        back = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back.bind(on_release=lambda x: self.go_back())
        lead.add_widget(back)
        top_app_bar.add_widget(lead)
        top_app_bar.add_widget(MDTopAppBarTitle(text="Creador de GIFs Tácticos", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        main_layout.add_widget(top_app_bar)

        content = MDBoxLayout(orientation='horizontal')
        
        sidebar = MDBoxLayout(orientation='vertical', size_hint_x=None, width="110dp", padding="5dp", spacing="5dp", md_bg_color=(0.95, 0.95, 0.95, 1))
        
        tool_scroll = MDScrollView(size_hint_x=1, do_scroll_x=False)
        tool_box = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="8dp", padding="5dp")
        
        tools = [
            ('cursor-move', 'move', 'Mover'),
            ('account', 'player_y', 'Jugadora (Y)'),
            ('account', 'player_m', 'Jugadora (M)'),
            ('soccer', 'ball', 'Pelota'),
            ('triangle', 'cone', 'Cono'),
            ('circle-outline', 'ring', 'Aro'),
            ('vector-line', 'stick', 'Valla/Palo'),
            ('grid', 'ladder', 'Escalera'),
            ('minus-box-outline', 'goal', 'Arco'),
            ('draw', 'line', 'Trazo')
        ]
        
        tool_box.add_widget(MDLabel(text="Herramientas", bold=True, adaptive_height=True, halign="center", font_style="Label", role="small"))
        
        for icon, mode, hint in tools:
            btn = MDIconButton(icon=icon, theme_icon_color="Custom", icon_color=(0.55, 0, 0, 1))
            btn.bind(on_release=lambda x, m=mode: self.set_mode(m))
            tool_box.add_widget(btn)
            tool_box.add_widget(MDLabel(text=hint, font_style="Label", role="small", halign="center", adaptive_height=True))

        tool_scroll.add_widget(tool_box)
        sidebar.add_widget(tool_scroll)
        sidebar.add_widget(MDBoxLayout(size_hint_y=None, height="10dp"))
        
        btns_actions = MDBoxLayout(adaptive_height=True, spacing="5dp", padding="5dp")
        btn_undo = MDIconButton(icon="undo", on_release=lambda x: self.canvas_widget.undo())
        btn_clear = MDIconButton(icon="delete-sweep", on_release=lambda x: self.canvas_widget.clear_canvas())
        btns_actions.add_widget(btn_undo); btns_actions.add_widget(btn_clear)
        sidebar.add_widget(btns_actions)

        content.add_widget(sidebar)

        # Contenedor Square para el Canvas
        canvas_anchor = AnchorLayout(anchor_x='center', anchor_y='center', size_hint=(1, 1))
        self.canvas_widget = TacticalCanvas(size_hint=(None, None))
        self.bind(size=self.adjust_canvas_size)
        canvas_anchor.add_widget(self.canvas_widget)
        content.add_widget(canvas_anchor)
        
        main_layout.add_widget(content)

        # Barra Inferior Acciones GIF
        footer = MDBoxLayout(orientation='horizontal', size_hint_y=0.1, padding="10dp", spacing="20dp", md_bg_color=(0.2, 0.2, 0.2, 1))
        
        self.lbl_frames = MDLabel(text="Frames: 0", theme_text_color="Custom", text_color=(1, 1, 1, 1))
        footer.add_widget(self.lbl_frames)
        
        btn_capture = MDButton(MDButtonText(text="Capturar Frame"), style="filled")
        btn_capture.bind(on_release=self.capture_frame)
        footer.add_widget(btn_capture)
        
        btn_generate = MDButton(MDButtonText(text="Generar GIF"), style="filled", theme_bg_color="Custom", md_bg_color=(0, 0.5, 0, 1))
        btn_generate.bind(on_release=self.generate_gif)
        footer.add_widget(btn_generate)
        
        btn_reset = MDButton(MDButtonText(text="Reiniciar GIF"), style="tonal")
        btn_reset.bind(on_release=self.reset_gif)
        footer.add_widget(btn_reset)

        main_layout.add_widget(footer)
        
        self.add_widget(main_layout)

    def set_mode(self, mode):
        self.canvas_widget.mode = mode
        self.show_alert(f"Modo: {mode}")

    def adjust_canvas_size(self, *args):
        # El canvas debe ser cuadrado basado en el alto disponible
        available_height = self.height * 0.8
        available_width = self.width - 120 # Menos sidebar
        side = min(available_height, available_width)
        self.canvas_widget.size = (side, side)

    def go_back(self):
        MDApp.get_running_app().root.current = 'main_menu'

    def capture_frame(self, instance):
        # Exportar el widget canvas a una imagen en memoria
        # Kivy export_as_image no funciona directo sobre Widget a veces, mejor export_to_png temporal
        temp_file = "temp_frame.png"
        self.canvas_widget.export_to_png(temp_file)
        img = PILImage.open(temp_file)
        self.frames.append(img.copy())
        self.lbl_frames.text = f"Frames: {len(self.frames)}"
        self.show_alert("Frame capturado")

    def reset_gif(self, instance):
        self.frames = []
        self.lbl_frames.text = "Frames: 0"
        self.show_alert("Secuencia reiniciada")

    def generate_gif(self, instance):
        if len(self.frames) < 2:
            self.show_alert("Captura al menos 2 frames para el GIF")
            return
            
        folder = os.path.join(os.getcwd(), "assets", "exercises")
        if not os.path.exists(folder): os.makedirs(folder)
        
        filename = f"tactica_{len(os.listdir(folder))}.gif"
        save_path = os.path.join(folder, filename)
        
        # Guardar usando Pillow
        self.frames[0].save(
            save_path,
            save_all=True,
            append_images=self.frames[1:],
            duration=500,
            loop=0
        )
        
        self.show_alert(f"GIF guardado en assets/exercises/{filename}")
        # Limpiar
        if os.path.exists("temp_frame.png"): os.remove("temp_frame.png")

    def show_alert(self, text):
        MDSnackbar(MDSnackbarText(text=text)).open()
