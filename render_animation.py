"""Render additional Blender poses for the 2.5D kick and goalkeeper animations."""
import math
import sys
from pathlib import Path
from mathutils import Matrix, Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_v2 import clear, footballer, camera, save, yellow, blue, white, skin2, keeper_yellow, ink, OUT

for pose in (1, 2, 3):
    clear()
    footballer('kicker', shirt=yellow, shorts=blue, sock=white, skinmat=skin2, kick_phase=pose)
    camera((5, 8, 5), (0, 0, 1.25), 3.25, (768, 768))
    save(f'player-kick-{pose}.png')

for side, label in ((-1, 'left'), (1, 'right')):
    clear()
    footballer('keeper dive', shirt=keeper_yellow, shorts=ink, sock=keeper_yellow, skinmat=skin2, keeper=True)
    pivot = Vector((0, 0, 1.2))
    rotation = Matrix.Rotation(side * math.radians(46), 4, 'Y')
    shift = Vector((side * .42, 0, -.36))
    transform = Matrix.Translation(pivot + shift) @ rotation @ Matrix.Translation(-pivot)
    for obj in list(__import__('bpy').data.objects):
        if obj.type == 'MESH':
            obj.matrix_world = transform @ obj.matrix_world
    camera((5, 8, 5), (0, 0, 1.0), 4.5, (768, 768))
    save(f'keeper-dive-{label}.png')

print('Rendered animated poses to', OUT)
