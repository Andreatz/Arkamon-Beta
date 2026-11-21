import type { TipoPokemon } from '@/types'

/** Audit fase 6: battute del Professore nel Laboratorio (solo presentazione). */
export type ProfessorMoment =
  | { kind: 'intro' }
  | { kind: 'hover'; name: string; type: TipoPokemon; taken: boolean }
  | { kind: 'chosen'; player: string; name: string }
  | { kind: 'done' }

const TYPE_HINT: Partial<Record<TipoPokemon, string>> = {
  Normale: 'non ha debolezze di tipo: un compagno affidabile per iniziare.',
  Oscurità: 'colpisce forte i tipi Psico, ma teme le loro mosse.',
  Psico: 'colpisce forte i tipi Oscurità, ma teme le loro mosse.',
}

const PERSONALITY: Record<string, string> = {
  Vyrath: 'Il coraggioso Vyrath',
  Darklaw: 'L’oscuro Darklaw',
  Felyss: 'Il misterioso Felyss',
}

export function professorLine(moment: ProfessorMoment): string {
  switch (moment.kind) {
    case 'intro':
      return 'Scegli con cura il tuo compagno d’avventura! Vyrath, Darklaw o Felyss?'
    case 'hover': {
      if (moment.taken) return `${moment.name} ha già un allenatore. Guarda le altre capsule!`
      const who = PERSONALITY[moment.name] ?? moment.name
      return `${who}, tipo ${moment.type}: ${TYPE_HINT[moment.type] ?? 'un ottimo compagno di viaggio.'}`
    }
    case 'chosen':
      return `Ottima scelta, ${moment.player}! ${moment.name} ti seguirà in tutta Italia.`
    case 'done':
      return 'Perfetto! L’ultima capsula resta al Rivale. Il viaggio comincia!'
  }
}
