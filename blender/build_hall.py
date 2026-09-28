"""Build a stylized Chinese hall (殿堂) and export it as public/models/hall.glb.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P blender/build_hall.py

Blender is Z-up; the glTF exporter converts to Y-up, so the front of the hall (-Y here)
becomes +Z in three.js. Every material has a stable name ("Wall", "Roof", ...) so the
app can swap in its own toon materials and recolor the hall per scene.
"""
import math
import os

import bmesh
import bpy
from mathutils import Vector

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "models", "hall.glb")

# Body dimensions (the app scales from these defaults).
W, D, H = 3.2, 2.0, 1.7
BASE_H = 0.25
EAVE_Z = BASE_H + H + 0.12
EX, EY = W / 2 + 0.75, D / 2 + 0.75  # roof overhang half-extents
ROOF_H = 1.15
RX = EX - EY  # half-length of the main ridge (hip roof)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.85
    return m


def hexrgb(h):
    # sRGB hex -> linear floats for Blender.
    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(lin((h >> s) & 255) for s in (16, 8, 0))


MATS = {}


def mat(name):
    return MATS[name]


def obj_from_bmesh(name, bm, mat_name, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat(mat_name))
    return ob


def box(name, size, loc, mat_name, bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])) + Vector(loc)
    ob = obj_from_bmesh(name, bm, mat_name)
    if bevel:
        mod = ob.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    return ob


def cylinder(name, r, h, loc, mat_name, segs=16, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r2 if r2 is not None else r, depth=h)
    for v in bm.verts:
        v.co += Vector(loc)
    return obj_from_bmesh(name, bm, mat_name, smooth=True)


def curve_tube(name, points, radius, mat_name, closed=False):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1.0)
    sp.use_cyclic_u = closed
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat(mat_name))
    return ob


# ---------------------------------------------------------------- roof surface
def roof_z(x, y):
    """Concave hip roof with eaves that sweep up toward the corners."""
    dx = EX - abs(x)          # distance to side eave
    dy = EY - abs(y)          # distance to front/back eave
    d = min(dx, dy)
    t = max(0.0, min(1.0, d / EY))
    z = EAVE_Z + ROOF_H * (t ** 1.7)
    # corner upturn (翘角)
    c = max(0.0, 1.0 - (dx + dy) / 1.1)
    z += 0.3 * c ** 2.2
    # gentle rise of the eave line toward the corners
    z += 0.10 * (abs(x) / EX) ** 4 * (1 - t) + 0.10 * (abs(y) / EY) ** 4 * (1 - t)
    return z


def tile_offset(x, y):
    """Rows of rounded tiles running down each slope."""
    dx, dy = EX - abs(x), EY - abs(y)
    along = x if dy < dx else y  # tiles run perpendicular to the nearest eave
    return 0.028 * abs(math.sin(along * math.pi / 0.2))


def build_roof():
    nx, ny = 132, 64
    bm = bmesh.new()
    verts = []
    for j in range(ny + 1):
        row = []
        y = -EY + 2 * EY * j / ny
        for i in range(nx + 1):
            x = -EX + 2 * EX * i / nx
            z = roof_z(x, y) + tile_offset(x, y)
            row.append(bm.verts.new((x, y, z)))
        verts.append(row)
    for j in range(ny):
        for i in range(nx):
            bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
    ob = obj_from_bmesh("Roof", bm, "Roof", smooth=True)
    sol = ob.modifiers.new("solid", "SOLIDIFY")
    sol.thickness = 0.12
    sol.offset = -1
    return ob


def surface_path(p0, p1, n=40, lift=0.07):
    pts = []
    for k in range(n + 1):
        u = k / n
        x = p0[0] + (p1[0] - p0[0]) * u
        y = p0[1] + (p1[1] - p0[1]) * u
        pts.append((x, y, roof_z(x, y) + lift))
    return pts


def build_ridges():
    top = EAVE_Z + ROOF_H
    # main ridge
    box("Ridge", (2 * RX + 0.3, 0.2, 0.22), (0, 0, top + 0.1), "Ridge", bevel=0.03)
    # hip ridges running down to each upturned corner
    for sx in (-1, 1):
        for sy in (-1, 1):
            curve_tube(f"Hip{sx}{sy}", surface_path((sx * RX, 0), (sx * EX, sy * EY)), 0.065, "Ridge")
    # ridge-end ornaments (鸱吻), a stylized upward curl
    for sx in (-1, 1):
        pts = []
        for k in range(24):
            a = k / 23 * math.pi * 1.35
            r = 0.2 * (1 - k / 40)
            pts.append((sx * (RX + 0.05 + r * math.sin(a) * 0.6), 0, top + 0.2 + r * (1 - math.cos(a))))
        curve_tube(f"Chiwen{sx}", pts, 0.06, "Ridge")
    # corner finials
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (EX - 0.06), sy * (EY - 0.06)
            cylinder(f"Finial{sx}{sy}", 0.05, 0.16, (x, y, roof_z(x, y) + 0.12), "Trim", segs=8, r2=0.02)
    # eave fascia: a painted band that follows the sweep of the eaves
    ring = []
    n = 40
    corners = [(-EX, -EY), (EX, -EY), (EX, EY), (-EX, EY)]
    for a, b in zip(corners, corners[1:] + corners[:1]):
        for k in range(n):
            u = k / n
            x, y = a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u
            ring.append((x * 0.985, y * 0.985, roof_z(x, y) - 0.08))
    curve_tube("Fascia", ring, 0.05, "Trim", closed=True)


# ---------------------------------------------------------------- hall body
def build_body():
    box("Base", (W + 0.9, D + 0.9, BASE_H), (0, 0, BASE_H / 2), "Base", bevel=0.03)
    for k, (w, dy) in enumerate([(1.4, 0.18), (1.2, 0.36)]):
        box(f"Step{k}", (w, 0.2, BASE_H * (1 - k * 0.45)), (0, -(D / 2 + 0.45) - dy + 0.09, BASE_H * (1 - k * 0.45) / 2), "Base", bevel=0.02)
    box("Walls", (W, D, H), (0, 0, BASE_H + H / 2), "Wall")
    # porch columns and corner columns
    col_x = [-W / 2 - 0.1, -W / 6, W / 6, W / 2 + 0.1]
    for i, x in enumerate(col_x):
        for y in (-(D / 2 + 0.3), D / 2 + 0.1):
            cylinder(f"Col{i}{y > 0}", 0.1, H + 0.12, (x, y, BASE_H + (H + 0.12) / 2), "Pillar", segs=14)
            cylinder(f"ColBase{i}{y > 0}", 0.15, 0.08, (x, y, BASE_H + 0.04), "Base", segs=12)
            # simple bracket set (斗拱) on each column
            box(f"Dou{i}{y > 0}", (0.26, 0.26, 0.1), (x, y, EAVE_Z - 0.05), "Trim", bevel=0.01)
            box(f"Gong{i}{y > 0}", (0.5, 0.12, 0.08), (x, y, EAVE_Z + 0.04), "Pillar", bevel=0.01)
    # lintel beams (painted)
    for y in (-(D / 2 + 0.3), D / 2 + 0.1):
        box(f"Lintel{y > 0}", (W + 0.5, 0.14, 0.18), (0, y, BASE_H + H - 0.02), "Pillar", bevel=0.01)
        box(f"Band{y > 0}", (W + 0.4, 0.15, 0.08), (0, y, BASE_H + H - 0.17), "Trim")
    # porch ceiling to close the gap under the eaves
    box("PorchCeil", (W + 0.6, 0.45, 0.05), (0, -(D / 2 + 0.15), EAVE_Z - 0.02), "Pillar")
    # double doors with lattice
    front = -D / 2 - 0.02
    for side in (-1, 1):
        cx = side * 0.28
        box(f"Door{side}", (0.54, 0.05, 1.25), (cx, front, BASE_H + 0.63), "Door", bevel=0.01)
        for r in range(4):
            box(f"DoorBar{side}{r}", (0.44, 0.03, 0.025), (cx, front - 0.03, BASE_H + 0.75 + r * 0.13), "Lattice")
        for c in range(3):
            box(f"DoorPost{side}{c}", (0.025, 0.03, 0.45), (cx - 0.15 + c * 0.15, front - 0.03, BASE_H + 0.95), "Lattice")
        box(f"Knocker{side}", (0.06, 0.03, 0.06), (side * 0.06, front - 0.04, BASE_H + 0.6), "Trim")
    # lattice windows either side
    for side in (-1, 1):
        cx = side * (W / 2 - 0.62)
        box(f"WinPaper{side}", (0.8, 0.03, 0.7), (cx, front, BASE_H + 0.95), "Paper")
        box(f"WinFrame{side}", (0.9, 0.04, 0.06), (cx, front - 0.02, BASE_H + 1.33), "Lattice")
        box(f"WinSill{side}", (0.9, 0.04, 0.06), (cx, front - 0.02, BASE_H + 0.57), "Lattice")
        for k in range(6):
            box(f"WinV{side}{k}", (0.025, 0.04, 0.72), (cx - 0.35 + k * 0.14, front - 0.03, BASE_H + 0.95), "Lattice")
        for k in range(4):
            box(f"WinH{side}{k}", (0.8, 0.04, 0.025), (cx, front - 0.03, BASE_H + 0.7 + k * 0.17), "Lattice")
        box(f"Dado{side}", (0.9, 0.04, 0.5), (cx, front - 0.01, BASE_H + 0.3), "Pillar")


def main():
    reset()
    palette = {
        "Base": 0xB9AB93, "Wall": 0xEEE2C8, "Pillar": 0xB8372B, "Roof": 0x3D4A57, "Ridge": 0x2E3842,
        "Trim": 0xD9A441, "Door": 0x7A3B2A, "Lattice": 0x8C2F24, "Paper": 0xF6EFDC,
    }
    for name, h in palette.items():
        MATS[name] = material(name, hexrgb(h))
    build_body()
    build_roof()
    build_ridges()
    # convert curves to meshes and apply modifiers so the export is plain geometry
    bpy.ops.object.select_all(action="SELECT")
    for ob in list(bpy.context.scene.objects):
        bpy.context.view_layer.objects.active = ob
        if ob.type == "CURVE":
            bpy.ops.object.convert(target="MESH")
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active = bpy.context.scene.objects[0]
    bpy.ops.object.join()
    hall = bpy.context.view_layer.objects.active
    hall.name = "Hall"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7)
    print("exported", os.path.abspath(OUT), "tris:", sum(len(p.vertices) - 2 for p in hall.data.polygons))
    if os.environ.get("PREVIEW"):
        render_preview(os.environ["PREVIEW"])


def render_preview(path):
    scene = bpy.context.scene
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    scene.collection.objects.link(cam)
    cam.location = (6.5, -10.5, 5.2)
    cam.rotation_euler = (math.radians(72), 0, math.radians(31))
    scene.camera = cam
    sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(30))
    scene.collection.objects.link(sun)
    world = bpy.data.worlds.new("W")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.85, 0.82, 0.75, 1)
    scene.world = world
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y = 900, 600
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


main()
