import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import sharp from 'sharp'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../../', import.meta.url))
const here = path.join(root, 'scripts/vfx-preview')
const output = path.resolve(process.argv[2] ?? path.join(root, 'dist/vfx-preview/Arkamon-VFX.html'))
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
try {
  const { MOSSE, POKEMON_BASE } = await server.ssrLoadModule('/src/data/index.ts')
  const { resolveMoveVfxTravel } = await server.ssrLoadModule('/src/components/vfx/moveVfxProfiles.ts')
  const { moveSequence } = await server.ssrLoadModule('/src/components/vfx/signature/sequence.ts')
  const { getMoveVfxAssignment } = await server.ssrLoadModule('/src/components/vfx/moveVfxAssignments.ts')
  const { èMossaCura } = await server.ssrLoadModule('/src/engine/battleEngine.ts')
  const records = []
  for (const move of MOSSE) {
    const owners = POKEMON_BASE.filter(form => form.mosse.includes(move.id))
    const previewOnly = !owners.length
    const forms = previewOnly ? getMoveVfxAssignment(move)?.arkamon?.map(form => POKEMON_BASE.find(p => p.id === form.id)) : owners
    if (!forms?.length || forms.some(form => !form)) throw new Error('Missing owner for ' + move.nome)
    for (const form of forms) {
      const sequence = moveSequence(move, form.id, resolveMoveVfxTravel(move))
      if (!sequence) throw new Error('Missing art for ' + move.nome + ' / ' + form.nome)
      records.push({ id: move.id, name: move.nome, type: move.tipo, form: form.id, owner: form.nome, previewOnly, self: èMossaCura(move), sequence })
    }
  }
  const portraits = {}
  for (const id of new Set(records.map(r => r.form))) {
    const bytes = await sharp(path.join(root, 'public/sprites/front_sprites', id + '.png'))
      .trim({ threshold: 6 }).resize(170, 170, { fit: 'inside' }).webp({ quality: 79 }).toBuffer()
    portraits[id] = 'data:image/webp;base64,' + bytes.toString('base64')
  }
  const atlas = await fs.readFile(path.join(root, 'src/components/vfx/signature/motifs.webp'))
  const payload = JSON.stringify({ records, portraits, atlas: 'data:image/webp;base64,' + atlas.toString('base64') }).replaceAll('<', '\\u003c')
  const bundle = await build({ entryPoints: [path.join(here, 'viewer.ts')], bundle: true, write: false, format: 'iife', minify: true })
  const html = (await fs.readFile(path.join(here, 'viewer.html'), 'utf8'))
    .replace('<!--CATALOG-->', () => '<script id="catalog" type="application/json">' + payload + '</script>')
    .replace('<!--PLAYER-->', () => '<script>' + bundle.outputFiles[0].text + '</script>')
  await fs.mkdir(path.dirname(output), { recursive: true })
  await fs.writeFile(output, html)
  console.log(MOSSE.length + ' moves, ' + records.length + ' sequences: ' + output)
} finally {
  await server.close()
}
