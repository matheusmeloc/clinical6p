
import re

file_path = "static/css/styles.css"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We want to replace the keys in :root related to dynamic variables.
# Specifically lines around 51-60.
# The content looks like:
#     /* --- DYNAMIC VARIABLES (COLOR-MIX) --- */
#     /* Backgrounds */
#     --bg-body: color-mix(in srgb, var(--slate-50-light), var(--slate-50-dark) var(--theme-inv));
# ...

# We want to insert:
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

# Define the old block signature (simplified)
start_marker = "/* --- DYNAMIC VARIABLES (COLOR-MIX) --- */"
# We can find where this starts.

if start_marker in content:
    # We will reconstruct the dynamic vars section.
    # The section ends at "/* Borders */" or similar?
    # No, let's just replace the lines we know.
    
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
    
    # We need to find the range to replace.
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
            # custom_parts[0] is the old block we want to replace
            
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
