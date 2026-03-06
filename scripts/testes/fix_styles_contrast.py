"""
Script de Teste/Apoio: fix_styles_contrast.py

Verifica ou ajusta automaticamente questões de contraste e estilos do frontend
(CSS) em um contexto de teste visual.
"""

import re

file_path = "static/css/styles.css"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Queremos substituir as chaves em :root relacionadas a variáveis dinâmicas.
# Specifically lines around 51-60.
# O conteúdo se parece com:
#     /* --- DYNAMIC VARIABLES (COLOR-MIX) --- */
#     /* Backgrounds */
#     --bg-body: color-mix(in srgb, var(--slate-50-light), var(--slate-50-dark) var(--theme-inv));
# ...

# Queremos inserir:
#     /* --- DYNAMIC VARIABLES (COLOR-MIX) --- */
#     /* Theme interpolation variables */
#     --theme-inv: 0%; /* Controls Background (Linear) */
#     --text-inv: var(--theme-inv); /* Controls Text (Computed curve for contrast) */
#
#     /* Backgrounds */
# ...
#     /* Text */
#     --text-main: color-mix(in srgb, var(--slate-900-light), #f8fafc var(--text-inv));
# ...

# Define a assinatura do bloco antigo (simplificada)
start_marker = "/* --- DYNAMIC VARIABLES (COLOR-MIX) --- */"
# We can find where this starts.

if start_marker in content:
    # Iremos reconstruir a seção de variáveis dinâmicas.
    # A seção termina em "/* Borders */" ou similar?
    # Não, vamos apenas substituir as linhas que conhecemos.
    
    # New block content
    new_block = """    /* --- DYNAMIC VARIABLES (COLOR-MIX) --- */
    /* Theme interpolation variables */
    --theme-inv: 0%; /* Controls Background (Linear) */
    --text-inv: var(--theme-inv); /* Controls Text (Computed curve for contrast) */

    /* Backgrounds */
    --bg-body: color-mix(in srgb, var(--slate-50-light), var(--slate-50-dark) var(--theme-inv));
    --bg-surface: color-mix(in srgb, #ffffff, #1e293b var(--theme-inv));
    --bg-sidebar: color-mix(in srgb, #ffffff, #1e293b var(--theme-inv));
    
    /* Text */
    --text-main: color-mix(in srgb, var(--slate-900-light), #f8fafc var(--text-inv));
    --text-secondary: color-mix(in srgb, var(--slate-500-light), #94a3b8 var(--text-inv));
    --text-tertiary: color-mix(in srgb, var(--slate-400-light), #64748b var(--text-inv));"""
    
    # Precisamos encontrar o intervalo para substituir.
    # It starts at start_marker.
    # It ends before "/* Borders */"
    
    end_marker = "/* Borders */"
    
    parts = content.split(start_marker)
    if len(parts) > 1:
        pre = parts[0]
        rest = parts[1]
        
        if end_marker in rest:
            custom_parts = rest.split(end_marker)
            post = custom_parts[1]
            # custom_parts[0] é o bloco antigo que queremos substituir
            
            new_content = pre + new_block + "\n\n    " + end_marker + post
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print("Successfully updated styles.css")
        else:
            print("Could not find end marker '/* Borders */'")
    else:
        print("Could not find start marker")
else:
    print("Could not find start marker in content")
