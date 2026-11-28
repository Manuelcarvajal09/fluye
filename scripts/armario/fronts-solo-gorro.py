# Capas front-<gorro> de la pose feliz: deja solo el gorro (quita el pelo de la frente y las orejas que traía la entrega
# original y que tapaban la parte de arriba de los lentes). Compara con base.webp alineada por la línea de pies.
# Uso: python scripts/armario/fronts-solo-gorro.py   (los originales quedan en git)
import json, sys
import numpy as np
from PIL import Image, ImageFilter

D = json.load(open("src/lib/armario-data.json", encoding="utf8"))
SKIP = {"nutria"}  # su entrega ya trae los front solo con el gorro
TOL = 70
done = 0
for pet, m in D["pets"].items():
    if pet in SKIP:
        continue
    for hat, (x, y, w, h) in m["front"].items():
        fpath = f"public/armario/pets/{pet}/front-{hat}.webp"
        fr = Image.open(fpath).convert("RGBA")
        k = fr.size[0] / w
        dy = D["feet"][pet]["base"] - D["feet"][pet].get(hat, D["feet"][pet]["base"])
        base = Image.open(f"public/armario/pets/{pet}/base.webp").convert("RGBA").resize((round(1024 * k), round(1024 * k)), Image.LANCZOS)
        bx, by = round(x * k), round((y + dy) * k)
        crop = np.array(base.crop((bx, by, bx + fr.size[0], by + fr.size[1]))).astype(int)
        f = np.array(fr).astype(int)
        same = (np.abs(f[..., :3] - crop[..., :3]).sum(-1) < TOL) & (crop[..., 3] > 200) & (f[..., 3] > 0)
        # Limpieza: abrir la máscara (erosión + dilatación) quita las motitas sueltas de pelo que la comparación no atrapa,
        # sin tocar el cuerpo del gorro.
        keep = Image.fromarray(((~same) & (f[..., 3] > 0)).astype("uint8") * 255)
        opened = np.array(keep.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))) > 0
        f[~opened, 3] = 0
        Image.fromarray(f.astype("uint8")).save(fpath, "WEBP", lossless=True)
        done += 1
print(f"capas front revisadas: {done}")
