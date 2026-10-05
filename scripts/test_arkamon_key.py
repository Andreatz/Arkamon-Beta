#!/usr/bin/env python3
"""Regression tests for opt-in fringe keying and source-verified atlas geometry.

Run with Python, Pillow and NumPy: python scripts/test_arkamon_key.py
The suite uses small synthetic RGB fixtures; no FFmpeg or external media needed.
"""
from __future__ import annotations

import colorsys
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

import numpy as np
from PIL import Image

_spec = importlib.util.spec_from_file_location('arkamon_key', Path(__file__).with_name('build-arkamon-idle.py'))
converter = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(converter)


def source_patch(colour: tuple[int, int, int]) -> Image.Image:
    image = Image.new('RGB', (128, 128), (20, 180, 40))
    image.paste(colour, (48, 48, 80, 80))
    return image


class FringeKeyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.previous = (converter.SCREEN_DOMINANCE_CLEANUP, converter.SCREEN_FRINGE_CLEANUP)
        converter.SCREEN_DOMINANCE_CLEANUP = False
        converter.SCREEN_FRINGE_CLEANUP = False

    def tearDown(self) -> None:
        converter.SCREEN_DOMINANCE_CLEANUP, converter.SCREEN_FRINGE_CLEANUP = self.previous

    def test_opt_in_removes_yellow_and_olive_that_legacy_key_retains(self) -> None:
        for colour in [(130, 125, 20), (105, 115, 24), (145, 130, 35)]:
            with self.subTest(colour=colour):
                converter.SCREEN_FRINGE_CLEANUP = False
                _, legacy, _ = converter.key_alpha(source_patch(colour))
                self.assertGreater(float(legacy[64, 64]), .85)
                converter.SCREEN_FRINGE_CLEANUP = True
                _, cleaned, _ = converter.key_alpha(source_patch(colour))
                self.assertEqual(float(cleaned[64, 64]), 0)

    def test_enclosed_screen_pocket_is_removed_without_eroding_dark_surround(self) -> None:
        image = source_patch((65, 65, 68))
        image.paste((130, 125, 20), (58, 58, 70, 70))
        converter.SCREEN_FRINGE_CLEANUP = True
        keyed, _ = converter.remove_green(image)
        pixels = np.asarray(keyed)
        self.assertTrue(np.all(pixels[58:70, 58:70] == 0))
        np.testing.assert_array_equal(pixels[50, 50], [65, 65, 68, 255])

    def test_alpha_fades_continuously_over_35_to_45_degrees(self) -> None:
        hues = [35, 37.5, 40, 42.5, 45]
        colours = np.array([[colorsys.hsv_to_rgb(h/360, .8, 180) for h in hues]], dtype=np.float32)
        mask, coverage = converter.screen_fringe_mask(colours)
        self.assertTrue(mask.all())
        np.testing.assert_allclose(coverage[0], [1, .75, .5, .25, 0], atol=1e-5)
        self.assertTrue(np.all(np.diff(coverage[0]) < 0))

    def test_neutral_dark_red_purple_and_orange_pixels_are_preserved_exactly(self) -> None:
        converter.SCREEN_FRINGE_CLEANUP = True
        for colour in [(70, 70, 74), (210, 35, 55), (125, 55, 170), (180, 90, 22)]:
            with self.subTest(colour=colour):
                keyed, _ = converter.remove_green(source_patch(colour))
                np.testing.assert_array_equal(np.asarray(keyed)[64, 64], [*colour, 255])

    def test_bright_and_medium_warm_hit_light_survive_yellow_fringe_profile(self) -> None:
        converter.SCREEN_FRINGE_CLEANUP = True
        for colour in [(240, 236, 35), (205, 180, 25), (255, 252, 190)]:
            with self.subTest(colour=colour):
                mask, _ = converter.screen_fringe_mask(np.array([[colour]], dtype=np.float32))
                self.assertFalse(mask[0, 0])
                keyed, _ = converter.remove_green(source_patch(colour))
                np.testing.assert_array_equal(np.asarray(keyed)[64, 64], [*colour, 255])

    def test_default_off_retains_legacy_green_feature_coverage(self) -> None:
        image = source_patch((120, 140, 45))
        _, legacy, _ = converter.key_alpha(image)
        # Keep the pre-existing key behaviour for characters with green details.
        self.assertAlmostEqual(float(legacy[64, 64]), 1-20/140, places=6)
        self.assertGreater(float(legacy[64, 64]), .8)
        converter.SCREEN_FRINGE_CLEANUP = True
        _, opted_in, _ = converter.key_alpha(image)
        self.assertEqual(float(opted_in[64, 64]), 0)

    def test_only_screen_like_saturated_colours_enter_fringe_mask(self) -> None:
        colours = np.array([[(18, 20, 4), (160, 156, 155), (55, 80, 170), (180, 90, 22)]], dtype=np.float32)
        mask, _ = converter.screen_fringe_mask(colours)
        self.assertFalse(mask.any())

    def test_action_profile_preserves_neutral_smoke_and_cyan_trails(self) -> None:
        converter.SCREEN_FRINGE_CLEANUP = False
        image = source_patch((50, 140, 90))
        _, original, _ = converter.key_alpha(image)
        converter.SCREEN_FRINGE_CLEANUP = True
        _, idle, _ = converter.key_alpha(image)
        _, action, _ = converter.key_alpha(image, preserve_effects=True)
        self.assertEqual(float(idle[64,64]), 0)
        np.testing.assert_array_equal(action, original)
        _, pocket, _ = converter.key_alpha(source_patch((130,125,20)), preserve_effects=True)
        self.assertEqual(float(pocket[64,64]), 0)

    def test_action_gold_bloom_is_local_and_does_not_protect_unlit_screen_fringe(self) -> None:
        rgb = np.full((48,48,3), (130,125,20), dtype=np.float32)
        rgb[24,24] = (240,230,30)
        rgb[24,28] = (180,174,35)
        broad, _ = converter.screen_fringe_mask(rgb)
        action, _ = converter.screen_fringe_mask(rgb, preserve_effects=True)
        self.assertTrue(broad[24,28])
        self.assertFalse(action[24,28])
        self.assertTrue(action[24,34])
        rgb[24,28] = (100,170,20)
        action, _ = converter.screen_fringe_mask(rgb, preserve_effects=True)
        self.assertTrue(action[24,28])

    def test_hit_keeps_previously_visible_pale_dust_without_restoring_olive(self) -> None:
        converter.SCREEN_DOMINANCE_CLEANUP = True
        image = source_patch((190,210,165))
        _, original, _ = converter.key_alpha(image)
        converter.SCREEN_FRINGE_CLEANUP = True
        _, attack, _ = converter.key_alpha(image, **converter.action_key_options('attack'))
        _, hit, _ = converter.key_alpha(image, **converter.action_key_options('hit'))
        self.assertEqual(float(attack[64,64]), 0)
        np.testing.assert_array_equal(hit, original)
        _, olive, _ = converter.key_alpha(source_patch((130,125,20)), **converter.action_key_options('hit'))
        self.assertEqual(float(olive[64,64]), 0)

    def test_victory_protects_warm_cores_without_growing_an_olive_aura(self) -> None:
        rgb = np.full((48,48,3), (130,125,20), dtype=np.float32)
        rgb[24,24] = (240,230,30)
        rgb[24,28] = (180,174,35)
        attack, _ = converter.screen_fringe_mask(rgb, **converter.action_key_options('attack'))
        victory, _ = converter.screen_fringe_mask(rgb, **converter.action_key_options('victory'))
        self.assertFalse(attack[24,28])
        self.assertTrue(victory[24,28])
        self.assertFalse(victory[24,24])


class ReuseGeometryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix='arkamon-key-regression-')
        self.folder = Path(self.temporary.name)
        self.common = {'cellWidth':64, 'cellHeight':64, 'viewport':{'width':48, 'height':48, 'left':8, 'top':8},
                       'sharedScale':1.0, 'logicalCanvasOrigin':[-40, -40], 'groundPivot':[32,56],
                       'maxTextureDimension':8192, 'referenceAction':'idle', 'paddingPixels':8}
        self.camera = {'nativeToIdleCoordinateScale':1.0, 'nativeToIdleCoordinateOffset':[0,0],
                       'constantForEntireClip':True, 'initialBodyCoreBounds':[48,48,80,80]}
        self.timing = {'releaseFrame':47, 'releaseMs':47/24*1000, 'evidence':'Fixture release marker'}
        self.paths = []
        for i in range(96):
            image = source_patch((60+i, 45, 60))
            # Legacy crop includes a screen-coloured ring that the new profile removes.
            image.paste((130,125,20), (40,40,88,88))
            image.paste((60+i,45,60), (48,48,80,80))
            path = self.folder/f'frame-{i:04d}.png'
            image.save(path)
            self.paths.append(path)
        self.info = {'sha256':'original-source-hash', 'width':128, 'height':128, 'fps':24.0,
                     'decodedFrameCount':96, 'durationFromFramesSeconds':4.0}
        self.old = {'speciesId':6, 'action':'attack', 'source':copy.deepcopy(self.info),
                    'sheet':{'frameCount':96, 'fps':24.0, 'columns':10},
                    'transform':{'sharedTransform':copy.deepcopy(self.common), 'sourceUnionAlphaBounds':[40,40,88,88],
                                 'cameraCalibration':copy.deepcopy(self.camera)}, 'timing':copy.deepcopy(self.timing)}
        (self.folder/'animation-set.normalization.json').write_text(json.dumps(self.common), encoding='utf-8')
        (self.folder/'attack.metadata.json').write_text(json.dumps(self.old), encoding='utf-8')
        self.clip = {'action':'attack', 'info':copy.deepcopy(self.info), 'paths':self.paths,
                     'union':(48,48,80,80), 'boxes':[(48,48,80,80)]*96}
        self.previous = (converter.SCREEN_DOMINANCE_CLEANUP, converter.SCREEN_FRINGE_CLEANUP)
        converter.SCREEN_DOMINANCE_CLEANUP = False
        converter.SCREEN_FRINGE_CLEANUP = True

    def tearDown(self) -> None:
        converter.SCREEN_DOMINANCE_CLEANUP, converter.SCREEN_FRINGE_CLEANUP = self.previous
        self.temporary.cleanup()

    def test_refuses_to_reuse_geometry_from_a_different_original_source(self) -> None:
        self.clip['info']['sha256'] = 'changed-source-hash'
        with self.assertRaisesRegex(ValueError, 'source or metadata differs'):
            converter.reuse_normalization([self.clip], self.folder, 6)

    def test_refuses_changed_fps_count_dimensions_or_species(self) -> None:
        for field, value in [('fps',30.0), ('width',256), ('height',256)]:
            with self.subTest(field=field):
                changed = copy.deepcopy(self.clip)
                changed['info'][field] = value
                with self.assertRaises(ValueError):
                    converter.reuse_normalization([changed], self.folder, 6)
        short = copy.deepcopy(self.clip)
        short['paths'] = short['paths'][:-1]
        with self.assertRaises(ValueError):
            converter.reuse_normalization([short], self.folder, 6)
        with self.assertRaises(ValueError):
            converter.reuse_normalization([self.clip], self.folder, 7)

    def test_refuses_to_clip_new_content_outside_the_existing_crop(self) -> None:
        self.clip['union'] = (39,48,80,80)
        with self.assertRaisesRegex(ValueError, 'exceed the previous source crop'):
            converter.reuse_normalization([self.clip], self.folder, 6)

    def test_valid_rekey_preserves_geometry_all_native_frames_and_release_marker(self) -> None:
        common = converter.reuse_normalization([self.clip], self.folder, 6)
        self.assertEqual(common, self.common)
        self.assertEqual(self.clip['union'], (40,40,88,88))
        self.assertEqual(self.clip['camera'], self.camera)
        output = self.folder/'converted'
        output.mkdir()
        with contextlib.redirect_stdout(io.StringIO()):
            metadata, _ = converter.convert_clip(self.clip, common, output, None, '', None, .08, 0, None, 6)
        self.assertEqual(metadata['timing'], self.timing)
        self.assertEqual(metadata['transform']['sharedTransform'], self.common)
        self.assertEqual(metadata['transform']['cameraCalibration'], self.camera)
        self.assertEqual(metadata['transform']['sourceUnionAlphaBounds'], [40,40,88,88])
        self.assertEqual(metadata['sampling']['sourceFrameIndices'], list(range(96)))
        self.assertEqual(metadata['sheet']['frameCount'], 96)
        self.assertEqual(metadata['sheet']['fps'], 24.0)
        self.assertEqual(metadata['sheet']['durationMs'], 4000)
        self.assertEqual(metadata['sheet']['viewport'], self.common['viewport'])
        self.assertEqual((metadata['sheet']['cellWidth'], metadata['sheet']['columns']), (64,10))
        with Image.open(output/'attack.webp') as atlas:
            self.assertEqual(atlas.size, (640,640))
            for i in range(96):
                cell = atlas.crop((i%10*64, i//10*64, i%10*64+64, i//10*64+64))
                self.assertEqual(cell.getchannel('A').getbbox(), (16,16,48,48))
                self.assertEqual(cell.getpixel((32,32)), (60+i,45,60,255))
            for i in range(96,100):
                self.assertIsNone(atlas.crop((i%10*64,i//10*64,i%10*64+64,i//10*64+64)).getchannel('A').getbbox())


if __name__ == '__main__':
    unittest.main(verbosity=2)
