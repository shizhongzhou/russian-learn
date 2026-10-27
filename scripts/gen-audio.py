"""Pre-record the app's Russian texts with Piper (open-source TTS, CC0 voices dmitri / denis).
usage: python gen-audio.py texts.json SHARD NSHARDS OUTDIR
Files: OUTDIR/<sha1[:2]>/<sha1[:16]>.mp3 where sha1 = sha1(f"{voice}|{text}") — same key as speak() in app.js."""
import hashlib, json, os, subprocess, sys, tempfile, wave
from concurrent.futures import ThreadPoolExecutor
from piper import PiperVoice

texts, shard, n, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
items = json.load(open(texts, encoding="utf-8"))
voices = [PiperVoice.load("ru_RU-dmitri-medium.onnx"), PiperVoice.load("ru_RU-denis-medium.onnx")]
try:
    from piper import SynthesisConfig
    cfg = SynthesisConfig(length_scale=1.05, noise_scale=0.6, noise_w_scale=0.7)
except Exception:
    cfg = None

def key(v, t): return hashlib.sha1(f"{v}|{t}".encode("utf-8")).hexdigest()[:16]

todo = [(v, t) for v, t in items if int(key(v, t), 16) % n == shard]
tmp = tempfile.mkdtemp()
pool = ThreadPoolExecutor(4)
jobs = []
def encode(wav, mp3):
    os.makedirs(os.path.dirname(mp3), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.12",
                    "-ac", "1", "-ar", "22050", "-b:a", "32k", mp3], check=True)
    os.remove(wav)
for i, (v, t) in enumerate(todo):
    k = key(v, t)
    wav = os.path.join(tmp, k + ".wav")
    with wave.open(wav, "wb") as w:
        if hasattr(voices[v], "synthesize_wav"):
            voices[v].synthesize_wav(t, w, syn_config=cfg) if cfg else voices[v].synthesize_wav(t, w)
        else:
            voices[v].synthesize(t, w)
    jobs.append(pool.submit(encode, wav, os.path.join(out, k[:2], k + ".mp3")))
    if i % 1000 == 0: print(f"shard {shard}: {i}/{len(todo)}", flush=True)
for j in jobs: j.result()
print(f"shard {shard}: done {len(todo)}")
