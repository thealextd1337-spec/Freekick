"""Render the free-kick taker facing the goal, seen from behind."""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_v2 as art

art.OUT = Path(__file__).resolve().parent / 'assets'
rotation = Matrix.Rotation(math.pi, 4, 'Z')

for phase in range(4):
    art.clear()
    art.footballer(
        'goal-facing kicker', shirt=art.yellow, shorts=art.blue,
        sock=art.white, skinmat=art.skin2, kick_phase=phase
    )
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.matrix_world = rotation @ obj.matrix_world
    art.camera((5, 8, 5), (0, 0, 1.25), 3.25, (768, 768))
    art.save('player-back.png' if phase == 0 else f'player-kick-back-{phase}.png')

print('Rendered goal-facing player poses')
