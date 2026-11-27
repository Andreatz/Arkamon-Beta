"""Anteprima di un VFX disegnato in codice: foglio dei fotogrammi su fondo scuro e su battaglia."""
import importlib, sys, time
import numpy as np
from PIL import Image
name = sys.argv[1]; out = sys.argv[2]
mod = importlib.import_module(name)
t0 = time.time(); frames, meta = mod.build(); print(name, len(frames), 'frames', f'{time.time()-t0:.1f}s', meta)
bg = np.asarray(Image.open('/home/claude/repo/public/backgrounds/battle_forest.jpg').convert('RGB').resize((512, 512)), np.float32) / 255
cols = 7; rows = (len(frames) + cols - 1) // cols
sheet = np.zeros((rows * 256, cols * 256 * 2, 3), np.float32)
for i, fr in enumerate(frames):
    a = fr[..., 3:4]
    dark = fr[..., :3] * a + np.array([0.13, 0.14, 0.17]) * (1 - a)
    batt = fr[..., :3] * a + bg * (1 - a)
    r, c = divmod(i, cols)
    sheet[r*256:(r+1)*256, c*256:(c+1)*256] = np.asarray(Image.fromarray((dark*255).astype(np.uint8)).resize((256,256)), np.float32)/255
    sheet[r*256:(r+1)*256, (cols+c)*256:(cols+c+1)*256] = np.asarray(Image.fromarray((batt*255).astype(np.uint8)).resize((256,256)), np.float32)/255
Image.fromarray((sheet*255).astype(np.uint8)).save(out, quality=88)
