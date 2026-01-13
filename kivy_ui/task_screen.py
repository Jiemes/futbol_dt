from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.floatlayout import MDFloatLayout
from kivymd.uix.textfield import MDTextField, MDTextFieldHintText
from kivymd.app import MDApp
from kivymd.uix.dialog import MDDialog, MDDialogHeadlineText, MDDialogButtonContainer, MDDialogContentContainer
from datetime import date

from kivymd.uix.button import MDButton, MDButtonText, MDFabButton, MDButtonIcon
from kivymd.uix.list import (
    MDListItem, MDListItemLeadingIcon, MDListItemHeadlineText, MDListItemSupportingText, MDListItemTertiaryText
)
from kivymd.uix.appbar import (
    MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton
)

STAFF_TASKS = [
    {"id": 1, "titulo": "Preparar calentamiento", "responsable": "PF", "estado": "Pendiente", "fecha": "2025-12-08"},
]

class TaskScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'tasks_screen'
        self.md_bg_color = (1, 1, 1, 1)
        self.dialog = None
        self.build_ui()
        self.load_tasks()

    def build_ui(self):
        main_layout = MDBoxLayout(orientation='vertical')

        # BARRA SUPERIOR
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        leading_container = MDTopAppBarLeadingButtonContainer()
        back_btn = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back_btn.bind(on_release=lambda x: self.go_back())
        leading_container.add_widget(back_btn)
        title = MDTopAppBarTitle(text="Tareas Staff", theme_text_color="Custom", text_color=(1, 1, 1, 1))
        top_app_bar.add_widget(leading_container)
        top_app_bar.add_widget(title)
        main_layout.add_widget(top_app_bar)

        # CONTENIDO
        content_area = MDFloatLayout()
        scroll = MDScrollView(pos_hint={"top": 1}, size_hint=(1, 1))
        self.task_list_container = MDBoxLayout(orientation='vertical', adaptive_height=True, padding="10dp", spacing="10dp")
        scroll.add_widget(self.task_list_container)
        content_area.add_widget(scroll)
        
        fab = MDFabButton(style="standard", pos_hint={'right': .95, 'y': .05}, theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        fab.add_widget(MDButtonIcon(icon="plus", theme_text_color="Custom", text_color=(1,1,1,1)))
        fab.bind(on_release=lambda x: self.show_task_form())
        content_area.add_widget(fab)
        
        main_layout.add_widget(content_area)
        self.add_widget(main_layout)

    def go_back(self):
        MDApp.get_running_app().root.current = 'main_menu'

    def load_tasks(self):
        self.task_list_container.clear_widgets()
        for task in STAFF_TASKS:
            is_complete = task['estado'] == 'Completa'
            icon_name = "check-circle" if is_complete else "clock-alert"
            
            item = MDListItem(
                MDListItemLeadingIcon(icon=icon_name),
                MDListItemHeadlineText(text=task['titulo']),
                MDListItemSupportingText(text=f"Resp: {task['responsable']}"),
                MDListItemTertiaryText(text=f"{task['fecha']} | {task['estado']}"),
                pos_hint={"center_x": .5},
                theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
            )
            if not is_complete:
                item.bind(on_release=lambda x, t_id=task['id']: self.mark_complete(t_id))
            self.task_list_container.add_widget(item)

    def show_task_form(self):
        content = MDBoxLayout(orientation='vertical', spacing='15dp', size_hint_y=None, height='250dp', padding="10dp")
        
        self.title_input = MDTextField(mode="outlined")
        self.title_input.add_widget(MDTextFieldHintText(text="Título Tarea"))
        
        self.resp_input = MDTextField(mode="outlined")
        self.resp_input.add_widget(MDTextFieldHintText(text="Responsable (PF/AC/DT)"))
        
        content.add_widget(self.title_input)
        content.add_widget(self.resp_input)

        btn_cancel = MDButton(MDButtonText(text="CANCELAR"), style="tonal")
        btn_save = MDButton(MDButtonText(text="ASIGNAR"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        
        btn_cancel.bind(on_release=lambda x: self.dialog.dismiss())
        btn_save.bind(on_release=self.add_task)

        self.dialog = MDDialog(
            MDDialogHeadlineText(text="NUEVA TAREA"),
            MDDialogContentContainer(content, orientation="vertical"),
            MDDialogButtonContainer(btn_cancel, btn_save, spacing="8dp"),
        )
        self.dialog.open()

    def add_task(self, instance):
        new_task = {"id": 99, "titulo": self.title_input.text, "responsable": self.resp_input.text, "estado": "Pendiente", "fecha": str(date.today())}
        STAFF_TASKS.append(new_task)
        self.dialog.dismiss()
        self.load_tasks()

    def mark_complete(self, t_id):
        for t in STAFF_TASKS:
            if t['id'] == t_id: t['estado'] = 'Completa'
        self.load_tasks()