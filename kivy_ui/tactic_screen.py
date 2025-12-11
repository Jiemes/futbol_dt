import io
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.fitimage import FitImage
from kivy.core.image import Image as CoreImage
from kivymd.app import MDApp
from database.db_setup import SessionLocal
from logic.tactic_board import plot_formation
from utils import crud
from kivymd.uix.button import MDButton, MDButtonText
from kivymd.uix.appbar import (
    MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton
)

try:
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False

class TacticScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'tactic_screen'
        self.md_bg_color = (1, 1, 1, 1) # White
        self.build_ui()
        
    def build_ui(self):
        main_layout = MDBoxLayout(orientation='vertical')

        # TOP BAR
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        leading_container = MDTopAppBarLeadingButtonContainer()
        back_btn = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back_btn.bind(on_release=lambda x: self.go_back())
        leading_container.add_widget(back_btn)
        title = MDTopAppBarTitle(text="Pizarra Táctica", theme_text_color="Custom", text_color=(1, 1, 1, 1))
        top_app_bar.add_widget(leading_container)
        top_app_bar.add_widget(title)
        main_layout.add_widget(top_app_bar)

        # CONTENT
        content = MDBoxLayout(orientation='vertical', padding='10dp', spacing='10dp')
        
        self.plot_container = MDBoxLayout(size_hint=(1, 1))
        if not MATPLOTLIB_AVAILABLE:
            self.plot_container.add_widget(MDLabel(text="Instalar matplotlib", halign="center"))
        else:
            self.image_widget = FitImage(fit_mode="contain")
            self.plot_container.add_widget(self.image_widget)
        content.add_widget(self.plot_container)
        
        btn_load = MDButton(
            MDButtonText(text="CARGAR EJEMPLO (4-4-2)"),
            style="filled",
            pos_hint={"center_x": .5},
            size_hint_x=0.8,
            height="48dp",
            theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1)
        )
        btn_load.bind(on_release=self.load_tactic_visualization)
        content.add_widget(btn_load)
        
        main_layout.add_widget(content)
        self.add_widget(main_layout)

    def go_back(self):
        MDApp.get_running_app().root.current = 'main_menu'
        
    def load_tactic_visualization(self, instance):
        if not MATPLOTLIB_AVAILABLE: return
        db = SessionLocal()
        try:
            players = crud.get_all_players(db)
            formation_data = [] 
            if len(players) > 0: formation_data.append((players[0].id, 5, 34))
            fig = plot_formation(db, formation_data, "Pizarra Táctica")
            buf = io.BytesIO()
            fig.savefig(buf, format='png', facecolor='#2E8B57') 
            buf.seek(0)
            im_data = CoreImage(buf, ext='png')
            self.image_widget.texture = im_data.texture
            plt.close(fig)
        except Exception as e: print(f"Error: {e}")
        finally: db.close()