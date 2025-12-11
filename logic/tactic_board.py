import matplotlib.pyplot as plt
from typing import List, Tuple, Dict
from models.player import Player, Category
from utils.crud import get_player_by_id

# El campo se normaliza de 0 a 100 para simplificar el plotting.
FIELD_X_MAX = 100
FIELD_Y_MAX = 68 

def draw_field(ax):
    """
    Dibuja la estructura básica de un campo de fútbol (dimensión 100x68).
    """
    # Campo (límites)
    ax.plot([0, FIELD_X_MAX], [0, 0], color="white")
    ax.plot([0, FIELD_X_MAX], [FIELD_Y_MAX, FIELD_Y_MAX], color="white")
    ax.plot([0, 0], [0, FIELD_Y_MAX], color="white")
    ax.plot([FIELD_X_MAX, FIELD_X_MAX], [0, FIELD_Y_MAX], color="white")
    
    # Línea central
    ax.plot([FIELD_X_MAX/2, FIELD_X_MAX/2], [0, FIELD_Y_MAX], color="white")
    
    # Círculo central (radio 9.15, aprox 14% de Y_MAX)
    center_circle = plt.Circle((FIELD_X_MAX/2, FIELD_Y_MAX/2), 9.15, color="white", fill=False)
    ax.add_artist(center_circle)
    
    # Área grande (16.5m) en ambos lados (aprox 25% de X_MAX, 50% de Y_MAX)
    box_width = FIELD_X_MAX * 0.165 
    box_height = FIELD_Y_MAX * 0.5 
    
    # Área de 16.5m (Derecha)
    ax.plot([FIELD_X_MAX, FIELD_X_MAX - box_width], [FIELD_Y_MAX/2 - box_height/2, FIELD_Y_MAX/2 - box_height/2], color="white")
    ax.plot([FIELD_X_MAX, FIELD_X_MAX - box_width], [FIELD_Y_MAX/2 + box_height/2, FIELD_Y_MAX/2 + box_height/2], color="white")
    ax.plot([FIELD_X_MAX - box_width, FIELD_X_MAX - box_width], [FIELD_Y_MAX/2 - box_height/2, FIELD_Y_MAX/2 + box_height/2], color="white")
    
    # Configuración de ejes
    ax.set_xlim(0, FIELD_X_MAX)
    ax.set_ylim(0, FIELD_Y_MAX)
    ax.set_facecolor("forestgreen")
    ax.set_aspect('equal', adjustable='box')
    ax.axis('off') # Ocultar ejes de números

def plot_formation(db, 
                   formation_data: List[Tuple[int, float, float]],
                   title: str = "Alineación Palometas Femenino"):
    """
    Dibuja la formación en el campo y DEVUELVE la figura de Matplotlib.
    
    (Se eliminó plt.show() para la integración con Kivy)
    """
    fig, ax = plt.subplots(figsize=(10, 6.8))
    draw_field(ax)
    
    # ... (Lógica para iterar sobre formation_data y dibujar círculos/nombres) ...
    # (El código de plot_formation que dibuja los círculos permanece igual)

    for player_id, x, y in formation_data:
        player = get_player_by_id(db, player_id)
        
        if player:
            # Usar solo la primera palabra del nombre o apellido
            name_label = player.nombre_completo.split()[0].upper() 
            color = 'red' if player.categoria_actual == Category.primera else 'orange'
            
            # Dibujar el círculo (la jugadora)
            ax.scatter(x, y, s=400, color=color, edgecolors='black', linewidth=1, zorder=3)
            
            # Colocar el nombre (etiqueta)
            ax.text(x, y, name_label, 
                    fontsize=8, 
                    color='white', 
                    ha='center', 
                    va='center', 
                    weight='bold', 
                    zorder=4)

    ax.set_title(title, color='white', fontsize=14, pad=20)
    plt.tight_layout() # Ajuste para Kivy
    return fig # DEVOLVEMOS LA FIGURA