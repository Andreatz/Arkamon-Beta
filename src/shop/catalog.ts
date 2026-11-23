import { MAPPE } from '@/data'
import { isRouteLocation } from '@/data/routeLocation'
import type { StatoAlterato } from '@/types'

export const SHOP_ITEM_IDS = [
  'potion', 'super-potion', 'hyper-potion', 'max-potion', 'revive',
  'antidote', 'paralysis-heal', 'awakening', 'full-heal',
  'sacchettino', 'mega-sacchettino', 'ultra-sacchettino', 'masterball',
  'boost-speed', 'boost-damage', 'special-scent', 'bicycle', 'scooter',
] as const
export type ShopItemId = typeof SHOP_ITEM_IDS[number]
export type ShopInventory = Partial<Record<ShopItemId, number>>
export type ShopCart = Partial<Record<ShopItemId, number>>
export type CaptureTier = 'base' | 'mega' | 'ultra' | 'master'

export type ShopItemEffect =
  /** HP: frazione degli HP massimi, valore fisso, oppure base + dadi d6 (es. Pozione 19 + 1d6 = 20–25). */
  | { kind: 'heal'; fraction?: number; fixed?: number; base?: number; dice?: number }
  | { kind: 'revive'; fraction: number }
  | { kind: 'status'; status: StatoAlterato | 'tutti' }
  | { kind: 'capture'; tier: CaptureTier }
  | { kind: 'boost'; boost: 'velocita' | 'danno' }
  | { kind: 'scent' }
  | { kind: 'vehicle'; terrain: 'percorso' | 'citta' }

export interface ShopItem {
  id: ShopItemId
  name: string
  description: string
  /** null = non in vendita (premi della regia o progressione). */
  price: number | null
  /** Primo Arkastore che lo vende ("Punto di partenza" del Database); quelli successivi lo vendono a loro volta. */
  sinceCity: string | null
  icon: string
  effect: ShopItemEffect
}

/** Oggetti, prezzi e città del foglio "Oggetti e Tassi cattura" del Database. Rianimatore: oggetto storico del gioco. */
export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'potion', name: 'Pozione', description: 'Recupera 20–25 HP (19 + 1d6) di un Arkamon vivo. Non cura gli status.', price: 50, sinceCity: 'Venezia', icon: '🧪', effect: { kind: 'heal', base: 19, dice: 1 } },
  { id: 'super-potion', name: 'Superpozione', description: 'Recupera 60 HP di un Arkamon vivo. Non cura gli status.', price: 150, sinceCity: 'Milano', icon: '⚗️', effect: { kind: 'heal', fixed: 60 } },
  { id: 'hyper-potion', name: 'Iperpozione', description: 'Recupera 150–200 HP (140 + 10d6) di un Arkamon vivo. Non cura gli status.', price: 300, sinceCity: 'Grosseto', icon: '🧴', effect: { kind: 'heal', base: 140, dice: 10 } },
  { id: 'max-potion', name: 'Pozione Max', description: 'Recupera tutti gli HP di un Arkamon vivo. Non cura gli status.', price: 600, sinceCity: 'Foggia', icon: '🍯', effect: { kind: 'heal', fraction: 1 } },
  { id: 'revive', name: 'Rianimatore', description: 'Rianima un Arkamon KO con il 50% degli HP massimi. Gli status restano.', price: 300, sinceCity: 'Venezia', icon: '💎', effect: { kind: 'revive', fraction: .5 } },
  { id: 'antidote', name: 'Antidoto', description: 'Rimuove lo status Avvelenato da un Arkamon vivo.', price: 50, sinceCity: 'Piacenza', icon: '🌿', effect: { kind: 'status', status: 'Avvelenato' } },
  { id: 'paralysis-heal', name: 'Antiparalisi', description: 'Rimuove lo status Paralizzato da un Arkamon vivo.', price: 50, sinceCity: 'Piacenza', icon: '⚡', effect: { kind: 'status', status: 'Paralizzato' } },
  { id: 'awakening', name: 'Sveglia', description: 'Rimuove lo status Addormentato da un Arkamon vivo.', price: 50, sinceCity: 'Piacenza', icon: '☀️', effect: { kind: 'status', status: 'Addormentato' } },
  { id: 'full-heal', name: 'Cura totale', description: 'Rimuove qualunque status da un Arkamon vivo.', price: 200, sinceCity: 'Torino', icon: '✨', effect: { kind: 'status', status: 'tutti' } },
  { id: 'sacchettino', name: 'Sacchettino', description: 'Borsa conservante per catturare un Arkamon selvatico: tiro d20 secondo la tabella di cattura.', price: 50, sinceCity: 'Venezia', icon: '👝', effect: { kind: 'capture', tier: 'base' } },
  { id: 'mega-sacchettino', name: 'Mega Sacchettino', description: 'Sacchettino più capiente: soglie di cattura più basse.', price: 150, sinceCity: 'Torino', icon: '👝', effect: { kind: 'capture', tier: 'mega' } },
  { id: 'ultra-sacchettino', name: 'Ultra Sacchettino', description: 'Il Sacchettino più potente in vendita: soglie di cattura molto basse.', price: 300, sinceCity: 'Cagliari', icon: '👝', effect: { kind: 'capture', tier: 'ultra' } },
  { id: 'masterball', name: 'Sacchettino Supremo', description: 'Cattura garantita di un Arkamon selvatico. Non è in vendita: arriva dopo la Lega o come premio.', price: null, sinceCity: null, icon: '🔮', effect: { kind: 'capture', tier: 'master' } },
  { id: 'boost-speed', name: 'Boost velocità', description: 'In battaglia, al posto della mossa: per il resto della sfida i tuoi Arkamon agiscono per primi (la paralisi resta più forte). Non vale contro capipalestra, rivale, Superquattro e Mascherati.', price: 300, sinceCity: 'Torino', icon: '🪽', effect: { kind: 'boost', boost: 'velocita' } },
  { id: 'boost-damage', name: 'Boost danno', description: 'In battaglia, al posto della mossa: per il resto della sfida i tuoi Arkamon fanno il 25% di danni in più. Non vale contro capipalestra, rivale, Superquattro e Mascherati.', price: 400, sinceCity: 'Cagliari', icon: '🔥', effect: { kind: 'boost', boost: 'danno' } },
  { id: 'special-scent', name: 'Profumo speciale', description: 'Permette di esplorare di nuovo un cespuglio già visitato. Non è in vendita.', price: null, sinceCity: null, icon: '🌸', effect: { kind: 'scent' } },
  { id: 'bicycle', name: 'Bicicletta', description: 'Oggetto chiave: nei percorsi un movimento può superare fino a due pallini.', price: 100000, sinceCity: 'Milano', icon: '🚲', effect: { kind: 'vehicle', terrain: 'percorso' } },
  { id: 'scooter', name: 'Monopattino', description: 'Oggetto chiave: nelle città un movimento può superare fino a due pallini.', price: 100000, sinceCity: 'Milano', icon: '🛴', effect: { kind: 'vehicle', terrain: 'citta' } },
]

/** Ordine dei comandi di cattura in battaglia. */
export const CAPTURE_ITEM_IDS = ['sacchettino', 'mega-sacchettino', 'ultra-sacchettino', 'masterball'] as const
export type CaptureItemId = typeof CAPTURE_ITEM_IDS[number]

export const MAX_SHOP_QUANTITY = 99
/** Mantiene il limite già usato dai vecchi salvataggi e dalle ricompense della regia. */
export const MAX_ITEM_QUANTITY = 999_999
export const SHOP_LOCATIONS = MAPPE.filter((place) => !place.nome.startsWith('Percorso_')).map((place) => place.nome)
const shopLocations = new Set(SHOP_LOCATIONS)

export function hasArkaStore(location: string): boolean { return shopLocations.has(location) }
export function isShopItemId(value: unknown): value is ShopItemId {
  return typeof value === 'string' && SHOP_ITEM_IDS.includes(value as ShopItemId)
}
export function getShopItem(id: unknown): ShopItem | undefined { return SHOP_ITEMS.find((item) => item.id === id) }

/** Ordine delle città nel viaggio: un oggetto "da Milano" si trova a Milano e negli Arkastore successivi. */
const CITY_ORDER = MAPPE.filter((place) => !place.nome.startsWith('Percorso_')).map((place) => place.nome)

/** Articoli in vendita in un Arkastore. */
export function shopItemsAt(location: string): ShopItem[] {
  const here = CITY_ORDER.indexOf(location)
  return SHOP_ITEMS.filter((item) => item.price !== null && item.sinceCity !== null
    && here >= 0 && here >= CITY_ORDER.indexOf(item.sinceCity))
}

export function isSoldAt(itemId: ShopItemId, location: string): boolean {
  return shopItemsAt(location).some((item) => item.id === itemId)
}

/** Oggetti chiave: si possiedono, non si consumano e non si comprano due volte. */
export function isKeyItem(itemId: ShopItemId): boolean {
  return getShopItem(itemId)?.effect.kind === 'vehicle'
}

/** Salvataggi vecchi e inventari parziali restano validi; nessun oggetto nuovo viene regalato. */
export function normalizeShopInventory(value: unknown, warn?: (message: string) => void): ShopInventory {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (value !== undefined) warn?.('Inventario non valido: oggetti non recuperabili rimossi.')
    return {}
  }
  const inventory: ShopInventory = {}
  for (const [key, quantity] of Object.entries(value)) {
    if (!isShopItemId(key)) { warn?.(`Oggetto sconosciuto rimosso dall’inventario: ${key}.`); continue }
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) {
      warn?.(`Quantità non valida per ${getShopItem(key)!.name}: rimossa.`); continue
    }
    const clean = Math.max(0, Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity)))
    if (clean !== quantity) warn?.(`Quantità di ${getShopItem(key)!.name} corretta entro i limiti.`)
    inventory[key] = clean
  }
  return inventory
}

/** Pallini per movimento nelle mappe locali: 2 con la Bicicletta nei percorsi o il Monopattino nelle città. */
export function localMoveRange(inventory: ShopInventory, location: string): number {
  const route = isRouteLocation(location)
  return (route ? inventory.bicycle ?? 0 : inventory.scooter ?? 0) > 0 ? 2 : 1
}
