import os
from kivy.uix.image import Image as KivyImage
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
        self.view_mode = "groups" # "groups" o "sessions"
        self.current_group_name = None
        
        self.build_ui()
        self.load_sessions()

    def build_ui(self):
        main_layout = MDBoxLayout(orientation='vertical')
        
        # BARRA SUPERIOR
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        
        lead = MDTopAppBarLeadingButtonContainer()
        back = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back.bind(on_release=lambda x: self.on_back_pressed())
        lead.add_widget(back)
        
        trail = MDTopAppBarTrailingButtonContainer()
        lib_btn = MDActionTopAppBarButton(icon="dumbbell", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        lib_btn.bind(on_release=lambda x: setattr(MDApp.get_running_app().root, 'current', 'exercise_screen'))
        trail.add_widget(lib_btn)

        top_app_bar.add_widget(lead)
        self.title_label = MDTopAppBarTitle(text="Planificación", theme_text_color="Custom", text_color=(1, 1, 1, 1))
        top_app_bar.add_widget(self.title_label)
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

    def on_back_pressed(self):
        if self.view_mode == "sessions":
            self.view_mode = "groups"
            self.current_group_name = None
            self.load_sessions()
        else:
            self.go_back()

    def go_back(self):
        MDApp.get_running_app().root.current = 'main_menu'

    def show_alert(self, text):
        MDSnackbar(MDSnackbarText(text=text), y="24dp", pos_hint={"center_x": 0.5}, size_hint_x=0.5, background_color=(0.2, 0.2, 0.2, 1)).open()

    def load_sessions(self):
        self.session_list.clear_widgets()
        db = SessionLocal()
        try:
            if self.view_mode == "groups":
                self.title_label.text = "Planificación"
                groups = ["Pretemporada", "Marzo - Abril - Mayo", "Junio - Julio - Agosto", "Septiembre - Octubre - Noviembre", "General"]
                for gname in groups:
                    # Contamos sesiones en este grupo
                    count = db.query(crud.TrainingSession).filter(crud.TrainingSession.grupo == gname).count()
                    item = MDListItem(
                        MDListItemLeadingIcon(icon="folder-outline"),
                        MDListItemHeadlineText(text=gname),
                        MDListItemSupportingText(text=f"{count} sesiones programadas"),
                        MDListItemTrailingIcon(icon="chevron-right"),
                        pos_hint={"center_x": .5},
                        theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
                    )
                    item.bind(on_release=lambda x, gn=gname: self.enter_group(gn))
                    self.session_list.add_widget(item)
            else:
                self.title_label.text = f"Sesiones: {self.current_group_name}"
                sessions = db.query(crud.TrainingSession).filter(crud.TrainingSession.grupo == self.current_group_name).order_by(crud.TrainingSession.fecha).all()
                
                if not sessions:
                    self.session_list.add_widget(MDLabel(text="No hay sesiones en este grupo.", halign="center", padding="20dp"))
                
                for sess in sessions:
                    count_ex = len(sess.exercises)
                    item = MDListItem(
                        MDListItemLeadingIcon(icon="calendar-clock"),
                        MDListItemHeadlineText(text=f"{sess.titulo}"),
                        MDListItemSupportingText(text=f"{sess.fecha} | {sess.categoria} | Ejercicios: {count_ex}"),
                        MDListItemTertiaryText(text=f"Tipo: {sess.tipo_sesion.value}"), 
                        MDListItemTrailingIcon(icon="delete"),
                        pos_hint={"center_x": .5},
                        theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
                    )
                    item.bind(on_release=lambda x, s=sess: self.show_manage_session(s.id))
                    self.session_list.add_widget(item)
        finally: db.close()

    def enter_group(self, group_name):
        self.view_mode = "sessions"
        self.current_group_name = group_name
        self.load_sessions()

    # --- 1. CREAR SESIÓN ---
    def show_session_form(self):
        content = MDBoxLayout(orientation='vertical', spacing='15dp', size_hint_y=None, height='350dp', padding="10dp")
        
        self.sess_title = MDTextField(mode="outlined"); self.sess_title.add_widget(MDTextFieldHintText(text="Título"))
        self.sess_cat = MDTextField(mode="outlined", text="Sub-17", readonly=True); self.sess_cat.add_widget(MDTextFieldHintText(text="Categoría"))
        self.sess_cat.bind(focus=lambda x, f: self.open_menu(x, ["Sub-17", "Primera"]))
        self.sess_date = MDTextField(mode="outlined", text=str(date.today()), readonly=True); self.sess_date.add_widget(MDTextFieldHintText(text="Fecha"))
        
        self.sess_type = MDTextField(mode="outlined", text=SessionType.carga.value, readonly=True)
        self.sess_type.add_widget(MDTextFieldHintText(text="Tipo de Sesión"))
        self.sess_type.bind(focus=lambda x, f: self.open_menu(x, [t.value for t in SessionType]))

        initial_group = self.current_group_name if self.current_group_name else "General"
        self.sess_group = MDTextField(mode="outlined", text=initial_group, readonly=True)
        self.sess_group.add_widget(MDTextFieldHintText(text="Grupo"))
        groups_list = ["Pretemporada", "Marzo - Abril - Mayo", "Junio - Julio - Agosto", "Septiembre - Octubre - Noviembre", "General"]
        self.sess_group.bind(focus=lambda x, f: self.open_menu(x, groups_list))

        content.add_widget(self.sess_title); content.add_widget(self.sess_cat)
        content.add_widget(self.sess_date); content.add_widget(self.sess_type)
        content.add_widget(self.sess_group)

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
            # Pasamos el grupo seleccionado
            crud.create_session(
                db, 
                self.sess_title.text, 
                date.today(), 
                self.sess_cat.text, 
                sel_type,
                grupo=self.sess_group.text
            )
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
                # Item que muestra detalles
                item = MDListItem(
                    MDListItemHeadlineText(text=ex.titulo),
                    MDListItemSupportingText(text=f"{ex.categoria.value} | {ex.tiempo_minutos}'"),
                    MDListItemTrailingIcon(icon="close-circle-outline", theme_text_color="Error"),
                    pos_hint={"center_x": .5},
                    theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
                )
                
                # Acción 1: Click en el item -> VER DETALLES (GIF Y TEXTO)
                item.bind(on_release=lambda x, eid=ex.id: self.view_exercise_details(eid))
                
                # Para borrar individualmente, en KivyMD 2.0 MDListItemTrailingIcon no es independiente
                # a menos que usemos un container complejo. Por ahora, añadimos el botón "Quitar" 
                # dentro de los detalles o usamos un diálogo de confirmación.
                # Lo más rápido para el usuario: Mostrar detalles.
                
                list_box.add_widget(item)
                
        scroll.add_widget(list_box)
        content.add_widget(scroll)
        
        self.dialog = MDDialog(MDDialogHeadlineText(text=session.titulo), MDDialogContentContainer(content, orientation="vertical"))
        self.dialog.open()
        db.close()

    # --- NUEVO: VER DETALLES DEL EJERCICIO DENTRO DE LA PLANIFICACIÓN ---
    def view_exercise_details(self, ex_id):
        db = SessionLocal()
        ex = db.query(crud.Exercise).get(ex_id)
        db.close()
        
        if not ex: return

        content = MDBoxLayout(orientation='vertical', spacing='10dp', size_hint_y=None, height='500dp', padding="10dp")
        
        # Imagen / GIF
        img_source = "logo.png"
        if ex.foto_path and os.path.exists(ex.foto_path):
            img_source = ex.foto_path
            
        img = KivyImage(source=img_source, size_hint_y=None, height="250dp", anim_delay=0.1)
        content.add_widget(img)
        
        # Textos
        content.add_widget(MDLabel(text=ex.titulo, bold=True, font_style="Headline", role="small"))
        content.add_widget(MDLabel(text=f"Objetivo: {ex.objetivo_principal.value} | Intensidad: {ex.intensidad_carga.value}", theme_text_color="Secondary"))
        
        scroll_desc = MDScrollView(size_hint_y=None, height="100dp")
        scroll_desc.add_widget(MDLabel(text=ex.descripcion or "Sin descripción", theme_text_color="Primary", adaptive_height=True))
        content.add_widget(scroll_desc)
        
        content.add_widget(MDLabel(text=f"Materiales: {ex.materiales or '-'}", italic=True))

        # Botón para registrar resultados si es un TEST
        btn_eval = None
        test_keywords = ["test", "evaluación", "evaluativo", "circuito de habilidades"]
        if any(kw in ex.titulo.lower() for kw in test_keywords):
            btn_eval = MDButton(
                MDButtonText(text="📝 REGISTRAR EVALUACIÓN"),
                style="filled", theme_bg_color="Custom", md_bg_color=(0, 0.4, 0, 1)
            )
            btn_eval.bind(on_release=lambda x: [self.dialog.dismiss(), self.show_test_registration(ex.id)])

        # Botón para QUITAR de la sesión
        btn_remove = MDButton(
            MDButtonText(text="QUITAR"),
            style="tonal", theme_bg_color="Custom", md_bg_color=(1, 0.9, 0.9, 1)
        )
        btn_remove.bind(on_release=lambda x: [self.dialog.dismiss(), self.remove_exercise(self.current_session_id_manage, ex.id)])
        
        btn_close = MDButton(MDButtonText(text="CERRAR"), style="filled")
        btn_close.bind(on_release=lambda x: self.dialog.dismiss())
        
        btns = [btn_remove, btn_close]
        if btn_eval: btns.insert(0, btn_eval)

        self.dialog = MDDialog(
            MDDialogHeadlineText(text="Detalle del Ejercicio"),
            MDDialogContentContainer(content, orientation="vertical"),
            MDDialogButtonContainer(*btns)
        )
        self.dialog.open()

    def show_test_registration(self, exercise_id):
        db = SessionLocal()
        ex = db.query(crud.Exercise).get(exercise_id)
        players = crud.get_all_players(db)
        db.close()

        content = MDBoxLayout(orientation='vertical', spacing='10dp', size_hint_y=None, height='500dp', padding="10dp")
        content.add_widget(MDLabel(text=f"Registrar: {ex.titulo}", bold=True))
        
        scroll = MDScrollView()
        list_box = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="15dp")
        
        self.test_inputs = {} # player_id -> textfield
        
        for p in players:
            row = MDBoxLayout(orientation='horizontal', spacing='10dp', adaptive_height=True)
            row.add_widget(MDLabel(text=p.nombre_completo, size_hint_x=0.4))
            
            tf = MDTextField(mode="outlined", size_hint_x=0.6)
            tf.add_widget(MDTextFieldHintText(text="Resultado (ej: 15.2)"))
            self.test_inputs[p.id] = tf
            row.add_widget(tf)
            list_box.add_widget(row)
            
        scroll.add_widget(list_box)
        content.add_widget(scroll)

        btn_save = MDButton(MDButtonText(text="GUARDAR TODO"), style="filled", theme_bg_color="Custom", md_bg_color=(0, 0.4, 0, 1))
        btn_save.bind(on_release=lambda x: self.save_test_results(exercise_id))
        
        self.dialog = MDDialog(
            MDDialogHeadlineText(text="Evaluación de Jugadoras"),
            MDDialogContentContainer(content, orientation="vertical"),
            MDDialogButtonContainer(btn_save)
        )
        self.dialog.open()

    def save_test_results(self, exercise_id):
        db = SessionLocal()
        try:
            for pid, tf in self.test_inputs.items():
                if tf.text.strip():
                    crud.create_test_result(db, pid, exercise_id, tf.text.strip())
            self.dialog.dismiss()
            self.show_alert("Resultados Guardados")
        except Exception as e:
            self.show_alert(f"Error: {e}")
        finally: db.close()

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
            
            # Notificación mejorada con acción para abrir carpeta
            if "Error" not in filename:
                self.show_alert(f"PDF Generado: {filename}")
                # Intentar abrir la carpeta en Windows
                if os.name == 'nt': os.startfile(os.getcwd())
            else:
                self.show_alert(filename)
        except Exception as e:
            self.show_alert(f"Error PDF: {e}")
        finally: db.close()