from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.label import MDLabel
from kivymd.app import MDApp
from kivymd.uix.textfield import MDTextField, MDTextFieldHintText
from kivymd.uix.button import MDButton, MDButtonText
from kivymd.uix.appbar import MDTopAppBar, MDTopAppBarTitle, MDTopAppBarLeadingButtonContainer, MDActionTopAppBarButton

from database.db_setup import SessionLocal
from models.regulation import Regulation
from utils.pdf_utils import extract_text_from_pdf

class RulesScreen(MDScreen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.name = 'rules_screen'
        self.md_bg_color = (1, 1, 1, 1)
        self.build_ui()

    def build_ui(self):
        layout = MDBoxLayout(orientation='vertical')
        
        # BARRA
        bar = MDTopAppBar(type="small", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        lead = MDTopAppBarLeadingButtonContainer()
        back = MDActionTopAppBarButton(icon="arrow-left", theme_icon_color="Custom", icon_color=(1, 1, 1, 1))
        back.bind(on_release=lambda x: setattr(MDApp.get_running_app().root, 'current', 'main_menu'))
        lead.add_widget(back)
        bar.add_widget(lead)
        bar.add_widget(MDTopAppBarTitle(text="Reglamentos", theme_text_color="Custom", text_color=(1, 1, 1, 1)))
        layout.add_widget(bar)

        # CONTENIDO
        content = MDBoxLayout(orientation='vertical', padding='20dp', spacing='10dp')
        
        # Buscador
        self.search = MDTextField(mode="outlined")
        self.search.add_widget(MDTextFieldHintText(text="Buscar en el reglamento (Ej: 'offside')"))
        content.add_widget(self.search)
        
        btn_search = MDButton(MDButtonText(text="BUSCAR"), style="filled", theme_bg_color="Custom", md_bg_color=(0.55, 0, 0, 1))
        btn_search.bind(on_release=self.perform_search)
        content.add_widget(btn_search)
        
        # Botones Carga
        btn_load = MDButton(MDButtonText(text="CARGAR PDF SUB-17 (Simulado)"), style="tonal")
        btn_load.bind(on_release=self.load_sub16_pdf)
        content.add_widget(btn_load)

        # Resultados
        self.result_label = MDLabel(text="Resultados aquí...", size_hint_y=None, height="300dp", valign="top")
        scroll = MDScrollView()
        scroll.add_widget(self.result_label)
        content.add_widget(scroll)
        
        layout.add_widget(content)
        self.add_widget(layout)

    def load_sub16_pdf(self, instance):
        # Aquí cargaríamos el archivo real. Por ahora simulamos la carga con el texto del prompt.
        db = SessionLocal()
        # Verificar si existe "Reglamento Inferiores Femenino.pdf" en la carpeta
        try:
            text = extract_text_from_pdf("Reglamento Inferiores Femenino.pdf")
            reg = Regulation(categoria="Sub-17", titulo="Reglamento General 2025", contenido=text)
            db.add(reg)
            db.commit()
            self.result_label.text = "Reglamento Sub-17 Cargado Exitosamente."
        except Exception as e:
            self.result_label.text = f"Error: Pon el archivo PDF en la carpeta. {e}"
        finally: db.close()

    def perform_search(self, instance):
        query = self.search.text.lower()
        db = SessionLocal()
        results = db.query(Regulation).all()
        found_text = ""
        for r in results:
            if query in r.contenido.lower():
                # Mostrar fragmento
                idx = r.contenido.lower().find(query)
                start = max(0, idx - 50)
                end = min(len(r.contenido), idx + 200)
                found_text += f"--- {r.categoria} ---\n...{r.contenido[start:end]}...\n\n"
        
        self.result_label.text = found_text if found_text else "No encontrado."
        self.result_label.texture_update()
        db.close()