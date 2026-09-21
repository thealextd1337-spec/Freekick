"""Render original low-poly football sprites for the browser demo."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent / "assets"
OUT.mkdir(exist_ok=True)

def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = (*color, 1)
    m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = .85
    return m

grass = material('grass kit', (.32, .73, .27))
blue = material('blue kit', (.13, .43, .88))
gold = material('keeper kit', (1, .72, .18))
skin = material('skin', (.67, .39, .23))
dark = material('shorts and boots', (.07, .1, .16))
white = material('white', (.94, .94, .86))
black = material('ball detail', (.08, .1, .12))

def cube(name, loc, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name
    o.dimensions = scale; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    bevel = o.modifiers.new('subtle bevel', 'BEVEL'); bevel.width = .055; bevel.segments = 1
    o.modifiers.new('weighted normals', 'WEIGHTED_NORMAL')
    return o

def sphere(name, loc, radius, mat, segments=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=8, radius=radius, location=loc)
    o=bpy.context.object; o.name=name; o.data.materials.append(mat)
    return o

def setup():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    bpy.ops.object.camera_add(location=(4,-6,5))
    cam=bpy.context.object; direction=Vector((0,0,1.2))-cam.location
    cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=3.9
    bpy.context.scene.camera=cam
    bpy.ops.object.light_add(type='AREA', location=(-3,-4,7)); bpy.context.object.data.energy=650; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=5
    world=bpy.context.scene.world; world.color=(.5,.5,.5)
    scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE'
    scene.render.resolution_x=192; scene.render.resolution_y=192; scene.render.resolution_percentage=100
    scene.render.film_transparent=True; scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
    scene.view_settings.view_transform='Standard'

def save(name):
    bpy.context.scene.render.filepath=str(OUT / name)
    bpy.ops.render.render(write_still=True)

def player(name, shirt):
    setup()
    cube('left boot',(-.19,0,.10),(.26,.38,.18),dark)
    cube('right boot',(.19,0,.10),(.26,.38,.18),dark)
    cube('left sock',(-.18,0,.42),(.19,.22,.52),white)
    cube('right sock',(.18,0,.42),(.19,.22,.52),white)
    cube('shorts',(0,0,.88),(.67,.39,.36),dark)
    cube('shirt',(0,0,1.38),(.78,.42,.76),shirt)
    cube('left arm',(-.49,0,1.33),(.20,.24,.70),skin)
    cube('right arm',(.49,0,1.33),(.20,.24,.70),skin)
    sphere('head',(0,0,1.98),.31,skin)
    cube('hair',(0,.04,2.23),(.56,.53,.13),dark)
    save(name)

player('player-home.png',grass)
player('player-away.png',blue)
player('keeper.png',gold)
setup()
sphere('football',(0,0,1.12),.54,white,16)
for a in range(5):
    t=a*2*math.pi/5
    sphere('ball panel',(math.cos(t)*.45,math.sin(t)*.45,1.25),.11,black,8)
save('ball.png')
print('Rendered sprites to',OUT)
