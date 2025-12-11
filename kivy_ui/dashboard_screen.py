from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.app import MDApp
from database.db_setup import SessionLocal
from logic.reports import generate_risk_report

from kivymd.uix.list import (
    MDListItem, MDListItemLeadingIcon, MDListItemHeadlineText, MDListItemSupportingText
)
# IMPORTS APPBAR
from kivymd.uix.appbar import (
    MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton
)

class DashboardScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'dashboard_screen'
        self.md_bg_color = (1, 1, 1, 1)
        self.load_data()

    def load_data(self):
        self.clear_widgets() 
        risk_data = [] 
        db = SessionLocal()
        try:
            risk_data = generate_risk_report(db)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            db.close()
        self.add_widget(self.build_ui(risk_data))

    def build_ui(self, risk_data):
        main_layout = MDBoxLayout(orientation='vertical')

        # BARRA SUPERIOR
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        leading_container = MDTopAppBarLeadingButtonContainer()
        back_btn = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back_btn.bind(on_release=lambda x: self.go_back())
        leading_container.add_widget(back_btn)
        title = MDTopAppBarTitle(text="Semáforo de Riesgo", theme_text_color="Custom", text_color=(1, 1, 1, 1))
        top_app_bar.add_widget(leading_container)
        top_app_bar.add_widget(title)
        main_layout.add_widget(top_app_bar)

        # LISTA
        scroll = MDScrollView()
        list_layout = MDBoxLayout(orientation='vertical', adaptive_height=True, padding="10dp", spacing="10dp")

        for item in risk_data:
            color_val = (0.1, 0.7, 0.1, 1) # Verde por defecto
            icon_name = "check-circle"
            if item['color_semaforo'] == 'red':
                color_val = (0.85, 0.1, 0.1, 1)
                icon_name = "alert-circle"
            elif item['color_semaforo'] == 'yellow':
                color_val = (0.9, 0.6, 0, 1)
                icon_name = "alert-outline"
            
            list_item = MDListItem(
                MDListItemLeadingIcon(icon=icon_name, theme_text_color="Custom", text_color=color_val),
                MDListItemHeadlineText(text=f"{item['nombre']} ({item['categoria']})"),
                MDListItemSupportingText(text=item['nivel_riesgo'], theme_text_color="Custom", text_color=color_val),
                pos_hint={"center_x": .5},
                theme_bg_color="Custom",
                md_bg_color=(0.95, 0.95, 0.95, 1)
            )
            list_layout.add_widget(list_item)

        scroll.add_widget(list_layout)
        main_layout.add_widget(scroll)
        return main_layout

    def go_back(self):
        MDApp.get_running_app().root.current = 'main_menu'