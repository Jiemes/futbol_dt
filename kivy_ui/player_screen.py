from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.floatlayout import MDFloatLayout
from kivymd.uix.textfield import MDTextField, MDTextFieldHintText
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.label import MDLabel
from kivymd.app import MDApp
from kivymd.uix.screenmanager import MDScreenManager

from database.db_setup import SessionLocal
from utils import crud
from utils.pdf_utils import generate_player_stats_pdf
from models.player import Category, Position
from models.activity import PlayerActivity, ActivityType
from datetime import date

from kivymd.uix.button import MDButton, MDButtonText, MDExtendedFabButton, MDExtendedFabButtonIcon, MDExtendedFabButtonText, MDButtonIcon
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton, MDTopAppBarTrailingButtonContainer
from kivymd.uix.dialog import MDDialog, MDDialogHeadlineText, MDDialogButtonContainer, MDDialogContentContainer
from kivymd.uix.list import (
    MDListItem, MDListItemLeadingIcon, MDListItemTrailingIcon, 
    MDListItemHeadlineText, MDListItemSupportingText, MDListItemTertiaryText
)
from kivymd.uix.snackbar import MDSnackbar, MDSnackbarText

class PlayerScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'player_management_screen'
        self.md_bg_color = (1, 1, 1, 1)
        self.current_player_id = None
        self.dialog = None
        self.act_dialog = None
        self.cat_menu = None
        self.pos_menu = None
        self.birthdays_this_month = []
        
        self.build_ui()
        self.load_player_list()

    def build_ui(self):
        main_layout = MDBoxLayout(orientation='vertical')
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        
        leading = MDTopAppBarLeadingButtonContainer()
        back_btn = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back_btn.bind(on_release=lambda x: self.go_back())
        leading.add_widget(back_btn)
        
        trailing = MDTopAppBarTrailingButtonContainer()
        
        self.pdf_btn = MDActionTopAppBarButton(icon="printer", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        self.pdf_btn.bind(on_release=self.show_pdf_options)
        
        self.bday_btn = MDActionTopAppBarButton(icon="cake-variant", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        self.bday_btn.bind(on_release=self.show_birthdays)
        
        trailing.add_widget(self.pdf_btn); trailing.add_widget(self.bday_btn)
        top_app_bar.add_widget(leading); top_app_bar.add_widget(MDTopAppBarTitle(text="Gestión de Plantel", theme_text_color="Custom", text_color=(1, 1, 1, 1))); top_app_bar.add_widget(trailing)
        
        main_layout.add_widget(top_app_bar)

        content_area = MDFloatLayout()
        lists_container = MDBoxLayout(orientation='horizontal', spacing='10dp', padding='10dp', pos_hint={"top": 1, "bottom": 0}, size_hint=(1, 1))
        
        sub16_box = MDBoxLayout(orientation='vertical', spacing='5dp')
        sub16_box.add_widget(MDLabel(text="SUB-16", halign="center", bold=True, theme_text_color="Custom", text_color=(0.55, 0, 0, 1), size_hint_y=None, height="30dp"))
        self.sub16_list = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="5dp")
        scroll1 = MDScrollView(); scroll1.add_widget(self.sub16_list)
        sub16_box.add_widget(scroll1)
        
        primera_box = MDBoxLayout(orientation='vertical', spacing='5dp')
        primera_box.add_widget(MDLabel(text="PRIMERA", halign="center", bold=True, theme_text_color="Custom", text_color=(0.55, 0, 0, 1), size_hint_y=None, height="30dp"))
        self.primera_list = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="5dp")
        scroll2 = MDScrollView(); scroll2.add_widget(self.primera_list)
        primera_box.add_widget(scroll2)

        lists_container.add_widget(sub16_box); lists_container.add_widget(primera_box)
        content_area.add_widget(lists_container)
        
        fab = MDExtendedFabButton(pos_hint={'right': .95, 'y': .05})
        fab.add_widget(MDExtendedFabButtonIcon(icon="plus", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        fab.add_widget(MDExtendedFabButtonText(text="NUEVA JUGADORA", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        fab.bind(on_release=lambda x: self.show_player_form(None))
        content_area.add_widget(fab)
        
        main_layout.add_widget(content_area)
        self.add_widget(main_layout)

    def go_back(self):
        MDApp.get_running_app().root.current = 'main_menu'

    def show_alert(self, text):
        MDSnackbar(MDSnackbarText(text=text), y="24dp", pos_hint={"center_x": 0.5}, size_hint_x=0.5, background_color=(0.2, 0.2, 0.2, 1)).open()

    def calculate_age(self, born):
        today = date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

    # --- PDF LISTAS ---
    def show_pdf_options(self, instance):
        content = MDBoxLayout(orientation='vertical', spacing='10dp', size_hint_y=None, height='120dp')
        btn_sub16 = MDButton(MDButtonText(text="Listado SUB-16"), style="tonal", size_hint_x=1)
        btn_sub16.bind(on_release=lambda x: [self.dialog.dismiss(), self.export_list(Category.sub_16)])
        btn_primera = MDButton(MDButtonText(text="Listado PRIMERA"), style="tonal", size_hint_x=1)
        btn_primera.bind(on_release=lambda x: [self.dialog.dismiss(), self.export_list(Category.primera)])
        
        content.add_widget(btn_sub16); content.add_widget(btn_primera)
        self.dialog = MDDialog(MDDialogHeadlineText(text="Exportar a PDF"), MDDialogContentContainer(content, orientation="vertical"))
        self.dialog.open()

    def export_list(self, category_enum):
        # Import local para evitar circular
        from utils.pdf_utils import generate_team_list_pdf
        db = SessionLocal()
        try:
            players = crud.get_all_players(db, category=category_enum)
            if not players:
                self.show_alert("No hay jugadoras")
                return
            filename = generate_team_list_pdf(category_enum.value, players)
            self.show_alert(f"PDF Generado: {filename}")
        except Exception as e:
            print(f"Error PDF: {e}")
            self.show_alert("Error al crear PDF")
        finally: db.close()

    def create_list_item(self, player):
        age = self.calculate_age(player.fecha_nacimiento)
        partidos = len([a for a in player.activities if a.tipo == ActivityType.partido])
        practicas = len([a for a in player.activities if a.tipo == ActivityType.practica])
        goles = sum([a.goles for a in player.activities])
        
        pos_str = player.posicion_principal.value
        pos_icon = "soccer" if "Arquera" in pos_str else "account"
        health_color = (0, 0.6, 0, 1) if "Apto" in player.estado_salud_actual else (0.8, 0, 0, 1)

        item = MDListItem(
            MDListItemLeadingIcon(icon=pos_icon),
            MDListItemHeadlineText(text=f"{player.nombre_completo} ({age} años)"),
            MDListItemSupportingText(text=f"{pos_str} | {player.estado_salud_actual}", theme_text_color="Custom", text_color=health_color),
            MDListItemTertiaryText(text=f"Partidos: {partidos} | Prácticas: {practicas} | Goles: {goles}"),
            MDListItemTrailingIcon(icon="dots-vertical"),
            pos_hint={"center_x": .5},
            theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
        )
        item.bind(on_release=lambda x, p=player: self.show_action_menu(p))
        return item

    def load_player_list(self):
        self.sub16_list.clear_widgets()
        self.primera_list.clear_widgets()
        self.birthdays_this_month = []
        today = date.today()
        db = SessionLocal()
        try:
            players = crud.get_all_players(db)
            for player in players:
                if player.fecha_nacimiento.month == today.month: self.birthdays_this_month.append(player)
                item = self.create_list_item(player)
                if player.categoria_actual == Category.sub_16: self.sub16_list.add_widget(item)
                else: self.primera_list.add_widget(item)
            self.bday_btn.icon_color = (1, 0.8, 0, 1) if self.birthdays_this_month else (1, 1, 1, 1)
        finally: db.close()

    def show_birthdays(self, instance):
        names = "\n".join([f"🎂 {p.nombre_completo} ({p.fecha_nacimiento.day}/{p.fecha_nacimiento.month})" for p in self.birthdays_this_month])
        if not names: names = "No hay cumpleaños este mes."
        self.dialog = MDDialog(MDDialogHeadlineText(text="Cumpleaños del Mes"), MDDialogContentContainer(MDLabel(text=names), orientation="vertical"))
        self.dialog.open()

    def show_action_menu(self, player):
        content = MDBoxLayout(orientation='vertical', spacing='10dp', size_hint_y=None, height='120dp')
        
        btn_edit = MDButton(MDButtonText(text="Editar Datos"), style="tonal", size_hint_x=1)
        btn_edit.bind(on_release=lambda x: [self.dialog.dismiss(), self.show_player_form(player.id)])
        
        # Eliminado botón de carga individual como pediste
        
        btn_pdf = MDButton(MDButtonText(text="Descargar Ficha Individual"), style="tonal", size_hint_x=1)
        btn_pdf.bind(on_release=lambda x: [self.dialog.dismiss(), self.export_pdf(player)])

        content.add_widget(btn_edit); content.add_widget(btn_pdf)
        self.dialog = MDDialog(MDDialogHeadlineText(text=player.nombre_completo), MDDialogContentContainer(content, orientation="vertical"))
        self.dialog.open()

    def export_pdf(self, player):
        db = SessionLocal()
        try:
            p = db.query(Player).get(player.id)
            # Import local
            from utils.pdf_utils import generate_player_stats_pdf
            file = generate_player_stats_pdf(p, p.activities)
            self.show_alert(f"PDF creado: {file}")
        except Exception as e:
            print(f"PDF Error: {e}")
            self.show_alert("Error generando PDF")
        finally: db.close()

    # --- FORMULARIO JUGADORA ---
    def show_player_form(self, player_id=None):
        self.current_player_id = player_id
        db = SessionLocal()
        p = db.query(Player).get(player_id) if player_id else None
        db.close()

        title = "MODIFICAR" if p else "NUEVA"
        scroll = MDScrollView(size_hint_y=None, height="450dp")
        content = MDBoxLayout(orientation='vertical', spacing='12dp', adaptive_height=True, padding="10dp")
        
        self.name_in = MDTextField(mode="outlined", text=p.nombre_completo if p else "")
        self.name_in.add_widget(MDTextFieldHintText(text="Nombre"))
        self.apodo_in = MDTextField(mode="outlined", text=p.apodo if p else "")
        self.apodo_in.add_widget(MDTextFieldHintText(text="Apodo"))
        self.dni_in = MDTextField(mode="outlined", text=p.dni if p else "")
        self.dni_in.add_widget(MDTextFieldHintText(text="DNI"))
        
        self.dir_in = MDTextField(mode="outlined", text=p.direccion if p else "")
        self.dir_in.add_widget(MDTextFieldHintText(text="Dirección"))
        self.tel_in = MDTextField(mode="outlined", text=p.telefono_personal if p else "")
        self.tel_in.add_widget(MDTextFieldHintText(text="Teléfono Personal"))
        self.emerg_in = MDTextField(mode="outlined", text=p.telefono_emergencia if p else "")
        self.emerg_in.add_widget(MDTextFieldHintText(text="Contacto Emergencia"))

        self.dob_in = MDTextField(mode="outlined", text=str(p.fecha_nacimiento) if p else "2010-01-01")
        self.dob_in.add_widget(MDTextFieldHintText(text="Fecha Nac (YYYY-MM-DD)"))

        self.cat_in = MDTextField(mode="outlined", readonly=True, text=p.categoria_actual.value if p else "Seleccionar...")
        self.cat_in.add_widget(MDTextFieldHintText(text="Categoría"))
        self.cat_in.bind(focus=self.open_cat_menu)

        self.pos_in = MDTextField(mode="outlined", readonly=True, text=p.posicion_principal.value if p else "Seleccionar...")
        self.pos_in.add_widget(MDTextFieldHintText(text="Posición Ppal"))
        self.pos_in.bind(focus=self.open_pos_menu)

        sec_val = p.posicion_secundaria.value if (p and p.posicion_secundaria) else "Ninguna"
        self.pos2_in = MDTextField(mode="outlined", readonly=True, text=sec_val)
        self.pos2_in.add_widget(MDTextFieldHintText(text="Posición Secundaria"))
        self.pos2_in.bind(focus=self.open_pos2_menu)

        self.peso_in = MDTextField(mode="outlined", text=str(p.peso_kg) if p else "")
        self.peso_in.add_widget(MDTextFieldHintText(text="Peso (kg)"))
        self.alt_in = MDTextField(mode="outlined", text=str(p.altura_cm) if p else "")
        self.alt_in.add_widget(MDTextFieldHintText(text="Altura (cm)"))
        self.salud_in = MDTextField(mode="outlined", text=p.estado_salud_actual if p else "Apto")
        self.salud_in.add_widget(MDTextFieldHintText(text="Salud"))

        content.add_widget(self.name_in); content.add_widget(self.apodo_in)
        content.add_widget(self.dni_in); content.add_widget(self.dir_in)
        content.add_widget(self.tel_in); content.add_widget(self.emerg_in)
        content.add_widget(self.dob_in); content.add_widget(self.cat_in)
        content.add_widget(self.pos_in); content.add_widget(self.pos2_in)
        content.add_widget(self.peso_in); content.add_widget(self.alt_in); content.add_widget(self.salud_in)
        scroll.add_widget(content)

        btn_save = MDButton(MDButtonText(text="GUARDAR"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        btn_save.bind(on_release=self.save_player)
        
        self.dialog = MDDialog(MDDialogHeadlineText(text=f"{title} JUGADORA"), MDDialogContentContainer(scroll, orientation="vertical"), MDDialogButtonContainer(btn_save))
        self.dialog.open()

    def open_cat_menu(self, instance, focus):
        if not focus: return
        menu_items = [{"text": c.value, "on_release": lambda x=c.value: self.set_item(instance, x)} for c in Category]
        MDDropdownMenu(caller=instance, items=menu_items).open()

    def open_pos_menu(self, instance, focus):
        if not focus: return
        menu_items = [{"text": p.value, "on_release": lambda x=p.value: self.set_item(instance, x)} for p in Position]
        MDDropdownMenu(caller=instance, items=menu_items, width_mult=5, max_height="300dp").open()

    def open_pos2_menu(self, instance, focus):
        if not focus: return
        menu_items = [{"text": "Ninguna", "on_release": lambda: self.set_item(instance, "Ninguna")}]
        menu_items += [{"text": p.value, "on_release": lambda x=p.value: self.set_item(instance, x)} for p in Position]
        MDDropdownMenu(caller=instance, items=menu_items, width_mult=5, max_height="300dp").open()

    def set_item(self, field, value):
        field.text = value
        field.focus = False

    def save_player(self, instance):
        db = SessionLocal()
        try:
            cat = next((c for c in Category if c.value == self.cat_in.text), Category.sub_16)
            pos = next((p for p in Position if p.value == self.pos_in.text), Position.central)
            pos2 = next((p for p in Position if p.value == self.pos2_in.text), None)
            
            try: dob_val = date.fromisoformat(self.dob_in.text)
            except: dob_val = date(2010, 1, 1)

            data = {
                "nombre_completo": self.name_in.text, "apodo": self.apodo_in.text, "dni": self.dni_in.text,
                "direccion": self.dir_in.text, "telefono_personal": self.tel_in.text, "telefono_emergencia": self.emerg_in.text,
                "fecha_nacimiento": dob_val, "peso_kg": float(self.peso_in.text or 0), "altura_cm": float(self.alt_in.text or 0),
                "estado_salud_actual": self.salud_in.text, "categoria_actual": cat, 
                "posicion_principal": pos, "posicion_secundaria": pos2
            }
            
            if self.current_player_id:
                crud.update_player(db, self.current_player_id, data)
            else:
                new_p = Player(**data)
                db.add(new_p)
                db.commit()
            
            self.dialog.dismiss()
            self.show_alert("Jugadora Guardada")
            self.load_player_list()
        except Exception as e: 
            print(e)
            self.show_alert("Error en datos")
        finally: db.close()