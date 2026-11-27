import { drawSequence } from '../../src/components/vfx/signature/draw'
import type { MoveSequence } from '../../src/components/vfx/signature/sequence'
interface Entry { id: number; name: string; type: string; form: number; owner: string; sequence: MoveSequence; self: boolean; previewOnly: boolean }
const {records, portraits, atlas: url} = JSON.parse(document.getElementById('catalog')!.textContent!) as {
  records: Entry[]; portraits: Record<number,string>; atlas: string
}
function el<T extends HTMLElement>(id: string) { return document.getElementById(id) as T }
const list = el('list'), search = el<HTMLInputElement>('search'), stage = el('stage')
const slider = el<HTMLInputElement>('scrub'), play = el<HTMLButtonElement>('play')
const atlas = new Image(), canvas = stage.querySelector('canvas')!, ctx = canvas.getContext('2d')!
const initialId = records.findIndex(row => row.id === 217)
let current = records[initialId < 0 ? 0 : initialId], elapsed = current.sequence.impact, playing = false, frame = 0, start = 0
function paint() {
  const w = stage.clientWidth, h = stage.clientHeight, ratio = Math.min(devicePixelRatio, 1.5)
  const width = Math.round(w*ratio), height = Math.round(h*ratio)
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
  ctx.setTransform(ratio,0,0,ratio,0,0)
  ctx.clearRect(0,0,w,h)
  const from = current.self ? {x:w*.5,y:h*.54} : {x:w*.26,y:h*.64}
  const to = current.self ? from : {x:w*.72,y:h*.48}
  if (atlas.complete && atlas.naturalWidth && w && h) {
    drawSequence(ctx,atlas,current.sequence,elapsed,from,to,Math.min(w*.2,h*.24,170))
  }
  slider.value = String(Math.round(elapsed))
  el('time').textContent = Math.round(elapsed) + ' / ' + current.sequence.duration + ' ms'
}
function stop() { cancelAnimationFrame(frame); playing = false; play.textContent = 'Riproduci' }
function tick(now: number) {
  elapsed = Math.min(current.sequence.duration,now-start)
  paint()
  if (elapsed < current.sequence.duration) frame = requestAnimationFrame(tick)
  else stop()
}
function select(row: Entry) {
  stop()
  current = row
  elapsed = row.sequence.impact
  slider.max = String(row.sequence.duration)
  el('name').textContent = row.name
  el('detail').textContent = row.owner + ' · Forma ' + row.form + ' · ' + row.type + ' · Mossa ' + row.id
  el('status').textContent = row.previewOnly ? 'Variante del catalogo VFX. Questa mossa è assente dal moveset giocabile.' : ''
  stage.classList.toggle('self',row.self)
  el<HTMLImageElement>('actor').src = portraits[row.form]
  el<HTMLImageElement>('enemy').src = portraits[row.form === 1 ? 5 : 1]
  for (const button of list.querySelectorAll('button')) button.setAttribute('aria-current',String(button.dataset.key===row.sequence.key))
  paint()
}
function filter() {
  const query = search.value.trim().toLocaleLowerCase('it')
  const shown = records.filter(r => (r.name+' '+r.owner+' '+r.type+' '+r.form+' '+r.id).toLocaleLowerCase('it').includes(query))
  const items = shown.map(row => {
    const button = document.createElement('button'), small = document.createElement('small')
    button.type = 'button'
    button.dataset.key = row.sequence.key
    button.textContent = row.name
    small.textContent = row.owner + ' · Forma ' + row.form
    button.append(small)
    button.onclick = () => select(row)
    return button
  })
  list.replaceChildren(...items)
  el('empty').hidden = !!items.length
  if (shown.length) select(shown.includes(current) ? current : shown[0])
  else stop()
}
el('totals').textContent = new Set(records.map(r => r.id)).size + ' mosse · ' + records.length + ' sequenze'
play.onclick = () => {
  if (playing) { stop(); return }
  if (elapsed >= current.sequence.duration || elapsed === current.sequence.impact) elapsed = 0
  playing = true
  play.textContent = 'Pausa'
  start = performance.now()-elapsed
  frame = requestAnimationFrame(tick)
}
el('peak').onclick = () => { stop(); elapsed = current.sequence.impact; paint() }
slider.oninput = () => { stop(); elapsed = Number(slider.value); paint() }
search.oninput = filter
atlas.onload = paint
atlas.src = url
filter()
new ResizeObserver(paint).observe(stage)
