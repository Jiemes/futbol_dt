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
from kivymd.uix.dialog import MDDialog, MDDialogHeadlineText, MDDialogContentContainer, MDDialogButtonContainer
from kivymd.uix.label import MDLabel

class AttendanceScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'attendance_screen'
        self.md_bg_color = (1, 1, 1, 1)
        self.selected_players = set()
        self.goals_inputs = {} # Diccionario para guardar referencias a los inputs de goles
        self.score_inputs = {} # Nuevo: Diccionario para puntajes individuales
        self.current_category = Category.sub_16 # Se mantiene el enum key aunque el valor sea Sub-17
        
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
        self.cat_field = MDTextField(mode="outlined", text="Sub-17", readonly=True)
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
        
        # ROW 3: DATOS DE CARGA
        row3 = MDBoxLayout(orientation='horizontal', spacing='10dp', adaptive_height=True)
        
        self.duration_field = MDTextField(mode="outlined", text="90")
        self.duration_field.add_widget(MDTextFieldHintText(text="Duración (min)"))
        
        self.intensity_field = MDTextField(mode="outlined", text="5")
        self.intensity_field.add_widget(MDTextFieldHintText(text="Intensidad (1-10)"))
        
        row3.add_widget(self.duration_field)
        row3.add_widget(self.intensity_field)
        
        controls.add_widget(row1)
        controls.add_widget(row2)
        controls.add_widget(row3)
        
        # ROW 4: BOTONES CONTROLES
        row4 = MDBoxLayout(orientation='horizontal', spacing='10dp', adaptive_height=True)
        btn_load = MDButton(MDButtonText(text="BUSCAR (Lote)"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1), size_hint_x=0.5)
        btn_load.bind(on_release=lambda x: self.load_players())
        
        btn_history = MDButton(MDButtonText(text="HISTORIAL"), style="tonal", theme_bg_color="Custom", md_bg_color=(0.2, 0.2, 0.2, 1), size_hint_x=0.5)
        btn_history.bind(on_release=self.show_history_search)
        
        row4.add_widget(btn_load); row4.add_widget(btn_history)
        controls.add_widget(row4)
        
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
        menu_items = [{"text": "Sub-17", "on_release": lambda: self.set_cat(Category.sub_16)}, {"text": "Primera", "on_release": lambda: self.set_cat(Category.primera)}]
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
        self.score_inputs = {} # Reiniciar referencias de inputs puntaje
        
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
                goal_field.add_widget(MDTextFieldHintText(text="Goles"))
                self.goals_inputs[p.id] = goal_field
                
                # NUEVO: Input de Puntaje (1-10)
                score_field = MDTextField(mode="outlined", text="6", size_hint_x=None, width="50dp", pos_hint={"center_y": .5})
                score_field.add_widget(MDTextFieldHintText(text="Ptos"))
                self.score_inputs[p.id] = score_field

                # Añadir al item antes del checkbox (que es trailing)
                item.add_widget(score_field)
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
                
                # Obtener puntaje del input correspondiente
                score_val = 0
                if pid in self.score_inputs:
                    try:
                        score_val = int(self.score_inputs[pid].text)
                    except: score_val = 6 # Default average

                new_act = PlayerActivity(
                    player_id=pid,
                    fecha=fecha_val,
                    tipo=act_type,
                    goles=goles_val,
                    detalle=detalle_txt,
                    # NUEVOS CAMPOS
                    minutos=int(self.duration_field.text) if self.duration_field.text.isdigit() else 0,
                    intensidad=int(self.intensity_field.text) if self.intensity_field.text.isdigit() else 0,
                    performance_score=score_val
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

    # =========================================================
    # HISTORIAL Y EDICION
    # =========================================================
    def show_history_search(self, instance):
        content = MDBoxLayout(orientation='vertical', spacing='10dp', size_hint_y=None, height='150dp')
        
        self.hist_date = MDTextField(mode="outlined", text=str(date.today()))
        self.hist_date.add_widget(MDTextFieldHintText(text="Fecha (YYYY-MM-DD)"))
        
        btn_search = MDButton(MDButtonText(text="BUSCAR ACTIVIDADES"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        btn_search.bind(on_release=self.perform_history_search)
        
        content.add_widget(self.hist_date)
        content.add_widget(btn_search)
        
        self.dialog_hist = MDDialog(MDDialogHeadlineText(text="Historial"), MDDialogContentContainer(content, orientation="vertical"))
        self.dialog_hist.open()

    def perform_history_search(self, instance):
        try:
            d_val = date.fromisoformat(self.hist_date.text)
            self.dialog_hist.dismiss()
            self.show_daily_activities(d_val)
        except:
            MDSnackbar(MDSnackbarText(text="Fecha inválida"), background_color=(0.2, 0.2, 0.2, 1)).open()

    def show_daily_activities(self, fecha):
        db = SessionLocal()
        acts = crud.get_activities_by_date(db, fecha)
        
        content = MDBoxLayout(orientation='vertical', size_hint_y=None, height='400dp', padding="5dp")
        
        scroll = MDScrollView()
        list_box = MDBoxLayout(orientation='vertical', adaptive_height=True, spacing="5dp")
        
        if not acts:
            list_box.add_widget(MDLabel(text="No se encontraron registros.", halign="center"))
        
        for act in acts:
            # Obtener nombre jugador
            p_name = act.player.nombre_completo if act.player else "Desconocido"
            
            item = MDListItem(
                MDListItemHeadlineText(text=f"{p_name} - {act.tipo}"),
                MDListItemSupportingText(text=f"Goles: {act.goles} | Ptos: {act.performance_score} | Min: {act.minutos}"),
                theme_bg_color="Custom", md_bg_color=(0.95, 0.95, 0.95, 1)
            )
            item.bind(on_release=lambda x, aid=act.id: self.show_edit_activity_dialog(aid))
            list_box.add_widget(item)

        scroll.add_widget(list_box)
        content.add_widget(scroll)
        
        btn_close = MDButton(MDButtonText(text="CERRAR"), style="tonal")
        self.dialog_list = MDDialog(MDDialogHeadlineText(text=f"Registros: {fecha}"), MDDialogContentContainer(content, orientation="vertical"), MDDialogButtonContainer(btn_close))
        btn_close.bind(on_release=lambda x: self.dialog_list.dismiss())
        self.dialog_list.open()
        db.close()

    def show_edit_activity_dialog(self, act_id):
        db = SessionLocal()
        act = db.query(PlayerActivity).get(act_id)
        if not act: 
            db.close()
            return

        p_name = act.player.nombre_completo if act.player else "???"
        
        content = MDBoxLayout(orientation='vertical', spacing='10dp', size_hint_y=None, height='300dp')
        
        self.edit_goals = MDTextField(mode="outlined", text=str(act.goles or 0))
        self.edit_goals.add_widget(MDTextFieldHintText(text="Goles"))
        
        self.edit_score = MDTextField(mode="outlined", text=str(act.performance_score or 6))
        self.edit_score.add_widget(MDTextFieldHintText(text="Puntaje (1-10)"))
        
        self.edit_mins = MDTextField(mode="outlined", text=str(act.minutos or 0))
        self.edit_mins.add_widget(MDTextFieldHintText(text="Minutos"))

        btns_box = MDBoxLayout(orientation='horizontal', spacing='10dp', adaptive_height=True)
        
        btn_save = MDButton(MDButtonText(text="GUARDAR CAMBIOS"), style="filled", theme_bg_color="Custom", md_bg_color=(0, 0.6, 0, 1))
        btn_save.bind(on_release=lambda x: self.save_activity_edit(act_id))
        
        btn_del = MDButton(MDButtonText(text="BORRAR REGISTRO"), style="tonal", theme_bg_color="Custom", md_bg_color=(0.8, 0, 0, 1))
        btn_del.bind(on_release=lambda x: self.delete_activity_action(act_id))
        
        btns_box.add_widget(btn_save); btns_box.add_widget(btn_del)
        
        content.add_widget(self.edit_goals); content.add_widget(self.edit_score); content.add_widget(self.edit_mins); content.add_widget(btns_box)
        
        self.dialog_edit = MDDialog(MDDialogHeadlineText(text=f"Editar: {p_name}"), MDDialogContentContainer(content, orientation="vertical"))
        self.dialog_edit.open()
        db.close()

    def save_activity_edit(self, act_id):
        db = SessionLocal()
        try:
            updates = {
                "goles": int(self.edit_goals.text),
                "performance_score": int(self.edit_score.text),
                "minutos": int(self.edit_mins.text)
            }
            crud.update_activity(db, act_id, updates)
            self.dialog_edit.dismiss()
            self.dialog_list.dismiss() # Cerrar lista para forzar recarga si se quiere (o no, pero mejor cerrar para simplificar)
            MDSnackbar(MDSnackbarText(text="Registro actualizado"), background_color=(0.2, 0.2, 0.2, 1)).open()
        except Exception as e:
            print(e)
            MDSnackbar(MDSnackbarText(text="Error al actualizar"), background_color=(0.2, 0.2, 0.2, 1)).open()
        finally: db.close()

    def delete_activity_action(self, act_id):
        db = SessionLocal()
        try:
            crud.delete_activity(db, act_id)
            self.dialog_edit.dismiss()
            self.dialog_list.dismiss()
            MDSnackbar(MDSnackbarText(text="Registro eliminado"), background_color=(0.2, 0.2, 0.2, 1)).open()
        except:
             MDSnackbar(MDSnackbarText(text="Error al eliminar"), background_color=(0.2, 0.2, 0.2, 1)).open()
        finally: db.close()