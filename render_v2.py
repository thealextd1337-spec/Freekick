"""Create original, high-resolution isometric football renders inspired by the reference."""
import bpy
import math
from mathutils import Vector
from pathlib import Path

OUT = Path(__file__).resolve().parent / 'renders-v2'
OUT.mkdir(exist_ok=True)

def mat(name, rgb, metallic=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*rgb,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*rgb,1)
    p.inputs['Roughness'].default_value=.72; p.inputs['Metallic'].default_value=metallic
    return m

yellow=mat('Brazil-inspired yellow',(.91,.77,.08)); blue=mat('royal blue',(.065,.13,.61))
white=mat('warm white',(.94,.94,.86)); ink=mat('navy ink',(.025,.045,.10))
skin=mat('warm skin',(.66,.36,.18)); skin2=mat('medium skin',(.45,.24,.13))
hair=mat('dark hair',(.052,.033,.027)); keeper_yellow=mat('keeper ochre',(.66,.45,.075))
grass=mat('bright pitch',(.12,.55,.19)); stripe=mat('pitch stripe',(.10,.49,.18)); linewhite=mat('chalk white',(.85,.96,.82))
net=mat('net cord',(.78,.89,.78)); metal=mat('goalposts',(.97,.97,.91),.08)
shadowmat=mat('shadow',(.02,.18,.07)); red=mat('boot accent',(.73,.08,.07))

def clear():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def box(name, center, scale, material, bevel=.045):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center); o=bpy.context.object; o.name=name
    o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
        b=o.modifiers.new('soft edges','BEVEL'); b.width=bevel; b.segments=2
        o.modifiers.new('weighted normals','WEIGHTED_NORMAL')
    return o

def ellipsoid(name, center, scale, material, seg=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=12,radius=1,location=center)
    o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(material)
    for face in o.data.polygons: face.use_smooth=True
    return o

def tube(name, a, b, radius, material, vertices=10):
    a,b=Vector(a),Vector(b); d=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=d.length,location=(a+b)/2)
    o=bpy.context.object; o.name=name; o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    o.data.materials.append(material)
    bevel=o.modifiers.new('round caps','BEVEL'); bevel.width=min(radius*.35,.028); bevel.segments=2
    o.modifiers.new('weighted normals','WEIGHTED_NORMAL')
    return o

def camera(location,target,scale,resolution,transparent=True):
    bpy.ops.object.camera_add(location=location); cam=bpy.context.object
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO'; cam.data.ortho_scale=scale; bpy.context.scene.camera=cam
    bpy.ops.object.light_add(type='AREA',location=(-4,3,10)); bpy.context.object.data.energy=1250; bpy.context.object.data.size=7
    bpy.ops.object.light_add(type='AREA',location=(5,-3,7)); bpy.context.object.data.energy=550; bpy.context.object.data.size=5
    s=bpy.context.scene; s.render.engine='BLENDER_EEVEE'; s.render.resolution_x=resolution[0]; s.render.resolution_y=resolution[1]
    s.render.resolution_percentage=100; s.render.film_transparent=transparent
    s.render.image_settings.file_format='PNG'; s.render.image_settings.color_mode='RGBA' if transparent else 'RGB'
    s.render.image_settings.color_depth='8'; s.render.image_settings.compression=25
    s.view_settings.view_transform='Standard'; s.view_settings.look='Medium High Contrast'
    s.camera.data.lens=45

def save(name):
    bpy.context.scene.render.filepath=str(OUT/name)
    bpy.ops.render.render(write_still=True)

def footballer(name, x=0, y=0, shirt=yellow, shorts=blue, sock=white, skinmat=skin, number=9, keeper=False):
    # Facing the field: layered shapes read clearly at both 768px and sprite scale.
    arm_spread=.73 if keeper else .42
    box(name+' torso',(x,y,1.47),(.76,.44,.71),shirt,.13)
    box(name+' collar',(x,y+.01,1.87),(.34,.48,.10),ink,.03)
    box(name+' shorts',(x,y,1.00),(.68,.43,.35),shorts,.055)
    for side in (-1,1):
        sx=x+side*.20
        ellipsoid(name+' thigh',(sx,y, .81),(.18,.19,.31),skinmat)
        tube(name+' sock',(sx,y,.62),(sx+side*.025,y+.02,.23),.115,sock)
        box(name+' boot',(sx+side*.025,y+.15,.12),(.28,.46,.18),ink,.05)
        box(name+' boot trim',(sx+side*.025,y+.35,.13),(.25,.04,.055),red,.01)
        shoulder=(x+side*.43,y,1.68)
        elbow=(x+side*(.57+arm_spread*.18),y+.04,1.45 if keeper else 1.40)
        hand=(x+side*(.60+arm_spread*.42),y+.09,1.20 if keeper else 1.23)
        tube(name+' sleeve',shoulder,elbow,.16,shirt)
        tube(name+' arm',elbow,hand,.105,skinmat)
        ellipsoid(name+' hand',hand,(.13,.13,.11),white if keeper else skinmat)
    ellipsoid(name+' neck',(x,y,1.94),(.15,.15,.16),skinmat)
    ellipsoid(name+' head',(x,y,2.23),(.29,.26,.35),skinmat)
    ellipsoid(name+' hair',(x,y-.025,2.48),(.31,.27,.16),hair)
    # Simple ears and nose, visible from the shared three-quarter camera.
    ellipsoid(name+' ear',(x+.275,y+.01,2.22),(.065,.085,.11),skinmat)
    ellipsoid(name+' nose',(x,y+.245,2.20),(.075,.085,.075),skinmat)
    for sx in (-.105,.105): ellipsoid(name+' eye',(x+sx,y+.244,2.27),(.024,.015,.025),ink,12)
    # Number on the rear and a small chest badge convey football identity.
    box(name+' badge',(x-.22,y+.23,1.64),(.105,.025,.12),blue if shirt==yellow else yellow,.01)

def goal_model():
    left,right=-3.66,3.66; back=-2.6; high=2.44; rear=2.05
    for a,b in [((left,0,0),(left,0,high)),((right,0,0),(right,0,high)),((left,0,high),(right,0,high)),
                ((left,0,high),(left,back,rear)),((right,0,high),(right,back,rear)),
                ((left,back,rear),(right,back,rear)),((left,back,0),(right,back,0))]: tube('white goal frame',a,b,.075,metal,16)
    for i in range(18):
        x=left+(right-left)*i/17
        tube('back net vertical',(x,back,0),(x,back,rear),.013,net,6)
        tube('roof net length',(x,0,high),(x,back,rear),.012,net,6)
    for j in range(7):
        z=rear*j/6
        tube('back net horizontal',(left,back,z),(right,back,z),.012,net,6)
    for j in range(6):
        y=back*j/5
        z=high+(rear-high)*j/5
        tube('roof net horizontal',(left,y,z),(right,y,z),.012,net,6)
    for side in (left,right):
        for j in range(8):
            y=back*j/7
            tube('side net upright',(side,y,0),(side,y,high+(rear-high)*j/7),.012,net,6)
        for j in range(6):
            ratio=j/5
            tube('side net length',(side,0,high*ratio),(side,back,rear*ratio),.012,net,6)

def pitch():
    for k in range(8): box('mown grass',(-8+k*2.3,7,-.065),(2.3,27,.09),grass if k%2 else stripe,0)
    for x in (-13,13): tube('box side',(x,0,.005),(x,16.5,.005),.035,linewhite,8)
    tube('box top',(-13,16.5,.005),(13,16.5,.005),.035,linewhite,8)
    tube('goal line',(-14,0,.005),(14,0,.005),.035,linewhite,8)
    for x in (-6,6): tube('six-yard side',(x,0,.01),(x,5.5,.01),.028,linewhite,8)
    tube('six-yard top',(-6,5.5,.01),(6,5.5,.01),.028,linewhite,8)

def render_player(filename,shirt,shorts,sock,skinmat,keeper=False):
    clear(); footballer(filename,shirt=shirt,shorts=shorts,sock=sock,skinmat=skinmat,keeper=keeper)
    camera((5,8,5),(0,0,1.25),3.25,(768,768)); save(filename+'.png')

render_player('player-home',yellow,blue,white,skin2)
render_player('player-away',white,ink,white,skin)
render_player('keeper',keeper_yellow,ink,keeper_yellow,skin2,True)
clear(); goal_model(); camera((10,14,8),(0,-1,1.0),10.2,(1280,768)); save('goal.png')

clear(); pitch(); goal_model()
footballer('yellow striker',x=-5,y=12,shirt=yellow,shorts=blue,sock=white,skinmat=skin2)
footballer('white defender',x=1.2,y=8,shirt=white,shorts=ink,sock=white,skinmat=skin)
footballer('keeper',x=.1,y=1.4,shirt=keeper_yellow,shorts=ink,sock=keeper_yellow,skinmat=skin2,keeper=True)
camera((21,26,18),(0,6,0),31,(1600,900),False); save('scene-preview.png')
print('Saved high-resolution renders to',OUT)
