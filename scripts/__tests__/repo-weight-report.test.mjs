import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarize } from '../repo-weight-report.mjs'

test('groups sizes by folder, extension and identical blobs without touching the repository', () => {
  const lines = [
    '100644 blob aaa\t   300\tpublic/sprites/animation/1/idle.mp4',
    '100644 blob aaa\t   300\tanimation-source/raw/1/idle.mp4',
    '100644 blob bbb\t    50\tsrc/App.tsx',
    'not a tree line',
  ]
  const report = summarize(lines, 3)
  assert.equal(report.total, 650)
  assert.equal(report.files, 3)
  assert.equal(report.duplicateBytes, 300)
  assert.deepEqual(report.groups.map((group) => group.path), ['public/sprites/animation', 'animation-source/raw', 'src/App.tsx'])
  assert.equal(report.extensions[0].extension, 'mp4')
})
