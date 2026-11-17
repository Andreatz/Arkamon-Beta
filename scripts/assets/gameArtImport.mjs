/**
 * Importazione delle illustrazioni di gioco (audit UX/UI, fase U0): funzioni pure.
 * Lo script a riga di comando è import-game-art.mjs.
 */

/** Il fondo magenta (#FF00FF) usato quando il generatore non rispetta la trasparenza. */
export function isMagenta(r, g, b, tolerance = 70) {
  return r >= 255 - tolerance && b >= 255 - tolerance && g <= tolerance
}

/** Distanza dal magenta puro, 0 (magenta) → 1 (lontano). */
function magentaDistance(r, g, b) {
  const dr = (255 - r) / 255, dg = g / 255, db = (255 - b) / 255
  return Math.min(1, Math.sqrt(dr * dr + dg * dg + db * db) / 0.55)
}

/**
 * Toglie il fondo magenta da un buffer RGBA (modificato sul posto): trasparenza piena
 * sul magenta, alfa graduale sui bordi sfumati e rimozione del riflesso magenta.
 * Restituisce il numero di pixel resi trasparenti.
 */
export function keyOutMagenta(data, tolerance = 70) {
  let cleared = 0
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index], g = data[index + 1], b = data[index + 2]
    if (isMagenta(r, g, b, tolerance)) { data[index + 3] = 0; cleared++; continue }
    const distance = magentaDistance(r, g, b)
    if (distance < 1) {
      data[index + 3] = Math.round(data[index + 3] * distance)
      // Riflesso: il verde è la componente che il magenta abbassa; si riallineano rosso e blu.
      const spill = Math.min(r, b) - g
      if (spill > 0) { data[index] = r - spill * (1 - distance); data[index + 2] = b - spill * (1 - distance) }
    }
  }
  return cleared
}

/** Un'immagine con il fondo magenta ha i quattro angoli magenta. */
export function hasMagentaCorners(data, width, height) {
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
  return corners.every(([x, y]) => {
    const index = (y * width + x) * 4
    return isMagenta(data[index], data[index + 1], data[index + 2])
  })
}

/** Rettangoli delle celle di una griglia regolare (colonne × righe), da sinistra a destra, dall'alto. */
export function gridCells(width, height, columns, rows) {
  const cells = []
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const left = Math.round(column * width / columns), top = Math.round(row * height / rows)
      cells.push({ left, top, width: Math.round((column + 1) * width / columns) - left, height: Math.round((row + 1) * height / rows) - top })
    }
  }
  return cells
}

/** Unisce le voci nuove al catalogo (stesso id = sostituzione), in ordine di id. */
export function mergeCatalog(catalog, entries) {
  const byId = new Map((catalog?.assets ?? []).map(asset => [asset.id, asset]))
  for (const entry of entries) byId.set(entry.id, entry)
  return { version: 1, assets: [...byId.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) }
}

/** Nomi sicuri per i file pubblici. */
export function safeArtId(value) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(value)) throw new Error(`Id di illustrazione non valido: ${value}`)
  return value
}

/**
 * Regola di importazione per un file consegnato: prima il nome esatto in `files`,
 * poi il primo schema di `patterns` (per i ritratti di NPC e allenatori, con l'id
 * uguale al nome senza estensione). Restituisce undefined per i nomi non previsti.
 */
/** Estensioni accettate nella cartella di consegna: lo schema usa sempre il nome «.png». */
export const INBOX_IMAGE = /\.(png|jpe?g|webp)$/i

export function ruleForFile(spec, name) {
  // Le immagini consegnate in JPG o WebP valgono come il PNG atteso; gli alias coprono i refusi noti.
  const canonical = name.replace(INBOX_IMAGE, '.png')
  name = spec?.aliases?.[canonical] ?? canonical
  const exact = spec?.files?.[name]
  if (exact) return exact
  for (const pattern of spec?.patterns ?? []) {
    if (new RegExp(pattern.match).test(name)) {
      const { match: _match, ...rule } = pattern
      return { ...rule, id: safeArtId(name.replace(/\.png$/i, '')) }
    }
  }
  return undefined
}

/**
 * Scontorna un fondo piatto non magenta (es. il crema del negoziante): riempimento dai bordi
 * dell'immagine sui pixel simili al colore dell'angolo in alto a sinistra. Solo l'area collegata
 * ai bordi diventa trasparente, quindi i colori uguali dentro la figura restano. I pixel di
 * confine ricevono un'alfa graduale. Modifica il buffer RGBA sul posto e restituisce i pixel tolti.
 * `edges` sceglie da quali bordi partire (di norma solo i tre lati liberi, non quello del bancone).
 */
export function floodKeyBackground(data, width, height, { tolerance = 26, edges = ['top', 'left', 'right'] } = {}) {
  const base = [data[0], data[1], data[2]]
  const distance = (index) => Math.max(Math.abs(data[index] - base[0]), Math.abs(data[index + 1] - base[1]), Math.abs(data[index + 2] - base[2]))
  const visited = new Uint8Array(width * height)
  const queue = []
  const seed = (x, y) => { const p = y * width + x; if (!visited[p] && distance(p * 4) <= tolerance) { visited[p] = 1; queue.push(p) } }
  if (edges.includes('top')) for (let x = 0; x < width; x++) seed(x, 0)
  if (edges.includes('bottom')) for (let x = 0; x < width; x++) seed(x, height - 1)
  if (edges.includes('left')) for (let y = 0; y < height; y++) seed(0, y)
  if (edges.includes('right')) for (let y = 0; y < height; y++) seed(width - 1, y)
  let cleared = 0
  for (let head = 0; head < queue.length; head++) {
    const p = queue[head], x = p % width, y = (p - x) / width
    data[p * 4 + 3] = 0; cleared++
    if (x > 0) seed(x - 1, y)
    if (x < width - 1) seed(x + 1, y)
    if (y > 0) seed(x, y - 1)
    if (y < height - 1) seed(x, y + 1)
  }
  // Bordo morbido: un pixel opaco accanto al fondo tolto prende un'alfa in base alla somiglianza.
  for (let p = 0; p < width * height; p++) {
    if (visited[p]) continue
    const x = p % width, y = (p - x) / width
    const touches = (x > 0 && visited[p - 1]) || (x < width - 1 && visited[p + 1]) || (y > 0 && visited[p - width]) || (y < height - 1 && visited[p + width])
    if (!touches) continue
    const d = distance(p * 4)
    if (d < tolerance * 2.5) data[p * 4 + 3] = Math.round(data[p * 4 + 3] * Math.min(1, (d - tolerance) / (tolerance * 1.5)))
  }
  return cleared
}
