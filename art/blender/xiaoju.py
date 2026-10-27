"""小橘 — a chibi orange-and-white tabby built, rigged and animated entirely from code.

Run headless:  blender -b -P art/blender/xiaoju.py -- <out_dir> [preview|all]
  preview : one still per clip + a turnaround (quick check)
  all     : every frame of every clip, plus xiaoju.blend and xiaoju.glb

The cat walks towards +X. Clips are rendered in place (the cat stays centred); the app moves the
picture across the screen at GROUND_SPEED so the planted paws don't slide.
"""
import bpy, math, sys, os, json
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
INTERACTIVE = not bpy.app.background      # run from Blender's Scripting tab: build + animate, no rendering
OUT = os.path.abspath(argv[0] if argv else "out")
MODE = "interactive" if INTERACTIVE else (argv[1] if len(argv) > 1 else "preview")
if not INTERACTIVE: os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- scene
if bpy.app.background:
    bpy.ops.wm.read_factory_settings(use_empty=True)
else:   # clear whatever is in the open file (keeps this script's text block alive)
    if bpy.context.object and bpy.context.object.mode != "OBJECT": bpy.ops.object.mode_set(mode="OBJECT")
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.actions, bpy.data.lights, bpy.data.cameras):
        for d in list(coll): coll.remove(d)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 48 if MODE == "all" else 64
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 640
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.render.fps = 24

def lin(r, g, b):  # sRGB 0-255 -> linear
    f = lambda c: (c / 255) / 12.92 if c / 255 <= 0.04045 else ((c / 255 + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)

ORANGE, STRIPE, CREAM = lin(242, 156, 74), lin(214, 112, 40), lin(253, 248, 241)
PINK, NOSE, AMBER, PUPIL = lin(246, 178, 172), lin(232, 132, 134), lin(232, 160, 52), lin(28, 20, 16)

# ---------------------------------------------------------------- materials
def principled(name, color, rough=0.62, sheen=0.55, sss=0.12):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    for k, v in (("Sheen Weight", sheen), ("Sheen Roughness", 0.45), ("Subsurface Weight", sss), ("Subsurface Scale", 0.04)):
        if k in b.inputs: b.inputs[k].default_value = v
    return m, b

def fur(name, axis="X", freq=5.0, top_only=False, white_below=None):
    """Orange fur with soft tabby stripes along a local axis (object coordinates)."""
    m, b = principled(name, ORANGE)
    nt = m.node_tree; N = nt.nodes; L = nt.links
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    noise = N.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 3.0
    L.new(tc.outputs["Object"], noise.inputs["Vector"])
    mul = N.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = freq
    L.new(sep.outputs[axis], mul.inputs[0])
    add = N.new("ShaderNodeMath"); add.operation = "MULTIPLY_ADD"; add.inputs[2].default_value = 0
    L.new(noise.outputs["Fac"], add.inputs[0]); add.inputs[1].default_value = 1.6
    s = N.new("ShaderNodeMath"); s.operation = "ADD"; L.new(mul.outputs[0], s.inputs[0]); L.new(add.outputs[0], s.inputs[1])
    sn = N.new("ShaderNodeMath"); sn.operation = "SINE"; L.new(s.outputs[0], sn.inputs[0])
    ramp = N.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].position = 0.25; ramp.color_ramp.elements[1].position = 0.75
    L.new(sn.outputs[0], ramp.inputs[0])
    fac = ramp.outputs[0]
    if top_only:   # stripes only on the crown / back
        mr = N.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.15; mr.inputs["From Max"].default_value = 0.55
        L.new(sep.outputs["Z"], mr.inputs["Value"])
        mm = N.new("ShaderNodeMath"); mm.operation = "MULTIPLY"; L.new(ramp.outputs[0], mm.inputs[0]); L.new(mr.outputs[0], mm.inputs[1])
        fac = mm.outputs[0]
    mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"
    mix.inputs["A"].default_value = ORANGE; mix.inputs["B"].default_value = STRIPE
    L.new(fac, mix.inputs["Factor"])
    col = mix.outputs["Result"]
    if white_below is not None:   # cream belly / chin blended in softly below a local height
        mr2 = N.new("ShaderNodeMapRange"); mr2.inputs["From Min"].default_value = white_below + 0.12; mr2.inputs["From Max"].default_value = white_below - 0.12
        L.new(sep.outputs["Z"], mr2.inputs["Value"])
        mix2 = N.new("ShaderNodeMix"); mix2.data_type = "RGBA"; mix2.inputs["B"].default_value = CREAM
        L.new(col, mix2.inputs["A"]); L.new(mr2.outputs[0], mix2.inputs["Factor"]); col = mix2.outputs["Result"]
    L.new(col, b.inputs["Base Color"])
    return m

def eye_mat():
    m, b = principled("eye", AMBER, rough=0.08, sheen=0, sss=0)
    nt = m.node_tree; N = nt.nodes; L = nt.links
    if "Coat Weight" in b.inputs: b.inputs["Coat Weight"].default_value = 1.0
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(tc.outputs["Object"], sep.inputs[0])
    # distance from the eye's centre in its own Y/Z plane (the eye looks along local +X)
    yy = N.new("ShaderNodeMath"); yy.operation = "MULTIPLY"; L.new(sep.outputs["Y"], yy.inputs[0]); L.new(sep.outputs["Y"], yy.inputs[1])
    zz = N.new("ShaderNodeMath"); zz.operation = "MULTIPLY"; L.new(sep.outputs["Z"], zz.inputs[0]); L.new(sep.outputs["Z"], zz.inputs[1])
    ad = N.new("ShaderNodeMath"); ad.operation = "ADD"; L.new(yy.outputs[0], ad.inputs[0]); L.new(zz.outputs[0], ad.inputs[1])
    r = N.new("ShaderNodeMath"); r.operation = "SQRT"; L.new(ad.outputs[0], r.inputs[0])
    ramp = N.new("ShaderNodeValToRGB"); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = PUPIL
    cr.elements[1].position = 1.0; cr.elements[1].color = lin(60, 36, 20)
    for pos, c in ((0.52, PUPIL), (0.56, lin(150, 86, 24)), (0.78, AMBER), (0.92, lin(196, 120, 34))): e = cr.elements.new(pos); e.color = c
    L.new(r.outputs[0], ramp.inputs[0]); L.new(ramp.outputs[0], b.inputs["Base Color"])
    return m

M = {
    "body": fur("fur_body", "X", 6.0, top_only=True, white_below=-0.25),
    "head": fur("fur_head", "Y", 7.0, top_only=True),
    "leg": fur("fur_leg", "Z", 5.0),
    "tail": fur("fur_tail", "Z", 5.0),
    "cream": principled("cream", CREAM)[0],
    "pink": principled("pink", PINK, sheen=0.2)[0],
    "nose": principled("nose", NOSE, rough=0.35, sheen=0)[0],
    "ear": fur("fur_ear", "Z", 0.0),
    "eye": eye_mat(),
    "dark": principled("dark", lin(80, 48, 36), sheen=0)[0],
}
hl, hb = principled("highlight", (1, 1, 1, 1), sheen=0)
hb.inputs["Emission Color"].default_value = (1, 1, 1, 1); hb.inputs["Emission Strength"].default_value = 3.0
M["hl"] = hl

# ---------------------------------------------------------------- shapes
def ellipsoid(name, center, scale, mat, rot=None, seg=40):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, location=center)
    o = bpy.context.object; o.name = name; o.scale = scale
    if rot is not None: o.rotation_mode = "QUATERNION"; o.rotation_quaternion = rot
    bpy.ops.object.shade_smooth()
    o.modifiers.new("sub", "SUBSURF").levels = 1
    o.data.materials.append(M[mat] if isinstance(mat, str) else mat)
    return o

def capsule(name, a, b, r, mat, squash=1.0):
    a, b = Vector(a), Vector(b); d = b - a
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return ellipsoid(name, (a + b) / 2, (r, r * squash, d.length / 2 + r * 0.55), mat, rot)

def cone(name, base, tip, r, mat):
    base, tip = Vector(base), Vector(tip); d = tip - base
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r, radius2=r * 0.12, depth=d.length, location=(base + tip) / 2)
    o = bpy.context.object; o.name = name; o.rotation_mode = "QUATERNION"; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bpy.ops.object.shade_smooth(); o.modifiers.new("sub", "SUBSURF").levels = 2
    o.data.materials.append(M[mat]); return o

# key points (metres-ish; ground at z = 0, the cat faces +X)
HIP_Z = 0.50
LEGS = {  # name: hip, paw rest, front?
    "FL": (Vector((0.30, -0.15, HIP_Z)), Vector((0.33, -0.15, 0.055)), True),
    "FR": (Vector((0.30, 0.15, HIP_Z)), Vector((0.33, 0.15, 0.055)), True),
    "HL": (Vector((-0.30, -0.15, HIP_Z)), Vector((-0.30, -0.15, 0.055)), False),
    "HR": (Vector((-0.30, 0.15, HIP_Z)), Vector((-0.30, 0.15, 0.055)), False),
}
L1, L2 = 0.24, 0.23
HEAD_C = Vector((0.60, 0, 0.98))
TAIL = [Vector((-0.50, 0, 0.62)), Vector((-0.70, 0, 0.82)), Vector((-0.74, 0, 1.08)), Vector((-0.66, 0, 1.30))]

def knee_rest(hip, paw, front):
    d = (paw - hip).length; a = (L1 ** 2 + d ** 2 - L2 ** 2) / (2 * L1 * d); o = math.acos(max(-1, min(1, a)))
    base = math.atan2(paw.z - hip.z, paw.x - hip.x); ang = base + (-o if front else o) * (1 if front else 1)
    # front joint bends forward (+X), hind hock bends back (-X)
    ang = base + (o if front else -o)
    k = Vector((hip.x + L1 * math.cos(ang), hip.y, hip.z + L1 * math.sin(ang)))
    return k

# ---------------------------------------------------------------- armature
arm_data = bpy.data.armatures.new("RigData"); arm = bpy.data.objects.new("Rig", arm_data)
scene.collection.objects.link(arm); bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
EB = arm_data.edit_bones
def bone(n, h, t, parent=None, connect=False):
    b = EB.new(n); b.head = h; b.tail = t; b.roll = 0
    if parent: b.parent = EB[parent]; b.use_connect = connect
    return b
bone("root", (0, 0, 0), (0, 0, 0.2))
bone("body", (-0.32, 0, 0.58), (0.36, 0, 0.62), "root")
bone("head", HEAD_C - Vector((0.05, 0, 0.18)), HEAD_C + Vector((0.0, 0, 0.12)), "body")
for i in range(3): bone(f"tail{i}", TAIL[i], TAIL[i + 1], "body" if i == 0 else f"tail{i-1}", i > 0)
for n, (hip, paw, front) in LEGS.items():
    k = knee_rest(hip, paw, front)
    bone(n + "_up", hip, k, "body"); bone(n + "_lo", k, paw, n + "_up", True)
bpy.ops.object.mode_set(mode="OBJECT")

# ---------------------------------------------------------------- body parts
parts = []  # (object, bone)
def P(o, b): parts.append((o, b)); return o

P(ellipsoid("Body", (0.0, 0, 0.60), (0.50, 0.30, 0.28), "body"), "body")
P(ellipsoid("Chest", (0.32, 0, 0.58), (0.24, 0.25, 0.27), "cream"), "body")
P(ellipsoid("Belly", (0.02, 0, 0.42), (0.38, 0.22, 0.12), "cream"), "body")
P(ellipsoid("Haunch.L", (-0.28, -0.14, 0.54), (0.20, 0.13, 0.20), "body"), "body")
P(ellipsoid("Haunch.R", (-0.28, 0.14, 0.54), (0.20, 0.13, 0.20), "body"), "body")
P(ellipsoid("Shoulder.L", (0.28, -0.15, 0.60), (0.15, 0.11, 0.17), "body"), "body")
P(ellipsoid("Shoulder.R", (0.28, 0.15, 0.60), (0.15, 0.11, 0.17), "body"), "body")
# head: big and round, cream muzzle and blaze
H = HEAD_C
P(ellipsoid("Head", H, (0.40, 0.41, 0.36), "head"), "head")
P(ellipsoid("Cheek.L", H + Vector((0.16, -0.20, -0.12)), (0.20, 0.17, 0.15), "head"), "head")
P(ellipsoid("Cheek.R", H + Vector((0.16, 0.20, -0.12)), (0.20, 0.17, 0.15), "head"), "head")
P(ellipsoid("Muzzle", H + Vector((0.31, 0, -0.12)), (0.14, 0.20, 0.13), "cream"), "head")
P(ellipsoid("Chin", H + Vector((0.24, 0, -0.22)), (0.13, 0.15, 0.09), "cream"), "head")
P(ellipsoid("Blaze", H + Vector((0.30, 0, 0.06)), (0.10, 0.07, 0.22), "cream", Quaternion((0, 1, 0), math.radians(-28))), "head")
P(ellipsoid("Nose", H + Vector((0.445, 0, -0.06)), (0.035, 0.05, 0.032), "nose"), "head")
P(capsule("Mouth.L", H + Vector((0.44, 0, -0.10)), H + Vector((0.43, -0.05, -0.13)), 0.008, "dark"), "head")
P(capsule("Mouth.R", H + Vector((0.44, 0, -0.10)), H + Vector((0.43, 0.05, -0.13)), 0.008, "dark"), "head")
for side, s in (("L", -1), ("R", 1)):
    az = math.radians(34)
    c = H + Vector((0.355 * math.cos(az), s * 0.33 * math.sin(az) * 1.15, 0.03))
    q = Quaternion((0, 0, 1), s * az)
    P(ellipsoid("Eye." + side, c, (0.035, 0.105, 0.125), "eye", q), "head")
    P(ellipsoid("Glint." + side, c + q @ Vector((0.03, -0.035, 0.055)), (0.012, 0.030, 0.030), "hl", q, seg=16), "head")
    P(ellipsoid("Glint2." + side, c + q @ Vector((0.03, 0.035, -0.04)), (0.008, 0.015, 0.015), "hl", q, seg=16), "head")
    # ears: orange cone with a pink inner cone
    eb_ = H + Vector((0.0, s * 0.22, 0.24)); et = H + Vector((0.02, s * 0.33, 0.56))
    P(cone("Ear." + side, eb_, et, 0.16, "ear"), "head")
    P(cone("EarIn." + side, eb_ + Vector((0.07, 0, 0.02)), et + Vector((0.04, 0, -0.06)), 0.10, "pink"), "head")
    P(ellipsoid("Brow." + side, H + Vector((0.31, s * 0.11, 0.17)), (0.02, 0.025, 0.02), "dark", seg=16), "head")
# legs
for n, (hip, paw, front) in LEGS.items():
    k = knee_rest(hip, paw, front)
    P(capsule(n + "_thigh", hip, k, 0.10 if not front else 0.085, "leg"), n + "_up")
    P(capsule(n + "_shin", k, paw + Vector((0, 0, 0.03)), 0.072, "cream" if front else "leg"), n + "_lo")
    P(ellipsoid(n + "_paw", paw + Vector((0.035, 0, -0.005)), (0.10, 0.085, 0.06), "cream"), n + "_lo")
# tail
for i in range(3):
    P(capsule(f"Tail{i}", TAIL[i], TAIL[i + 1], 0.085 - i * 0.004, "tail"), f"tail{i}")
P(ellipsoid("TailTip", TAIL[3] + Vector((0.01, 0, 0.03)), (0.10, 0.10, 0.11), "cream"), "tail2")

# bone-parent every part, keeping its rest placement
bpy.context.view_layer.update()
for o, bn in parts:
    W = o.matrix_world.copy(); pb = arm.pose.bones[bn]
    o.parent = arm; o.parent_type = "BONE"; o.parent_bone = bn
    Pm = arm.matrix_world @ pb.matrix @ Matrix.Translation((0, pb.bone.length, 0))
    o.matrix_parent_inverse = Pm.inverted(); o.matrix_basis = W

# ---------------------------------------------------------------- posing helpers
def rest(bn): return arm.data.bones[bn].matrix_local.copy()
def set_bone(bn, head, direction=None, extra=None):
    """Place a bone so its head sits at `head` and it points along `direction` (swing from rest, no twist)."""
    R = rest(bn); rdir = (R.to_3x3() @ Vector((0, 1, 0))).normalized()
    rot = rdir.rotation_difference(direction.normalized()) if direction is not None else Quaternion()
    if extra is not None: rot = extra @ rot
    Mx = Matrix.Translation(head) @ rot.to_matrix().to_4x4() @ R.to_3x3().to_4x4()
    arm.pose.bones[bn].matrix = Mx
    bpy.context.view_layer.update()

def solve_leg(hip, paw, front):
    d = paw - hip; dist = min(d.length, L1 + L2 - 1e-3)
    if d.length > dist: paw = hip + d.normalized() * dist; d = paw - hip
    a = (L1 ** 2 + dist ** 2 - L2 ** 2) / (2 * L1 * dist); o = math.acos(max(-1, min(1, a)))
    base = math.atan2(d.z, d.x); ang = base + (o if front else -o)
    k = Vector((hip.x + L1 * math.cos(ang), hip.y, hip.z + L1 * math.sin(ang)))
    return k, paw

def pose(t, clip):
    """Pose the whole cat for time t (seconds) in a clip; returns nothing, sets bone matrices."""
    sin, cos, pi = math.sin, math.cos, math.pi
    bob = Vector((0, 0, 0)); pitch = 0.0; head_tilt = 0.0; tail_sw = 0.0; paws = {}
    if clip in ("walk", "run"):
        stride, period, duty, lift = (0.34, 0.5, 0.62, 0.075) if clip == "walk" else (0.56, 0.36, 0.42, 0.13)
        ph = (t / period) % 1
        offs = {"HL": 0.0, "FL": 0.25, "HR": 0.5, "FR": 0.75} if clip == "walk" else {"HL": 0.0, "FR": 0.0, "HR": 0.5, "FL": 0.5}
        for n, (hip, paw0, front) in LEGS.items():
            u = (ph + offs[n]) % 1; s = stride / 2
            if u < duty: x = s - 2 * s * (u / duty); z = 0
            else:
                v = (u - duty) / (1 - duty); e = v * v * (3 - 2 * v); x = -s + 2 * s * e; z = lift * sin(pi * v)
            paws[n] = paw0 + Vector((x, 0, z))
        bob = Vector((0, 0, (0.012 if clip == "walk" else 0.035) * cos(4 * pi * ph)))
        pitch = (0.0 if clip == "walk" else 4.0) * sin(2 * pi * ph)
        tail_sw = (8 if clip == "walk" else 12) * sin(2 * pi * ph)
    elif clip == "idle":
        for n, (hip, paw0, front) in LEGS.items(): paws[n] = paw0.copy()
        bob = Vector((0, 0, 0.006 * sin(2 * pi * t / 2.0)))
        head_tilt = 4 * sin(2 * pi * t / 4.0); tail_sw = 10 * sin(2 * pi * t / 2.0)
    elif clip == "crouch":
        for n, (hip, paw0, front) in LEGS.items(): paws[n] = paw0 + Vector((0.10 if front else 0.04, 0, 0))
        bob = Vector((0, 0, -0.16)); pitch = 4; head_tilt = 8; tail_sw = 6 * sin(2 * pi * t * 3)
    elif clip == "pounce":
        bob = Vector((0, 0, 0.30)); pitch = -14
        for n, (hip, paw0, front) in LEGS.items():
            paws[n] = paw0 + (Vector((0.42, 0, 0.30)) if front else Vector((-0.40, 0, 0.12)))
        tail_sw = -10
    # body
    q_pitch = Quaternion((0, 1, 0), math.radians(-pitch))
    Rb = rest("body"); pivot = Vector((0, 0, 0.6))
    body_head = pivot + q_pitch @ (Rb.translation - pivot) + bob
    set_bone("body", body_head, q_pitch @ (Rb.to_3x3() @ Vector((0, 1, 0))))
    bm = arm.pose.bones["body"].matrix @ rest("body").inverted()      # body pose delta (armature space)
    # head stays level: undo body pitch, add its own tilt
    Rh = rest("head"); hh = bm @ Rh.translation
    set_bone("head", hh, Quaternion((0, 1, 0), math.radians(head_tilt)) @ (Rh.to_3x3() @ Vector((0, 1, 0))))
    # tail chain: each segment swings a little more
    prev = bm @ TAIL[0]
    for i in range(3):
        d = (TAIL[i + 1] - TAIL[i])
        q = Quaternion((1, 0, 0), math.radians(tail_sw * (i + 1) * 0.6)) @ q_pitch
        set_bone(f"tail{i}", prev, q @ d); prev = prev + (q @ d)
    # legs
    for n, (hip, paw0, front) in LEGS.items():
        h = bm @ hip; k, p = solve_leg(h, paws[n], front)
        set_bone(n + "_up", h, k - h); set_bone(n + "_lo", k, p - k)

def bake(clip, frames, fps=24):
    # keys are sampled every frame, so linear interpolation keeps the gait exact (works in Blender 4.x and 5.x)
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
    act = bpy.data.actions.new(clip); arm.animation_data_create(); arm.animation_data.action = act
    for f in range(frames):
        pose(f / fps, clip)
        for pb in arm.pose.bones:
            pb.keyframe_insert("location", frame=f + 1); pb.keyframe_insert("rotation_quaternion", frame=f + 1)
    return act

CLIPS = {"walk": 12, "run": 9, "idle": 48, "crouch": 1, "pounce": 1}   # walk: 0.5 s loop; run: 0.36 s loop

# ---------------------------------------------------------------- light, camera, shadow
world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.55
def area(name, loc, power, size, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, "AREA"); l.energy = power; l.size = size; l.color = color
    o = bpy.data.objects.new(name, l); scene.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0.1, 0, 0.6)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler(); return o
area("Key", (2.2, -2.6, 3.2), 420, 2.5, (1, 0.97, 0.92))
area("Fill", (-2.5, -2.0, 1.4), 140, 3.0, (0.92, 0.96, 1))
area("Rim", (-1.5, 2.5, 2.5), 220, 2.0)
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0)); ground = bpy.context.object; ground.is_shadow_catcher = True
cam_d = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
cam_d.type = "ORTHO"; cam_d.ortho_scale = 2.55
target = Vector((0.04, 0, 0.70))
def aim(az_deg, el_deg, dist=8):
    az, el = math.radians(az_deg), math.radians(el_deg)
    cam.location = target + dist * Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
aim(28, 12)     # three-quarter view: right side + a bit of the face, slightly from above

# ---------------------------------------------------------------- render
meta = {"walk_ground_speed_units_per_s": 0.34 / (0.62 * 0.5), "run_ground_speed_units_per_s": 0.56 / (0.42 * 0.36),
        "ortho_scale": cam_d.ortho_scale, "resolution": scene.render.resolution_x, "clips": CLIPS}
def render_to(path):
    scene.render.filepath = path; bpy.ops.render.render(write_still=True)

if MODE == "interactive":
    bake("walk", CLIPS["walk"])
    scene.frame_start, scene.frame_end = 1, CLIPS["walk"]; scene.frame_set(1)
    for a in bpy.context.screen.areas:          # material preview so the colours show; look through the camera
        if a.type == "VIEW_3D":
            a.spaces[0].shading.type = "MATERIAL"
    print("小橘 ready: press Space in the 3D view to play the walk. Other clips:", list(CLIPS))
elif MODE == "preview":
    scene.render.resolution_x = scene.render.resolution_y = 480
    for clip in ("walk", "idle", "crouch", "pounce", "run"):
        bake(clip, CLIPS[clip]); scene.frame_set(1); render_to(f"{OUT}/preview_{clip}.png")
    bake("walk", CLIPS["walk"])
    for i, f in enumerate((1, 4, 7, 10)): scene.frame_set(f); render_to(f"{OUT}/preview_walk_f{f:02d}.png")
    scene.frame_set(1); bake("idle", 1)
    for az in (90, -20, 180):
        aim(az, 10); render_to(f"{OUT}/preview_turn_{az}.png")
    aim(28, 12)
else:
    for clip, n in CLIPS.items():
        act = bake(clip, n)
        os.makedirs(f"{OUT}/{clip}", exist_ok=True)
        for f in range(1, n + 1):
            scene.frame_set(f); render_to(f"{OUT}/{clip}/{f:02d}.png")
    bake("walk", CLIPS["walk"])
    bpy.ops.wm.save_as_mainfile(filepath=f"{OUT}/xiaoju.blend")
    try:
        bpy.ops.export_scene.gltf(filepath=f"{OUT}/xiaoju.glb", export_animations=True)
    except Exception as e:
        print("glb export failed:", e)
if not INTERACTIVE: json.dump(meta, open(f"{OUT}/meta.json", "w"), indent=1)
print("DONE", OUT)
