import { useMemo, useState } from 'react'
import { getPokemon, POKEMON_BASE, TABELLA_TIPI } from '@/data'
import type { PokemonIstanza } from '@/types'
import { CHALLENGE_LEVEL, CHALLENGE_TEAM_SIZE, FANTA_BUDGET, createChallengeSession, exportChallengeCode, fantaSpeciesCost, fantaTeamCost, generateSeedTeam, importChallengeCode, speciesEvolutionStage, validateFantaTeam } from './challengeRules'
import { challengeLeaderboard, useChallengeStore } from './challengeStore'
import { validateChallengeSeed } from './seededRandom'
import type { ChallengeDraft, ChallengeMode, ChallengeSession } from './types'

const buttonClass = 'rounded-lg border border-slate-400 bg-slate-800 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50'
const fieldClass = 'w-full rounded-lg border border-slate-400 bg-slate-950 px-3 py-2 text-white'

function TeamPreview({ team, title }: { team: PokemonIstanza[]; title: string }) {
  return <section aria-label={title} className="rounded-xl border border-white/20 bg-slate-900 p-3">
    <h3 className="mb-3 font-bold">{title}</h3>
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">{team.map((pokemon) => <li key={pokemon.istanzaId} className="rounded-lg bg-slate-800 p-3">
      <p className="font-semibold">{pokemon.nome} <span className="text-xs text-slate-300">#{pokemon.specieId}</span></p>
      <p className="text-sm text-slate-300">{getPokemon(pokemon.specieId)?.tipo} · Lv. {pokemon.livello}</p>
      <p className="text-sm text-slate-300">{pokemon.hp} HP · {fantaSpeciesCost(pokemon.specieId)} crediti</p>
    </li>)}</ol>
  </section>
}

export interface ChallengePanelProps {
  onLaunch: (session: ChallengeSession) => void | { ok: boolean; message?: string }
  activeSession?: ChallengeSession | null
  onResume?: () => void
}

export function ChallengePanel({ onLaunch, activeSession, onResume }: ChallengePanelProps) {
  const draft = useChallengeStore((state) => state.draft)
  const results = useChallengeStore((state) => state.results)
  const storageWarning = useChallengeStore((state) => state.storageWarning)
  const saveDraft = useChallengeStore((state) => state.saveDraft)
  const clearResults = useChallengeStore((state) => state.clearResults)
  const [seed, setSeed] = useState(draft.seed)
  const [mode, setMode] = useState<ChallengeMode>(draft.mode)
  const [speciesIds, setSpeciesIds] = useState<number[]>(draft.speciesIds)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [preview, setPreview] = useState<ChallengeSession | null>(null)
  const [code, setCode] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const spent = fantaTeamCost(speciesIds)
  const visibleSpecies = useMemo(() => POKEMON_BASE.filter((species) => (typeFilter === 'all' || species.tipo === typeFilter)
    && `${species.nome} ${species.id} ${species.tipo}`.toLocaleLowerCase('it-IT').includes(query.trim().toLocaleLowerCase('it-IT'))), [query, typeFilter])
  const leaderboard = preview ? challengeLeaderboard(results, preview.id) : []

  function persist(next: ChallengeDraft) {
    const written = saveDraft(next)
    if (!written.ok) { setError(written.error); return false }
    return true
  }

  function updateTeam(next: number[]) {
    setSpeciesIds(next)
    setPreview(null)
    setNotice(null)
    setError(null)
    persist({ version: 1, seed, mode, speciesIds: next })
  }

  function generate() {
    setError(null)
    setNotice(null)
    try {
      const session = createChallengeSession({ version: 1, seed, mode, speciesIds })
      setSeed(session.seed)
      setPreview(session)
      persist({ version: 1, seed: session.seed, mode, speciesIds })
    } catch (failure) { setPreview(null); setError((failure as Error).message) }
  }

  function changeMode(next: ChallengeMode) {
    setMode(next)
    setPreview(null)
    setError(null)
    setNotice(null)
    persist({ version: 1, seed, mode: next, speciesIds })
  }

  function importCode() {
    setError(null)
    setNotice(null)
    try {
      const session = importChallengeCode(code)
      const ids = session.mode === 'fanta' ? session.team.map((pokemon) => pokemon.specieId) : []
      if (!persist({ version: 1, seed: session.seed, mode: session.mode, speciesIds: ids })) return
      setSeed(session.seed); setMode(session.mode); setSpeciesIds(ids); setPreview(session)
      setNotice('Configurazione importata. Controlla le squadre e avvia la sfida.')
    } catch (failure) { setError((failure as Error).message) }
  }

  return <section aria-label="Sfide a seed e Fanta-Team Builder" className="space-y-5 text-white">
    <div><h2 className="text-xl font-bold">Sfide e Fanta-Team</h2><p className="mt-1 text-sm text-slate-300">Una battaglia dedicata con sei Arkamon per lato al livello {CHALLENGE_LEVEL}. La campagna viene conservata mentre giochi la sfida.</p></div>
    {storageWarning && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-950 p-3 text-sm text-amber-100">{storageWarning}</p>}
    {activeSession && <div className="rounded-lg border border-violet-300 bg-violet-950 p-3"><p className="text-sm">Sfida in corso: {activeSession.seed}</p>{onResume && <button type="button" className={`${buttonClass} mt-2`} onClick={onResume}>Riprendi la sfida</button>}</div>}
    <nav aria-label="Modalità della sfida" className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={mode === 'seed'} onClick={() => changeMode('seed')} className={`${buttonClass} ${mode === 'seed' ? 'border-violet-300 bg-violet-800' : ''}`}>Sfida a seed</button><button type="button" aria-pressed={mode === 'fanta'} onClick={() => changeMode('fanta')} className={`${buttonClass} ${mode === 'fanta' ? 'border-violet-300 bg-violet-800' : ''}`}>Fanta-Team Builder</button></nav>
    <label className="block text-sm font-semibold">Seed della sfida<input maxLength={64} className={`${fieldClass} mt-2`} value={seed} onChange={(event) => { setSeed(event.target.value); setPreview(null); setError(null) }} onBlur={() => { try { const normalized = validateChallengeSeed(seed); setSeed(normalized); persist({ version: 1, seed: normalized, mode, speciesIds }) } catch { /* Editing an incomplete seed is allowed; generation validates it. */ } }} /></label>
    <p className="text-sm text-slate-300">Lo stesso seed, le stesse regole e la stessa sequenza di scelte riproducono squadre e tiri. Cambiare una scelta può consumare dadi diversi. Regole v1.</p>
    {mode === 'fanta' ? <>
      <div className="rounded-lg border border-cyan-400/70 bg-cyan-950 p-3"><p className="font-bold">{speciesIds.length}/{CHALLENGE_TEAM_SIZE} Arkamon · {spent}/{FANTA_BUDGET} crediti</p><p className="mt-1 text-sm text-cyan-100">Sei specie diverse. Tutti partono al livello {CHALLENGE_LEVEL}, con HP pieni e differenza di livello pari a zero.</p></div>
      <section aria-label="Squadra Fanta scelta"><h3 className="mb-2 font-semibold">La tua squadra</h3>{speciesIds.length ? <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">{speciesIds.map((id) => <li key={id} className="rounded-lg border border-slate-500 bg-slate-900 p-3"><p className="font-bold">{getPokemon(id)?.nome} #{id}</p><p className="text-sm text-slate-300">{fantaSpeciesCost(id)} crediti</p><button className={`${buttonClass} mt-2 w-full`} type="button" aria-label={`Rimuovi ${getPokemon(id)?.nome} ${id}`} onClick={() => updateTeam(speciesIds.filter((candidate) => candidate !== id))}>Rimuovi</button></li>)}</ol> : <p className="text-sm text-slate-300">Scegli gli Arkamon dal catalogo qui sotto.</p>}</section>
      <button type="button" className={buttonClass} onClick={() => { try { updateTeam(generateSeedTeam(seed, 'player')) } catch (failure) { setError((failure as Error).message) } }}>Squadra suggerita dal seed</button>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Cerca Arkamon<input className={`${fieldClass} mt-1`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, numero o tipo" /></label><label className="text-sm">Filtra per tipo<select className={`${fieldClass} mt-1`} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Tutti i tipi</option>{TABELLA_TIPI.tipi.map((type) => <option key={type}>{type}</option>)}</select></label></div>
      <section aria-label="Catalogo Fanta-Team" tabIndex={0} className="max-h-96 overflow-y-auto rounded-lg border border-slate-500 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"><p className="mb-2 text-sm text-slate-300">{visibleSpecies.length} specie disponibili nel filtro</p><ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">{visibleSpecies.map((species) => {
        const cost = fantaSpeciesCost(species.id)
        const selected = speciesIds.includes(species.id)
        const disabled = selected || speciesIds.length === CHALLENGE_TEAM_SIZE || spent + cost > FANTA_BUDGET
        return <li key={species.id} className="rounded-lg bg-slate-900 p-3"><h4 className="font-bold">{species.nome} <span className="text-xs text-slate-300">#{species.id}</span></h4><p className="text-sm text-slate-300">{species.tipo} · stadio {speciesEvolutionStage(species.id) + 1}</p><p className="text-sm text-slate-300">{cost} crediti</p><button type="button" className={`${buttonClass} mt-2 w-full`} disabled={disabled} aria-label={`${selected ? 'Scelto' : 'Aggiungi'} ${species.nome} ${species.id}`} onClick={() => updateTeam([...speciesIds, species.id])}>{selected ? 'Scelto' : 'Aggiungi'}</button></li>
      })}</ul>{visibleSpecies.length === 0 && <p className="p-3 text-sm text-slate-300">Nessuna specie corrisponde alla ricerca.</p>}</section>
      <details className="rounded-lg border border-slate-500 p-3"><summary className="cursor-pointer text-sm font-semibold">Come si calcolano i crediti?</summary><p className="mt-2 text-sm text-slate-300">Costo = 8 + categoria HP (Lenta 2, Media 4, Veloce 7, Leggendaria 14) + 3 per ogni evoluzione precedente + danno medio della migliore mossa offensiva al livello 20, diviso per 5 e arrotondato per eccesso. Il danno medio usa 3,5 per d6 e l’incremento della mossa, prima dell’efficacia. Prezzi e budget appartengono alle regole v1.</p></details>
    </> : <p className="rounded-lg bg-slate-900 p-3 text-sm text-slate-300">Il seed genera entrambe le squadre entro {FANTA_BUDGET} crediti, favorendo tipi diversi. Puoi condividere il seed per confrontare le scelte durante lo stesso incontro.</p>}
    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-950 p-3 text-red-100">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-950 p-3 text-emerald-100">{notice}</p>}
    <button type="button" className={`${buttonClass} border-violet-300 bg-violet-800`} onClick={generate} disabled={mode === 'fanta' && !validateFantaTeam(speciesIds).ok}>{mode === 'seed' ? 'Genera sfida' : 'Prepara Fanta-Team'}</button>
    {preview && <div className="space-y-3"><p className="text-sm text-slate-300">Seed: <strong>{preview.seed}</strong> · {preview.mode === 'seed' ? 'Sfida a seed' : 'Fanta-Team'} · regole {preview.rulesVersion}</p><TeamPreview team={preview.team} title="Squadra del giocatore" /><TeamPreview team={preview.enemyTeam} title="Squadra avversaria" /><button type="button" className={`${buttonClass} border-emerald-300 bg-emerald-800`} disabled={Boolean(activeSession)} onClick={() => { setError(null); const launched = onLaunch(preview); if (launched && !launched.ok) setError(launched.message ?? 'Non è possibile avviare la sfida adesso.') }}>Avvia sfida</button><button type="button" className={`${buttonClass} ml-2`} onClick={() => { setCode(exportChallengeCode(preview)); setShareOpen(true); setNotice('Codice pronto: copia il testo nel campo di condivisione.') }}>Crea codice da condividere</button>
      {leaderboard.length > 0 && <section aria-label="Classifica di questa sfida"><h3 className="font-bold">Classifica di questa sfida</h3><p className="mt-1 text-sm text-slate-300">Stessa configurazione: prima le vittorie, poi meno azioni di combattimento e più HP residui.</p><ol className="mt-2 space-y-2">{leaderboard.map((result, index) => <li key={result.id} className="rounded bg-slate-900 p-2 text-sm">{index + 1}. {result.outcome === 'vittoria' ? 'Vittoria' : 'Sconfitta'} · {result.turns} azioni · {result.remainingHp} HP · {new Date(result.completedAt).toLocaleString('it-IT')}</li>)}</ol></section>}
    </div>}
    <details open={shareOpen} onToggle={(event) => { const open = event.currentTarget.open; setShareOpen((current) => current === open ? current : open) }} className="rounded-xl border border-slate-500 p-3"><summary className="cursor-pointer font-bold">Condividi o importa una sfida</summary><label className="mt-3 block text-sm">Codice della sfida<textarea aria-label="Codice della sfida" rows={5} value={code} onChange={(event) => setCode(event.target.value)} className={`${fieldClass} mt-1 font-mono text-xs`} /></label><button className={`${buttonClass} mt-2`} type="button" onClick={importCode} disabled={!code.trim()}>Importa configurazione</button></details>
    <section aria-label="Risultati delle sfide"><h3 className="font-bold">Ultimi risultati</h3><p className="mt-1 text-sm text-slate-300">Sono conservati fino a 30 risultati su questo dispositivo. La classifica confronta soltanto la stessa sfida.</p>{results.length ? <ol className="mt-3 space-y-2">{results.map((result) => <li key={result.id} className="rounded-lg bg-slate-900 p-3"><p className="font-semibold">{result.seed} · {result.mode === 'seed' ? 'Seed' : 'Fanta-Team'}</p><p className="mt-1 text-sm text-slate-300">{result.outcome === 'vittoria' ? 'Vittoria' : 'Sconfitta'} · {result.turns} azioni · {result.remainingHp} HP</p><button type="button" className={`${buttonClass} mt-2`} onClick={() => { const ids = result.mode === 'fanta' ? result.team : []; setSeed(result.seed); setMode(result.mode); setSpeciesIds(ids); setPreview(createChallengeSession({ version: 1, seed: result.seed, mode: result.mode, speciesIds: ids })); persist({ version: 1, seed: result.seed, mode: result.mode, speciesIds: ids }) }}>Riprova questo seed</button></li>)}</ol> : <p className="mt-3 text-sm text-slate-300">Concludi una sfida per registrare il primo risultato.</p>}
      {results.length > 0 && <div className="mt-3">{confirmClear ? <div className="flex flex-wrap items-center gap-2"><span className="text-sm">Eliminare i risultati salvati?</span><button type="button" className={`${buttonClass} bg-red-900`} onClick={() => { const written = clearResults(); if (written.ok) setConfirmClear(false); else setError(written.error) }}>Elimina risultati</button><button type="button" className={buttonClass} onClick={() => setConfirmClear(false)}>Annulla</button></div> : <button type="button" className={buttonClass} onClick={() => setConfirmClear(true)}>Svuota risultati</button>}</div>}
    </section>
  </section>
}
