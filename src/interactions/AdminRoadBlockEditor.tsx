import { useState } from 'react'
import { ALLENATORI } from '@/data'
import { LOCAL_MAPS } from '@/data/localMaps'
import { MAIN_MAP_ROAD_CONNECTIONS } from '@/data/mainMapRoads'
import { HIDDEN_LOCATIONS } from '@/data/secretLocation'
import { placeLabel } from '@/utils/placeLabel'
import { roadKey } from '@/engine/roadBlocks'
import { useInteractionStore } from './interactionStore'
import { useInteractionRecoveryStatus } from './interactionRecovery'
import { MAIN_MAP_BLOCK_ID, newRoadBlockDefinition, type RoadBlockDefinition } from './types'

/** Strade della mappa principale, comprese le porte dei luoghi nascosti. */
const MAIN_ROADS: [string, string][] = [...MAIN_MAP_ROAD_CONNECTIONS, ...HIDDEN_LOCATIONS.map((entry): [string, string] => [entry.origin, entry.id])]
const createBlock = (mapId: string) => newRoadBlockDefinition(mapId, `blocco-${crypto.randomUUID()}`)
const number = (label?: string) => label?.replace('Punto ', '') ?? ''

/**
 * Editor delle strade bloccate (24 novembre 2026). Sulla mappa principale si spuntano le strade fra
 * luoghi; nelle mappe locali si scrivono i numeri dei pallini, come sulle foto «Interazioni».
 */
export function AdminRoadBlockEditor() {
  const blocks = useInteractionStore((s) => s.roadBlocks)
  const interactions = useInteractionStore((s) => s.interactions)
  const save = useInteractionStore((s) => s.saveRoadBlock)
  const remove = useInteractionStore((s) => s.removeRoadBlock)
  const recovery = useInteractionRecoveryStatus((s) => s.recovery)
  const [mapId, setMapId] = useState(MAIN_MAP_BLOCK_ID)
  const [draft, setDraft] = useState<RoadBlockDefinition>(() => createBlock(MAIN_MAP_BLOCK_ID))
  const [roadsText, setRoadsText] = useState('')
  const [nodesText, setNodesText] = useState('')
  const [message, setMessage] = useState('')
  const local = mapId === MAIN_MAP_BLOCK_ID ? undefined : LOCAL_MAPS[mapId]
  const labelOf = (id: string) => number(local?.nodes.find((node) => node.id === id)?.label) || id
  const idOf = (value: string) => local?.nodes.find((node) => number(node.label) === value.trim())?.id
  const load = (block: RoadBlockDefinition) => {
    setDraft(structuredClone(block))
    const map = block.mapId === MAIN_MAP_BLOCK_ID ? undefined : LOCAL_MAPS[block.mapId]
    const label = (id: string) => number(map?.nodes.find((node) => node.id === id)?.label) || id
    setRoadsText(block.roads.map(([a, b]) => `${label(a)}-${label(b)}`).join(', '))
    setNodesText(block.nodes.map(label).join(', '))
    setMessage('')
  }
  const chooseMap = (id: string) => { setMapId(id); load(createBlock(id)) }
  /** Converte i numeri dei pallini scritti dalla regia negli identificatori interni. */
  const withLocalTargets = (): RoadBlockDefinition | string => {
    if (!local) return draft
    const roads: [string, string][] = []
    for (const pair of roadsText.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean)) {
      const [a, b] = pair.split(/\s*[-–]\s*/)
      const from = a ? idOf(a) : undefined, to = b ? idOf(b) : undefined
      if (!from || !to) return `Strada «${pair}» non valida: scrivi due numeri di pallini, ad esempio 19-20.`
      roads.push([from, to])
    }
    const nodes: string[] = []
    for (const value of nodesText.split(/[,;\s]+/).filter(Boolean)) {
      const id = idOf(value)
      if (!id) return `Il pallino ${value} non esiste in questa mappa.`
      nodes.push(id)
    }
    return { ...draft, roads, nodes }
  }
  const toggleMainRoad = (pair: [string, string], checked: boolean) => {
    const key = roadKey(pair[0], pair[1])
    const others = draft.roads.filter(([a, b]) => roadKey(a, b) !== key)
    setDraft({ ...draft, roads: checked ? [...others, pair] : others })
  }
  const unlock = draft.unlock
  const prerequisites = interactions.filter((entry) => !entry.repeatable && entry.action.kind !== 'shop')
  const permanent = !unlock.league && !unlock.gymIds.length && !unlock.completedInteractions.length
  return <section className="interaction-editor" aria-label="Editor delle strade bloccate">
    <h2>Strade bloccate</h2>
    <p>Una strada bloccata resta disegnata ma non si percorre. Si riapre quando il giocatore che si muove soddisfa tutte le condizioni indicate; senza condizioni resta chiusa finché non la disattivi.</p>
    <label>Luogo della strada bloccata<select value={mapId} onChange={(e) => chooseMap(e.target.value)}>
      <option value={MAIN_MAP_BLOCK_ID}>Mappa principale</option>
      {Object.values(LOCAL_MAPS).map((item) => <option key={item.id} value={item.id}>{placeLabel(item.id)}</option>)}
    </select></label>
    <div className="interaction-editor-fields">
      <label>Strada bloccata esistente<select value={blocks.some((entry) => entry.id === draft.id) ? draft.id : ''} onChange={(e) => {
        const block = blocks.find((entry) => entry.id === e.target.value)
        load(block ?? createBlock(mapId))
      }}><option value="">Nuova strada bloccata</option>
        {blocks.filter((entry) => entry.mapId === mapId).map((entry) => <option key={entry.id} value={entry.id}>{entry.title}{entry.enabled ? '' : ' · disattivata'}</option>)}
      </select></label>
      <label>Titolo della strada bloccata<input maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      <label>Messaggio per i giocatori<textarea rows={2} maxLength={1000} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} /></label>
      {local ? <>
        <label>Strade chiuse (numeri dei pallini, ad esempio 19-20, 3-4)<input value={roadsText} onChange={(e) => setRoadsText(e.target.value)} /></label>
        <label>Pallini chiusi (ad esempio 76, 116)<input value={nodesText} onChange={(e) => setNodesText(e.target.value)} /></label>
        <p className="interaction-note">In un pallino chiuso non si entra; chi ci si trova già può uscirne. Il pallino d’ingresso ({labelOf(local.startNode)}) non si può chiudere.</p>
      </> : <fieldset><legend>Strade chiuse fra luoghi</legend>
        {MAIN_ROADS.map((pair) => <label key={roadKey(pair[0], pair[1])} className="interaction-check">
          <input type="checkbox" checked={draft.roads.some(([a, b]) => roadKey(a, b) === roadKey(pair[0], pair[1]))} onChange={(e) => toggleMainRoad(pair, e.target.checked)} />
          {placeLabel(pair[0])} – {placeLabel(pair[1])}
        </label>)}
      </fieldset>}
      <fieldset><legend>Si riapre quando il giocatore…</legend>
        <label className="interaction-check"><input type="checkbox" checked={unlock.league} onChange={(e) => setDraft({ ...draft, unlock: { ...unlock, league: e.target.checked } })} />ha vinto la Lega</label>
        <div>ha le medaglie di</div>
        {ALLENATORI.filter((trainer) => trainer.tipo === 'Capopalestra').map((trainer) => <label key={trainer.id} className="interaction-check">
          <input type="checkbox" checked={unlock.gymIds.includes(trainer.id)} onChange={(e) => setDraft({ ...draft, unlock: { ...unlock,
            gymIds: e.target.checked ? [...unlock.gymIds, trainer.id] : unlock.gymIds.filter((id) => id !== trainer.id) } })} />{placeLabel(trainer.luogo)}
        </label>)}
        <div>ha completato</div>
        {prerequisites.map((entry) => <label key={entry.id} className="interaction-check">
          <input type="checkbox" checked={unlock.completedInteractions.includes(entry.id)} onChange={(e) => setDraft({ ...draft, unlock: { ...unlock,
            completedInteractions: e.target.checked ? [...unlock.completedInteractions, entry.id] : unlock.completedInteractions.filter((id) => id !== entry.id) } })} />
          {placeLabel(entry.mapId)} · {entry.title}
        </label>)}
        {permanent && <p className="interaction-note">Nessuna condizione: la strada resta chiusa per sempre.</p>}
      </fieldset>
      <label className="interaction-check"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />Attiva nel gioco</label>
      <div className="interaction-actions">
        <button className="arka-button" disabled={!!recovery} onClick={() => {
          const block = withLocalTargets()
          if (typeof block === 'string') { setMessage(block); return }
          const error = save(block)
          setMessage(error ?? 'Strada bloccata salvata.')
          if (!error) setDraft(block)
        }}>Salva strada bloccata</button>
        <button className="arka-button-secondary" onClick={() => load(createBlock(mapId))}>Nuova</button>
        <button className="arka-button-secondary" disabled={!!recovery || !blocks.some((entry) => entry.id === draft.id)} onClick={() => {
          const error = remove(draft.id); setMessage(error ?? 'Strada bloccata eliminata.'); if (!error) load(createBlock(mapId))
        }}>Elimina</button>
      </div>
      <p role="status" aria-live="polite">{message}</p>
    </div>
  </section>
}
