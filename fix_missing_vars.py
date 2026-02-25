
import re

file_path = "static/css/styles.css"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject Dynamic Palette Mappings
# We'll look for the end of the indigo palette section and inject there.
palette_end_marker = "/* --- DYNAMIC VARIABLES (COLOR-MIX) --- */"
dynamic_palette_block = """
    /* --- MAPPED PALETTE (Dynamic) --- */
    --slate-50: color-mix(in srgb, var(--slate-50-light), var(--slate-50-dark) var(--theme-inv));
    --slate-100: color-mix(in srgb, var(--slate-100-light), var(--slate-100-dark) var(--theme-inv));
    --slate-200: color-mix(in srgb, var(--slate-200-light), var(--slate-200-dark) var(--theme-inv));
    --slate-300: color-mix(in srgb, var(--slate-300-light), var(--slate-300-dark) var(--theme-inv));
    --slate-400: color-mix(in srgb, var(--slate-400-light), var(--slate-400-dark) var(--theme-inv));
    --slate-500: color-mix(in srgb, var(--slate-500-light), var(--slate-500-dark) var(--theme-inv));
    --slate-600: color-mix(in srgb, var(--slate-600-light), var(--slate-600-dark) var(--theme-inv));
    --slate-700: color-mix(in srgb, var(--slate-700-light), var(--slate-700-dark) var(--theme-inv));
    --slate-800: color-mix(in srgb, var(--slate-800-light), var(--slate-800-dark) var(--theme-inv));
    --slate-900: color-mix(in srgb, var(--slate-900-light), var(--slate-900-dark) var(--theme-inv));

    --indigo-50: color-mix(in srgb, var(--indigo-50-light), var(--indigo-50-dark) var(--theme-inv));
    --indigo-100: color-mix(in srgb, var(--indigo-100-light), var(--indigo-100-dark) var(--theme-inv));
    --indigo-500: color-mix(in srgb, var(--indigo-500-light), var(--indigo-500-dark) var(--theme-inv));
    --indigo-600: color-mix(in srgb, var(--indigo-600-light), var(--indigo-600-dark) var(--theme-inv));
    --indigo-700: color-mix(in srgb, var(--indigo-700-light), var(--indigo-700-dark) var(--theme-inv));

"""

if "/* --- MAPPED PALETTE (Dynamic) --- */" not in content:
    content = content.replace(palette_end_marker, dynamic_palette_block + "\n    " + palette_end_marker)
    print("Injected dynamic palette.")

# 2. Fix .card-dark color
# Old: color: white;
# New: color: var(--slate-50);
card_dark_pattern = r"(\.card-dark \.kpi-icon-wrapper\s*\{[^}]*color:\s*)white(\s*;[^}]*\})"
replacement = r"\1var(--slate-50)\2"

new_content = re.sub(card_dark_pattern, replacement, content)
if new_content != content:
    print("Updated .card-dark color.")
    content = new_content
else:
    print("Could not match .card-dark block.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
