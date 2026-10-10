import { useCallback, useRef, useState } from 'react'
import type { BattleChronicle, BattleLogEvent } from '@/types'
import { appendBattleEvents, normalizeBattleChronicle } from './battleChronicle'

/** Only reveal callbacks append events. Synchronous refs keep settlement atomic within a callback. */
export function useBattleChronicle(saved: BattleChronicle | undefined, battleId: string) {
  const [chronicle, setChronicle] = useState(() => normalizeBattleChronicle(saved, battleId))
  const current = useRef(chronicle)
  const beginAction = useCallback(() => {
    const value = current.current
    const id = `${value.battleId}:${value.nextSequence}`
    current.current = { ...value, nextSequence: value.nextSequence + 1 }
    setChronicle(current.current)
    return id
  }, [])
  const append = useCallback((events: BattleLogEvent[]) => {
    current.current = appendBattleEvents(current.current, events)
    setChronicle(current.current)
  }, [])
  return { chronicle, current, beginAction, append }
}
