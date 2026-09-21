"""Render the original goal frame without its fixed net."""
import sys
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_v2 as art

art.OUT = Path(__file__).resolve().parent / 'assets'
art.clear()
left, right, back, high, rear = -3.66, 3.66, -2.6, 2.44, 2.05
for a, b in [
    ((left, 0, 0), (left, 0, high)),
    ((right, 0, 0), (right, 0, high)),
    ((left, 0, high), (right, 0, high)),
    ((left, 0, high), (left, back, rear)),
    ((right, 0, high), (right, back, rear)),
    ((left, back, rear), (right, back, rear)),
    ((left, back, 0), (right, back, 0)),
]:
    art.tube('white goal frame', a, b, .075, art.metal, 16)
art.camera((10, 14, 8), (0, -1, 1.0), 10.2, (1280, 768))
art.save('goal-frame.png')
for name, point in {
    'origin': (0, 0, 0), 'x': (1, 0, 0),
    'y': (0, 1, 0), 'z': (0, 0, 1),
    'left': (left, 0, 0), 'right': (right, 0, 0),
}.items():
    uv = world_to_camera_view(bpy.context.scene, bpy.context.scene.camera, Vector(point))
    print(f'GOAL_MAP {name} {uv.x * 1280:.3f} {(1 - uv.y) * 768:.3f}')
