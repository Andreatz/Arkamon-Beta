import { useState } from 'react'
import { BattleOpeningOverlay } from './BattleOpeningOverlay'
import { applicaStato, risolviStatoInizioTurno } from '@/engine/battleEngine'
import type { PokemonIstanza } from '@/types'
const pokemon: PokemonIstanza = { istanzaId: 'lab', specieId: 1, nome: 'Arkamon', livello: 5, hp: 100, xp: 0 }
export function BattleRulesLab() {
  const [demo, setDemo] = useState<{ kind: 'coin' | 'die'; value: number; title: string; result: string } | null>(null)
  return <main className="relative h-full bg-slate-950 p-8 text-white"><h1 className="mb-6 text-2xl">Moneta e status</h1><p className="mb-5">Prove isolate: non modificano la partita.</p><div className="flex flex-wrap gap-4">
    <button className="rounded border p-4" onClick={() => { const value = Math.random() < 0.5 ? 0 : 1; setDemo({ kind: 'coin', value, title: 'Stesso livello: decide la moneta', result: value === 0 ? 'Testa · Inizia A' : 'Croce · Inizia B' }) }}>Lancia moneta</button>
    {(['Paralizzato', 'Addormentato'] as const).map(status => <button key={status} className="rounded border p-4" onClick={() => { const result = risolviStatoInizioTurno(applicaStato(pokemon, status), 100); setDemo({ kind: 'die', value: result.tiroStato!, title: status === 'Paralizzato' ? 'Paralisi: esci con 5–6' : 'Sonno: svegliati con 4–6', result: result.messaggi.join(' ') }) }}>{status === 'Paralizzato' ? 'Prova paralisi' : 'Prova sonno'}</button>)}
  </div>{demo && <BattleOpeningOverlay key={`${demo.kind}-${demo.value}`} {...demo} onContinue={() => setDemo(null)} />}</main>
}
