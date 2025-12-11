from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.floatlayout import MDFloatLayout
from kivymd.uix.textfield import MDTextField, MDTextFieldHintText
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.label import MDLabel
from kivymd.app import MDApp

from database.db_setup import SessionLocal
from utils import crud
from models.session import SessionType
from utils.pdf_utils import generate_session_pdf
from datetime import date

# IMPORTS KIVYMD 2.0
from kivymd.uix.button import MDButton, MDButtonText, MDExtendedFabButton, MDExtendedFabButtonIcon, MDExtendedFabButtonText, MDButtonIcon
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton, MDTopAppBarTrailingButtonContainer
from kivymd.uix.dialog import MDDialog, MDDialogHeadlineText, MDDialogButtonContainer, MDDialogContentContainer
from kivymd.uix.list import MDListItem, MDListItemLeadingIcon, MDListItemTrailingIcon, MDListItemHeadlineText, MDListItemSupportingText, MDListItemTertiaryText
from kivymd.uix.snackbar import MDSnackbar, MDSnackbarText

class PlanningScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'planning_screen'
        self.md_bg_color = (1, 1, 1, 1) # Blanco
        self.dialog = None
        self.current_session_id_manage = None
        
        self.build_ui()
        self.load_sessions()

    def build_ui(self):
        main_layout = MDBoxLayout(orientation='vertical')
        
        # BARRA SUPERIOR
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        
        lead = MDTopAppBarLeadingButtonContainer()
        back = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back.bind(on_release=lambda x: self.go_back())
        lead.add_widget(back)
        
        trail = MDTopAppBarTrailingButtonContainer()
        lib_btn = MDActionTopAppBarButton(icon="dumbbell", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        lib_btn.bind(on_release=lambda x: setattr(MDApp.get_running_app().root, 'current', 'exercise_screen'))
        trail.add_widget(lib_btn)

        top_app_bar.add_widget(lead)
        top_app_bar.add_widget(MDTopAppBarTitle(text="Planificación Semanal", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        top_app_bar.add_widget(trail)
        main_layout.add_widget(top_app_bar)

        # CONTENIDO
        content_area = MDFloatLayout()
        scroll = MDScrollView(pos_hint={"top": 1}, size_hint=(1, 1))
        self.session_list = MDBoxLayout(orientation='vertical', adaptive_height=True, padding="10dp", spacing="10dp")
        scroll.add_widget(self.session_list)
        content_area.add_widget(scroll)
        
        # FAB
        fab = MDExtendedFabButton(pos_hint={'right': .95, 'y': .05})
        fab.add_widget(MDExtendedFabButtonIcon(icon="calendar-plus", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        fab.add_widget(MDExtendedFabButtonText(text="NUEVA SESIÓN", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        fab.bind(on_release=lambda x: self.show_session_form())
        content_area.add_widget(fab)
        
        main_layout.add_widget(content_area)
        self.add_widget(main_layout)

    def go_back(self):
        MDApp.get_running_app().root.current = 'main_menu'

    def show_alert(self, text):
        MDSnackbar(MDSnackbarText(text=text), y="24dp", pos_hint={"center_x": 0.5}, size_hint_x=0.5, background_color=(0.2, 0.2, 0.2, 1)).open()

    def load_sessions(self):
        self.session_list.clear_widgets()
        db = SessionLocal()
        try:
            sessions = crud.get_all_sessions(db)
            if not sessions:
                self.session_list.add_widget(MDLabel(text="No hay sesiones. Crea una nueva.", halign="center", theme_text_color="Custom", text_color=(0.5, 0.5, 0.5, 1)))
            
            for sess in sessions:
                # Contamos ejercicios
                count_ex = len(sess.exercises)
                item = MDListItem(
                    MDListItemLeadingIcon(icon="calendar-clock"),
                    MDListItemHeadlineText(text=f"{sess.titulo}"),
                    MDListItemSupportingText(text=f"{sess.fecha} | {sess.categoria} | Ejercicios: {count_ex}"),
                    MDListItemTertiaryText(text=f"Tipo: {sess.tipo_sesion.value}"), 
                    # El icono trailing abre opciones de borrado
                    MDListItemTrailingIcon(icon="delete"),
                    pos_hint={"center_x": .5},
                    theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
                )
                # Click en item: Administrar Sesión
                item.bind(on_release=lambda x, s=sess: self.show_manage_session(s.id))
                # Click en borrar (trailing)
                # Nota: En KivyMD 2.0 el trailing a veces requiere su propio bind o container.
                # Simplificamos: Gestión completa en el diálogo.
                
                self.session_list.add_widget(item)
        finally: db.close()

    # --- 1. CREAR SESIÓN ---
    def show_session_form(self):
        content = MDBoxLayout(orientation='vertical', spacing='15dp', size_hint_y=None, height='350dp', padding="10dp")
        
        self.sess_title = MDTextField(mode="outlined"); self.sess_title.add_widget(MDTextFieldHintText(text="Título"))
        self.sess_cat = MDTextField(mode="outlined", text="Sub-16", readonly=True); self.sess_cat.add_widget(MDTextFieldHintText(text="Categoría"))
        self.sess_cat.bind(focus=lambda x, f: self.open_menu(x, ["Sub-16", "Primera"]))
        self.sess_date = MDTextField(mode="outlined", text=str(date.today()), readonly=True); self.sess_date.add_widget(MDTextFieldHintText(text="Fecha"))
        
        self.sess_type = MDTextField(mode="outlined", text=SessionType.carga.value, readonly=True)
        self.sess_type.add_widget(MDTextFieldHintText(text="Tipo de Sesión"))
        self.sess_type.bind(focus=lambda x, f: self.open_menu(x, [t.value for t in SessionType]))

        content.add_widget(self.sess_title); content.add_widget(self.sess_cat)
        content.add_widget(self.sess_date); content.add_widget(self.sess_type)

        btn_save = MDButton(MDButtonText(text="GUARDAR"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        btn_save.bind(on_release=self.save_session)
        
        self.dialog = MDDialog(MDDialogHeadlineText(text="Nueva Sesión"), MDDialogContentContainer(content, orientation="vertical"), MDDialogButtonContainer(btn_save))
        self.dialog.open()

    def open_menu(self, instance, options):
        if not instance.focus: return
        menu_items = [{"text": opt, "on_release": lambda x=opt: self.set_item(instance, x)} for opt in options]
        MDDropdownMenu(caller=instance, items=menu_items).open()

    def set_item(self, field, text):
        field.text = text
        field.focus = False

    def save_session(self, instance):
        db = SessionLocal()
        try:
            sel_type = next((t for t in SessionType if t.value == self.sess_type.text), SessionType.carga)
            crud.create_session(db, self.sess_title.text, date.today(), self.sess_cat.text, sel_type)
            self.dialog.dismiss()
            self.show_alert("Sesión Creada")
            self.load_sessions()
        except Exception as e:
            self.show_alert(f"Error: {e}")
        finally: db.close()

    # --- 2. ADMINISTRAR SESIÓN (VER / AGREGAR / BORRAR EJERCICIOS) ---
    def show_manage_session(self, session_id):
        self.current_session_id_manage = session_id
        db = SessionLocal()
        session = db.query(crud.TrainingSession).get(session_id)
        
        content = MDBoxLayout(orientation='vertical', spacing='10dp', size_hint_y=None, height='500dp', padding="5dp")
        
        # Botones Acción
        btn_box = MDBoxLayout(orientation='horizontal', spacing='10dp', adaptive_height=True)
        btn_add = MDButton(MDButtonText(text="➕ Agregar Ejercicio"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1), size_hint_x=0.5)
        btn_add.bind(on_release=lambda x: [self.dialog.dismiss(), self.show_add_exercise_dialog(session_id)])
        
        btn_pdf = MDButton(MDButtonText(text="📄 PDF"), style="tonal", size_hint_x=0.25)
        btn_pdf.bind(on_release=lambda x: [self.dialog.dismiss(), self.export_session_pdf(session_id)])
        
        btn_del_sess = MDButton(MDButtonText(text="🗑️"), style="tonal", theme_bg_color="Custom", md_bg_color=(0.8, 0, 0, 1), size_hint_x=0.25)
        btn_del_sess.bind(on_release=lambda x: [self.dialog.dismiss(), self.delete_session(session_id)])
        
        btn_box.add_widget(btn_add); btn_box.add_widget(btn_pdf); btn_box.add_widget(btn_del_sess)
        content.add_widget(btn_box)
        
        content.add_widget(MDLabel(text="Ejercicios en esta sesión:", bold=True, adaptive_height=True))
        
        # Lista de Ejercicios Actuales
        scroll = MDScrollView()
        list_box = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="5dp")
        
        if not session.exercises:
            list_box.add_widget(MDLabel(text="Sin ejercicios.", halign="center"))
        else:
            for ex in session.exercises:
                # Item con botón de borrar
                item = MDListItem(
                    MDListItemHeadlineText(text=ex.titulo),
                    MDListItemSupportingText(text=f"{ex.categoria.value} | {ex.tiempo_minutos}'"),
                    MDListItemTrailingIcon(icon="close-circle-outline", theme_text_color="Error"),
                    pos_hint={"center_x": .5},
                    theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
                )
                # Acción Borrar Ejercicio de Sesión
                item.bind(on_release=lambda x, eid=ex.id: [self.dialog.dismiss(), self.remove_exercise(session_id, eid)])
                list_box.add_widget(item)
                
        scroll.add_widget(list_box)
        content.add_widget(scroll)
        
        self.dialog = MDDialog(MDDialogHeadlineText(text=session.titulo), MDDialogContentContainer(content, orientation="vertical"))
        self.dialog.open()
        db.close()

    def remove_exercise(self, session_id, exercise_id):
        db = SessionLocal()
        try:
            crud.remove_exercise_from_session(db, session_id, exercise_id)
            self.show_alert("Ejercicio quitado")
            # Reabrir dialogo para ver cambios
            self.show_manage_session(session_id)
        except Exception as e:
            print(e)
        finally: db.close()

    def delete_session(self, session_id):
        db = SessionLocal()
        try:
            crud.delete_session(db, session_id)
            self.show_alert("Sesión Eliminada")
            self.load_sessions()
        finally: db.close()

    # --- 3. SELECCIONAR EJERCICIO PARA AGREGAR ---
    def show_add_exercise_dialog(self, session_id):
        content = MDBoxLayout(orientation='vertical', size_hint_y=None, height='400dp', padding="5dp")
        
        # Filtro simple (Buscar)
        self.search_in = MDTextField(mode="outlined")
        self.search_in.add_widget(MDTextFieldHintText(text="Buscar..."))
        content.add_widget(self.search_in)
        
        scroll = MDScrollView()
        self.add_list_box = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="5dp")
        
        db = SessionLocal()
        exs = crud.get_all_exercises(db)
        db.close()
        
        self.all_exercises_cache = exs # Guardar para filtrar
        self.fill_add_list(exs, session_id)
        
        self.search_in.bind(text=lambda instance, text: self.filter_add_list(text, session_id))
        
        scroll.add_widget(self.add_list_box)
        content.add_widget(scroll)
        
        # Botón Cerrar
        btn_close = MDButton(MDButtonText(text="CERRAR"), style="tonal")
        btn_close.bind(on_release=lambda x: self.dialog.dismiss())
        
        self.dialog = MDDialog(MDDialogHeadlineText(text="Agregar a Sesión"), MDDialogContentContainer(content, orientation="vertical"), MDDialogButtonContainer(btn_close))
        self.dialog.open()

    def filter_add_list(self, text, session_id):
        filtered = [e for e in self.all_exercises_cache if text.lower() in e.titulo.lower()]
        self.fill_add_list(filtered, session_id)

    def fill_add_list(self, exercises, session_id):
        self.add_list_box.clear_widgets()
        for ex in exercises:
            item = MDListItem(
                MDListItemHeadlineText(text=ex.titulo),
                MDListItemSupportingText(text=f"{ex.categoria.value}"),
                pos_hint={"center_x": .5},
                theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
            )
            item.bind(on_release=lambda x, eid=ex.id: self.add_ex_to_sess(session_id, eid))
            self.add_list_box.add_widget(item)

    def add_ex_to_sess(self, session_id, ex_id):
        db = SessionLocal()
        try:
            crud.add_exercise_to_session(db, session_id, ex_id)
            self.dialog.dismiss()
            self.show_alert("Agregado!")
            # Volver a la vista de gestión
            self.show_manage_session(session_id)
        finally: db.close()

    def export_session_pdf(self, session_id):
        db = SessionLocal()
        try:
            sess = db.query(crud.TrainingSession).get(session_id)
            filename = generate_session_pdf(sess)
            self.show_alert(f"PDF: {filename}")
        except Exception as e:
            self.show_alert(f"Error PDF: {e}")
        finally: db.close()