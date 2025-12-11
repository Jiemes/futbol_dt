from kivymd.app import MDApp
from kivymd.uix.screenmanager import MDScreenManager
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.fitimage import FitImage
from database.db_setup import init_db
from kivymd.uix.button import MDButton, MDButtonText

# IMPORTAMOS TODAS LAS PANTALLAS
from kivy_ui.player_screen import PlayerScreen
from kivy_ui.attendance_screen import AttendanceScreen # <--- NUEVA
from kivy_ui.planning_screen import PlanningScreen
from kivy_ui.tactic_screen import TacticScreen
from kivy_ui.task_screen import TaskScreen
from kivy_ui.dashboard_screen import DashboardScreen
from kivy_ui.rules_screen import RulesScreen

from kivy_ui.exercise_screen import ExerciseScreen

class MainScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'main_menu'
        self.md_bg_color = (1, 1, 1, 1)
        
        layout = MDBoxLayout(orientation='vertical', padding='20dp', spacing='10dp', adaptive_height=True, pos_hint={"center_x": .5, "center_y": .5})

        try:
            logo = FitImage(source='logo.png', size_hint=(None, None), size=("130dp", "130dp"), pos_hint={"center_x": .5}, fit_mode="contain")
            layout.add_widget(logo)
        except: pass

        layout.add_widget(MDLabel(text="PALOMETAS FC", halign="center", font_style="Display", role="small", bold=True, theme_text_color="Custom", text_color=(0.55, 0, 0, 1), size_hint_y=None, height="50dp"))
        
        menu_items = [
            ("Gestión de Jugadoras", 'player_management_screen'),
            ("Control de Asistencia", 'attendance_screen'), # <--- NUEVA
            ("Planificación", 'planning_screen'),
            ("Pizarra Táctica", 'tactic_screen'),
            ("Tareas Staff", 'tasks_screen'),
            ("Dashboard Riesgo", 'dashboard_screen'),
            ("Reglamentos", 'rules_screen'),
        ]
        
        for text_label, screen_name in menu_items:
            btn = MDButton(
                MDButtonText(text=text_label, theme_text_color="Custom", text_color=(1, 1, 1, 1)),
                style="filled", pos_hint={"center_x": .5}, size_hint_x=0.8, height="48dp",
                theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1)
            )
            btn.bind(on_release=lambda x, s=screen_name: self.change_screen(s))
            layout.add_widget(btn)
        self.add_widget(layout)

    def change_screen(self, screen_name):
        self.manager.current = screen_name

class PalometasApp(MDApp):
    def build(self):
        init_db()
        self.theme_cls.theme_style = "Light"
        self.theme_cls.primary_palette = "Red"
        
        sm = MDScreenManager()
        sm.add_widget(MainScreen())
        sm.add_widget(PlayerScreen())
        sm.add_widget(AttendanceScreen()) # <--- NUEVA
        sm.add_widget(PlanningScreen())
        sm.add_widget(TacticScreen())
        sm.add_widget(TaskScreen())
        sm.add_widget(DashboardScreen())
        sm.add_widget(RulesScreen())
        sm.add_widget(ExerciseScreen())
        return sm