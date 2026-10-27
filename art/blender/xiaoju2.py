"""小橘 v2 — modelled after the character sheet (chunky orange tabby, white chest/socks/muzzle/blaze,
bold wrap-around stripes, big amber eyes, big pink ears, thick tail with a white pom tip).

Pipeline (all from code, runs in a live Blender or headless):
  1. block the cat out of soft primitives
  2. fuse them into ONE smooth mesh (voxel remesh + smoothing)
  3. paint fur colours (orange / stripes / cream) as vertex colours, in rest pose
  4. separate details: eyes, nose, mouth, inner ears (parented to the head bone)
  5. rig with an armature (automatic weights) and bake walk / run / idle / crouch / pounce
  6. short fur (particle hair) for the plush look in renders
"""
import bpy, bmesh, math, sys, os, json
from mathutils import Vector, Matrix, Quaternion, noise

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
LIVE = not bpy.app.background
OUT = os.path.abspath(argv[0] if argv else os.path.expanduser("~/xiaoju_out"))
MODE = argv[1] if len(argv) > 1 else ("live" if LIVE else "preview")
STAGE = int(os.environ.get("XJ_STAGE", "9"))          # stop after a stage when iterating live
VOXEL = float(os.environ.get("XJ_VOXEL", "0.011"))
class StageDone(Exception): pass

# ------------------------------------------------------------------ reset
if not LIVE:
    bpy.ops.wm.read_factory_settings(use_empty=True)
else:
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.actions, bpy.data.lights,
                 bpy.data.cameras, bpy.data.particles, bpy.data.curves):
        for d in list(coll): coll.remove(d)
scene = bpy.context.scene
col = scene.collection

def lin(r, g, b):
    f = lambda c: (c / 255) / 12.92 if c / 255 <= 0.04045 else ((c / 255 + 0.055) / 1.055) ** 2.4
    return Vector((f(r), f(g), f(b)))
C_ORANGE = lin(242, 138, 42)
C_LIGHT = lin(248, 162, 70)     # sun-kissed top
C_STRIPE = lin(196, 82, 18)
C_CREAM = lin(255, 249, 240)
C_PINK, C_NOSE = lin(246, 176, 170), lin(232, 136, 136)
C_AMBER, C_PUPIL = lin(214, 132, 32), lin(30, 22, 18)

# ------------------------------------------------------------------ proportions (metres, cat faces +X)
HEAD_C = Vector((0.64, 0, 0.98)); HEAD_R = Vector((0.33, 0.36, 0.31))
L1, L2 = 0.21, 0.20
LEGS = {   # hip, paw (rest), front?
    "FL": (Vector((0.32, -0.17, 0.42)), Vector((0.36, -0.17, 0.06)), True),
    "FR": (Vector((0.32, 0.17, 0.42)), Vector((0.36, 0.17, 0.06)), True),
    "HL": (Vector((-0.34, -0.17, 0.44)), Vector((-0.34, -0.17, 0.06)), False),
    "HR": (Vector((-0.34, 0.17, 0.44)), Vector((-0.34, 0.17, 0.06)), False),
}
TAIL = [Vector((-0.58, 0, 0.62)), Vector((-0.82, 0, 0.82)), Vector((-0.86, 0, 1.10)), Vector((-0.74, 0, 1.34))]

def knee_of(hip, paw, front):
    d = paw - hip; dist = min(d.length, L1 + L2 - 1e-3)
    if d.length > dist: paw = hip + d.normalized() * dist; d = paw - hip
    a = (L1 ** 2 + dist ** 2 - L2 ** 2) / (2 * L1 * dist); o = math.acos(max(-1, min(1, a)))
    base = math.atan2(d.z, d.x); ang = base + (o if front else -o)
    return Vector((hip.x + L1 * math.cos(ang), hip.y, hip.z + L1 * math.sin(ang))), paw

# ------------------------------------------------------------------ 1. block-out
blocks = []
def ell(center, radii, rot=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1.0)
    M = Matrix.Translation(center) @ (rot.to_matrix().to_4x4() if rot else Matrix()) @ Matrix.Diagonal((*radii, 1))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts); blocks.append(bm)
def cap(a, b, r, r2=None):
    a, b = Vector(a), Vector(b); d = b - a; r2 = r if r2 is None else r2
    n = max(3, int(d.length / (min(r, r2) * 0.5)))
    for i in range(n + 1):
        t = i / n; ell(a + d * t, ((r + (r2 - r) * t),) * 3)

H, HR = HEAD_C, HEAD_R
ell((0.00, 0, 0.55), (0.50, 0.33, 0.30))              # barrel
ell((-0.30, 0, 0.57), (0.32, 0.33, 0.31))             # rump
ell((0.30, 0, 0.55), (0.30, 0.31, 0.32))              # chest
ell((0.46, 0, 0.76), (0.20, 0.24, 0.24), Quaternion((0, 1, 0), math.radians(-35)))   # neck
ell(H, HR)                                            # skull
for s in (-1, 1):
    ell(H + Vector((0.10, s * 0.15, -0.10)), (0.19, 0.17, 0.15))      # cheeks
ell(H + Vector((0.23, 0, -0.08)), (0.10, 0.15, 0.085))                  # muzzle
ell(H + Vector((0.20, 0, -0.15)), (0.09, 0.11, 0.06))                   # chin
for n, (hip, paw, front) in LEGS.items():
    k, _ = knee_of(hip, paw, front)
    if front: ell(hip + Vector((0.0, 0, 0.04)), (0.15, 0.11, 0.18))     # shoulder
    else: ell(hip + Vector((0.02, 0, -0.01)), (0.21, 0.12, 0.20))       # haunch
    cap(hip, k, 0.10 if front else 0.115, 0.085)
    cap(k, paw + Vector((0, 0, 0.03)), 0.085, 0.078)
    ell(paw + Vector((0.04, 0, -0.005)), (0.11, 0.09, 0.062))           # paw
for i in range(3):
    cap(TAIL[i], TAIL[i + 1], 0.10 + i * 0.006, 0.106 + i * 0.006)
ell(TAIL[3] + Vector((0.0, 0, 0.04)), (0.15, 0.15, 0.16))              # pom tip

# fuse
bm = bmesh.new()
for b in blocks:
    tmp = bpy.data.meshes.new("tmp"); b.to_mesh(tmp); b.free(); bm.from_mesh(tmp); bpy.data.meshes.remove(tmp)
clay_me = bpy.data.meshes.new("XiaojuClay"); bm.to_mesh(clay_me); bm.free()
clay = bpy.data.objects.new("XiaojuClay", clay_me); col.objects.link(clay)
rm = clay.modifiers.new("remesh", "REMESH"); rm.mode = "VOXEL"; rm.voxel_size = VOXEL; rm.use_smooth_shade = True
sm = clay.modifiers.new("smooth", "SMOOTH"); sm.factor = 0.6; sm.iterations = 8
dg = bpy.context.evaluated_depsgraph_get()
body_me = bpy.data.meshes.new_from_object(clay.evaluated_get(dg)); body_me.name = "Xiaoju"
bpy.data.objects.remove(clay, do_unlink=True); bpy.data.meshes.remove(clay_me)
body = bpy.data.objects.new("Xiaoju", body_me); col.objects.link(body)
for p in body_me.polygons: p.use_smooth = True
print("fused mesh:", len(body_me.vertices), "verts")

# ------------------------------------------------------------------ 2. fur colours (vertex colours, rest pose)
def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def in_ell(p, c, r):
    d = Vector(((p.x - c[0]) / r[0], (p.y - c[1]) / r[1], (p.z - c[2]) / r[2])); return d.length
def fur_colour(p):
    # cream areas
    cream = 0.0
    cream = max(cream, 1 - smooth(0.80, 1.0, in_ell(p, (0.46, 0, 0.55), (0.24, 0.24, 0.36))))      # chest bib
    if -0.50 < p.x < 0.50: cream = max(cream, 1 - smooth(0.33, 0.38, p.z + 0.05 * math.cos(p.x * 3)))   # belly
    cream = max(cream, 1 - smooth(0.17, 0.23, p.z))                                                 # socks
    hx = p - H
    cream = max(cream, 1 - smooth(0.85, 1.0, in_ell(hx, (0.22, 0, -0.10), (0.15, 0.24, 0.13))))   # muzzle + chin
    if hx.x > 0.12 and -0.06 < hx.z < 0.26:                                                       # blaze, narrowing upward
        w = 0.075 - 0.20 * max(0.0, hx.z)
        cream = max(cream, (1 - smooth(w * 0.7, w, abs(hx.y))) * smooth(0.12, 0.2, hx.x))
    cream = max(cream, 1 - smooth(0.17, 0.22, (p - (TAIL[3] + Vector((0, 0, 0.04)))).length))   # tail pom
    # stripes
    stripe = 0.0
    n = noise.noise(p * 3.0) * 0.6
    if p.x < 0.62 and p.z > 0.25 and p.x > -0.95 or (p.x < -0.6 and p.z > 0.25):
        if p.x > -0.58:                                                     # body: wrap-around bands
            ph = p.x * 27.0 + 0.9 * math.sin(p.z * 6.0) + 0.9 * n
            stripe = smooth(0.15, 0.45, math.sin(ph)) * smooth(0.38, 0.52, p.z)
        else:                                                               # tail bands
            ph = (p.z * 24.0 + p.x * 4.0) + n
            stripe = smooth(0.1, 0.45, math.sin(ph))
    if p.z < 0.42 and abs(p.y) > 0.07 and -0.7 < p.x < 0.62:              # upper legs
        stripe = max(stripe, smooth(0.35, 0.7, math.sin(p.z * 30 + n)) * smooth(0.27, 0.32, p.z))
    if hx.length < 0.36 and hx.z > 0.12 and hx.x > -0.05:                 # three crown stripes
        stripe = max(stripe, smooth(0.65, 0.9, math.cos(hx.y * 30)) * (1 - smooth(0.10, 0.16, abs(hx.y))) * smooth(0.12, 0.2, hx.z))
    top = smooth(0.4, 0.9, p.z - 0.0) * 0.35
    c = C_ORANGE.lerp(C_LIGHT, top).lerp(C_STRIPE, stripe)
    return c.lerp(C_CREAM, cream)

attr = body_me.color_attributes.new("Fur", "FLOAT_COLOR", "POINT")
for v in body_me.vertices:
    c = fur_colour(v.co); attr.data[v.index].color = (c.x, c.y, c.z, 1)
body_me.color_attributes.active_color = attr

def principled(name, color=None, rough=0.65, sheen=0.5, sss=0.1, attr_name=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    if color is not None: b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    for k, v in (("Sheen Weight", sheen), ("Sheen Roughness", 0.5), ("Subsurface Weight", sss), ("Subsurface Scale", 0.03)):
        if k in b.inputs: b.inputs[k].default_value = v
    if attr_name:
        a = m.node_tree.nodes.new("ShaderNodeAttribute"); a.attribute_name = attr_name
        m.node_tree.links.new(a.outputs["Color"], b.inputs["Base Color"])
    return m, b
FUR = principled("Fur", attr_name="Fur", sheen=0.7)[0]
body_me.materials.append(FUR)

# ------------------------------------------------------------------ 3. face details
details = []   # (object, bone)
def det(name, center, radii, mat, rot=None, seg=32):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1.0)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); col.objects.link(o)
    o.location = center; o.scale = radii
    if rot: o.rotation_mode = "QUATERNION"; o.rotation_quaternion = rot
    me.materials.append(mat); details.append((o, "head")); return o
def eye_mat():
    m, b = principled("Eye", C_AMBER, rough=0.06, sheen=0, sss=0)
    if "Coat Weight" in b.inputs: b.inputs["Coat Weight"].default_value = 1.0
    N, L = m.node_tree.nodes, m.node_tree.links
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    def sq(x): n = N.new("ShaderNodeMath"); n.operation = "MULTIPLY"; L.new(x, n.inputs[0]); L.new(x, n.inputs[1]); return n.outputs[0]
    ad = N.new("ShaderNodeMath"); ad.operation = "ADD"; L.new(sq(sep.outputs["Y"]), ad.inputs[0])
    zoff = N.new("ShaderNodeMath"); zoff.operation = "ADD"; zoff.inputs[1].default_value = -0.08; L.new(sep.outputs["Z"], zoff.inputs[0])
    L.new(sq(zoff.outputs[0]), ad.inputs[1])
    r = N.new("ShaderNodeMath"); r.operation = "SQRT"; L.new(ad.outputs[0], r.inputs[0])
    ramp = N.new("ShaderNodeValToRGB"); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (*C_PUPIL, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (*lin(48, 28, 16), 1)
    for pos, c in ((0.50, C_PUPIL), (0.54, lin(120, 64, 18)), (0.70, C_AMBER), (0.86, lin(236, 170, 70)), (0.92, lin(70, 40, 20))):
        e = cr.elements.new(pos); e.color = (*c, 1)
    L.new(r.outputs[0], ramp.inputs[0]); L.new(ramp.outputs[0], b.inputs["Base Color"])
    return m
EYE = eye_mat()
GLINT, gb = principled("Glint", (1, 1, 1), sheen=0)
gb.inputs["Emission Color"].default_value = (1, 1, 1, 1); gb.inputs["Emission Strength"].default_value = 2.5
PINK = principled("Pink", C_PINK, sheen=0.3)[0]
NOSE = principled("Nose", C_NOSE, rough=0.35, sheen=0)[0]
DARK = principled("Dark", lin(80, 46, 34), sheen=0)[0]
EARFUR = principled("EarFur", C_ORANGE, sheen=0.7)[0]

def on_head(az, el, inset=0.93):
    n = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    return H + Vector((HR.x * n.x, HR.y * n.y, HR.z * n.z)) * inset
for s in (-1, 1):
    az = math.radians(30) * s; el = math.radians(6)
    c = on_head(az, el, 0.955); q = Quaternion((0, 0, 1), az * 1.1) @ Quaternion((0, 1, 0), -el)
    det(f"Eye.{s}", c, (0.045, 0.10, 0.118), EYE, q)
    det(f"Glint.{s}", c + q @ Vector((0.04, -0.035 * s, 0.06)), (0.01, 0.03, 0.03), GLINT, q, 16)
    det(f"Glint2.{s}", c + q @ Vector((0.035, 0.03 * s, -0.035)), (0.006, 0.012, 0.012), GLINT, q, 16)
det("Nose", H + Vector((0.322, 0, -0.045)), (0.035, 0.055, 0.032), NOSE)
for s in (-1, 1):
    a, b = H + Vector((0.318, 0, -0.08)), H + Vector((0.305, s * 0.045, -0.11))
    d = b - a; det(f"Mouth.{s}", (a + b) / 2, (0.008, 0.008, d.length / 2 + 0.004), DARK, Vector((0, 0, 1)).rotation_difference(d))
# ears: soft rounded triangles (outer fur + pink inner), leaning out a little
def ear(s):
    base, tip = H + Vector((-0.04, s * 0.19, 0.17)), H + Vector((0.03, s * 0.35, 0.50))
    for nm, r, mat, off, tipoff in (("Ear", 0.20, EARFUR, Vector((0, 0, 0)), Vector((0, 0, 0))),
                                    ("EarIn", 0.14, PINK, Vector((0.07, -s * 0.01, 0.03)), Vector((0.035, -s * 0.012, -0.06)))):
        b0, t0 = base + off, tip + tipoff; d = t0 - b0
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=r, radius2=r * 0.22, depth=d.length)
        me = bpy.data.meshes.new(nm); bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new(f"{nm}.{s}", me); col.objects.link(o)
        o.location = (b0 + t0) / 2; o.rotation_mode = "QUATERNION"; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
        o.scale = (0.55, 1, 1)  # thin front-to-back, like a real ear
        sub = o.modifiers.new("sub", "SUBSURF"); sub.levels = 2; sub.render_levels = 2
        for p in me.polygons: p.use_smooth = True
        me.materials.append(mat); details.append((o, "head"))
for s in (-1, 1): ear(s)
print("details:", len(details))

if STAGE < 4: raise StageDone
# ------------------------------------------------------------------ 4. armature + automatic weights
arm_data = bpy.data.armatures.new("RigData"); arm = bpy.data.objects.new("Rig", arm_data); col.objects.link(arm)
arm_data.display_type = "STICK"; arm.show_in_front = True
bpy.context.view_layer.objects.active = arm
for o in bpy.context.view_layer.objects: o.select_set(False)
arm.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
EB = arm_data.edit_bones
def bone(n, h, t, parent=None, connect=False):
    b = EB.new(n); b.head = h; b.tail = t; b.roll = 0
    if parent: b.parent = EB[parent]; b.use_connect = connect
bone("root", (0, 0, 0), (0, 0, 0.2))
bone("body", (-0.40, 0, 0.58), (0.36, 0, 0.62), "root")
bone("head", (0.50, 0, 0.78), (0.66, 0, 1.22), "body")
for i in range(3): bone(f"tail{i}", TAIL[i], TAIL[i + 1], "body" if i == 0 else f"tail{i-1}", i > 0)
for n, (hip, paw, front) in LEGS.items():
    k, _ = knee_of(hip, paw, front)
    bone(n + "_up", hip, k, "body"); bone(n + "_lo", k, paw, n + "_up", True)
bpy.ops.object.mode_set(mode="OBJECT")
for b in arm_data.bones: b.use_deform = b.name != "root"

body.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
with bpy.context.temp_override(active_object=arm, object=arm, selected_objects=[body, arm], selected_editable_objects=[body, arm]):
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
print("weights:", [g.name for g in body.vertex_groups][:6], "...", len(body.vertex_groups))

bpy.context.view_layer.update()
for o, bn in details:     # face details ride on the head bone
    W = o.matrix_world.copy(); pb = arm.pose.bones[bn]
    o.parent = arm; o.parent_type = "BONE"; o.parent_bone = bn
    Pm = arm.matrix_world @ pb.matrix @ Matrix.Translation((0, pb.bone.length, 0))
    o.matrix_parent_inverse = Pm.inverted(); o.matrix_basis = W

# ------------------------------------------------------------------ 5. clips
def rest(bn): return arm.data.bones[bn].matrix_local.copy()
def set_bone(bn, head, direction=None):
    R = rest(bn); rdir = (R.to_3x3() @ Vector((0, 1, 0))).normalized()
    rot = rdir.rotation_difference(direction.normalized()) if direction is not None else Quaternion()
    arm.pose.bones[bn].matrix = Matrix.Translation(head) @ rot.to_matrix().to_4x4() @ R.to_3x3().to_4x4()
    bpy.context.view_layer.update()
GAIT = {"walk": (0.30, 0.56, 0.62, 0.07), "run": (0.50, 0.38, 0.42, 0.12)}   # stride, period, duty, lift
def pose(t, clip):
    sin, cos, pi = math.sin, math.cos, math.pi
    bob = Vector((0, 0, 0)); pitch = 0.0; tilt = 0.0; sway = 0.0; lift_tail = 0.0; paws = {}
    if clip in GAIT:
        stride, period, duty, lift = GAIT[clip]; ph = (t / period) % 1
        offs = {"HL": 0.0, "FL": 0.25, "HR": 0.5, "FR": 0.75} if clip == "walk" else {"HL": 0.0, "FR": 0.0, "HR": 0.5, "FL": 0.5}
        for n, (hip, paw0, front) in LEGS.items():
            u = (ph + offs[n]) % 1; s = stride / 2
            if u < duty: x, z = s - 2 * s * (u / duty), 0
            else: v = (u - duty) / (1 - duty); e = v * v * (3 - 2 * v); x, z = -s + 2 * s * e, lift * sin(pi * v)
            paws[n] = paw0 + Vector((x, 0, z))
        bob = Vector((0, 0, (0.012 if clip == "walk" else 0.03) * cos(4 * pi * ph)))
        pitch = (1.0 if clip == "walk" else 4.0) * sin(2 * pi * ph); sway = (7 if clip == "walk" else 10) * sin(2 * pi * ph)
    elif clip == "idle":
        for n, (hip, paw0, front) in LEGS.items(): paws[n] = paw0.copy()
        bob = Vector((0, 0, 0.005 * sin(2 * pi * t / 2.0))); tilt = 4 * sin(2 * pi * t / 4.0); sway = 9 * sin(2 * pi * t / 2.0)
    elif clip == "crouch":
        for n, (hip, paw0, front) in LEGS.items(): paws[n] = paw0 + Vector((0.12 if front else 0.05, 0, 0))
        bob = Vector((0, 0, -0.15)); pitch = 5; tilt = 10; sway = 6 * sin(2 * pi * t * 3)
    elif clip == "pounce":
        bob = Vector((0, 0, 0.30)); pitch = -16; tilt = -12
        for n, (hip, paw0, front) in LEGS.items(): paws[n] = paw0 + (Vector((0.40, 0, 0.36)) if front else Vector((-0.38, 0, 0.14)))
        sway = -8; lift_tail = -20
    qp = Quaternion((0, 1, 0), math.radians(-pitch))
    Rb = rest("body"); piv = Vector((0, 0, 0.56))
    set_bone("body", piv + qp @ (Rb.translation - piv) + bob, qp @ (Rb.to_3x3() @ Vector((0, 1, 0))))
    bm = arm.pose.bones["body"].matrix @ rest("body").inverted()
    Rh = rest("head")
    set_bone("head", bm @ Rh.translation, Quaternion((0, 1, 0), math.radians(tilt)) @ (Rh.to_3x3() @ Vector((0, 1, 0))))
    prev = bm @ TAIL[0]
    for i in range(3):
        d = TAIL[i + 1] - TAIL[i]
        q = Quaternion((1, 0, 0), math.radians(sway * (i + 1) * 0.6)) @ Quaternion((0, 1, 0), math.radians(lift_tail * (i + 1) * 0.4)) @ qp
        set_bone(f"tail{i}", prev, q @ d); prev = prev + q @ d
    for n, (hip, paw0, front) in LEGS.items():
        h = bm @ hip; k, p = knee_of(h, paws[n], front)
        set_bone(n + "_up", h, k - h); set_bone(n + "_lo", k, p - k)
CLIPS = {"walk": 14, "run": 9, "idle": 48, "crouch": 1, "pounce": 1}     # walk 0.56 s, run 0.36 s at 24 fps
def bake(clip):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
    act = bpy.data.actions.get(clip) or bpy.data.actions.new(clip)
    arm.animation_data_create(); arm.animation_data.action = act
    for f in range(CLIPS[clip]):
        pose(f / 24, clip)
        for pb in arm.pose.bones:
            pb.keyframe_insert("location", frame=f + 1); pb.keyframe_insert("rotation_quaternion", frame=f + 1)
    act.use_fake_user = True
    return act
for c in CLIPS: bake(c)
bake("walk"); scene.frame_start, scene.frame_end = 1, CLIPS["walk"]; scene.frame_set(1); scene.render.fps = 24

if STAGE < 6: raise StageDone
# ------------------------------------------------------------------ 5b. bake the fur colours into a texture (hair reads the emitter's UVs, not its vertex colours)
TEX = int(os.environ.get("XJ_TEX", "2048"))
body.data.uv_layers.new(name="UV")
bpy.context.view_layer.objects.active = body
for o in bpy.context.view_layer.objects: o.select_set(o is body)
with bpy.context.temp_override(active_object=body, object=body, selected_objects=[body], selected_editable_objects=[body]):
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
    bpy.ops.object.mode_set(mode="OBJECT")
img = bpy.data.images.new("XiaojuFur", TEX, TEX, alpha=False, float_buffer=False)
nt = FUR.node_tree; N, L = nt.nodes, nt.links
pb_ = N["Principled BSDF"]; at = [n for n in N if n.type == "ATTRIBUTE"][0]
em = N.new("ShaderNodeEmission"); L.new(at.outputs["Color"], em.inputs["Color"])
out = N["Material Output"]; L.new(em.outputs[0], out.inputs["Surface"])
tex = N.new("ShaderNodeTexImage"); tex.image = img; N.active = tex
scene.render.engine = "CYCLES"; scene.cycles.samples = 1
scene.render.bake.margin = 8
with bpy.context.temp_override(active_object=body, object=body, selected_objects=[body], selected_editable_objects=[body]):
    bpy.ops.object.bake(type="EMIT")
img.filepath_raw = os.path.join(os.path.dirname(OUT) if not LIVE else os.path.expanduser("~/Documents/俄语b2"), "xiaoju_fur.png")
img.file_format = "PNG"; img.save()
# final fur material: baked texture -> principled (skin and hair share it)
N.remove(em); L.new(pb_.outputs[0], out.inputs["Surface"])
L.new(tex.outputs["Color"], pb_.inputs["Base Color"])
print("baked fur texture", img.filepath_raw)

# ------------------------------------------------------------------ 6. plush fur (short particle hair, coloured by the emitter)
try:
    ps_mod = body.modifiers.new("Fur", "PARTICLE_SYSTEM"); ps = ps_mod.particle_system; st = ps.settings
    st.type = "HAIR"; st.count = 26000; st.hair_length = 0.032; st.use_advanced_hair = True
    st.child_type = "INTERPOLATED"; st.child_percent = 6; st.rendered_child_count = 12
    st.child_length = 1.0; st.roughness_1 = 0.004; st.roughness_endpoint = 0.004; st.clump_factor = 0.15
    st.display_step = 2; st.render_step = 3; st.display_percentage = 15
    st.root_radius = 1.0; st.tip_radius = 0.0; st.radius_scale = 0.0035
    st.use_hair_bspline = True
    st.material_slot = FUR.name if hasattr(st, "material_slot") else None
    print("fur ok")
except Exception as e:
    print("fur skipped:", e)

# ------------------------------------------------------------------ 7. stage: light, camera, render settings
scene.render.engine = "CYCLES"
try:
    cp = bpy.context.preferences.addons["cycles"].preferences
    for t in ("METAL", "OPTIX", "CUDA"):
        try: cp.compute_device_type = t; break
        except Exception: pass
    cp.get_devices(); [setattr(d, "use", True) for d in cp.devices]
    scene.cycles.device = "GPU" if cp.compute_device_type in ("METAL", "OPTIX", "CUDA") else "CPU"
except Exception: pass
scene.cycles.samples = 96; scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.view_settings.view_transform = "AgX"
try: scene.view_settings.look = "AgX - Punchy"
except Exception: pass
scene.render.resolution_x = scene.render.resolution_y = 720
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]; bg.inputs[0].default_value = (1, 1, 1, 1); bg.inputs[1].default_value = 0.45
def area(name, loc, power, size, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, "AREA"); l.energy = power; l.size = size; l.color = color
    o = bpy.data.objects.new(name, l); col.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0.1, 0, 0.7)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
area("Key", (2.0, -2.8, 3.4), 420, 3.0, (1, 0.96, 0.9)); area("Fill", (-2.6, -2.2, 1.4), 120, 3.0, (0.9, 0.95, 1))
area("Rim", (-1.6, 2.6, 2.6), 350, 2.0)
gme = bpy.data.meshes.new("Ground"); gbm = bmesh.new(); bmesh.ops.create_grid(gbm, x_segments=1, y_segments=1, size=5); gbm.to_mesh(gme); gbm.free()
ground = bpy.data.objects.new("Ground", gme); col.objects.link(ground); ground.is_shadow_catcher = True
cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d); col.objects.link(cam); scene.camera = cam
cam_d.type = "ORTHO"; cam_d.ortho_scale = 2.5
TARGET = Vector((0.0, 0, 0.74))
def aim(az, el, dist=8):
    az, el = math.radians(az), math.radians(el)
    cam.location = TARGET + dist * Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cam.rotation_euler = (TARGET - cam.location).to_track_quat("-Z", "Y").to_euler()
aim(30, 12)
META = {"walk_speed_units_s": GAIT["walk"][0] / (GAIT["walk"][2] * GAIT["walk"][1]),
        "run_speed_units_s": GAIT["run"][0] / (GAIT["run"][2] * GAIT["run"][1]), "ortho_scale": 2.5, "clips": CLIPS}
print("rig + clips + stage ready")
