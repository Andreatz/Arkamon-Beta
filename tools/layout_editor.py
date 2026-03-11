from __future__ import annotations

import json
import sys
from pathlib import Path

import pygame

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "core"))

from paths import BACKGROUND_DIR, UI_DIR, BACK_SPRITES_DIR, FRONT_SPRITES_DIR

VIRTUAL_W = 1920
VIRTUAL_H = 1080
SCREEN_W  = 1280
SCREEN_H  = 720
PANEL_W   = 340

SX = SCREEN_W / VIRTUAL_W
SY = SCREEN_H / VIRTUAL_H

LAYOUT_FILE = ROOT / "assets" / "ui" / "battle_layout.json"

DEFAULT_LAYOUT = {
    "player_sprite":  {"x": 30,   "y": 390, "w": 460, "h": 460},
    "wild_sprite":    {"x": 880,  "y": 50,  "w": 420, "h": 420},
    "enemy_bar":      {"x": 380,  "y": 30,  "w": 580, "h": 110},
    "player_bar":     {"x": 620,  "y": 480, "w": 580, "h": 110},
    "text_box":       {"x": 30,   "y": 560, "w": 560, "h": 180},
    "move_1":         {"x": 610,  "y": 560, "w": 340, "h": 120},
    "move_2":         {"x": 970,  "y": 560, "w": 340, "h": 120},
    "move_3":         {"x": 1330, "y": 560, "w": 340, "h": 120},
    "capture":        {"x": 610,  "y": 690, "w": 340, "h":  90},
    "switch":         {"x": 970,  "y": 690, "w": 340, "h":  90},
    "enemy_hp_fill":  {"x": 440,  "y": 95,  "w": 470, "h":  20},
    "player_hp_fill": {"x": 680,  "y": 545, "w": 470, "h":  20},
    "enemy_name":     {"x": 440,  "y": 40,  "w":   0, "h":   0},
    "player_name":    {"x": 660,  "y": 490, "w":   0, "h":   0},
    "player_hp_text": {"x": 660,  "y": 548, "w":   0, "h":   0},
}

ELEMENT_COLORS = {
    "player_sprite":  (100, 200, 100),
    "wild_sprite":    (100, 100, 220),
    "enemy_bar":      (220,  80,  80),
    "player_bar":     ( 80,  80, 220),
    "text_box":       (200, 200,  80),
    "move_1":         ( 80, 200, 200),
    "move_2":         ( 80, 200, 200),
    "move_3":         ( 80, 200, 200),
    "capture":        (200, 120,  80),
    "switch":         (200, 120,  80),
    "enemy_hp_fill":  ( 80, 220,  80),
    "player_hp_fill": ( 80, 220,  80),
    "enemy_name":     (255, 255, 100),
    "player_name":    (255, 255, 100),
    "player_hp_text": (255, 200, 100),
}

POINT_ELEMENTS  = {"enemy_name", "player_name", "player_hp_text"}
RESIZE_HANDLE   = 12   # px quadrati della maniglie di resize
SNAP            = 10   # snap virtuale


def vr(x, y, w=0, h=0):
    return pygame.Rect(int(x*SX), int(y*SY),
                       max(1, int(w*SX)), max(1, int(h*SY)))


def to_virtual(px, py):
    return int(px / SX), int(py / SY)


def snap(v, s=SNAP):
    return round(v / s) * s


def load_layout() -> dict:
    if LAYOUT_FILE.exists():
        with LAYOUT_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
        for k, d in DEFAULT_LAYOUT.items():
            if k not in data:
                data[k] = dict(d)
        return data
    return {k: dict(v) for k, v in DEFAULT_LAYOUT.items()}


def save_layout(layout: dict):
    LAYOUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LAYOUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(layout, f, indent=2)
    print(f"[Editor] Salvato in {LAYOUT_FILE}")


def load_image_safe(path: Path, size: tuple, alpha=True):
    if path.exists():
        img = pygame.image.load(str(path))
        img = img.convert_alpha() if alpha else img.convert()
        return pygame.transform.smoothscale(img, size)
    surf = pygame.Surface(size, pygame.SRCALPHA)
    surf.fill((180, 180, 180, 60))
    pygame.draw.rect(surf, (120, 120, 120), surf.get_rect(), 2)
    return surf


def load_sprite_safe(folder: Path, species_id: int, size: tuple):
    for ext in [".png", ".jpg"]:
        for name in [f"{species_id}{ext}", f"{species_id:03}{ext}"]:
            p = folder / name
            if p.exists():
                img = pygame.image.load(str(p)).convert_alpha()
                return pygame.transform.smoothscale(img, size)
    surf = pygame.Surface(size, pygame.SRCALPHA)
    surf.fill((150, 150, 150, 60))
    f = pygame.font.SysFont("arial", 14)
    surf.blit(f.render(f"sprite {species_id}", True, (80,80,80)), (8, size[1]//2-8))
    return surf


# --- handle di ridimensionamento: 8 angoli/bordi ---
HANDLES = ["nw","n","ne","e","se","s","sw","w"]

def get_handle_rects(srect: pygame.Rect) -> dict[str, pygame.Rect]:
    cx, cy = srect.centerx, srect.centery
    hw = RESIZE_HANDLE
    return {
        "nw": pygame.Rect(srect.x,                   srect.y,                   hw, hw),
        "n":  pygame.Rect(cx - hw//2,                srect.y,                   hw, hw),
        "ne": pygame.Rect(srect.right - hw,           srect.y,                   hw, hw),
        "e":  pygame.Rect(srect.right - hw,           cy - hw//2,                hw, hw),
        "se": pygame.Rect(srect.right - hw,           srect.bottom - hw,         hw, hw),
        "s":  pygame.Rect(cx - hw//2,                srect.bottom - hw,         hw, hw),
        "sw": pygame.Rect(srect.x,                   srect.bottom - hw,         hw, hw),
        "w":  pygame.Rect(srect.x,                   cy - hw//2,                hw, hw),
    }


class LayoutEditor:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_W + PANEL_W, SCREEN_H))
        pygame.display.set_caption("Arkamon — Layout Editor  [S=salva  G=griglia  TAB=next]")
        self.clock      = pygame.time.Clock()
        self.font       = pygame.font.SysFont("arial", 13)
        self.font_b     = pygame.font.SysFont("arial", 13, bold=True)
        self.font_lg    = pygame.font.SysFont("arial", 17, bold=True)

        self.layout     = load_layout()
        self.dirty      = False
        self.show_grid  = True

        # stato drag / resize
        self.selected      = None
        self.drag_mode     = None   # "move" | handle-key ("nw","n",...)
        self.drag_offset   = (0, 0)
        self.drag_origin   = {}     # copia dell'elemento all'inizio del drag

        self.bg      = load_image_safe(
            BACKGROUND_DIR / "battle_forest.jpg",
            (SCREEN_W, SCREEN_H), alpha=False)
        self.assets  = {}
        self._reload_assets()

    # ------------------------------------------------------------------ assets

    def _reload_assets(self):
        lo = self.layout
        self.assets = {}

        self.assets["player_sprite"] = load_sprite_safe(
            BACK_SPRITES_DIR, 9,
            (max(1, int(lo["player_sprite"]["w"]*SX)),
             max(1, int(lo["player_sprite"]["h"]*SY))))

        self.assets["wild_sprite"] = load_sprite_safe(
            FRONT_SPRITES_DIR, 20,
            (max(1, int(lo["wild_sprite"]["w"]*SX)),
             max(1, int(lo["wild_sprite"]["h"]*SY))))

        ui_map = {
            "enemy_bar":  "hp_bar_enemy.png",
            "player_bar": "hp_bar_player.png",
            "text_box":   "infobox.png",
            "move_1":     "move_button.png",
            "move_2":     "move_button.png",
            "move_3":     "move_button.png",
            "capture":    "general_button.png",
            "switch":     "general_button.png",
        }
        for key, fname in ui_map.items():
            e = lo[key]
            self.assets[key] = load_image_safe(
                UI_DIR / fname,
                (max(1, int(e["w"]*SX)), max(1, int(e["h"]*SY))))

    # ------------------------------------------------------------------ rect helpers

    def _srect(self, key: str) -> pygame.Rect:
        e = self.layout[key]
        if key in POINT_ELEMENTS:
            return pygame.Rect(int(e["x"]*SX), int(e["y"]*SY), 20, 20)
        return pygame.Rect(
            int(e["x"]*SX), int(e["y"]*SY),
            max(1, int(e["w"]*SX)), max(1, int(e["h"]*SY)))

    # ------------------------------------------------------------------ events

    def run(self):
        running = True
        while running:
            self.clock.tick(60)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False

                elif event.type == pygame.KEYDOWN:
                    self._on_key(event)

                elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    if event.pos[0] < SCREEN_W:
                        self._start_interaction(event.pos)

                elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
                    if self.drag_mode is not None:
                        self._reload_assets()
                    self.drag_mode = None

                elif event.type == pygame.MOUSEMOTION:
                    if self.drag_mode and event.pos[0] < SCREEN_W + 10:
                        self._do_interaction(event.pos)

                # scroll wheel: ridimensiona rapidamente W e H
                elif event.type == pygame.MOUSEWHEEL and self.selected:
                    self._scroll_resize(event)

            self._draw()
        pygame.quit()

    def _on_key(self, event):
        if event.key == pygame.K_ESCAPE:
            pygame.event.post(pygame.event.Event(pygame.QUIT))
        elif event.key == pygame.K_s:
            save_layout(self.layout)
            self.dirty = False
        elif event.key == pygame.K_g:
            self.show_grid = not self.show_grid
        elif event.key == pygame.K_r:
            self.layout = {k: dict(v) for k, v in DEFAULT_LAYOUT.items()}
            self._reload_assets()
            self.dirty = True
        elif event.key == pygame.K_TAB:
            self._select_next()
        elif event.key in (pygame.K_LEFT, pygame.K_RIGHT, pygame.K_UP, pygame.K_DOWN):
            self._nudge_pos(event.key, pygame.key.get_mods() & pygame.KMOD_SHIFT)
        elif event.key in (pygame.K_PLUS, pygame.K_KP_PLUS,
                           pygame.K_EQUALS, pygame.K_MINUS, pygame.K_KP_MINUS):
            self._nudge_size(event.key, pygame.key.get_mods() & pygame.KMOD_SHIFT)

    def _select_next(self):
        keys = list(self.layout.keys())
        if not self.selected or self.selected not in keys:
            self.selected = keys[0]
        else:
            self.selected = keys[(keys.index(self.selected) + 1) % len(keys)]

    def _nudge_pos(self, key, fast):
        if not self.selected:
            return
        step = SNAP * (5 if fast else 1)
        e = self.layout[self.selected]
        if   key == pygame.K_LEFT:  e["x"] -= step
        elif key == pygame.K_RIGHT: e["x"] += step
        elif key == pygame.K_UP:    e["y"] -= step
        elif key == pygame.K_DOWN:  e["y"] += step
        self.dirty = True

    def _nudge_size(self, key, fast):
        if not self.selected or self.selected in POINT_ELEMENTS:
            return
        step = SNAP * (5 if fast else 1)
        e = self.layout[self.selected]
        grow = key in (pygame.K_PLUS, pygame.K_KP_PLUS, pygame.K_EQUALS)
        if pygame.key.get_mods() & pygame.KMOD_CTRL:
            e["h"] = max(SNAP, e["h"] + (step if grow else -step))
        else:
            e["w"] = max(SNAP, e["w"] + (step if grow else -step))
        self._reload_assets()
        self.dirty = True

    def _scroll_resize(self, event):
        if self.selected in POINT_ELEMENTS:
            return
        e    = self.layout[self.selected]
        mods = pygame.key.get_mods()
        step = SNAP * (5 if mods & pygame.KMOD_SHIFT else 1)
