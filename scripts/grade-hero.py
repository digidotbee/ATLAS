# Grades the hero photo: chartreuse hue shift on warm light, Storm slate in shadows,
# white-hot sun core, then exports lightweight WebP/JPEG crops to public/hero/.
# Usage: python3 -I scripts/grade-hero.py <source.jpg> public/hero
import sys
import numpy as np
from PIL import Image, ImageFilter

src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
W, H = im.size

# --- Hue shift: warm oranges (h≈25-55°) rotate toward chartreuse (≈72°), weighted by saturation.
hsv = np.asarray(im.convert('HSV')).astype(np.float32)
h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
warm = np.clip(1 - np.abs(h - 38) / 30, 0, 1) * np.clip((s - 0.15) / 0.35, 0, 1)
target = 70.0
h2 = h + (target - h) * 0.6 * warm
s2 = np.clip(s * (1 - 0.12 * warm), 0, 1)
v = np.clip(v * (1 + 0.10 * warm), 0, 1)
hsv2 = np.stack([h2 * 255 / 360, s2 * 255, v * 255], -1).clip(0, 255).astype(np.uint8)
a = np.asarray(Image.fromarray(hsv2, 'HSV').convert('RGB')).astype(np.float32) / 255

# --- Drama: S-curve, darker mids/shadows, protect highlights.
def lum(x): return 0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2]
L = lum(a)
curve = np.clip(L ** 1.05, 0, 1)
curve = np.clip(0.5 + (curve - 0.5) * 1.18, 0, 1)
a = np.clip(a * (curve / np.maximum(L, 1e-4))[..., None], 0, 1)

# --- Storm into the shadows (slate #1d222f), cool the blue sky slightly.
storm = np.array([0x1d, 0x22, 0x2f]) / 255
L = lum(a)
sw = np.clip((0.4 - L) / 0.4, 0, 1)[..., None]
a = a * (1 - 0.35 * sw) + storm * (0.35 * sw)

# --- Tight chartreuse glow at the sun (screen), small radius.
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
sx, sy = 0.525 * W, 0.675 * H
d = np.sqrt(((xx - sx) / W) ** 2 + ((yy - sy) / H) ** 2)
glow = (0.30 * np.exp(-(d / 0.10) ** 2) + 0.14 * np.exp(-(d / 0.28) ** 2))[..., None]
col = np.array([0xec, 0xff, 0x8a]) / 255
a = 1 - (1 - a) * (1 - col * glow)
core = (0.55 * np.exp(-(d / 0.035) ** 2))[..., None]
a = 1 - (1 - a) * (1 - np.array([1.0, 1.0, 0.94]) * core)

# --- Vignette into Storm; darker ground for the headline.
vig = np.clip(((xx / W - 0.5) ** 2 * 1.4 + (yy / H - 0.55) ** 2) * 1.5, 0, 1)[..., None]
a = a * (1 - 0.32 * vig) + storm * (0.32 * vig)
base = np.clip((yy / H - 0.8) / 0.2, 0, 1)[..., None]
a = a * (1 - 0.3 * base) + storm * (0.3 * base)

out = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=1.2, percent=45, threshold=3))

def save(img, name, w, q):
    hh = round(img.height * w / img.width)
    r = img.resize((w, hh), Image.LANCZOS)
    r.save(f"{outdir}/{name}.webp", 'WEBP', quality=q, method=6)
    r.save(f"{outdir}/{name}.jpg", 'JPEG', quality=q - 4, optimize=True, progressive=True)

# Slim band through the sunburst and mountains (hero is a thin strip).
save(out.crop((0, int(H * 0.60), W, int(H * 0.80))), 'hero-wide', 1600, 74)  # 2000x300 -> 1600x240
cx = int(sx)
save(out.crop((cx - 640, int(H * 0.54), cx + 560, int(H * 0.54) + 530)), 'hero-tall', 800, 72)  # 1200x530 -> 800x353
