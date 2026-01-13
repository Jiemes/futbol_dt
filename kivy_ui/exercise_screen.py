import os
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.floatlayout import MDFloatLayout
from kivymd.uix.textfield import MDTextField, MDTextFieldHintText
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.label import MDLabel
from kivymd.app import MDApp
from kivy.uix.image import Image as KivyImage 

from database.db_setup import SessionLocal
from utils import crud
from models.exercise import ExerciseObjective, ExerciseIntensity, ExerciseCategory
import preload_data # Para cargar ejercicios base

# IMPORTS KIVYMD 2.0
from kivymd.uix.button import MDButton, MDButtonText, MDExtendedFabButton, MDExtendedFabButtonIcon, MDExtendedFabButtonText, MDButtonIcon
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton
from kivymd.uix.dialog import MDDialog, MDDialogHeadlineText, MDDialogButtonContainer, MDDialogContentContainer
from kivymd.uix.card import MDCard 
from kivymd.uix.list import MDListItem, MDListItemHeadlineText

class ExerciseScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'exercise_screen'
        self.md_bg_color = (1, 1, 1, 1) # Blanco
        self.current_filter = None
        self.current_exercise_id = None
        self.dialog = None
        self.media_selector_dialog = None
        self.filter_buttons = {}
        
        self.selected_media_path = ""
        
        self.build_ui()
        self.load_exercises()

    def build_ui(self):
        main_layout = MDBoxLayout(orientation='vertical')
        
        # BARRA SUPERIOR
        top_app_bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        lead = MDTopAppBarLeadingButtonContainer()
        back = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back.bind(on_release=lambda x: self.go_back())
        lead.add_widget(back)
        top_app_bar.add_widget(lead)
        top_app_bar.add_widget(MDTopAppBarTitle(text="Biblioteca de Ejercicios", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        main_layout.add_widget(top_app_bar)

        # BARRA FILTROS
        filter_scroll = MDScrollView(size_hint_y=None, height="60dp", do_scroll_y=False, do_scroll_x=True, bar_width=0)
        filter_box = MDBoxLayout(orientation='horizontal', padding="10dp", spacing="10dp", adaptive_width=True)
        
        btn_all = MDButton(MDButtonText(text="Todos"), style="filled", height="32dp", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        btn_all.bind(on_release=lambda x: self.filter_exercises(None))
        self.filter_buttons["Todos"] = btn_all
        filter_box.add_widget(btn_all)
        
        btn_import = MDButton(MDButtonText(text="IMPORTAR BASE"), style="filled", theme_bg_color="Custom", md_bg_color=(0.2, 0.4, 0.2, 1), height="32dp")
        btn_import.bind(on_release=self.run_import_base)
        filter_box.add_widget(btn_import)

        btn_gif = MDButton(MDButtonText(text="CREAR GIF"), style="filled", theme_bg_color="Custom", md_bg_color=(0, 0.4, 0.6, 1), height="32dp")
        btn_gif.bind(on_release=lambda x: setattr(MDApp.get_running_app().root, 'current', 'gif_maker_screen'))
        filter_box.add_widget(btn_gif)

        for obj in ExerciseObjective:
            btn = MDButton(MDButtonText(text=obj.value), style="tonal", height="32dp")
            btn.bind(on_release=lambda x, o=obj: self.filter_exercises(o))
            self.filter_buttons[obj.value] = btn
            filter_box.add_widget(btn)
        
        filter_scroll.add_widget(filter_box)
        main_layout.add_widget(filter_scroll)

        # LISTA DE TARJETAS
        content_area = MDFloatLayout()
        scroll = MDScrollView(pos_hint={"top": 1}, size_hint=(1, 1))
        self.ex_grid = MDBoxLayout(orientation='vertical', adaptive_height=True, padding="10dp", spacing="10dp")
        scroll.add_widget(self.ex_grid)
        content_area.add_widget(scroll)
        
        # FAB
        fab = MDExtendedFabButton(pos_hint={'right': .95, 'y': .05})
        fab.add_widget(MDExtendedFabButtonIcon(icon="plus", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        fab.add_widget(MDExtendedFabButtonText(text="NUEVO EJERCICIO", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        fab.bind(on_release=lambda x: self.show_exercise_form(None))
        content_area.add_widget(fab)
        
        main_layout.add_widget(content_area)
        self.add_widget(main_layout)

    def go_back(self):
        MDApp.get_running_app().root.current = 'planning_screen'

    def filter_exercises(self, objective):
        self.current_filter = objective
        
        # Actualizar colores de botones (Selección Visual)
        target_text = objective.value if objective else "Todos"
        for text, btn in self.filter_buttons.items():
            if text == target_text:
                # Botón seleccionado: Rojo oscuro (estilo marca)
                btn.style = "filled"
                btn.theme_bg_color = "Custom"
                btn.md_bg_color = (0.55, 0, 0, 1)
                btn.children[0].theme_text_color = "Custom"
                btn.children[0].text_color = (1, 1, 1, 1)
            else:
                # Botón no seleccionado: Estilo tonal (gris suave)
                btn.style = "tonal"
                btn.theme_bg_color = "Primary"
                btn.children[0].theme_text_color = "Primary"

        self.load_exercises()

    def create_card(self, ex):
        # Tarjeta contenedora principal
        card = MDCard(
            style="elevated", 
            padding="10dp", 
            size_hint_y=None, 
            height="150dp", 
            theme_bg_color="Custom", 
            md_bg_color=(0.96, 0.96, 0.96, 1),
            ripple_behavior=False # Desactivamos ripple global para manejar clicks internos
        )
        
        h_box = MDBoxLayout(orientation='horizontal', spacing="10dp")
        
        # --- IMAGEN CLICKEABLE (ZOOM) ---
        img_source = "logo.png"
        if ex.foto_path and os.path.exists(ex.foto_path) and os.path.isfile(ex.foto_path):
            img_source = ex.foto_path

        # Usamos un Card pequeño como contenedor clickeable para la imagen
        img_card = MDCard(
            size_hint=(None, 1), 
            width="120dp", 
            style="outlined",
            ripple_behavior=True
        )
        img_card.bind(on_release=lambda x, src=img_source: self.show_zoom_image(src))
        
        img = KivyImage(
            source=img_source, 
            size_hint=(1, 1), 
            fit_mode="contain", 
            anim_delay=0.1
        )
        img_card.add_widget(img)
        h_box.add_widget(img_card)
        
        # --- TEXTOS (Clickeables para editar) ---
        # CORRECCIÓN: Usamos style="filled" con fondo transparente en lugar de "text"
        v_box = MDCard(
            orientation='vertical', 
            style="filled", 
            md_bg_color=(0, 0, 0, 0), # Transparente
            ripple_behavior=True,
            padding="5dp"
        )
        v_box.bind(on_release=lambda x, eid=ex.id: self.show_exercise_form(eid))

        v_box.add_widget(MDLabel(text=ex.titulo, bold=True, theme_text_color="Primary"))
        
        cat_val = ex.categoria.value if ex.categoria else "General"
        obj_val = ex.objetivo_principal.value if ex.objetivo_principal else "-"
        
        v_box.add_widget(MDLabel(text=f"Cat: {cat_val}", theme_text_color="Secondary", font_style="Label", role="small"))
        v_box.add_widget(MDLabel(text=f"Obj: {obj_val}", theme_text_color="Secondary", font_style="Label", role="small"))
        v_box.add_widget(MDLabel(text=f"Min: {ex.tiempo_minutos} | Mat: {ex.materiales or '-'}", theme_text_color="Secondary", font_style="Body", role="small"))
        
        h_box.add_widget(v_box)
        
        # Botón Borrar (Pequeño a la derecha)
        del_box = MDBoxLayout(size_hint_x=None, width="40dp", orientation='vertical', pos_hint={"center_y": .5})
        del_btn = MDButton(style="text", pos_hint={"center_x": .5})
        del_btn.add_widget(MDButtonIcon(icon="delete", theme_text_color="Error"))
        del_btn.bind(on_release=lambda x, eid=ex.id: self.delete_ex(eid))
        del_box.add_widget(del_btn)
        
        h_box.add_widget(del_box)
        
        card.add_widget(h_box)
        return card

    def show_zoom_image(self, source):
        # Diálogo para ver imagen/GIF en grande
        content = MDBoxLayout(size_hint_y=None, height="400dp")
        img = KivyImage(
            source=source, 
            size_hint=(1, 1), 
            fit_mode="contain", 
            anim_delay=0.1
        )
        content.add_widget(img)
        
        btn_close = MDButton(MDButtonText(text="CERRAR"), style="tonal")
        
        self.dialog = MDDialog(
            MDDialogHeadlineText(text="Visualización"),
            MDDialogContentContainer(content, orientation="vertical"),
            MDDialogButtonContainer(btn_close),
        )
        btn_close.bind(on_release=lambda x: self.dialog.dismiss())
        self.dialog.open()

    def load_exercises(self):
        self.ex_grid.clear_widgets()
        db = SessionLocal()
        try:
            exercises = crud.get_all_exercises(db)
            count = 0
            for ex in exercises:
                if self.current_filter and ex.objetivo_principal != self.current_filter:
                    continue
                self.ex_grid.add_widget(self.create_card(ex))
                count += 1
            
            if count == 0:
                self.ex_grid.add_widget(MDLabel(text="No se encontraron ejercicios.", halign="center"))
        finally: db.close()

    def delete_ex(self, eid):
        db = SessionLocal()
        try:
            crud.delete_exercise(db, eid)
            self.load_exercises()
        finally: db.close()

    def run_import_base(self, instance):
        try:
            preload_data.load_data()
            self.load_exercises()
            # Alerta simple (podríamos usar snackbar pero no tengo importado aqui, asumo print o dialog visual simple si falla)
            print("Importación finalizada") 
        except Exception as e:
            print(f"Error importando: {e}")

    # --- FORMULARIO ---
    def show_exercise_form(self, exercise_id=None):
        self.current_exercise_id = exercise_id
        self.selected_media_path = ""
        
        db = SessionLocal()
        ex = db.query(crud.Exercise).get(exercise_id) if exercise_id else None
        db.close()

        title = "MODIFICAR EJERCICIO" if ex else "NUEVO EJERCICIO"

        content = MDBoxLayout(orientation='vertical', spacing='15dp', size_hint_y=None, height='500dp', padding="10dp")
        
        self.tit_in = MDTextField(mode="outlined", text=ex.titulo if ex else "")
        self.tit_in.add_widget(MDTextFieldHintText(text="Título"))
        
        self.desc_in = MDTextField(mode="outlined", multiline=True, text=ex.descripcion if ex else "")
        self.desc_in.add_widget(MDTextFieldHintText(text="Descripción"))
        
        self.mat_in = MDTextField(mode="outlined", text=ex.materiales if ex and ex.materiales else "")
        self.mat_in.add_widget(MDTextFieldHintText(text="Materiales"))
        
        self.time_in = MDTextField(mode="outlined", text=str(ex.tiempo_minutos) if ex else "0")
        self.time_in.add_widget(MDTextFieldHintText(text="Tiempo (min)"))
        
        # Dropdowns
        def_obj = ex.objetivo_principal.value if ex and ex.objetivo_principal else ExerciseObjective.tactico.value
        self.obj_in = MDTextField(mode="outlined", text=def_obj, readonly=True)
        self.obj_in.add_widget(MDTextFieldHintText(text="Objetivo"))
        self.obj_in.bind(focus=lambda x, f: self.open_menu(x, [e.value for e in ExerciseObjective]))
        
        def_int = ex.intensidad_carga.value if ex and ex.intensidad_carga else ExerciseIntensity.media.value
        self.int_in = MDTextField(mode="outlined", text=def_int, readonly=True)
        self.int_in.add_widget(MDTextFieldHintText(text="Intensidad"))
        self.int_in.bind(focus=lambda x, f: self.open_menu(x, [e.value for e in ExerciseIntensity]))
        
        def_cat = ex.categoria.value if ex else ExerciseCategory.tecnico.value
        self.cat_in = MDTextField(mode="outlined", text=def_cat, readonly=True)
        self.cat_in.add_widget(MDTextFieldHintText(text="Categoría"))
        self.cat_in.bind(focus=lambda x, f: self.open_menu(x, [e.value for e in ExerciseCategory]))

        # Selector Archivo mejorado
        label_text = "Cambiar GIF/Video" if ex and ex.foto_path else "Subir GIF/Video"
        self.btn_media = MDButton(MDButtonText(text=label_text), style="tonal", size_hint_x=1)
        self.btn_media.bind(on_release=self.open_media_selector)
        
        path_text = os.path.basename(ex.foto_path) if ex and ex.foto_path else "Ninguno"
        self.lbl_media = MDLabel(text=f"Archivo: {path_text}", theme_text_color="Primary", font_style="Label", role="small", size_hint_y=None, height="20dp")
        
        if ex and ex.foto_path:
            self.selected_media_path = ex.foto_path

        content.add_widget(self.tit_in); content.add_widget(self.desc_in)
        content.add_widget(self.mat_in); content.add_widget(self.time_in)
        content.add_widget(self.obj_in); content.add_widget(self.int_in); content.add_widget(self.cat_in)
        content.add_widget(self.btn_media); content.add_widget(self.lbl_media)

        btn_save = MDButton(MDButtonText(text="GUARDAR"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        btn_save.bind(on_release=self.save_exercise)
        
        self.dialog = MDDialog(MDDialogHeadlineText(text=title), MDDialogContentContainer(content, orientation="vertical"), MDDialogButtonContainer(btn_save))
        self.dialog.open()

    def open_menu(self, instance, options):
        if not instance.focus: return
        menu_items = [{"text": opt, "on_release": lambda x=opt: self.set_item(instance, x)} for opt in options]
        MDDropdownMenu(caller=instance, items=menu_items).open()

    def set_item(self, field, text):
        field.text = text
        field.focus = False

    def open_media_selector(self, instance):
        # Crear diálogo con buscador y lista de assets/exercises
        content = MDBoxLayout(orientation='vertical', spacing='10dp', size_hint_y=None, height='450dp', padding="10dp")
        
        search_field = MDTextField(mode="outlined")
        search_field.add_widget(MDTextFieldHintText(text="Buscar video/gif..."))
        content.add_widget(search_field)
        
        self.media_list_box = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="5dp")
        scroll = MDScrollView(); scroll.add_widget(self.media_list_box)
        content.add_widget(scroll)
        
        # Escanear archivos
        media_folder = os.path.join(os.getcwd(), "assets", "exercises")
        if not os.path.exists(media_folder): os.makedirs(media_folder)
        
        all_files = [f for f in os.listdir(media_folder) if f.lower().endswith(('.gif', '.mp4', '.png', '.jpg'))]
        
        def populate_list(filter_text=""):
            self.media_list_box.clear_widgets()
            filtered = [f for f in all_files if filter_text.lower() in f.lower()]
            for f in filtered:
                item = MDListItem(
                    MDListItemHeadlineText(text=f),
                    on_release=lambda x, fname=f: self.select_media_file(fname)
                )
                self.media_list_box.add_widget(item)
                
        search_field.bind(text=lambda x, v: populate_list(v))
        populate_list()
        
        btn_close = MDButton(MDButtonText(text="CANCELAR"), style="tonal")
        btn_close.bind(on_release=lambda x: self.media_selector_dialog.dismiss())
        
        self.media_selector_dialog = MDDialog(
            MDDialogHeadlineText(text="Seleccionar Media"),
            MDDialogContentContainer(content, orientation="vertical"),
            MDDialogButtonContainer(btn_close)
        )
        self.media_selector_dialog.open()

    def select_media_file(self, filename):
        media_path = os.path.join(os.getcwd(), "assets", "exercises", filename)
        self.selected_media_path = media_path
        self.lbl_media.text = f"Seleccionado: {filename}"
        if self.media_selector_dialog:
            self.media_selector_dialog.dismiss()


    def save_exercise(self, instance):
        db = SessionLocal()
        try:
            obj_val = next((e for e in ExerciseObjective if e.value == self.obj_in.text), ExerciseObjective.tactico)
            int_val = next((e for e in ExerciseIntensity if e.value == self.int_in.text), ExerciseIntensity.media)
            cat_val = next((e for e in ExerciseCategory if e.value == self.cat_in.text), ExerciseCategory.tecnico)
            
            data = {
                "titulo": self.tit_in.text, "descripcion": self.desc_in.text, "materiales": self.mat_in.text,
                "tiempo_minutos": int(self.time_in.text or 0), "categoria": cat_val,
                "foto_path": self.selected_media_path, "objetivo_principal": obj_val, "intensidad_carga": int_val
            }

            if self.current_exercise_id:
                ex = db.query(crud.Exercise).get(self.current_exercise_id)
                if ex:
                    ex.titulo = data["titulo"]; ex.descripcion = data["descripcion"]
                    ex.materiales = data["materiales"]; ex.tiempo_minutos = data["tiempo_minutos"]
                    ex.categoria = data["categoria"]
                    if data["foto_path"]: ex.foto_path = data["foto_path"]
                    ex.objetivo_principal = data["objetivo_principal"]; ex.intensidad_carga = data["intensidad_carga"]
                    db.commit()
            else:
                crud.create_exercise(db, **data)
            
            self.dialog.dismiss()
            self.load_exercises()
        except Exception as e: print(e)
        finally: db.close()