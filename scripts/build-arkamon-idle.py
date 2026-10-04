#!/usr/bin/env python3
"""Convert an original green-screen idle video into a static transparent atlas.

Requires Python 3.10+, Pillow, NumPy, and FFmpeg. The optional imageio-ffmpeg
package can supply the FFmpeg executable. No frame is generated or interpolated.
Example:
  python scripts/build-arkamon-idle.py --source animation-source/raw/5/front/idle.mp4 \
    --output public/sprites/arkamon/5/front --qa-dir ../qa \
    --reference public/sprites/front_sprites/5.png --ffmpeg /path/to/ffmpeg
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageOps


def ffmpeg_path(explicit: str | None) -> str:
    if explicit:
        return str(Path(explicit).resolve())
    candidate = shutil.which("ffmpeg")
    if candidate:
        return candidate
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except (ImportError, AttributeError) as exc:
        raise SystemExit("FFmpeg is required: use --ffmpeg PATH or install imageio-ffmpeg.") from exc


def probe(ffmpeg: str, source: Path) -> dict:
    result = subprocess.run([ffmpeg, "-hide_banner", "-i", str(source)],
                            capture_output=True, text=True, check=False)
    text = result.stderr
    duration = re.search(r"Duration: (\d+):(\d+):([\d.]+)", text)
    video = next((line for line in text.splitlines() if "Video:" in line), "")
    dimensions = re.search(r"\b(\d{2,5})x(\d{2,5})\b", video)
    fps = re.search(r"([\d.]+) fps", video)
    if not (duration and dimensions and fps):
        raise SystemExit("Could not read source duration, dimensions, or nominal frame rate.")
    hours, minutes, seconds = map(float, duration.groups())
    version = subprocess.run([ffmpeg, "-version"], capture_output=True, text=True,
                             check=True).stdout.splitlines()[0]
    return {"width": int(dimensions[1]), "height": int(dimensions[2]),
            "fps": float(fps[1]), "durationSeconds": hours * 3600 + minutes * 60 + seconds,
            "ffmpegVersion": version}


def remove_green(image: Image.Image, cutoff: float = 0.08) -> tuple[Image.Image, list]:
    """Estimate soft coverage from green excess, then unmix and remove edge spill.

    The corner estimate is recalculated per source frame; the spatial transform
    is fixed later across all frames. Dark outlines, purple fur and red eyes
    have no positive green excess and retain full opacity.
    """
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    h, w = rgb.shape[:2]
    s = max(8, min(h, w) // 18)
    corners = np.concatenate([rgb[:s, :s].reshape(-1, 3), rgb[:s, -s:].reshape(-1, 3),
                              rgb[-s:, :s].reshape(-1, 3), rgb[-s:, -s:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    bg_excess = float(bg[1] - max(bg[0], bg[2]))
    if bg_excess < 25:
        raise ValueError("Source corners are not sufficiently green for this converter.")
    excess = rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    alpha = np.clip(1.0 - np.maximum(excess, 0.0) / bg_excess, 0.0, 1.0)
    alpha[alpha < cutoff] = 0.0
    safe_alpha = np.maximum(alpha, 1.0 / 255.0)
    recovered = np.clip((rgb - (1.0 - alpha[:, :, None]) * bg) / safe_alpha[:, :, None], 0, 255)
    edge = alpha < 0.999
    neutral_green = np.maximum(recovered[:, :, 0], recovered[:, :, 2])
    recovered[:, :, 1] = np.where(edge, np.minimum(recovered[:, :, 1], neutral_green),
                                 recovered[:, :, 1])
    recovered[alpha == 0] = 0
    rgba = np.concatenate([np.rint(recovered).astype(np.uint8),
                           np.rint(alpha[:, :, None] * 255).astype(np.uint8)], axis=2)
    return Image.fromarray(rgba), bg.astype(int).tolist()


def bounds(image: Image.Image) -> tuple[int, int, int, int]:
    box = image.getchannel("A").getbbox()
    if box is None:
        raise ValueError("A source frame became completely transparent.")
    return box


def frame_difference(a: Image.Image, b: Image.Image) -> dict:
    aa = np.asarray(a, dtype=np.float32) / 255
    bb = np.asarray(b, dtype=np.float32) / 255
    body = np.maximum(aa[:, :, 3], bb[:, :, 3]) > 0.1
    a_rgb = aa[:, :, :3] * aa[:, :, 3:4]
    b_rgb = bb[:, :, :3] * bb[:, :, 3:4]
    mae = np.abs(a_rgb - b_rgb).mean(axis=2)
    alpha_mae = np.abs(aa[:, :, 3] - bb[:, :, 3])
    return {"bodyPremultipliedRgbMeanAbsoluteDifference": round(float(mae[body].mean()), 6),
            "bodyAlphaMeanAbsoluteDifference": round(float(alpha_mae[body].mean()), 6),
            "bodyChangedPixelFractionOver5Percent": round(float((mae[body] > .05).mean()), 6)}


def save_contacts(frames: list[Image.Image], qa: Path, battle: Path | None, fps: int) -> None:
    indices = np.linspace(0, len(frames) - 1, min(12, len(frames)), dtype=int).tolist()
    cell = frames[0].width
    contact_columns = min(4, len(indices))
    contact_rows = math.ceil(len(indices) / contact_columns)
    for name, color in [("dark", (16, 23, 34)), ("light", (239, 243, 248)), ("battle", (55, 83, 58))]:
        sheet = Image.new("RGB", (cell * contact_columns, (cell + 28) * contact_rows), color)
        draw = ImageDraw.Draw(sheet)
        background = None
        if name == "battle" and battle:
            background = ImageOps.fit(Image.open(battle).convert("RGB"), (cell, cell))
        for slot, index in enumerate(indices):
            x, y = slot % contact_columns * cell, slot // contact_columns * (cell + 28)
            tile = (background.copy() if background else Image.new("RGB", (cell, cell), color))
            tile.paste(frames[index], (0, 0), frames[index])
            sheet.paste(tile, (x, y))
            draw.text((x + 12, y + cell + 6), f"Frame {index + 1:02d} / t={index / fps:.3f}s", fill=(255, 255, 255) if name != "light" else (20, 30, 42))
        sheet.save(qa / f"contact-{name}.jpg", quality=96, subsampling=0)
    seam = Image.new("RGB", (cell * 2, cell + 28), (239, 243, 248))
    draw = ImageDraw.Draw(seam)
    for slot, index in enumerate([0, len(frames) - 1]):
        seam.paste(frames[index], (slot * cell, 0), frames[index])
        draw.text((slot * cell + 12, cell + 6), f"{'First' if slot == 0 else 'Last'} sampled frame {index + 1}", fill=(20, 30, 42))
    seam.save(qa / "loop-seam.jpg", quality=96, subsampling=0)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--qa-dir", type=Path)
    parser.add_argument("--reference", type=Path)
    parser.add_argument("--battle-background", type=Path)
    parser.add_argument("--ffmpeg")
    parser.add_argument("--fps", type=int, default=12)
    parser.add_argument("--frames", type=int, default=48)
    parser.add_argument("--cell", type=int, default=384)
    parser.add_argument("--columns", type=int, default=8)
    parser.add_argument("--occupancy", type=float, default=1874 / 2048)
    parser.add_argument("--ground", type=float, default=1956 / 2048)
    parser.add_argument("--alpha-cutoff", type=float, default=.08)
    args = parser.parse_args()
    for name in ("fps", "frames", "cell", "columns"):
        if getattr(args, name) <= 0:
            parser.error(f"--{name} must be a positive integer.")
    if not 0 < args.occupancy <= 1:
        parser.error("--occupancy must be greater than 0 and at most 1.")
    if not 0 < args.ground <= 1:
        parser.error("--ground must be greater than 0 and at most 1.")
    if not 0 <= args.alpha_cutoff < 1:
        parser.error("--alpha-cutoff must be at least 0 and less than 1.")
    source, output = args.source.resolve(), args.output.resolve()
    ffmpeg = ffmpeg_path(args.ffmpeg)
    info = probe(ffmpeg, source)
    stride = round(info["fps"] / args.fps)
    if stride < 1 or not math.isclose(info["fps"], stride * args.fps, abs_tol=.001):
        raise SystemExit("This converter requires an integer source/output FPS ratio; it never interpolates.")
    if info["durationSeconds"] + .001 < args.frames / args.fps:
        raise SystemExit("The source is shorter than the requested animation duration.")
    output.mkdir(parents=True, exist_ok=True)
    qa = args.qa_dir.resolve() if args.qa_dir else None
    if qa:
        qa.mkdir(parents=True, exist_ok=True)
    frame_boxes, backgrounds, keyed = [], [], []
    with tempfile.TemporaryDirectory(prefix="arkamon-idle-") as temporary:
        decode = Path(temporary)
        filter_string = f"select='not(mod(n,{stride}))',setpts=N/({args.fps}*TB)"
        command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                   "-vf", filter_string, "-fps_mode", "passthrough", "-frames:v", str(args.frames),
                   str(decode / "frame-%03d.png")]
        subprocess.run(command, check=True)
        paths = sorted(decode.glob("frame-*.png"))
        if len(paths) != args.frames:
            raise SystemExit(f"Expected {args.frames} decoded frames, received {len(paths)}.")
        for path in paths:
            rgba, background = remove_green(Image.open(path), args.alpha_cutoff)
            frame_boxes.append(bounds(rgba))
            backgrounds.append(background)
            keyed.append(rgba)
        if qa:
            Image.open(paths[0]).save(qa / "source-first.png")
            Image.open(paths[-1]).save(qa / "source-last.png")
    crop = (min(b[0] for b in frame_boxes), min(b[1] for b in frame_boxes),
            max(b[2] for b in frame_boxes), max(b[3] for b in frame_boxes))
    ref_meta = None
    occupancy, ground = args.occupancy, args.ground
    if args.reference:
        reference = Image.open(args.reference).convert("RGBA")
        ref_box = bounds(reference)
        occupancy = (ref_box[3] - ref_box[1]) / reference.height
        ground = ref_box[3] / reference.height
        ref_meta = {"size": list(reference.size), "alphaBounds": list(ref_box),
                    "bodyHeightFraction": occupancy, "groundFraction": ground}
    crop_width, crop_height = crop[2] - crop[0], crop[3] - crop[1]
    scale = min(args.cell * occupancy / crop_height, (args.cell - 2) / crop_width)
    target_width, target_height = round(crop_width * scale), round(crop_height * scale)
    position = (round((args.cell - target_width) / 2), round(args.cell * ground) - target_height)
    if position[1] < 0 or position[1] + target_height > args.cell:
        raise SystemExit("Requested occupancy and ground placement would clip the sprite.")
    normalized = []
    for image in keyed:
        tile = Image.new("RGBA", (args.cell, args.cell), (0, 0, 0, 0))
        resized = image.crop(crop).resize((target_width, target_height), Image.Resampling.LANCZOS)
        # Remove any tiny rounding overshoot from the resampling filter.
        pixels = np.asarray(resized).copy()
        soft_edge = pixels[:, :, 3] < 255
        pixels[:, :, 1] = np.where(soft_edge,
                                   np.minimum(pixels[:, :, 1], np.maximum(pixels[:, :, 0], pixels[:, :, 2])),
                                   pixels[:, :, 1])
        pixels[pixels[:, :, 3] == 0, :3] = 0
        tile.paste(Image.fromarray(pixels), position)
        normalized.append(tile)
    rows = math.ceil(args.frames / args.columns)
    atlas = Image.new("RGBA", (args.cell * args.columns, args.cell * rows), (0, 0, 0, 0))
    for i, tile in enumerate(normalized):
        atlas.paste(tile, (i % args.columns * args.cell, i // args.columns * args.cell))
    atlas_path, poster_path = output / "idle.webp", output / "idle-poster.webp"
    atlas.save(atlas_path, format="WEBP", lossless=True, quality=100, method=6, exact=True)
    normalized[0].save(poster_path, format="WEBP", lossless=True, quality=100, method=6, exact=True)
    loaded = Image.open(atlas_path)
    if getattr(loaded, "n_frames", 1) != 1 or loaded.size != atlas.size:
        raise RuntimeError("The atlas must be a single static image with the expected dimensions.")
    if not np.array_equal(np.asarray(loaded.convert("RGBA")), np.asarray(atlas)):
        raise RuntimeError("The lossless atlas failed the decoded RGBA equality check.")
    adjacent = [frame_difference(normalized[i], normalized[i + 1]) for i in range(len(normalized) - 1)]
    seam = frame_difference(normalized[-1], normalized[0])
    adjacent_mae = [m["bodyPremultipliedRgbMeanAbsoluteDifference"] for m in adjacent]
    adjacent_median = float(np.median(adjacent_mae)) if adjacent_mae else 0.0
    seam["adjacentMedianBodyRgbDifference"] = round(adjacent_median, 6)
    seam["adjacentMaxBodyRgbDifference"] = round(float(max(adjacent_mae, default=0.0)), 6)
    seam["seamToAdjacentMedianRatio"] = round(seam["bodyPremultipliedRgbMeanAbsoluteDifference"] / max(adjacent_median, 1e-9), 3)
    green_pixels, occupied_pixels, red_pixels = 0, 0, 0
    for tile in normalized:
        pixels = np.asarray(tile).astype(np.int16)
        body = pixels[:, :, 3] > 16
        green = (pixels[:, :, 1] > np.maximum(pixels[:, :, 0], pixels[:, :, 2]) + 8) & body
        red = (pixels[:, :, 0] > pixels[:, :, 1] + 35) & (pixels[:, :, 0] > pixels[:, :, 2] + 20) & body
        green_pixels += int(green.sum())
        occupied_pixels += int(body.sum())
        red_pixels += int(red.sum())
    metadata = {"schemaVersion": 1, "speciesId": 5, "view": "front", "action": "idle",
                "source": {"file": "animation-source/raw/5/front/idle.mp4", "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                           "sizeBytes": source.stat().st_size, **info},
                "sampling": {"method": "select original source frames; no interpolation or generation",
                             "sourceFrameIndices": list(range(0, args.frames * stride, stride)),
                             "sampleTimesSeconds": [round(i / args.fps, 6) for i in range(args.frames)],
                             "firstSampleSeconds": 0, "lastSampleSeconds": (args.frames - 1) / args.fps},
                "sheet": {"file": "idle.webp", "format": "static lossless WebP RGBA", "animated": False,
                          "cellWidth": args.cell, "cellHeight": args.cell, "columns": args.columns, "rows": rows,
                          "frameCount": args.frames, "fps": args.fps, "durationSeconds": args.frames / args.fps,
                          "width": atlas.width, "height": atlas.height, "sizeBytes": atlas_path.stat().st_size},
                "poster": {"file": "idle-poster.webp", "frameIndex": 0, "sizeBytes": poster_path.stat().st_size},
                "transform": {"sourceUnionAlphaBounds": list(crop), "sourceFrameAlphaBounds": [list(b) for b in frame_boxes],
                              "fixedTransformAcrossFrames": True, "scale": scale, "resizedCrop": [target_width, target_height],
                              "pasteOrigin": list(position), "groundPivot": [args.cell / 2, round(args.cell * ground)],
                              "reference": ref_meta},
                "key": {"method": "corner-sampled green excess soft alpha; background unmix and edge despill before and after resampling",
                        "alphaCutoff": args.alpha_cutoff, "backgroundRgbByFrame": backgrounds},
                "qa": {"losslessDecodedRgbaMatches": True, "remainingGreenDominantPixelsOver8": green_pixels,
                       "occupiedPixelsAllFrames": occupied_pixels, "redDominantPixelsAllFrames": red_pixels,
                       "loopSeam": seam, "loopSeamPerfect": False,
                       "notes": "The source seam is measured and preserved; no loop correction or crossfade was applied."}}
    if qa:
        durations = [round((i + 1) * 1000 / args.fps) - round(i * 1000 / args.fps) for i in range(args.frames)]
        preview = qa / "idle-transparent-preview.webp"
        normalized[0].save(preview, format="WEBP", save_all=True, append_images=normalized[1:],
                           duration=durations, loop=0, lossless=True, quality=100, method=4,
                           exact=True, minimize_size=False, background=(0, 0, 0, 0))
        save_contacts(normalized, qa, args.battle_background, args.fps)
        metadata["qa"]["previewSizeBytes"] = preview.stat().st_size
        (qa / "conversion-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    (output / "idle.metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"sourceUnionAlphaBounds": crop, "sourceFirstAlphaBounds": frame_boxes[0],
                      "sourceLastAlphaBounds": frame_boxes[-1], "sheet": metadata["sheet"],
                      "transform": {k: metadata["transform"][k] for k in ["scale", "resizedCrop", "pasteOrigin", "groundPivot"]},
                      "qa": metadata["qa"]}, indent=2))


if __name__ == "__main__":
    main()
