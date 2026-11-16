import { MAPPE } from '@/data'
import type { StatoAlterato } from '@/types'

export const CAPTURE_ITEM_IDS = ['arkaball', 'mega-arkaball', 'ultra-arkaball', 'masterball'] as const
export type CaptureItemId = typeof CAPTURE_ITEM_IDS[number]
export const SHOP_ITEM_IDS = [
  'potion', 'super-potion', 'hyper-potion', 'max-potion', 'revive',
  'antidote', 'paralysis-heal', 'awakening', 'full-heal',
  ...CAPTURE_ITEM_IDS, 'speed-boost', 'damage-boost', 'special-perfume', 'bicycle', 'scooter',
] as const
export type ShopItemId = typeof SHOP_ITEM_IDS[number]
export type ShopInventory = Partial<Record<ShopItemId, number>>
export type ShopCart = Partial<Record<ShopItemId, number>>

export type ShopItemEffect =
  | { kind: 'heal'; amount: readonly [number, number] | 'full' }
  | { kind: 'revive'; fraction: number }
  | { kind: 'status'; status?: StatoAlterato }
  | { kind: 'capture' }
  | { kind: 'boost'; stat: 'speed' | 'damage' }
  | { kind: 'retry-encounter' }
  | { kind: 'transport'; terrain: 'route' | 'city' }

export interface ShopItem {
  id: ShopItemId
  name: string
  description: string
  price: number | null
  availableFrom?: string
  icon: string
  effect: ShopItemEffect
}

/** Prezzi e disponibilità del catalogo, con gli identificatori dei salvataggi esistenti. */
export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'potion', name: 'Pozione', description: 'Ripristina da 20 a 25 HP a un Arkamon vivo.', price: 50, availableFrom: 'Venezia', icon: '🧪', effect: { kind: 'heal', amount: [20, 25] } },
  { id: 'super-potion', name: 'Superpozione', description: 'Ripristina 60 HP a un Arkamon vivo.', price: 150, availableFrom: 'Milano', icon: '⚗️', effect: { kind: 'heal', amount: [60, 60] } },
  { id: 'hyper-potion', name: 'Iperpozione', description: 'Ripristina da 150 a 200 HP a un Arkamon vivo.', price: 300, availableFrom: 'Grosseto', icon: '⚗️', effect: { kind: 'heal', amount: [150, 200] } },
  { id: 'max-potion', name: 'Pozione Max', description: 'Ripristina tutti gli HP di un Arkamon vivo.', price: 600, availableFrom: 'Foggia', icon: '⚗️', effect: { kind: 'heal', amount: 'full' } },
  { id: 'revive', name: 'Rianimatore', description: 'Rianima un Arkamon KO con il 50% degli HP massimi. Gli status restano.', price: 300, icon: '💎', effect: { kind: 'revive', fraction: .5 } },
  { id: 'antidote', name: 'Antidoto', description: 'Rimuove lo status Avvelenato da un Arkamon vivo.', price: 50, availableFrom: 'Piacenza', icon: '🌿', effect: { kind: 'status', status: 'Avvelenato' } },
  { id: 'paralysis-heal', name: 'Antiparalisi', description: 'Rimuove lo status Paralizzato da un Arkamon vivo.', price: 50, availableFrom: 'Piacenza', icon: '⚡', effect: { kind: 'status', status: 'Paralizzato' } },
  { id: 'awakening', name: 'Sveglia', description: 'Rimuove lo status Addormentato da un Arkamon vivo.', price: 50, availableFrom: 'Piacenza', icon: '☀️', effect: { kind: 'status', status: 'Addormentato' } },
  { id: 'full-heal', name: 'Cura totale', description: 'Rimuove lo status alterato di un Arkamon vivo.', price: 200, availableFrom: 'Torino', icon: '✚', effect: { kind: 'status' } },
  { id: 'arkaball', name: 'Arkaball', description: 'Cattura un Arkamon selvatico con un tiro di d20.', price: 50, availableFrom: 'Venezia', icon: '🔴', effect: { kind: 'capture' } },
  { id: 'mega-arkaball', name: 'Mega Arkaball', description: 'Cattura un Arkamon selvatico con una soglia ridotta sul d20.', price: 150, availableFrom: 'Torino', icon: '🔵', effect: { kind: 'capture' } },
  { id: 'ultra-arkaball', name: 'Ultra Arkaball', description: 'Cattura un Arkamon selvatico con la migliore soglia sul d20.', price: 300, availableFrom: 'Cagliari', icon: '🟡', effect: { kind: 'capture' } },
  { id: 'masterball', name: 'Master Arkaball', description: 'Cattura garantita di un Arkamon selvatico. Disponibile dopo la Lega.', price: null, icon: '🔮', effect: { kind: 'capture' } },
  { id: 'speed-boost', name: 'Boost velocità', description: 'Dà la priorità alla squadra del giocatore per la durata di una sfida ordinaria.', price: 300, availableFrom: 'Torino', icon: '⚡', effect: { kind: 'boost', stat: 'speed' } },
  { id: 'damage-boost', name: 'Boost danno', description: 'Aumenta del 25% i danni della squadra del giocatore per la durata di una sfida ordinaria.', price: 400, availableFrom: 'Cagliari', icon: '⚔', effect: { kind: 'boost', stat: 'damage' } },
  { id: 'special-perfume', name: 'Profumo speciale', description: 'Permette di riprovare la cattura in un cespuglio già visitato.', price: null, icon: '✧', effect: { kind: 'retry-encounter' } },
  { id: 'bicycle', name: 'Bicicletta', description: 'Raddoppia la velocità di movimento sui percorsi.', price: 100_000, availableFrom: 'Milano', icon: '🚲', effect: { kind: 'transport', terrain: 'route' } },
  { id: 'scooter', name: 'Monopattino', description: 'Raddoppia la velocità di movimento nelle città.', price: 100_000, availableFrom: 'Milano', icon: '🛴', effect: { kind: 'transport', terrain: 'city' } },
]

export const MAX_SHOP_QUANTITY = 99
/** Mantiene il limite già usato dai vecchi salvataggi e dalle ricompense della regia. */
export const MAX_ITEM_QUANTITY = 999_999
export const SHOP_LOCATIONS = MAPPE.filter((place) => !place.nome.startsWith('Percorso_')).map((place) => place.nome)
const shopLocations = new Set(SHOP_LOCATIONS)

export function hasArkaStore(location: string): boolean { return shopLocations.has(location) }
export function getShopItemsAt(location: string): readonly (ShopItem & { price: number })[] {
  const index = SHOP_LOCATIONS.indexOf(location)
  return SHOP_ITEMS.filter((item): item is ShopItem & { price: number } =>
    item.price !== null && index >= 0 && (!item.availableFrom || index >= SHOP_LOCATIONS.indexOf(item.availableFrom)))
}
export function isCaptureItemId(value: unknown): value is CaptureItemId {
  return typeof value === 'string' && CAPTURE_ITEM_IDS.includes(value as CaptureItemId)
}
export function localMovementReach(inventory: ShopInventory, location: string): 1 | 2 {
  return (inventory[location.startsWith('Percorso_') ? 'bicycle' : 'scooter'] ?? 0) > 0 ? 2 : 1
}
export function isShopItemId(value: unknown): value is ShopItemId {
  return typeof value === 'string' && SHOP_ITEM_IDS.includes(value as ShopItemId)
}
export function getShopItem(id: unknown): ShopItem | undefined { return SHOP_ITEMS.find((item) => item.id === id) }

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
