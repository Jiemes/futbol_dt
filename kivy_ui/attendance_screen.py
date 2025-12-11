from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.textfield import MDTextField, MDTextFieldHintText
from kivymd.app import MDApp
from kivymd.uix.menu import MDDropdownMenu

from database.db_setup import SessionLocal
from utils import crud
from models.player import Category
from models.activity import PlayerActivity, ActivityType
from datetime import date

# IMPORTS KIVYMD 2.0
from kivymd.uix.button import MDButton, MDButtonText
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton
from kivymd.uix.list import (
    MDListItem, MDListItemLeadingIcon, MDListItemHeadlineText, 
    MDListItemSupportingText, MDListItemTrailingCheckbox
)
from kivymd.uix.snackbar import MDSnackbar, MDSnackbarText

class AttendanceScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'attendance_screen'
        self.md_bg_color = (1, 1, 1, 1)
        self.selected_players = set()
        self.goals_inputs = {} # Diccionario para guardar referencias a los inputs de goles
        self.current_category = Category.sub_16
        
        self.build_ui()
        self.load_players()

    def build_ui(self):
        layout = MDBoxLayout(orientation='vertical')
        
        # BARRA SUPERIOR
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        lead = MDTopAppBarLeadingButtonContainer()
        back = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back.bind(on_release=lambda x: self.go_back())
        lead.add_widget(back)
        top_app_bar.add_widget(lead)
        top_app_bar.add_widget(MDTopAppBarTitle(text="Control de Asistencia", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        layout.add_widget(top_app_bar)

        # CONTROLES
        controls = MDBoxLayout(orientation='vertical', padding='15dp', spacing='10dp', adaptive_height=True)
        
        row1 = MDBoxLayout(orientation='horizontal', spacing='10dp', adaptive_height=True)
        self.cat_field = MDTextField(mode="outlined", text="Sub-16", readonly=True)
        self.cat_field.add_widget(MDTextFieldHintText(text="Categoría"))
        self.cat_field.bind(focus=self.open_cat_menu)
        
        self.date_field = MDTextField(mode="outlined", text=str(date.today()), readonly=True)
        self.date_field.add_widget(MDTextFieldHintText(text="Fecha"))
        
        row1.add_widget(self.cat_field)
        row1.add_widget(self.date_field)
        
        row2 = MDBoxLayout(orientation='horizontal', spacing='10dp', adaptive_height=True)
        self.type_field = MDTextField(mode="outlined", text="Práctica", readonly=True)
        self.type_field.add_widget(MDTextFieldHintText(text="Actividad"))
        self.type_field.bind(focus=self.open_type_menu)
        
        self.detail_field = MDTextField(mode="outlined")
        self.detail_field.add_widget(MDTextFieldHintText(text="Rival / Observación"))
        
        row2.add_widget(self.type_field)
        row2.add_widget(self.detail_field)
        
        controls.add_widget(row1)
        controls.add_widget(row2)
        layout.add_widget(controls)
        
        # LISTA
        scroll = MDScrollView()
        self.player_list_box = MDBoxLayout(orientation='vertical', adaptive_height=True)
        scroll.add_widget(self.player_list_box)
        layout.add_widget(scroll)
        
        # BOTÓN GUARDAR
        btn_box = MDBoxLayout(padding='20dp', adaptive_height=True)
        save_btn = MDButton(MDButtonText(text="GUARDAR ASISTENCIA MASIVA"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1), pos_hint={"center_x": .5}, size_hint_x=1)
        save_btn.bind(on_release=self.save_batch)
        btn_box.add_widget(save_btn)
        layout.add_widget(btn_box)

        self.add_widget(layout)

    def go_back(self):
        MDApp.get_running_app().root.current = 'main_menu'

    def open_cat_menu(self, instance, focus):
        if not focus: return
        menu_items = [{"text": "Sub-16", "on_release": lambda: self.set_cat(Category.sub_16)}, {"text": "Primera", "on_release": lambda: self.set_cat(Category.primera)}]
        MDDropdownMenu(caller=instance, items=menu_items).open()

    def set_cat(self, cat_enum):
        self.current_category = cat_enum
        self.cat_field.text = cat_enum.value
        self.cat_field.focus = False
        self.load_players()

    def open_type_menu(self, instance, focus):
        if not focus: return
        menu_items = [{"text": "Práctica", "on_release": lambda: self.set_text(self.type_field, "Práctica")}, {"text": "Partido", "on_release": lambda: self.set_text(self.type_field, "Partido")}]
        MDDropdownMenu(caller=instance, items=menu_items).open()

    def set_text(self, field, text):
        field.text = text
        field.focus = False

    def load_players(self):
        self.player_list_box.clear_widgets()
        self.selected_players.clear()
        self.goals_inputs = {} # Reiniciar referencias de inputs
        
        db = SessionLocal()
        try:
            players = crud.get_all_players(db, category=self.current_category)
            for p in players:
                self.selected_players.add(p.id)
                
                # Crear Item
                item = MDListItem(
                    MDListItemLeadingIcon(icon="account"),
                    MDListItemHeadlineText(text=p.nombre_completo),
                    MDListItemSupportingText(text=p.posicion_principal.value),
                    MDListItemTrailingCheckbox(active=True),
                )
                
                # Para añadir el campo de Goles, usamos un truco ya que KivyMD 2.0 es estricto.
                # Añadimos un TextField a un contenedor y lo insertamos en el item si es posible,
                # o usamos un layout personalizado.
                # SOLUCIÓN SIMPLE: Un TextField pequeño agregado al contenedor del Item.
                # (MDListItem hereda de MDBoxLayout en versiones dev a veces, intentemos add_widget directo)
                
                # Crear Input de Goles (Pequeño a la derecha)
                goal_field = MDTextField(mode="outlined", text="0", size_hint_x=None, width="50dp", pos_hint={"center_y": .5})
                # Guardar referencia vinculada al ID del jugador
                self.goals_inputs[p.id] = goal_field
                
                # Añadir al item antes del checkbox (que es trailing)
                # Nota: KivyMD 2.0 pone los trailing al final. Insertamos el goal field.
                item.add_widget(goal_field)
                
                # Binding de selección
                item.bind(on_release=lambda x, pid=p.id: self.toggle_selection(pid))
                self.player_list_box.add_widget(item)
        finally: db.close()

    def toggle_selection(self, pid):
        if pid in self.selected_players: self.selected_players.remove(pid)
        else: self.selected_players.add(pid)

    def save_batch(self, instance):
        if not self.selected_players:
            MDSnackbar(MDSnackbarText(text="Sin selección"), background_color=(0.2, 0.2, 0.2, 1)).open()
            return

        db = SessionLocal()
        try:
            act_type = ActivityType.practica if self.type_field.text == "Práctica" else ActivityType.partido
            detalle_txt = self.detail_field.text
            fecha_val = date.today()
            
            count = 0
            for pid in self.selected_players:
                # Obtener goles del input correspondiente
                goles_val = 0
                if pid in self.goals_inputs:
                    try:
                        goles_val = int(self.goals_inputs[pid].text)
                    except: goles_val = 0
                
                new_act = PlayerActivity(
                    player_id=pid,
                    fecha=fecha_val,
                    tipo=act_type,
                    goles=goles_val,
                    detalle=detalle_txt
                )
                db.add(new_act)
                count += 1
            
            db.commit()
            MDSnackbar(MDSnackbarText(text=f"Guardado: {count} presentes"), background_color=(0.2, 0.2, 0.2, 1)).open()
            self.detail_field.text = ""
            # Recargar para limpiar inputs
            self.load_players()
        except Exception as e:
            print(e)
            MDSnackbar(MDSnackbarText(text="Error al guardar"), background_color=(0.2, 0.2, 0.2, 1)).open()
        finally: db.close()