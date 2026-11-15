# Grades the hero photo for the split hero panel.
# Keeps the original sky and clouds; chartreuse only in the warm light around the sun.
# Exports lightweight WebP/JPEG crops centred on the sunburst to public/hero/.
# Usage: python3 -I scripts/grade-hero.py <source.jpg> public/hero
import sys
import numpy as np
from PIL import Image, ImageFilter

src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
W, H = im.size
sx, sy = 0.525 * W, 0.675 * H  # sun position in the original

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.sqrt(((xx - sx) / W) ** 2 + ((yy - sy) / H) ** 2)
near_sun = np.exp(-(d / 0.30) ** 2)  # 1 at the sun, fading out

# Chartreuse only in warm, saturated light near the sun.
hsv = np.asarray(im.convert('HSV')).astype(np.float32)
h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
warm = np.clip(1 - np.abs(h - 38) / 28, 0, 1) * np.clip((s - 0.2) / 0.4, 0, 1)
w = warm * near_sun
h2 = h + (68 - h) * 0.55 * w
hsv2 = np.stack([h2 * 255 / 360, s * 255, np.clip(v * (1 + 0.06 * w), 0, 1) * 255], -1).clip(0, 255).astype(np.uint8)
a = np.asarray(Image.fromarray(hsv2, 'HSV').convert('RGB')).astype(np.float32) / 255

# Gentle contrast: deeper storm clouds, highlights untouched.
L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
target = np.clip(np.where(L < 0.5, 0.5 * (2 * L) ** 1.18, L), 0, 1)
a = np.clip(a * (target / np.maximum(L, 1e-4))[..., None], 0, 1)

# Small bright core at the sun.
core = (0.35 * np.exp(-(d / 0.03) ** 2))[..., None]
a = 1 - (1 - a) * (1 - np.array([1.0, 1.0, 0.9]) * core)

out = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=3))

def save(img, name, w, q):
    h = round(img.height * w / img.width)
    r = img.resize((w, h), Image.LANCZOS)
    r.save(f"{outdir}/{name}.webp", 'WEBP', quality=q, method=6)
    r.save(f"{outdir}/{name}.jpg", 'JPEG', quality=q - 4, optimize=True, progressive=True)

# Desktop: wide band around the sunburst and the mountain line.
save(out.crop((300, 760, 1900, 1240)), 'hero-wide', 1600, 74)  # 1600x480
# Phones: tighter crop centred on the sun.
save(out.crop((750, 800, 1350, 1250)), 'hero-tall', 600, 74)  # 600x450
